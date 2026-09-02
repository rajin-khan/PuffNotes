import test from 'node:test';
import assert from 'node:assert/strict';
import { createNoteOperations } from '../src/lib/noteOperations.js';
import { trashNote } from '../src/lib/googleDrive.js';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test('deletion waits until the entire save/rename or load operation finishes', async () => {
  const operations = createNoteOperations();
  const save = deferred();
  const pending = operations.run(() => save.promise);
  assert.equal(operations.busy, true);
  let removed = false;
  assert.equal(await operations.remove(() => { removed = true; }), false);
  assert.equal(removed, false);
  save.resolve();
  await pending;
  assert.equal(await operations.remove(() => { removed = true; }), true);
  assert.equal(removed, true);
});

test('deletion blocks saves, loads, AI, and duplicate deletion until complete', async () => {
  const operations = createNoteOperations();
  const deletion = deferred();
  const pending = operations.remove(() => deletion.promise);
  let ran = false;
  await operations.run(() => { ran = true; });
  assert.equal(await operations.remove(() => { ran = true; }), false);
  assert.equal(ran, false);
  deletion.resolve();
  await pending;
  await operations.run(() => { ran = true; });
  assert.equal(ran, true);
});

test('a successful active-note deletion invalidates queued autosaves', async () => {
  const operations = createNoteOperations();
  const oldRevision = operations.revision;
  await operations.remove(() => operations.invalidate());
  let saved = false;
  await operations.run(() => { saved = true; }, oldRevision);
  assert.equal(saved, false);
  await operations.run(() => { saved = true; });
  assert.equal(saved, true);
});

test('failed deletion releases the lock without invalidating pending saves', async () => {
  const operations = createNoteOperations();
  const revision = operations.revision;
  await assert.rejects(operations.remove(() => { throw new Error('permission denied'); }));
  assert.equal(operations.busy, false);
  assert.equal(operations.revision, revision);
  let saved = false;
  await operations.run(() => { saved = true; }, revision);
  assert.equal(saved, true);
});

test('failed saves release the deletion lock', async () => {
  const operations = createNoteOperations();
  await assert.rejects(operations.run(() => { throw new Error('save failed'); }));
  assert.equal(operations.busy, false);
  assert.equal(await operations.remove(() => {}), true);
});

test('Drive deletion moves only the specified note to trash', async t => {
  let request;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    request = { url, ...options };
    return { ok: true };
  });
  await trashNote('test-token', 'note/id');
  assert.equal(request.url, 'https://www.googleapis.com/drive/v3/files/note%2Fid');
  assert.equal(request.method, 'PATCH');
  assert.equal(request.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(request.body), { trashed: true });
});

test('Drive permission and network failures are not reported as successful deletion', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));
  await assert.rejects(trashNote('test-token', 'note'), /Could not move/);
  fetch.mock.mockImplementation(async () => { throw new Error('offline'); });
  await assert.rejects(trashNote('test-token', 'note'), /offline/);
  await assert.rejects(trashNote('test-token', ''), /No note selected/);
});
