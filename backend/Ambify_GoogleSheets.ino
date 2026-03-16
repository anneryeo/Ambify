// ═══════════════════════════════════════════════════════════════════════════════
//  AMBIFY — ESP32 Sensor Logger → Google Sheets (Direct, No MQTT/Node-RED)
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Reads DHT11 (temperature + humidity) and MQ135 (CO₂ estimate).
//  Posts every reading directly to a Google Sheets spreadsheet via
//  a Google Apps Script web-app URL.  No broker, no Node-RED, no extra server.
//
//  SETUP:
//  1. Deploy the companion Google Apps Script (see backend/GoogleAppsScript.gs)
//  2. Paste the deployment URL into GOOGLE_SCRIPT_URL below
//  3. Fill in your WiFi credentials
//  4. Upload to ESP32 via Arduino IDE (Board: ESP32 Dev Module, Flash: DIO,
//     Upload Speed: 115200, Baud: 115200)
//
// ═══════════════════════════════════════════════════════════════════════════════

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <math.h>
#include "DHT.h"

// ─── WIFI CREDENTIALS ────────────────────────────────────────────────────────
const char* WIFI_SSID     = "SOMEE5G";      // ← Change this
const char* WIFI_PASSWORD = "2350Crisolita2350!";   // ← Change this

// ─── GOOGLE APPS SCRIPT DEPLOYMENT URL ───────────────────────────────────────
// After deploying GoogleAppsScript.gs as a web app, paste the URL here.
// It will look like: https://script.google.com/macros/s/XXXXXXXXX/exec
const char* GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuLanRxJI2FyEU60o0qC8Z7rUR_mcQU4HzLFr05JjWkMCuhrroerN2-esnFWilxGl6/exec";  // ← Change this

// ─── SENSOR PINS ─────────────────────────────────────────────────────────────
#define DHTPIN    4        // DHT11 data pin → GPIO 4
#define DHTTYPE   DHT11
#define MQ135_PIN 34       // MQ135 analog pin → GPIO 34

// ─── TIMING (ADJUSTABLE) ────────────────────────────────────────────────────
// Pick ONE mode by flipping USE_SECONDS:
//
//   false → interval in MINUTES  (good for real deployment)
//   true  → interval in SECONDS  (good for rapid data collection / demos)
//
#define USE_SECONDS          true   // ← true = seconds mode, false = minutes mode
#define LOG_INTERVAL_SECONDS 30    // ← Used when USE_SECONDS = true  (e.g. 10, 30, 60)
#define LOG_INTERVAL_MINUTES 2     // ← Used when USE_SECONDS = false (e.g. 1, 2, 5)

// Derived — do not edit
const unsigned long LOG_INTERVAL_MS = USE_SECONDS
  ? (unsigned long)LOG_INTERVAL_SECONDS * 1000UL
  : (unsigned long)LOG_INTERVAL_MINUTES * 60UL * 1000UL;

// ─── MQ135 CALIBRATION (FULL GAS-CURVE MODEL) ──────────────────────────────
// This sketch estimates CO2 with the common MQ135 power-law model:
//   Rs = RL * ((VREF / Vout) - 1)
//   ratio = Rs / R0
//   ppm = A * (ratio ^ B)
//
// Notes:
// - Constants below are widely used starting points, not lab-grade truths.
// - Tune MQ135_R0_KOHM on your own hardware after warm-up for best results.
// - MQ135 is cross-sensitive; this remains an estimate.
#define MQ135_SAMPLES       10        // Number of ADC samples to average
#define ADC_MAX_COUNTS      4095.0f   // ESP32 ADC resolution
#define ADC_VREF            3.3f      // ADC reference / sensor supply voltage
#define MQ135_RL_KOHM       10.0f     // Module load resistor RL (kOhm)
#define MQ135_R0_KOHM       20.0f     // Sensor baseline R0 after calibration (kOhm)

// CO2 curve coefficients (power law): ppm = A * (Rs/R0)^B
#define MQ135_CO2_A         116.6020682f
#define MQ135_CO2_B         -2.769034857f

// Air baseline anchor (used when deriving R0 outdoors at ~400 ppm)
#define MQ135_ATMOSPHERIC_CO2_PPM 400.0f

// Optional compensation using DHT11 data.
#define USE_MQ135_TH_COMPENSATION true

// ═══════════════════════════════════════════════════════════════════════════════
//  MQ135 SIMULATION MODE
// ═══════════════════════════════════════════════════════════════════════════════
// Since the MQ135 is fried (stuck at 4095), enable simulation to demo the UI
// at different CO₂ levels.  Set to `false` once you have a working sensor.
//
#define SIMULATE_MQ135 true   // ← true = use fake values, false = real sensor

// ─── SIMULATION STARTING POINT ───────────────────────────────────────────────
// Where the simulation begins when the ESP32 boots.
// The ramp will start here and travel through the arc waypoints from the top.
// Set this to whichever zone you want to demo first:
//
//   ~400  → starts in Crisp   (green,  < 600 ppm)
//   ~700  → starts in Good    (cyan,   600–999 ppm)
//   ~1100 → starts in Stagnant(orange, 1000–1499 ppm)
//   ~1600 → starts in Heavy   (blue,   ≥ 1500 ppm)
//
#define SIM_START_PPM 420   // ← Adjust: starting CO₂ value in ppm

// ─── SIMULATED CO₂ ARC (ppm) ─────────────────────────────────────────────────
// The simulator ramps stepwise from one waypoint to the next.
// These waypoints form a slow, naturalistic rise-and-fall arc that drifts
// through every zone gradually — no hard category jumps.
//
// UI thresholds (from co2Utils.ts):
//   < 600  → "Crisp"    (green)   |  600–999  → "Good"     (cyan)
//   1000–1499 → "Stagnant" (orange) |  ≥ 1500 → "Heavy"    (blue)
//
// Edit freely — add more stops to linger in a zone, remove to shorten the arc,
// or reorder to create a descent-first curve.

const int SIM_CO2_WAYPOINTS[] = {
  //  ↓ Rise — fresh air slowly filling with CO₂
  480,   // Crisp     — windows open, morning
  560,   // Crisp     — lingering near threshold
  640,   // Good      — crossed into Good zone
  730,   // Good
  840,   // Good
  940,   // Good      — approaching Stagnant boundary
  1020,  // Stagnant  — crossed over
  1120,  // Stagnant
  1240,  // Stagnant
  1380,  // Stagnant  — approaching Heavy
  1510,  // Heavy     — crossed over
  1640,  // Heavy
  1760,  // Heavy     — peak
  //  ↓ Fall — ventilation / window opened
  1680,  // Heavy     — slowly clearing
  1540,  // Heavy
  1390,  // Stagnant  — drifting back
  1220,  // Stagnant
  1060,  // Stagnant
  920,   // Good      — noticeably fresher
  770,   // Good
  630,   // Good
  530,   // Crisp     — back below 600
  450,   // Crisp     — back near baseline
};
const int SIM_WAYPOINT_COUNT = sizeof(SIM_CO2_WAYPOINTS) / sizeof(SIM_CO2_WAYPOINTS[0]);

// ─── STEP SIZE ────────────────────────────────────────────────────────────────
// How many ppm to move per reading toward the next waypoint.
// Smaller = more gradual drift between stops.  Larger = faster transitions.
// At 10s intervals:  step=8  → ~10 readings per 80-ppm gap  (~1.7 min)
// At 10s intervals:  step=15 → ~5  readings per 80-ppm gap  (~50 s)
#define SIM_STEP_SIZE 8   // ← Adjust: ppm per reading (e.g. 5, 8, 15, 25)

// ─── ORGANIC JITTER ───────────────────────────────────────────────────────────
// Adds a small random fluctuation to each output reading so the chart
// looks like real sensor data instead of a perfectly straight ramp.
// Set to 0 to disable.  Recommended: 5–15 ppm.
#define SIM_JITTER_PPM 8  // ← Adjust: ±ppm noise added per reading (0 = off)

// Internal sim state — do not edit
int simCurrentPpm    = SIM_START_PPM;
int simWaypointIndex = 0;  // start targeting the first waypoint in the arc

// ─── SIMULATED TEMPERATURE & HUMIDITY ─────────────────────────────────────
// Set to `true` if you also want to override DHT11 readings (e.g., sensor
// disconnected for a pure desktop demo).
#define SIMULATE_DHT false           // ← true = fake temp/hum too

const float SIM_TEMPERATURE = 24.0;  // ← simulated °C
const float SIM_HUMIDITY    = 52.0;  // ← simulated %RH

// ═══════════════════════════════════════════════════════════════════════════════
//  INTERNALS — no need to edit below unless you're customizing behaviour
// ═══════════════════════════════════════════════════════════════════════════════

DHT dht(DHTPIN, DHTTYPE);
unsigned long lastLogTime = 0;

// ─── MQ135 HELPER MATH ──────────────────────────────────────────────────────
float mq135ResistanceFromAdc(int adcRaw) {
  // Keep ADC in valid range and avoid divide-by-zero near 0 Vout.
  float adc = constrain((float)adcRaw, 1.0f, ADC_MAX_COUNTS - 1.0f);
  float vout = (adc / ADC_MAX_COUNTS) * ADC_VREF;
  return MQ135_RL_KOHM * ((ADC_VREF / vout) - 1.0f);  // Rs in kOhm
}

float mq135CorrectionFactor(float temperature, float humidity) {
  // Empirical compensation shape used by common MQ135 implementations.
  if (temperature < 20.0f) {
    return 0.00035f * temperature * temperature
      - 0.02718f * temperature
      + 1.39538f
      - 0.0018f * (humidity - 33.0f);
  }
  return -0.003333333f * temperature
    + 1.233333333f
    - 0.0018f * (humidity - 33.0f);
}

float mq135PpmFromRs(float rsKohm, float r0Kohm) {
  float ratio = rsKohm / r0Kohm;
  return MQ135_CO2_A * powf(ratio, MQ135_CO2_B);
}

// Optional: use this once your sensor is warmed and in known fresh-air
// conditions to derive an initial R0 target for MQ135_R0_KOHM.
float mq135EstimateR0FromRaw(int adcRaw) {
  float rs = mq135ResistanceFromAdc(adcRaw);
  float cleanAirRatio = powf(MQ135_ATMOSPHERIC_CO2_PPM / MQ135_CO2_A, 1.0f / MQ135_CO2_B);
  return rs / cleanAirRatio;
}

// ─── CONNECT TO WIFI ─────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected  IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n✗ WiFi FAILED — will retry on next cycle");
  }
}

// ─── READ CO₂ (real or simulated) ───────────────────────────────────────────
int readCO2(float temperature, float humidity, bool dhtValid) {
  if (SIMULATE_MQ135) {
    int target = SIM_CO2_WAYPOINTS[simWaypointIndex];

    // Move simCurrentPpm one step toward the target
    if (simCurrentPpm < target) {
      simCurrentPpm = min(simCurrentPpm + SIM_STEP_SIZE, target);
    } else if (simCurrentPpm > target) {
      simCurrentPpm = max(simCurrentPpm - SIM_STEP_SIZE, target);
    }

    // Once we've arrived, advance to the next waypoint
    if (simCurrentPpm == target) {
      simWaypointIndex = (simWaypointIndex + 1) % SIM_WAYPOINT_COUNT;
    }

    // Apply organic jitter (±SIM_JITTER_PPM) without drifting the ramp state
    int jitter = (SIM_JITTER_PPM > 0)
      ? (int)random(-SIM_JITTER_PPM, SIM_JITTER_PPM + 1)
      : 0;
    int output = max(0, simCurrentPpm + jitter);

    Serial.print("[SIM] CO₂ = ");
    Serial.print(output);
    Serial.print(" ppm  (ramp: ");
    Serial.print(simCurrentPpm);
    Serial.print("  target: ");
    Serial.print(target);
    Serial.println(" ppm)");
    return output;
  }

  // Real MQ135 reading — average N samples
  long sum = 0;
  for (int i = 0; i < MQ135_SAMPLES; i++) {
    sum += analogRead(MQ135_PIN);
    delay(100);
  }
  int raw = sum / MQ135_SAMPLES;
  float rsKohm = mq135ResistanceFromAdc(raw);
  float rsForCurve = rsKohm;

  if (USE_MQ135_TH_COMPENSATION && dhtValid) {
    float cf = mq135CorrectionFactor(temperature, humidity);
    if (cf > 0.05f) {
      rsForCurve = rsKohm / cf;
    }
  }

  float ppmFloat = mq135PpmFromRs(rsForCurve, MQ135_R0_KOHM);
  int ppm = (int)roundf(ppmFloat);
  if (ppm < 0) ppm = 0;

  Serial.print("MQ135 raw avg = ");
  Serial.print(raw);
  Serial.print("  Rs=");
  Serial.print(rsKohm, 2);
  Serial.print("kOhm  R0=");
  Serial.print(MQ135_R0_KOHM, 2);
  Serial.print("kOhm  →  CO₂ ≈ ");
  Serial.print(ppm);
  Serial.println(" ppm");

  if (dhtValid) {
    Serial.print("Compensation T/H: ");
    Serial.print(temperature, 1);
    Serial.print("C, ");
    Serial.print(humidity, 1);
    Serial.println("%");
  }

  if (millis() < 120000UL) {
    float r0Estimate = mq135EstimateR0FromRaw(raw);
    Serial.print("R0 hint @400ppm: ");
    Serial.print(r0Estimate, 2);
    Serial.println("kOhm (for tuning MQ135_R0_KOHM)");
  }
  return ppm;
}

// ─── READ DHT11 (real or simulated) ─────────────────────────────────────────
bool readDHT(float &temperature, float &humidity) {
  if (SIMULATE_DHT) {
    temperature = SIM_TEMPERATURE;
    humidity    = SIM_HUMIDITY;
    Serial.println("[SIM] Temp = " + String(temperature) + "°C  Hum = " + String(humidity) + "%");
    return true;
  }

  temperature = dht.readTemperature();
  humidity    = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("✗ DHT11 read failed");
    return false;
  }

  Serial.print("DHT11  Temp = ");
  Serial.print(temperature);
  Serial.print("°C  Hum = ");
  Serial.print(humidity);
  Serial.println("%");
  return true;
}

// ─── POST DATA TO GOOGLE SHEETS ─────────────────────────────────────────────
void postToGoogleSheets(float temperature, float humidity, int co2) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi disconnected — skipping upload");
    connectWiFi();  // try to reconnect for next cycle
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();  // Skip certificate validation (fine for Apps Script)

  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  // Build URL with query parameters (simplest approach for Apps Script)
  String url = String(GOOGLE_SCRIPT_URL)
    + "?temperature=" + String(temperature, 1)
    + "&humidity="    + String(humidity, 1)
    + "&co2="         + String(co2);

  Serial.println("→ POST " + url);

  http.begin(client, url);
  int httpCode = http.GET();  // Apps Script doGet() is simpler to deploy

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("← HTTP ");
    Serial.print(httpCode);
    Serial.print("  ");
    Serial.println(response);
  } else {
    Serial.print("✗ HTTP error: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

// ─── SETUP ───────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("═══════════════════════════════════════");
  Serial.println("  Ambify Sensor Logger v2.0");
  Serial.println("  Interval: " + String(USE_SECONDS ? LOG_INTERVAL_SECONDS : LOG_INTERVAL_MINUTES * 60) + (USE_SECONDS ? "s" : " min"));
  Serial.println("  MQ135 Sim: " + String(SIMULATE_MQ135 ? "ON" : "OFF"));
  Serial.println("  DHT11 Sim: " + String(SIMULATE_DHT  ? "ON" : "OFF"));
  Serial.println("  MQ135 Model: Rs/R0 power-curve");
  Serial.println("═══════════════════════════════════════");

  dht.begin();
  connectWiFi();

  // Take an immediate first reading on boot
  lastLogTime = millis() - LOG_INTERVAL_MS;
}

// ─── MAIN LOOP ───────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    lastLogTime = now;

    Serial.println("───── Reading #" + String(millis() / 1000) + "s ─────");

    float temperature, humidity;
    bool dhtOk = readDHT(temperature, humidity);
    int co2 = readCO2(temperature, humidity, dhtOk);

    if (dhtOk) {
      postToGoogleSheets(temperature, humidity, co2);
    } else {
      Serial.println("Skipping upload — DHT read failed");
    }

    Serial.println();
  }

  delay(100);  // Small poll delay to keep serial responsive
}
