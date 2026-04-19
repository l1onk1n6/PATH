/**
 * Play-Store-Assets: Feature Graphic (1024x500) + 4 Screenshots (1080x1920).
 * Erzeugt aus SVG-Vorlagen per sharp.
 *
 * Ausfuehren:  node scripts/generate-store-assets.mjs
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../store');
const shotsDir = join(outDir, 'screenshots');
mkdirSync(outDir, { recursive: true });
mkdirSync(shotsDir, { recursive: true });

// ─────────────────────────────────────────────────────────────
//  Gemeinsame Stilbausteine (aus public/og-image.svg abgeleitet)
// ─────────────────────────────────────────────────────────────
const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#0f1923"/>
      <stop offset="100%" stop-color="#1a2a3a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#34C759"/>
      <stop offset="100%" stop-color="#00C7BE"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="60" result="b"/>
      <feComposite in="SourceGraphic" in2="b" operator="over"/>
    </filter>
    <filter id="shadow">
      <feGaussianBlur stdDeviation="18" result="b"/>
      <feOffset in="b" dx="0" dy="12" result="o"/>
      <feComposite in="SourceGraphic" in2="o" operator="over"/>
    </filter>
  </defs>
`;

const logoMark = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <rect width="72" height="72" rx="18" fill="url(#accent)"/>
    <path d="M16 54L60 12" stroke="white" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M36 12H60V36" stroke="white" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
`;

const bg = (w, h) => `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${w * 0.15}" cy="${h * 0.2}" rx="${w * 0.3}" ry="${h * 0.25}" fill="#007AFF" opacity="0.08" filter="url(#glow)"/>
  <ellipse cx="${w * 0.85}" cy="${h * 0.85}" rx="${w * 0.3}" ry="${h * 0.25}" fill="#34C759" opacity="0.08" filter="url(#glow)"/>
`;

// ─────────────────────────────────────────────────────────────
//  Feature Graphic  1024x500
// ─────────────────────────────────────────────────────────────
const featureSvg = `<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  ${bg(1024, 500)}
  ${logoMark(80, 140, 1.1)}
  <text x="180" y="206" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" fill="white" letter-spacing="-2">PATH</text>
  <text x="80" y="286" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="400" fill="white" opacity="0.6">Bewerbungsmappe leicht gemacht</text>
  <g font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="white" opacity="0.75">
    <rect x="80" y="340" width="180" height="38" rx="19" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.12"/>
    <text x="170" y="364" text-anchor="middle">Lebenslauf</text>
    <rect x="276" y="340" width="180" height="38" rx="19" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.12"/>
    <text x="366" y="364" text-anchor="middle">Anschreiben</text>
    <rect x="472" y="340" width="180" height="38" rx="19" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.12"/>
    <text x="562" y="364" text-anchor="middle">PDF Export</text>
    <rect x="668" y="340" width="180" height="38" rx="19" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.12"/>
    <text x="758" y="364" text-anchor="middle">15+ Templates</text>
  </g>
  <text x="80" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="#34C759" opacity="0.85">path.pixmatic.ch</text>
  <text x="944" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400" fill="white" opacity="0.3" text-anchor="end">by pixmatic</text>
</svg>`;

// ─────────────────────────────────────────────────────────────
//  Screenshot-Template: Status-Bar + Titel/Subtitel + Inhalt
// ─────────────────────────────────────────────────────────────
function screenshot({ headline, subline, content }) {
  const W = 1080, H = 1920;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    ${bg(W, H)}

    <!-- Status bar hint -->
    <text x="60" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="white" opacity="0.5">9:41</text>
    <g transform="translate(${W - 180} 40)" fill="white" opacity="0.5">
      <rect x="0" y="4" width="22" height="14" rx="2"/>
      <rect x="28" y="4" width="22" height="14" rx="2"/>
      <rect x="56" y="0" width="48" height="22" rx="4" stroke="white" fill="none" stroke-width="2"/>
      <rect x="58" y="2" width="40" height="18" rx="3" fill="white"/>
    </g>

    <!-- Logo -->
    ${logoMark(60, 140, 0.9)}
    <text x="142" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="800" fill="white" letter-spacing="-1">PATH</text>

    <!-- Headline -->
    <text x="60" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="800" fill="white" letter-spacing="-2">
      ${headline.split('\\n').map((line, i) => `<tspan x="60" dy="${i === 0 ? 0 : 88}">${line}</tspan>`).join('')}
    </text>

    <!-- Subline -->
    <text x="60" y="${340 + headline.split('\\n').length * 88 + 44}" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="400" fill="white" opacity="0.55">
      ${subline.split('\\n').map((line, i) => `<tspan x="60" dy="${i === 0 ? 0 : 42}">${line}</tspan>`).join('')}
    </text>

    ${content}

    <!-- Footer -->
    <text x="${W / 2}" y="${H - 50}" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" fill="white" opacity="0.3" text-anchor="middle">path.pixmatic.ch · by pixmatic</text>
  </svg>`;
}

const shot1 = screenshot({
  headline: 'Deine\\nBewerbung.\\nIn Minuten.',
  subline: 'Lebenslauf, Anschreiben und komplette\\nMappe — in einer App.',
  content: `
    <g transform="translate(60 1040)">
      <rect width="960" height="620" rx="32" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.12"/>
      <rect x="40" y="40" width="160" height="160" rx="80" fill="url(#accent)"/>
      <text x="220" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="white">Maria Muster</text>
      <text x="220" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400" fill="white" opacity="0.55">UX Designerin · Zürich</text>
      <rect x="220" y="180" width="280" height="36" rx="18" fill="white" fill-opacity="0.1"/>
      <text x="360" y="205" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="#34C759" text-anchor="middle">92% vollständig</text>
      <g transform="translate(40 260)">
        <rect width="880" height="68" rx="14" fill="white" fill-opacity="0.05"/>
        <text x="30" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="white">Berufserfahrung</text>
        <text x="850" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="white" opacity="0.45" text-anchor="end">4 Einträge</text>
      </g>
      <g transform="translate(40 346)">
        <rect width="880" height="68" rx="14" fill="white" fill-opacity="0.05"/>
        <text x="30" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="white">Ausbildung</text>
        <text x="850" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="white" opacity="0.45" text-anchor="end">2 Einträge</text>
      </g>
      <g transform="translate(40 432)">
        <rect width="880" height="68" rx="14" fill="white" fill-opacity="0.05"/>
        <text x="30" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="white">Fähigkeiten</text>
        <text x="850" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="white" opacity="0.45" text-anchor="end">8 Einträge</text>
      </g>
      <g transform="translate(40 518)">
        <rect width="880" height="68" rx="14" fill="white" fill-opacity="0.05"/>
        <text x="30" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="white">Sprachen</text>
        <text x="850" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="white" opacity="0.45" text-anchor="end">3 Einträge</text>
      </g>
    </g>
  `,
});

const shot2 = screenshot({
  headline: '15+ Vorlagen.\\nEin Klick.',
  subline: 'Von klassisch bis modern. Akzentfarbe frei\\nwählbar.',
  content: `
    <g transform="translate(60 1040)">
      ${['Minimal', 'Modern', 'Elegant', 'Corporate', 'Nordic', 'Classic']
        .map((name, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const x = col * 320, y = row * 320;
          const palette = ['#34C759', '#007AFF', '#FF9F0A', '#AF52DE', '#00C7BE', '#FF375F'][i];
          return `<g transform="translate(${x} ${y})">
            <rect width="280" height="280" rx="24" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.12"/>
            <rect x="20" y="20" width="240" height="200" rx="10" fill="white"/>
            <rect x="40" y="40" width="60" height="60" rx="30" fill="${palette}" opacity="0.9"/>
            <rect x="110" y="50" width="120" height="14" rx="4" fill="#333" opacity="0.8"/>
            <rect x="110" y="74" width="90" height="10" rx="3" fill="#999"/>
            <rect x="40" y="120" width="200" height="8" rx="3" fill="${palette}" opacity="0.7"/>
            <rect x="40" y="138" width="160" height="6" rx="2" fill="#bbb"/>
            <rect x="40" y="152" width="180" height="6" rx="2" fill="#bbb"/>
            <rect x="40" y="166" width="120" height="6" rx="2" fill="#bbb"/>
            <rect x="40" y="190" width="200" height="8" rx="3" fill="${palette}" opacity="0.7"/>
            <text x="140" y="258" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="white" text-anchor="middle">${name}</text>
          </g>`;
        })
        .join('')}
    </g>
  `,
});

const shot3 = screenshot({
  headline: 'Ganze Mappe.\\nEine PDF.',
  subline: 'Anschreiben, Lebenslauf, Zeugnisse —\\ndruckfertig in Sekunden.',
  content: `
    <g transform="translate(60 1040)">
      <g transform="translate(120 0)">
        <rect width="720" height="780" rx="18" fill="white" filter="url(#shadow)"/>
        <rect x="60" y="70" width="400" height="24" rx="4" fill="#0f1923" opacity="0.9"/>
        <rect x="60" y="110" width="280" height="14" rx="3" fill="#999"/>
        <rect x="60" y="180" width="600" height="3" fill="url(#accent)"/>
        <rect x="60" y="220" width="200" height="18" rx="4" fill="#0f1923" opacity="0.8"/>
        <rect x="60" y="252" width="500" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="268" width="450" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="284" width="480" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="320" width="160" height="16" rx="4" fill="#0f1923" opacity="0.8"/>
        <rect x="60" y="350" width="500" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="366" width="430" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="382" width="470" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="420" width="180" height="16" rx="4" fill="#0f1923" opacity="0.8"/>
        <rect x="60" y="450" width="500" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="466" width="420" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="482" width="490" height="8" rx="2" fill="#bbb"/>
        <rect x="60" y="520" width="200" height="16" rx="4" fill="#0f1923" opacity="0.8"/>
        <g transform="translate(60 550)">
          ${['HTML', 'CSS', 'React', 'Figma', 'Node'].map((s, i) =>
            `<g transform="translate(${i * 115} 0)">
              <rect width="100" height="32" rx="16" fill="url(#accent)" opacity="0.8"/>
              <text x="50" y="22" font-family="system-ui" font-size="14" font-weight="600" fill="white" text-anchor="middle">${s}</text>
            </g>`).join('')}
        </g>
      </g>
      <g transform="translate(450 640)">
        <rect width="440" height="100" rx="50" fill="url(#accent)" filter="url(#shadow)"/>
        <text x="220" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="white" text-anchor="middle">PDF exportieren</text>
      </g>
    </g>
  `,
});

const shot4 = screenshot({
  headline: 'Alle Bewerbungen.\\nIm Blick.',
  subline: 'Bewerbungs-Tracker mit Status, Deadline\\nund verknüpften Dokumenten.',
  content: `
    <g transform="translate(60 1040)">
      ${[
        { firm: 'Acme AG', role: 'UX Designerin', state: 'Gespräch', col: '#FF9F0A' },
        { firm: 'Globex', role: 'Senior Designer', state: 'Bewerbung', col: '#007AFF' },
        { firm: 'Initech', role: 'Product Designer', state: 'Zusage', col: '#34C759' },
        { firm: 'Hooli', role: 'Design Lead', state: 'Entwurf', col: '#8E8E93' },
        { firm: 'Pied Piper', role: 'Head of Design', state: 'Absage', col: '#FF453A' },
      ].map((a, i) => `
        <g transform="translate(0 ${i * 130})">
          <rect width="960" height="110" rx="20" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.1"/>
          <text x="32" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="white">${a.firm}</text>
          <text x="32" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="white" opacity="0.55">${a.role}</text>
          <rect x="760" y="36" width="180" height="42" rx="21" fill="${a.col}" fill-opacity="0.22" stroke="${a.col}" stroke-opacity="0.6" stroke-width="1.5"/>
          <text x="850" y="64" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="${a.col}" text-anchor="middle">${a.state}</text>
        </g>
      `).join('')}
    </g>
  `,
});

// ─────────────────────────────────────────────────────────────
//  Rendern
// ─────────────────────────────────────────────────────────────
async function render(svg, out, w, h) {
  await sharp(Buffer.from(svg)).resize(w, h).png({ quality: 92 }).toFile(out);
  console.log(`✓ ${out}`);
}

await render(featureSvg, join(outDir, 'feature-graphic.png'), 1024, 500);
await render(shot1, join(shotsDir, '01-dashboard.png'), 1080, 1920);
await render(shot2, join(shotsDir, '02-templates.png'), 1080, 1920);
await render(shot3, join(shotsDir, '03-pdf-export.png'), 1080, 1920);
await render(shot4, join(shotsDir, '04-tracker.png'), 1080, 1920);

// App-Icon 512x512 fuer Play Store (aus vorhandenem logo-512.png)
await sharp(join(__dirname, '../public/logo-512.png'))
  .resize(512, 512)
  .png()
  .toFile(join(outDir, 'app-icon-512.png'));
console.log(`✓ ${join(outDir, 'app-icon-512.png')}`);
