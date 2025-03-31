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
      <p  class="prompt" ref="prompt">Do you see something in this image? Draw it!</p>
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
      this.sketch.submitDrawing();
    },
    showMode() {
      this.mode = Modes.SUBMIT;
      this.$refs.prompt.innerText = "";
      
      setTimeout(() => {
        this.mode = Modes.SHOW;
        this.$refs.prompt.innerText = "Did they see what you saw? \nTap the screen for a new image.";
      }, 2000)
    },
    drawMode() {
      this.mode = Modes.DRAW;
      this.$refs.prompt.innerText = "Do you see something in this image? Draw it!";
    },
    adminMode() {
      this.mode = Modes.ADMIN;
      this.$refs.prompt.innerText = "ADMIN MODE: press d to delete drawing, arrow keys to navigate. M will exit admin mode.";
    }

  }
};
</script>
