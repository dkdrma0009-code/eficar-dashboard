import { createClient } from '@supabase/supabase-js';

export interface SendLog {
  id: string;
  channel: 'sms' | 'lms' | 'mms' | 'kakao' | 'email';
  customer: string;
  receiver_masked: string;
  content_preview: string;
  receipt_num?: string;
  status: 'sent' | 'opened' | 'clicked';
  sent_at: string;
  open_at?: string;
  click_at?: string;
  popbill_result?: string;   // '0' = 정상수신, 그 외 = 실패 코드
  popbill_msg?: string;      // 팝빌 결과 메시지
  delivered_at?: string;     // 수신 완료 시각 (ISO)
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildTrackingPixelUrl(id: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api/track/open/${id}`;
}

export function buildClickTrackUrl(id: string, targetUrl: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api/track/click/${id}?url=${encodeURIComponent(targetUrl)}`;
}

export async function addSendLog(
  log: Omit<SendLog, 'id' | 'sent_at' | 'status'> & { id?: string }
): Promise<SendLog | null> {
  const sb = getClient();
  if (!sb) return null;

  const record: SendLog = {
    ...log,
    id: log.id ?? generateLogId(),
    sent_at: new Date().toISOString(),
    status: 'sent',
  };
  await sb.from('campaign_send_logs').insert(record);
  return record;
}

export async function getSendLogs(customer?: string, limit = 50): Promise<SendLog[]> {
  const sb = getClient();
  if (!sb) return [];

  let q = sb
    .from('campaign_send_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (customer) q = q.eq('customer', customer);
  const { data } = await q;
  return (data ?? []) as SendLog[];
}

export async function updateDeliveryResult(
  receiptNum: string,
  popbillResult: string,
  popbillMsg: string,
  deliveredAt?: string,
): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb
    .from('campaign_send_logs')
    .update({ popbill_result: popbillResult, popbill_msg: popbillMsg, delivered_at: deliveredAt ?? null })
    .eq('receipt_num', receiptNum);
  return !error;
}

export async function getSendLogStats(customer?: string): Promise<{
  total: number; opens: number; clicks: number;
}> {
  const logs = await getSendLogs(customer, 200);
  return {
    total: logs.length,
    opens: logs.filter(l => l.open_at).length,
    clicks: logs.filter(l => l.click_at).length,
  };
}
