import { readLockedPackages } from './lockfilePackages.mjs';

const MINIMUM_AGE_DAYS = 7;
const REGISTRY_URL = 'https://registry.npmjs.org';

const uniquePackages = await readLockedPackages();
const cutoff = Date.now() - MINIMUM_AGE_DAYS * 24 * 60 * 60 * 1000;
const failures = [];

const verifyPackage = async ({ name, version }) => {
  const response = await fetch(`${REGISTRY_URL}/${encodeURIComponent(name)}`);
  if (!response.ok) {
    failures.push({ name, version, reason: `registry returned ${response.status}` });
    return;
  }

  const metadata = await response.json();
  const publishedAt = metadata.time?.[version];
  if (!publishedAt) {
    failures.push({ name, version, reason: 'publication date was not found' });
    return;
  }

  if (Date.parse(publishedAt) > cutoff) {
    failures.push({ name, version, reason: `published ${publishedAt}` });
  }
};

const CONCURRENCY = 12;
for (let index = 0; index < uniquePackages.length; index += CONCURRENCY) {
  await Promise.all(uniquePackages.slice(index, index + CONCURRENCY).map(verifyPackage));
}

if (failures.length > 0) {
  console.error(`Lockfile age verification failed for ${failures.length} package(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.name}@${failure.version}: ${failure.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Verified ${uniquePackages.length} pnpm-locked packages: every version is at least ${MINIMUM_AGE_DAYS} days old.`);
}
