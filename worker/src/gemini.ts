import { newId, now } from './http';
import { drawingPrompt } from './prompts';

export type GeminiResult = { ok: true; image: string } | { ok: false; reason: string };

type Usage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  candidatesTokensDetails?: { modality?: string; tokenCount?: number }[];
};

type InlineData = { mimeType?: string; data?: string };

type GeminiResponse = {
  candidates?: { finishReason?: string; content?: { parts?: { inlineData?: InlineData; inline_data?: InlineData }[] } }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: Usage;
};

const RETRY_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAY_MS = 2000;

/** Draws the photo with the notebook's character cards. Every call is logged with its cost. */
export async function drawWithGemini(
  env: Env,
  log: { userId: string; requestId: string },
  photo: string,
  cards: string[],
): Promise<GeminiResult> {
  const parts = [
    ...cards.map((data) => ({ inline_data: { mime_type: 'image/png', data } })),
    { inline_data: { mime_type: 'image/jpeg', data: photo } },
    { text: drawingPrompt(cards.length) },
  ];
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  });

  const started = now();
  let response = await call(env, body);
  if (RETRY_STATUSES.has(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    response = await call(env, body);
  }
  if (!response.ok) {
    console.error('gemini_http', response.status, (await response.text()).slice(0, 400));
    return { ok: false, reason: `http_${response.status}` };
  }

  const result = (await response.json()) as GeminiResponse;
  const image = imageOf(result);
  // Billed even when no image comes back
  await logCall(env, log, result.usageMetadata ?? {}, now() - started, !!image);
  if (image) return { ok: true, image };
  const reason = result.promptFeedback?.blockReason ?? result.candidates?.[0]?.finishReason ?? 'no_image';
  return { ok: false, reason };
}

const call = (env: Env, body: string) =>
  fetch(`${env.GEMINI_API_BASE}/v1beta/models/${env.GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body,
  });

function imageOf(result: GeminiResponse) {
  for (const candidate of result.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const data = (part.inlineData ?? part.inline_data)?.data;
      if (data) return data;
    }
  }
  return null;
}

async function logCall(
  env: Env,
  log: { userId: string; requestId: string },
  usage: Usage,
  durationMs: number,
  ok: boolean,
) {
  const input = usage.promptTokenCount ?? 0;
  const image = (usage.candidatesTokensDetails ?? [])
    .filter((d) => d.modality === 'IMAGE')
    .reduce((sum, d) => sum + (d.tokenCount ?? 0), 0);
  const text = (usage.candidatesTokenCount ?? 0) - image + (usage.thoughtsTokenCount ?? 0);
  // Price is USD per 1M tokens, cost is stored in micro USD: tokens x price
  const cost = Math.round(
    input * Number(env.PRICE_INPUT) + image * Number(env.PRICE_IMAGE) + text * Number(env.PRICE_TEXT),
  );
  await env.DB.prepare(
    `INSERT INTO gemini_calls (id, request_id, user_id, model, input_tokens, image_tokens, text_tokens,
       cost_micros, duration_ms, ok, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(newId(), log.requestId, log.userId, env.GEMINI_MODEL, input, image, text, cost, durationMs, ok ? 1 : 0, now())
    .run();
}
