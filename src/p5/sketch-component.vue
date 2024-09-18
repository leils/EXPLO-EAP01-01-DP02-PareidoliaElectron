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
    this.sketch = new Sketch(this.config.sketch, this.appScale, this.persistent.drawings, this.updateDrawingData);
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
  }
};
</script>
