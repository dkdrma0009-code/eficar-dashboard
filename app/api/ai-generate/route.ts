import { NextRequest, NextResponse } from 'next/server';
import type { CardFormInput } from '@/app/cardnews/types';

type CardLayout = 'cover' | 'big-number' | 'before-after' | 'list' | 'customer-case' | 'timeline' | 'quote' | 'cta';
type CardItem = { layout: CardLayout; data: Record<string, unknown> };
import { correctParticlesDeep } from '@/lib/koreanParticles';
import { callGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

const EFICAR_CONTEXT = `에픽카(자동차 대체부품 B2B 솔루션):
- 고객사: 롯데렌탈, SK렌터카, 삼성화재, 그린카
- 수치: 공급량 304% 성장 / 매출 850% 성장 / 1만대당 연간 1.6억 절감 / 그린카 업무 90% 절감 / 대체부품 도입률 2배↑
- 제품: 헤드램프, 휠, 에픽커넥트(사고처리 자동화), 에픽렌즈(AI 부품 판독)
- 연락처: eficar@eficar.co.kr / 010-2752-1054`;

const COPY_RULES = `
【카피라이팅 원칙 — 반드시 준수】

✅ 좋은 헤드라인 패턴 (이렇게 써라):
- 숫자 선행: "1.6억 절감, 이제 현실입니다"
- 비교 선언: "3일 걸리던 게 당일이 됐습니다"
- 결과 중심: "발주 전화가 사라졌습니다"
- 의문 유발: "부품비, 얼마나 줄일 수 있을까요?"

❌ 금지 표현 (절대 사용 금지):
- "혁신", "최적화", "스마트", "효율화", "솔루션", "시스템"
- "~합니다" 형태의 설명체 (카드뉴스는 선언체)
- 두리뭉술한 수치: "큰 폭으로", "상당히", "많이"
- 복문 (접속사로 이어진 긴 문장)

【텍스트 길이 제한 — 엄격히 준수】
- headline: 한글 기준 최대 16자 (줄바꿈 포함 2줄 이내)
- subheadline: 최대 20자
- highlight: 숫자+단위만 (예: "1.6억", "850%", "90%")
- desc: 최대 22자
- tag/unit/badge: 최대 8자
- quote: 최대 30자 (실제 현장 언어로)
- list item title: 최대 12자
- list item desc: 최대 20자
- before-after row label: 최대 6자, a/b값: 최대 10자
- timeline step title: 최대 10자, desc: 최대 18자
- customer-case metric: 최대 10자, unit: 최대 10자`;

const LAYOUT_SCHEMA = `
【레이아웃별 데이터 구조】

1. "cover" — 첫인상. 숫자가 있으면 highlight에 넣어라.
{"layout":"cover","data":{"badge":"에픽카","headline":"부품비를\n줄이는 방법","subheadline":"대체부품 공급 플랫폼","highlight":"1.6억"}}

2. "big-number" — 숫자 하나가 전부. number는 임팩트 있는 수치만.
{"layout":"big-number","data":{"tag":"매출 성장","number":"850%","unit":"↑","desc":"전년 대비 실적 기준"}}

3. "before-after" — 구체적 수치로 비교. 애매한 표현 금지.
{"layout":"before-after","data":{"headline":"OEM vs 에픽카","headerA":"OEM","headerB":"에픽카","rows":[{"label":"단가","a":"정가","b":"-30%"},{"label":"납기","a":"3~5일","b":"당일"},{"label":"견적","a":"수동","b":"AI 자동"},{"label":"사고처리","a":"전화 수십 통","b":"앱 하나"}]}}

4. "list" — 각 항목은 독립된 한 문장. 나열이 아닌 임팩트.
{"layout":"list","data":{"headline":"에픽카가 바꾼 것","items":[{"title":"발주 자동화","desc":"전화 확인 업무 소멸"},{"title":"견적 속도","desc":"AI가 3초 안에 판독"},{"title":"원가 절감","desc":"헤드램프 40% 저렴"}]}}

5. "customer-case" — 실명 고객사 + 실제 수치. 추상적 표현 금지.
{"layout":"customer-case","data":{"headline":"파트너사 실적","cases":[{"name":"SK렌터카","metric":"연간 절감액","number":"1.6억","unit":"1만대 기준"},{"name":"그린카","metric":"업무 절감률","number":"90%","unit":"에픽커넥트"},{"name":"롯데렌탈","metric":"공급량 성장","number":"304%","unit":"전년 대비"}]}}

6. "timeline" — 도입 프로세스. 단계는 동사형으로.
{"layout":"timeline","data":{"headline":"2주 안에 시작","steps":[{"title":"현황 분석","desc":"부품 사용 패턴 파악"},{"title":"파일럿 세팅","desc":"2주 내 운영 시작"},{"title":"효과 확인","desc":"절감액 수치 리포트"},{"title":"전면 전환","desc":"전 차량 대상 적용"}]}}

7. "quote" — 실제 현장 목소리. 반드시 구체적 상황 언급.
{"layout":"quote","data":{"quote":"발주 담당자\n전화가 사라졌어요","attribution":"그린카 운영팀","context":"에픽커넥트 도입 3개월 후"}}

8. "cta" — 마지막 행동 유도. headline은 직접적으로.
{"layout":"cta","data":{"headline":"지금 바로\n문의하세요","subheadline":"에픽카 파트너십 상담","contact1":"eficar@eficar.co.kr","contact2":"010-2752-1054"}}
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

  return `당신은 Gamma·Canva 수준의 프로 B2B 카드뉴스 크리에이터입니다.
에픽카 브랜드에 맞는 임팩트 있는 카드뉴스 JSON을 생성하세요.

${EFICAR_CONTEXT}

${COPY_RULES}

【입력 정보】
주제/목적: ${input.topic}
${input.targetCustomer ? `대상 고객사: ${input.targetCustomer}` : ''}
${metricsStr}
${input.keyMessage ? `핵심 메시지: ${input.keyMessage}` : ''}
카드 장수: ${input.cardCount}장

【레이아웃 순서 — 반드시 이 순서대로】
${sequence.map((layout, i) => `${i + 1}. ${layout}`).join('\n')}

${LAYOUT_SCHEMA}

【최종 체크리스트 — 출력 전 검토】
□ 모든 headline이 선언체(~다/~요)인가? 설명체(~합니다/~됩니다) 사용 시 다시 작성
□ 수치가 실제로 포함되어 있는가? 숫자 없는 카드는 수치 추가
□ 각 카드의 메시지가 서로 다른가? 중복 내용 금지
□ HTML 태그 없는가? 줄바꿈은 반드시 \\n
□ 길이 제한 준수했는가?

【출력 형식 — 순수 JSON 배열만, 설명·코드블록 일절 금지】
{"cards":[...]}`
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


export async function POST(req: NextRequest) {
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

  let rawText: string;
  try {
    rawText = await callGemini(prompt, { temperature: 0.7, maxOutputTokens: 8192 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }

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
