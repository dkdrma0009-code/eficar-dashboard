import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { to, subject, text, trackPixelUrl, ctaLabel, ctaUrl } = await req.json() as {
    to: string;
    subject: string;
    text: string;
    trackPixelUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };

  if (!to || !subject || !text) {
    return NextResponse.json({ error: '수신자, 제목, 내용은 필수입니다.' }, { status: 400 });
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return NextResponse.json({ error: '.env.local에 SMTP_USER, SMTP_PASS를 추가해주세요.' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const pixel = trackPixelUrl
    ? `<img src="${trackPixelUrl}" width="1" height="1" style="display:none" alt="" />`
    : '';

  const ctaBlock = ctaLabel && ctaUrl
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0">
        <tr>
          <td>
            <a href="${ctaUrl}" target="_blank"
              style="display:block;background:#1A2332;color:#ffffff;text-decoration:none;
                     padding:20px 28px;border-radius:10px;font-size:15px;font-weight:700;
                     letter-spacing:-0.3px;line-height:1.4">
              ${ctaLabel}
              <span style="display:block;font-size:12px;font-weight:400;color:#94A3B8;margin-top:4px">
                클릭하여 이동하기 →
              </span>
            </a>
          </td>
        </tr>
      </table>`
    : '';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F8FAFC">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;
                  line-height:1.8;color:#1A2332;max-width:600px;margin:0 auto;
                  background:white;padding:36px 32px;border-radius:12px">

        <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #005957">
          <span style="font-size:18px;font-weight:800;color:#005957;letter-spacing:-0.5px">EFICAR</span>
          <span style="font-size:12px;color:#8B95A1;margin-left:8px">에픽카 마케팅팀</span>
        </div>

        <div style="margin-bottom:24px">
          ${text.split('\n').map(l =>
            l.trim()
              ? `<p style="margin:0 0 12px;color:#1A2332">${l}</p>`
              : '<div style="height:8px"></div>'
          ).join('')}
        </div>

        ${ctaBlock}

        <hr style="margin:28px 0;border:none;border-top:1px solid #F2F4F6"/>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#8B95A1;line-height:1.6">
              <strong style="color:#005957">에픽카 (EFICAR)</strong><br/>
              eficar@eficar.co.kr &nbsp;·&nbsp; 010-2752-1054<br/>
              자동차 대체부품 B2B 솔루션
            </td>
            <td align="right">
              <a href="https://eficar.co.kr" target="_blank"
                style="font-size:11px;color:#005957;text-decoration:none;font-weight:600">
                eficar.co.kr →
              </a>
            </td>
          </tr>
        </table>

        ${pixel}
      </div>
    </body>
    </html>`;

  try {
    const info = await transporter.sendMail({
      from: `"에픽카 마케팅팀" <${user}>`,
      to,
      subject,
      text,
      html: htmlBody,
    });
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email/send]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
