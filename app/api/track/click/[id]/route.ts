import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetUrl = req.nextUrl.searchParams.get('url') ?? 'https://eficar.co.kr';

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey) {
    const sb = createClient(sbUrl, sbKey);
    await sb
      .from('campaign_send_logs')
      .update({ click_at: new Date().toISOString(), status: 'clicked' })
      .eq('id', id)
      .is('click_at', null);
  }

  return NextResponse.redirect(targetUrl);
}
