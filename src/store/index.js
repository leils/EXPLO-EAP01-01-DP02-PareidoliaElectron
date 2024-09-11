import { createStore } from 'vuex';
import isElectron from 'is-electron';
import pk from '/package.json';
import { getExternalFileData, loadConfig, loadPersistent, savePersistent, loadText} from './store-file-management';


var externalFileData;
var text;
var config;
var persistent;
var appName = pk.name;

await (async function() {
  if (isElectron()) {
    externalFileData = getExternalFileData();
  }
  config = await loadConfig ();
  persistent = await loadPersistent ();
  text = await loadText ();
})();

export default createStore({
  state: {
    externalFileData,
    config,
    persistent,
    languageIndex: 0,
    text,
    appScale: 1,
    appName
  },
  getters: {
    text: state => (id, languageCode) =>  {
      const textLines = state.text[id];
      if (typeof(textLines) == 'undefined') {
        console.error(`Text string id '${id}' was not found`);
        return ('UNDEFINED TEXT');
      }

      if (typeof(languageCode) == 'undefined') {
        languageCode = state.config.languages[state.languageIndex].code;
      }
      
      const localizedLine = state.text[id][languageCode];
      if (typeof(localizedLine) == 'undefined') {
        console.error(`Text string id '${id}' for language '${languageCode}' was not found`);

        return ('UNDEFINED TEXT');
      }
      return localizedLine;
    },
    language: state => {
      if (typeof(state.config.languages) != 'undefined') {
        return state.config.languages[state.languageIndex];
      } 
      console.error(`languages not found in the config.json file, using en as default.`);
    }
  },
  mutations: {
    toggleLanguage(state) {      
      state.languageIndex = (state.languageIndex + 1) % state.config.languages.length;
    },
    setLanguage(state, languageCode) {      
      for (let i = 0; i < state.config.languages.length; i++) {
        if (state.config.languages[i].code == languageCode) {
          state.languageIndex = i;
        }
      }
    },
    persistData(state, data) {
      // replace object in store
      persistent = data;

      savePersistent(data);
    }, 
    setScale(state, scale) {
      // replace object in store
      state.appScale = scale;
    }
  },
  actions: {
  },
  modules: {
  }
});
