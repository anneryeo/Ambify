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
#define LOG_INTERVAL_SECONDS 10    // ← Used when USE_SECONDS = true  (e.g. 10, 30, 60)
#define LOG_INTERVAL_MINUTES 2     // ← Used when USE_SECONDS = false (e.g. 1, 2, 5)

// Derived — do not edit
const unsigned long LOG_INTERVAL_MS = USE_SECONDS
  ? (unsigned long)LOG_INTERVAL_SECONDS * 1000UL
  : (unsigned long)LOG_INTERVAL_MINUTES * 60UL * 1000UL;

// ─── MQ135 CALIBRATION ──────────────────────────────────────────────────────
// When your MQ135 is working, this offset is subtracted from the raw ADC
// average to approximate CO₂ ppm.  Tune it in fresh outdoor air (~400 ppm).
#define CO2_ZERO_OFFSET 55
#define MQ135_SAMPLES   10     // Number of ADC samples to average

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
int readCO2() {
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
  int ppm = raw - CO2_ZERO_OFFSET;
  if (ppm < 0) ppm = 0;

  Serial.print("MQ135 raw avg = ");
  Serial.print(raw);
  Serial.print("  →  CO₂ ≈ ");
  Serial.print(ppm);
  Serial.println(" ppm");
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
    int co2 = readCO2();

    if (dhtOk) {
      postToGoogleSheets(temperature, humidity, co2);
    } else {
      Serial.println("Skipping upload — DHT read failed");
    }

    Serial.println();
  }

  delay(100);  // Small poll delay to keep serial responsive
}
