import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일에 추가해주세요.\n발급: https://aistudio.google.com/app/apikey' },
      { status: 500 },
    );
  }

  const { topic, cardCount = 6, refContent } = await req.json();
  if (!topic) return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 });

  const count = Math.min(25, Math.max(1, Number(cardCount)));

  function buildGuide(n: number): string {
    if (n === 1) return 'cover';
    if (n === 2) return 'cover → cta';
    if (n === 3) return 'cover → metrics → cta';
    if (n === 4) return 'cover → metrics → features → cta';
    if (n === 5) return 'cover → clients → metrics → features → cta';
    const pool = ['clients','metrics','features','comparison','metrics','features','clients','comparison','metrics','features','comparison','metrics','features','clients','comparison','metrics','features','comparison','metrics','features','clients','comparison','metrics'];
    const middle = pool.slice(0, n - 2);
    return ['cover', ...middle, 'cta'].join(' → ');
  }

  const prompt = `당신은 에픽카(자동차 대체부품 B2B 솔루션)의 마케팅 전문가입니다.
에픽카 기본 정보:
- 주요 고객: 롯데렌탈, SK렌터카, 삼성화재, 그린카
- 핵심 수치: 대체부품 사용 성장률 304%, 전년 대비 매출 850% 성장, 1만대당 연간 1.6억 절감
- 주력 제품: 헤드램프, 휠, 에픽커넥트, 에픽렌즈
카드뉴스는 B2B 영업용입니다. 간결하고 임팩트 있게 작성하세요.
${refContent ? `\n[참고 자료 — 아래 내용을 카드 텍스트에 최대한 반영하세요]\n${refContent}\n[참고 자료 끝]` : ''}
주제: ${topic}
카드뉴스 정확히 ${count}장을 JSON으로 작성해줘.
권장 템플릿 순서: ${buildGuide(count)}

반드시 아래 형식만 반환 (다른 텍스트 없이):
{
  "cards": [
    {
      "template": "cover|clients|metrics|features|comparison|cta",
      "data": {}
    }
  ]
}

템플릿별 data 구조:
cover: { badge, title, subtitle, highlight, company }
clients: { title, titleAccent, clients: [{name, metric, number, unit}] }
  - name: 고객사명, metric: 성과 지표명, number: 강조 숫자(예: "850%"), unit: 기준 설명(짧게)
  - clients 배열은 반드시 3~4개
metrics: { title, titleAccent, metrics: [{tag, number, desc}], footerText }
  - metrics 배열은 반드시 3개
features: { title, features: [{title, desc}] }
  - features 배열은 반드시 3개
comparison: { title, rows: [{label, a, b}], headerA, headerB }
  - rows 배열은 3~4개
cta: { title, subtitle, contact1, contact2 }
  - contact1은 이메일, contact2는 전화번호`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Gemini API 오류: ${err}` }, { status: res.status });
  }

  const result = await res.json();
  const parts: { text?: string; thought?: boolean }[] = result.candidates?.[0]?.content?.parts ?? [];
  const text: string = parts.filter(p => !p.thought).map(p => p.text ?? '').join('');

  // JSON 파싱 — 단계적 추출
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  const jsonStr = start !== -1 && end > start ? stripped.slice(start, end + 1) : stripped;
  try {
    return NextResponse.json(JSON.parse(jsonStr));
  } catch {
    return NextResponse.json({ error: '응답 파싱 실패', raw: text }, { status: 500 });
  }
}
