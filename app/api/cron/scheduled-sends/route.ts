import { NextRequest, NextResponse } from 'next/server';
import { getScheduledSends, updateScheduledStatus } from '@/lib/scheduledSendStorage';
import nodemailer from 'nodemailer';
import { getPopbill, CORP_NUM } from '@/lib/popbillClient';

export const runtime = 'nodejs';

// Vercel Cron: 매 5분마다 실행 (vercel.json에서 설정)
export async function GET(req: NextRequest) {
  // 로컬 또는 Vercel Cron 요청만 허용
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const pending = await getScheduledSends('pending');
  const due = pending.filter(s => new Date(s.scheduled_at) <= now);

  if (!due.length) return NextResponse.json({ processed: 0 });

  const results = [];
  for (const job of due) {
    try {
      if (job.channel === 'email') {
        await sendScheduledEmail(job);
      } else {
        await sendScheduledSms(job);
      }
      await updateScheduledStatus(job.id, 'sent', { count: job.recipients.length });
      results.push({ id: job.id, status: 'sent' });
    } catch (e) {
      await updateScheduledStatus(job.id, 'failed', { error: String(e) });
      results.push({ id: job.id, status: 'failed', error: String(e) });
    }
  }

  return NextResponse.json({ processed: due.length, results });
}

async function sendScheduledEmail(job: Awaited<ReturnType<typeof getScheduledSends>>[0]) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP 설정 없음');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user, pass },
  });

  const ctaBlock = job.cta_label && job.cta_url
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td>
        <a href="${job.cta_url}" target="_blank" style="display:block;background:#1A2332;color:#ffffff;text-decoration:none;padding:18px 24px;border-radius:10px;font-size:15px;font-weight:700;">
          ${job.cta_label}<span style="display:block;font-size:12px;font-weight:400;color:#94A3B8;margin-top:3px">클릭하여 이동하기 →</span>
        </a></td></tr></table>`
    : '';

  for (const r of job.recipients) {
    if (!r.email) continue;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC">
<div style="font-family:-apple-system,sans-serif;font-size:14px;line-height:1.8;color:#1A2332;max-width:600px;margin:0 auto;background:white;padding:36px 32px;border-radius:12px">
<div style="margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #005957">
  <span style="font-size:18px;font-weight:800;color:#005957">EFICAR</span>
  <span style="font-size:12px;color:#8B95A1;margin-left:8px">에픽카 마케팅팀</span>
</div>
${job.content.split('\n').map(l => l.trim() ? `<p style="margin:0 0 12px">${l}</p>` : '<div style="height:8px"></div>').join('')}
${ctaBlock}
<hr style="margin:24px 0;border:none;border-top:1px solid #F2F4F6"/>
<p style="font-size:12px;color:#8B95A1">에픽카 (EFICAR) · eficar@eficar.co.kr · 010-2752-1054</p>
</div></body></html>`;

    await transporter.sendMail({
      from: `"에픽카 마케팅팀" <${user}>`,
      to: r.email,
      subject: job.subject ?? '[에픽카] 안내드립니다',
      text: job.content,
      html,
    });
  }
}

async function sendScheduledSms(job: Awaited<ReturnType<typeof getScheduledSends>>[0]) {
  const pb = getPopbill();
  const messageService = pb.MessageService();
  const senderNum = process.env.POPBILL_SENDER_NUM ?? '';

  for (const r of job.recipients) {
    if (!r.phone) continue;
    await new Promise<void>((resolve, reject) => {
      messageService.sendLMS(
        CORP_NUM,
        senderNum,
        r.phone!.replace(/-/g, ''),
        r.name ?? '',
        job.subject ?? '',
        job.content,
        null,
        false,
        null,
        (res: unknown) => { console.log('[cron sms]', res); resolve(); },
        (err: { code: number; message: string }) => reject(new Error(`[${err.code}] ${err.message}`)),
      );
    });
    await new Promise(res => setTimeout(res, 300));
  }
}
