import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST    = join(ROOT, 'dist');
const OUT_DIR = join(ROOT, 'public', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
};

const FAKE_ORIGIN = 'http://path-screenshot.internal';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
const page = await ctx.newPage();

// Log all console messages from page
page.on('console', msg => console.log(`[browser ${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => console.log(`[page error] ${err.message}`));
page.on('requestfailed', req => console.log(`[req failed] ${req.url()} — ${req.failure()?.errorText}`));

const ERROR_CATCHER = `<script>
window.__jsErrors = [];
window.onerror = function(msg, src, line, col, err) { window.__jsErrors.push({msg, src, line, col, stack: err?.stack}); };
window.onunhandledrejection = function(e) { window.__jsErrors.push({msg: 'unhandledrejection', reason: String(e.reason)}); };
console.error = function(...args) { window.__jsErrors.push({msg: 'console.error', args: args.map(String)}); };
</script>`;

// Intercept all requests and serve from /dist
await page.route(`${FAKE_ORIGIN}/**`, async (route) => {
  const url     = new URL(route.request().url());
  let   reqPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const file    = join(DIST, reqPath);

  if (!existsSync(file)) {
    const fallback = join(DIST, 'index.html');
    let body = readFileSync(fallback, 'utf-8');
    body = body.replace('<head>', '<head>' + ERROR_CATCHER);
    return route.fulfill({ status: 200, contentType: MIME['.html'], body, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  if (reqPath === '/index.html') {
    let body = readFileSync(file, 'utf-8');
    body = body.replace('<head>', '<head>' + ERROR_CATCHER);
    return route.fulfill({ status: 200, contentType: MIME['.html'], body, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const body        = readFileSync(file);
  const contentType = MIME[extname(file)] ?? 'application/octet-stream';
  return route.fulfill({ status: 200, contentType, body, headers: { 'Access-Control-Allow-Origin': '*' } });
});

// Also intercept any other request to see what's happening
page.on('request', req => {
  if (!req.url().startsWith(FAKE_ORIGIN)) {
    console.log(`[external req] ${req.url()}`);
  }
});

const url = `${FAKE_ORIGIN}/#/screenshot?t=minimal&accent=%23007AFF`;
console.log(`Navigating to: ${url}\n`);

await page.goto(url, { waitUntil: 'commit', timeout: 10000 });
console.log('Page committed, waiting 3 seconds...');

// Inject observer before JS runs
await page.addInitScript(() => {
  window.__domChanges = [];
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
      const obs = new MutationObserver(muts => {
        muts.forEach(m => window.__domChanges.push({
          type: m.type,
          added: m.addedNodes.length,
          innerHtml: m.target.innerHTML.slice(0, 100),
        }));
      });
      obs.observe(root, { subtree: true, childList: true, attributes: true });
    } else {
      window.__domChanges.push('no #root at DOMContentLoaded');
    }
  });
});

// Wait a bit for JS to run
await page.waitForTimeout(8000);

// Check what's in #root
const rootHtml = await page.evaluate(() => {
  const root = document.getElementById('root');
  return root ? (root.innerHTML.slice(0, 800) || '(EMPTY)') : 'NO #root FOUND';
});
console.log('Root content:', rootHtml);

const domChanges = await page.evaluate(() => window.__domChanges ?? 'no observer');
console.log('DOM changes:', JSON.stringify(domChanges, null, 2));

const jsErrors = await page.evaluate(() => window.__jsErrors ?? 'no error catcher installed');
console.log('JS Errors:', JSON.stringify(jsErrors, null, 2));

await browser.close();
