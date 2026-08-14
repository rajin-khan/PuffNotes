import fs from 'node:fs/promises';

import { readLockedPackages } from './lockfilePackages.mjs';

const OSV_BATCH_URL = 'https://api.osv.dev/v1/querybatch';
const lockedPackages = await readLockedPackages();
const manifest = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));
const directPackages = new Set([
  ...Object.keys(manifest.dependencies || {}),
  ...Object.keys(manifest.devDependencies || {}),
]);
const findings = [];
const BATCH_SIZE = 500;

for (let index = 0; index < lockedPackages.length; index += BATCH_SIZE) {
  const batch = lockedPackages.slice(index, index + BATCH_SIZE);
  const response = await fetch(OSV_BATCH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      queries: batch.map(({ name, version }) => ({
        package: { ecosystem: 'npm', name },
        version,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`OSV returned ${response.status}.`);
  }

  const { results } = await response.json();
  results.forEach((result, resultIndex) => {
    const lockedPackage = batch[resultIndex];
    for (const vulnerability of result.vulns || []) {
      findings.push({
        package: lockedPackage.name,
        version: lockedPackage.version,
        direct: directPackages.has(lockedPackage.name),
        id: vulnerability.id,
        summary: vulnerability.summary || vulnerability.details?.split('\n')[0] || 'No summary supplied',
      });
    }
  });
}

findings.sort((left, right) =>
  Number(right.direct) - Number(left.direct)
  || left.package.localeCompare(right.package)
  || left.id.localeCompare(right.id));

if (findings.length === 0) {
  console.log(`OSV found no advisories across ${lockedPackages.length} pnpm-locked packages.`);
} else {
  console.log(`OSV found ${findings.length} advisory matches across ${new Set(findings.map(({ package: name }) => name)).size} of ${lockedPackages.length} pnpm-locked packages.`);
  console.table(findings);
  console.log('This command reports findings without changing dependencies. See docs/dependency-audit.md for reachability and decisions.');
}
