import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
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

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
const page = await ctx.newPage();

page.on('console', msg => { if (msg.type() === 'error') console.log(`[err] ${msg.text()}`); });
page.on('pageerror', err => console.log(`[page error] ${err.message}`));

console.log('Testing localhost access with Playwright...\n');

for (const { id, accent } of TEMPLATES) {
  const url = `http://localhost:5173/#/screenshot?t=${id}&accent=${encodeURIComponent(accent)}`;
  console.log(`📸 ${id}…`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (e) {
    console.log(`   ✗ goto failed: ${e.message}`);
    continue;
  }

  try {
    await page.waitForSelector('#resume-root', { timeout: 15000 });
  } catch {
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
    console.log(`   ⚠️ #resume-root not found. Body: ${bodyText}`);
    continue;
  }

  await page.waitForTimeout(1500);
  const el = page.locator('#resume-root');
  await el.screenshot({ path: join(OUT_DIR, `${id}.png`), type: 'png' });
  console.log(`   ✓ saved → public/screenshots/${id}.png`);
}

await browser.close();
console.log('\n✅ Done!');
process.exit(0);
