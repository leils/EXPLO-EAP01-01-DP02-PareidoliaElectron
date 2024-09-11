<template>
  <div class="module twoColParent">
    <div class="twoColChild">
      <p>This component includes a simple example of arduino communications using the ExploJSON protocol. Use it with the corresponding two_way_comms sketch found in the /src/components/examples/arlduino/sketch folder.</p>
      <p>Optionally, remove the template section of this component to create a headless arduino connection. And use the vuex store to pass arduino values to other components.</p>
      <p>For example components using other protocols, refer to the /src/components/examples/arduino folder.</p>
    </div>
    <div class="twoColChild">
      <p>
        Send message to connected arduino(s) using write:
        <button @click="toggleLed">
          {{ LEDButtonText }}
        </button>
      </p>
      <img :src="buttonPressed ? 'assets/examples/arduino/button-down.png' : 'assets/examples/arduino/button-up.png'">
    </div>
  </div>
</template>

<script>

import { mapState } from 'vuex';
import isElectron from 'is-electron';

export default {
  name: 'ArduinoComponent',
  data() {
    return {
      arduino: null,
      LEDon: false,
      LEDButtonText: 'turn LED on',
      buttonPressed: false
    };
  },
  computed: mapState([
    'config',
  ]),
  async mounted() {
    // require generates error in web view
    if (isElectron()) {
      let { createExploJSONArduino } = await import('@explo/arduino');
      this.arduino = createExploJSONArduino(this.config.arduino);

      // listen to data event to receive messages from all opened ports
      this.arduino.on('data', this.parseArduinoData);

      // optionally, listen for other events from all opened ports
      this.arduino.on('connect', (message, event) => {
        console.log('vue component received connect:', message, event);
        // reopen on connection
        this.arduino.open();
      });
      this.arduino.on('disconnect', (message, connection) => console.log('vue component received disconnect:', message, connection));
      this.arduino.on('open', (message, connection) => console.log('vue component received open:', message, connection));
      this.arduino.on('close', (message, connection) => console.log('vue component received close:', message, connection));
      this.arduino.on('error', (message, connection) => console.error('vue component received error:', message, connection));
      // this.arduino.on('ack', (connection) => console.log('vue component received ack.', connection));
      // this.arduino.on('version', (version, connection) => console.log('vue component received version:', version, connection));

      // optionally, get a list of portnames
      console.log('ports on this computer:', await this.arduino.listPortInfo());

      // open all arduinos connected to this computer
      this.arduino.open();
      
      // optionally, pass the port name or a list of names to connect to
      // usbProductId 67 is UNO, 32833 is Yun, usbVendorId 9025 is Arduino
      // this.arduino.open( {'usbProductId':67, 'usbVendorId':9025} );
      // this.arduino.open( [{'usbProductId':67, 'usbVendorId':9025}, {'usbProductId':32833, 'usbVendorId':9025}]  );
      
      this.arduino.on('identified', (connection) => {
        // called when the address is received from the board (now it can be addressed explicitely)
        console.log('vue component received identified:', connection);
        if (connection.address == this.arduino.BLACK) {
          // optionally, listen for events from specific arduino devices
          this.arduino.get(this.arduino.BLACK).on('data', (message) => console.log('data received from the black arduino:', message));
          this.arduino.get(this.arduino.BLACK).on('ack', (message) => console.log('PING received from the black arduino:', message));
          this.arduino.get(this.arduino.BLACK).on('version', (message) => console.log('VERSION received from the black arduino:', message));
          this.arduino.get(this.arduino.BLACK).sendPing();
          this.arduino.get(this.arduino.BLACK).requestVersion(); 
        } 
        if (connection.address == this.arduino.BLUE) {
          // optionally, listen for events from specific arduino devices
          this.arduino.get(this.arduino.BLUE).on('data', (message) => console.log('data received from the blue arduino:', message));
          this.arduino.get(this.arduino.BLUE).on('ack', (message) => console.log('PING received from the blue arduino:', message));
          this.arduino.get(this.arduino.BLUE).on('version', (message) => console.log('VERSION received from the blue arduino:', message));
          this.arduino.get(this.arduino.BLUE).sendPing();
          this.arduino.get(this.arduino.BLUE).requestVersion(); 
        } 
      });
    } 
  },
  unmounted() {
    this.arduino.close();
  },
  methods: { 
    toggleLed() {
      if (isElectron()) {
        this.LEDon = !this.LEDon;
        // send message to arduino using write function
        if (this.LEDon == true) {
          this.write({'led': 'on'});
        } else {
          this.write({'led': 'off'});
        }
      }
    },
    parseArduinoData(stringMessage, connection) {
      // update this parse function to respond to messages from Arduino
      // optionally update vuex store to use values in other components

      console.log('parseArduinoData', stringMessage, connection);
      this.$parent.resetTimeout();

      const message = JSON.parse(stringMessage);

      // update state of LED toggle button
      if ('led' in message) {
        switch (message['led']) {
          case 'on':
            this.LEDButtonText = 'turn LED off';
            break;
          case 'off':
            this.LEDButtonText = 'turn LED on';
            break;
        }
      }

      // update UI to reflect button state
      if ('buttonEvent' in message) {
        switch (message['buttonEvent']) {
          case 'press':
            this.buttonPressed = true;
            break;
          case 'release':
            this.buttonPressed = false;
            break;
        }
      }
    },
    write(message) {
      // send to all
      this.arduino.broadcast(message);

      // send to just one
      // this.arduino.get(this.arduino.BLACK).write(message);
    }
  }
};
</script>
