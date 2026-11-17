#!/usr/bin/env node
/**
 * Open Arbor Documentation Site Verification Suite (tests/verify_docs.mjs)
 *
 * Verifies:
 *   1. Manifest page existence and rendered out/docs/ output completeness
 *   2. Internal markdown link rewriting, outside-docs link preservation, and dead-link detection
 *   3. Manifest-ordered sidebar, current-page markers, prev/next pager, index descriptions, and version rendering
 *   4. Offline-first zero external asset policy and Service Worker pre-cache coverage
 *   5. Portal navigation reachability to /docs/ across portal routes and nginx config
 *   6. Version mismatch warnings and fail-loudly Markdown parser gates
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDocs, renderMarkdown } from '../web/build-docs.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const docsSrcDir = path.join(rootDir, 'docs');
const docsOutDir = path.join(outDir, 'docs');

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(docsSrcDir, 'manifest.json'), 'utf8'));

function extractMarkdownLinks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const links = [];
  let inFence = false;

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    const lineNo = idx + 1;
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    let i = 0;
    while (i < line.length) {
      if (line[i] === '\\' && i + 1 < line.length) {
        i += 2;
        continue;
      }
      if (line[i] === '`') {
        const end = line.indexOf('`', i + 1);
        if (end !== -1) {
          i = end + 1;
          continue;
        }
      }
      if (line[i] === '[' && (i === 0 || line[i - 1] !== '!')) {
        // Parse balanced [label](href)
        let depth = 0;
        let j = i;
        while (j < line.length) {
          if (line[j] === '\\' && j + 1 < line.length) {
            j += 2;
            continue;
          }
          if (line[j] === '`') {
            const end = line.indexOf('`', j + 1);
            if (end !== -1) {
              j = end + 1;
              continue;
            }
          }
          if (line[j] === '[') depth += 1;
          else if (line[j] === ']') {
            depth -= 1;
            if (depth === 0) break;
          }
          j += 1;
        }
        if (j < line.length && line[j] === ']' && line[j + 1] === '(') {
          let pDepth = 0;
          let k = j + 1;
          while (k < line.length) {
            if (line[k] === '\\' && k + 1 < line.length) {
              k += 2;
              continue;
            }
            if (line[k] === '(') pDepth += 1;
            else if (line[k] === ')') {
              pDepth -= 1;
              if (pDepth === 0) break;
            }
            k += 1;
          }
          if (k < line.length && line[k] === ')') {
            const href = line.slice(j + 2, k).trim();
            links.push({ href, lineNo });
            i = k + 1;
            continue;
          }
        }
      }
      i += 1;
    }
  }
  return links;
}

function assertInternalMarkdownLinksResolve(markdown, sourceFile, baseDocsDir, targetHtml) {
  const links = extractMarkdownLinks(markdown);
  for (const link of links) {
    const href = link.href;
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      continue;
    }
    if (href.startsWith('#')) {
      const id = href.slice(1);
      assert.ok(
        targetHtml.includes(`id="${id}"`),
        `Broken same-page anchor #${id} in docs/${sourceFile}:${link.lineNo}`
      );
      continue;
    }
    const [pathPart, fragment] = href.split('#');
    const cleanPath = pathPart.split('?')[0];
    const resolved = path.resolve(path.dirname(path.join(baseDocsDir, sourceFile)), cleanPath);
    assert.ok(
      fs.existsSync(resolved),
      `Dead internal link in docs/${sourceFile}:${link.lineNo} -> ${href} (resolved ${resolved})`
    );
    const relFromDocs = path.relative(baseDocsDir, resolved);
    if (!relFromDocs.startsWith('..') && !path.isAbsolute(relFromDocs) && cleanPath.endsWith('.md')) {
      const slug = path.basename(cleanPath, '.md');
      const expectedHtmlHref = fragment ? `${slug}.html#${fragment}` : `${slug}.html`;
      assert.ok(
        targetHtml.includes(`href="${expectedHtmlHref}"`) || targetHtml.includes(`${slug}.html`),
        `Expected rewritten .html link "${expectedHtmlHref}" in rendered output for docs/${sourceFile}`
      );
    }
  }
}

console.log('=== Open Arbor Documentation Verification Suite ===\n');

const flatPages = [];
for (const section of manifest.sections) {
  for (const page of section.pages) {
    flatPages.push({
      ...page,
      sectionTitle: section.title,
      slug: path.basename(page.file, '.md'),
    });
  }
}

// 1. Manifest Page Files & Output Completeness
{
  assert.ok(flatPages.length >= 7, 'Manifest must define all release documentation pages');
  assert.ok(fs.existsSync(path.join(docsOutDir, 'index.html')), 'out/docs/index.html must exist');
  assert.ok(fs.existsSync(path.join(docsOutDir, 'docs.css')), 'out/docs/docs.css must exist');

  for (const page of flatPages) {
    const mdPath = path.join(docsSrcDir, page.file);
    assert.ok(fs.existsSync(mdPath), `Manifest markdown source missing: docs/${page.file}`);

    const htmlPath = path.join(docsOutDir, `${page.slug}.html`);
    assert.ok(fs.existsSync(htmlPath), `Rendered HTML missing: out/docs/${page.slug}.html`);
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(html.length > 500, `Rendered HTML unexpectedly small: out/docs/${page.slug}.html`);
    assert.equal(html.includes('```'), false, `Unrendered markdown fence leaked into ${page.slug}.html`);
    assert.equal(html.includes('${'), false, `Unescaped template placeholder leaked into ${page.slug}.html`);
  }

  console.log(`[PASS] 1. Manifest completeness & rendered files verified (${flatPages.length} pages + index + docs.css)`);
}

// 2. Internal Link Resolution, .md -> .html Rewriting & Outside-Docs Links
{
  let totalInternalLinks = 0;
  let totalOutsideLinks = 0;

  for (const page of flatPages) {
    const md = fs.readFileSync(path.join(docsSrcDir, page.file), 'utf8');
    const html = fs.readFileSync(path.join(docsOutDir, `${page.slug}.html`), 'utf8');
    assertInternalMarkdownLinksResolve(md, page.file, docsSrcDir, html);

    for (const link of extractMarkdownLinks(md)) {
      if (
        link.href.startsWith('http://') ||
        link.href.startsWith('https://') ||
        link.href.startsWith('mailto:') ||
        link.href.startsWith('tel:')
      ) {
        continue;
      }
      const cleanPath = link.href.split('#')[0].split('?')[0];
      if (!cleanPath) {
        totalInternalLinks += 1;
        continue;
      }
      const resolvedSrc = path.resolve(path.dirname(path.join(docsSrcDir, page.file)), cleanPath);
      const rel = path.relative(docsSrcDir, resolvedSrc);
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        totalOutsideLinks += 1;
        assert.ok(
          html.includes(`href="${link.href}"`),
          `Outside-docs link must remain unchanged in HTML: ${link.href}`
        );
      } else {
        totalInternalLinks += 1;
      }
    }
  }

  // Also check every relative href inside all out/docs/*.html files resolves in out/
  const allHtmlFiles = ['index.html', ...flatPages.map((p) => `${p.slug}.html`)];
  for (const fileName of allHtmlFiles) {
    const html = fs.readFileSync(path.join(docsOutDir, fileName), 'utf8');
    for (const match of html.matchAll(/<(?:a|link)\b[^>]*\bhref="([^"]+)"/gi)) {
      const href = match[1];
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('#')
      ) {
        continue;
      }
      const [relPath, fragment] = href.split('#');
      const targetOnDisk = path.resolve(docsOutDir, relPath.split('?')[0]);
      assert.ok(
        fs.existsSync(targetOnDisk),
        `Dead relative href "${href}" in out/docs/${fileName} (expected ${targetOnDisk})`
      );
      if (fragment && targetOnDisk.endsWith('.html')) {
        const targetHtml = fs.readFileSync(targetOnDisk, 'utf8');
        assert.ok(
          targetHtml.includes(`id="${fragment}"`),
          `Dead anchor fragment #${fragment} in link "${href}" from out/docs/${fileName}`
        );
      }
    }
  }

  console.log(
    `[PASS] 2. Internal & relative link integrity verified (${totalInternalLinks} internal links, ${totalOutsideLinks} outside-docs link preserved)`
  );
}

// 3. Sidebar, Current-Page Marker, Prev/Next Pager, Index Sections & Version Rendering
{
  const indexHtml = fs.readFileSync(path.join(docsOutDir, 'index.html'), 'utf8');
  const expectedVersionToken = `v${pkg.version}`;

  assert.ok(
    indexHtml.includes(expectedVersionToken),
    `out/docs/index.html must render canonical package.json version ${expectedVersionToken}`
  );
  assert.ok(
    indexHtml.includes('<aside class="doc-sidebar"'),
    'out/docs/index.html must carry .doc-sidebar navigation'
  );
  assert.ok(
    indexHtml.includes('<a href="./index.html" class="doc-sidebar-home" aria-current="page">'),
    'out/docs/index.html sidebar must mark Documentation Home as aria-current="page"'
  );

  // Verify index lists sections in exact manifest order with one-line descriptions
  let prevSectionPos = -1;
  for (const section of manifest.sections) {
    const headingToken = `<h2>${section.title}</h2>`;
    const pos = indexHtml.indexOf(headingToken);
    assert.ok(pos > prevSectionPos, `Index section "${section.title}" missing or out of manifest order`);
    prevSectionPos = pos;

    const afterSection = indexHtml.slice(pos, pos + 600);
    const descMatch = afterSection.match(/<p class="doc-section-desc">([^<]+)<\/p>/);
    assert.ok(descMatch && descMatch[1].trim().length > 10, `Section "${section.title}" missing description on index`);
  }

  for (let i = 0; i < flatPages.length; i += 1) {
    const page = flatPages[i];
    const html = fs.readFileSync(path.join(docsOutDir, `${page.slug}.html`), 'utf8');

    assert.ok(
      html.includes(`Open Arbor <small>${expectedVersionToken}</small>`),
      `out/docs/${page.slug}.html header must render version ${expectedVersionToken} from package.json`
    );
    assert.ok(
      html.includes('<aside class="doc-sidebar"'),
      `out/docs/${page.slug}.html must carry .doc-sidebar`
    );

    // Every sidebar section and page link must appear in manifest order
    const sidebarMatch = html.match(/<aside class="doc-sidebar"[\s\S]*?<\/aside>/);
    assert.ok(sidebarMatch, `Missing closing aside in out/docs/${page.slug}.html`);
    const sidebar = sidebarMatch[0];

    let lastPos = -1;
    for (const section of manifest.sections) {
      const sPos = sidebar.indexOf(`>${section.title}</h2>`);
      assert.ok(sPos > lastPos, `Sidebar section "${section.title}" out of order on ${page.slug}.html`);
      lastPos = sPos;
      for (const p of section.pages) {
        const pSlug = path.basename(p.file, '.md');
        const pPos = sidebar.indexOf(`href="./${pSlug}.html"`);
        assert.ok(pPos > lastPos, `Sidebar page "${pSlug}.html" out of order on ${page.slug}.html`);
        lastPos = pPos;
      }
    }

    // Current page marker
    assert.ok(
      sidebar.includes(`href="./${page.slug}.html" class="doc-sidebar-link active" aria-current="page"`),
      `Current page ${page.slug}.html must be marked active + aria-current="page" in sidebar`
    );

    // Previous and Next links
    assert.ok(html.includes('<nav class="doc-pager"'), `Missing prev/next pager on ${page.slug}.html`);
    if (i === 0) {
      assert.ok(html.includes('href="./index.html" class="doc-pager-link" rel="prev"'), 'First doc page must link Previous to index.html');
    } else {
      const prevSlug = flatPages[i - 1].slug;
      assert.ok(
        html.includes(`href="./${prevSlug}.html" class="doc-pager-link" rel="prev"`),
        `Missing Previous link to ${prevSlug}.html on ${page.slug}.html`
      );
    }
    if (i < flatPages.length - 1) {
      const nextSlug = flatPages[i + 1].slug;
      assert.ok(
        html.includes(`href="./${nextSlug}.html" class="doc-pager-link doc-pager-next" rel="next"`),
        `Missing Next link to ${nextSlug}.html on ${page.slug}.html`
      );
    }
  }

  console.log(`[PASS] 3. Manifest sidebar order, current markers, prev/next pagers, index sections & ${expectedVersionToken} verified`);
}

// 4. Offline-First & Zero External Script/Stylesheet/Asset Policy
{
  const docsFiles = fs.readdirSync(docsOutDir).sort();
  const checkedHtml = docsFiles.filter((f) => f.endsWith('.html'));
  const cssText = fs.readFileSync(path.join(docsOutDir, 'docs.css'), 'utf8');

  for (const fileName of checkedHtml) {
    const html = fs.readFileSync(path.join(docsOutDir, fileName), 'utf8');

    // No external script or stylesheet references (http://, https://, or protocol-relative //)
    assert.equal(
      /<script\b[^>]*\bsrc\s*=/i.test(html),
      false,
      `out/docs/${fileName} must not load any external <script src=...>`
    );
    for (const linkTag of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = linkTag[0];
      assert.equal(
        /https?:\/\/|href\s*=\s*["']\/\//i.test(tag),
        false,
        `out/docs/${fileName} contains external <link> reference: ${tag}`
      );
    }
    assert.equal(
      /<img\b/i.test(html),
      false,
      `out/docs/${fileName} must not embed external or unverified <img> elements`
    );
    assert.equal(
      /<(?:iframe|video|audio|source|embed|object)\b[^>]*https?:\/\//i.test(html),
      false,
      `out/docs/${fileName} must not load remote media`
    );
    assert.ok(
      html.includes('<link rel="stylesheet" href="./docs.css" />'),
      `out/docs/${fileName} must reference local ./docs.css`
    );
  }

  assert.equal(
    /https?:\/\/|@import\b/i.test(cssText),
    false,
    'out/docs/docs.css must not contain external URLs or @import'
  );

  // Service worker pre-cache verification
  const swText = fs.readFileSync(path.join(outDir, 'sw.js'), 'utf8');
  assert.ok(swText.includes('./docs/index.html'), 'out/sw.js must pre-cache ./docs/index.html');
  assert.ok(swText.includes('./docs/docs.css'), 'out/sw.js must pre-cache ./docs/docs.css');
  for (const page of flatPages) {
    assert.ok(
      swText.includes(`./docs/${page.slug}.html`),
      `out/sw.js must pre-cache ./docs/${page.slug}.html`
    );
  }

  console.log(`[PASS] 4. Offline-first check passed (${checkedHtml.length} HTML files + docs.css + sw.js pre-cache, 0 external assets)`);
}

// 5. Portal Navigation Reachability (/docs/)
{
  const portalFiles = [
    'index.html',
    'demo/index.html',
    'cases/index.html',
    'cases/ashland-oregon-white-oak/index.html',
    'ordinances/index.html',
    'tools/index.html',
    'mcp/index.html',
    'spec/index.html',
    'methods/index.html',
  ];

  for (const rel of portalFiles) {
    const full = path.join(outDir, rel);
    assert.ok(fs.existsSync(full), `Portal file missing: out/${rel}`);
    const html = fs.readFileSync(full, 'utf8');
    assert.ok(
      html.includes('docs/index.html'),
      `Portal route out/${rel} must include navigation link to docs/index.html`
    );
  }

  const nginxConf = fs.readFileSync(path.join(rootDir, 'deploy/nginx.conf'), 'utf8');
  assert.ok(nginxConf.includes('location = /docs'), 'deploy/nginx.conf must route /docs');
  assert.ok(nginxConf.includes('location = /docs/'), 'deploy/nginx.conf must route /docs/');

  console.log(`[PASS] 5. Portal navigation & nginx /docs/ routing verified across ${portalFiles.length} portal routes`);
}

// 6. Version Mismatch Warning, Fail-Loudly Renderer & Dead-Link Sabotage Gates
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarbor-docs-test-'));
  try {
    const tmpDocs = path.join(tmpDir, 'docs');
    const tmpOut = path.join(tmpDir, 'out');
    fs.mkdirSync(tmpDocs, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'openarbor-test', version: '2.1.0' }),
      'utf8'
    );
    fs.writeFileSync(
      path.join(tmpDocs, 'manifest.json'),
      JSON.stringify({
        title: 'Temp Docs',
        version: '2.5',
        sections: [
          {
            title: 'Test',
            pages: [{ title: 'Sample', file: 'SAMPLE.md' }],
          },
        ],
      }),
      'utf8'
    );
    fs.writeFileSync(
      path.join(tmpDocs, 'SAMPLE.md'),
      '# Sample\n\nOpen Arbor v9.9.9 documentation sample.\n',
      'utf8'
    );

    const res = buildDocs(tmpDir, tmpOut, { silent: true });
    assert.equal(res.version, '2.1.0');
    assert.ok(
      res.warnings.some((w) => w.includes('2.1.0') && w.includes('2.5') && w.includes('package.json') && w.includes('docs/manifest.json')),
      `Expected manifest version warning naming 2.1.0, 2.5, package.json, and docs/manifest.json; got: ${res.warnings.join('; ')}`
    );
    assert.ok(
      res.warnings.some((w) => w.includes('2.1.0') && w.includes('9.9.9') && w.includes('package.json') && w.includes('docs/SAMPLE.md')),
      `Expected page version warning naming 2.1.0, 9.9.9, package.json, and docs/SAMPLE.md; got: ${res.warnings.join('; ')}`
    );

    // Unsupported Markdown constructs must throw loudly
    assert.throws(
      () => renderMarkdown('~~~\ntilde fence\n~~~', { file: 'BAD.md' }),
      /Unsupported Markdown construct: tilde code fence/
    );
    assert.throws(
      () => renderMarkdown('<div>raw html</div>', { file: 'BAD.md' }),
      /Unsupported Markdown construct: raw HTML/
    );
    assert.throws(
      () => renderMarkdown('```js\nunclosed block', { file: 'BAD.md' }),
      /Unclosed fenced code block/
    );

    // Dead internal link must fail
    assert.throws(
      () => assertInternalMarkdownLinksResolve('See [Missing](NONEXISTENT_PAGE.md).', 'SAMPLE.md', tmpDocs, ''),
      /Dead internal link/
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('[PASS] 6. Version mismatch warnings, fail-loudly Markdown parser, and dead-link sabotage gates verified');
}

console.log('\nALL OPENARBOR DOCUMENTATION VERIFICATION CHECKS PASSED.');
