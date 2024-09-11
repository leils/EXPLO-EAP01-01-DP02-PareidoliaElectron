<template>
  <div>
    <div id="sketch" /> 
  </div>
</template>

<script>

import { mapState } from 'vuex';
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
  ]),
  watch: {
    appScale(newValue) {
      this.sketch.appScale = newValue;
    }
  },
  mounted() {
    this.sketch = new Sketch(this.config.sketch, this.appScale);
  },
  unmounted() {
    this.sketch.remove();
  },
  methods: {
    reset() {
      this.sketch.reset();
    },
  }
};
</script>
