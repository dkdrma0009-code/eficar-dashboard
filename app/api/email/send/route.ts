import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { to, subject, text, trackPixelUrl } = await req.json() as {
    to: string;
    subject: string;
    text: string;
    trackPixelUrl?: string;
  };

  if (!to || !subject || !text) {
    return NextResponse.json({ error: '수신자, 제목, 내용은 필수입니다.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const pixel = trackPixelUrl
    ? `<img src="${trackPixelUrl}" width="1" height="1" style="display:none" alt="" />`
    : '';

  const htmlBody = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.8;color:#1A2332;max-width:600px;margin:0 auto">
      ${text.split('\n').map(l => l.trim() ? `<p style="margin:0 0 10px">${l}</p>` : '<br/>').join('')}
      ${pixel}
      <hr style="margin:32px 0;border:none;border-top:1px solid #E2E8F0"/>
      <p style="font-size:12px;color:#8B95A1">에픽카 마케팅팀 · eficar@eficar.co.kr · 010-2752-1054</p>
    </div>`;

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: '에픽카 마케팅팀 <onboarding@resend.dev>',
    to,
    subject,
    text,
    html: htmlBody,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: data?.id });
}
