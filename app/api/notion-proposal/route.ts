import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const NOTION_VERSION = '2022-06-28';

function h2(text: string) {
  return {
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}

function paragraph(text: string) {
  const chunks: object[] = [];
  for (let i = 0; i < text.length; i += 1900) {
    chunks.push({
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(i, i + 1900) } }] },
    });
  }
  return chunks;
}

function bullet(text: string) {
  return {
    object: 'block', type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
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

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

interface ProposalItem {
  item: string;
  reason: string;
  benefit: string;
  urgency: string;
}

interface ProposalData {
  customer: string;
  month: string;
  title: string;
  greeting: string;
  currentAchievement: string;
  proposalItems: ProposalItem[];
  roiSummary: string;
  nextStep: string;
  closing: string;
}

export async function POST(req: NextRequest) {
  const token = process.env.NOTION_TOKEN;
  const parentId = process.env.NOTION_REPORT_PAGE_ID;
  if (!token || !parentId) {
    return NextResponse.json({ error: 'NOTION_TOKEN 또는 NOTION_REPORT_PAGE_ID가 설정되지 않았습니다.' }, { status: 500 });
  }

  const { customer, month, title, greeting, currentAchievement, proposalItems, roiSummary, nextStep, closing } = await req.json() as ProposalData;

  const urgencyEmoji: Record<string, string> = { '높음': '🔴', '보통': '🟡', '낮음': '🟢' };

  const blocks: object[] = [
    ...paragraph(`작성일: ${new Date().toLocaleDateString('ko-KR')}  ·  에픽카 마케팅팀`),
    divider(),

    callout(`${customer} ${month} 영업 제안서`, '📋'),
    divider(),

    h2('👋 인사말'),
    ...paragraph(greeting),
    divider(),

    h2('📊 현재 성과'),
    ...paragraph(currentAchievement),
    divider(),

    h2('🎯 추가 제안 품목'),
    ...(proposalItems ?? []).flatMap(item => [
      bullet(`${urgencyEmoji[item.urgency] ?? '⚪'} [${item.urgency}] ${item.item}`),
      bullet(`  이유: ${item.reason}`),
      bullet(`  기대 효과: ${item.benefit}`),
    ]),
    divider(),

    h2('💰 ROI 분석'),
    ...paragraph(roiSummary),
    divider(),

    h2('🚀 다음 단계'),
    ...paragraph(nextStep),
    divider(),

    h2('✉️ 클로징'),
    ...paragraph(closing),
  ];

  const pageTitle = title || `${customer} ${month} AI 제안서`;

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { page_id: parentId },
      icon: { type: 'emoji', emoji: '📝' },
      properties: {
        title: { title: [{ type: 'text', text: { content: pageTitle } }] },
      },
      children: blocks.slice(0, 100),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: `Notion 오류: ${err.message ?? JSON.stringify(err)}` }, { status: res.status });
  }

  const created = await res.json();
  const pageId = created.id;

  if (blocks.length > 100) {
    await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify({ children: blocks.slice(100) }),
    });
  }

  return NextResponse.json({ url: created.url, id: created.id });
}
