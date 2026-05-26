import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function uploadImage(accessToken: string, personId: string, imageBase64: string, mimeType: string): Promise<string | null> {
  // Step 1: Register upload
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${personId}`,
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    }),
  });

  if (!registerRes.ok) return null;
  const registerData = await registerRes.json();
  const uploadUrl: string = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const asset: string = registerData.value?.asset;
  if (!uploadUrl || !asset) return null;

  // Step 2: Upload binary
  const buffer = Buffer.from(imageBase64, 'base64');
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
    },
    body: buffer,
  });

  if (!uploadRes.ok) return null;
  return asset; // urn:li:digitalmediaAsset:...
}

export async function POST(req: NextRequest) {
  const { accessToken, personId, text, imageBase64, imageMimeType } = await req.json() as {
    accessToken: string;
    personId: string;
    text: string;
    imageBase64?: string;
    imageMimeType?: string;
  };

  if (!accessToken || !personId || !text) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  let assetUrn: string | null = null;
  if (imageBase64 && imageMimeType) {
    assetUrn = await uploadImage(accessToken, personId, imageBase64, imageMimeType);
  }

  const body = assetUrn
    ? {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'IMAGE',
            media: [{
              status: 'READY',
              description: { text: '' },
              media: assetUrn,
              title: { text: '에픽카' },
            }],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }
    : {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };

  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!postRes.ok) {
    const err = await postRes.text();
    return NextResponse.json({ error: `LinkedIn API 오류: ${err.slice(0, 200)}` }, { status: postRes.status });
  }

  return NextResponse.json({ success: true });
}
