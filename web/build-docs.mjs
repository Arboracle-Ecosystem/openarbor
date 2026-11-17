#!/usr/bin/env node
/**
 * Open Arbor Static Documentation Site Generator (web/build-docs.mjs)
 *
 * Reads docs/manifest.json, renders listed Markdown pages using a zero-dependency
 * CommonMark/GFM subset parser with fail-loudly guards, writes out/docs/docs.css,
 * out/docs/index.html, and out/docs/<slug>.html, rewrites internal .md links to .html,
 * reports external-to-docs links, and checks version consistency against package.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT_DIR = path.resolve(__dirname, '..');

const SECTION_DESCRIPTIONS = {
  Start:
    'Scope, primary citations, boundaries, and a five-minute local walkthrough from clone to compiled assessment.',
  'Field work':
    'Regenerative Consulting Arborist practice specification, five diagnostic domains, and Mattheck shell biomechanics.',
  'Municipal codes':
    'Step-by-step instructions and working JSON example for contributing a verified city tree protection ordinance.',
  Platform:
    'Complete directory of CLI tools, core ESM engines, verification suites, schemas, datasets, and documentation design.',
  Reference:
    'Foundational Arboracle strategic and technical platform blueprint preserved as architectural background.',
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isAsciiPunctuation(ch) {
  return Boolean(ch && /^[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]$/.test(ch));
}

function unescapeMarkdown(text) {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\\' && i + 1 < text.length && isAsciiPunctuation(text[i + 1])) {
      out += text[i + 1];
      i += 1;
    } else {
      out += text[i];
    }
  }
  return out;
}

function stripInlineFormattingForSlug(text) {
  let cleaned = unescapeMarkdown(text)
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '');
  return cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nextUniqueSlug(rawText, slugCounts) {
  const base = stripInlineFormattingForSlug(rawText) || 'section';
  const count = slugCounts.get(base) || 0;
  slugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

/**
 * Rewrite relative links inside docs/.
 * Links pointing to *.md inside docs/ become *.html.
 * Links pointing outside docs/ are left unchanged and logged.
 */
export function rewriteDocHref(rawHref, ctx, lineNo) {
  const href = String(rawHref || '').trim();
  if (!href) {
    throw new Error(`${ctx.file}:${lineNo}: Empty link target is not allowed.`);
  }
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) {
    return href;
  }

  let pathPart = href;
  let suffix = '';
  const hashIdx = pathPart.indexOf('#');
  if (hashIdx !== -1) {
    suffix = pathPart.slice(hashIdx);
    pathPart = pathPart.slice(0, hashIdx);
  }
  const queryIdx = pathPart.indexOf('?');
  if (queryIdx !== -1) {
    suffix = pathPart.slice(queryIdx) + suffix;
    pathPart = pathPart.slice(0, queryIdx);
  }

  if (!pathPart) {
    return href;
  }

  const currentDocDir = path.dirname(path.join(ctx.docsSrcDir, ctx.file));
  const resolvedAbs = path.resolve(currentDocDir, pathPart);
  const relFromDocs = path.relative(ctx.docsSrcDir, resolvedAbs);

  if (relFromDocs.startsWith('..') || path.isAbsolute(relFromDocs)) {
    const repoRel = path.relative(ctx.rootDir, resolvedAbs).replace(/\\/g, '/');
    const key = `${ctx.file}::${href}`;
    if (!ctx.seenOutsideLinks.has(key)) {
      ctx.seenOutsideLinks.add(key);
      ctx.outsideLinks.push({
        sourceFile: `docs/${ctx.file}`,
        href,
        resolvedRepoPath: repoRel,
        lineNo,
      });
    }
    return href;
  }

  if (pathPart.endsWith('.md')) {
    const baseStem = path.basename(pathPart, '.md');
    const targetDirRel = path.dirname(relFromDocs);
    const rewrittenPath =
      targetDirRel === '.'
        ? `${baseStem}.html`
        : `${targetDirRel.replace(/\\/g, '/')}/${baseStem}.html`;
    return `${rewrittenPath}${suffix}`;
  }

  return href;
}

function findMatchingBacktick(text, startIdx) {
  let tickCount = 0;
  while (startIdx + tickCount < text.length && text[startIdx + tickCount] === '`') {
    tickCount += 1;
  }
  let pos = startIdx + tickCount;
  while (pos < text.length) {
    if (text[pos] === '`') {
      let run = 0;
      while (pos + run < text.length && text[pos + run] === '`') {
        run += 1;
      }
      if (run === tickCount) {
        return {
          content: text.slice(startIdx + tickCount, pos),
          endIdx: pos + run,
        };
      }
      pos += run;
    } else {
      pos += 1;
    }
  }
  return null;
}

function findClosingBracket(text, openIdx) {
  let depth = 0;
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      i += 2;
      continue;
    }
    if (ch === '`') {
      const codeSpan = findMatchingBacktick(text, i);
      if (!codeSpan) return -1;
      i = codeSpan.endIdx;
      continue;
    }
    if (ch === '[') {
      depth += 1;
    } else if (ch === ']') {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

function findClosingParen(text, openParenIdx) {
  let depth = 0;
  let i = openParenIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      i += 2;
      continue;
    }
    if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

function findClosingMarker(text, startIdx, marker, ctx, lineNo) {
  let i = startIdx;
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      i += 2;
      continue;
    }
    if (text[i] === '`') {
      const span = findMatchingBacktick(text, i);
      if (!span) {
        throw new Error(`${ctx.file}:${lineNo}: Unclosed inline code span.`);
      }
      i = span.endIdx;
      continue;
    }
    if (marker === '**' && text.startsWith('**', i)) {
      return i;
    }
    if (marker === '*' && text[i] === '*' && !text.startsWith('**', i)) {
      return i;
    }
    i += 1;
  }
  return -1;
}

function parseMarkdownImageAt(text, startIdx, ctx, lineNo) {
  if (!text.startsWith('![', startIdx)) return null;
  const closeBracket = findClosingBracket(text, startIdx + 1);
  if (closeBracket === -1 || text[closeBracket + 1] !== '(') {
    throw new Error(`${ctx.file}:${lineNo}: Malformed image syntax.`);
  }
  const closeParen = findClosingParen(text, closeBracket + 1);
  if (closeParen === -1) {
    throw new Error(`${ctx.file}:${lineNo}: Unclosed image URL parenthesis.`);
  }
  const alt = unescapeMarkdown(text.slice(startIdx + 2, closeBracket));
  const rawSrc = unescapeMarkdown(text.slice(closeBracket + 2, closeParen).trim());
  const isRemote = rawSrc.startsWith('https://') || rawSrc.startsWith('http://');
  if (!isRemote) {
    throw new Error(
      `${ctx.file}:${lineNo}: Unsupported local Markdown image "${rawSrc}".`
    );
  }
  return {
    alt,
    src: rawSrc,
    endIdx: closeParen + 1,
  };
}

export function renderInline(text, ctx, lineNo) {
  let out = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // 1. Backslash escapes
    if (ch === '\\' && i + 1 < text.length && isAsciiPunctuation(text[i + 1])) {
      out += escapeHtml(text[i + 1]);
      i += 2;
      continue;
    }

    // 2. Inline code spans
    if (ch === '`') {
      const span = findMatchingBacktick(text, i);
      if (!span) {
        throw new Error(`${ctx.file}:${lineNo}: Unclosed inline code backtick.`);
      }
      out += `<code>${escapeHtml(span.content)}</code>`;
      i = span.endIdx;
      continue;
    }

    // 3. Linked external shields/badges [![alt](https://...)](href) rendered offline without <img>
    if (text.startsWith('[![', i)) {
      const closeOuter = findClosingBracket(text, i);
      if (closeOuter !== -1 && text[closeOuter + 1] === '(') {
        const innerImg = parseMarkdownImageAt(text, i + 1, ctx, lineNo);
        const closeHref = findClosingParen(text, closeOuter + 1);
        if (innerImg && innerImg.endIdx === closeOuter && closeHref !== -1) {
          const rawHref = unescapeMarkdown(
            text.slice(closeOuter + 2, closeHref).trim()
          );
          const rewritten = rewriteDocHref(rawHref, ctx, lineNo);
          out += `<a href="${escapeHtml(
            rewritten
          )}" class="doc-badge-link"><span class="doc-badge">${escapeHtml(
            innerImg.alt
          )}</span></a>`;
          i = closeHref + 1;
          continue;
        }
      }
    }

    // 4. Standalone external badge image
    if (text.startsWith('![', i)) {
      const img = parseMarkdownImageAt(text, i, ctx, lineNo);
      out += `<span class="doc-badge">${escapeHtml(img.alt)}</span>`;
      i = img.endIdx;
      continue;
    }

    // 5. Links [label](href)
    if (ch === '[') {
      if (text.startsWith('[^', i)) {
        throw new Error(
          `${ctx.file}:${lineNo}: Unsupported Markdown construct: footnote syntax.`
        );
      }
      const closeBracket = findClosingBracket(text, i);
      if (closeBracket !== -1) {
        if (text[closeBracket + 1] === '[') {
          throw new Error(
            `${ctx.file}:${lineNo}: Unsupported Markdown construct: reference-style link.`
          );
        }
        if (text[closeBracket + 1] === '(') {
          const closeParen = findClosingParen(text, closeBracket + 1);
          if (closeParen === -1) {
            throw new Error(`${ctx.file}:${lineNo}: Unclosed link parenthesis.`);
          }
          const labelRaw = text.slice(i + 1, closeBracket);
          const destRaw = unescapeMarkdown(
            text.slice(closeBracket + 2, closeParen).trim()
          );
          const href = rewriteDocHref(destRaw, ctx, lineNo);
          const labelHtml = renderInline(labelRaw, ctx, lineNo);
          out += `<a href="${escapeHtml(href)}">${labelHtml}</a>`;
          i = closeParen + 1;
          continue;
        }
      }
    }

    // 6. Reject strikethrough and math inline constructs
    if (text.startsWith('~~', i)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: strikethrough (~~).`
      );
    }
    if (text.startsWith('$$', i)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: math block ($$).`
      );
    }

    // 7. Reject unescaped raw HTML comments or tags outside code spans
    if (ch === '<') {
      const slice = text.slice(i);
      if (slice.startsWith('<!--') || /^<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s|>|\/)/.test(slice)) {
        throw new Error(
          `${ctx.file}:${lineNo}: Unsupported Markdown construct: raw HTML "${slice.slice(
            0,
            24
          )}".`
        );
      }
      if (/^<https?:\/\//.test(slice)) {
        throw new Error(
          `${ctx.file}:${lineNo}: Unsupported Markdown construct: angle-bracket autolink.`
        );
      }
    }

    // 8. Bold **...**
    if (text.startsWith('**', i)) {
      const closeBold = findClosingMarker(text, i + 2, '**', ctx, lineNo);
      if (closeBold === -1) {
        throw new Error(`${ctx.file}:${lineNo}: Unclosed bold marker (**).`);
      }
      const inner = renderInline(text.slice(i + 2, closeBold), ctx, lineNo);
      out += `<strong>${inner}</strong>`;
      i = closeBold + 2;
      continue;
    }

    // 9. Italic *...*
    if (ch === '*') {
      const closeEm = findClosingMarker(text, i + 1, '*', ctx, lineNo);
      if (closeEm !== -1) {
        const inner = renderInline(text.slice(i + 1, closeEm), ctx, lineNo);
        out += `<em>${inner}</em>`;
        i = closeEm + 1;
        continue;
      }
    }

    out += escapeHtml(ch);
    i += 1;
  }

  return out;
}

function splitTableCells(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) {
    trimmed = trimmed.slice(0, -1);
  }

  const cells = [];
  let current = '';
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch === '\\' && i + 1 < trimmed.length && trimmed[i + 1] === '|') {
      current += '|';
      i += 1;
      continue;
    }
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function isTableSeparatorRow(line) {
  const trimmed = line.trim();
  if (!trimmed.includes('|') && !/^:?-{3,}:?$/.test(trimmed)) {
    return false;
  }
  const cells = splitTableCells(trimmed);
  if (cells.length === 0) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTableAlignments(separatorLine) {
  return splitTableCells(separatorLine).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return 'left';
  });
}

function parseListItemLine(line) {
  const m = line.match(/^([ ]*)(\*|-|(\d+)\.)\s+(.*)$/);
  if (!m) return null;
  const indent = m[1].length;
  const isOrdered = Boolean(m[3]);
  const text = m[4];
  if (/^\[[ xX]\](?:\s|$)/.test(text)) {
    return { taskList: true, indent, type: isOrdered ? 'ol' : 'ul', text };
  }
  return {
    taskList: false,
    indent,
    type: isOrdered ? 'ol' : 'ul',
    startNum: isOrdered ? Number(m[3]) : null,
    text,
  };
}

function isBlockBoundaryLine(trimmed) {
  if (!trimmed) return true;
  if (/^```/.test(trimmed) || /^~~~/.test(trimmed)) return true;
  if (/^#{1,6}\s+/.test(trimmed)) return true;
  if (/^---+\s*$/.test(trimmed) || /^\*\*\*+\s*$/.test(trimmed)) return true;
  if (/^>/.test(trimmed)) return true;
  if (/^\|.*\|$/.test(trimmed)) return true;
  return false;
}

function formatTextLinesHtml(textLines, ctx) {
  const parts = [];
  for (let i = 0; i < textLines.length; i += 1) {
    const entry = textLines[i];
    const hasHardBreak = / {2}$/.test(entry.text);
    const cleaned = entry.text.replace(/ +$/, '').trimStart();
    parts.push(renderInline(cleaned, ctx, entry.lineNo));
    if (i < textLines.length - 1) {
      parts.push(hasHardBreak ? '<br />\n' : ' ');
    }
  }
  return parts.join('');
}

function renderListNodeHtml(listNode, ctx) {
  const tag = listNode.type;
  const startAttr =
    tag === 'ol' && listNode.startNum && listNode.startNum !== 1
      ? ` start="${listNode.startNum}"`
      : '';
  const itemsHtml = listNode.items
    .map((item) => {
      const mainHtml = formatTextLinesHtml(item.textLines, ctx);
      const childrenHtml = item.subLists
        .map((sub) => `\n${renderListNodeHtml(sub, ctx)}`)
        .join('');
      return `<li>${mainHtml}${childrenHtml}</li>`;
    })
    .join('\n');
  return `<${tag}${startAttr}>\n${itemsHtml}\n</${tag}>`;
}

/**
 * Render a Markdown document into semantic HTML and collect heading metadata.
 * Fails loudly on unsupported Markdown constructs.
 */
export function renderMarkdown(markdown, options = {}) {
  const ctx = {
    file: options.file || 'document.md',
    rootDir: options.rootDir || DEFAULT_ROOT_DIR,
    docsSrcDir: options.docsSrcDir || path.join(DEFAULT_ROOT_DIR, 'docs'),
    outsideLinks: options.outsideLinks || [],
    seenOutsideLinks: options.seenOutsideLinks || new Set(),
  };

  const normalized = String(markdown || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const slugCounts = new Map();
  const headings = [];
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const lineNo = i + 1;
    const trimmed = rawLine.trim();

    // Blank line
    if (trimmed === '') {
      i += 1;
      continue;
    }

    // Disallow tab indentation at block start
    if (/^\t/.test(rawLine)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: tab-indented block.`
      );
    }

    // Blockquotes
    if (/^\s*>/.test(rawLine)) {
      const quoted = [];
      const quotedNos = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ''));
        quotedNos.push(i + 1);
        i += 1;
      }
      const quotedLines = quoted.map((text, idx) => ({ text, lineNo: quotedNos[idx] }));
      blocks.push(`<blockquote><p>${formatTextLinesHtml(quotedLines, ctx)}</p></blockquote>`);
      continue;
    }

    // Disallow tilde code fences
    if (/^\s*~~~/.test(rawLine)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: tilde code fence.`
      );
    }

    // Disallow reference link definitions
    if (/^\s*\[[^\]]+\]:\s+\S+/.test(rawLine)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: reference link definition.`
      );
    }

    // Disallow math fences
    if (/^\s*\$\$/.test(rawLine)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: math fence ($$).`
      );
    }

    // Fenced code blocks
    if (/^\s*```/.test(rawLine)) {
      const fenceMatch = rawLine.match(/^\s*```([a-zA-Z0-9_.-]*)\s*$/);
      if (!fenceMatch) {
        throw new Error(
          `${ctx.file}:${lineNo}: Unsupported fenced code header "${rawLine.trim()}".`
        );
      }
      const lang = fenceMatch[1] || '';
      const codeLines = [];
      let closed = false;
      i += 1;
      while (i < lines.length) {
        if (/^\s*```\s*$/.test(lines[i])) {
          closed = true;
          i += 1;
          break;
        }
        codeLines.push(lines[i]);
        i += 1;
      }
      if (!closed) {
        throw new Error(
          `${ctx.file}:${lineNo}: Unclosed fenced code block starting at line ${lineNo}.`
        );
      }
      const codeBody = escapeHtml(codeLines.join('\n'));
      if (lang) {
        blocks.push(
          `<div class="doc-code-block" data-lang="${escapeHtml(lang)}">` +
            `<div class="doc-code-header"><span class="doc-code-lang">${escapeHtml(
              lang
            )}</span></div>` +
            `<pre><code class="language-${escapeHtml(lang)}">${codeBody}</code></pre></div>`
        );
      } else {
        blocks.push(
          `<div class="doc-code-block"><pre><code>${codeBody}</code></pre></div>`
        );
      }
      continue;
    }

    // Disallow root-level 4-space indented code blocks
    if (/^ {4,}\S/.test(rawLine)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: 4-space indented code block.`
      );
    }

    // Horizontal rules
    if (/^---+\s*$/.test(trimmed)) {
      blocks.push('<hr />');
      i += 1;
      continue;
    }

    // ATX Headings
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const textRaw = headingMatch[2];
      const slug = nextUniqueSlug(textRaw, slugCounts);
      const innerHtml = renderInline(textRaw, ctx, lineNo);
      headings.push({ level, id: slug, text: unescapeMarkdown(textRaw) });
      blocks.push(`<h${level} id="${escapeHtml(slug)}">${innerHtml}</h${level}>`);
      i += 1;
      continue;
    }

    // GFM Tables
    if (/^\|.*\|$/.test(trimmed) || (trimmed.includes('|') && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1]))) {
      if (i + 1 >= lines.length || !isTableSeparatorRow(lines[i + 1])) {
        throw new Error(
          `${ctx.file}:${lineNo}: Malformed Markdown table missing separator row.`
        );
      }
      const headerCells = splitTableCells(rawLine);
      const alignments = parseTableAlignments(lines[i + 1]);
      if (headerCells.length !== alignments.length) {
        throw new Error(
          `${ctx.file}:${lineNo}: Table header column count (${headerCells.length}) does not match separator (${alignments.length}).`
        );
      }
      i += 2;
      const bodyRows = [];
      while (i < lines.length) {
        const rowLine = lines[i];
        const rowTrimmed = rowLine.trim();
        if (!rowTrimmed || !rowTrimmed.startsWith('|')) {
          break;
        }
        const cells = splitTableCells(rowLine);
        if (cells.length !== headerCells.length) {
          throw new Error(
            `${ctx.file}:${i + 1}: Table row has ${cells.length} cells, expected ${headerCells.length}.`
          );
        }
        bodyRows.push({ cells, lineNo: i + 1 });
        i += 1;
      }

      const cssLabelVars = headerCells
        .map((cell, idx) => {
          const plain = unescapeMarkdown(cell).replace(/`/g, '').replace(/"/g, "'");
          return `--col-${idx + 1}: "${plain}"`;
        })
        .join('; ');
      const theadHtml = headerCells
        .map((cell, idx) => {
          const align = alignments[idx];
          return `<th scope="col" class="align-${align}">${renderInline(
            cell,
            ctx,
            lineNo
          )}</th>`;
        })
        .join('');
      const tbodyHtml = bodyRows
        .map((row) => {
          const tds = row.cells
            .map((cell, idx) => {
              const align = alignments[idx];
              const rendered = renderInline(cell, ctx, row.lineNo);
              if (idx === 0) {
                return `<th scope="row" class="align-${align}">${rendered}</th>`;
              }
              const plainCol = unescapeMarkdown(headerCells[idx]).replace(/`/g, '');
              return `<td class="align-${align}" data-label="${escapeHtml(
                plainCol
              )}">${rendered}</td>`;
            })
            .join('');
          return `<tr>${tds}</tr>`;
        })
        .join('\n');

      const tableCaption =
        headings.length > 0
          ? `${headings[headings.length - 1].text} table`
          : 'Reference table';
      blocks.push(
        `<div tabindex="0" role="region" aria-label="${escapeHtml(
          tableCaption
        )}" class="doc-table-wrapper">\n` +
          `<table style="${escapeHtml(cssLabelVars)}">\n` +
          `<thead><tr>${theadHtml}</tr></thead>\n` +
          `<tbody>\n${tbodyHtml}\n</tbody>\n` +
          `</table>\n</div>`
      );
      continue;
    }

    // Ordered or Unordered Lists (with nesting and single-blank-line continuity)
    const firstListItem = parseListItemLine(rawLine);
    if (firstListItem) {
      if (firstListItem.taskList) {
        throw new Error(
          `${ctx.file}:${lineNo}: Unsupported Markdown construct: task list.`
        );
      }
      const rootList = {
        type: firstListItem.type,
        indent: firstListItem.indent,
        startNum: firstListItem.startNum,
        items: [
          {
            textLines: [{ text: firstListItem.text, lineNo }],
            subLists: [],
          },
        ],
      };
      const stack = [rootList];
      i += 1;

      while (i < lines.length) {
        const curRaw = lines[i];
        const curLineNo = i + 1;
        const curTrim = curRaw.trim();

        if (curTrim === '') {
          let look = i + 1;
          while (look < lines.length && lines[look].trim() === '') {
            look += 1;
          }
          if (look >= lines.length) {
            i = look;
            break;
          }
          const nextItem = parseListItemLine(lines[look]);
          if (
            nextItem &&
            !nextItem.taskList &&
            (nextItem.indent > stack[0].indent ||
              (nextItem.indent === stack[0].indent && nextItem.type === stack[0].type))
          ) {
            i = look;
            continue;
          }
          i += 1;
          break;
        }

        if (isBlockBoundaryLine(curTrim)) {
          break;
        }

        const parsedItem = parseListItemLine(curRaw);
        if (parsedItem) {
          if (parsedItem.taskList) {
            throw new Error(
              `${ctx.file}:${curLineNo}: Unsupported Markdown construct: task list.`
            );
          }
          let top = stack[stack.length - 1];
          if (parsedItem.indent > top.indent) {
            const parentItem = top.items[top.items.length - 1];
            const childList = {
              type: parsedItem.type,
              indent: parsedItem.indent,
              startNum: parsedItem.startNum,
              items: [
                {
                  textLines: [{ text: parsedItem.text, lineNo: curLineNo }],
                  subLists: [],
                },
              ],
            };
            parentItem.subLists.push(childList);
            stack.push(childList);
          } else {
            while (
              stack.length > 1 &&
              stack[stack.length - 1].indent > parsedItem.indent
            ) {
              stack.pop();
            }
            top = stack[stack.length - 1];
            if (parsedItem.indent < top.indent || parsedItem.type !== top.type) {
              if (stack.length === 1) {
                break;
              }
              stack.pop();
              const parent = stack[stack.length - 1];
              const parentItem = parent.items[parent.items.length - 1];
              const siblingList = {
                type: parsedItem.type,
                indent: parsedItem.indent,
                startNum: parsedItem.startNum,
                items: [
                  {
                    textLines: [{ text: parsedItem.text, lineNo: curLineNo }],
                    subLists: [],
                  },
                ],
              };
              parentItem.subLists.push(siblingList);
              stack.push(siblingList);
            } else {
              top.items.push({
                textLines: [{ text: parsedItem.text, lineNo: curLineNo }],
                subLists: [],
              });
            }
          }
          i += 1;
          continue;
        }

        // Continuation line inside current list item
        const activeList = stack[stack.length - 1];
        const activeItem = activeList.items[activeList.items.length - 1];
        activeItem.textLines.push({ text: curRaw, lineNo: curLineNo });
        i += 1;
      }

      blocks.push(renderListNodeHtml(rootList, ctx));
      continue;
    }

    // Raw HTML block guard outside code blocks
    if (/^\s*<(?:!--|\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s|>|\/))/.test(rawLine)) {
      throw new Error(
        `${ctx.file}:${lineNo}: Unsupported Markdown construct: raw HTML block.`
      );
    }

    // Paragraph (consecutive non-boundary lines)
    const paraLines = [{ text: rawLine, lineNo }];
    i += 1;
    while (i < lines.length) {
      const pRaw = lines[i];
      const pLineNo = i + 1;
      const pTrim = pRaw.trim();
      if (pTrim === '' || isBlockBoundaryLine(pTrim)) {
        break;
      }
      if (/^ {4,}\S/.test(pRaw)) {
        break;
      }
      if (parseListItemLine(pRaw)) {
        break;
      }
      if (
        pTrim.includes('|') &&
        i + 1 < lines.length &&
        isTableSeparatorRow(lines[i + 1])
      ) {
        break;
      }
      // Reject Setext headings on second line
      if (/^(?:=+|-+)\s*$/.test(pTrim) && paraLines.length === 1) {
        if (/^=+\s*$/.test(pTrim)) {
          throw new Error(
            `${ctx.file}:${pLineNo}: Unsupported Markdown construct: setext heading.`
          );
        }
        break;
      }
      paraLines.push({ text: pRaw, lineNo: pLineNo });
      i += 1;
    }

    blocks.push(`<p>${formatTextLinesHtml(paraLines, ctx)}</p>`);
  }

  return {
    html: blocks.join('\n\n'),
    headings,
    outsideLinks: ctx.outsideLinks,
  };
}

function extractFirstSummary(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  let inFence = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (t.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !t) continue;
    if (/^#{1,6}\s+/.test(t)) continue;
    if (/^\[!\[/.test(t) || /^---+$/.test(t) || /^\|/.test(t) || /^[*+-]\s+/.test(t)) {
      continue;
    }
    const plain = unescapeMarkdown(t)
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();
    if (!plain) continue;
    if (plain.length <= 160) return plain;
    const firstSentence = plain.match(/^[^.!?]+[.!?]/);
    if (firstSentence && firstSentence[0].length <= 160) {
      return firstSentence[0].trim();
    }
    const cut = plain.slice(0, 157);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
  }
  return '';
}

function detectPageVersions(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const found = new Set();
  let inFence = false;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const withoutCode = raw.replace(/`[^`]*`/g, '');
    const patterns = [
      /\bOpen\s*Arbor(?:\s+version)?\s+v?(\d+\.\d+(?:\.\d+)?)\b/gi,
      /^\s*\*{0,2}(?:Open\s*Arbor\s+)?Version\s*:?\*{0,2}\s*v?(\d+\.\d+(?:\.\d+)?)\b/gi,
    ];
    for (const re of patterns) {
      for (const m of withoutCode.matchAll(re)) {
        if (m[1]) found.add(m[1]);
      }
    }
  }
  return [...found];
}

function buildDocsStylesheet() {
  return `/**
 * Open Arbor Documentation Stylesheet (out/docs/docs.css)
 * Self-contained offline-first botanical palette matching the Open Arbor portal.
 */

:root {
  color-scheme: light dark;

  --doc-bg-light: #f6f5ef;
  --doc-surface-light: #ffffff;
  --doc-elevated-light: #edece3;
  --doc-text-light: #0d1f12;
  --doc-muted-light: #3b5543;
  --doc-border-light: #2b5f44;
  --doc-border-subtle-light: #c5d4c7;
  --doc-accent-light: #145938;
  --doc-accent-soft-light: #e2f2e8;
  --doc-code-bg-light: #ecebe2;
  --doc-btn-text-light: #ffffff;

  --doc-bg-dark: #08110b;
  --doc-surface-dark: #0e1f13;
  --doc-elevated-dark: #142a1a;
  --doc-text-dark: #f5f0e8;
  --doc-muted-dark: #b7c9bd;
  --doc-border-dark: #2d6a4f;
  --doc-border-subtle-dark: #1e4633;
  --doc-accent-dark: #74c69d;
  --doc-accent-soft-dark: #13301c;
  --doc-code-bg-dark: #050b06;
  --doc-btn-text-dark: #061108;

  --bg-deep: var(--doc-bg-light);
  --bg-card: var(--doc-surface-light);
  --bg-elevated: var(--doc-elevated-light);
  --text-main: var(--doc-text-light);
  --text-muted: var(--doc-muted-light);
  --border-main: var(--doc-border-light);
  --border-subtle: var(--doc-border-subtle-light);
  --accent-bright: var(--doc-accent-light);
  --highlight-bg: var(--doc-accent-soft-light);
  --code-bg: var(--doc-code-bg-light);
  --btn-primary-text: var(--doc-btn-text-light);
  --radius-sm: 6px;
  --radius-md: 10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-deep: var(--doc-bg-dark);
    --bg-card: var(--doc-surface-dark);
    --bg-elevated: var(--doc-elevated-dark);
    --text-main: var(--doc-text-dark);
    --text-muted: var(--doc-muted-dark);
    --border-main: var(--doc-border-dark);
    --border-subtle: var(--doc-border-subtle-dark);
    --accent-bright: var(--doc-accent-dark);
    --highlight-bg: var(--doc-accent-soft-dark);
    --code-bg: var(--doc-code-bg-dark);
    --btn-primary-text: var(--doc-btn-text-dark);
  }
}

@supports (color: light-dark(white, black)) {
  :root {
    --bg-deep: light-dark(var(--doc-bg-light), var(--doc-bg-dark));
    --bg-card: light-dark(var(--doc-surface-light), var(--doc-surface-dark));
    --bg-elevated: light-dark(var(--doc-elevated-light), var(--doc-elevated-dark));
    --text-main: light-dark(var(--doc-text-light), var(--doc-text-dark));
    --text-muted: light-dark(var(--doc-muted-light), var(--doc-muted-dark));
    --border-main: light-dark(var(--doc-border-light), var(--doc-border-dark));
    --border-subtle: light-dark(var(--doc-border-subtle-light), var(--doc-border-subtle-dark));
    --accent-bright: light-dark(var(--doc-accent-light), var(--doc-accent-dark));
    --highlight-bg: light-dark(var(--doc-accent-soft-light), var(--doc-accent-soft-dark));
    --code-bg: light-dark(var(--doc-code-bg-light), var(--doc-code-bg-dark));
    --btn-primary-text: light-dark(var(--doc-btn-text-light), var(--doc-btn-text-dark));
  }
}

:root:has(> head > meta[name="color-scheme"][content="dark"]) {
  color-scheme: dark;
}

:root:has(> head > meta[name="color-scheme"][content="light"]) {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-deep);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent-bright);
  text-underline-offset: 0.18em;
}

a:focus-visible,
button:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--accent-bright);
  outline-offset: 2px;
}

.oa-site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-main);
  padding: 10px 0;
}

.oa-nav-container {
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.oa-brand-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 700;
  font-size: 1.05rem;
}

.oa-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--border-main);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.oa-brand-text small {
  font-size: 0.78rem;
  color: var(--accent-bright);
  font-weight: 700;
}

.oa-main-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.oa-nav-link {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.oa-nav-link:hover {
  color: var(--text-main);
  background: var(--bg-elevated);
}

.oa-nav-link[aria-current="page"],
.oa-nav-link.active {
  color: var(--text-main);
  background: var(--highlight-bg);
  border-color: var(--accent-bright);
  font-weight: 700;
}

.oa-theme-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-theme-btn {
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-main);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.doc-theme-btn:hover {
  border-color: var(--accent-bright);
}

.doc-layout {
  max-width: 1220px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.doc-sidebar {
  position: sticky;
  top: 72px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
}

.doc-sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.doc-sidebar-home {
  font-weight: 700;
  text-decoration: none;
  color: var(--text-main);
  font-size: 0.94rem;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
}

.doc-sidebar-home[aria-current="page"] {
  background: var(--highlight-bg);
  border-left-color: var(--accent-bright);
}

.doc-version-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--highlight-bg);
  border: 1px solid var(--border-subtle);
  color: var(--accent-bright);
  font-size: 0.76rem;
  font-weight: 700;
}

.doc-sidebar-section {
  margin: 16px 0 6px;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.doc-sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.doc-sidebar-link {
  display: block;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
}

.doc-sidebar-link:hover {
  background: var(--bg-elevated);
  color: var(--text-main);
}

.doc-sidebar-link[aria-current="page"] {
  background: var(--highlight-bg);
  border-left-color: var(--accent-bright);
  color: var(--text-main);
  font-weight: 700;
}

.doc-main {
  min-width: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 28px 32px;
}

.doc-article {
  max-width: 78ch;
}

.doc-meta-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.84rem;
  color: var(--text-muted);
}

.doc-article h1,
.doc-article h2,
.doc-article h3,
.doc-article h4 {
  line-height: 1.25;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  color: var(--text-main);
}

.doc-article h1 {
  margin-top: 0;
  font-size: 1.95rem;
}

.doc-article h2 {
  font-size: 1.38rem;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
}

.doc-article h3 {
  font-size: 1.12rem;
}

.doc-article p {
  margin: 0.9em 0;
}

.doc-article ul,
.doc-article ol {
  margin: 0.7em 0;
  padding-left: 1.5rem;
}

.doc-article li {
  margin: 0.35em 0;
}

.doc-article hr {
  border: 0;
  border-top: 1px solid var(--border-subtle);
  margin: 28px 0;
}

.doc-article code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.88em;
  background: var(--code-bg);
  padding: 0.14em 0.38em;
  border-radius: 4px;
  overflow-wrap: anywhere;
}

.doc-code-block {
  margin: 16px 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--code-bg);
  overflow: hidden;
}

.doc-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.doc-code-block pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  font-size: 0.86rem;
  line-height: 1.5;
}

.doc-code-block pre code {
  background: transparent;
  padding: 0;
  font-size: inherit;
  overflow-wrap: normal;
}

.doc-badge-link {
  text-decoration: none;
  margin-right: 6px;
  display: inline-block;
  margin-bottom: 4px;
}

.doc-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--highlight-bg);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
}

.doc-table-wrapper {
  margin: 18px 0;
  overflow: auto;
  max-inline-size: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  container-type: inline-size;
}

.doc-table-wrapper table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
}

.doc-table-wrapper th,
.doc-table-wrapper td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: top;
  text-align: left;
}

.doc-table-wrapper thead th {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  background: var(--bg-elevated);
  font-weight: 700;
}

.doc-table-wrapper tbody th {
  font-weight: 600;
  background: var(--bg-card);
}

.doc-table-wrapper .align-center {
  text-align: center;
}

.doc-table-wrapper .align-right {
  text-align: right;
}

@container (width < 560px) {
  .doc-table-wrapper table,
  .doc-table-wrapper thead,
  .doc-table-wrapper tbody,
  .doc-table-wrapper tr,
  .doc-table-wrapper th,
  .doc-table-wrapper td {
    display: block;
  }

  .doc-table-wrapper thead {
    display: none;
  }

  .doc-table-wrapper tr {
    border-bottom: 2px solid var(--border-subtle);
    padding: 6px 0;
  }

  .doc-table-wrapper tbody th {
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }

  .doc-table-wrapper td[data-label]::before {
    content: attr(data-label) ": ";
    font-weight: 700;
    color: var(--text-muted);
  }
}

.doc-index-hero {
  margin-bottom: 24px;
}

.doc-index-sections {
  display: grid;
  gap: 18px;
}

.doc-index-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  background: var(--bg-deep);
}

.doc-index-card h2 {
  margin-top: 0;
  margin-bottom: 6px;
  border-bottom: 0;
  padding-bottom: 0;
  font-size: 1.2rem;
}

.doc-section-desc {
  margin: 0 0 12px;
  color: var(--text-muted);
}

.doc-index-page-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.doc-index-page-item {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.doc-index-page-item a {
  font-weight: 700;
  text-decoration: none;
}

.doc-index-page-item a:hover {
  text-decoration: underline;
}

.doc-index-page-item p {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.doc-pager {
  margin-top: 36px;
  padding-top: 18px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}

.doc-pager-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-deep);
  text-decoration: none;
  min-width: 180px;
}

.doc-pager-link:hover {
  border-color: var(--accent-bright);
  background: var(--bg-elevated);
}

.doc-pager-next {
  margin-left: auto;
  text-align: right;
}

.doc-pager-dir {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.doc-pager-title {
  font-weight: 700;
  color: var(--accent-bright);
}

.doc-footer {
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 16px 32px;
  font-size: 0.84rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .doc-layout {
    grid-template-columns: 1fr;
  }

  .doc-sidebar {
    position: static;
  }

  .doc-main {
    padding: 20px 18px;
  }
}

@media print {
  .oa-site-header,
  .doc-sidebar,
  .doc-pager,
  .doc-theme-btn {
    display: none;
  }

  .doc-layout {
    display: block;
    padding: 0;
  }

  .doc-main {
    border: 0;
    padding: 0;
  }
}
`;
}

function renderSidebarHtml(manifest, currentSlug, version) {
  const isOverview = currentSlug === 'index';
  const sectionsHtml = manifest.sections
    .map((section) => {
      const itemsHtml = section.pages
        .map((page) => {
          const isCurrent = page.slug === currentSlug;
          const activeAttr = isCurrent ? ' aria-current="page"' : '';
          return `        <li><a href="./${escapeHtml(
            page.slug
          )}.html" class="doc-sidebar-link${isCurrent ? ' active' : ''}"${activeAttr}>${escapeHtml(
            page.title
          )}</a></li>`;
        })
        .join('\n');
      return `      <h2 class="doc-sidebar-section">${escapeHtml(section.title)}</h2>
      <ul class="doc-sidebar-list">
${itemsHtml}
      </ul>`;
    })
    .join('\n');

  return `<aside class="doc-sidebar" aria-label="Documentation navigation">
      <div class="doc-sidebar-top">
        <a href="./index.html" class="doc-sidebar-home"${
          isOverview ? ' aria-current="page"' : ''
        }>Documentation Home</a>
        <span class="doc-version-pill">v${escapeHtml(version)}</span>
      </div>
${sectionsHtml}
    </aside>`;
}

function renderHeaderHtml(version) {
  return `<header class="oa-site-header">
    <div class="oa-nav-container">
      <a href="../index.html" class="oa-brand-link">
        <span class="oa-brand-mark">OA</span>
        <span class="oa-brand-text">Open Arbor <small>v${escapeHtml(version)}</small></span>
      </a>
      <nav class="oa-main-nav" aria-label="Primary Navigation">
        <a href="../index.html" class="oa-nav-link">Field Home</a>
        <a href="../demo/index.html" class="oa-nav-link">Field Studio</a>
        <a href="../cases/index.html" class="oa-nav-link">Case Studies</a>
        <a href="../ordinances/index.html" class="oa-nav-link">City Tree Laws</a>
        <a href="./index.html" class="oa-nav-link active" aria-current="page">Docs</a>
        <a href="../tools/index.html" class="oa-nav-link">Workbench</a>
        <a href="../mcp/index.html" class="oa-nav-link">MCP</a>
        <a href="../spec/index.html" class="oa-nav-link">Spec</a>
        <a href="../methods/index.html" class="oa-nav-link">Proof</a>
      </nav>
      <div class="oa-theme-control">
        <button type="button" id="oa-theme-toggle" class="doc-theme-btn" aria-label="Toggle color scheme">Theme: Auto</button>
      </div>
    </div>
  </header>`;
}

function renderDocumentShell({
  pageTitle,
  description,
  version,
  manifest,
  currentSlug,
  sectionLabel,
  bodyHtml,
  pagerHtml,
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <script>
      try {
        var s = localStorage.getItem('color-scheme');
        if (s === 'light' || s === 'dark') {
          document.querySelector('meta[name="color-scheme"]').content = s;
        }
      } catch (e) {}
    </script>
    <title>${escapeHtml(pageTitle)} | Open Arbor v${escapeHtml(version)} Documentation</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="stylesheet" href="./docs.css" />
  </head>
  <body>
    ${renderHeaderHtml(version)}
    <div class="doc-layout">
      ${renderSidebarHtml(manifest, currentSlug, version)}
      <main class="doc-main">
        <article class="doc-article">
          <div class="doc-meta-bar">
            <span>${escapeHtml(sectionLabel)}</span>
            <span>Open Arbor v${escapeHtml(version)} (from package.json)</span>
          </div>
          ${bodyHtml}
          ${pagerHtml || ''}
        </article>
      </main>
    </div>
    <footer class="doc-footer">
      Open Arbor Alliance Documentation v${escapeHtml(version)} | AGPL-3.0-only (code) and CC-BY-SA-4.0 (specifications and datasets). Works offline.
    </footer>
    <script>
      (function () {
        var btn = document.getElementById('oa-theme-toggle');
        var meta = document.querySelector('meta[name="color-scheme"]');
        var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };
        function getStored() {
          try { return localStorage.getItem('color-scheme'); } catch (e) { return null; }
        }
        function apply() {
          var stored = getStored();
          var sys = mql.matches ? 'dark' : 'light';
          var active = stored === 'light' || stored === 'dark' ? stored : sys;
          if (meta) meta.content = stored === 'light' || stored === 'dark' ? stored : 'light dark';
          document.documentElement.dataset.theme = active;
          if (btn) {
            btn.textContent = stored === 'dark' ? 'Theme: Dark' : stored === 'light' ? 'Theme: Light' : 'Theme: Auto (' + (sys === 'dark' ? 'Dark' : 'Light') + ')';
          }
        }
        apply();
        if (mql && mql.addEventListener) mql.addEventListener('change', apply);
        if (btn) {
          btn.addEventListener('click', function () {
            var stored = getStored();
            var sys = mql.matches ? 'dark' : 'light';
            var current = stored === 'light' || stored === 'dark' ? stored : sys;
            var next = current === 'dark' ? 'light' : 'dark';
            try {
              if (next === sys) {
                localStorage.removeItem('color-scheme');
              } else {
                localStorage.setItem('color-scheme', next);
              }
            } catch (e) {}
            apply();
          });
        }
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function () {
            navigator.serviceWorker.register('../sw.js').catch(function () {});
          });
        }
      })();
    </script>
  </body>
</html>
`;
}

function renderIndexPage(manifest, version) {
  const sectionsCardsHtml = manifest.sections
    .map((section) => {
      const desc =
        section.description ||
        SECTION_DESCRIPTIONS[section.title] ||
        (section.pages[0] && section.pages[0].summary) ||
        `${section.title} documentation pages.`;
      const pagesHtml = section.pages
        .map((page) => {
          return `          <li class="doc-index-page-item">
            <a href="./${escapeHtml(page.slug)}.html">${escapeHtml(page.title)}</a>
            <p>${escapeHtml(page.summary)}</p>
          </li>`;
        })
        .join('\n');

      return `        <section class="doc-index-card">
          <h2>${escapeHtml(section.title)}</h2>
          <p class="doc-section-desc">${escapeHtml(desc)}</p>
          <ul class="doc-index-page-list">
${pagesHtml}
          </ul>
        </section>`;
    })
    .join('\n');

  const bodyHtml = `<div class="doc-index-hero">
            <h1>${escapeHtml(manifest.title || 'Open Arbor documentation')}</h1>
            <p>Offline-first manual, practice specification, ordinance contribution guide, and tool directory for Open Arbor v${escapeHtml(
              version
            )}.</p>
          </div>
          <div class="doc-index-sections">
${sectionsCardsHtml}
          </div>`;

  return renderDocumentShell({
    pageTitle: manifest.title || 'Open Arbor documentation',
    description: `${manifest.title || 'Open Arbor documentation'} (v${version})`,
    version,
    manifest,
    currentSlug: 'index',
    sectionLabel: 'Documentation Overview',
    bodyHtml,
    pagerHtml: manifest.flatPages[0]
      ? `<nav class="doc-pager" aria-label="Page navigation">
            <a href="./${escapeHtml(manifest.flatPages[0].slug)}.html" class="doc-pager-link doc-pager-next" rel="next">
              <span class="doc-pager-dir">Next</span>
              <span class="doc-pager-title">${escapeHtml(manifest.flatPages[0].title)}</span>
            </a>
          </nav>`
      : '',
  });
}

function renderPagerHtml(prevPage, nextPage) {
  const prevHtml = prevPage
    ? `<a href="./${escapeHtml(prevPage.slug)}.html" class="doc-pager-link" rel="prev">
            <span class="doc-pager-dir">Previous</span>
            <span class="doc-pager-title">${escapeHtml(prevPage.title)}</span>
          </a>`
    : '';
  const nextHtml = nextPage
    ? `<a href="./${escapeHtml(nextPage.slug)}.html" class="doc-pager-link doc-pager-next" rel="next">
            <span class="doc-pager-dir">Next</span>
            <span class="doc-pager-title">${escapeHtml(nextPage.title)}</span>
          </a>`
    : '';
  if (!prevHtml && !nextHtml) return '';
  return `<nav class="doc-pager" aria-label="Page navigation">
            ${prevHtml}
            ${nextHtml}
          </nav>`;
}

/**
 * Build the documentation site from docs/manifest.json into <outDir>/docs/.
 */
export function buildDocs(rootDir = DEFAULT_ROOT_DIR, outDir = path.join(DEFAULT_ROOT_DIR, 'out'), options = {}) {
  const log = options.silent ? () => {} : (msg) => console.log(msg);
  const pkgPath = path.join(rootDir, 'package.json');
  const manifestPath = path.join(rootDir, 'docs', 'manifest.json');
  const docsSrcDir = path.join(rootDir, 'docs');
  const docsOutDir = path.join(outDir, 'docs');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const pkgVersion = String(pkg.version || '').trim();
  if (!pkgVersion) {
    throw new Error('package.json must declare a non-empty version field.');
  }

  const rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(rawManifest.sections) || rawManifest.sections.length === 0) {
    throw new Error('docs/manifest.json must contain a non-empty sections array.');
  }

  const warnings = [];
  if (rawManifest.version !== undefined) {
    const manifestVersion = String(rawManifest.version).trim();
    if (manifestVersion !== pkgVersion) {
      const msg = `WARNING: Version mismatch: package.json states version "${pkgVersion}", while docs/manifest.json states version "${manifestVersion}". Rendering canonical version "${pkgVersion}" from package.json.`;
      warnings.push(msg);
      log(msg);
    }
  }

  const seenSlugs = new Set();
  const flatPages = [];
  const sections = rawManifest.sections.map((section) => {
    const pages = (section.pages || []).map((page) => {
      const file = String(page.file || '').trim();
      if (!file) {
        throw new Error(`Manifest section "${section.title}" contains a page missing "file".`);
      }
      const absMdPath = path.join(docsSrcDir, file);
      if (!fs.existsSync(absMdPath)) {
        throw new Error(`Manifest page file missing on disk: docs/${file}`);
      }
      const slug = path.basename(file, '.md');
      if (seenSlugs.has(slug)) {
        throw new Error(`Duplicate documentation slug "${slug}" from docs/${file}`);
      }
      seenSlugs.add(slug);

      const markdown = fs.readFileSync(absMdPath, 'utf8');
      for (const statedVersion of detectPageVersions(markdown)) {
        if (statedVersion !== pkgVersion) {
          const msg = `WARNING: Version mismatch: package.json states version "${pkgVersion}", while docs/${file} states version "${statedVersion}". Rendering canonical version "${pkgVersion}" from package.json.`;
          warnings.push(msg);
          log(msg);
        }
      }

      const pageEntry = {
        title: String(page.title || slug),
        file,
        slug,
        sectionTitle: section.title,
        markdown,
        summary: extractFirstSummary(markdown),
      };
      flatPages.push(pageEntry);
      return pageEntry;
    });

    return {
      title: String(section.title || ''),
      description: section.description ? String(section.description) : undefined,
      pages,
    };
  });

  const manifest = {
    title: String(rawManifest.title || 'Open Arbor documentation'),
    version: pkgVersion,
    sections,
    flatPages,
  };

  // Clean stale HTML/CSS files under out/docs before emitting current pages
  if (fs.existsSync(docsOutDir)) {
    for (const entry of fs.readdirSync(docsOutDir)) {
      if (entry.endsWith('.html') || entry.endsWith('.css')) {
        fs.rmSync(path.join(docsOutDir, entry));
      }
    }
  }
  fs.mkdirSync(docsOutDir, { recursive: true });

  const outsideLinks = [];
  const seenOutsideLinks = new Set();
  const writtenFiles = [];

  // Write local self-contained stylesheet
  const cssPath = path.join(docsOutDir, 'docs.css');
  fs.writeFileSync(cssPath, buildDocsStylesheet(), 'utf8');
  writtenFiles.push({
    rel: path.relative(rootDir, cssPath).replace(/\\/g, '/'),
    bytes: fs.statSync(cssPath).size,
    kind: 'css',
  });

  // Render each manifest page
  for (let idx = 0; idx < flatPages.length; idx += 1) {
    const page = flatPages[idx];
    const rendered = renderMarkdown(page.markdown, {
      file: page.file,
      rootDir,
      docsSrcDir,
      outsideLinks,
      seenOutsideLinks,
    });

    const prevPage =
      idx === 0
        ? { slug: 'index', title: 'Documentation overview' }
        : flatPages[idx - 1];
    const nextPage = idx < flatPages.length - 1 ? flatPages[idx + 1] : null;
    const pagerHtml = renderPagerHtml(prevPage, nextPage);

    const html = renderDocumentShell({
      pageTitle: page.title,
      description: page.summary || page.title,
      version: pkgVersion,
      manifest,
      currentSlug: page.slug,
      sectionLabel: `${page.sectionTitle} / ${page.file}`,
      bodyHtml: rendered.html,
      pagerHtml,
    });

    const outHtmlPath = path.join(docsOutDir, `${page.slug}.html`);
    fs.writeFileSync(outHtmlPath, html, 'utf8');
    writtenFiles.push({
      rel: path.relative(rootDir, outHtmlPath).replace(/\\/g, '/'),
      bytes: fs.statSync(outHtmlPath).size,
      kind: 'page',
      slug: page.slug,
      sourceFile: page.file,
    });
  }

  // Render out/docs/index.html
  const indexPath = path.join(docsOutDir, 'index.html');
  fs.writeFileSync(indexPath, renderIndexPage(manifest, pkgVersion), 'utf8');
  writtenFiles.unshift({
    rel: path.relative(rootDir, indexPath).replace(/\\/g, '/'),
    bytes: fs.statSync(indexPath).size,
    kind: 'index',
    slug: 'index',
  });

  for (const extLink of outsideLinks) {
    log(
      `OUTSIDE_DOCS_LINK: ${extLink.sourceFile} -> ${extLink.href} (outside docs/, left unchanged; resolves to ${extLink.resolvedRepoPath})`
    );
  }

  // Ensure every generated portal page carries a Docs link in its primary nav.
  const portalPages = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full === docsOutDir) continue;
        walk(full);
      } else if (entry.name === 'index.html') {
        portalPages.push(full);
      }
    }
  })(outDir);
  for (const pagePath of portalPages) {
    const relRoot = pagePath === path.join(outDir, 'index.html') ? '.' : path.relative(path.dirname(pagePath), outDir).replace(/\\/g, '/');
    let html = fs.readFileSync(pagePath, 'utf8');
    const navIdx = html.indexOf('<nav class="oa-main-nav');
    if (navIdx === -1) continue;
    if (html.includes(`href="${relRoot}/docs/index.html"`)) continue;
    const closeIdx = html.indexOf('</nav>', navIdx);
    if (closeIdx === -1) continue;
    const link = `\n          <a href="${relRoot}/docs/index.html" class="oa-nav-link">Docs</a>\n        `;
    html = html.slice(0, closeIdx) + link + html.slice(closeIdx);
    fs.writeFileSync(pagePath, html, 'utf8');
  }

  const htmlPages = writtenFiles.filter((f) => f.rel.endsWith('.html'));
  log(
    `Open Arbor docs build complete -> out/docs/ (${htmlPages.length} HTML pages rendered: 1 index + ${flatPages.length} manifest pages; version v${pkgVersion} from package.json)`
  );
  for (const f of writtenFiles) {
    log(`  - ${f.rel} (${f.bytes} bytes)`);
  }

  return {
    version: pkgVersion,
    manifestVersion: rawManifest.version !== undefined ? String(rawManifest.version) : null,
    warnings,
    outsideLinks,
    htmlPageCount: htmlPages.length,
    manifestPageCount: flatPages.length,
    writtenFiles,
    sections,
    flatPages,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  buildDocs();
}
