import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function parseGeminiJSON(text: string): NextResponse {
  // Try direct parse
  try { return NextResponse.json(JSON.parse(text)); } catch {}
  // Strip code fences
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  try { return NextResponse.json(JSON.parse(stripped)); } catch {}
  // Extract between first { and last }
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return NextResponse.json(JSON.parse(stripped.slice(start, end + 1))); } catch {}
  }
  return NextResponse.json({ error: '파싱 실패', raw: text }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY 없음' }, { status: 500 });

  const body = await req.json();
  const { month, salesStats, contentStats, campaignStats } = body;

  const prompt = `당신은 에픽카(자동차 대체부품 B2B 솔루션) 마케팅팀의 시니어 마케터입니다.
에픽카 핵심 고객: 롯데렌탈, SK렌터카, 삼성화재, 그린카
에픽카 주요 제품: 헤드램프, 휠, 에픽커넥트, 에픽렌즈

아래 데이터로 Notion에 기록할 ${month} 월간 마케팅 보고서를 작성하세요.

[데이터]
- 이달 공급 매출: ${salesStats.total} (전월 대비 ${salesStats.growth})
- 콘텐츠 제작: LinkedIn ${contentStats.linkedin}건 / 카카오톡 ${contentStats.kakao}건 / 이메일 ${contentStats.email}건 / 카드뉴스 ${contentStats.cardnews}건 / 합계 ${contentStats.total}건
- 캠페인 발송: ${campaignStats.total}건 발송 → 반응 ${campaignStats.responded}건 / 미팅 ${campaignStats.meeting}건 / 제안 ${campaignStats.proposal}건 / 완료 ${campaignStats.closed}건
- 미팅 이상 전환율: ${campaignStats.conversionRate}%

각 섹션은 2-3문장으로 간결하게 작성하세요. 데이터가 0인 항목은 "활동 없음"으로 솔직하게 기재하고 개선 제안을 한 문장 덧붙이세요.
숫자는 반드시 인용하세요.

응답은 반드시 순수 JSON만 출력하세요. 설명, 마크다운, 코드블록 없이:
{"executiveSummary":"임원 요약 (3-4문장, 이달 전체 마케팅 상황 한눈에)","salesAnalysis":"매출 분석 (수치 인용, 고객사별 추정 언급)","contentActivity":"콘텐츠 활동 (채널별 건수, 주요 내용 추정, 없으면 개선안)","campaignResult":"캠페인 성과 (발송→전환 흐름, 전환율 해석)","issues":"문제점 및 인사이트 (3가지 이상 bullet 형식으로, 각 항목은 \\n으로 구분)","nextPlan":"다음 달 실행 계획 (구체적 액션 3가지 이상, 각 항목은 \\n으로 구분)"}`;

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
  return parseGeminiJSON(text);
}
