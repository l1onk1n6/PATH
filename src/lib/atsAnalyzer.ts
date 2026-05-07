import type { Resume } from '../types/resume';
import { parseBulletLines } from '../components/templates/pdf/shared-utils';
import { tr } from './i18n';

/**
 * Sehr einfacher client-seitiger ATS-Analyzer:
 * - extrahiert Keywords aus der Job-Description (deutsch + englisch Stopwords)
 * - vergleicht sie mit dem konsolidierten CV-Text
 * - liefert Score 0-100, gefundene/fehlende Keywords, kurze Tipps
 *
 * Bewusst kein KI-Call — instant, gratis, deterministisch. Kann spaeter
 * durch eine Edge Function mit LLM-Analyse erweitert werden, falls bessere
 * Qualitaet gewuenscht ist.
 */

const STOPWORDS = new Set<string>([
  // German
  'der','die','das','und','oder','mit','von','fuer','für','im','in','zu','bei','aus','auf','am','an','als','zum','zur','des','dem','den','ein','eine','einen','einem','einer','eines','wir','sie','er','es','wir','uns','unser','unsere','sind','ist','war','waren','werden','wird','wurde','wurden','haben','hat','hatte','hatten','sein','seine','seinem','seinen','seiner','seines','dass','dass','wenn','weil','aber','auch','noch','sehr','mehr','schon','nur','nicht','kein','keine','keinen','keiner','sowie','sowohl','nach','ueber','über','unter','zwischen','ab','bis','ohne','durch','gegen','um','dieser','diese','dieses','jeder','jede','jedes','alle','alles','andere','anderen','etwa','beim','vom','zum','jeweils','etc','bzw','sowie',
  // English
  'the','a','an','and','or','but','of','to','in','for','with','on','at','from','by','as','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','could','can','may','might','must','shall','this','that','these','those','what','which','who','whom','whose','where','when','why','how','our','your','their','its','it','we','you','they','he','she','i','me','my','him','her','them','us','about','into','through','during','before','after','above','below','between','than','more','most','other','some','such','no','not','only','own','same','so','than','too','very','just','also','etc',
  // Common job-spec filler
  'jahre','jahr','years','year','team','arbeit','arbeiten','aufgabe','aufgaben','sowie','position','stelle','rolle','bereich','bereiche','bereich','sehr','gute','guten','gut','gerne','idealerweise','wuenschenswert','required','requirements','desired','preferred','strong','solid','excellent','plus','nice','must',
]);

/** Toleranter Tokenizer: Buchstaben + Ziffern + ein paar Zeichen aus Tech-Begriffen. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[–—]/g, ' ')           // em/en dash
    .split(/[^a-z0-9äöüß+#./-]+/i)
    .map(t => t.replace(/^[-+./]+|[-+./]+$/g, ''))   // strip leading/trailing punctuation
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

/** Frequenztabelle: Wort → count. */
function freq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/** Konsolidierter CV-Text — alle relevanten Felder als ein String. */
function buildResumeText(resume: Resume): string {
  const parts: string[] = [];
  const pi = resume.personalInfo;
  parts.push(pi.firstName || '', pi.lastName || '', pi.title || '', pi.summary || '');
  parts.push(resume.coverLetter?.body || '', resume.coverLetter?.subject || '');
  for (const w of resume.workExperience) {
    parts.push(w.position || '', w.company || '', w.location || '', w.description || '');
    parts.push(...(w.highlights || []));
  }
  for (const e of resume.education) {
    parts.push(e.degree || '', e.field || '', e.institution || '', e.description || '');
  }
  for (const s of resume.skills) parts.push(s.name || '', s.category || '');
  for (const l of resume.languages) parts.push(l.name || '');
  for (const p of resume.projects ?? []) {
    parts.push(p.name || '', p.description || '');
    parts.push(...(p.technologies || []));
  }
  for (const c of resume.certificates ?? []) parts.push(c.name || '', c.issuer || '');
  for (const cs of resume.customSections ?? []) {
    parts.push(cs.title || '', ...parseBulletLines(cs.items?.join('\n') || ''));
  }
  return parts.join(' ');
}

export interface AtsAnalysis {
  score: number;                // 0..100
  matched: { keyword: string; jdCount: number }[];
  missing: { keyword: string; jdCount: number }[];
  tips: string[];
  totalJdKeywords: number;
}

export function analyzeAts(resume: Resume, jobDescription: string): AtsAnalysis {
  const jd = tokenize(jobDescription);
  if (jd.length === 0) {
    return { score: 0, matched: [], missing: [], tips: [tr('Job-Beschreibung ist zu kurz oder leer.')], totalJdKeywords: 0 };
  }

  const jdFreq = freq(jd);
  const cv = new Set(tokenize(buildResumeText(resume)));

  // Top-N Keywords nach Frequenz aus der JD (nur die wirklich repetierten — Signal-Stärke)
  const sortedKeywords = [...jdFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([_w, c]) => c >= 1);

  // Auf max 40 Keywords kappen — reicht voellig fuer Score-Bildung
  const top = sortedKeywords.slice(0, 40);

  const matched: AtsAnalysis['matched']  = [];
  const missing: AtsAnalysis['missing']  = [];

  for (const [w, c] of top) {
    // Match-Heuristik: exakter Token oder Substring (handhabt einfache Pluralformen)
    const isMatch = cv.has(w) || [...cv].some(t => t.includes(w) || w.includes(t));
    if (isMatch) matched.push({ keyword: w, jdCount: c });
    else missing.push({ keyword: w, jdCount: c });
  }

  // Score: gewichtet nach JD-Frequenz
  const totalWeight = top.reduce((s, [_, c]) => s + c, 0);
  const matchedWeight = matched.reduce((s, m) => s + m.jdCount, 0);
  const score = totalWeight === 0 ? 0 : Math.round((matchedWeight / totalWeight) * 100);

  // Tipps
  const tips: string[] = [];
  if (score >= 80) {
    tips.push(tr('Sehr gute Übereinstimmung — der Lebenslauf passt thematisch sauber zur Stelle.'));
  } else if (score >= 60) {
    tips.push(tr('Solide Basis. Ergaenze die unten gelisteten Keywords dort wo sie inhaltlich passen.'));
  } else if (score >= 40) {
    tips.push(tr('Mittlere Übereinstimmung. Fokussiere die Berufserfahrung-Beschreibungen auf die fehlenden Begriffe.'));
  } else {
    tips.push(tr('Geringe Übereinstimmung. Pruefe ob die Stelle wirklich zu deinem Profil passt — oder ueberarbeite Summary, Skills und Aufgabenbeschreibungen mit den Begriffen aus der JD.'));
  }
  if (missing.length > 0) {
    const top3 = missing.slice(0, 3).map(m => m.keyword).join(', ');
    tips.push(`Hochfrequent in der JD aber im CV nicht erwaehnt: ${top3}.`);
  }
  if (resume.skills.length < 5) {
    tips.push(tr('Skills-Sektion ist sehr kurz — viele ATS-Systeme parsen Skills bevorzugt aus dieser Sektion.'));
  }
  if (!resume.personalInfo.summary || resume.personalInfo.summary.length < 80) {
    tips.push(tr('Eine 2–3 Zeilen Kurzzusammenfassung oben erhoeht den Match deutlich, weil Keywords prominent platziert sind.'));
  }

  return { score, matched, missing, tips, totalJdKeywords: top.length };
}
