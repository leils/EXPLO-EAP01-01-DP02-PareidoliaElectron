<template>
  <div
    class="screen"
    :class="[language.code, language.direction]"
  >
    <link
      rel="stylesheet"
      :href="theme"
    >
    <!-- <h1 class="yamlText">
      {{ text('exhibit-title') }}
    </h1> -->
    <!-- <div class="module">
      <p>The store's text function gets localized text from vuex. Text can include HTML tags.</p>
      <p
        class="yamlText"
        v-html="text('try-this')"
      />
      <p>
        You can specify a specific language so it <span class="yamlText">{{ text('always-spanish', 'es') }}</span>. If the requested text item is not found in text.yaml file, text function returns: <span
          class="yamlText"
          v-html="text('not-there')"
        />
      </p>
    </div> -->
    
    <!-- <div><ArduinoComponent /></div> -->
    <!-- <div><PersistentComponent /></div> -->
    <SketchComponent ref="sketch" />
  </div>
</template>

<script>
import { mapMutations, mapState, mapGetters } from 'vuex';

// the following line imports the arduino component using the ExploJSON protocol
// examples for other ptotocols are available in the ./components/examples/arduino directory
import ArduinoComponent from './components/examples/arduino/arduino-component-explo-json.vue';

import PersistentComponent from './components/examples/persistent-data/persistent-component.vue';
import SketchComponent from './components/examples/p5/sketch-component.vue';
import isElectron from 'is-electron';
export default {
  name: 'App',
  components: {
    SketchComponent,
    PersistentComponent,
    ArduinoComponent,
  },
  data: function() { 
    return {
      idleTimeout: null
    };
  },
  computed: {
    theme() { return `./styles/${this.config.template.stylesheet}.css`;},
    ...mapGetters([
      'language',
      'text'
    ]),
    ...mapState([
      'config',
      'persistent',
      'adminPortal'
    ]),
  },
  mounted() {
    // if the app needs to run for a while and then reset (e.g. trigger an attract loop), call resetTimer here.
    // otherwise timer does not start until one of the interactions below are triggered
    // this.resetTimeout();

    // optionally set a specific language
    // this.setLanguage('he');

    document.addEventListener('touchstart', () => { this.resetTimeout(); });
    document.addEventListener('touchmove', () => { this.resetTimeout(); });
    document.addEventListener('mousedown', () => { this.resetTimeout(); });
    document.addEventListener('mousemove', () => { this.resetTimeout(); });
    // Any key commands can be defined here. Undefinded
    // key commands are sent to the electron main process. See
    // which keys are already defined in background.js
    document.addEventListener('keydown', (ev) => {
      this.resetTimeout();

      switch (ev.key) {
        case '/': 
          this.toggleLanguage();
          break;
        default: 
          if (isElectron()) {
            const ipcRenderer = require('electron').ipcRenderer;
            console.log('keystroke unhandeled in browser:' + ev.key + ', sending to background.js.');
            ipcRenderer.send('handleKey', ev.key);
          } else {
            console.log('undefined keystroke, and running in browser.');
          }
      }
    });

    
    if (isElectron()) {
      // subscribe to the reset event defined in the config.json file
      this.adminPortal.on('reset', this.reset);
    }
  },
  methods: {
    ...mapMutations(['toggleLanguage', 'setLanguage']),
    reset() {
      // This is part of admin example, it is called by the reset endpoint, defined in the config.json file
      // pass the reset to the p5 sketch through the sketch component
      this.$refs.sketch.reset();
    },
    resetTimeout() {
      if (this.idleTimeout) {
        clearTimeout(this.idleTimeout);
        this.idleTimeout =  null;
      }
      
      this.idleTimeout = setTimeout(() => {
        this.reset();
      }, this.config.template.idle);
    }
  }
};
</script>

<style>
/* begin EVT core styles -- most of these should not change for a project*/
body {
  position: absolute;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.ltr {
  direction: ltr;
}

.rtl {
  direction: rtl;
}

#app {
  width: 1920px;
  height: 1080px;
  transform-origin: top left;
  position: relative;
  margin: 0;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* end EVT core styles*/

/* begin styles specific to the template's example code */
.module {
  border: 2px solid black;
  margin: 5px;
  padding-left: 5px;
  padding-right: 5px;
}

.twoColParent {
  display: flex;
  flex-direction: row;
}

.twoColChild {
  width: 50%;
}

.twoColParent > div:first-child + div {
  padding-left: 20px;
  padding-right: 20px;
}

.yamlText {
  background-color: lightskyblue;
}
/* end styles specific to the template's example code*/

</style>
