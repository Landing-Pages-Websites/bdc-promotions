#!/usr/bin/env node
// Evidence capture for the homepage review: full page at an exact viewport/DPR, after
// dismissing the consent banner (a real user action), scrolling every lazy image into view
// and waiting until each one has decoded. Reuses design-psyche's installed Playwright.
//
//   node workflow/homepage/scripts/capture.mjs <url> <out.png> [--w 1536] [--h 864] [--dpr 1]
//        [--browser chromium|firefox|webkit] [--fold]
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const require = createRequire(path.join(os.homedir(), '.claude/design-psyche/package.json'));
const pw = require('playwright');

const args = process.argv.slice(2);
const [url, out] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (!url || !out) { console.error('usage: capture.mjs <url> <out.png> [--w] [--h] [--dpr] [--browser] [--fold]'); process.exit(1); }
const width = Number(opt('--w', 1536)), height = Number(opt('--h', 864)), dpr = Number(opt('--dpr', 1));
const engine = pw[opt('--browser', 'chromium')];

const browser = await engine.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: width < 700 && engine === pw.chromium });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.getByRole('button', { name: /got it|accept/i }).first().click({ timeout: 3000 }).catch(() => {});
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto'; // smooth scrolling would leave the shot mid-scroll
  for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
  // Only rendered images: a lazy image inside a hidden panel never loads and would hang forever.
  const shown = [...document.images].filter((img) => img.checkVisibility?.() ?? img.offsetParent !== null);
  const settle = (img) => (img.complete ? img.decode().catch(() => {}) : new Promise((r) => { img.onload = img.onerror = r; }));
  await Promise.race([Promise.all(shown.map(settle)), new Promise((r) => setTimeout(r, 15000))]);
  await document.fonts.ready;
  window.scrollTo(0, 0);
});
await page.waitForTimeout(400);
const report = await page.evaluate(() => ({
  broken: [...document.images].filter((i) => (i.checkVisibility?.() ?? i.offsetParent !== null) && !(i.complete && i.naturalWidth > 0)).map((i) => i.currentSrc || i.src),
  overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  height: document.documentElement.scrollHeight,
}));
await mkdir(path.dirname(path.resolve(out)), { recursive: true });
await page.screenshot({ path: out, fullPage: !args.includes('--fold') });
await browser.close();
console.log(JSON.stringify({ url, out, width, height, dpr, browser: opt('--browser', 'chromium'), ...report, pageErrors: errors }));
