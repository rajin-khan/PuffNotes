import fs from 'node:fs/promises';

const packageKeyPattern = /^  (?:'([^']+)'|(\S[^:\n]*)):\s*$/;

export async function readLockedPackages() {
  const lockfile = await fs.readFile(new URL('../pnpm-lock.yaml', import.meta.url), 'utf8');
  const packagesSection = lockfile.split('\npackages:\n')[1]?.split('\nsnapshots:\n')[0];

  if (!packagesSection) {
    throw new Error('Could not find the packages section in pnpm-lock.yaml.');
  }

  const packages = [];
  for (const line of packagesSection.split('\n')) {
    const match = line.match(packageKeyPattern);
    const packageKey = match?.[1] || match?.[2];
    if (!packageKey) continue;

    const versionSeparator = packageKey.lastIndexOf('@');
    if (versionSeparator <= 0) continue;

    packages.push({
      name: packageKey.slice(0, versionSeparator),
      version: packageKey.slice(versionSeparator + 1),
    });
  }

  return [...new Map(packages.map((entry) => [`${entry.name}@${entry.version}`, entry])).values()];
}
