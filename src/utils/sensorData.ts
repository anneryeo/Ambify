// ═══════════════════════════════════════════════════════════════════════════════
//  Ambify — Sensor Data Service
// ═══════════════════════════════════════════════════════════════════════════════
//  Fetches live sensor data from Google Sheets via the Apps Script web-app URL.
//  Used by MainDashboard and ProductivityScreen to display real readings.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
// Paste the same Google Apps Script deployment URL here.
// When called with no parameters, it returns the latest reading as JSON.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzuLanRxJI2FyEU60o0qC8Z7rUR_mcQU4HzLFr05JjWkMCuhrroerN2-esnFWilxGl6/exec'; // ← Same URL as in .ino

// How often the app polls for new data (in milliseconds).
// Keep this slightly above LOG_INTERVAL_SECONDS in the .ino so you get
// every reading without hammering the Apps Script quota.
// ESP32 default: 10s → app polls at 12s → worst-case lag ≈ 22s
export const POLL_INTERVAL_MS = 12 * 1000; // ← Adjust to match your .ino interval + ~2s

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface SensorReading {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
}

export interface SensorResponse {
  status: 'ok' | 'error';
  data: SensorReading | null;
  history?: SensorReading[];
  message?: string;
}

// ─── FETCH LATEST READING ────────────────────────────────────────────────────
export async function fetchLatestReading(): Promise<SensorResponse> {
  try {
    // Use ? (not &) — the base URL has no existing query params.
    // The _t param busts Google's CDN cache so we always get the latest row.
    const bustUrl = `${GOOGLE_SCRIPT_URL}?_t=${Date.now()}`;

    // Note: `cache: 'no-store'` is NOT used — Hermes (React Native's JS engine)
    // doesn't support the Fetch API cache option and it causes misbehaviour.
    // The URL-level cache-bust above is sufficient.
    const response = await fetch(bustUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    // Read as text first so we can log the raw body if parsing fails.
    const text = await response.text();

    if (!response.ok) {
      console.warn('[SensorData] Non-OK response:', response.status, text.slice(0, 200));
      throw new Error(`HTTP ${response.status}`);
    }

    // Google sometimes returns an HTML redirect/error page instead of JSON.
    if (text.trimStart().startsWith('<')) {
      console.warn('[SensorData] Got HTML instead of JSON — Apps Script may be warming up or the URL is wrong:', text.slice(0, 200));
      throw new Error('Apps Script returned HTML (cold start or bad URL)');
    }

    const json: SensorResponse = JSON.parse(text);
    return json;
  } catch (error) {
    console.warn('[SensorData] Fetch failed:', error);
    return {
      status: 'error',
      data: null,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ─── CHECK IF LIVE DATA IS CONFIGURED ────────────────────────────────────────
export function isLiveDataConfigured(): boolean {
  return (
    GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL' &&
    GOOGLE_SCRIPT_URL.startsWith('https://script.google.com/')
  );
}
