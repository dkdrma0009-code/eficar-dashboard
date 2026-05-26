import { NextRequest, NextResponse } from 'next/server';
import { getPopbill, CORP_NUM, SENDER_NUM } from '@/lib/popbillClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { receiver, receiverName, content } = await req.json() as {
    receiver: string;
    receiverName?: string;
    content: string;
  };

  if (!receiver || !content) {
    return NextResponse.json({ error: '수신번호와 내용은 필수입니다.' }, { status: 400 });
  }

  const pb = getPopbill();
  const messageService = pb.MessageService();
  const msgType = content.length > 90 ? 'LMS' : 'SMS';

  return new Promise<NextResponse>((resolve) => {
    messageService.sendOne(
      CORP_NUM,
      msgType,
      SENDER_NUM,
      receiver,
      receiverName ?? '',
      null, // subject (LMS용)
      content,
      null, // 예약시간
      false,
      null,
      (result: { receiptNum: string }) => {
        resolve(NextResponse.json({ success: true, receiptNum: result.receiptNum, msgType }));
      },
      (error: { code: number; message: string }) => {
        resolve(NextResponse.json({ error: `[${error.code}] ${error.message}` }, { status: 500 }));
      },
    );
  });
}
