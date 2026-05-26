import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code) {
    return new NextResponse(`
      <script>
        window.opener?.postMessage({ type: 'LINKEDIN_AUTH_ERROR', error: '${error ?? 'no_code'}' }, '*');
        window.close();
      </script>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/linkedin/callback`;

  // Exchange code for token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    return new NextResponse(`
      <script>
        window.opener?.postMessage({ type: 'LINKEDIN_AUTH_ERROR', error: 'token_exchange_failed' }, '*');
        window.close();
      </script>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;

  // Get person ID via OpenID Connect userinfo
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const profile = profileRes.ok ? await profileRes.json() : null;
  const personId: string = profile?.sub ?? '';
  const name: string = profile?.name ?? '사용자';

  return new NextResponse(`
    <script>
      window.opener?.postMessage({
        type: 'LINKEDIN_AUTH_SUCCESS',
        accessToken: '${accessToken}',
        personId: '${personId}',
        name: '${name}'
      }, '*');
      window.close();
    </script>
  `, { headers: { 'Content-Type': 'text/html' } });
}
