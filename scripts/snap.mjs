import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST    = join(ROOT, 'dist-screenshot');
const ASSETS  = join(DIST, 'assets');
const OUT_DIR = join(ROOT, 'public', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const TEMPLATES = [
  { id: 'minimal',   accent: '#007AFF' },
  { id: 'modern',    accent: '#00b4d8' },
  { id: 'corporate', accent: '#f0c040' },
  { id: 'nordic',    accent: '#2b7a78' },
  { id: 'creative',  accent: '#f72585' },
  { id: 'tech',      accent: '#58a6ff' },
];

const MIME = {
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
};

const FAKE_ORIGIN = 'http://path-screenshot.internal';

// Find the compiled entry bundle
const bundleFile = readdirSync(ASSETS).find(f => f.startsWith('index-screenshot-') && f.endsWith('.js'));
if (!bundleFile) {
  console.error('Bundle not found — run: npx vite build --config vite.screenshot.config.ts');
  process.exit(1);
}
console.log(`Bundle: ${bundleFile}`);

// Minimal HTML: no external fonts so the page loads offline without blocking
const ENTRY_HTML = `<!doctype html><html lang="de"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Screenshot</title>
</head><body style="margin:0;padding:0;background:#fff">
<div id="resume-root" style="width:794px;min-height:1123px;background:#fff;margin:0;padding:0;overflow:hidden;"></div>
<script type="module" src="./assets/${bundleFile}"></script>
</body></html>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
const page = await ctx.newPage();

page.on('pageerror',     err => console.error(`[pageerror] ${err.message}`));
page.on('console',       msg => { if (msg.type() === 'error') console.error(`[err] ${msg.text()}`); });

// Serve assets from dist-screenshot; abort all external requests
await page.route('**/*', async (route) => {
  const reqUrl  = new URL(route.request().url());
  const reqPath = reqUrl.pathname;

  // Only handle our fake domain; abort everything else (fonts, analytics, etc.)
  if (reqUrl.origin !== FAKE_ORIGIN) {
    return route.abort();
  }

  // Root → serve the entry HTML (URL params passed through to the JS)
  if (reqPath === '/' || reqPath === '/index.html') {
    return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: ENTRY_HTML });
  }

  // Assets from dist-screenshot
  const file = join(DIST, reqPath);
  if (existsSync(file)) {
    const body = readFileSync(file);
    return route.fulfill({ status: 200, contentType: MIME[extname(file)] ?? 'application/octet-stream', body });
  }

  return route.abort();
});

console.log('✓ Routes configured, starting captures…\n');

for (const { id, accent } of TEMPLATES) {
  const url = `${FAKE_ORIGIN}/?t=${id}&accent=${encodeURIComponent(accent)}`;
  console.log(`📸 ${id}…`);

  await page.goto(url, { waitUntil: 'commit', timeout: 15000 });

  try {
    await page.waitForSelector('#resume-root > *', { timeout: 15000 });
  } catch {
    const inner = await page.evaluate(() => document.getElementById('resume-root')?.innerHTML?.slice(0, 300) ?? 'empty');
    console.log(`   ⚠️ #resume-root still empty — inner: ${inner}`);
    continue;
  }

  await page.waitForTimeout(800);   // layout settle

  const el = page.locator('#resume-root');
  await el.screenshot({ path: join(OUT_DIR, `${id}.png`), type: 'png' });
  console.log(`   ✓ saved → public/screenshots/${id}.png`);
}

await browser.close();
console.log('\n✅ All done!');
process.exit(0);
