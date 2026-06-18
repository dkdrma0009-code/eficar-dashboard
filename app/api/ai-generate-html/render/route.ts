import { NextRequest, NextResponse } from 'next/server';
import { buildCardHtml, type CardContent } from '@/lib/cardTemplates';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { content, index = 0, total = 1 } = await req.json() as { content: CardContent; index?: number; total?: number };
    const html = buildCardHtml(content, index, total);
    return NextResponse.json({ html });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
