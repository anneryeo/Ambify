# Documentation

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
