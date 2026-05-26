import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID가 설정되지 않았습니다.' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/linkedin/callback`;
  const scope = 'openid profile w_member_social';
  const state = Math.random().toString(36).slice(2);

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);

  return NextResponse.redirect(url.toString());
}
