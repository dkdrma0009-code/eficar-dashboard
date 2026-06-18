import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const IG_BASE = 'https://graph.facebook.com/v19.0';

export interface IgInsights {
  impressions: number;
  reach: number;
  likes: number;
  saved: number;
  comments: number;
}

interface MetricValue { value: number }
interface InsightsData { data: Array<{ name: string; values: MetricValue[] }> }

export async function GET(req: NextRequest) {
  const mediaId = req.nextUrl.searchParams.get('mediaId');
  const accessToken = process.env.EFICAR_IG_ACCESS_TOKEN;

  if (!mediaId) return NextResponse.json({ error: 'mediaId가 필요합니다.' }, { status: 400 });
  if (!accessToken) return NextResponse.json({ error: 'EFICAR_IG_ACCESS_TOKEN이 설정되지 않았습니다.' }, { status: 500 });

  const url = new URL(`${IG_BASE}/${mediaId}/insights`);
  url.searchParams.set('metric', 'impressions,reach,likes,saved,comments_count');
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  const json = await res.json() as InsightsData & { error?: { message: string } };

  if (!res.ok || json.error) {
    return NextResponse.json({ error: json.error?.message ?? '인사이트 조회 실패' }, { status: 500 });
  }

  const get = (name: string) => json.data?.find(d => d.name === name)?.values?.[0]?.value ?? 0;

  const insights: IgInsights = {
    impressions: get('impressions'),
    reach:       get('reach'),
    likes:       get('likes'),
    saved:       get('saved'),
    comments:    get('comments_count'),
  };

  return NextResponse.json(insights);
}
