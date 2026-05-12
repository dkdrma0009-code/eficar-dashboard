import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const NOTION_VERSION = '2022-06-28';

function heading2(text: string) {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}

function paragraph(text: string) {
  // Notion 단일 rich_text 최대 2000자 제한
  const chunks: object[] = [];
  for (let i = 0; i < text.length; i += 1900) {
    chunks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(i, i + 1900) } }] },
    });
  }
  return chunks;
}

function tableRow(cells: string[]) {
  return {
    type: 'table_row',
    table_row: { cells: cells.map(c => [{ type: 'text', text: { content: c } }]) },
  };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

export async function POST(req: NextRequest) {
  const token = process.env.NOTION_TOKEN;
  const parentId = process.env.NOTION_REPORT_PAGE_ID;
  if (!token || !parentId) {
    return NextResponse.json({ error: 'NOTION_TOKEN 또는 NOTION_REPORT_PAGE_ID가 설정되지 않았습니다.' }, { status: 500 });
  }

  const { title, month, kpis, report } = await req.json();

  const blocks: object[] = [
    // 작성일
    ...paragraph(`작성일: ${new Date().toLocaleDateString('ko-KR')}  ·  에픽카 마케팅팀`),
    divider(),

    // 핵심 지표 테이블
    heading2('📊 핵심 지표'),
    {
      object: 'block',
      type: 'table',
      table: {
        table_width: 2,
        has_column_header: true,
        has_row_header: false,
        children: [
          tableRow(['항목', '수치']),
          ...kpis.map((kpi: { label: string; value: string }) => tableRow([kpi.label, kpi.value])),
        ],
      },
    },
    divider(),

    // 섹션별 내용
    heading2('📋 임원 요약'),
    ...paragraph(report.executiveSummary),
    divider(),

    heading2('📈 매출 분석'),
    ...paragraph(report.salesAnalysis),
    divider(),

    heading2('✍️ 콘텐츠 활동'),
    ...paragraph(report.contentActivity),
    divider(),

    heading2('📤 캠페인 성과'),
    ...paragraph(report.campaignResult),
    divider(),

    heading2('🔍 문제점 및 인사이트'),
    ...paragraph(report.issues),
    divider(),

    heading2('🚀 다음 달 실행 계획'),
    ...paragraph(report.nextPlan),
  ];

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { page_id: parentId },
      properties: {
        title: { title: [{ type: 'text', text: { content: title } }] },
      },
      children: blocks,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: `Notion 오류: ${err.message ?? JSON.stringify(err)}` }, { status: res.status });
  }

  const created = await res.json();
  return NextResponse.json({ url: created.url, id: created.id });
}
