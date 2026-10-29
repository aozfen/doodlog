export const json = (body: unknown, status = 200) => Response.json(body, { status });

export const now = () => Date.now();

export const newId = () => crypto.randomUUID();

export async function sha256Hex(data: ArrayBuffer | Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
