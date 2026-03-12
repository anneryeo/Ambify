#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT11
#define MQ135_PIN 32  // Your chosen ADC1 pin

// Calibration constant: adjust this based on your sensor in fresh air
// If reading is negative, decrease this value. If too high, increase it.
#define CO2_ZERO 55 

const char* ssid = "RAGAS DECO";
const char* password = "12124545";
const char* mqtt_server = "172.20.10.2";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

void setup_wifi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32_DHT_Sensor")) {}
    else { delay(5000); }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // 1. Read DHT11
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // 2. Calculate CO2 PPM (Averaging 10 samples)
  long sum = 0;
  for(int i = 0; i < 10; i++) {
    sum += analogRead(MQ135_PIN);
    delay(100); // Sample every 100ms
  }
  int co2Raw = sum / 10;
  int co2Ppm = co2Raw - CO2_ZERO;
  if (co2Ppm < 0) co2Ppm = 0; // Prevent negative readings

  // 3. Publish Data
  if (!isnan(h) && !isnan(t)) {
    char payload[128];
    snprintf(payload, sizeof(payload), "{\"temp\": %.1f, \"hum\": %.1f, \"co2\": %d}", t, h, co2Ppm);
    
    Serial.print("Publishing: ");
    Serial.println(payload);
    client.publish("esp32/dht11", payload);
  }

  delay(5000); // 5 second cycle
}