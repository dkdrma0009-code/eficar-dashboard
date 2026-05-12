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
    bullet('에픽카 마케팅 대시보드 제작'),
    bullet('카카오톡 공유 SDK 연동 시도 → 클립보드 폴백으로 전환'),
    bullet('목표 관리 페이지 신규 구현'),
    bullet('고객사 CRM 메모 기능 추가'),
    bullet('PDF 보고서 전화번호 수정'),
    bullet('AI 인사이트 패널 신규 구현'),
    bullet('콘텐츠 라이브러리 신규 구현'),
    bullet('콘텐츠 캘린더 신규 구현'),
    bullet('캠페인 성과 트래킹 신규 구현'),
    bullet('콘텐츠 생성 시 캘린더 자동 기록'),
    bullet('월간 마케팅 보고서 전면 재설계 (4줄 요약 → 6섹션 Notion 문서)'),
    bullet('Notion API 연동 → 보고서 자동 저장'),
    bullet('팝빌 카카오톡 발송내역 Excel 가져오기'),
    bullet('캠페인 페이지 그룹 뷰 리디자인'),
    bullet('Excel 날짜 시리얼 자동 변환 / 중복 ID 버그 수정'),
    divider(),

    // ───── 2. 어려웠던 점 ─────
    h1('2️⃣ 어려웠던 점 / 막힌 부분'),
    bullet('카카오 SDK — localhost 도메인 등록 불가 (카카오 정책). 클립보드 복사로 우회'),
    bullet('Gemini 503 오류 — Google 서버 과부하로 AI 기능이 여러 차례 실패. 재시도로 해결'),
    bullet('Gemini JSON 파싱 실패 — 응답이 코드블록으로 감싸지거나 잘려서 파싱 오류 반복. 3단계 추출 로직으로 해결'),
    bullet('팝빌 API 직접 연동 불가 — LinkID/SecretKey 발급 경로를 찾지 못해 Excel 다운로드 방식으로 우회'),
    bullet('Excel 날짜 시리얼 — 팝빌 Excel의 날짜가 숫자(46153.4007)로 저장되어 있어 별도 변환 필요'),
    bullet('캠페인 중복 ID — 한꺼번에 여러 건 등록 시 Date.now()가 동일해 key 충돌 발생'),
    divider(),

    // ───── 3. 내일 할 일 ─────
    h1('3️⃣ 내일 할 일 [없으면 멘토께 요청하기]'),
    bullet('팝빌 API 직접 연동 — 고객지원 통해 LinkID / SecretKey 확보 후 자동 동기화 구현'),
    bullet('캠페인 중복 가져오기 방지 — 같은 날짜 + 템플릿 이미 존재하면 skip 처리'),
    bullet('마케팅 보고서 ↔ 캠페인 수치 자동 연동 — 보고서 생성 시 캠페인 탭 데이터 자동 반영'),
    bullet('목표 관리 → 대시보드 연동 — KPI 카드 아래 목표 달성률 바 추가'),
    bullet('콘텐츠 생성 → 캠페인 자동 등록 — 발송 시 캘린더 + 캠페인 동시 기록'),
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
        title: { title: [{ type: 'text', text: { content: '에픽카 대시보드 개발 일지 · 2026년 5월 11일' } }] },
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
