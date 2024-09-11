String inputString = "";          // a String to hold incoming data
bool stringComplete = false;      // whether the string is complete

// device addresses must match those defined in the VUE app config.json file
const int BLUE = 0;
const int BLACK = 1;

const int ADDRESS = BLACK;

const int BUTTON = 2;
int buttonState = 0;
int lastButtonState = LOW;
unsigned long lastDebounceTime = 0;  
unsigned long debounceDelay = 50;

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(BUTTON, INPUT);

  //if you want to use the ADDRESS you must send it to the computer, you won't be asked for it
  Serial.println("address:"+String(ADDRESS)+",setup complete");
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

      if (buttonState == HIGH) Serial.println("buttonEvent:press");
      else Serial.println("buttonEvent:release");
    }
  }

  lastButtonState = buttonReading;

  
  if (stringComplete) {
    // simple reply to incoming message
    Serial.println("confirmReceived:"+inputString);
    if (inputString == "led:on") digitalWrite(LED_BUILTIN, HIGH);
    else if (inputString == "led:off") digitalWrite(LED_BUILTIN, LOW);

    inputString = "";          
    stringComplete = false; 
  }
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}
