import { NextRequest, NextResponse } from 'next/server';
import { getPopbill, CORP_NUM, SENDER_NUM } from '@/lib/popbillClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { receiver, receiverName, content, altContent } = await req.json() as {
    receiver: string;
    receiverName?: string;
    content: string;
    altContent?: string; // 친구톡 실패 시 문자 대체발송 내용
  };

  if (!receiver || !content) {
    return NextResponse.json({ error: '수신번호와 내용은 필수입니다.' }, { status: 400 });
  }

  const plusFriendID = process.env.POPBILL_PLUSFRIEND_ID;
  if (!plusFriendID) {
    return NextResponse.json({ error: 'POPBILL_PLUSFRIEND_ID가 설정되지 않았습니다.' }, { status: 500 });
  }

  const pb = getPopbill();
  const kakaoService = pb.KakaoService();

  return new Promise<NextResponse>((resolve) => {
    kakaoService.sendFTS_one(
      CORP_NUM,
      plusFriendID,
      SENDER_NUM,
      receiver,
      receiverName ?? '',
      content,
      altContent ?? content, // 대체 문자 (친구톡 실패 시)
      'C',                    // 대체 발송 유형: C=SMS, A=알림톡
      null,                   // 예약시간
      false,                  // 광고 여부
      null,                   // 요청번호
      (result: { receiptNum: string }) => {
        resolve(NextResponse.json({ success: true, receiptNum: result.receiptNum }));
      },
      (error: { code: number; message: string }) => {
        resolve(NextResponse.json({ error: `[${error.code}] ${error.message}` }, { status: 500 }));
      },
    );
  });
}

// 등록된 채널 목록 조회
export async function GET() {
  const pb = getPopbill();
  const kakaoService = pb.KakaoService();

  return new Promise<NextResponse>((resolve) => {
    kakaoService.listPlusFriendID(
      CORP_NUM,
      (result: unknown[]) => {
        resolve(NextResponse.json({ channels: result }));
      },
      (error: { code: number; message: string }) => {
        resolve(NextResponse.json({ error: `[${error.code}] ${error.message}` }, { status: 500 }));
      },
    );
  });
}
