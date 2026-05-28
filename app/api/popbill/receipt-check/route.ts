import { NextRequest, NextResponse } from 'next/server';
import { getPopbill, CORP_NUM } from '@/lib/popbillClient';
import { getSendLogs, updateDeliveryResult } from '@/lib/sendLogStorage';

interface PbItem {
  receiptNum: string;
  result: string;
  resultMessage: string;
  resultDT: string;
}

export const runtime = 'nodejs';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function parseDT(dt: string): string | undefined {
  // 팝빌 날짜형식: "20250101143000" → ISO
  if (!dt || dt.length < 14) return undefined;
  const y = dt.slice(0, 4), mo = dt.slice(4, 6), d = dt.slice(6, 8);
  const h = dt.slice(8, 10), m = dt.slice(10, 12), s = dt.slice(12, 14);
  return new Date(`${y}-${mo}-${d}T${h}:${m}:${s}+09:00`).toISOString();
}

export async function POST(req: NextRequest) {
  const { days = 7 } = await req.json().catch(() => ({})) as { days?: number };

  const eDate = new Date();
  const sDate = new Date();
  sDate.setDate(sDate.getDate() - Math.min(days, 30));

  const pb = getPopbill();
  const messageService = pb.MessageService();

  // 팝빌에서 발송 목록 조회
  const popbillList = await new Promise<PbItem[]>((resolve, reject) => {
    messageService.search(
      CORP_NUM,
      toDateStr(sDate),
      toDateStr(eDate),
      ['SMS', 'LMS', 'MMS'],
      null, null,
      1, 1000, 'D',
      (res: { list?: PbItem[] }) => resolve(res.list ?? []),
      (err: { code: number; message: string }) => reject(new Error(`[${err.code}] ${err.message}`)),
    );
  }).catch((err: Error) => {
    throw new Error(err.message);
  });

  // Supabase에서 receipt_num 있는 로그만 가져오기
  const allLogs = await getSendLogs(undefined, 500);
  const logsWithReceipt = allLogs.filter(l => l.receipt_num);

  // 팝빌 결과 인덱스: receiptNum → 결과
  const popbillMap = new Map(
    popbillList.map(item => [item.receiptNum, item])
  );

  // 매칭 & 업데이트
  let updated = 0;
  const results: Array<{
    receiptNum: string; customer: string; channel: string;
    result: string; resultMessage: string; deliveredAt?: string; already: boolean;
  }> = [];

  for (const log of logsWithReceipt) {
    const pbItem = popbillMap.get(log.receipt_num!);
    if (!pbItem) continue;

    const already = log.popbill_result === pbItem.result;
    if (!already) {
      await updateDeliveryResult(
        log.receipt_num!,
        pbItem.result,
        pbItem.resultMessage,
        pbItem.resultDT ? parseDT(pbItem.resultDT) : undefined,
      );
      updated++;
    }

    results.push({
      receiptNum: log.receipt_num!,
      customer: log.customer,
      channel: log.channel,
      result: pbItem.result,
      resultMessage: pbItem.resultMessage,
      deliveredAt: pbItem.resultDT ? parseDT(pbItem.resultDT) : undefined,
      already,
    });
  }

  return NextResponse.json({
    checked: popbillList.length,
    matched: results.length,
    updated,
    results,
  });
}
