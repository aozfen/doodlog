import { authenticate } from './auth';
import { ensureUser, handleBalance } from './brushes';
import { handleDraw } from './draw';
import { json } from './http';

// Doodlog API. Memories stay on the phone; this Worker keeps the Gemini key and
// counts brushes. Design: ../MIMARI.md
//
//   GET    /v1/brushes   both balances and the renewal date
//   POST   /v1/draw      take a brush, draw with Gemini, return the PNG (see src/draw.ts)
//   DELETE /v1/account   delete the user and the brush history
//
// Every /v1 request is signed by the app (see src/auth.ts).

const MAX_BODY_BYTES = 12 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/') return json({ ok: true });
      if (!pathname.startsWith('/v1/')) return json({ error: 'not_found' }, 404);

      if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) {
        return json({ error: 'too_large' }, 413);
      }
      const body = await request.arrayBuffer();
      if (body.byteLength > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413);

      const auth = await authenticate(request, body);
      if (!auth.ok) return json({ error: auth.error }, 401);
      const { userId } = auth;

      if (request.method === 'DELETE' && pathname === '/v1/account') {
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        return new Response(null, { status: 204 });
      }

      await ensureUser(env, userId);
      if (request.method === 'GET' && pathname === '/v1/brushes') return await handleBalance(env, userId);
      if (request.method === 'POST' && pathname === '/v1/draw') return await handleDraw(env, userId, body);
      return json({ error: 'not_found' }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: 'internal' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
