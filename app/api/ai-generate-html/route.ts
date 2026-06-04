import { NextRequest, NextResponse } from 'next/server';
import type { CardFormInput } from '@/app/cardnews/types';
import { callGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

const EFICAR_CONTEXT = `에픽카(자동차 대체부품 B2B 솔루션):
- 고객사: 롯데렌탈, SK렌터카, 삼성화재, 그린카
- 핵심 수치: 공급량 304% 성장 / 매출 850% 성장 / 1만대당 연간 1.6억 절감 / 그린카 업무 90% 절감
- 제품: 헤드램프, 휠, 에픽커넥트(사고처리 자동화), 에픽렌즈(AI 부품 판독)
- 연락처: eficar@eficar.co.kr / 010-2752-1054`;

const DESIGN_SYSTEM = `
【에픽카 카드뉴스 디자인 시스템】

카드 크기: 540 × 540px (정방형)
폰트: 'Pretendard', -apple-system, sans-serif

색상:
- 메인 틸: #005957
- 밝은 그린(수치 강조): #1CC76E
- 흰배경: #FFFFFF
- KPI 타일 배경: #E8F5F2
- 섹션 배경(초록): #1DBF6E (풀 배경용)
- 본문 텍스트: #191F28
- 보조 텍스트: #6B7280
- 연한 보더: rgba(0,89,87,0.12)

【PDF 기반 디자인 패턴 — 이걸 따라라】

1. 커버 카드:
   - 좌측 60%: 흰 배경, 에픽카 로고, 뱃지 칩, 헤드라인(볼드), 부제목
   - 우측 40%: #005957 배경, 핵심 수치(흰색 초대형), "핵심 성과" 라벨
   - 상단 4px 틸 바

2. 수치 카드 (KPI):
   - 흰 배경
   - 상단: 볼드 헤드라인 (검정+틸 투톤)
   - 중앙: #E8F5F2 라운드 타일, [태그] 브래킷 라벨(틸), 초대형 수치(#005957), 설명 텍스트

3. 고객사 실적 카드:
   - 흰 배경
   - 투톤 헤드라인
   - 2×2 카드 그리드: 회사명, 지표명, 굵은 틸 수치

4. 비교표 카드:
   - 흰 배경
   - 헤드라인
   - 깔끔한 비교 테이블: 왼쪽 회색(기존), 오른쪽 틸(에픽카)
   - 에픽카 컬럼 강조

5. 리스트 카드:
   - 흰 배경
   - 투톤 헤드라인
   - 번호(틸) + 제목 + 설명, 좌측 틸 보더

6. 프로세스/타임라인 카드:
   - 흰 또는 연한 배경
   - 단계별 원형 번호(틸) + 연결선 + 내용

7. 인용 카드:
   - #005957 풀 배경
   - 흰 큰 따옴표, 흰 인용문, 출처

8. CTA 카드:
   - #005957 풀 배경 또는 흰 배경
   - 큰 헤드라인, 연락처 박스(틸 테두리)

【HTML 작성 규칙】
- 모든 스타일 인라인 (style="" 속성으로만)
- 외부 이미지 금지
- 로고: <span style="font-weight:900;color:#005957">∞에픽카</span>
- 루트: <div style="width:540px;height:540px;overflow:hidden;box-sizing:border-box;...">
- font-family: 'Pretendard', -apple-system, sans-serif 항상 명시
- position:relative/absolute로 레이아웃
- HTML 태그 안에 \n 개행 금지 (\\n을 실제 개행으로 쓰지 말 것)
`;

const COPY_RULES = `
【카피라이팅 원칙】
- 헤드라인 15자 이내
- 수치 없는 카드 금지 — 반드시 구체적 숫자 포함
- 선언체: "절감했습니다" 아닌 "1.6억 절감"
- "혁신", "최적화", "스마트" 금지
`;

function buildPrompt(input: CardFormInput, cardCount: number): string {
  const metricsStr = [input.metric1, input.metric2, input.metric3]
    .filter(Boolean).join(', ');

  return `당신은 에픽카 브랜드 카드뉴스 디자이너입니다.
아래 정보를 바탕으로 ${cardCount}장의 카드뉴스를 HTML로 직접 디자인하세요.

${EFICAR_CONTEXT}

${DESIGN_SYSTEM}

${COPY_RULES}

【입력 정보】
주제: ${input.topic}
${input.targetCustomer ? `대상 고객사: ${input.targetCustomer}` : ''}
${metricsStr ? `강조 수치: ${metricsStr}` : ''}
${input.keyMessage ? `핵심 메시지: ${input.keyMessage}` : ''}
카드 수: ${cardCount}장

【카드 구성 — 이 순서로】
1번: 커버 (임팩트 있는 헤드라인 + 핵심 수치)
2번: 핵심 KPI 수치 카드 (가장 임팩트 있는 숫자 1개)
3번: 문제 제기 또는 비교 (Before/After)
4번: 솔루션 또는 고객사 실적
${cardCount >= 5 ? '5번: 추가 증거 또는 프로세스' : ''}
${cardCount >= 6 ? '6번: 추가 내용' : ''}
마지막: CTA (연락처 포함)

【출력 형식 — 순수 JSON만, 코드블록 금지】
각 카드는 완전한 540×540 HTML입니다.

{"cards":[
  {
    "type": "cover",
    "title": "카드 제목 (미리보기용)",
    "html": "<div style=\\"width:540px;height:540px;...\\">...</div>"
  },
  ...
]}

HTML 안의 큰따옴표는 반드시 \\\\"로 이스케이프하세요.
각 카드는 디자인 시스템의 해당 패턴을 정확히 따르세요.
내용은 실제 에픽카 수치를 사용하고, 투톤 헤드라인, 틸 강조 등을 적용하세요.`;
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

export interface HtmlCard {
  type: string;
  title: string;
  html: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<CardFormInput & { cardCount: number }>;
  const { topic, cardCount = 6, targetCustomer, metric1, metric2, metric3, keyMessage } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 });
  }

  const count = Math.min(10, Math.max(3, Number(cardCount)));
  const input: CardFormInput = {
    topic: topic.trim(),
    targetCustomer,
    metric1, metric2, metric3,
    keyMessage,
    cardCount: count,
  };

  const prompt = buildPrompt(input, count);

  let rawText: string;
  try {
    rawText = await callGemini(prompt, { temperature: 0.8, maxOutputTokens: 16384 });
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
      console.error('[ai-generate-html] JSON parse failed:', rawText.slice(0, 400));
      return NextResponse.json({ error: 'HTML 생성 파싱 실패' }, { status: 500 });
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return NextResponse.json({ error: '생성 실패' }, { status: 500 });
  }

  const data = parsed as Record<string, unknown>;
  const cards = Array.isArray(data.cards) ? data.cards as HtmlCard[] : [];

  if (!cards.length) {
    return NextResponse.json({ error: '카드 생성 실패' }, { status: 500 });
  }

  console.log(`[ai-generate-html] OK cards=${cards.length}`);
  return NextResponse.json({ cards, mode: 'html' });
}
