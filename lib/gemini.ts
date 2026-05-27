const GEMINI_URL = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
}

// 503/429 시 최대 3회 재시도 (1s → 2s → 4s 지수 백오프)
export async function callGemini(
  prompt: string,
  config: GeminiConfig = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 4096,
    },
  });

  const MAX_RETRIES = 3;
  let lastError = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }

    const res = await fetch(GEMINI_URL(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.ok) {
      const json = await res.json();
      const parts: { text?: string; thought?: boolean }[] =
        json.candidates?.[0]?.content?.parts ?? [];
      return parts.filter(p => !p.thought).map(p => p.text ?? '').join('');
    }

    const errText = await res.text();

    // 재시도 가능한 오류 (503 과부하, 429 Rate Limit)
    if (res.status === 503 || res.status === 429) {
      lastError = `HTTP ${res.status}: ${errText}`;
      continue;
    }

    // 그 외 오류는 즉시 throw
    throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
  }

  throw new Error(`Gemini API 재시도 초과 (${MAX_RETRIES}회): ${lastError}`);
}
