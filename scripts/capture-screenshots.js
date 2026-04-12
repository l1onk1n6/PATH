// scripts/capture-screenshots.js
// Usage: node scripts/capture-screenshots.js
// Starts the Vite dev server, captures template screenshots, saves to public/screenshots/

import { chromium } from 'playwright';
import { spawn }    from 'child_process';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const OUT_DIR   = join(ROOT, 'public', 'screenshots');

const TEMPLATES = [
  { id: 'minimal',    accent: '#007AFF', label: 'Minimal'    },
  { id: 'modern',     accent: '#00b4d8', label: 'Modern'     },
  { id: 'corporate',  accent: '#f0c040', label: 'Corporate'  },
  { id: 'nordic',     accent: '#2b7a78', label: 'Nordic'     },
  { id: 'creative',   accent: '#f72585', label: 'Creative'   },
  { id: 'tech',       accent: '#58a6ff', label: 'Tech'       },
];

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      fetch(url).then(() => resolve()).catch(() => {
        if (Date.now() - start > timeout) reject(new Error('Server timeout'));
        else setTimeout(check, 500);
      });
    };
    check();
  });
}

mkdirSync(OUT_DIR, { recursive: true });

// Start Vite dev server
const vite = spawn('npm', ['run', 'dev', '--', '--port', '5199', '--host'], {
  cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, BROWSER: 'none' },
});

vite.stdout.on('data', d => process.stdout.write(d));
vite.stderr.on('data', d => process.stderr.write(d));

process.on('exit', () => vite.kill());

try {
  console.log('⏳ Waiting for dev server on port 5199…');
  await waitForServer('http://localhost:5199');
  console.log('✓ Dev server ready\n');

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 794, height: 1123 } });
  const page    = await context.newPage();

  for (const { id, accent, label } of TEMPLATES) {
    const url = `http://localhost:5199/#/screenshot?t=${id}&accent=${encodeURIComponent(accent)}`;
    console.log(`📸 Capturing ${label} (${id})…`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('#resume-root', { timeout: 10000 });

    // Give fonts/images time to load
    await page.waitForTimeout(800);

    const el   = await page.$('#resume-root');
    const file = join(OUT_DIR, `${id}.png`);
    await el.screenshot({ path: file });
    console.log(`  ✓ Saved → public/screenshots/${id}.png`);
  }

  await browser.close();
  console.log('\n✅ All screenshots saved to public/screenshots/');
} finally {
  vite.kill();
  process.exit(0);
}
