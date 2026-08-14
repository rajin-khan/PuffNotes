import assert from 'node:assert/strict';
import test from 'node:test';

import { runBeautifyWorkflow } from '../src/lib/beautifyWorkflow.js';

const createWorkflow = (overrides = {}) => {
  const calls = [];
  const setter = (name) => (value) => calls.push([name, value]);
  const options = {
    originalNote: '',
    note: 'rough note',
    userApiKey: 'user-key',
    defaultApiKey: 'default-key',
    apiKeyInputRef: { current: null },
    setApiKeyError: setter('apiKeyError'),
    setApiKeySaveFeedback: setter('apiKeySaveFeedback'),
    setIsBeautifying: setter('isBeautifying'),
    setIsPreviewMode: setter('isPreviewMode'),
    setOriginalNote: setter('originalNote'),
    setPreviewNote: setter('previewNote'),
    setShowBeautifyControls: setter('showBeautifyControls'),
    setShowSettingsModal: setter('showSettingsModal'),
    beautifyNote: async () => '# Polished',
    ...overrides,
  };
  return { calls, options };
};

test('shared beautify workflow preserves the success state sequence', async () => {
  const { calls, options } = createWorkflow();
  await runBeautifyWorkflow(options);

  assert.deepEqual(calls, [
    ['isBeautifying', true],
    ['originalNote', 'rough note'],
    ['apiKeyError', false],
    ['apiKeySaveFeedback', ''],
    ['previewNote', '# Polished'],
    ['showBeautifyControls', true],
    ['isPreviewMode', false],
    ['isBeautifying', false],
  ]);
});

test('regeneration uses the original note without replacing it', async () => {
  let input;
  const { calls, options } = createWorkflow({
    isRegeneration: true,
    originalNote: 'original rough note',
    beautifyNote: async (note) => {
      input = note;
      return '# Again';
    },
  });

  await runBeautifyWorkflow(options);
  assert.equal(input, 'original rough note');
  assert.ok(!calls.some(([name]) => name === 'originalNote'));
});

test('a missing key opens settings without starting a request', async () => {
  let requested = false;
  const { calls, options } = createWorkflow({
    userApiKey: '',
    defaultApiKey: '',
    beautifyNote: async () => {
      requested = true;
    },
  });

  await runBeautifyWorkflow(options);
  assert.equal(requested, false);
  assert.deepEqual(calls, [
    ['apiKeyError', true],
    ['apiKeySaveFeedback', ''],
    ['showSettingsModal', true],
  ]);
});
