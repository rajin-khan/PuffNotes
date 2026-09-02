// Keep deletion exclusive with saves, file loads, and AI requests.
export function createNoteOperations() {
  let pending = 0;
  let deleting = false;
  let revision = 0;
  return {
    get deleting() { return deleting; },
    get busy() { return deleting || pending > 0; },
    get revision() { return revision; },
    invalidate() { revision += 1; },
    async run(operation, expectedRevision = revision) {
      if (deleting || expectedRevision !== revision) return;
      pending += 1;
      try { return await operation(); }
      finally { pending -= 1; }
    },
    async remove(operation) {
      if (deleting || pending > 0) return false;
      deleting = true;
      try { await operation(); return true; }
      finally { deleting = false; }
    },
  };
}
