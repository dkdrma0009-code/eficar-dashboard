import { NextRequest, NextResponse } from 'next/server';
import { getPopbill, CORP_NUM, SENDER_NUM } from '@/lib/popbillClient';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { receiver, receiverName, content, subject, imageBase64, imageMimeType } = await req.json() as {
    receiver: string;
    receiverName?: string;
    content: string;
    subject?: string;
    imageBase64?: string;
    imageMimeType?: string;
  };

  if (!receiver || !content) {
    return NextResponse.json({ error: '수신번호와 내용은 필수입니다.' }, { status: 400 });
  }

  const pb = getPopbill();
  const messageService = pb.MessageService();

  // MMS: 이미지 있을 때
  if (imageBase64 && imageMimeType) {
    const ext = imageMimeType.includes('png') ? 'png' : 'jpg';
    const tmpPath = path.join(os.tmpdir(), `popbill_mms_${Date.now()}.${ext}`);

    try {
      fs.writeFileSync(tmpPath, Buffer.from(imageBase64, 'base64'));

      return await new Promise<NextResponse>((resolve) => {
        messageService.sendMMS(
          CORP_NUM,
          SENDER_NUM,
          receiver,
          receiverName ?? '',
          subject ?? '',
          content,
          tmpPath,
          null,   // 예약시간
          false,  // 광고여부
          null,   // 요청번호
          (result: { receiptNum: string }) => {
            resolve(NextResponse.json({ success: true, receiptNum: result.receiptNum, msgType: 'MMS' }));
          },
          (error: { code: number; message: string }) => {
            resolve(NextResponse.json({ error: `[${error.code}] ${error.message}` }, { status: 500 }));
          },
        );
      });
    } finally {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }

  // SMS / LMS: 텍스트만
  const msgType = content.length > 90 ? 'LMS' : 'SMS';

  return new Promise<NextResponse>((resolve) => {
    if (msgType === 'LMS') {
      messageService.sendLMS(
        CORP_NUM,
        SENDER_NUM,
        receiver,
        receiverName ?? '',
        subject ?? '',
        content,
        null,
        false,
        null,
        (result: { receiptNum: string }) => {
          resolve(NextResponse.json({ success: true, receiptNum: result.receiptNum, msgType: 'LMS' }));
        },
        (error: { code: number; message: string }) => {
          resolve(NextResponse.json({ error: `[${error.code}] ${error.message}` }, { status: 500 }));
        },
      );
    } else {
      messageService.sendSMS(
        CORP_NUM,
        SENDER_NUM,
        receiver,
        receiverName ?? '',
        content,
        null,
        false,
        null,
        (result: { receiptNum: string }) => {
          resolve(NextResponse.json({ success: true, receiptNum: result.receiptNum, msgType: 'SMS' }));
        },
        (error: { code: number; message: string }) => {
          resolve(NextResponse.json({ error: `[${error.code}] ${error.message}` }, { status: 500 }));
        },
      );
    }
  });
}
