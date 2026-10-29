#!/usr/bin/env node
/**
 * OpenArbor v2.0 Static Web Builder (esbuild)
 * Bundles existing certified src/core engines and municipal ordinance data
 * into a self-contained browser artifact in out/.
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

fs.copyFileSync(path.join(rootDir, 'web/index.html'), path.join(outDir, 'index.html'));
fs.copyFileSync(path.join(rootDir, 'web/styles.css'), path.join(outDir, 'styles.css'));
fs.writeFileSync(path.join(outDir, '.nojekyll'), '', 'utf8');

const files = fs.readdirSync(outDir).sort();
console.log('OpenArbor static web build complete -> out/');
for (const f of files) {
  const stat = fs.statSync(path.join(outDir, f));
  console.log(`  - out/${f} (${stat.size} bytes)`);
}
