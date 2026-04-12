/**
 * Capture real app-shell screenshots (Dashboard + Editor).
 * Uses #/app-preview route (auth bypass) with pre-seeded localStorage mock data.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST    = join(ROOT, 'dist');
const OUT_DIR = join(ROOT, 'public', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
  '.css':  'text/css', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico':  'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};
const FAKE_ORIGIN = 'http://path-screenshot.internal';

// ── Mock localStorage data ────────────────────────────────────────────
// Matches the shape persisted by resumeStore's zustand-persist middleware.
const MOCK_STORAGE = {
  state: {
    persons: [
      {
        id: 'p1', name: 'Sophie Wagner',
        resumeIds: ['r1', 'r2', 'r3', 'r4'],
        personalInfo: {
          firstName: 'Sophie', lastName: 'Wagner',
          title: 'Senior UX Designerin', email: 'sophie.wagner@beispiel.ch',
          phone: '+41 79 456 78 90', street: 'Seestrasse 42', location: '8002 Zürich',
          website: 'sophiewagner.ch', linkedin: 'linkedin.com/in/sophiewagner', github: '',
          summary: 'Leidenschaftliche UX-Designerin mit 6 Jahren Erfahrung in nutzerzentriertem Design.',
        },
      },
    ],
    resumes: [
      {
        id: 'r1', personId: 'p1', name: 'UX Lead', status: 'interview',
        templateId: 'minimal', accentColor: '#007AFF',
        jobUrl: 'https://zuhlke.com/jobs/123', deadline: '2025-05-15',
        coverLetter: { recipient: 'HR Team', subject: 'Bewerbung als UX Lead', body: '', closing: 'Mit freundlichen Grüssen' },
        personalInfo: {
          firstName: 'Sophie', lastName: 'Wagner', title: 'Senior UX Designerin',
          email: 'sophie.wagner@beispiel.ch', phone: '+41 79 456 78 90',
          street: 'Seestrasse 42', location: '8002 Zürich',
          website: 'sophiewagner.ch', linkedin: 'linkedin.com/in/sophiewagner', github: '', summary: '',
        },
        workExperience: [
          { id: 'w1', company: 'Zühlke Engineering AG', position: 'Senior UX Designer', location: 'Zürich', startDate: '2021-03', endDate: '', current: true, description: 'Gestaltung von UX-Projekten für Fintech-Kunden.', highlights: [] },
          { id: 'w2', company: 'SBB AG', position: 'UX/UI Designer', location: 'Bern', startDate: '2018-09', endDate: '2021-02', current: false, description: 'Redesign der SBB Mobile App.', highlights: [] },
        ],
        education: [
          { id: 'e1', degree: 'Master of Arts', field: 'Interaction Design', institution: 'ZHdK', location: 'Zürich', startDate: '2015-09', endDate: '2017-05', grade: '5.6', description: '' },
        ],
        skills: [
          { id: 's1', name: 'Figma', level: 5, category: 'Design' },
          { id: 's2', name: 'User Research', level: 5, category: 'Design' },
          { id: 's3', name: 'HTML / CSS', level: 4, category: 'Entwicklung' },
        ],
        languages: [
          { id: 'l1', name: 'Deutsch', level: 'Muttersprache' },
          { id: 'l2', name: 'Englisch', level: 'Fließend' },
        ],
        projects: [], certificates: [], documents: [], customSections: [],
        createdAt: '2025-04-01T10:00:00Z', updatedAt: '2025-04-10T14:00:00Z',
      },
      {
        id: 'r2', personId: 'p1', name: 'Senior Designer', status: 'sent',
        templateId: 'modern', accentColor: '#00b4d8',
        jobUrl: '', deadline: '2025-05-22',
        coverLetter: { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' },
        personalInfo: { firstName: 'Sophie', lastName: 'Wagner', title: 'Senior UX Designerin', email: 'sophie.wagner@beispiel.ch', phone: '+41 79 456 78 90', street: 'Seestrasse 42', location: '8002 Zürich', website: '', linkedin: '', github: '', summary: '' },
        workExperience: [], education: [], skills: [], languages: [],
        projects: [], certificates: [], documents: [], customSections: [],
        createdAt: '2025-04-03T10:00:00Z', updatedAt: '2025-04-09T14:00:00Z',
      },
      {
        id: 'r3', personId: 'p1', name: 'Product Designer', status: 'draft',
        templateId: 'corporate', accentColor: '#f0c040',
        jobUrl: '', deadline: '',
        coverLetter: { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' },
        personalInfo: { firstName: 'Sophie', lastName: 'Wagner', title: 'Senior UX Designerin', email: 'sophie.wagner@beispiel.ch', phone: '+41 79 456 78 90', street: 'Seestrasse 42', location: '8002 Zürich', website: '', linkedin: '', github: '', summary: '' },
        workExperience: [], education: [], skills: [], languages: [],
        projects: [], certificates: [], documents: [], customSections: [],
        createdAt: '2025-04-05T10:00:00Z', updatedAt: '2025-04-08T14:00:00Z',
      },
      {
        id: 'r4', personId: 'p1', name: 'Design Lead', status: 'sent',
        templateId: 'nordic', accentColor: '#2b7a78',
        jobUrl: '', deadline: '2025-05-30',
        coverLetter: { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' },
        personalInfo: { firstName: 'Sophie', lastName: 'Wagner', title: 'Senior UX Designerin', email: 'sophie.wagner@beispiel.ch', phone: '+41 79 456 78 90', street: 'Seestrasse 42', location: '8002 Zürich', website: '', linkedin: '', github: '', summary: '' },
        workExperience: [], education: [], skills: [], languages: [],
        projects: [], certificates: [], documents: [], customSections: [],
        createdAt: '2025-04-06T10:00:00Z', updatedAt: '2025-04-07T14:00:00Z',
      },
    ],
    activePersonId: 'p1',
    activeResumeId: 'r1',
    activeSection: 'overview',
  },
  version: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────
function patchHtml(raw) {
  return raw
    .replace(/\s+crossorigin(?:="[^"]*")?/gi, '')
    .replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/gi, '');
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

// Inject mock localStorage BEFORE any page scripts run
async function makeContext() {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    storageState: {
      cookies: [],
      origins: [{
        origin: FAKE_ORIGIN,
        localStorage: [
          { name: 'aicv-storage', value: JSON.stringify(MOCK_STORAGE) },
          { name: 'path_onboarding_done', value: '1' },
        ],
      }],
    },
  });
  return ctx;
}

async function makePage(ctx) {
  const page = await ctx.newPage();
  page.on('pageerror',     err => console.error(`[pageerror] ${err.message}`));
  page.on('console',       msg => { if (msg.type() === 'error') console.error(`[err] ${msg.text()}`); });

  await page.route('**/*', async (route) => {
    const reqUrl  = new URL(route.request().url());
    if (reqUrl.origin !== FAKE_ORIGIN) return route.abort();

    const reqPath = reqUrl.pathname;
    const htmlEntry = join(DIST, 'index.html');
    if (reqPath === '/' || reqPath === '/index.html') {
      return route.fulfill({ status: 200, contentType: MIME['.html'], body: patchHtml(readFileSync(htmlEntry, 'utf-8')) });
    }
    const file = join(DIST, reqPath);
    if (existsSync(file)) {
      const body = readFileSync(file);
      return route.fulfill({ status: 200, contentType: MIME[extname(file)] ?? 'application/octet-stream', body });
    }
    return route.abort();
  });
  return page;
}

// ── Capture dashboard ─────────────────────────────────────────────────
async function captureDashboard() {
  console.log('📸 dashboard…');
  const ctx  = await makeContext();
  const page = await makePage(ctx);

  // ?preview=1 bypasses auth; no hash → HashRouter routes to / (Dashboard)
  await page.goto(`${FAKE_ORIGIN}/?preview=1`, { waitUntil: 'commit', timeout: 15000 });

  // Wait for the resume cards to appear (Dashboard renders ResumeCards)
  try {
    await page.waitForSelector('[data-testid="resume-card"], .resume-card, [class*="ResumeCard"], h1, main', { timeout: 15000 });
  } catch { /* proceed */ }

  // Give the UI a moment to settle
  await page.waitForTimeout(2500);

  await page.screenshot({ path: join(OUT_DIR, 'app-dashboard.png'), type: 'png', fullPage: false });
  console.log('   ✓ saved → public/screenshots/app-dashboard.png');

  await ctx.close();
}

// ── Capture editor (template selector tab) ────────────────────────────
async function captureEditor() {
  console.log('📸 editor…');
  const ctx  = await makeContext();
  const page = await makePage(ctx);

  // Navigate to app-preview then simulate clicking into the editor
  // Navigate to editor section (overview tab shows resume form)
  await page.goto(`${FAKE_ORIGIN}/?preview=1#/editor`, { waitUntil: 'commit', timeout: 15000 });

  try {
    await page.waitForSelector('main, [role="main"], form, input', { timeout: 15000 });
  } catch { /* proceed */ }

  await page.waitForTimeout(2500);

  await page.screenshot({ path: join(OUT_DIR, 'app-editor.png'), type: 'png', fullPage: false });
  console.log('   ✓ saved → public/screenshots/app-editor.png');

  await ctx.close();
}

console.log('✓ Starting app screenshots…\n');
await captureDashboard();
await captureEditor();

await browser.close();
console.log('\n✅ Done!');
process.exit(0);
