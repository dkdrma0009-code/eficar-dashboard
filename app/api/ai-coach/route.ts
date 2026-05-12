import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function parseGeminiJSON(text: string) {
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(stripped.slice(start, end + 1)); } catch {}
  }
  return null;
}

interface CustomerStat {
  name: string;
  currentSales: number;
  prevSales: number;
  growth: number;
  totalSales: number;
  monthsActive: number;
  goalAmount: number;
}

interface CampaignStat {
  customer: string;
  channel: string;
  outcome: string;
  date: string;
  contentSummary: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY 없음' }, { status: 500 });

  const { month, customers, campaigns }: {
    month: string;
    customers: CustomerStat[];
    campaigns: CampaignStat[];
  } = await req.json();

  if (!customers?.length) return NextResponse.json({ error: '데이터 없음' }, { status: 400 });

  // 고객사별 캠페인 요약
  const campaignSummary = customers.map(c => {
    const cc = campaigns.filter(x => x.customer === c.name);
    const outcomes = cc.reduce((m: Record<string, number>, x) => { m[x.outcome] = (m[x.outcome] ?? 0) + 1; return m; }, {});
    const channels = cc.reduce((m: Record<string, number>, x) => { m[x.channel] = (m[x.channel] ?? 0) + 1; return m; }, {});
    const bestChannel = Object.entries(channels).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '없음';
    const lastCampaign = cc.sort((a, b) => b.date.localeCompare(a.date))[0];
    const daysSinceLast = lastCampaign
      ? Math.floor((Date.now() - new Date(lastCampaign.date).getTime()) / 86400000)
      : 999;
    return `${c.name}: 캠페인 ${cc.length}건, 주요채널 ${bestChannel}, 미팅전환 ${outcomes['meeting'] ?? 0}건, 마지막발송 ${daysSinceLast}일전`;
  }).join('\n');

  const salesSummary = customers.map(c => {
    const growthStr = c.prevSales > 0 ? `${c.growth > 0 ? '+' : ''}${c.growth.toFixed(0)}%` : '전월없음';
    const goalStr = c.goalAmount > 0
      ? `목표달성률 ${Math.round((c.currentSales / c.goalAmount) * 100)}%`
      : '목표없음';
    return `${c.name}: ${Math.round(c.currentSales / 10000)}만원 (${growthStr}) ${goalStr}`;
  }).join('\n');

  // 요일별 캠페인 성공률 분석
  const daySuccessMap: Record<string, { total: number; converted: number }> = {};
  campaigns.forEach(c => {
    if (!c.date) return;
    const day = ['일', '월', '화', '수', '목', '금', '토'][new Date(c.date).getDay()];
    if (!daySuccessMap[day]) daySuccessMap[day] = { total: 0, converted: 0 };
    daySuccessMap[day].total++;
    if (['meeting', 'proposal', 'closed', 'responded'].includes(c.outcome)) daySuccessMap[day].converted++;
  });
  const bestDay = Object.entries(daySuccessMap)
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => (b[1].converted / b[1].total) - (a[1].converted / a[1].total))[0]?.[0] ?? '화';

  const prompt = `당신은 에픽카(자동차 대체부품 B2B) 영업 전략 AI 코치입니다.
에픽카 주요 고객사: 롯데렌탈, SK렌터카, 삼성화재, 그린카

[${month} 매출 현황]
${salesSummary}

[캠페인 히스토리]
${campaignSummary}

[데이터 기반 최적 발송 요일: ${bestDay}요일 (과거 캠페인 전환율 최고)]

위 데이터를 분석하여 영업 액션 플랜을 JSON으로 반환하세요.

응답 형식 (순수 JSON만, 마크다운 없이):
{
  "customers": [
    {
      "name": "고객사명",
      "riskScore": 1~10 숫자 (10이 가장 위험),
      "priority": "즉시행동" | "이번주" | "이번달" | "유지",
      "reason": "위험/기회 이유 1문장",
      "recommendedChannel": "kakao" | "linkedin" | "email",
      "channelReason": "채널 추천 이유 한 줄",
      "messageTip": "이 고객에게 효과적인 메시지 접근법 1~2문장",
      "bestDay": "${bestDay}"
    }
  ],
  "weeklyPlan": [
    { "day": "월", "action": "구체적 할 일" },
    { "day": "화", "action": "구체적 할 일" },
    { "day": "수", "action": "구체적 할 일" },
    { "day": "목", "action": "구체적 할 일" },
    { "day": "금", "action": "구체적 할 일" }
  ],
  "topPriority": "이번 주 가장 중요한 고객사명",
  "summary": "전체 영업 상황 2~3문장 요약"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Gemini 오류: ${err}` }, { status: res.status });
  }

  const result = await res.json();
  const parts: { text?: string; thought?: boolean }[] = result.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter(p => !p.thought).map(p => p.text ?? '').join('');
  const parsed = parseGeminiJSON(text);
  if (!parsed) return NextResponse.json({ error: '파싱 실패', raw: text }, { status: 500 });
  return NextResponse.json(parsed);
}
