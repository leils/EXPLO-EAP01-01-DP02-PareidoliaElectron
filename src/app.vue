<template>
  <div
    class="screen"
    :class="[language.code, language.direction]"
  >
    <link
      rel="stylesheet"
      :href="theme"
    >
    <SketchComponent ref="sketch" />
  </div>
</template>

<script>
import { mapMutations, mapState, mapGetters } from 'vuex';

import SketchComponent from './p5/sketch-component.vue';
import isElectron from 'is-electron';
export default {
  name: 'App',
  components: {
    SketchComponent,
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
        case 'm':
          this.sketchAdminMode();
          break;
        case "ArrowLeft":
        case "ArrowRight":
          this.handleArrowKeys(ev.key);
          break;
        case "d":
          this.deleteDrawing();
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
    },
    sketchAdminMode() {
      this.$refs.sketch.toggleAdminMode();
    },
    handleArrowKeys(key) {
      this.$refs.sketch.handleArrowKeys(key);
    },
    deleteDrawing() {
      this.$refs.sketch.deleteDrawing();
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
  width: 1080px;
  height: 1920px;
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
</style>
