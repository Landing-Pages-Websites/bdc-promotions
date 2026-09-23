#!/usr/bin/env node
// Browser smoke test for the homepage review routes (production server).
//   node workflow/homepage/scripts/smoke.mjs [baseUrl]
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(path.join(os.homedir(), '.claude/design-psyche/package.json'));
const { chromium } = require('playwright');
const base = process.argv[2] ?? 'http://localhost:3418';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });

const browser = await chromium.launch();
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 140)); });
  page.on('pageerror', (e) => consoleErrors.push(e.message.slice(0, 140)));

  await page.goto(`${base}/`, { waitUntil: 'load' });
  const auditTarget = await page.request.get(`${base}/lp`).then((r) => r.text());
  check(`${width} /lp has #get-started (audit target)`, auditTarget.includes('id="get-started"'));
  const chooser = await page.$$eval('a[href^="/variant-"]', (as) => as.map((a) => a.getAttribute('href')));
  check(`${width} chooser links A/B/C`, ['/variant-a', '/variant-b', '/variant-c'].every((h) => chooser.includes(h)), chooser.join(','));

  for (const v of ['a', 'b', 'c']) {
    const url = `${base}/variant-${v}`;
    await page.goto(url, { waitUntil: 'load' });
    const info = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')];
      const text = (a) => a.textContent.replace(/\s+/g, ' ').trim();
      const tiny = [...document.querySelectorAll('main a, main button')]
        .filter((el) => el.checkVisibility?.())
        .map((el) => ({ t: text(el).slice(0, 40), h: el.getBoundingClientRect().height }))
        .filter((x) => x.h > 0 && x.h < 44);
      return {
        h1: document.querySelectorAll('h1').length,
        audit: links.filter((a) => /audit/i.test(text(a))).map((a) => a.getAttribute('href')),
        tel: links.filter((a) => a.getAttribute('href')?.startsWith('tel:')).map((a) => a.getAttribute('href')),
        robots: document.querySelector('meta[name="robots"]')?.content ?? '',
        bridge: document.querySelectorAll('script[src*="review-bridge/v7/review-bridge.js"]').length,
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenAnchors: links.map((a) => a.getAttribute('href')).filter((h) => h?.startsWith('#') && h.length > 1 && !document.getElementById(h.slice(1))),
        tiny,
      };
    });
    check(`${width} ${v} one h1`, info.h1 === 1, `h1=${info.h1}`);
    check(`${width} ${v} audit CTAs → /lp#get-started`, info.audit.length > 0 && info.audit.every((h) => h === '/lp#get-started'), info.audit.join(','));
    check(`${width} ${v} tel links`, info.tel.length > 0 && info.tel.every((h) => h === 'tel:+13522071074'), `${info.tel.length} × ${[...new Set(info.tel)]}`);
    check(`${width} ${v} noindex`, /noindex/.test(info.robots), info.robots);
    check(`${width} ${v} review bridge once`, info.bridge === 1, `count=${info.bridge}`);
    check(`${width} ${v} no horizontal overflow`, info.overflowX <= 0, `overflowX=${info.overflowX}`);
    check(`${width} ${v} in-page anchors resolve`, info.brokenAnchors.length === 0, info.brokenAnchors.join(','));
    check(`${width} ${v} main targets ≥44px`, info.tiny.length === 0, JSON.stringify(info.tiny));

    const explore = page.getByRole('button', { name: /explore the work/i });
    if (await explore.count()) {
      await explore.first().focus();
      const focusVisible = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && s.outlineWidth !== '0px'; });
      await page.keyboard.press('Enter');
      const expanded = await explore.first().getAttribute('aria-expanded');
      const panelImgs = await page.evaluate((id) => { const el = id && document.getElementById(id); return el ? [...el.querySelectorAll('img')].length : -1; }, await explore.first().getAttribute('aria-controls'));
      await page.keyboard.press('Enter');
      const collapsed = await explore.first().getAttribute('aria-expanded');
      check(`${width} ${v} explore disclosure (keyboard)`, expanded === 'true' && collapsed === 'false' && panelImgs > 0, `open=${expanded} imgs=${panelImgs} closed=${collapsed} focusRing=${focusVisible}`);
      check(`${width} ${v} explore focus ring visible`, focusVisible);
    }
  }
  check(`${width} console errors (prod)`, consoleErrors.filter((e) => !/review-bridge|CORS|ERR_FAILED/i.test(e)).length === 0, consoleErrors.join(' | '));
  await ctx.close();
}
await browser.close();
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
