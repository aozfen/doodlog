import { balanceOf, charge, compensate, refund, type Bucket } from './brushes';
import { drawWithGemini } from './gemini';
import { json, now } from './http';

// POST /v1/draw { requestId, photo, cards }
// photo: base64 JPEG (the app resizes it to 1536 px). cards: base64 PNG character cards
// of the notebook, at most 4. Neither the photo nor the drawing is stored.
//
// The request id makes retries safe: a request is charged once. If the app lost the
// answer of a finished drawing, it may ask once more for free.

const MAX_CARDS = 4;
const MAX_PHOTO_CHARS = 4_000_000; // ~3 MB
const MAX_CARD_CHARS = 2_000_000; // ~1.5 MB
const FREE_REPEATS = 1;
/** A pending request older than this lost its Worker (app closed mid-drawing): it may run again, unpaid. */
const STALE_PENDING_MS = 3 * 60 * 1000;
const REQUEST_ID = /^[\w-]{8,64}$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

type DrawInput = { requestId: string; photo: string; cards: string[] };

type DrawRow = {
  user_id: string;
  status: 'pending' | 'done' | 'failed';
  attempts: number;
  bucket: Bucket | null;
  updated_at: number;
};

export async function handleDraw(env: Env, userId: string, body: ArrayBuffer) {
  const { success } = await env.DRAW_LIMITER.limit({ key: userId });
  if (!success) return json({ error: 'rate_limited' }, 429);

  const input = parseInput(body);
  if (!input) return json({ error: 'bad_request' }, 400);
  const { requestId } = input;

  const claim = await claimRequest(env, userId, requestId);
  if ('error' in claim) return json({ error: claim.error }, 409);

  let bucket: Bucket | null = null;
  if (claim.charge) {
    bucket = await charge(env, userId, requestId);
    if (!bucket) {
      await env.DB.prepare("UPDATE draws SET status = 'failed', updated_at = ? WHERE request_id = ?")
        .bind(now(), requestId)
        .run();
      return json({ error: 'no_brushes', brushes: await balanceOf(env, userId) }, 402);
    }
  }

  const result = await drawWithGemini(env, { userId, requestId }, input.photo, input.cards).catch((error) => {
    console.error('gemini_error', error);
    return { ok: false as const, reason: 'network' };
  });

  if (result.ok) {
    await env.DB.prepare(
      `UPDATE draws SET status = 'done', attempts = attempts + 1, bucket = coalesce(?, bucket), updated_at = ?
       WHERE request_id = ?`,
    )
      .bind(bucket, now(), requestId)
      .run();
    return json({ image: result.image, brushes: await balanceOf(env, userId) });
  }

  // A failed free repeat goes back to done: the first drawing was already paid for
  const status = claim.charge ? 'failed' : 'done';
  await env.DB.prepare('UPDATE draws SET status = ?, updated_at = ? WHERE request_id = ?')
    .bind(status, now(), requestId)
    .run();
  let compensated = false;
  if (bucket) {
    await refund(env, userId, bucket, requestId);
    compensated = await compensate(env, userId, requestId);
  }
  return json(
    { error: 'draw_failed', reason: result.reason, compensated, brushes: await balanceOf(env, userId) },
    502,
  );
}

/**
 * Marks the request as running. `charge` tells whether a brush must be taken.
 * Every state change is a conditional UPDATE, so two copies of one request cannot both run.
 */
async function claimRequest(
  env: Env,
  userId: string,
  requestId: string,
): Promise<{ charge: boolean } | { error: string }> {
  const at = now();
  const inserted = await env.DB.prepare(
    `INSERT INTO draws (request_id, user_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?)
     ON CONFLICT (request_id) DO NOTHING`,
  )
    .bind(requestId, userId, at, at)
    .run();
  if (inserted.meta.changes > 0) return { charge: true };

  const row = await env.DB.prepare('SELECT user_id, status, attempts, bucket, updated_at FROM draws WHERE request_id = ?')
    .bind(requestId)
    .first<DrawRow>();
  if (!row || row.user_id !== userId) return { error: 'request_id_taken' };
  if (row.status === 'pending' && row.updated_at > at - STALE_PENDING_MS) return { error: 'in_progress' };
  if (row.status === 'done' && row.attempts > FREE_REPEATS) return { error: 'already_done' };

  const moved = await env.DB.prepare(
    `UPDATE draws SET status = 'pending', updated_at = ?
     WHERE request_id = ? AND status = ? AND attempts = ? AND updated_at = ?`,
  )
    .bind(at, requestId, row.status, row.attempts, row.updated_at)
    .run();
  if (moved.meta.changes === 0) return { error: 'in_progress' };
  return { charge: row.status === 'failed' };
}

function parseInput(body: ArrayBuffer): DrawInput | null {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return null;
  }
  const { requestId, photo, cards = [] } = (value ?? {}) as Partial<DrawInput>;
  if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) return null;
  if (!isImage(photo, MAX_PHOTO_CHARS)) return null;
  if (!Array.isArray(cards) || cards.length > MAX_CARDS) return null;
  if (!cards.every((card) => isImage(card, MAX_CARD_CHARS))) return null;
  return { requestId, photo, cards };
}

const isImage = (value: unknown, maxChars: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= maxChars && BASE64.test(value);
