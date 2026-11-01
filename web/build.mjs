#!/usr/bin/env node
/**
 * Open Arbor v2.0 Static Multi-Page Web Builder (esbuild)
 * Bundles certified src/core engines, municipal ordinance commons, 41-tool catalog,
 * JSON Schemas, and multi-page UI modules into a self-contained static artifact in out/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');

fs.mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(rootDir, 'web/app.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  outfile: path.join(outDir, 'openarbor-bundle.js'),
  alias: {
    'node:crypto': path.join(rootDir, 'web/crypto-shim.js'),
  },
  legalComments: 'inline',
});

// 1. Copy root portal HTML, shared stylesheet, and .nojekyll
fs.copyFileSync(path.join(rootDir, 'web/index.html'), path.join(outDir, 'index.html'));
fs.copyFileSync(path.join(rootDir, 'web/styles.css'), path.join(outDir, 'styles.css'));
fs.writeFileSync(path.join(outDir, '.nojekyll'), '', 'utf8');

// 2. Copy route index.html pages (/demo/, /tools/, /ordinances/, /mcp/, /spec/)
const routes = ['demo', 'tools', 'ordinances', 'mcp', 'spec'];
for (const route of routes) {
  const srcHtml = path.join(rootDir, 'web', route, 'index.html');
  if (fs.existsSync(srcHtml)) {
    const destRouteDir = path.join(outDir, route);
    fs.mkdirSync(destRouteDir, { recursive: true });
    fs.copyFileSync(srcHtml, path.join(destRouteDir, 'index.html'));
  }
}

// 3. Copy JSON Schemas to out/schemas/
const schemasSrcDir = path.join(rootDir, 'schemas');
const schemasOutDir = path.join(outDir, 'schemas');
if (fs.existsSync(schemasSrcDir)) {
  fs.mkdirSync(schemasOutDir, { recursive: true });
  for (const file of fs.readdirSync(schemasSrcDir).sort()) {
    if (file.endsWith('.json')) {
      fs.copyFileSync(path.join(schemasSrcDir, file), path.join(schemasOutDir, file));
    }
  }
}

// 4. Copy open datasets to out/data/ordinances/ and out/data/catalog/
const dataSubdirs = ['ordinances', 'catalog'];
for (const sub of dataSubdirs) {
  const srcSubDir = path.join(rootDir, 'data', sub);
  const destSubDir = path.join(outDir, 'data', sub);
  if (fs.existsSync(srcSubDir)) {
    fs.mkdirSync(destSubDir, { recursive: true });
    for (const file of fs.readdirSync(srcSubDir).sort()) {
      if (file.endsWith('.json')) {
        fs.copyFileSync(path.join(srcSubDir, file), path.join(destSubDir, file));
      }
    }
  }
}

function listOutFiles(dir, prefix = 'out') {
  const items = [];
  for (const entry of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    const rel = `${prefix}/${entry}`;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      items.push(...listOutFiles(full, rel));
    } else {
      items.push({ rel, size: stat.size });
    }
  }
  return items;
}

const files = listOutFiles(outDir);
console.log('Open Arbor static web build complete -> out/');
for (const f of files) {
  console.log(`  - ${f.rel} (${f.size} bytes)`);
}
