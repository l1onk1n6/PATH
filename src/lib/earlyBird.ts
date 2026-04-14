// ── Early Bird Promotion Config ────────────────────────────────────────────
// To disable: set active = false  OR  set endsAt to a past date.
// To change: edit code, label, discount, endsAt.

export const EARLY_BIRD = {
  active:   true,
  code:     'START25',
  discount: '50% Rabatt — einmalig',
  label:    'Early Bird',
  endsAt:   new Date('2026-05-25T23:59:59'),
} as const;

export function earlyBirdActive(): boolean {
  return EARLY_BIRD.active && Date.now() < EARLY_BIRD.endsAt.getTime();
}

export function earlyBirdCountdown(): { days: number; hours: number; minutes: number; seconds: number } {
  const diff = Math.max(0, EARLY_BIRD.endsAt.getTime() - Date.now());
  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, minutes, seconds };
}
