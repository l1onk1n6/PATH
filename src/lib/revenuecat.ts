import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  type CustomerInfo,
} from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAuthStore } from '../store/authStore';

// Oeffentlicher RevenueCat-SDK-Key (Android). Vite-Env oder Fallback.
// Public-Keys duerfen im Client-Bundle stehen (RevenueCat-Design).
const ANDROID_KEY = (import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined)
  ?? 'test_pzyfriUGvncTCKcsHHjjrvUlaHk';

/** Name des Entitlements im RevenueCat-Dashboard. Muss dort exakt so heissen. */
export const PRO_ENTITLEMENT = 'pro';

let configured = false;
let listenerAttached = false;

export function isRevenueCatNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Initialisiert das SDK (nur nativ). Idempotent — kann mehrfach aufgerufen werden. */
export async function initRevenueCat(supabaseUserId?: string | null): Promise<void> {
  if (!isRevenueCatNative()) return;
  if (!configured) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.INFO });
    await Purchases.configure({ apiKey: ANDROID_KEY, appUserID: supabaseUserId ?? undefined });
    configured = true;
  } else if (supabaseUserId) {
    // User hat sich nach dem ersten Init angemeldet → mit RC verknuepfen
    await Purchases.logIn({ appUserID: supabaseUserId });
  }
  if (!listenerAttached) {
    await Purchases.addCustomerInfoUpdateListener(async (info) => {
      await syncEntitlementToSupabase(info);
    });
    listenerAttached = true;
  }
}

/** Bei Logout: RC-User abhaengen, damit anonyme Session startet. */
export async function logOutRevenueCat(): Promise<void> {
  if (!isRevenueCatNative() || !configured) return;
  try { await Purchases.logOut(); } catch { /* already anonymous */ }
}

/** True wenn das Pro-Entitlement aktiv ist (inkl. Grace-Period). */
export function hasProEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[PRO_ENTITLEMENT]);
}

/** Aktuellen Status aus dem SDK holen (Cache oder Netz, je nach RC). */
export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatNative() || !configured) return null;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

/** Blockiert bis Paywall geschlossen. Gibt zurueck ob der Kauf erfolgreich war. */
export async function presentProPaywall(): Promise<boolean> {
  if (!isRevenueCatNative()) return false;
  const { result } = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: PRO_ENTITLEMENT,
  });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

/** Oeffnet das Customer Center (Kuendigen, Anliegen, Verlauf). */
export async function presentCustomerCenter(): Promise<void> {
  if (!isRevenueCatNative()) return;
  await RevenueCatUI.presentCustomerCenter();
}

/** Schreibt das Entitlement nach jedem Kauf/Renewal in Supabase-user_metadata,
 *  damit die Web-Version und Server-Logik (z. B. AI-Quota) denselben Status
 *  sehen. Idempotent — schreibt nur bei Aenderung. */
async function syncEntitlementToSupabase(info: CustomerInfo): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const user = useAuthStore.getState().user;
  if (!user) return;

  const entitlement = info.entitlements.active[PRO_ENTITLEMENT];
  const isPro = Boolean(entitlement);
  const currentPlan = (user.user_metadata?.plan as string | undefined) ?? 'free';
  const currentSource = user.user_metadata?.subscription_source as string | undefined;
  const nextPlan = isPro ? 'pro' : 'free';

  // Wichtig: RevenueCat darf nur Pro-Status verwalten, den es selbst gesetzt hat.
  // Wenn der User via Stripe (Web) auf Pro ist, darf ein negativer RC-Status
  // den Stripe-Pro nicht wegschreiben — sonst verlierst du beim ersten Android-
  // Login deinen Web-Pro. Stripe hat seinen eigenen Webhook fuer Downgrades.
  // Guard auch wenn kein source-Tag vorhanden ist (Altbestand), aber currentPlan
  // bereits Pro ist — dann bloss nichts anfassen.
  if (!isPro && currentPlan === 'pro' && currentSource !== 'revenuecat') {
    return;
  }

  if (currentPlan === nextPlan) return;

  try {
    const { data } = await getSupabase().auth.updateUser({
      data: {
        plan: nextPlan,
        subscription_source: isPro ? 'revenuecat' : undefined,
        subscription_period_end: entitlement?.expirationDate
          ? new Date(entitlement.expirationDate).getTime() / 1000
          : undefined,
      },
    });
    if (data.user) useAuthStore.setState({ user: data.user });
  } catch (err) {
    // nicht fatal — Retry beim naechsten Listener-Call
    console.warn('RevenueCat → Supabase sync failed:', err);
  }
}
