import { supabase } from './supabase';

export interface ScheduledSend {
  id: string;
  scheduled_at: string;
  channel: 'email' | 'sms' | 'lms' | 'mms';
  customer?: string;
  subject?: string;
  content: string;
  recipients: { email?: string; phone?: string; name?: string }[];
  cta_label?: string;
  cta_url?: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  result?: unknown;
  created_at: string;
}

export async function addScheduledSend(
  data: Omit<ScheduledSend, 'id' | 'status' | 'created_at'>
): Promise<ScheduledSend | null> {
  const { data: row, error } = await supabase
    .from('scheduled_sends')
    .insert({ ...data, status: 'pending' })
    .select()
    .single();
  if (error) { console.error('[scheduledSend] insert', error); return null; }
  return row;
}

export async function getScheduledSends(status?: string): Promise<ScheduledSend[]> {
  let q = supabase.from('scheduled_sends').select('*').order('scheduled_at', { ascending: true });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) { console.error('[scheduledSend] select', error); return []; }
  return data ?? [];
}

export async function deleteScheduledSend(id: string): Promise<void> {
  await supabase.from('scheduled_sends').delete().eq('id', id);
}

export async function updateScheduledStatus(
  id: string,
  status: 'sent' | 'failed',
  result?: unknown
): Promise<void> {
  await supabase.from('scheduled_sends').update({
    status,
    sent_at: new Date().toISOString(),
    result: result ?? null,
  }).eq('id', id);
}
