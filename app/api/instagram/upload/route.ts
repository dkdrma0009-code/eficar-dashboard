import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const IG_BASE = 'https://graph.facebook.com/v19.0';

async function igPost(path: string, params: Record<string, string>): Promise<{ id: string }> {
  const url = new URL(`${IG_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'POST' });
  const json = await res.json() as { id?: string; error?: { message: string } };
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `Instagram API 오류: ${res.status}`);
  if (!json.id) throw new Error('Instagram API: id 없음');
  return json as { id: string };
}

async function igGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${IG_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json() as T & { error?: { message: string } };
  if (!res.ok || (json as { error?: { message: string } }).error) {
    throw new Error((json as { error?: { message: string } }).error?.message ?? `Instagram API 오류: ${res.status}`);
  }
  return json;
}

export async function POST(req: NextRequest) {
  const { imageUrls, caption } = await req.json() as { imageUrls: string[]; caption: string };

  const accessToken = process.env.EFICAR_IG_ACCESS_TOKEN;
  const userId = process.env.EFICAR_IG_USER_ID;

  if (!accessToken || !userId) {
    return NextResponse.json({ error: 'EFICAR_IG_ACCESS_TOKEN 또는 EFICAR_IG_USER_ID가 설정되지 않았습니다.' }, { status: 500 });
  }
  if (!imageUrls?.length) {
    return NextResponse.json({ error: 'imageUrls가 필요합니다.' }, { status: 400 });
  }

  try {
    let creationId: string;

    if (imageUrls.length === 1) {
      // 단일 이미지
      const container = await igPost(`/${userId}/media`, {
        image_url: imageUrls[0],
        caption: caption ?? '',
        access_token: accessToken,
      });
      creationId = container.id;
    } else {
      // 캐러셀
      const itemIds: string[] = [];
      for (const url of imageUrls) {
        const item = await igPost(`/${userId}/media`, {
          image_url: url,
          is_carousel_item: 'true',
          access_token: accessToken,
        });
        itemIds.push(item.id);
      }

      const carousel = await igPost(`/${userId}/media`, {
        media_type: 'CAROUSEL',
        children: itemIds.join(','),
        caption: caption ?? '',
        access_token: accessToken,
      });
      creationId = carousel.id;
    }

    // 게시
    const published = await igPost(`/${userId}/media_publish`, {
      creation_id: creationId,
      access_token: accessToken,
    });

    // permalink 조회
    const meta = await igGet<{ permalink: string }>(`/${published.id}`, {
      fields: 'permalink',
      access_token: accessToken,
    });

    return NextResponse.json({ postId: published.id, permalink: meta.permalink });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
