import { NextRequest, NextResponse } from 'next/server';
import { correctKoreanParticles } from '@/lib/koreanParticles';
import { callGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { type, customer, month, currentSales, prevGrowth, isOngoing, isB2C, totalSales, savingsStr, topItem, monthsActive, missing, campaignHistory, proposalContext } = await req.json();
  if (!type) return NextResponse.json({ error: '콘텐츠 유형을 입력해주세요.' }, { status: 400 });

  const missingText = missing?.length > 0 ? `미도입 품목: ${missing.join(', ')}` : '없음';

  const proposalSection = proposalContext
    ? `\n[AI 제안서 내용 — 이 제안을 중심으로 문구 작성]\n제안서 제목: ${proposalContext.title}\n제안 품목 요약: ${proposalContext.items}\n다음 단계 제안: ${proposalContext.nextStep}\n→ 위 제안 내용을 자연스럽게 문구에 녹여주세요.\n`
    : '';

  // 그린카는 롯데렌탈 계열(단기), b2c는 개인 고객
  const addressee = isB2C ? '고객님'
    : /sk/i.test(customer) ? 'SK렌터카 담당자님'
    : /롯데렌탈|그린카/i.test(customer) ? '롯데렌탈 담당자님'
    : '담당자님';

  const typeFormats: Record<string, string> = {
    linkedin:
`LinkedIn 포스트 형식:
- 첫 줄: 임팩트 있는 훅 문장
- 본문: 3~5줄, 실적 수치 포함
- 에픽카 솔루션 가치 1~2문장
- 해시태그 4~5개
- 전체 15줄 이상`,

    kakao:
`카카오톡 영업 메시지 형식:
- 인사말로 시작
- 실적 수치를 이모지와 함께 3~5개 항목으로 나열
- 미도입 품목이 있으면 추가 제안 포함
- 마무리 인사
- 전체 10줄 이상, 이모지 적극 활용`,

    email:
`이메일 형식:
- 제목: [고객사명] 월간 성과 보고 및 제안
- 본문: 인사 → 핵심 성과 표 또는 항목 → 다음달 제안 → 마무리
- 담당자 서명 포함 (info@eficar.co.kr / 010-8958-8601)
- 전체 20줄 이상`,

    card:
`성과 카드 문구 형식:
- 제목 1줄
- 핵심 수치 4~6개를 불릿(✓ 또는 ▸)으로 나열
- 한 줄 요약 슬로건
- 전체 10줄 이상`,
  };

  const historySection = campaignHistory?.length > 0
    ? `\n[이 고객사 과거 캠페인 히스토리 — 반복되지 않도록 새로운 각도로 접근]\n${campaignHistory.slice(0, 5).map((h: { date: string; contentSummary: string; outcome: string; channel: string }) => `- ${h.date} ${h.channel}: "${h.contentSummary}" → ${h.outcome}`).join('\n')}\n`
    : '';

  const prompt = `당신은 에픽카(자동차 대체부품 B2B 솔루션) 영업팀의 마케팅 전문가입니다.${historySection}${proposalSection}

[대상 고객 유형: ${isB2C ? 'B2C 개인 차주 — 친근하고 개인적인 톤, "차주님" 또는 "고객님" 호칭, 절감액·혜택 중심으로 작성' : 'B2B 법인 담당자 — 전문적이고 신뢰감 있는 비즈니스 톤'}]

[에픽카 배경 정보 — 문구에 직접 인용 금지, 맥락 파악용으로만 활용]
- 주요 고객: 롯데렌탈, SK렌터카, 삼성화재, 그린카
- 주력 제품: 헤드램프, 휠, 에픽커넥트, 에픽렌즈
- 회사 전체 지표(304% 성장, 850% 매출, 1만대당 1.6억 등)는 이 고객사 전용 수치가 아니므로 문구에 넣지 말 것

[이 고객사 실제 데이터 — 아래 수치만 문구에 활용]
- 고객사: ${customer}
- 기준 월: ${month}
- 이번 달 공급액: ${currentSales}
- 전월 대비 성장률: ${isOngoing ? '집계 중 (월 진행 중이므로 문구에 절대 언급 금지)' : (prevGrowth ?? '데이터 없음')}
- 누적 공급액: ${totalSales}
- OEM 대비 절감액(추정): ${savingsStr}
- 주요 품목: ${topItem}
- 도입 기간: ${monthsActive}개월
- 미도입 품목: ${missingText}

[작성 지침]
${typeFormats[type] ?? '충분히 길고 상세하게 작성'}

위 데이터의 실제 수치를 자연스럽게 포함해서 작성해줘.

[절대 금지 — 아래 규칙을 어기면 안 됨]
- *, **, _글자_ 같은 마크다운 기호 절대 사용 금지. 불릿은 반드시 이모지(✅ 📌 💰 등) 또는 •(가운뎃점)만 사용
- "" 큰따옴표로 단어 강조 금지
- "고객사 실적을 공유" 같은 표현 금지 → 항상 "에픽카 공급 실적" 또는 "에픽카와 함께한 성과"로 표현
- "[고객님 이름]", "[담당자님]", "[회사명]" 같은 플레이스홀더 절대 금지
- 호칭은 반드시 "${addressee}"만 사용. 다른 형태 금지
- "함께하신 지 N개월" 같은 거래 기간 추측 표현 금지 (도입 기간 데이터는 참고용으로만 활용)
- "고객사 여러분" 같은 복수 수신자 표현 금지 → 1:1 영업 메시지처럼 단수로 작성
- 날짜/기간 관련 감성적 표현("벌써", "어느새" 등) 금지

반드시 문구 텍스트만 반환 (제목·설명·마크다운 기호 없이 순수 텍스트).`;

  let text: string;
  try {
    text = await callGemini(prompt, { temperature: 0.8, maxOutputTokens: 4096 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
  return NextResponse.json({ text: correctKoreanParticles(text) });
}
