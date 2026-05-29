import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return NextResponse.json({ error: 'SMTP 설정이 없습니다.' }, { status: 500 });
  }

  const { pdfBase64, recipient, subject, customer, month } = await req.json() as {
    pdfBase64: string;
    recipient: string;
    subject?: string;
    customer: string;
    month: string;
  };

  if (!pdfBase64 || !recipient) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user, pass },
  });

  const emailSubject = subject || `[에픽카] ${customer} ${month} 영업 제안서`;
  const fileName = `에픽카_${customer}_${month}_제안서.pdf`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC">
<div style="font-family:-apple-system,sans-serif;font-size:14px;line-height:1.8;color:#1A2332;max-width:600px;margin:0 auto;background:white;padding:36px 32px;border-radius:12px">
  <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #005957">
    <span style="font-size:18px;font-weight:800;color:#005957">EFICAR</span>
    <span style="font-size:12px;color:#8B95A1;margin-left:8px">에픽카 마케팅팀</span>
  </div>
  <p style="margin:0 0 12px">${customer} 담당자님, 안녕하세요.</p>
  <p style="margin:0 0 12px">${month} 기준 영업 제안서를 첨부 파일로 보내드립니다.</p>
  <p style="margin:0 0 12px">내용 검토 후 궁금하신 점은 편하게 연락 주세요.</p>
  <hr style="margin:24px 0;border:none;border-top:1px solid #F2F4F6"/>
  <p style="font-size:12px;color:#8B95A1">에픽카 (EFICAR) · eficar@eficar.co.kr · 010-2752-1054</p>
</div>
</body></html>`;

  await transporter.sendMail({
    from: `"에픽카 마케팅팀" <${user}>`,
    to: recipient,
    subject: emailSubject,
    html,
    attachments: [{
      filename: fileName,
      content: Buffer.from(pdfBase64, 'base64'),
      contentType: 'application/pdf',
    }],
  });

  return NextResponse.json({ ok: true });
}
