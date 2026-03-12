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
// Should roughly match LOG_INTERVAL_MINUTES in the .ino file.
export const POLL_INTERVAL_MS = 2 * 60 * 1000; // ← Adjust: default 2 minutes

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
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json: SensorResponse = await response.json();
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
