// ── Photo validation ────────────────────────────────────────

export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB (default fallback)

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validatePhotoFile(file: File, maxMb = 2): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Nur JPG, PNG, WEBP oder GIF erlaubt.' };
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Bild zu groß. Maximal ${maxMb} MB erlaubt.` };
  }
  return { valid: true };
}

// Only allow known-safe image data URIs and HTTPS URLs.
export function sanitizePhotoUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('data:image/jpeg;base64,') ||
    trimmed.startsWith('data:image/png;base64,') ||
    trimmed.startsWith('data:image/webp;base64,') ||
    trimmed.startsWith('data:image/gif;base64,')
  ) {
    return trimmed;
  }
  if (/^https:\/\/.{4,}/.test(trimmed)) return trimmed;
  return '';
}

// ── Password strength ────────────────────────────────────────

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function passwordStrength(pw: string): PasswordStrength {
  if (pw.length < 8) return 'weak';
  const hasNumber = /\d/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (hasNumber && (hasUpper || hasSpecial)) return 'strong';
  return 'medium';
}

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Schwach',
  medium: 'Mittel',
  strong: 'Stark',
};

export const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak: '#ff3b30',
  medium: '#ff9500',
  strong: '#34c759',
};

// ── Supabase URL validation ──────────────────────────────────

export function validateSupabaseUrl(url: string): boolean {
  // Accepts standard *.supabase.co projects
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url.trim());
}

// Looks like a JWT (anon key format)
export function validateSupabaseKey(key: string): boolean {
  return key.trim().startsWith('eyJ') && key.trim().length > 100;
}

// ── Magic bytes file validation ─────────────────────────────
// Reads the first bytes of a file to verify the actual format matches
// the claimed MIME type. Prevents polyglot / extension-spoofed uploads.

const MAGIC_PATTERNS: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],                             // %PDF
  'image/jpeg':      [[0xFF, 0xD8, 0xFF]],                                    // JPEG SOI
  'image/png':       [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],    // PNG header
  'image/gif':       [[0x47, 0x49, 0x46, 0x38]],                             // GIF8 (87a / 89a)
}

export async function validateMagicBytes(file: File): Promise<boolean> {
  if (file.type === 'image/webp') {
    // WebP = RIFF????WEBP (12 bytes)
    const buf = await file.slice(0, 12).arrayBuffer()
    const b = new Uint8Array(buf)
    return (
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&  // RIFF
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50   // WEBP
    )
  }

  const patterns = MAGIC_PATTERNS[file.type]
  if (!patterns) return false  // unsupported MIME type

  const buf = await file.slice(0, 8).arrayBuffer()
  const b = new Uint8Array(buf)
  return patterns.some(pattern => pattern.every((byte, i) => b[i] === byte))
}

// ── Rate limiter (in-memory, client-side) ───────────────────

export class RateLimiter {
  private attempts = 0;
  private lockoutUntil = 0;
  private readonly maxAttempts: number;
  private readonly lockoutMs: number;

  constructor(maxAttempts = 5, lockoutMs = 30_000) {
    this.maxAttempts = maxAttempts;
    this.lockoutMs = lockoutMs;
  }

  isLocked(): boolean {
    return Date.now() < this.lockoutUntil;
  }

  secondsRemaining(): number {
    return Math.ceil(Math.max(0, this.lockoutUntil - Date.now()) / 1000);
  }

  recordFailure(): void {
    this.attempts += 1;
    if (this.attempts >= this.maxAttempts) {
      this.lockoutUntil = Date.now() + this.lockoutMs;
      this.attempts = 0;
    }
  }

  reset(): void {
    this.attempts = 0;
    this.lockoutUntil = 0;
  }
}
