import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST    = join(ROOT, 'dist');
const FAKE_ORIGIN = 'http://path-screenshot.internal';

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

function patchHtml(raw) {
  return raw
    .replace(/\s+crossorigin(?:="[^"]*")?/gi, '')
    .replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/gi, '');
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
const page = await ctx.newPage();

// Set up error/console collection in main world BEFORE page scripts run
await page.addInitScript(() => {
  window.__initLog = ['addInitScript ran'];
  window.__errors = [];

  window.onerror = (msg, src, line, col, err) => {
    window.__errors.push(`ERROR: ${msg} at ${src}:${line}`);
  };

  window.addEventListener('unhandledrejection', (e) => {
    window.__errors.push(`UNHANDLED REJECTION: ${String(e.reason)}`);
  });

  window.addEventListener('vite:preloadError', (e) => {
    window.__errors.push(`VITE PRELOAD ERROR: ${String(e.payload)}`);
  });

  // Patch console.error
  const origError = console.error;
  console.error = (...args) => {
    window.__errors.push(`console.error: ${args.map(String).join(' ')}`);
    origError.apply(console, args);
  };

  // Track when DOMContentLoaded fires
  document.addEventListener('DOMContentLoaded', () => {
    window.__initLog.push('DOMContentLoaded fired, #root exists: ' + !!document.getElementById('root'));
  });
});

page.on('console', msg => console.log(`[console ${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => console.log(`[pageerror] ${err.message}`));

await page.route(`${FAKE_ORIGIN}/**`, async (route) => {
  const url     = new URL(route.request().url());
  let   reqPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const file    = join(DIST, reqPath);
  const ext     = extname(reqPath);

  if (!existsSync(file)) {
    const fallback = join(DIST, 'index.html');
    return route.fulfill({ status: 200, contentType: MIME['.html'], body: patchHtml(readFileSync(fallback, 'utf-8')) });
  }

  const raw  = readFileSync(file);
  const ct   = MIME[ext] ?? 'application/octet-stream';
  const body = ext === '.html' ? patchHtml(raw.toString('utf-8')) : raw;
  return route.fulfill({ status: 200, contentType: ct, body });
});

const url = `${FAKE_ORIGIN}/#/screenshot?t=minimal&accent=%23007AFF`;
console.log(`Navigating to: ${url}`);
await page.goto(url, { waitUntil: 'commit', timeout: 10000 });

console.log('Waiting 10 seconds for React...');
await page.waitForTimeout(10000);

const result = await page.evaluate(() => ({
  initLog:    window.__initLog ?? 'not set',
  errors:     window.__errors  ?? 'not set',
  rootHtml:   (document.getElementById('root')?.innerHTML ?? 'no #root').slice(0, 200),
  bodyText:   document.body?.innerText?.slice(0, 300) ?? 'no body',
  readyState: document.readyState,
}));

console.log('\n=== RESULT ===');
console.log(JSON.stringify(result, null, 2));

await browser.close();
