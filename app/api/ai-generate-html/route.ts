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
        generationConfig: { temperature: 0.6, maxOutputTokens: 4096 },
      }),
    });

    if (res.ok) {
      const data = await res.json() as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('[ai-generate-html] finishReason=MAX_TOKENS — 응답 잘림');
      }
      return text;
    }

    const errText = await res.text();

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
핵심 메시지: ${keyMessage || '없음'}

${CARD_TYPES}

【필수 조건 — 반드시 지킬 것】
- 출력 카드 수: 정확히 ${cardCount}장. 이보다 적거나 많으면 안 됨.
- 순서: ${order}
- 마지막 카드는 반드시 type: "cta"
- cta 타입은 마지막 1장만 사용
- 수치·이름은 에픽카 실제 데이터 기반
- headline/ctaTitle은 \\n으로 줄바꿈 (최대 2줄, 한 줄 최대 8자)
- 텍스트 간결하고 임팩트 있게

【출력 형식】
순수 JSON 배열만. 마크다운 코드블록(\`\`\`) 없음. 설명 텍스트 없음.
반드시 ${cardCount}개 객체를 가진 배열로 출력.

[{"type":"cover","badge":"...","headline":"...\\n...","subtext":"..."},
 {"type":"kpi","kpiTitle":"...","kpiNumber":"...","kpiLabel":"...","kpiDesc":"..."},
 ...총 ${cardCount}개...]`;
}

// 잘린 JSON에서 완성된 객체만 추출
function extractCompleteObjects(jsonStr: string): CardContent[] {
  const objects: CardContent[] = [];
  let depth = 0;
  let objStart = -1;

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          objects.push(JSON.parse(jsonStr.slice(objStart, i + 1)) as CardContent);
        } catch { /* 개별 객체 파싱 실패 → 스킵 */ }
        objStart = -1;
      }
    }
  }

  return objects;
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

    console.log('[ai-generate-html] raw length:', raw.length);
    console.log('[ai-generate-html] raw preview:', raw.slice(0, 300));

    // Strip code fences
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let contents: CardContent[];

    // 1차: 전체 파싱
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        contents = JSON.parse(arrayMatch[0]) as CardContent[];
      } catch {
        // 2차: 객체 단위 추출 (잘린 경우 대비)
        contents = extractCompleteObjects(arrayMatch[0]);
        console.log('[ai-generate-html] fallback parsed:', contents.length, 'cards');
      }
    } else {
      // 배열 괄호 없이 객체만 있는 경우
      contents = extractCompleteObjects(cleaned);
      console.log('[ai-generate-html] no array brackets, extracted:', contents.length, 'cards');
    }

    if (contents.length === 0) {
      throw new Error('파싱된 카드 없음. raw: ' + cleaned.slice(0, 300));
    }

    const cards: GeneratedCard[] = contents.map((c, i) => ({
      type: c.type,
      html: buildCardHtml(c, i, contents.length),
      content: c,
    }));

    console.log('[ai-generate-html] parsed cards:', cards.length, cards.map(c => c.type));

    return NextResponse.json({ cards });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
