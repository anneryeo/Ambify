// ═══════════════════════════════════════════════════════════════════════════════
//  Ambify — Google Apps Script  (paste into script.google.com)
// ═══════════════════════════════════════════════════════════════════════════════
//
//  This script receives sensor data from the ESP32 and appends it as a new
//  row in the active Google Sheet.  It also exposes a JSON endpoint so the
//  React Native app can fetch the latest readings.
//
//  SETUP STEPS:
//  ─────────────
//  1. Open Google Sheets → create a new spreadsheet (name it "Ambify Sensor Data")
//  2. In Row 1, add these headers:
//        A1: Timestamp   B1: Temperature (°C)   C1: Humidity (%)   D1: CO₂ (ppm)
//  3. Go to  Extensions → Apps Script
//  4. Delete everything in Code.gs and paste this entire file
//  5. Click  Deploy → New Deployment
//        - Type: Web app
//        - Execute as: Me
//        - Who has access: Anyone
//  6. Copy the deployment URL and paste it into GOOGLE_SCRIPT_URL in the .ino
//  7. Done! Every sensor reading will auto-append a row.
//
//  RE-DEPLOYING after edits:
//     Deploy → Manage deployments → pencil icon → Version: New version → Deploy
//
// ═══════════════════════════════════════════════════════════════════════════════

// ─── RECEIVE DATA FROM ESP32 ─────────────────────────────────────────────────
// The ESP32 hits this URL with ?temperature=XX&humidity=XX&co2=XX
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    var temperature = e.parameter.temperature || "";
    var humidity    = e.parameter.humidity    || "";
    var co2         = e.parameter.co2         || "";
    
    // If no parameters supplied, return the latest data (for the app to read)
    if (!temperature && !humidity && !co2) {
      return getLatestReading();
    }
    
    // Append row: [Timestamp, Temperature, Humidity, CO₂]
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      parseFloat(temperature),
      parseFloat(humidity),
      parseInt(co2)
    ]);
    
    // Format the timestamp column nicely
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setNumberFormat("yyyy-MM-dd HH:mm:ss");
    
    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "ok",
        row: lastRow,
        data: {
          timestamp: timestamp.toISOString(),
          temperature: parseFloat(temperature),
          humidity: parseFloat(humidity),
          co2: parseInt(co2)
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── GET LATEST READING (for React Native app) ──────────────────────────────
// Call the same URL with no parameters → returns the most recent row as JSON
function getLatestReading() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "ok",
        data: null,
        message: "No data yet"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var row = sheet.getRange(lastRow, 1, 1, 4).getValues()[0];
  
  // Also grab the last N readings for history
  var historyCount = Math.min(20, lastRow - 1);  // last 20 readings
  var historyRange = sheet.getRange(lastRow - historyCount + 1, 1, historyCount, 4).getValues();
  
  var history = historyRange.map(function(r) {
    return {
      timestamp: new Date(r[0]).toISOString(),
      temperature: r[1],
      humidity: r[2],
      co2: r[3]
    };
  });
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "ok",
      data: {
        timestamp: new Date(row[0]).toISOString(),
        temperature: row[1],
        humidity: row[2],
        co2: row[3]
      },
      history: history
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── OPTIONAL: POST handler (if you prefer POST from ESP32) ─────────────────
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.temperature || 0,
      data.humidity || 0,
      data.co2 || 0
    ]);
    
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setNumberFormat("yyyy-MM-dd HH:mm:ss");
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
