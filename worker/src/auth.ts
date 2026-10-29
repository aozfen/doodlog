import { fromBase64Url, sha256Hex } from './http';

// Request signing. The app creates an Ed25519 key pair on first launch and keeps it in
// the Keychain. The public key is the user id: there is no sign-up and no token.
//
// Header: `Authorization: Doodlog key=<public key>, ts=<unix seconds>, sig=<signature>`
// Signed text: `doodlog-v1\n<METHOD>\n<path>\n<ts>\n<sha256 hex of body>`. Values are base64url.
// The body hash makes the signature cover the photo too.

const MAX_CLOCK_SKEW_S = 300;
const HEADER = /^Doodlog key=([\w-]{43}), ts=(\d+), sig=([\w-]{86})$/;

export type AuthResult = { ok: true; userId: string } | { ok: false; error: string };

export async function authenticate(request: Request, body: ArrayBuffer): Promise<AuthResult> {
  const match = HEADER.exec(request.headers.get('Authorization') ?? '');
  if (!match) return { ok: false, error: 'missing_auth' };
  const [, key, ts, sig] = match;

  if (Math.abs(Date.now() / 1000 - Number(ts)) > MAX_CLOCK_SKEW_S) return { ok: false, error: 'clock_skew' };

  const { pathname } = new URL(request.url);
  const message = new TextEncoder().encode(
    `doodlog-v1\n${request.method}\n${pathname}\n${ts}\n${await sha256Hex(body)}`,
  );
  try {
    const publicKey = await crypto.subtle.importKey('raw', fromBase64Url(key), { name: 'Ed25519' }, false, ['verify']);
    const valid = await crypto.subtle.verify('Ed25519', publicKey, fromBase64Url(sig), message);
    return valid ? { ok: true, userId: key } : { ok: false, error: 'bad_signature' };
  } catch {
    return { ok: false, error: 'bad_signature' };
  }
}
