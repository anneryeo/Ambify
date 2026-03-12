#include "DHT.h"

// --- Define Pins ---
#define DHTPIN 4       // DHT11 Data pin connected to P4
#define MQ135PIN 34    // MQ135 Analog pin connected to P34

// --- Define Sensor Type ---
#define DHTTYPE DHT11  // Let the library know we are using the DHT11

// Initialize the DHT sensor
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Start the serial monitor at a baud rate of 115200
  Serial.begin(115200);
  Serial.println("Ambify Sensor Test Starting...");
  
  // Start the DHT sensor
  dht.begin();
  
  // The MQ135 needs a little time to heat up, but we'll start reading immediately for the test
}

void loop() {
  // Wait a few seconds between measurements
  delay(2000);

  // --- Read DHT11 ---
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Read temperature as Celsius

  // Check if any reads failed and exit early (to try again)
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.print("%  |  Temperature: ");
    Serial.print(temperature);
    Serial.println("°C");
  }

  // --- Read MQ135 ---
  // This reads the raw analog voltage (0-4095 on the ESP32)
  // We will apply the eCO2 math later once we know the sensor works!
  int rawGasValue = analogRead(MQ135PIN);
  
  Serial.print("MQ135 Raw Analog Value: ");
  Serial.println(rawGasValue);
  Serial.println("---------------------------------");
}