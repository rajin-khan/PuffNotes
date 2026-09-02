import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createNoteOperations } from '../src/lib/noteOperations.js';

// Exercise the actual event-handler bodies with in-memory files and React setters.
// No browser permissions, user notes, or live Google Drive requests are involved.
for (const mode of ['Offline', 'Online']) {
  const source = await readFile(new URL(`../src/components/${mode}App.jsx`, import.meta.url), 'utf8');
  const start = source.indexOf('  const handleDeleteNote =');
  const end = source.indexOf('\n  const handleBeautify =', start);
  const handlerSource = source.slice(start, end);
  assert.ok(start > 0 && end > start);

  function setup({ active = true, confirm = true, fail = false } = {}) {
    const online = mode === 'Online';
    const file = online ? { id: 'test-id', name: 'test.md' } : 'test.md';
    const other = online ? { id: 'other-id', name: 'other.md' } : 'other.md';
    const state = { note: 'keep my writing', fileList: [file, other], saveStatus: 'unsaved' };
    const operations = createNoteOperations();
    let calls = 0;
    const alerts = [];
    const context = {
      operationsRef: { current: operations },
      autoSaveContextRef: { current: { isFirstSave: false, note: state.note } },
      noteContentRef: { current: state.note },
      activeFileName: active ? file : other,
      activeNoteId: active ? 'test-id' : 'other-id',
      accessToken: 'test-token',
      window: { confirm: () => confirm },
      alert: message => alerts.push(message),
      deleteNote: async () => { calls += 1; return !fail; },
      trashNote: async () => { calls += 1; if (fail) throw new Error('permission denied'); },
    };
    for (const name of ['DeletingNote', 'Note', 'NoteName', 'ActiveNoteId', 'ActiveFileName',
      'IsFirstSave', 'PreviewNote', 'OriginalNote', 'ShowBeautifyControls', 'IsPreviewMode',
      'SaveStatus', 'FileList']) {
      const key = name[0].toLowerCase() + name.slice(1);
      context[`set${name}`] = value => { state[key] = typeof value === 'function' ? value(state[key]) : value; };
    }
    const handler = new Function(...Object.keys(context), `${handlerSource}; return handleDeleteNote;`)(...Object.values(context));
    return { handler, file, other, state, context, operations, alerts, calls: () => calls };
  }

  test(`${mode}: cancel leaves the note, list, and storage untouched`, async () => {
    const env = setup({ confirm: false });
    await env.handler(env.file);
    assert.equal(env.calls(), 0);
    assert.equal(env.state.note, 'keep my writing');
    assert.equal(env.state.fileList.length, 2);
  });

  test(`${mode}: deleting the open note clears the editor without recreating it`, async () => {
    const env = setup();
    const revision = env.operations.revision;
    await env.handler(env.file);
    assert.equal(env.calls(), 1);
    assert.deepEqual(env.state.fileList, [env.other]);
    assert.equal(env.state.note, '');
    assert.equal(env.state.deletingNote, null);
    assert.equal(env.operations.revision, revision + 1);
    if (mode === 'Online') {
      assert.equal(env.state.saveStatus, 'saved');
      assert.equal(env.state.activeNoteId, null);
      assert.equal(env.context.noteContentRef.current, '');
    } else {
      assert.equal(env.state.isFirstSave, true);
      assert.equal(env.state.activeFileName, '');
      assert.equal(env.context.autoSaveContextRef.current.isFirstSave, true);
    }
  });

  test(`${mode}: deleting another note preserves the open editor and its pending save`, async () => {
    const env = setup({ active: false });
    await env.handler(env.file);
    assert.deepEqual(env.state.fileList, [env.other]);
    assert.equal(env.state.note, 'keep my writing');
    assert.equal(env.operations.revision, 0);
  });

  test(`${mode}: a failed deletion preserves the note and reports the error`, async () => {
    const env = setup({ fail: true });
    await env.handler(env.file);
    assert.equal(env.state.fileList.length, 2);
    assert.equal(env.state.note, 'keep my writing');
    assert.equal(env.alerts.length, 1);
    assert.equal(env.state.deletingNote, null);
    assert.equal(env.operations.busy, false);
  });

  test(`${mode}: an in-flight save prevents deletion`, async () => {
    const env = setup();
    await env.operations.run(async () => {
      await env.handler(env.file);
      assert.equal(env.calls(), 0);
      assert.equal(env.alerts.length, 1);
    });
  });
}
