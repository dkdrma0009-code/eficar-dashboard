import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function parseGeminiJSON(text: string): NextResponse {
  try { return NextResponse.json(JSON.parse(text)); } catch {}
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  try { return NextResponse.json(JSON.parse(stripped)); } catch {}
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return NextResponse.json(JSON.parse(stripped.slice(start, end + 1))); } catch {}
  }
  return NextResponse.json({ error: '파싱 실패', raw: text }, { status: 500 });
}

interface CustomerStat {
  name: string;
  sales: number;
  prevSales: number;
  growth: number;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY 없음' }, { status: 500 });

  const { month, customers }: { month: string; customers: CustomerStat[] } = await req.json();
  if (!month || !customers?.length) return NextResponse.json({ error: '데이터 없음' }, { status: 400 });

  const lines = customers
    .map(c => {
      const growthStr = c.prevSales > 0 ? `전월대비 ${c.growth > 0 ? '+' : ''}${c.growth.toFixed(1)}%` : '전월 데이터 없음';
      const salesStr = c.sales > 0 ? `${(c.sales / 10000).toFixed(0)}만원` : '실적 없음';
      return `- ${c.name}: ${salesStr} (${growthStr})`;
    })
    .join('\n');

  const prompt = `당신은 에픽카(자동차 대체부품 B2B 솔루션) 영업 분석가입니다.
에픽카 주요 고객: 롯데렌탈, SK렌터카, 삼성화재, 그린카

${month} 고객사별 실적:
${lines}

위 데이터를 분석해 4가지 인사이트를 한국어로 작성하세요.
각 항목은 고객사명과 수치를 포함해 1문장으로 간결하게 작성하세요.

응답은 반드시 순수 JSON만 출력하세요. 설명, 마크다운, 코드블록 없이 아래 형식 그대로:
{"achievement":"한 문장","warning":"한 문장","opportunity":"한 문장","action":"한 문장"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingBudget: 0 },
        },
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
