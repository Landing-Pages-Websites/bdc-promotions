// Retina density gate: every visible <img> must deliver >= 2x its rendered box (SOFT otherwise).
//   node workflow/homepage/scripts/density.mjs <a|b|c|d|e> [baseUrl]   (run from the repo root)
// Handles next/image (reads w= from currentSrc; caps at the source file width) and unoptimized files.
import { createRequire } from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(path.join(os.homedir(), '.claude/design-psyche/package.json'));
const { chromium } = require('playwright'); const { PNG } = require('pngjs');
const root = process.cwd() + '/public';
const srcW = (u) => { const f = root + u; if (!fs.existsSync(f)) return null; const buf = fs.readFileSync(f); if (f.endsWith('.png')) return buf.readUInt32BE(16); if (f.endsWith('.webp')) { const k = buf.toString('ascii', 12, 16); if (k === 'VP8X') return 1 + buf.readUIntLE(24, 3); if (k === 'VP8L') return 1 + (buf.readUInt16LE(21) & 0x3fff); return buf.readUInt16LE(26) & 0x3fff; } if (/\.jpe?g$/.test(f)) { let i = 2; while (i < buf.length) { const m = buf[i+1]; const len = buf.readUInt16BE(i+2); if (m >= 0xC0 && m <= 0xC3) return buf.readUInt16BE(i+7); i += 2 + len; } } return null; };
const b = await chromium.launch();
let soft = 0;
for (const [w,h] of [[1536,864],[1440,900],[1280,800],[390,844]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })).newPage();
  await p.goto(`${process.argv[3] ?? "http://localhost:3417"}/variant-${process.argv[2]}`, { waitUntil: 'load' });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
  await p.waitForTimeout(1500);
  const rows = await p.evaluate(() => [...document.querySelectorAll('main img')].filter(i => i.checkVisibility?.()).map(i => { const r = i.getBoundingClientRect(); const u = new URL(i.currentSrc, location.href); return { url: decodeURIComponent(u.searchParams.get('url') || u.pathname), wParam: +(u.searchParams.get('w') || 0), cssW: Math.round(r.width), sizes: i.sizes }; }));
  console.log(`--- ${process.argv[2]} ${w}px @2x`);
  for (const r of rows) { const s = srcW(r.url); const got = Math.min(r.wParam || s, s); const need = r.cssW * 2; if (got/need < 0.95) soft++; console.log(`${got/need < 0.95 ? 'SOFT' : ' ok '} box ${String(r.cssW).padStart(4)} need ${String(need).padStart(4)} served ${String(got).padStart(4)} (req w=${r.wParam}, file ${s}) ${(got/need).toFixed(2)} ${r.url.split('/').pop()} sizes="${r.sizes}"`); }
}
await b.close();
console.log(`\n${soft} soft image render(s)`); process.exit(soft ? 1 : 0);
