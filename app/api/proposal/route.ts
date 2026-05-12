import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function parseGeminiJSON(text: string) {
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const s = stripped.indexOf('{'), e = stripped.lastIndexOf('}');
  if (s !== -1 && e > s) { try { return JSON.parse(stripped.slice(s, e + 1)); } catch {} }
  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY 없음' }, { status: 500 });

  const {
    customer, currentMonth, currentSales, prevSales, growthRate,
    totalSales, monthsActive, topItems, missingItems, campaignHistory,
  } = await req.json();

  const growthStr = prevSales > 0
    ? `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`
    : '전월 없음';
  const savingsEstimate = Math.round(totalSales * 0.18);

  const campaignSection = campaignHistory?.length > 0
    ? `\n[최근 캠페인 히스토리]\n${campaignHistory.slice(0, 5).map((h: { date: string; channel: string; outcome: string; contentSummary: string }) => `- ${h.date} ${h.channel}: "${h.contentSummary}" → ${h.outcome}`).join('\n')}`
    : '';

  const prompt = `당신은 에픽카(자동차 대체부품 B2B 솔루션) 영업팀의 제안서 작성 전문가입니다.
에픽카 주요 제품: 헤드램프, 휠, 에픽커넥트(사고접수 자동화), 에픽렌즈(파손 AI 진단)

[고객사 현황]
- 고객사: ${customer}
- 기준 월: ${currentMonth}
- 이달 공급액: ${Math.round(currentSales / 10000)}만원 (전월 대비 ${growthStr})
- 누적 공급액: ${Math.round(totalSales / 10000)}만원 (${monthsActive}개월)
- 주요 공급 품목: ${topItems.join(', ')}
- 미도입 품목: ${missingItems.length > 0 ? missingItems.join(', ') : '없음'}
- OEM 대비 절감액(추정): 누적 ${Math.round(savingsEstimate / 10000)}만원${campaignSection}

위 데이터를 바탕으로 ${customer}에 보낼 B2B 제안서를 JSON으로 작성하세요.
제안서는 실제 영업 현장에서 바로 사용 가능하도록 구체적이고 설득력 있게 작성하세요.

응답 형식 (순수 JSON만, 마크다운 없이):
{
  "title": "제안서 제목 (고객사명 + 핵심 가치 포함)",
  "greeting": "담당자님께 보내는 인사말 (2-3문장, 기존 거래 성과 언급)",
  "currentAchievement": "현재 성과 요약 (수치 포함, 3-4문장)",
  "proposalItems": [
    {
      "item": "품목명",
      "reason": "이 고객사에 이 품목이 필요한 이유 (1-2문장)",
      "benefit": "도입 시 기대 효과 (수치 포함)",
      "urgency": "높음 | 보통 | 낮음"
    }
  ],
  "roiSummary": "ROI 및 절감 효과 종합 (수치 기반, 3-4문장)",
  "nextStep": "구체적 다음 단계 제안 (미팅 요청, 샘플 제공 등, 2-3문장)",
  "closing": "마무리 인사 (1-2문장)"
}

proposalItems는 미도입 품목이 있으면 그 품목들 위주로, 없으면 현재 품목 확대 또는 에픽커넥트/에픽렌즈 추가 제안으로 작성하세요.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 8192 },
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
