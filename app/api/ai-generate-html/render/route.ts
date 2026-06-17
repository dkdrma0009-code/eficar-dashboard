import { NextRequest, NextResponse } from 'next/server';
import { buildCardHtml, type CardContent } from '@/lib/cardTemplates';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json() as { content: CardContent };
    const html = buildCardHtml(content);
    return NextResponse.json({ html });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
