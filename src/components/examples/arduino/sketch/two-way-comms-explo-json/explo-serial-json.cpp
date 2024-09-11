#if ARDUINO >= 100
  #include "Arduino.h"
#else
  #include "WProgram.h"
#endif

#include "explo-serial-json.h"

char tempString[256] = "";
 
ExploSerial::ExploSerial()
{
  boardAddress = -1;  // illegal address is also a flag that the address is not set yet
  sketchVersion = "";  // empty string garantees a non-null compound version string
  PacketBuff = {};
  thisUploadCallback = NULL;
  thisDownloadCallback = NULL;
}

int ExploSerial::pollSerial(void)
{ 
  //Serial.print("enter poll serial "); Serial.println(millis());
  int callStatus = getCall();
  //Serial.print("got call "); Serial.println(millis());
  if (callStatus == 1) processCall();
  else if (callStatus == -1) {
    sendError(BAD_PACKET);
  }
  //Serial.print("poll retuerning "); Serial.println(millis());
  return(callStatus);
}

void ExploSerial::processCall(void)
{
  //Serial.print("call processing "); Serial.println(millis());
  String type = PacketBuff[TYPE]; 
  if (type == PING) sendAck();
  else if (type == VERSION) sendVersion();
  else if (type == BOARD_ADDRESS) sendAddr();
  else if (type == UPLOAD) sendUpload();
  else if (type == DOWNLOAD) processDownload();
  else sendError(BAD_TYPE);
  // dump JSON rx buffer?
}

int ExploSerial::getCall(void)
{ 
  int gotCall = 0;
  if (Serial.available()) {
    String temp = Serial.readStringUntil(LF);
    DeserializationError error = deserializeJson(PacketBuff, temp);
    if (error) {
      //sendError(temp);
      #ifdef DEBUG   
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      #endif
      gotCall = -1;  // flag bad packet
    }
    else {
      #ifdef DEBUG   
      serializeJson(PacketBuff, Serial);  // echo packet
      Serial.println();
      #endif
      gotCall = 1;
    }   
    // dump UART rx buffer?
    /*Serial.println("clearing buffer");
    while(Serial.available()) {
      char garbage = Serial.read();
    }*/
  }
  return gotCall;
}

void ExploSerial::sendAddr(void)
{
  if (boardAddress >= 0) {
    PacketBuff[TYPE] = BOARD_ADDRESS;
    PacketBuff[PAYLOAD] = boardAddress;
//    PacketBuff[COMMENT] = "valid address";
    sendPacket();
  }
  else{ 
    sendError(BAD_ADDRESS);
  }
}

void ExploSerial::sendAck(void)
{
  PacketBuff = {};
  PacketBuff[TYPE] = ACK;
  sendPacket();
}

void ExploSerial::sendError(String thisError)
{
  PacketBuff = {};
  PacketBuff[TYPE] = ERR;
  PacketBuff[PAYLOAD] = thisError;
  sendPacket();
}

void ExploSerial::sendVersion(void)
{
  PacketBuff = {};
  PacketBuff[TYPE] = VERSION;
  PacketBuff[PAYLOAD] = sketchVersion + "; " + EXPLO_SERIAL_JSON_VERSION;
  sendPacket();
}

void ExploSerial::sendPacket(void)
{
  serializeJson(PacketBuff, Serial);
  Serial.write(LF);  // need a LF as a final packet delimiter
  PacketBuff = {};// clean up output buffer
}

void ExploSerial::setAddress(int addr)
{
  boardAddress = addr;
}

void ExploSerial::setVersion(String ver)
{
  sketchVersion = ver;
}

void ExploSerial::sendUpload(String payload)
{
  PacketBuff = {};
  PacketBuff[TYPE] = UPLOAD;
  PacketBuff[PAYLOAD] = payload;
  sendPacket();
}

void ExploSerial::sendUpload(void)
{
  if (thisUploadCallback == NULL) {
    sendError(BAD_CALLBACK);
  }
  else {
    PacketBuff = {};
    PacketBuff[TYPE] = UPLOAD;
    PacketBuff[PAYLOAD] = thisUploadCallback();
    sendPacket();
  }
}

void ExploSerial::processDownload(void)
{

  if (thisDownloadCallback == NULL) {
    sendError(BAD_CALLBACK);
  }
  else {
      String localBuff = PacketBuff[PAYLOAD];
      if (thisDownloadCallback(localBuff) < 0) {
        sendError(BAD_PAYLOAD); 
      }// if payload is not accepted by application, reject payload
      else {  // download packed was good, ack it.
      PacketBuff = {};
      PacketBuff[TYPE] = DOWNLOAD;
      //sendPacket();
    }
  }
}


void ExploSerial::attachUploadCallback(UploadCallback callback)
{
  thisUploadCallback = callback;
}

void ExploSerial::attachDownloadCallback(DownloadCallback callback)
{
  thisDownloadCallback = callback;
}
