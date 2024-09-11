String inputString = "";          // a String to hold incoming data
bool stringComplete = false;      // whether the string is complete

const int BUTTON = 2;
int buttonState = 0;
int lastButtonState = LOW;
unsigned long lastDebounceTime = 0;  
unsigned long debounceDelay = 50;

#define BUTTON_STATE B00010000
#define RELEASE B00000000
#define PRESS B00000001

#define LED_STATE B00100000
#define ON B00000000
#define OFF B00000001

// To be recognized as an address by the evt-arduino library, ADDRESS_CMD and ADDRESS must be used as in this example
// ADDRESS_CMD must be B00000000
#define ADDRESS_CMD B00000000
// device addresses must match those defined in the VUE app config.json file
#define ADDRESS B00000001

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(BUTTON, INPUT);

  //if you want to use the ADDRESS you must send it to the computer, you won't be asked for it
  Serial.write(ADDRESS_CMD | ADDRESS);
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
      if (buttonState == HIGH) Serial.write(BUTTON_STATE | PRESS);
      else Serial.write(BUTTON_STATE | RELEASE);
    }
  }

  lastButtonState = buttonReading;
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    switch (inChar) {
      case LED_STATE | ON:
        digitalWrite(LED_BUILTIN, HIGH);
        Serial.write(LED_STATE | ON);
        break;
      case (LED_STATE | OFF):
        digitalWrite(LED_BUILTIN, LOW);
        Serial.write(LED_STATE | OFF);
        break;
    }
  }
}
