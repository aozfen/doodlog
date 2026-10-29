// Local Worker test: starts wrangler dev with a temporary data dir and a fake Gemini
// server, then checks auth, brush balances, retries and refunds. No Cloudflare
// account or Gemini key needed.
//
//   cd worker && npm test
import { spawn, execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const PORT = 8798;
const GEMINI_PORT = 8797;
const BASE = `http://127.0.0.1:${PORT}`;
const PERSIST = fs.mkdtempSync(path.join(os.tmpdir(), 'doodlog-worker-'));
const PHOTO = Buffer.from('photo').toString('base64');
const FAILING_PHOTO = Buffer.from('FAIL').toString('base64');
const CARD = Buffer.from('card').toString('base64');
const IMAGE = Buffer.from('png').toString('base64');

let failures = 0;
function check(name, ok, detail) {
  if (ok) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.log(`  ✗ ${name}`, detail === undefined ? '' : JSON.stringify(detail));
  }
}

// --- Fake Gemini ------------------------------------------------------------

let lastPrompt = '';
const gemini = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (d) => (raw += d));
  req.on('end', () => {
    const parts = JSON.parse(raw).contents[0].parts;
    lastPrompt = parts.at(-1).text;
    const photo = parts.at(-2).inline_data.data;
    const usage = {
      promptTokenCount: 1000,
      candidatesTokenCount: 1300,
      thoughtsTokenCount: 100,
      candidatesTokensDetails: [{ modality: 'IMAGE', tokenCount: 1200 }],
    };
    const candidates =
      photo === FAILING_PHOTO
        ? [{ finishReason: 'IMAGE_SAFETY', content: { parts: [] } }]
        : [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: IMAGE } }] } }];
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ candidates, usageMetadata: usage }));
  });
});
gemini.listen(GEMINI_PORT);

// --- Worker -----------------------------------------------------------------

const wrangler = (...args) =>
  execFileSync('npx', ['wrangler', ...args, '--persist-to', PERSIST], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

wrangler('d1', 'migrations', 'apply', 'doodlog', '--local');
const dev = spawn(
  'npx',
  [
    'wrangler', 'dev', '--port', String(PORT), '--persist-to', PERSIST,
    '--var', `GEMINI_API_BASE:http://127.0.0.1:${GEMINI_PORT}`, '--var', 'GEMINI_API_KEY:test',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let devLog = '';
dev.stdout.on('data', (d) => (devLog += d));
dev.stderr.on('data', (d) => (devLog += d));

const sql = (query) =>
  JSON.parse(wrangler('d1', 'execute', 'doodlog', '--local', '--json', '--command', query))[0].results;

// --- Client -----------------------------------------------------------------

function newClient() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const id = publicKey.export({ format: 'jwk' }).x;
  const request = (method, pathname, body, { sign = true, signedBody = body } = {}) => {
    const ts = Math.floor(Date.now() / 1000);
    const hash = crypto.createHash('sha256').update(signedBody ?? '').digest('hex');
    const sig = crypto
      .sign(null, Buffer.from(`doodlog-v1\n${method}\n${pathname}\n${ts}\n${hash}`), privateKey)
      .toString('base64url');
    return fetch(BASE + pathname, {
      method,
      body,
      headers: sign ? { Authorization: `Doodlog key=${id}, ts=${ts}, sig=${sig}` } : {},
    });
  };
  const draw = (requestId, photo = PHOTO, cards = []) =>
    request('POST', '/v1/draw', JSON.stringify({ requestId, photo, cards }));
  const brushes = async () => (await request('GET', '/v1/brushes')).json();
  return { id, request, draw, brushes };
}

async function waitForWorker() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE + '/')).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('wrangler dev did not start\n' + devLog);
}

// --- Tests ------------------------------------------------------------------

async function run() {
  await waitForWorker();

  console.log('auth');
  const a = newClient();
  check('unsigned request is rejected', (await a.request('GET', '/v1/brushes', undefined, { sign: false })).status === 401);
  const tampered = await a.request('POST', '/v1/draw', JSON.stringify({ requestId: 'request-tampered', photo: PHOTO }), {
    signedBody: 'other body',
  });
  check('changed body breaks the signature', tampered.status === 401);

  console.log('balance');
  check('new user gets 3 gift brushes', (await a.brushes()).total === 3, await a.brushes());

  console.log('draw');
  let res = await a.draw('request-a-1', PHOTO, [CARD, CARD]);
  let body = await res.json();
  check('draw returns the image', res.status === 200 && body.image === IMAGE, body);
  check('draw takes one brush', body.brushes?.total === 2, body.brushes);
  check('prompt counts the cards', lastPrompt.startsWith('The first 2 image(s)'), lastPrompt.slice(0, 40));
  await a.draw('request-a-solo');
  check('prompt without cards has no card text', !lastPrompt.includes('reference card'), lastPrompt.slice(0, 40));
  const [call] = sql("SELECT * FROM gemini_calls WHERE request_id = 'request-a-1'");
  // 1000 x 1.5 + 1200 x 30 + 200 x 7.5 = 39000 micro USD
  check('call cost is logged', call?.cost_micros === 39000 && call.text_tokens === 200, call);

  console.log('retry');
  res = await a.draw('request-a-1');
  body = await res.json();
  check('lost answer can be fetched once for free', res.status === 200 && body.brushes.total === 1, body.brushes);
  res = await a.draw('request-a-1');
  check('third copy is refused', res.status === 409 && (await res.json()).error === 'already_done');
  const b = newClient();
  res = await b.draw('request-a-1');
  check('other user cannot use the request id', res.status === 409);

  console.log('stale request');
  sql(`INSERT INTO draws (request_id, user_id, status, bucket, created_at, updated_at)
       VALUES ('request-b-stale', '${b.id}', 'pending', 'pack', 0, 0)`);
  await b.brushes();
  res = await b.draw('request-b-stale');
  body = await res.json();
  check('stuck pending request runs again without a charge', res.status === 200 && body.brushes.total === 3, body);
  sql(`INSERT INTO draws (request_id, user_id, status, created_at, updated_at)
       VALUES ('request-b-busy', '${b.id}', 'pending', ${Date.now()}, ${Date.now()})`);
  res = await b.draw('request-b-busy');
  check('fresh pending request is in progress', res.status === 409 && (await res.json()).error === 'in_progress');

  console.log('failure');
  res = await a.draw('request-a-fail', FAILING_PHOTO);
  body = await res.json();
  check('failed draw returns 502 with reason', res.status === 502 && body.reason === 'IMAGE_SAFETY', body);
  check('brush is refunded with one extra', body.compensated === true && body.brushes.total === 2, body);
  res = await a.draw('request-a-fail2', FAILING_PHOTO);
  body = await res.json();
  check('extra brush only once a day', body.compensated === false && body.brushes.total === 2, body);
  res = await a.draw('request-a-fail');
  check('failed request can be sent again and is charged', res.status === 200 && (await res.json()).brushes.total === 1);

  console.log('empty balance');
  const c = newClient();
  for (const n of [1, 2, 3]) await c.draw(`request-c-${n}`);
  res = await c.draw('request-c-4');
  body = await res.json();
  check('no brushes returns 402', res.status === 402 && body.error === 'no_brushes' && body.brushes.total === 0, body);
  check('refused request does not call Gemini', sql("SELECT count(*) n FROM gemini_calls WHERE request_id = 'request-c-4'")[0].n === 0);

  console.log('subscription');
  const d = newClient();
  await d.brushes();
  sql(`UPDATE users SET sub_brushes = 50, sub_ends_at = ${Date.now() + 86400000} WHERE id = '${d.id}'`);
  body = await (await d.draw('request-d-1')).json();
  check('subscription brushes are spent first', body.brushes.subscription === 49 && body.brushes.pack === 3, body.brushes);
  sql(`UPDATE users SET sub_ends_at = ${Date.now() - 1000} WHERE id = '${d.id}'`);
  body = await (await d.draw('request-d-2')).json();
  check('expired subscription brushes are not used', body.brushes.subscription === 0 && body.brushes.pack === 2, body.brushes);

  console.log('validation');
  check('missing photo is rejected', (await a.request('POST', '/v1/draw', JSON.stringify({ requestId: 'request-x-1' }))).status === 400);
  check('more than 4 cards is rejected', (await a.draw('request-x-2', PHOTO, [CARD, CARD, CARD, CARD, CARD])).status === 400);
  check('bad request id is rejected', (await a.draw('x')).status === 400);

  console.log('delete account');
  check('delete returns 204', (await a.request('DELETE', '/v1/account')).status === 204);
  check('brush history is deleted', sql(`SELECT count(*) n FROM brush_moves WHERE user_id = '${a.id}'`)[0].n === 0);
  check('cost log stays without user', sql("SELECT user_id FROM gemini_calls WHERE request_id = 'request-a-1'")[0].user_id === null);
}

run()
  .catch((error) => {
    failures++;
    console.error(error);
  })
  .finally(() => {
    dev.kill();
    gemini.close();
    fs.rmSync(PERSIST, { recursive: true, force: true });
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  });
