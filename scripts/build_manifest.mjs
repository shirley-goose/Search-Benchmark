#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const excluded = new Set(['.git', 'MANIFEST.sha256', 'node_modules']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (excluded.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const files = (await walk(root)).sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
const lines = [];
for (const file of files) {
  const digest = createHash('sha256').update(await readFile(file)).digest('hex');
  lines.push(`${digest}  ${relative(root, file)}`);
}
await writeFile(join(root, 'MANIFEST.sha256'), `${lines.join('\n')}\n`);
console.log(`Wrote MANIFEST.sha256 for ${files.length} files.`);
