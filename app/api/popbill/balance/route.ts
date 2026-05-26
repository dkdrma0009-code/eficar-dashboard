import { NextResponse } from 'next/server';
import { getPopbill, CORP_NUM } from '@/lib/popbillClient';

export const runtime = 'nodejs';

export async function GET() {
  const pb = getPopbill();
  const messageService = pb.MessageService();
  const kakaoService = pb.KakaoService();

  const [smsBalance, kakaoBalance] = await Promise.all([
    new Promise<number>((resolve) => {
      messageService.getBalance(
        CORP_NUM,
        (result: number) => resolve(result),
        () => resolve(0),
      );
    }),
    new Promise<number>((resolve) => {
      kakaoService.getBalance(
        CORP_NUM,
        (result: number) => resolve(result),
        () => resolve(0),
      );
    }),
  ]);

  return NextResponse.json({ smsBalance, kakaoBalance });
}
