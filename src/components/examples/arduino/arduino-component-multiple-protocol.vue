<template>
  <div class="module twoColParent">
    <div class="twoColChild">
      <p>This component includes a simple example of arduino communications using JSON and plain text. Use it with the corresponding two_way_comms sketches found in the /src/components/examples/arlduino/sketch folder.</p>
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
      arduino1: null,
      arduino2: null,
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
      this.arduino1 = createExploJSONArduino(this.config.arduino);

      // listen to data event to receive messages from all opened ports
      this.arduino1.on('data', this.parseArduinoDataJSON);

      // optionally, listen for other events from all opened ports
      this.arduino1.on('connect', (message, event) => {
        console.log('vue component received connect:', message, event);
        // reopen on connection
        this.arduino1.open({'usbProductId': 32833, 'usbVendorId': 9025});
      });      
      this.arduino1.on('disconnect', (message, connection) => console.log('vue component received disconnect:', message, connection));
      this.arduino1.on('open', (message, connection) => console.log('vue component received open:', message, connection));
      this.arduino1.on('close', (message, connection) => console.log('vue component received close:', message, connection));
      this.arduino1.on('error', (message, connection) => console.error('vue component received error:', message, connection));


      this.arduino1.open({'usbProductId': 32833, 'usbVendorId': 9025});
      

      let { createPlainTextArduino } = await import('@explo/arduino');
      this.arduino2 = createPlainTextArduino(this.config.arduino);

      // listen to data event to receive messages from all opened ports
      this.arduino2.on('data', this.parseArduinoDataPlainText);

      // optionally, listen for other events from all opened ports
      this.arduino2.on('connect', (message, event) => {
        console.log('vue component received connect:', message, event);
        // reopen on connection
        this.arduino2.open({'usbProductId': 67, 'usbVendorId': 9025});
      });      
      this.arduino2.on('disconnect', (message, connection) => console.log('vue component received disconnect:', message, connection));
      this.arduino2.on('open', (message, connection) => console.log('vue component received open:', message, connection));
      this.arduino2.on('close', (message, connection) => console.log('vue component received close:', message, connection));
      this.arduino2.on('error', (message, connection) => console.error('vue component received error:', message, connection));


      this.arduino2.open({'usbProductId': 67, 'usbVendorId': 9025});
    }
  },
  unmounted() {
    this.arduino1.close();
    this.arduino2.close();
  },
  methods: {
    toggleLed() {
      if (isElectron()) {
        this.LEDon = !this.LEDon;
        // send message to arduino using write function
        if (this.LEDon == true) {
          this.write1({'led': 'on'});
          this.write2('led:on');
        } else {
          this.write1({'led': 'off'});
          this.write2('led:off');
        }
      }
    },
    parseArduinoDataJSON(stringMessage, connection) {
      const message = JSON.parse(stringMessage);

      // update this parse function to respond to messages from Arduino
      // optionally update vuex store to use values in other components
      console.log('parseArduinoData', message, connection);
      this.$parent.resetTimeout();

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
    parseArduinoDataPlainText(message, connection) {
      // update this parse function to respond to messages from Arduino
      // optionally update vuex store to use values in other components
      console.log('parseArduinoData', message, connection);
      this.$parent.resetTimeout();

      // update state of LED toggle button
      if (message.indexOf('confirmReceived') > -1) {
        if (message.indexOf('led:on') > -1) { 
          this.LEDButtonText = 'turn LED off';
        } else if (message.indexOf('led:off') > -1) {
          this.LEDButtonText = 'turn LED on';
        } 
      }

      // update UI to reflect button state
      if (message.indexOf('buttonEvent') > -1) {
        if (message.indexOf('press') > -1) {
          this.buttonPressed = true;
        } else if (message.indexOf('release') > -1) {
          this.buttonPressed = false;
        }
      }
    },
    write1(message) {
      // send to all arduino1 devices using JSON
      this.arduino1.broadcast(message);
    },
    write2(message) {
      // send to all arduino2 devices using plain text
      this.arduino2.broadcast(message);
    }
  }
};
</script>
