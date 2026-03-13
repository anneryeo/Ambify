# Documentation
## Relevant links
[https://anneryeo.github.io/DS169_IOT/](url) -- DHT11 Sensor Dashboard Visualization

## Personal Notes

* For breadboards...
  * Each row is 123, each column is A to J, from center trench.
  * When there is a wire plugged in A-1, B to J-1 will be electrically connected.

## Hardware

* **ESP32-WROOM-32** - 3.3V logic
* **DHT-11 Sensor** - 3.3V
* **MQ135** - 5V (derive from micro-USB/C from VIN/5V/VU pin from ESP32 board)

## How to wire

When using a breadboard, which I am, it will be female-male jumper wires connected to the corresponding row of the male pin of the ESP32 board. What I did was to color-code the wires for its purposes. Which means, GND wires = black, or something.

| **DHT11 Pin**    | **Wire to ESP32 Pin**        | **Purpose**                              |
| ---------------------- | ---------------------------------- | ---------------------------------------------- |
| **VCC**(or +)    | **3V3 (Power)** : Red        | Provides 3.3V power.                           |
| **GND**(or -)    | **GND (Ground)**  : Blue     | Completes the circuit.                         |
| **DATA**(or OUT) | **GPIO 4** (D/P 4) : Green  | Sends the digital temperature/humidity signal. |

| **MQ135 Pin**       | **Wire to ESP32 Pin**          | **Purpose**                                                                     |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| **VCC**             | **VIN** (or 5V)   : Red        | Provides the 5V needed for the heating element.                                       |
| **GND**             | **GND**    : Blue              | Completes the circuit.                                                                |
| **A0**(Analog Out)  | **GPIO 34** (D/P 34) : Yellow | Sends the raw analog voltage based on gas concentration.                              |
| **D0**(Digital Out) | *Leave Disconnected*               | Only used for simple high/low triggers; we need the raw analog data for$eCO_2$math. |

## Arduino

1. Go to Sketch -> Include Library -> Manage Libraries
   1. DHT Sensor Library by Adafruit
   2. Install all dependencies (like Adafruit Unified Sensor)
2. Board = DOIT ESP32 DEVKIT V1
3. Tools -> Port; Select COM port according to your USB-C
4. Set Serial Monitor to 115200 baud
5. Use test.ino in \backend
   1. Upload test.ino code
   2. When connecting, click Boot (not EN)
      1. Error 1: Change Upload Speed from Tools -> Upload Speed -> 921600 to 115200
         1. Cause the cheap duplicate ESP32-WROOM can't handle the massive amount of data transfer at the speed that Arduino can do.
      2. Unplug MQ-135 5V Wire if error during test upload. This happens sometimes because of the power hunger of the sensor.
      3. "ERROR: Write failed, written flash region is empty." : Change **Board** to ESP32 Dev Module -> Change **Flash Mode** to DIO from default QIO; double check upload speed to still be 115200.
      4. Unplug 5V if persistent invalid header error when all settings, wires are correct. Sometimes it's just  a power supply problem.

---

## Google Sheets Integration (No MQTT / No Node-RED)

This replaces the old MQTT → Node-RED pipeline with a direct ESP32 → Google Sheets approach.

### Architecture

```
ESP32 (Ambify_GoogleSheets.ino)
   │  HTTPS GET with sensor params
   ▼
Google Apps Script (GoogleAppsScript.gs)
   │  Appends row to spreadsheet
   ▼
Google Sheets ("Ambify Sensor Data")
   │  Also serves as a JSON API
   ▼
React Native App (useSensorData hook)
   │  Polls every N minutes
   ▼
MainDashboard / ProductivityScreen
```

### Setup Steps

#### 1. Google Sheets + Apps Script

1. Create a new Google Sheet — name it **"Ambify Sensor Data"**
2. Add headers in Row 1:
   | A | B | C | D |
   |---|---|---|---|
   | Timestamp | Temperature (°C) | Humidity (%) | CO₂ (ppm) |
3. Go to **Extensions → Apps Script**
4. Delete default code, paste entire contents of `backend/GoogleAppsScript.gs`
5. **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the deployment URL (looks like `https://script.google.com/macros/s/XXXX/exec`)

#### 2. ESP32 Firmware

1. Open `backend/Ambify_GoogleSheets.ino` in Arduino IDE
2. Fill in at the top:
   - `WIFI_SSID` — your WiFi network name
   - `WIFI_PASSWORD` — your WiFi password
   - `GOOGLE_SCRIPT_URL` — the deployment URL from step 1.6
3. Adjust `LOG_INTERVAL_MINUTES` (default: 2 minutes)
4. **MQ135 simulation** is ON by default (`SIMULATE_MQ135 = true`)
   - Edit `SIMULATED_CO2_VALUES[]` to demo any ppm levels
   - Set to `false` when you have a working MQ135
5. Upload: Board = **ESP32 Dev Module**, Flash Mode = **DIO**, Upload Speed = **115200**

#### 3. React Native App

1. Open `src/utils/sensorData.ts`
2. Set `GOOGLE_SCRIPT_URL` to the same deployment URL
3. Adjust `POLL_INTERVAL_MS` if needed (default: 2 minutes)
4. That's it — `MainDashboard` and `ProductivityScreen` will auto-switch to live data

### Simulation Quick Reference

| Where | What | How |
|-------|------|-----|
| `.ino` line ~68 | `SIMULATED_CO2_VALUES[]` | Add/edit ppm values the ESP32 cycles through |
| `.ino` line ~78 | `SIM_TEMPERATURE` / `SIM_HUMIDITY` | Override DHT11 for desktop demo |
| `.ino` line ~43 | `LOG_INTERVAL_MINUTES` | Change logging frequency (1–5 min) |
| `ProductivityScreen.tsx` | `PRACTICE_LEVELS` array | Demo values when no live data |
| `MainDashboard.tsx` | `PRACTICE_LEVELS` array | Demo CO₂ values when no live data |
| `co2Utils.ts` | `getCO2UIData()` thresholds | Change color/label breakpoints |

### Verifying It Works

1. After uploading to ESP32, open **Serial Monitor** (115200 baud)
2. You should see WiFi connection, then readings + HTTP 200 responses
3. Check your Google Sheet — new rows should appear every N minutes
4. In the app, the circle (MainDashboard) and bento cards (ProductivityScreen) will update from the sheet
