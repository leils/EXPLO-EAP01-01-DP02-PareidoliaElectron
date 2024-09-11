#include <ArduinoJson.h>
#define PACKET_SIZE 100
StaticJsonDocument<PACKET_SIZE> PacketBuff;

// device addresses must match those defined in the VUE app config.json file
const int BLUE = 0;
const int BLACK = 1;

const int ADDRESS = BLUE;

const int BUTTON = 2;
int buttonState = 0;
int lastButtonState = LOW;
unsigned long lastDebounceTime = 0;  
unsigned long debounceDelay = 50;



// LF to be used in the readStringUntil call. Using 10 vastly improves the performance of that call (compared to "\n")
#define LF 10 

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(BUTTON, INPUT);

  //if you want to use the ADDRESS you must send it to the computer, you won't be asked for it
  PacketBuff = {};
  PacketBuff["address"] = ADDRESS;
  sendPacket();
}

void loop() {
  int buttonReading = digitalRead(BUTTON);

  if (buttonReading != lastButtonState) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (buttonReading != buttonState) {
      buttonState = buttonReading;
      PacketBuff = {};
      if (buttonState == HIGH) {
        PacketBuff["buttonEvent"] = "press";
      } else {
        PacketBuff["buttonEvent"] = "release";
      }
      sendPacket();
    }
  }

  lastButtonState = buttonReading;
}

void serialEvent() {
  if (Serial.available()) {
    String temp = Serial.readStringUntil(LF);
    DeserializationError error = deserializeJson(PacketBuff, temp);
    if (error) {
      PacketBuff = {};
      PacketBuff["error"] = "could not parse the JSON you sent to me";
      sendPacket();
    }
    else {
      processPacket();
    }
  }
}

void sendPacket() {
  serializeJson(PacketBuff, Serial);
  Serial.write(LF); 
}

void processPacket() {
  if (PacketBuff["led"] != NULL) {
    if (PacketBuff["led"] == "on") {
      digitalWrite(LED_BUILTIN, HIGH);
    } else if (PacketBuff["led"] == "off")  {
      digitalWrite(LED_BUILTIN, LOW);
    } 
    // send packet back as way of confirmation and trigger UI update to reflect current state
    sendPacket();
  }
}


