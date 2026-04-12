import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const FAKE_ORIGIN = 'http://path-screenshot.internal';

const MIME = {
  '.js': 'application/javascript',
  '.css': 'text/css',
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
const page = await ctx.newPage();

page.on('console', m => console.log(`[console ${m.type()}] ${m.text()}`));
page.on('pageerror', e => console.log(`[pageerror] ${e.message}`));

// Find the main JS file
const mainJs = readFileSync(join(DIST, 'index.html'), 'utf-8')
  .match(/src="\.\/assets\/(index-[^"]+\.js)"/)?.[1];
console.log('Main JS:', mainJs);

await page.route(`${FAKE_ORIGIN}/**`, async (route) => {
  const url = new URL(route.request().url());
  console.log(`[route] ${url.pathname}`);

  const file = join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);
  if (existsSync(file)) {
    const body = readFileSync(file);
    const ct = MIME[extname(file)] ?? 'text/html; charset=utf-8';
    return route.fulfill({ status: 200, contentType: ct, body, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  return route.abort();
});

// Test 1: simple inline module (works)
const testHtml1 = `<!DOCTYPE html><html><body><div id="root"></div>
<script type="module">document.getElementById('root').textContent = 'inline module ok';</script>
</body></html>`;

// Test 2: module loaded via src (with crossorigin)
const testHtml2 = `<!DOCTYPE html><html><body><div id="root"></div>
<script type="module" crossorigin src="${FAKE_ORIGIN}/assets/${mainJs}"></script>
</body></html>`;

// Test 3: simple external module without crossorigin
const simpleModuleContent = `document.getElementById('root').textContent = 'external module ok';`;

await page.route(`${FAKE_ORIGIN}/test-module.js`, async (route) => {
  route.fulfill({ status: 200, contentType: 'application/javascript', body: simpleModuleContent });
});

const testHtml3 = `<!DOCTYPE html><html><body><div id="root"></div>
<script type="module" src="${FAKE_ORIGIN}/test-module.js"></script>
</body></html>`;

// Test 4: external module WITH crossorigin
const testHtml4 = `<!DOCTYPE html><html><body><div id="root"></div>
<script type="module" crossorigin src="${FAKE_ORIGIN}/test-module.js"></script>
</body></html>`;

for (const [name, html] of [['inline module', testHtml1], ['external no-crossorigin', testHtml3], ['external with-crossorigin', testHtml4]]) {
  await page.setContent(html);
  await page.waitForTimeout(1000);
  const content = await page.evaluate(() => document.getElementById('root')?.textContent ?? 'no root');
  console.log(`Test "${name}": ${content}`);
}

await browser.close();
