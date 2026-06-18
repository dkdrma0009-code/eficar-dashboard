import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const appId     = process.env.EFICAR_IG_APP_ID;
  const appSecret = process.env.EFICAR_IG_APP_SECRET;
  const token     = process.env.EFICAR_IG_ACCESS_TOKEN;

  if (!appId || !appSecret || !token) {
    return NextResponse.json(
      { error: 'EFICAR_IG_APP_ID / EFICAR_IG_APP_SECRET / EFICAR_IG_ACCESS_TOKEN 환경변수를 확인해주세요.' },
      { status: 500 }
    );
  }

  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', token);

  const res = await fetch(url.toString());
  const json = await res.json() as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: { message: string };
  };

  if (!res.ok || json.error) {
    return NextResponse.json({ error: json.error?.message ?? '토큰 갱신 실패' }, { status: 500 });
  }

  // 만료일 계산
  const expiresAt = json.expires_in
    ? new Date(Date.now() + json.expires_in * 1000).toLocaleDateString('ko-KR')
    : '약 60일 후';

  return NextResponse.json({
    newToken: json.access_token,
    expiresAt,
    message: `.env.local의 EFICAR_IG_ACCESS_TOKEN을 아래 토큰으로 교체하세요.`,
  });
}
