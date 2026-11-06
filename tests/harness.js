// Opens web/index.html in Chromium with no network: everything the app needs must be in the repository.
const { chromium } = require('playwright');
const path = require('path');
const APP = process.env.APP || path.join(__dirname, '..', 'web', 'index.html');

async function open(extra = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true, ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  page.on('dialog', (d) => d.accept());
  // Tests name commands in English; the language tests switch to Thai themselves.
  await page.addInitScript(() => { try { if (!localStorage.getItem('aquaterraLang')) localStorage.setItem('aquaterraLang', 'en'); } catch (e) {} });
  await page.route('**/*', (r) => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await page.goto('file://' + APP, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  return { browser, ctx, page, errors };
}
module.exports = { open };
