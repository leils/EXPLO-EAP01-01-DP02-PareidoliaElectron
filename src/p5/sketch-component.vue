<!-- TODO: use Transition elements -->
<template>
  <div>
    <div id="sketch" />
  </div>
  <div v-show="inTransitionMode" class="showTransitionOverlay">
      <p class="prompt">Great! Let's see what some other people drew.</p>
  </div>
  <div class="uiOverlay" ref="ui">
    <div v-show="!inTransitionMode">
      <p  class="prompt" ref="prompt">Do you see something in this image? Draw it!</p>
    </div>
    <div v-show="inDrawMode" class="buttonBar">
      <button class="eapbutton" id="undoButton" type="button">Undo</button>
      <button class="eapbutton" id="submitButton" type="button">Submit</button>
      <button class="eapbutton" id="nextImageButton" type="button">Next Image</button>
    </div>
  </div>
</template>

<script>

import { mapState, mapMutations } from 'vuex';
import { Sketch } from './main.js';

export default {
  name: 'SketchComponent',
  props: {
  },
  data: function () {
    return {
      sketch: Object,
      inDrawMode: true,
      inTransitionMode : false,
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
      this.inDrawMode = false;
      this.inTransitionMode = true;
      this.$refs.prompt.innerText = "";
      
      setTimeout(() => {
        this.inTransitionMode = false;
        this.$refs.prompt.innerText = "Did they see what you saw? \nTap the screen for a new image.";
      }, 2000)
    },
    drawMode() {
      this.inDrawMode = true;
      this.$refs.prompt.innerText = "Do you see something in this image? Draw it!";
    },
    adminMode() {
      this.inDrawMode = false;
      this.$refs.prompt.innerText = "ADMIN MODE: press d to delete drawing, arrow keys to navigate. M will exit admin mode.";
    }

  }
};
</script>
