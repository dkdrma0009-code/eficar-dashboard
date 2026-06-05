import { NextRequest, NextResponse } from 'next/server';
import { correctParticlesDeep } from '@/lib/koreanParticles';
import { callGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

export type MessagePurpose = '신규제안' | '관계강화' | '이탈방지' | '프로모션';
export type MessageTone = '정중한' | '친근한' | '긴급한';

export interface TargetingInput {
  customerName: string;
  grade: string;
  currentSales: number;
  prevSales: number;
  growthRate: number;
  totalSales: number;
  transactionCount: number;
  products?: string[];
  additionalContext?: string;
  purpose?: MessagePurpose;
  tone?: MessageTone;
}

function gradeLabel(grade: string): string {
  const map: Record<string, string> = {
    vip: 'VIP 우량 고객사',
    normal: '일반 거래 고객사',
    warning: '성장 둔화 고객사',
    danger: '이탈 위험 고객사',
    new: '신규 고객사',
  };
  return map[grade] ?? '거래 고객사';
}

function formatWon(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만원`;
  return `${n.toLocaleString()}원`;
}

const PURPOSE_GUIDE: Record<string, string> = {
  '신규제안':  '아직 거래가 적거나 새 제품을 제안할 때. 부담 없이 한 번 써보시라는 톤. 구체적인 절감액/납기 수치로 설득.',
  '관계강화':  '잘 거래 중인 고객사. 이번달 성과를 함께 공유하고 감사 인사. 추가 협력 가능성 자연스럽게 언급.',
  '이탈방지':  '거래량 감소 or 위험 등급. 이탈 원인을 간접적으로 인정하고 해결책 제시. 특별 혜택이나 담당자 직접 방문 제안.',
  '프로모션':  '특정 제품/이벤트 안내. 기간 한정 혜택 강조. 즉각적인 행동 유도 (전화/문자).',
};

const TONE_GUIDE: Record<string, string> = {
  '정중한': '존댓말, 격식체, 담당자명 존칭. "안녕하세요 담당자님" 스타일.',
  '친근한': '편안한 존댓말, 이모지 1~2개 허용. "안녕하세요! 에픽카입니다 😊" 스타일.',
  '긴급한': '짧고 직접적. 기간 강조. "지금 바로", "오늘까지", "마감 임박" 등 사용.',
};

function buildPrompt(input: TargetingInput): string {
  const { customerName, grade, currentSales, prevSales, growthRate, totalSales, transactionCount, products, additionalContext, purpose = '관계강화', tone = '정중한' } = input;
  const sign = growthRate >= 0 ? '+' : '';
  const trend = growthRate >= 10 ? '빠르게 성장 중' : growthRate >= 0 ? '안정적으로 유지' : '전월 대비 감소';
  const productLine = products && products.length > 0 ? `주요 구매 품목: ${products.join(', ')}` : '';

  return `당신은 에픽카(자동차 대체부품 B2B 솔루션) 마케팅 담당자입니다.
아래 고객사 데이터를 바탕으로 채널별 맞춤 메시지를 작성하세요.

【에픽카 기본 정보】
- 주력 제품: 헤드램프, 휠, 에픽커넥트, 에픽렌즈
- 핵심 가치: OEM 대비 최대 40% 원가 절감, 납기 단축, 업무 자동화
- 연락처: eficar@eficar.co.kr / 010-2752-1054

【고객사 데이터】
- 고객사명: ${customerName}
- 고객 등급: ${gradeLabel(grade)}
- 이번달 매출: ${formatWon(currentSales)}
- 전월 매출: ${formatWon(prevSales)}
- 전월 대비 성장률: ${sign}${growthRate.toFixed(1)}%
- 거래 추세: ${trend}
- 누적 거래액: ${formatWon(totalSales)}
- 이번달 거래건수: ${transactionCount}건
${productLine}
${additionalContext ? `추가 맥락: ${additionalContext}` : ''}

【발송 목적: ${purpose}】
${PURPOSE_GUIDE[purpose]}

【톤: ${tone}】
${TONE_GUIDE[tone]}

【작성 규칙】
- 실제 수치를 문구에 자연스럽게 녹일 것
- 광고 카피 금지 ("혁신", "최적화", "스마트" 등)
- 현업 담당자 언어 사용
- 발송 목적과 톤에 맞게 일관되게 작성

【출력 형식 — 순수 JSON만】
{
  "sms": "SMS 문자 (반드시 90자 이내, 공백 포함)",
  "lms": "LMS 장문 문자 (반드시 300자 이내, 공백 포함)",
  "kakao": "카카오톡 메시지 전문 (이모지 포함, 10줄 이상)",
  "email": {
    "subject": "이메일 제목",
    "body": "이메일 본문 전문 (인사→성과→제안→서명 구조)"
  },
  "linkedin": "LinkedIn 포스트 전문 (훅→본문→해시태그, 15줄 이상)"
}

【SMS 형식 — 90자 이내 엄수】
- 첫 줄: [에픽카] 로 시작
- 핵심 수치 1개 + 행동 유도 1줄
- 수신거부: 080-XXX-XXXX 불필요 (팝빌 자동 처리)
- 예시: [에픽카] ${customerName} 담당자님, 이번달 거래 감사합니다. 대체부품 도입으로 연간 1.6억 절감 가능합니다. 문의 010-2752-1054

【LMS 형식 — 300자 이내 엄수】
- 첫 줄: [에픽카] 로 시작
- 인사 1줄 → 이번달 성과 수치 2~3줄 → 제안 1~2줄 → 연락처
- 줄바꿈 활용, 가독성 확보
- 구체적 수치 반드시 포함 (ex: 전월 대비 +15%, 누적 거래 1.2억)

【카카오 메시지 형식】
- 인사말로 시작
- 이번달 성과 수치를 이모지와 함께 나열
- 거래 추세에 맞는 제안 1~2줄
- 마무리 인사 + 연락처

【이메일 형식】
- 제목: [${customerName}] 이번달 거래 현황 및 제안
- 본문: 인사 → 핵심 성과 요약 → 다음 단계 제안 → 마무리
- 서명: 에픽카 마케팅팀 / eficar@eficar.co.kr / 010-2752-1054

【LinkedIn 형식】
- 첫 줄: 임팩트 있는 훅 (수치 포함)
- 본문: 3~5줄, 고객사 성과 or 에픽카 가치 제안
- 해시태그 4~5개 (#에픽카 #대체부품 #렌터카 #원가절감 등)`;
}

function extractJSON(raw: string): string {
  let s = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

export async function POST(req: NextRequest) {
  const input: TargetingInput = await req.json();
  if (!input.customerName) {
    return NextResponse.json({ error: '고객사명이 필요합니다.' }, { status: 400 });
  }

  const prompt = buildPrompt(input);

  let rawText: string;
  try {
    rawText = await callGemini(prompt, { temperature: 0.7, maxOutputTokens: 4096 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }

  let parsed: unknown = null;
  try { parsed = JSON.parse(extractJSON(rawText)); } catch { /* */ }
  if (!parsed) {
    try {
      const repaired = extractJSON(rawText).replace(/,\s*([\]}])/g, '$1');
      parsed = JSON.parse(repaired);
    } catch { /* */ }
  }

  if (!parsed || typeof parsed !== 'object') {
    return NextResponse.json({ error: 'AI 응답 파싱 실패. 다시 시도해주세요.', raw: rawText.slice(0, 300) }, { status: 500 });
  }

  return NextResponse.json(correctParticlesDeep(parsed));
}
