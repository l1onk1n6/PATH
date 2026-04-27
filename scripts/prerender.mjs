/**
 * Pre-renders the LandingPage into dist/index.html so Googlebot sees
 * full HTML content without executing JavaScript.
 *
 * Usage: node scripts/prerender.mjs
 * Requires the Vite build to have run first (dist/ must exist).
 */
import { chromium } from 'playwright';
import { preview } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 4999;

console.log('Pre-render: starting preview server…');
const server = await preview({
  preview: { port: PORT, host: '127.0.0.1', strictPort: true },
});

let rootHTML = '';
try {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`http://127.0.0.1:${PORT}/?prerender=1`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  });

  // Wait for LandingPage main heading to confirm it rendered
  await page.waitForSelector('#root h1', { timeout: 15_000 });

  rootHTML = await page.evaluate(() =>
    document.getElementById('root')?.innerHTML ?? '',
  );

  await browser.close();
} finally {
  server.httpServer.close();
}

if (!rootHTML.trim()) {
  console.error('Pre-render failed: #root is empty');
  process.exit(1);
}

const indexPath = join(__dirname, '..', 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf-8');
const sizeBefore = Math.round(html.length / 1024);
html = html.replace('<div id="root"></div>', `<div id="root">${rootHTML}</div>`);
const sizeAfter = Math.round(html.length / 1024);
writeFileSync(indexPath, html, 'utf-8');

console.log(`Pre-render done: dist/index.html ${sizeBefore} KB → ${sizeAfter} KB`);
