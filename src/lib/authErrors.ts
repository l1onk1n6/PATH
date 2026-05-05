// Übersetzt Supabase-Fehlermeldungen (englisch) ins Deutsche
const ERROR_MAP: Record<string, string> = {
  // Login
  'Invalid login credentials':
    'E-Mail oder Passwort ist falsch.',
  'invalid_credentials':
    'E-Mail oder Passwort ist falsch.',
  'Email not confirmed':
    'Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe dein Postfach.',
  'email not confirmed':
    'Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe dein Postfach.',

  // Registrierung
  'User already registered':
    'Diese E-Mail-Adresse ist bereits registriert.',
  'email_exists':
    'Diese E-Mail-Adresse ist bereits registriert.',
  'Email already in use':
    'Diese E-Mail-Adresse ist bereits registriert.',
  'email_address_invalid':
    'Diese E-Mail-Adresse ist ungültig.',
  'A user with this email address has already been registered':
    'Diese E-Mail-Adresse ist bereits registriert.',
  'New email address should be different':
    'Die neue E-Mail-Adresse muss sich von der bisherigen unterscheiden.',

  // Passwort
  'Password should be at least 6 characters':
    'Das Passwort muss mindestens 6 Zeichen lang sein.',
  'Password should be at least 8 characters':
    'Das Passwort muss mindestens 8 Zeichen lang sein.',
  'New password should be different from the old password':
    'Das neue Passwort muss sich vom alten unterscheiden.',
  'same_password':
    'Das neue Passwort muss sich vom alten unterscheiden.',
  'weak_password':
    'Das Passwort ist zu schwach. Bitte wähle ein sichereres Passwort.',

  // Token / Links
  'Token has expired or is invalid':
    'Der Link ist abgelaufen oder ungültig. Bitte fordere einen neuen an.',
  'token_expired':
    'Der Link ist abgelaufen. Bitte fordere einen neuen an.',
  'Email link is invalid or has expired':
    'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.',
  'otp_expired':
    'Der Code ist abgelaufen. Bitte fordere einen neuen an.',
  'otp_disabled':
    'Dieser Anmeldeweg ist nicht aktiviert.',

  // Session
  'Auth session missing!':
    'Sitzung abgelaufen. Bitte melde dich erneut an.',
  'Auth session missing':
    'Sitzung abgelaufen. Bitte melde dich erneut an.',
  'session_not_found':
    'Sitzung abgelaufen. Bitte melde dich erneut an.',
  'JWT expired':
    'Sitzung abgelaufen. Bitte melde dich erneut an.',

  // Rate Limiting
  'Email rate limit exceeded':
    'Zu viele Anfragen. Bitte warte einige Minuten.',
  'over_email_send_rate_limit':
    'Zu viele E-Mails angefordert. Bitte warte einige Minuten.',
  'request_timeout':
    'Zeitüberschreitung. Bitte versuche es erneut.',

  // Netzwerk
  'Failed to fetch':
    'Verbindungsfehler. Bitte prüfe deine Internetverbindung.',
  'Network request failed':
    'Verbindungsfehler. Bitte prüfe deine Internetverbindung.',
  'fetch failed':
    'Verbindungsfehler. Bitte prüfe deine Internetverbindung.',

  // Sonstiges
  'Signup is disabled':
    'Die Registrierung ist momentan deaktiviert.',
  'signup_disabled':
    'Die Registrierung ist momentan deaktiviert.',
  'Email address cannot be used as it is not authorized':
    'Diese E-Mail-Adresse ist nicht zugelassen.',
  'user_not_found':
    'Kein Konto mit dieser E-Mail-Adresse gefunden.',
  'anonymous_provider_disabled':
    'Anonyme Anmeldung ist nicht aktiviert.',
};

export function toGermanError(error: unknown): string {
  const msg = (error as Error)?.message ?? String(error);

  // Direkte Übereinstimmung
  if (ERROR_MAP[msg]) return ERROR_MAP[msg];

  // Teilübereinstimmung (Supabase packt manchmal mehr Text drum)
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return value;
  }

  // Fallback: Originalnachricht
  return msg || 'Ein unbekannter Fehler ist aufgetreten.';
}
