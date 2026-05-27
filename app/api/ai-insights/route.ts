import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

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
  const {
    month,
    customers,
    dormantNames = [],
    longDormantNames = [],
    contextNotes = '',
  }: {
    month: string;
    customers: CustomerStat[];
    dormantNames?: string[];
    longDormantNames?: string[];
    contextNotes?: string;
  } = await req.json();

  if (!month || !customers?.length) return NextResponse.json({ error: '데이터 없음' }, { status: 400 });

  // Build customer table — highlight dormant/stopped customers clearly
  const lines = customers
    .map(c => {
      const growthStr = c.prevSales > 0
        ? `전월대비 ${c.growth > 0 ? '+' : ''}${c.growth.toFixed(1)}%`
        : '전월 데이터 없음';
      const salesStr = c.sales > 0
        ? `${(c.sales / 10000).toFixed(0)}만원`
        : '거래 없음';

      const dormantFlag = dormantNames.includes(c.name)
        ? ' 【이번달 거래 완전 중단 — 즉시 대응 필요】'
        : longDormantNames.includes(c.name)
        ? ' 【2개월 이상 장기 미거래 — 재활성화 필요】'
        : '';

      return `- ${c.name}: ${salesStr} (${growthStr})${dormantFlag}`;
    })
    .join('\n');

  // Total sales context
  const totalSales = customers.reduce((s, c) => s + c.sales, 0);
  const totalPrevSales = customers.reduce((s, c) => s + c.prevSales, 0);
  const overallGrowth = totalPrevSales > 0
    ? ((totalSales - totalPrevSales) / totalPrevSales * 100).toFixed(1)
    : '0';

  const prompt = `당신은 에픽카(자동차 대체부품 B2B 솔루션) 영업 분석가입니다.
에픽카 주요 고객: 롯데렌탈, SK렌터카, 삼성화재, 그린카

== ${month} 실적 데이터 ==
전체 매출: ${(totalSales / 10000).toFixed(0)}만원 (전월대비 ${overallGrowth}%)

고객사별 상세:
${lines}
${contextNotes}

== 분석 지침 ==
1. 거래 완전 중단 고객(이번달 0원)은 단순 "감소"가 아닌 "거래 중단" 또는 "이탈 위험"으로 명확히 표현할 것
2. 반드시 ${month} 데이터에서 실제로 관찰된 수치와 고객사 이름을 사용할 것
3. 템플릿 문장("지속적인 노력이 필요합니다" 같은 일반적 표현) 금지 — 실제 데이터 기반 판단만
4. 금액은 "만원" 단위로, 성장률은 숫자로 명시할 것
5. warning 항목은 거래 중단 > 급격한 하락 > 연속 감소 순으로 가장 긴급한 것을 우선 언급
6. opportunity 항목은 성장 중인 고객이 있으면 해당 고객 기반, 없으면 회복 기회를 제시

응답은 반드시 순수 JSON만 출력하세요. 설명·마크다운·코드블록 없이 아래 형식 그대로:
{"achievement":"한 문장 (최고 성과 또는 이달 핵심 성과를 수치와 함께)","warning":"한 문장 (가장 긴급한 위험 — 거래 중단 고객 있으면 반드시 명시)","opportunity":"한 문장 (성장 가능성 또는 재활성화 기회)","action":"한 문장 (이번 주 안에 해야 할 구체적 액션 1가지)"}`;

  let text: string;
  try {
    text = await callGemini(prompt, { temperature: 0.4, maxOutputTokens: 1024 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
  return parseGeminiJSON(text);
}
