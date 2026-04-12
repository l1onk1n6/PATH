import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const FAKE_ORIGIN = 'http://path-screenshot.internal';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
  '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
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

await page.addInitScript(() => {
  // Patch the module-preloading function to be a no-op (bypass Vite's preload helper)
  window.__earlyInit = true;
  // Track errors
  window.__errors = [];
  window.onerror = (m, s, l) => window.__errors.push(`${m} @ ${s}:${l}`);
  window.addEventListener('unhandledrejection', e => window.__errors.push(`rejection: ${e.reason}`));
  window.addEventListener('vite:preloadError', e => window.__errors.push(`vite preload error: ${e.payload}`));
});

page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => console.log(`[pageerror] ${err.message}\n${err.stack}`));

await page.route(`${FAKE_ORIGIN}/**`, async (route) => {
  const url = new URL(route.request().url());
  let reqPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = join(DIST, reqPath);
  const ext = extname(reqPath);

  if (!existsSync(file)) {
    return route.fulfill({ status: 200, contentType: MIME['.html'], body: patchHtml(readFileSync(join(DIST, 'index.html'), 'utf-8')) });
  }

  const raw = readFileSync(file);
  const body = ext === '.html' ? patchHtml(raw.toString('utf-8')) : raw;
  return route.fulfill({ status: 200, contentType: MIME[ext] ?? 'application/octet-stream', body });
});

// Log network failures
page.on('requestfailed', req => console.log(`[req failed] ${req.url()}`));

console.log('Navigating...');
// Use domcontentloaded instead of commit to see if DOM loads
try {
  await page.goto(`${FAKE_ORIGIN}/#/screenshot?t=minimal&accent=%23007AFF`, {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  console.log('DOMContentLoaded ✓');
} catch (e) {
  console.log('goto failed:', e.message);
}

// Now poll for #resume-root
for (let i = 0; i < 10; i++) {
  const state = await page.evaluate(() => ({
    readyState: document.readyState,
    rootLen: document.getElementById('root')?.innerHTML?.length ?? -1,
    bodyLen: document.body?.innerHTML?.length ?? -1,
    errors: window.__errors ?? [],
    earlyInit: window.__earlyInit ?? false,
  }));
  console.log(`t+${i}s: readyState=${state.readyState} #root len=${state.rootLen} body len=${state.bodyLen} errors=${state.errors.length} earlyInit=${state.earlyInit}`);
  if (state.rootLen > 0) { console.log('REACT MOUNTED!'); break; }
  await page.waitForTimeout(1000);
}

const finalErrors = await page.evaluate(() => window.__errors ?? []);
if (finalErrors.length) console.log('Errors:', finalErrors);

await browser.close();
