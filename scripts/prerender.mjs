/**
 * Static pre-rendering of the marketing landing page.
 *
 * Why: PATH is a SPA — Googlebot lands on `index.html` and finds only an
 * empty <div id="root">. Google often refuses to index such pages
 * ("Gecrawlt — zurzeit nicht indexiert"). This script renders the landing
 * page to static HTML at build time so the response Google sees contains
 * the actual h1, hero copy, features, and pricing — fully SEO-indexable.
 *
 * Flow:
 *   1. Spin up a tiny static server on dist/
 *   2. Launch headless Chromium via Puppeteer
 *   3. Visit /?prerender=1  (App.tsx renders LandingPage directly,
 *      no auth checks, no Supabase calls)
 *   4. Wait for the `app-loaded` event (dispatched by LandingPage on mount)
 *   5. Capture document.documentElement.outerHTML
 *   6. Overwrite dist/index.html with the rendered output
 *
 * The bundled JS still loads in the browser and React replaces the static
 * content with the live app on first paint — users get the same dynamic
 * experience, search engines get a static, content-rich response.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR  = path.resolve(__dirname, '..', 'dist');
const PORT      = 4173 + Math.floor(Math.random() * 1000);

if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error('✗ dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

const MIME = {
  '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon',
  '.woff':'font/woff', '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
});

await new Promise((r) => server.listen(PORT, r));
console.log(`▶ Static server: http://localhost:${PORT}`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Reduziertes Logging — nur Errors aus dem Browser durchreichen.
  page.on('pageerror', (err) => console.warn('[browser]', err.message));

  await page.goto(`http://localhost:${PORT}/?prerender=1`, {
    waitUntil: 'networkidle0',
    timeout: 30_000,
  });

  // Auf das eigene 'app-loaded'-Event warten oder Fallback nach 8s
  await page.evaluate(() => new Promise((resolve) => {
    if (document.querySelector('section h1')) return resolve(undefined);
    document.addEventListener('app-loaded', () => resolve(undefined), { once: true });
    setTimeout(() => resolve(undefined), 8_000);
  }));

  const html = await page.content();

  // Sanity check — zumindest ein <h1> sollte im Output sein
  if (!/<h1[\s>]/.test(html)) {
    console.warn('⚠ No <h1> in rendered HTML — Suchergebnisse koennten leer sein.');
  }

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`✓ Pre-rendered dist/index.html (${kb} KB)`);
} finally {
  await browser.close();
  server.close();
}
