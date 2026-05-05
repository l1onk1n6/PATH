// localStorage-Helpers fuer den Onboarding-Status. Bewusst getrennt von der
// Modal-Komponente, damit Fast-Refresh (HMR) sauber funktioniert.
const ONBOARDING_KEY = 'path_onboarding_done';

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
  window.dispatchEvent(new CustomEvent('start-onboarding'));
}

export function markOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}
