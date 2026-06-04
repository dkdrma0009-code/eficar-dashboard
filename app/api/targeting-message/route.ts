import { NextRequest, NextResponse } from 'next/server';
import { correctParticlesDeep } from '@/lib/koreanParticles';
import { callGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

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

function buildPrompt(input: TargetingInput): string {
  const { customerName, grade, currentSales, prevSales, growthRate, totalSales, transactionCount, products, additionalContext } = input;
  const sign = growthRate >= 0 ? '+' : '';
  const trend = growthRate >= 10 ? '빠르게 성장 중' : growthRate >= 0 ? '안정적으로 유지' : '전월 대비 감소';
  const productLine = products && products.length > 0 ? `주요 구매 품목: ${products.join(', ')}` : '';

  return `당신은 에픽카(자동차 대체부품 B2B 솔루션) 마케팅 담당자입니다.
아래 고객사 데이터를 바탕으로 3가지 채널별 맞춤 메시지를 작성하세요.

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

【작성 규칙】
- 실제 수치를 문구에 자연스럽게 녹일 것
- 광고 카피 금지 ("혁신", "최적화", "스마트" 등)
- 현업 담당자 언어 사용
- grade가 "danger" 또는 "warning"이면: 관계 유지·재활성화 초점
- grade가 "vip"이면: 감사 + 추가 협력 기회 제안
- grade가 "new"이면: 온보딩 지원·첫 성과 공유 초점

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
