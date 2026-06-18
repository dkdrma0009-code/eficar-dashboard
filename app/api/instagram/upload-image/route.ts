import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { base64, filename } = await req.json() as { base64: string; filename: string };

  if (!base64 || !filename) {
    return NextResponse.json({ error: 'base64와 filename이 필요합니다.' }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다.' }, { status: 500 });
  }

  const dataUrl = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  const base64Data = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');
  const mimeType = dataUrl.match(/data:([^;]+);/)?.[1] ?? 'image/png';

  const blob = await put(`ig-tmp/${filename}`, buffer, {
    access: 'public',
    contentType: mimeType,
    token,
  });

  return NextResponse.json({ url: blob.url });
}
