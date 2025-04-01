<!-- TODO: use Transition elements -->
<template>
  <div>
    <div id="sketch" />
  </div>
  <div v-show="mode === Modes.SUBMIT" class="showTransitionOverlay">
      <p class="prompt">Great! Let's see what some other people drew.</p>
  </div>
  <div class="uiOverlay" ref="ui">
    <div v-show="mode != Modes.SUBMIT">
      <p  class="prompt" ref="prompt">{{ promptText() }}</p>
    </div>
    <div v-show="mode === Modes.DRAW" class="buttonBar">
      <button class="eapbutton" id="undoButton" type="button">Undo</button>
      <button class="eapbutton" id="submitButton" type="button">Submit</button>
      <button class="eapbutton" id="nextImageButton" type="button">Next Image</button>
    </div>
  </div>
</template>

<script>

import { mapState, mapMutations } from 'vuex';
import { Sketch } from './main.js';

/* There are four modes; draw mode, submit mode, show mode, and admin mode
 * Drawing + drawing IO, image navigation, only available in drawing mode 
 * Normal loop is Draw -> Submit -> Show -> Draw
 */
 const Modes = Object.freeze({
  DRAW: 0,
  SUBMIT: 1,
  SHOW: 2,
  ADMIN: 3
});


export default {
  name: 'SketchComponent',
  props: {
  },
  data: function () {
    return {
      Modes, // Modes frozen object must be attached to data for template use
      sketch: Object,
      mode: Modes.DRAW,
    };
  },
  computed: mapState([
    'config',
    'appScale',
    'persistent',
  ]),
  watch: {
    appScale(newValue) {
      this.sketch.appScale = newValue;
    }
  },
  mounted() {
    this.sketch = new Sketch(
      this,
      this.config.sketch,
      this.appScale,
      this.persistent.drawings
    );

    document.getElementById('undoButton').onclick = this.undo;
    document.getElementById('submitButton').onclick = this.submit;
    document.getElementById('nextImageButton').onclick = this.nextImage;
  },
  unmounted() {
    this.sketch.remove();
  },
  methods: {
    reset() {
      this.sketch.reset();
    },
    ...mapMutations([
      'persistData'
    ]),
    updateDrawingData(dataToSave) {
      let pd = this.persistent;
      pd.drawings = dataToSave;
      this.persistData(pd);
    },
    nextImage() {
      this.sketch.nextImage();
    },
    undo() {
      this.sketch.undo();
    },
    submit() {
      this.mode = Modes.SUBMIT;
      this.sketch.submitDrawing();
      this.sketch.enterSubmitMode();

      setTimeout(() => {
        this.showMode();
      }, 2000);
    },
    showMode() {
      this.mode = Modes.SHOW;
      this.sketch.enterShowMode();

      // todo: make timing a config
      setTimeout((timeEnteredShow) => {
        console.log('running timeout');
        let nowTime = Date.now();
        if (this.mode == Modes.SHOW && ((nowTime - timeEnteredShow) >= 5000)) {
          this.sketch.enterDrawMode();
        }
      }, 5000, Date.now()) 

    },
    drawMode() {
      this.mode = Modes.DRAW;
      this.sketch.enterDrawMode();
    },
    toggleAdminMode() {
      if (this.mode != Modes.ADMIN) {
        this.mode = Modes.ADMIN;
        this.sketch.enterAdminMode();
      } else {
        this.drawMode();
      }
    },
    handleArrowKeys(key) {
      if (this.mode == Modes.ADMIN) {
        switch (key) {
          case "ArrowLeft":
            this.sketch.prevDrawing();
            break;
          case "ArrowRight":
            this.sketch.nextDrawing();
            break;
          case "d":
            this.sketch.deleteDrawing();
            break;
        } 
      } else {
        switch (key) {
          case "ArrowLeft": 
            this.sketch.prevImage();
          case "ArrowRight":
            this.sketch.nextImage();
        }
      }
    },
    deleteDrawing() {
      if (this.mode == Modes.ADMIN) {
        this.sketch.deleteDrawing();
      }
    },
    promptText() {
      switch (this.mode) {
        case Modes.DRAW: 
          return "Do you see something in this image? Draw it!";
        case Modes.SUBMIT: 
          return "";
        case Modes.SHOW: 
          return 'Did they see what you saw? \nTap the screen for a new image.';
        case Modes.ADMIN:
          return "ADMIN MODE: press d to delete drawing, arrow keys to navigate. M will exit admin mode.";
      }
    }

  }
};
</script>
