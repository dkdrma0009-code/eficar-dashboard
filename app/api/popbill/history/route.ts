import { NextRequest, NextResponse } from 'next/server';
import { getPopbill, CORP_NUM } from '@/lib/popbillClient';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  // YYYYMMDD 형식
  const sDate = searchParams.get('sDate') ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  const eDate = searchParams.get('eDate') ?? new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // Item: SMS, LMS, MMS (빈 문자열이면 전체)
  const item = searchParams.get('item') ?? 'SMS,LMS,MMS';

  const pb = getPopbill();
  const ms = pb.MessageService();

  return new Promise<NextResponse>((resolve) => {
    // search(CorpNum, SDate, EDate, State, Item, ReserveYN, SenderYN, Order, Page, PerPage, success, error)
    // State: 1=대기, 2=처리중, 3=성공, 4=실패, 5=취소 (복수 가능 "1,2,3,4,5")
    (ms as unknown as {
      search(
        c: string, s: string, e: string, state: string, item: string,
        res: null, sen: null, ord: string, page: number, per: number,
        ok: (r: unknown) => void, err: (e: { code: number; message: string }) => void
      ): void
    }).search(
      CORP_NUM, sDate, eDate,
      '1,2,3,4,5',  // 모든 상태
      item,
      null, null, 'D', 1, 100,
      (result) => resolve(NextResponse.json({ success: true, data: result })),
      (err)    => resolve(NextResponse.json({ error: `[${err.code}] ${err.message}` }, { status: 500 })),
    );
  });
}
