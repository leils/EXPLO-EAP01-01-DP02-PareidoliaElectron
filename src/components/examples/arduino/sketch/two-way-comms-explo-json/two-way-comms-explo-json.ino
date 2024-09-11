#include "explo-serial-json.h"

// board addresses must match those defined in the VUE app config.json file
#define BLUE 0
#define BLACK 1

#define ARDUINO_ADDRESS BLUE
#define SKETCH_VERSION "Simple two way coms using exploJSON v1.0.0"

ExploSerial CommChannel;

const int BUTTON = 2;
int buttonState = 0;
int lastButtonState = LOW;
unsigned long lastDebounceTime = 0;  
unsigned long debounceDelay = 50;

void setup() {
  Serial.begin(9600);
  
  setupComs(); 

  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(BUTTON, INPUT);

  // Address is automatically requested by the evt-arduino library when using the exploJSON protocol.
}

void loop() {
  CommChannel.pollSerial();

  int buttonReading = digitalRead(BUTTON);

  if (buttonReading != lastButtonState) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (buttonReading != buttonState) {
      buttonState = buttonReading;

      if (buttonState == HIGH) CommChannel.sendUpload("{\"buttonEvent\": \"press\"}");
      else CommChannel.sendUpload("{\"buttonEvent\": \"release\"}");
    }
  }

  lastButtonState = buttonReading;
}

// Explo JSON stuff
String commUploadCallback() { 
  
}

int commDownloadCallback(String payload) {
  StaticJsonDocument<PACKET_SIZE> DlJsonBuff = {};
  deserializeJson(DlJsonBuff, payload);

  // deal with command to turn on LED here
  if(DlJsonBuff["led"] != NULL) {
    if (DlJsonBuff["led"] == "on") {
      CommChannel.sendUpload("{\"led\":\"on\"}");
      digitalWrite(LED_BUILTIN, HIGH);
      return 1;
    } else if (DlJsonBuff["led"] == "off") {
      CommChannel.sendUpload("{\"led\":\"off\"}");
      digitalWrite(LED_BUILTIN, LOW);
      return 1;
    } 
  }
  

  // return -1 to trigger bad paylad error to be sent to computer
  return -1;
}

void setupComs() {
  CommChannel.setAddress(ARDUINO_ADDRESS);
  CommChannel.setVersion(SKETCH_VERSION);
  CommChannel.attachUploadCallback(commUploadCallback);
  CommChannel.attachDownloadCallback(commDownloadCallback);
}
