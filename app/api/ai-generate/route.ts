import { NextRequest, NextResponse } from 'next/server';
import type { CardItem, CardFormInput, CardLayout } from '@/app/cardnews/types';
import { correctParticlesDeep } from '@/lib/koreanParticles';

export const runtime = 'nodejs';

const EFICAR_CONTEXT = `에픽카(자동차 대체부품 B2B 솔루션) 기본 정보:
- 주요 고객: 롯데렌탈, SK렌터카, 삼성화재, 그린카
- 핵심 수치: 공급량 304% 성장, 매출 850% 성장, 1만대당 연간 1.6억 절감, 그린카 업무 90% 절감
- 주력 제품: 헤드램프, 휠, 에픽커넥트, 에픽렌즈
- 연락처: eficar@eficar.co.kr`;

const LAYOUT_SCHEMA = `
8가지 레이아웃 타입과 데이터 구조:

1. "cover" — 다크 배경, 큰 헤드라인 + 강조 수치
{"layout":"cover","data":{"badge":"에픽카 솔루션","headline":"헤드라인 (2줄 이내)","subheadline":"부제목","highlight":"핵심 수치"}}

2. "big-number" — 숫자가 카드 70% 차지
{"layout":"big-number","data":{"tag":"카테고리","number":"850%","unit":"성장","desc":"맥락 설명 한 줄"}}

3. "before-after" — 2컬럼 비교
{"layout":"before-after","data":{"headline":"변화 선언","headerA":"OEM 부품","headerB":"에픽카","rows":[{"label":"단가","a":"높음","b":"30% 절감"},{"label":"납기","a":"3~5일","b":"당일~익일"}]}}
rows 최대 4개.

4. "list" — 3~4개 포인트 리스트
{"layout":"list","data":{"headline":"헤드라인","items":[{"title":"포인트 제목","desc":"설명 한 줄"}]}}
items 3~4개.

5. "customer-case" — 고객사 실적
{"layout":"customer-case","data":{"headline":"파트너사 실적","cases":[{"name":"SK렌터카","metric":"연간 절감액","number":"1.6억","unit":"차량 1만대 기준"}]}}
cases 최대 4개.

6. "timeline" — 단계별 프로세스
{"layout":"timeline","data":{"headline":"도입 프로세스","steps":[{"title":"단계명","desc":"설명"}]}}
steps 3~4개.

7. "quote" — 큰 인용구
{"layout":"quote","data":{"quote":"인용 문구 (핵심 메시지)","attribution":"출처 또는 고객사","context":"맥락 태그"}}

8. "cta" — 행동 유도 + 연락처
{"layout":"cta","data":{"headline":"지금 바로 시작하세요","subheadline":"에픽카 파트너십 문의","contact1":"eficar@eficar.co.kr","contact2":"010-2752-1054"}}
`;

const SEQUENCE_GUIDE: Record<number, CardLayout[]> = {
  3: ['cover', 'big-number', 'cta'],
  4: ['cover', 'big-number', 'before-after', 'cta'],
  5: ['cover', 'big-number', 'before-after', 'list', 'cta'],
  6: ['cover', 'big-number', 'before-after', 'list', 'customer-case', 'cta'],
  7: ['cover', 'big-number', 'before-after', 'list', 'customer-case', 'timeline', 'cta'],
  8: ['cover', 'big-number', 'before-after', 'list', 'customer-case', 'timeline', 'quote', 'cta'],
};

function getSequence(count: number): CardLayout[] {
  if (count <= 3) return SEQUENCE_GUIDE[3];
  if (SEQUENCE_GUIDE[count]) return SEQUENCE_GUIDE[count];
  if (count > 8) {
    // Fill middle with varied layouts
    const extra = count - 8;
    const mid: CardLayout[] = ['big-number', 'before-after', 'list', 'customer-case', 'timeline', 'quote'];
    const seq = [...SEQUENCE_GUIDE[8]];
    for (let i = 0; i < extra; i++) {
      seq.splice(seq.length - 1, 0, mid[i % mid.length]);
    }
    return seq;
  }
  return SEQUENCE_GUIDE[7];
}

function buildPrompt(input: CardFormInput): string {
  const sequence = getSequence(input.cardCount);
  const metricsStr = [input.metric1, input.metric2, input.metric3]
    .filter(Boolean)
    .map((m, i) => `  강조수치${i + 1}: ${m}`)
    .join('\n');

  return `당신은 에픽카 B2B 카드뉴스 전문가입니다. 아래 입력값을 기반으로 카드뉴스 JSON을 생성하세요.

${EFICAR_CONTEXT}

【입력 정보】
주제/목적: ${input.topic}
${input.targetCustomer ? `대상 고객사: ${input.targetCustomer}` : ''}
${metricsStr}
${input.keyMessage ? `핵심 메시지: ${input.keyMessage}` : ''}
카드 장수: ${input.cardCount}장

【레이아웃 순서 — 반드시 이 순서대로】
${sequence.map((layout, i) => `${i + 1}. ${layout}`).join('\n')}

${LAYOUT_SCHEMA}

【작성 규칙】
- 첫 번째 카드는 반드시 "cover", 마지막은 반드시 "cta"
- 각 카드는 단 하나의 핵심 메시지만 전달
- 실제 수치 사용 필수 (입력된 강조 수치 우선, 없으면 에픽카 기본 데이터 활용)
- "혁신", "최적화", "스마트", "효율화" 같은 광고 카피 금지
- 현업 담당자 언어 사용: "전화 확인이 없어졌습니다", "납기가 빨라졌습니다"
- 텍스트 길이: headline 20자 이내, desc 30자 이내
- cover의 highlight는 숫자+단위 형태 (예: "1.6억", "850%")
- cta의 contact1은 반드시 "eficar@eficar.co.kr"

【텍스트 규칙】
- HTML 태그 절대 금지 (<br>, <b>, <strong> 등)
- 줄바꿈이 필요하면 반드시 \\n 사용
- 헤드라인은 15자 이내 권장, 최대 20자

【출력 형식 — 순수 JSON만, 코드블록 금지】
{"cards":[{"layout":"cover","data":{...}},{"layout":"big-number","data":{...}},...]}`
}

function extractJSON(raw: string): string {
  let s = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

function repairJSON(s: string): string {
  return s
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

const VALID_LAYOUTS: CardLayout[] = [
  'cover', 'big-number', 'before-after', 'list',
  'customer-case', 'timeline', 'quote', 'cta',
];

function validateAndNormalize(data: unknown, expectedSequence: CardLayout[]): CardItem[] | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.cards) || d.cards.length === 0) return null;

  const cards: CardItem[] = [];

  for (let i = 0; i < d.cards.length; i++) {
    const raw = d.cards[i] as Record<string, unknown>;
    if (!raw || typeof raw.layout !== 'string' || typeof raw.data !== 'object') continue;

    const layout = raw.layout as string;
    if (!VALID_LAYOUTS.includes(layout as CardLayout)) continue;

    cards.push({ layout: layout as CardLayout, data: raw.data } as CardItem);
  }

  if (cards.length === 0) return null;

  // Enforce first=cover, last=cta
  if (cards[0].layout !== 'cover') {
    cards.unshift({
      layout: 'cover',
      data: {
        badge: '에픽카 솔루션',
        headline: '렌터카 부품비\n절감의 새로운 기준',
        subheadline: '데이터 기반 대체부품 공급',
        highlight: '1.6억',
      },
    });
  }
  if (cards[cards.length - 1].layout !== 'cta') {
    cards.push({
      layout: 'cta',
      data: {
        headline: '지금 바로 시작하세요',
        subheadline: '에픽카 파트너십 문의',
        contact1: 'eficar@eficar.co.kr',
        contact2: '010-2752-1054',
      },
    });
  }

  // Try to match expected sequence length
  if (cards.length < expectedSequence.length) {
    // Fill missing positions from sequence
    const missing = expectedSequence.length - cards.length;
    for (let i = 0; i < missing; i++) {
      const layout = expectedSequence[1 + i] ?? 'list';
      cards.splice(cards.length - 1, 0, makeFallback(layout));
    }
  }

  return cards.slice(0, Math.max(3, expectedSequence.length));
}

function makeFallback(layout: CardLayout): CardItem {
  switch (layout) {
    case 'cover':
      return {
        layout: 'cover',
        data: { headline: '에픽카 솔루션', subheadline: '대체부품 공급 플랫폼', highlight: '1.6억' },
      };
    case 'big-number':
      return {
        layout: 'big-number',
        data: { tag: '매출 성장률', number: '850%', unit: '', desc: '전년 대비 성장' },
      };
    case 'before-after':
      return {
        layout: 'before-after',
        data: {
          headline: 'OEM vs 에픽카',
          headerA: 'OEM 부품',
          headerB: '에픽카',
          rows: [
            { label: '단가', a: '높음', b: '30% 절감' },
            { label: '납기', a: '3~5일', b: '당일~익일' },
          ],
        },
      };
    case 'list':
      return {
        layout: 'list',
        data: {
          headline: '에픽카 핵심 솔루션',
          items: [
            { title: '에픽커넥트', desc: '사고처리 자동화로 업무 90% 절감' },
            { title: '에픽렌즈', desc: 'AI 기반 부품 판독' },
            { title: '헤드램프·휠', desc: 'OEM 대비 최대 40% 절감' },
          ],
        },
      };
    case 'customer-case':
      return {
        layout: 'customer-case',
        data: {
          headline: '파트너사 실적',
          cases: [
            { name: 'SK렌터카', metric: '연간 절감액', number: '1.6억', unit: '차량 1만대 기준' },
            { name: '그린카', metric: '업무 절감률', number: '90%', unit: '에픽커넥트 도입 후' },
          ],
        },
      };
    case 'timeline':
      return {
        layout: 'timeline',
        data: {
          headline: '도입 프로세스',
          steps: [
            { title: '1단계: 현황 분석', desc: '부품 사용 패턴 분석' },
            { title: '2단계: 파일럿 도입', desc: '2주 내 운영 시작' },
            { title: '3단계: 전면 전환', desc: '원가 절감 확인' },
          ],
        },
      };
    case 'quote':
      return {
        layout: 'quote',
        data: {
          quote: '발주 담당자의 전화 확인이 사라졌습니다',
          attribution: '그린카 운영팀',
          context: '에픽커넥트 도입 후',
        },
      };
    case 'cta':
      return {
        layout: 'cta',
        data: {
          headline: '지금 바로 시작하세요',
          subheadline: '에픽카 파트너십 문의',
          contact1: 'eficar@eficar.co.kr',
          contact2: '010-2752-1054',
        },
      };
  }
}

async function callGemini(prompt: string, apiKey: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${err.slice(0, 300)}`);
  }

  const result = await res.json();
  const candidate = result.candidates?.[0];
  const parts: { text?: string; thought?: boolean }[] = candidate?.content?.parts ?? [];
  const rawText = parts.filter(p => !p.thought).map(p => p.text ?? '').join('');
  const finishReason: string = candidate?.finishReason ?? 'UNKNOWN';
  return { rawText, finishReason };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
      { status: 500 },
    );
  }

  const body = await req.json() as Partial<CardFormInput>;
  const { topic, cardCount = 7, targetCustomer, metric1, metric2, metric3, keyMessage } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 });
  }

  const count = Math.min(12, Math.max(3, Number(cardCount)));
  const input: CardFormInput = {
    topic: topic.trim(),
    targetCustomer,
    metric1,
    metric2,
    metric3,
    keyMessage,
    cardCount: count,
  };
  const expectedSequence = getSequence(count);
  const prompt = buildPrompt(input);

  console.log(`[ai-generate] topic="${topic}" count=${count}`);

  let rawText: string;
  let finishReason: string;
  try {
    ({ rawText, finishReason } = await callGemini(prompt, apiKey));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  console.log(`[ai-generate] finishReason=${finishReason} rawLen=${rawText.length}`);

  const extracted = extractJSON(rawText);
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(extracted);
  } catch {
    try {
      parsed = JSON.parse(repairJSON(extracted));
    } catch {
      console.error('[ai-generate] JSON parse failed. raw:', rawText.slice(0, 400));
    }
  }

  const cards = validateAndNormalize(parsed, expectedSequence);

  if (!cards) {
    // Return fallback deck
    const fallback = expectedSequence.map(makeFallback);
    console.warn('[ai-generate] Using fallback deck');
    return NextResponse.json({ cards: correctParticlesDeep(fallback), _fallback: true });
  }

  console.log(`[ai-generate] OK cards=${cards.length}`);
  return NextResponse.json({ cards: correctParticlesDeep(cards) });
}
