import assert from 'node:assert/strict';
import test from 'node:test';

import { beautifyNoteWithGroq } from '../src/lib/groq.js';

test('beautify keeps the deployed Groq request contract', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ choices: [{ message: { content: '# Polished' } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await beautifyNoteWithGroq('rough note', 'test-key');
  const body = JSON.parse(request.options.body);

  assert.equal(result, '# Polished');
  assert.equal(request.url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer test-key');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  assert.equal(body.model, 'llama-3.3-70b-versatile');
  assert.equal(body.temperature, 0.4);
  assert.equal(body.messages[1].role, 'user');
  assert.equal(body.messages[1].content, 'rough note');
  assert.match(body.messages[0].content, /academic note-generation assistant/);
  assert.match(body.messages[0].content, /Output only the final note/);
});

test('beautify rejects a missing key with the current status', async () => {
  await assert.rejects(
    beautifyNoteWithGroq('rough note', ''),
    (error) => error.message === 'API key required for beautification.' && error.status === 401,
  );
});

test('beautify preserves Groq error details', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { message: 'rate limited' } }),
    { status: 429, headers: { 'content-type': 'application/json' } },
  );

  await assert.rejects(
    beautifyNoteWithGroq('rough note', 'test-key'),
    (error) => error.message === 'rate limited' && error.status === 429,
  );
});
