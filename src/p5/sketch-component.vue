<template>
  <div>
    <div id="sketch" />
  </div>
  <div class="uiOverlay" id="uiOverlay" ref="ui">
    <div>
      <p>hello</p>
    </div>
    <Transition>
      <div v-if="inDrawMode" class="buttonBar">
        <button class="eapbutton" id="undoButton" type="button">Undo</button>
        <button class="eapbutton" id="submitButton" type="button">Submit</button>
        <button class="eapbutton" id="nextImageButton" type="button">Next Image</button>
      </div>
    </Transition>
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
    },
    drawMode() {
      this.inDrawMode = true;
    }
  }
};
</script>
