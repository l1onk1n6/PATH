import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAKE_ORIGIN = 'http://path-screenshot.internal';

// Find the bundle
import { readdirSync } from 'fs';
const DIST = join(ROOT, 'dist-screenshot', 'assets');
const bundleFile = readdirSync(DIST).find(f => f.startsWith('index-screenshot-'));
console.log('Bundle:', bundleFile, '(' + readFileSync(join(DIST, bundleFile)).length + ' bytes)');

const HTML = `<!doctype html><html><body>
  <div id="resume-root" style="width:794px;min-height:1123px;background:#fff;"></div>
  <script type="module" src="./assets/${bundleFile}"></script>
</body></html>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
const page = await ctx.newPage();

page.on('console', m => { if (m.type() !== 'info') console.log(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => console.log(`[pageerror] ${e.message}`));
page.on('requestfailed', r => console.log(`[req failed] ${r.url()} ${r.failure()?.errorText}`));

let routeCount = 0;
await page.route(`${FAKE_ORIGIN}/**`, async (route) => {
  const path = new URL(route.request().url()).pathname;
  routeCount++;
  console.log(`[route #${routeCount}] ${path}`);

  if (path === '/' || path === '/index.html') {
    return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: HTML });
  }
  if (path === `/assets/${bundleFile}`) {
    const body = readFileSync(join(DIST, bundleFile));
    return route.fulfill({ status: 200, contentType: 'application/javascript', body });
  }
  return route.abort();
});

console.log('Navigating...');
await page.goto(`${FAKE_ORIGIN}/?t=minimal&accent=%23007AFF`, { waitUntil: 'commit', timeout: 10000 });

for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  const state = await page.evaluate(() => ({
    readyState: document.readyState,
    rootChildren: document.getElementById('resume-root')?.children?.length ?? -1,
    errors: window.__errors ?? [],
  }));
  console.log(`t+${i+1}s: readyState=${state.readyState} rootChildren=${state.rootChildren}`);
  if (state.rootChildren > 0) { console.log('✓ React rendered!'); break; }
}

await browser.close();
