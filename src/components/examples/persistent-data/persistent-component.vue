<!-- 
  This component includes some UI for testing
  
  You will likely want to remove this trival example of updating persistent
-->

<template>
  <div class="module twoColParent">
    <div class="twoColChild">
      <p>This PersistentComponent shows how to access data from vuex store, for example highscore: {{ persistent.highscore }}</p>
    </div>
    <div class="twoColChild">
      <p>
        Data can be persisted between sessions by calling the persistData mutation. E.G. highscore: <input
          :value="persistent.highscore"
          @input="updateScore"
        >
      </p>
    </div>
  </div>
</template>

<script>

import { mapState, mapMutations } from 'vuex';

export default {
  name: 'PersistentComponent',
  data() {
    return {
    };
  },
  computed: mapState([
    'persistent'
  ]),
  methods: {
    ...mapMutations([
      'persistData'
    ]),
    updateScore(event) {
      let pd = this.persistent;
      pd.highscore = event.target.value;
      this.persistData(pd);
    }
  }
};
</script>
