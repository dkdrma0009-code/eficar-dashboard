import { NextRequest, NextResponse } from 'next/server';
import { correctKoreanParticles } from '@/lib/koreanParticles';
import { callGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { type, emailType, customer, month, currentSales, prevGrowth, isOngoing, isB2C, totalSales, savingsStr, topItem, monthsActive, missing, campaignHistory, proposalContext } = await req.json();
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

    email: emailType === 'B'
      ? `[Option B — 행동유도 중심 이메일]
당신은 에픽카의 B2B 마케터입니다. 에픽카를 직접 홍보하는 것이 아니라, 고객의 실무 문제를 먼저 공감하고 해결 방향을 제시하는 방식으로 작성하세요.
독자가 "이 회사가 우리 상황을 알고 있구나"라고 느끼게 해야 합니다.
과도한 세일즈 수식어, "도입 요청", "제안드립니다" 같은 표현은 절대 사용하지 마세요.
제목에는 구체적인 수치나 업계 이슈를 포함(30~50자), 본문은 200~250자(한글 기준) 내외.
구성: 고객의 실무 고민 공감 → 업계 데이터/트렌드로 신뢰 구축 → 에픽카 사례를 자연스럽게 언급 → 단 하나의 행동 유도 문구(부드럽게).
출력 형식: 첫 줄에 "제목: [제목 내용]", 빈 줄 한 줄 후 본문.`
      : `[Option A — 열람률 중심 이메일]
당신은 B2B 영업 전문가입니다. 1:1 담당자 이메일을 쓰듯 자연스럽고 구체적으로 작성하세요.

핵심 원칙:
- 고객사명(${customer})과 주요 품목(${topItem})을 반드시 구체적으로 언급할 것
- 담당자가 실제로 겪을 법한 현장 고민을 첫 문장에서 짚을 것
- 중간 문장(2~3문장)은 반드시 업계 트렌드나 시장 변화로 채울 것 — 에픽카 자랑 절대 금지
- "에픽카는 ~합니다", "에픽카의 솔루션", "에픽카가 공급" 등 에픽카를 주어로 한 자기소개 문장 절대 금지
- 원화 금액(57만원, 1억원 등 구체적 금액) 사용 금지 — 퍼센트(%) 벤치마크는 사용 가능
- 제목과 본문 모두 날짜(월, 일, 숫자 날짜, "기준") 절대 포함 금지
- 제목에 "솔루션", "제안", "공급" 같은 영업 단어 금지 — 질문형 또는 공감형으로 작성
- "전체 고객사에서는", "고객사들은" 같은 복수 표현 금지
- 마지막 문장은 반드시 "궁금하시면 편하게 연락 주세요" 또는 "말씀 주시면 바로 공유드리겠습니다" 형태

분량: 제목 28~50자, 본문 180~230자(한글 기준).
마지막 문장은 반드시 완결된 문장으로 끝낼 것 — 쉼표(,)로 끝나거나 문장이 잘리면 절대 안 됨.
출력 형식: 첫 줄 "제목: [내용]", 빈 줄, 본문.`,

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

  // 이메일 Option A는 금액 수치를 프롬프트에서 제거
  const isEmailA = type === 'email' && emailType !== 'B';
  const dataSection = isEmailA
    ? `[고객사 맥락 — 아래 정보를 활용해 구체적으로 작성할 것]
- 고객사: ${customer}
- 주요 품목: ${topItem}
- OEM 대비 절감 벤치마크: 약 30% (업계 평균 기준 — 이 수치는 사용 가능)
- 업계: 렌터카·자동차 정비
- 에픽카 주력 제품: 헤드램프, 휠, 에픽커넥트, 에픽렌즈
※ 원화 금액(원, 억원 등 구체적 금액)은 절대 사용 금지. 퍼센트(%)는 사용 가능.`
    : `[이 고객사 실제 데이터 — 아래 수치만 문구에 활용]
- 고객사: ${customer}
- 기준 월: ${month}
- 이번 달 공급액: ${currentSales}
- 전월 대비 성장률: ${isOngoing ? '집계 중 (월 진행 중이므로 문구에 절대 언급 금지)' : (prevGrowth ?? '데이터 없음')}
- 누적 공급액: ${totalSales}
- OEM 대비 절감액(추정): ${savingsStr}
- 주요 품목: ${topItem}
- 도입 기간: ${monthsActive}개월
- 미도입 품목: ${missingText}`;

  const prompt = `당신은 에픽카(자동차 대체부품 B2B 솔루션) 영업팀의 마케팅 전문가입니다.${historySection}${proposalSection}

[대상 고객 유형: ${isB2C ? 'B2C 개인 차주 — 친근하고 개인적인 톤, "차주님" 또는 "고객님" 호칭, 절감액·혜택 중심으로 작성' : 'B2B 법인 담당자 — 전문적이고 신뢰감 있는 비즈니스 톤'}]

[에픽카 배경 정보 — 문구에 직접 인용 금지, 맥락 파악용으로만 활용]
- 주요 고객: 롯데렌탈, SK렌터카, 삼성화재, 그린카
- 주력 제품: 헤드램프, 휠, 에픽커넥트, 에픽렌즈
- 회사 전체 지표(304% 성장, 850% 매출, 1만대당 1.6억 등)는 이 고객사 전용 수치가 아니므로 문구에 넣지 말 것

${dataSection}

[작성 지침]
${typeFormats[type] ?? '충분히 길고 상세하게 작성'}

${isEmailA ? '고객사·제품 맥락만 활용해서 작성해줘. 금액·수치는 일절 포함하지 말 것.' : '위 데이터의 실제 수치를 자연스럽게 포함해서 작성해줘.'}

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
