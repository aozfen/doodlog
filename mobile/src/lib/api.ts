// Signed client for the Doodlog Worker (worker/src/auth.ts).
// The key pair is made on first launch and kept in the Keychain. Its public key is the user id.
import * as ed from '@noble/ed25519';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import * as SecureStore from 'expo-secure-store';

import { API_URL } from '@/constants';
import type { ServerBalance } from '@/types';

ed.hashes.sha512 = sha512;

const KEY_NAME = 'doodlog.signing-key';

let secretKey: Promise<Uint8Array> | undefined;

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16));

/** The saved key, or a new one. The Keychain keeps it after the app is deleted. */
function getSecretKey() {
  secretKey ??= (async () => {
    const saved = await SecureStore.getItemAsync(KEY_NAME);
    if (saved) return fromHex(saved);
    const key = ed.utils.randomSecretKey();
    await SecureStore.setItemAsync(KEY_NAME, bytesToHex(key), {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    return key;
  })();
  return secretKey;
}

/** Thrown for any answer that is not 2xx. `body` is the parsed JSON error. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { error?: string; brushes?: ServerBalance; [key: string]: unknown },
  ) {
    super(`api_${status}_${body.error ?? 'unknown'}`);
  }
}

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const key = await getSecretKey();
  const text = body === undefined ? '' : JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000);
  const bodyHash = bytesToHex(sha256(new TextEncoder().encode(text)));
  const message = new TextEncoder().encode(`doodlog-v1\n${method}\n${path}\n${ts}\n${bodyHash}`);
  const sig = toBase64Url(ed.sign(message, key));
  const res = await fetch(API_URL + path, {
    method,
    body: body === undefined ? undefined : text,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Doodlog key=${toBase64Url(ed.getPublicKey(key))}, ts=${ts}, sig=${sig}`,
    },
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json);
  return json as T;
}

export const fetchBrushes = () => request<ServerBalance>('GET', '/v1/brushes');

export const requestDrawing = (input: { requestId: string; photo: string; cards: string[] }) =>
  request<{ image: string; brushes: ServerBalance }>('POST', '/v1/draw', input);

export const deleteAccount = () => request<void>('DELETE', '/v1/account');
