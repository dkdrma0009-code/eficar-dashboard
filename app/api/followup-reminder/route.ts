import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface CampaignItem {
  date: string;
  customer: string;
  contentSummary: string;
  note: string;
  daysSince: number;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY 환경변수가 없습니다.' }, { status: 500 });

  const { campaigns }: { campaigns: CampaignItem[] } = await req.json();
  if (!campaigns?.length) return NextResponse.json({ error: '팔로업 대상이 없습니다.' }, { status: 400 });

  const rows = campaigns.map(c => `
    <tr style="border-bottom:1px solid #F2F4F6;">
      <td style="padding:10px 14px;color:#8B95A1;white-space:nowrap;">${c.date}</td>
      <td style="padding:10px 14px;font-weight:700;color:#191F28;">${c.customer}</td>
      <td style="padding:10px 14px;color:#4A5568;max-width:280px;">${c.contentSummary || '-'}</td>
      <td style="padding:10px 14px;color:#4A5568;">${c.note || '-'}</td>
      <td style="padding:10px 14px;font-weight:700;color:${c.daysSince >= 14 ? '#DC2626' : '#D97706'};">${c.daysSince}일 경과</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:680px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#005957,#007A77);padding:28px 32px;">
      <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:1px;margin:0 0 8px;">EFICAR MARKETING</p>
      <h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 6px;">팔로업 필요 캠페인 알림</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">발송 후 7일 이상 경과, 반응 확인이 필요한 ${campaigns.length}건입니다</p>
    </div>

    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#F8F9FA;">
            <th style="padding:10px 14px;text-align:left;font-weight:700;color:#8B95A1;border-bottom:2px solid #F2F4F6;">발송일</th>
            <th style="padding:10px 14px;text-align:left;font-weight:700;color:#8B95A1;border-bottom:2px solid #F2F4F6;">고객사</th>
            <th style="padding:10px 14px;text-align:left;font-weight:700;color:#8B95A1;border-bottom:2px solid #F2F4F6;">콘텐츠</th>
            <th style="padding:10px 14px;text-align:left;font-weight:700;color:#8B95A1;border-bottom:2px solid #F2F4F6;">메모</th>
            <th style="padding:10px 14px;text-align:left;font-weight:700;color:#8B95A1;border-bottom:2px solid #F2F4F6;">경과</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="padding:20px 32px 28px;background:#F8FFFE;border-top:1px solid #E6F2F2;">
      <p style="font-size:12px;color:#8B95A1;margin:0;">
        에픽카 마케팅 대시보드 자동 발송 · <a href="http://localhost:3000/campaigns" style="color:#005957;font-weight:600;text-decoration:none;">캠페인 페이지에서 확인하기 →</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'eficar@eficar.co.kr',
      subject: `[에픽카] 팔로업 필요 캠페인 ${campaigns.length}건 · ${new Date().toLocaleDateString('ko-KR')}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
