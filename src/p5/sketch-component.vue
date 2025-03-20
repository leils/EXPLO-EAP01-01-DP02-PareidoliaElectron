<template>
  <div>
    <div id="sketch" /> 
  </div>
</template>

<script>

import { mapState, mapMutations } from 'vuex';
import { Sketch } from './main.js';

export default {
  name: 'SketchComponent',
  emits: ['showMode', 'drawMode'],
  props: {
  },
  data: function() {
    return {
      sketch: Object,
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
      pd.drawings= dataToSave;
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
    enteredShowMode() {
      this.$emit("showMode");
    },
    enteredDrawMode() {
      this.$emit("drawMode");
    }
  }
};
</script>
