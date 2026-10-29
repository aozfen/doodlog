import { json, newId, now } from './http';

// Two balances: subscription brushes (reset each period) and pack brushes (gifts and
// bought packs, never expire). Subscription brushes are spent first.

export type Bucket = 'sub' | 'pack';
export type MoveReason = 'gift' | 'draw' | 'refund' | 'compensation' | 'pack' | 'subscription';

type UserRow = { sub_brushes: number; pack_brushes: number; sub_ends_at: number | null };

export type Balance = { subscription: number; pack: number; total: number; renewsAt: number | null };

const SUB_ACTIVE = '(sub_ends_at IS NOT NULL AND sub_ends_at > ?)';

/** Creates the user with gift brushes on first sight, otherwise updates last_seen_at. */
export async function ensureUser(env: Env, userId: string) {
  const at = now();
  const gift = Number(env.GIFT_BRUSHES);
  const { meta } = await env.DB.prepare(
    `INSERT INTO users (id, pack_brushes, created_at, last_seen_at) VALUES (?1, ?2, ?3, ?3)
     ON CONFLICT (id) DO NOTHING`,
  )
    .bind(userId, gift, at)
    .run();
  if (meta.changes > 0) {
    // TODO: give the gift once per device (DeviceCheck / Play Integrity), not once per key.
    await addMove(env, userId, 'pack', gift, 'gift', null);
  } else {
    await env.DB.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').bind(at, userId).run();
  }
}

export async function balanceOf(env: Env, userId: string): Promise<Balance> {
  const row = await env.DB.prepare('SELECT sub_brushes, pack_brushes, sub_ends_at FROM users WHERE id = ?')
    .bind(userId)
    .first<UserRow>();
  const active = !!row?.sub_ends_at && row.sub_ends_at > now();
  const subscription = active ? row.sub_brushes : 0;
  const pack = row?.pack_brushes ?? 0;
  return { subscription, pack, total: subscription + pack, renewsAt: active ? row.sub_ends_at : null };
}

export async function handleBalance(env: Env, userId: string) {
  return json(await balanceOf(env, userId));
}

/** Takes one brush. Each UPDATE is atomic, so parallel requests cannot go below zero. */
export async function charge(env: Env, userId: string, ref: string): Promise<Bucket | null> {
  const sub = await env.DB.prepare(
    `UPDATE users SET sub_brushes = sub_brushes - 1 WHERE id = ? AND sub_brushes > 0 AND ${SUB_ACTIVE}`,
  )
    .bind(userId, now())
    .run();
  if (sub.meta.changes > 0) {
    await addMove(env, userId, 'sub', -1, 'draw', ref);
    return 'sub';
  }
  const pack = await env.DB.prepare('UPDATE users SET pack_brushes = pack_brushes - 1 WHERE id = ? AND pack_brushes > 0')
    .bind(userId)
    .run();
  if (pack.meta.changes > 0) {
    await addMove(env, userId, 'pack', -1, 'draw', ref);
    return 'pack';
  }
  return null;
}

/** Gives a brush back to the balance it came from. */
export async function refund(env: Env, userId: string, bucket: Bucket, ref: string) {
  const column = bucket === 'sub' ? 'sub_brushes' : 'pack_brushes';
  await env.DB.prepare(`UPDATE users SET ${column} = ${column} + 1 WHERE id = ?`).bind(userId).run();
  await addMove(env, userId, bucket, 1, 'refund', ref);
}

const COMPENSATION_COOLDOWN_MS = 24 * 3600 * 1000;

/**
 * One extra pack brush after a failed drawing. At most once a day, so repeated
 * failing photos cannot be used to collect free brushes.
 */
export async function compensate(env: Env, userId: string, ref: string) {
  const recent = await env.DB.prepare(
    "SELECT 1 FROM brush_moves WHERE user_id = ? AND reason = 'compensation' AND created_at > ?",
  )
    .bind(userId, now() - COMPENSATION_COOLDOWN_MS)
    .first();
  if (recent) return false;
  await env.DB.prepare('UPDATE users SET pack_brushes = pack_brushes + 1 WHERE id = ?').bind(userId).run();
  await addMove(env, userId, 'pack', 1, 'compensation', ref);
  return true;
}

async function addMove(env: Env, userId: string, bucket: Bucket, delta: number, reason: MoveReason, ref: string | null) {
  await env.DB.prepare(
    'INSERT INTO brush_moves (id, user_id, bucket, delta, reason, ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(newId(), userId, bucket, delta, reason, ref, now())
    .run();
}
