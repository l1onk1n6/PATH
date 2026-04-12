import { chromium } from 'playwright';

const FAKE_ORIGIN = 'http://path-screenshot.internal';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
const page = await ctx.newPage();

page.on('console', m => console.log(`[console ${m.type()}] ${m.text()}`));
page.on('pageerror', e => console.log(`[pageerror] ${e.message}`));
page.on('requestfailed', r => console.log(`[req failed] ${r.url()} ${r.failure()?.errorText}`));

const SIMPLE_JS = `console.log('external module executed'); document.getElementById('root').textContent = 'external module ok';`;
const SIMPLE_HTML = `<!doctype html><html><body><div id="root"></div><script type="module" src="./simple.js"></script></body></html>`;

await page.route(`${FAKE_ORIGIN}/**`, async (route) => {
  const path = new URL(route.request().url()).pathname;
  console.log(`[route] ${path}`);

  if (path === '/' || path === '/index.html') {
    return route.fulfill({ status: 200, contentType: 'text/html', body: SIMPLE_HTML });
  }
  if (path === '/simple.js') {
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: SIMPLE_JS });
  }
  return route.abort();
});

console.log('Test: page.goto + external module');
await page.goto(`${FAKE_ORIGIN}/`, { waitUntil: 'commit', timeout: 10000 });
await page.waitForTimeout(3000);

const content = await page.evaluate(() => document.getElementById('root')?.textContent ?? 'no root');
console.log('Result:', content);

await browser.close();
