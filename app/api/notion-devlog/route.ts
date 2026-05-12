import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function p(text: string) {
  return {
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}
function h1(text: string) {
  return {
    object: 'block', type: 'heading_1',
    heading_1: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}
function h2(text: string) {
  return {
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}
function h3(text: string) {
  return {
    object: 'block', type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}
function bullet(text: string) {
  return {
    object: 'block', type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}
function numbered(text: string) {
  return {
    object: 'block', type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}
function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}
function callout(text: string, emoji = '💡') {
  return {
    object: 'block', type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: text } }],
      icon: { type: 'emoji', emoji },
    },
  };
}
function quote(text: string) {
  return {
    object: 'block', type: 'quote',
    quote: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}

export async function POST() {
  const token = process.env.NOTION_TOKEN;
  const parentId = process.env.NOTION_REPORT_PAGE_ID;
  if (!token || !parentId) return NextResponse.json({ error: 'NOTION 환경변수 없음' }, { status: 500 });

  const blocks = [
    // ───── 1. 오늘 한 일 ─────
    h1('1️⃣ 오늘 한 일'),

    h2('콘텐츠 생성 — 강조 포인트 시각화'),
    bullet('강조 항목(성장률·절감액·확장 등) 선택 시 해당 줄에 노란 배경 + 좌측 주황 테두리 + 굵은 글씨 적용'),
    bullet('줄별 span 렌더링 방식으로 변경 — 이모지(📈💰🔧🆕📊) 기준으로 강조 줄 판별'),
    bullet('강조 항목 변경 시 기존 AI 생성 텍스트 초기화 처리'),

    h2('고객사 상세 페이지 신규 구현 (SK렌터카 / 롯데렌탈)'),
    bullet('app/customers/[name]/page.tsx — SK·롯데 전용 상세 페이지'),
    bullet('SLUG_MATCH로 sk → /sk/i, lotte → /롯데|그린카/i 매칭'),
    bullet('섹션: 헤더 KPI · 월별 바 차트 · 제품 분류 · 목표 관리 · 캠페인 요약 · 캠페인 히스토리 타임라인'),
    bullet('목표 인라인 수정: goalsStorage.setGoal(customerName, amount) 연동'),
    bullet('AppHeader에 SK렌터카 / 롯데렌탈 / AI 제안서 메뉴 추가'),

    h2('?customer= URL 파라미터 자동 선택'),
    bullet('콘텐츠 생성·캠페인 페이지: useSearchParams로 ?customer= 읽어 폼 자동 세팅'),
    bullet('캠페인 페이지: ?customer= 있으면 폼 자동 오픈'),

    h2('캠페인 예약 발송 기능'),
    bullet('CampaignRecord에 scheduledDate?: string 필드 추가'),
    bullet('캠페인 폼에 날짜 피커 추가 (min=오늘)'),
    bullet('오늘 예약된 캠페인 파란 배너로 표시'),

    h2('AI 제안서 생성 페이지 신규 구현 (app/proposal/page.tsx)'),
    bullet('고객사 선택 → Gemini API 호출 → JSON 제안서 생성'),
    bullet('제안서 구조: title / greeting / currentAchievement / proposalItems[] / roiSummary / nextStep / closing'),
    bullet('proposalItems: item·reason·benefit·urgency(높음/보통/낮음)'),
    bullet('수정하기 모드: 모든 필드 textarea/input 인라인 편집, 항목 추가·삭제'),
    bullet('제안서 기반 콘텐츠 생성 버튼: sessionStorage에 제안 컨텍스트 저장 후 /content 페이지로 이동'),

    h2('제안서 ↔ 콘텐츠 생성 연동'),
    bullet('sessionStorage("eficar-proposal-context")에 title·items·nextStep 저장'),
    bullet('콘텐츠 생성 페이지 마운트 시 sessionStorage 읽어 linkedProposal 상태 세팅'),
    bullet('연동됨 녹색 배지 표시 + ✕ 해제 버튼'),
    bullet('AI 생성 요청 시 proposalContext를 API에 전달 → 제안서 내용을 문구에 자연스럽게 반영'),

    h2('thinkingConfig 400 오류 수정'),
    bullet('Gemini 2.5 Flash API가 thinkingConfig 파라미터를 지원하지 않아 400 오류 발생'),
    bullet('app/api/proposal/route.ts · ai-coach · marketing-report · ai-insights 4개 라우트에서 thinkingConfig 전부 제거'),

    h2('MTD(Month-to-Date) 일평균 비교 방식 도입'),
    bullet('진행 중인 달(최신 월)의 KPI를 절대 금액이 아닌 일평균 매출로 전월 대비 비교'),
    bullet('일평균 = 이번 달 현재 매출 ÷ 오늘 날짜 / 전월 일평균 = 전월 매출 ÷ 전월 일수'),
    bullet('lib/dataUtils.ts — getDaysInMonth / getTodayDayForMonth 헬퍼 추가'),
    bullet('MtdInfo 인터페이스 추가: todayDay·daysInMonth·dailyRate·projectedSales·prevDailyRate'),
    bullet('대시보드 파란 안내 배너: "N월 M일 진행 중 — 현재 페이스 예상 월매출 XXX만원"'),
    bullet('KPICards: 진행 중 달 레이블·보조 텍스트 MTD 전용으로 변경'),
    divider(),

    // ───── 2. 어려웠던 점 ─────
    h1('2️⃣ 어려웠던 점 / 막힌 부분'),
    bullet('thinkingConfig 400 오류 — Gemini 2.5 Flash v1 엔드포인트가 이 파라미터를 미지원. 문서에 명시 안 돼 있어 에러 메시지 보고 직접 파악'),
    bullet('[slug] vs [name] 라우트 충돌 — "You cannot use different slug names for the same dynamic path" 에러. [slug] 폴더 삭제 후 [name]으로 통일해 해결'),
    bullet('제안서 result 변수 오류 — 상태 이름을 draft로 바꾼 뒤 result를 참조하던 곳이 남아 있어 런타임 오류. 전수 교체로 해결'),
    bullet('ERR_CONNECTION_REFUSED 반복 — 백그라운드 node 프로세스가 종료되는 상황. npm run dev를 터미널에서 직접 실행하도록 안내'),
    bullet('MTD 비교 기준 설계 — 날짜가 YYYY-MM 단위로만 저장되어 일별 데이터가 없음. 일평균(total ÷ days elapsed) 방식으로 공정 비교 구현'),
    divider(),

    // ───── 3. 내일 할 일 ─────
    h1('3️⃣ 내일 할 일'),
    bullet('고객사 상세 페이지 — SK·롯데 외 타 고객사 확장 여부 결정'),
    bullet('캠페인 예약 발송 — 예약일 당일 알림 또는 자동 발송 연동 검토'),
    bullet('AI 제안서 — PDF 내보내기 또는 이메일 직발송 기능 추가'),
    bullet('콘텐츠 생성 강조 포인트 — 사용자 커스텀 강조 키워드 입력 지원'),
    bullet('Notion 월간 보고서 ↔ AI 제안서 자동 연동'),
  ];

  // 100블록씩 나눠서 전송
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { page_id: parentId },
      icon: { type: 'emoji', emoji: '📝' },
      properties: {
        title: { title: [{ type: 'text', text: { content: '에픽카 대시보드 개발 일지 · 2026년 5월 12일' } }] },
      },
      children: blocks.slice(0, 100),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const page = await res.json();
  const pageId = page.id;

  // 나머지 블록 append
  if (blocks.length > 100) {
    await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ children: blocks.slice(100) }),
    });
  }

  return NextResponse.json({ url: page.url, id: pageId });
}
