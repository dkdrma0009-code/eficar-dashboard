import { NextRequest, NextResponse } from 'next/server';
import { buildCardHtml, type CardContent, type GeneratedCard } from '@/lib/cardTemplates';

export const runtime = 'nodejs';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

const EFICAR_CONTEXT = `
에픽카는 자동차 대체부품 B2B 솔루션 기업입니다.
- 주요 고객사: SK렌터카, 롯데렌탈, 삼성화재, 그린카
- 주력 제품: 헤드램프, 휠, 에픽커넥트(앱), 에픽렌즈
- 대표 실적: SK렌터카 연간 1.6억 절감 / 그린카 업무 90% 절감 / 롯데렌탈 공급량 304% 성장
- 연락처: eficar@eficar.co.kr / 010-2752-1054
`;

const CARD_TYPES = `
카드 타입별 사용 용도:
- cover: 표지. badge(분류), headline(제목, \\n 줄바꿈), subtext(부제목)
- kpi: 핵심 수치. kpiTitle(제목), kpiNumber(숫자 예:"1.6억"), kpiLabel(레이블), kpiDesc(설명)
- comparison: OEM vs 에픽카 비교표. compTitle(제목), compRows([{item,oem,eficar}] 최대5행)
- customers: 파트너사 성과 2×2그리드. custTitle(제목), customers([{name,metric,value,note}] 최대4개)
- list: 번호 리스트. listTitle(제목), listItems([{num,title,desc}] 최대4개)
- timeline: 단계 프로세스. timeTitle(제목), timeSteps([{title,desc}] 최대4개)
- cta: 마지막 CTA. ctaBadge(상단레이블), ctaTitle(메인카피, \\n 줄바꿈)
`;

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing');

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [2000, 5000, 10000];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 8192 },
      }),
    });

    if (res.ok) {
      const data = await res.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    const errText = await res.text();

    // 503/429 → 재시도
    if ((res.status === 503 || res.status === 429) && attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
      continue;
    }

    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }

  throw new Error('Gemini: 최대 재시도 횟수 초과');
}

function buildPrompt(
  topic: string,
  targetCustomer: string,
  metrics: string[],
  keyMessage: string,
  cardCount: number,
): string {
  const metricsText = metrics.filter(Boolean).join(', ');
  const order = cardCount >= 5
    ? `cover → kpi → (comparison 또는 customers) → list → cta 순서 기반, 총 ${cardCount}장`
    : `cover → kpi → cta, 총 ${cardCount}장`;

  return `당신은 에픽카 마케팅팀의 카드뉴스 기획자입니다.
${EFICAR_CONTEXT}

카드뉴스 주제: ${topic}
타겟 고객사: ${targetCustomer || '렌터카/보험사 업체'}
핵심 수치: ${metricsText || '없음'}
핵심 메시지: ${keyMessage}

${CARD_TYPES}

조건:
- 총 ${cardCount}장, 순서: ${order}
- 각 타입 중복 사용 가능하지만 cta는 마지막 1장만
- 수치·이름은 에픽카 실제 데이터 기반
- headline/ctaTitle은 \\n으로 줄바꿈 (최대 2줄, 한 줄 최대 8자)
- 텍스트 간결하고 임팩트 있게

순수 JSON 배열만 출력. 마크다운 코드블록 없음, 설명 없음.
[{"type":"cover","badge":"...","headline":"...\\n...","subtext":"..."},...]`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      topic?: string;
      targetCustomer?: string;
      metric1?: string;
      metric2?: string;
      metric3?: string;
      keyMessage?: string;
      cardCount?: number;
    };

    const {
      topic = '',
      targetCustomer = '',
      metric1 = '',
      metric2 = '',
      metric3 = '',
      keyMessage = '',
      cardCount = 6,
    } = body;

    const prompt = buildPrompt(topic, targetCustomer, [metric1, metric2, metric3], keyMessage, cardCount);
    const raw = await callGemini(prompt);

    // Strip accidental code fences
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let contents: CardContent[];
    try {
      contents = JSON.parse(cleaned) as CardContent[];
    } catch {
      // Try to extract JSON array — may be truncated, so find last complete object
      const arrayStart = cleaned.indexOf('[');
      if (arrayStart === -1) throw new Error('JSON 배열을 찾을 수 없습니다: ' + cleaned.slice(0, 200));

      let jsonStr = cleaned.slice(arrayStart);
      // Try full parse first
      try {
        contents = JSON.parse(jsonStr) as CardContent[];
      } catch {
        // Truncated — find last complete object by walking back from last '}'
        const lastBrace = jsonStr.lastIndexOf('}');
        if (lastBrace === -1) throw new Error('완성된 JSON 객체를 찾을 수 없습니다');
        jsonStr = jsonStr.slice(0, lastBrace + 1) + ']';
        // Remove trailing comma before ]
        jsonStr = jsonStr.replace(/,\s*\]$/, ']');
        contents = JSON.parse(jsonStr) as CardContent[];
      }
    }

    const cards: GeneratedCard[] = contents.map(c => ({
      type: c.type,
      html: buildCardHtml(c),
      content: c,
    }));

    return NextResponse.json({ cards });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
