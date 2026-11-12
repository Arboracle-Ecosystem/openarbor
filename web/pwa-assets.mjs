/**
 * Deterministic Zero-Dependency PWA Asset & Manifest Builder (web/pwa-assets.mjs)
 * Emits:
 *   - out/manifest.webmanifest (subpath-portable relative start_url, scope, id, icons, shortcuts)
 *   - out/icons/icon.svg (crisp vector canopy, trunk cylinder, and root-ring emblem)
 *   - out/icons/icon-192.png (192x192 RGBA PNG, purpose: "any")
 *   - out/icons/icon-512.png (512x512 RGBA PNG, purpose: "any")
 *   - out/icons/icon-maskable-512.png (512x512 RGBA PNG, purpose: "maskable" 80% safe-zone compliant)
 *   - out/icons/apple-touch-icon.png (180x180 opaque PNG for iOS Home Screen)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_ICONS_DIR = path.join(__dirname, 'assets', 'icons');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

function encodeRgbaPng(width, height, pixelFn) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    raw[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const idx = rowOffset + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idatData = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idatData),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function mixColor(bg, fg, alpha) {
  const t = clamp01(alpha);
  return [
    Math.round(bg[0] * (1 - t) + fg[0] * t),
    Math.round(bg[1] * (1 - t) + fg[1] * t),
    Math.round(bg[2] * (1 - t) + fg[2] * t),
    255,
  ];
}

/**
 * Signed-distance anti-aliased Open Arbor Sequoia & Root-Zone Emblem renderer.
 * Draws:
 *   - Rounded forest-slate card (or full bleed for maskable / iOS touch icon)
 *   - Outer Critical Root Zone (CRZ) emerald ring
 *   - Inner Mattheck 0.30 sound-shell copper ring
 *   - Living canopy crown + trunk flare silhouette
 */
function createEmblemSampler({ maskable = false, opaqueRounded = false } = {}) {
  const bgDeep = [11, 27, 17, 255];      // #0b1b11
  const bgInner = [20, 48, 31, 255];     // #14301f
  const emerald = [82, 183, 136, 255];   // #52b788
  const brightLeaf = [116, 198, 157, 255]; // #74c69d
  const copper = [226, 157, 86, 255];    // #e29d56
  const cream = [245, 240, 232, 255];    // #f5f0e8

  const emblemScale = maskable ? 0.76 : 0.92;

  return (px, py, w, h) => {
    const nx = ((px + 0.5) / w) * 2 - 1;
    const ny = ((py + 0.5) / h) * 2 - 1;
    const aa = 2.5 / w;

    // Rounded rect alpha for non-maskable "any" icon
    if (!maskable && !opaqueRounded) {
      const cornerR = 0.36;
      const qx = Math.abs(nx) - (1 - cornerR);
      const qy = Math.abs(ny) - (1 - cornerR);
      const outsideDist =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        cornerR;
      if (outsideDist > aa) {
        return [0, 0, 0, 0];
      }
    }

    const sx = nx / emblemScale;
    const sy = ny / emblemScale;
    const r = Math.hypot(sx, sy);

    // Subtle radial gradient background
    let color = mixColor(bgInner, bgDeep, clamp01(r * 0.85));

    // 1. Outer CRZ Emerald Ring (r = 0.78, thickness = 0.055)
    const crzDist = Math.abs(r - 0.78) - 0.028;
    if (crzDist < aa) {
      color = mixColor(color, emerald, clamp01(0.5 - crzDist / (2 * aa)) * 0.95);
    }

    // 2. Inner Mattheck t/R Copper Ring (r = 0.63, thickness = 0.036)
    const shellDist = Math.abs(r - 0.63) - 0.018;
    if (shellDist < aa) {
      color = mixColor(color, copper, clamp01(0.5 - shellDist / (2 * aa)) * 0.9);
    }

    // 3. Soil Horizon Line at sy = 0.28 inside the inner circle
    if (Math.abs(sx) < 0.52) {
      const soilDist = Math.abs(sy - 0.28) - 0.016;
      if (soilDist < aa) {
        color = mixColor(color, copper, clamp01(0.5 - soilDist / (2 * aa)) * 0.85);
      }
    }

    // 4. Root Plate Arcs below soil line (sy between 0.28 and 0.50)
    if (sy > 0.27 && sy < 0.50 && Math.abs(sx) < 0.44) {
      const rootCurve = 0.28 + 0.65 * sx * sx;
      const rootDist = Math.abs(sy - rootCurve) - 0.022;
      if (rootDist < aa) {
        color = mixColor(color, copper, clamp01(0.5 - rootDist / (2 * aa)) * 0.92);
      }
    }

    // 5. Canopy Crown (3 overlapping botanical ellipses above trunk)
    const c1 = Math.hypot(sx / 0.36, (sy + 0.18) / 0.24) - 1;
    const c2 = Math.hypot((sx + 0.18) / 0.24, (sy + 0.10) / 0.19) - 1;
    const c3 = Math.hypot((sx - 0.18) / 0.24, (sy + 0.10) / 0.19) - 1;
    const crownDist = Math.min(c1, c2, c3) * 0.24;
    if (crownDist < aa) {
      const crownShade = sy < -0.20 ? brightLeaf : emerald;
      color = mixColor(color, crownShade, clamp01(0.5 - crownDist / (2 * aa)));
    }

    // 6. Living Trunk & Root Flare (sy from -0.10 to +0.29)
    if (sy >= -0.12 && sy <= 0.29) {
      const flareT = clamp01((sy + 0.12) / 0.41);
      const halfWidth = 0.052 + 0.085 * flareT * flareT;
      const trunkDist = Math.abs(sx) - halfWidth;
      if (trunkDist < aa) {
        color = mixColor(color, cream, clamp01(0.5 - trunkDist / (2 * aa)));
      }
    }

    // Apply outer rounded-rect edge anti-aliasing for transparent "any" icons
    if (!maskable && !opaqueRounded) {
      const cornerR = 0.36;
      const qx = Math.abs(nx) - (1 - cornerR);
      const qy = Math.abs(ny) - (1 - cornerR);
      const outsideDist =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        cornerR;
      const edgeAlpha = Math.round(clamp01(0.5 - outsideDist / (2 * aa)) * 255);
      return [color[0], color[1], color[2], edgeAlpha];
    }

    return color;
  };
}

export function generatePwaAssets(outDir) {
  const iconsDir = path.join(outDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  const tickLines = Array.from({ length: 36 }, (_, idx) => {
    if (idx % 9 === 0) return '';
    const angle = (idx * 10 * Math.PI) / 180;
    const r1 = idx % 3 === 0 ? 198 : 202;
    const r2 = 212;
    const x1 = (256 + r1 * Math.cos(angle)).toFixed(1);
    const y1 = (256 + r1 * Math.sin(angle)).toFixed(1);
    const x2 = (256 + r2 * Math.cos(angle)).toFixed(1);
    const y2 = (256 + r2 * Math.sin(angle)).toFixed(1);
    return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#52b788" stroke-width="${idx % 3 === 0 ? '3.5' : '2.2'}" stroke-linecap="round"/>`;
  })
    .filter(Boolean)
    .join('\n');

  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Open Arbor emblem">
  <title>Open Arbor</title>
  <rect width="512" height="512" rx="112" fill="#0a150d"/>
  <circle cx="256" cy="256" r="224" fill="#0d1e13" stroke="#52b788" stroke-width="11"/>
${tickLines}
  <polygon points="256,36 248,54 264,54" fill="#52b788"/>
  <polygon points="256,476 248,458 264,458" fill="#52b788"/>
  <polygon points="36,256 54,248 54,264" fill="#52b788"/>
  <polygon points="476,256 458,248 458,264" fill="#52b788"/>
  <circle cx="256" cy="256" r="188" fill="#0a160e" stroke="#e2a856" stroke-width="9"/>
  <ellipse cx="256" cy="182" rx="108" ry="66" fill="#3a7d58"/>
  <ellipse cx="192" cy="208" rx="68" ry="48" fill="#52b788"/>
  <ellipse cx="320" cy="208" rx="68" ry="48" fill="#40916c"/>
  <ellipse cx="256" cy="158" rx="74" ry="44" fill="#74c69d"/>
  <path d="M238 206 C238 248 228 286 206 306 L306 306 C284 286 274 248 274 206 Z" fill="#f3d59b"/>
  <path d="M248 214 Q212 184 176 196 M264 214 Q300 184 336 196 M256 198 L256 162" fill="none" stroke="#f3d59b" stroke-width="9" stroke-linecap="round"/>
  <line x1="88" y1="308" x2="424" y2="308" stroke="#d48c46" stroke-width="7" stroke-linecap="round"/>
  <path d="M256 312 Q214 332 162 352 M256 312 Q298 332 350 352 M256 314 Q228 354 196 392 M256 314 Q284 354 316 392 M256 316 L256 404" fill="none" stroke="#e2a856" stroke-width="8" stroke-linecap="round"/>
</svg>\n`;

  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSvg, 'utf8');

  const prebuiltFiles = [
    'icon-68.png',
    'icon-192.png',
    'icon-512.png',
    'icon-maskable-512.png',
    'apple-touch-icon.png',
  ];

  const allPrebuiltExist = prebuiltFiles.every((f) =>
    fs.existsSync(path.join(ASSETS_ICONS_DIR, f))
  );

  if (allPrebuiltExist) {
    for (const file of prebuiltFiles) {
      fs.copyFileSync(path.join(ASSETS_ICONS_DIR, file), path.join(iconsDir, file));
    }
  } else {
    const anySampler = createEmblemSampler({ maskable: false, opaqueRounded: false });
    const maskableSampler = createEmblemSampler({ maskable: true, opaqueRounded: true });
    const touchSampler = createEmblemSampler({ maskable: false, opaqueRounded: true });

    fs.writeFileSync(path.join(iconsDir, 'icon-68.png'), encodeRgbaPng(68, 68, anySampler));
    fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), encodeRgbaPng(192, 192, anySampler));
    fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), encodeRgbaPng(512, 512, anySampler));
    fs.writeFileSync(
      path.join(iconsDir, 'icon-maskable-512.png'),
      encodeRgbaPng(512, 512, maskableSampler)
    );
    fs.writeFileSync(
      path.join(iconsDir, 'apple-touch-icon.png'),
      encodeRgbaPng(180, 180, touchSampler)
    );
  }

  const optionalScreenshots = ['screenshot-mobile.png', 'screenshot-desktop.png'];
  const hasScreenshots = optionalScreenshots.every((f) =>
    fs.existsSync(path.join(ASSETS_ICONS_DIR, f))
  );
  if (hasScreenshots) {
    for (const shot of optionalScreenshots) {
      fs.copyFileSync(path.join(ASSETS_ICONS_DIR, shot), path.join(iconsDir, shot));
    }
  }

  const manifest = {
    id: './',
    name: 'Open Arbor: Sovereign Field Studio & Tree Law Engine',
    short_name: 'Open Arbor',
    description:
      'Offline-capable arboricultural field instrument for ANSI A300 root protection zones, Claus Mattheck t/R shell biomechanics, municipal tree ordinances, and STIM-aligned evidentiary reports.',
    lang: 'en-US',
    dir: 'ltr',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'any',
    background_color: '#08110b',
    theme_color: '#1b4332',
    categories: ['utilities', 'productivity', 'education'],
    icons: [
      {
        src: './icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: './icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: './icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: './icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    ...(hasScreenshots
      ? {
          screenshots: [
            {
              src: './icons/screenshot-mobile.png',
              sizes: '540x960',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Open Arbor Living Tree Lens and Mobile Field Studio',
            },
            {
              src: './icons/screenshot-desktop.png',
              sizes: '1280x800',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Open Arbor Desktop Arboricultural Field Studio and Ordinance Engine',
            },
          ],
        }
      : {}),
    shortcuts: [
      {
        name: 'Open Field Studio',
        short_name: 'Field Studio',
        description: 'Run single-tree, multi-tree stand union, or Open Badges 3.0 field workflows',
        url: './demo/',
        icons: [{ src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'City Tree Laws',
        short_name: 'Ordinances',
        description: 'Inspect verified Central Texas and Rogue Valley municipal tree codes',
        url: './ordinances/',
        icons: [{ src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: '41-Tool Forestry Workbench',
        short_name: 'Workbench',
        description: 'Explore sovereign LiDAR, dendrochronology, and core ESM forestry tools',
        url: './tools/',
        icons: [{ src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };

  fs.writeFileSync(
    path.join(outDir, 'manifest.webmanifest'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
}
