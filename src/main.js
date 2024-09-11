import { createApp } from 'vue';
import App from './app.vue';
import store from './store';
import isElectron from 'is-electron';

// process.env.NODE_ENV automatically set (but not available in background.js)
store.state.production = process.env.NODE_ENV != 'development';
var desktop = isElectron();

// setup renderer log, saved to: 
// mac: ~/Library/Logs/electron-vue-template
// win: %USERPROFILE%\AppData\Roaming\{app name}\logs
if (desktop && process.env.NODE_ENV != 'development') {
  // when using the electron log, source line is lost -- will use only in production
  const log = require('electron-log'); 
  log.catchErrors(); // include errors (unhandled exceptions ramin uncaught)
  log.transports.file.level = 'error'; // set level of console.log messages to be saved to file
  Object.assign(console, log.functions); // include console.log output as well
}

if (desktop) {
  // set up express for file serving 
  if (process.env.NODE_ENV != 'development') {
    const express = require('express');
    const cors = require('cors');
    const app = express();
    app.use(cors());
    const port = 3000; 
    app.use(express.static(__dirname));
    app.listen(port, () => console.log(`Express asset server listening on port ${port}`));
  } 

  let { createAdminPortal } = await import('@explo/admin');
  // admin app needs to receive the store object
  createAdminPortal(store);
} 
    
createApp(App)
  .use(store)
  .mount('#app');

function resize() {
  let body = document.querySelector('body');
  let appContainer = document.querySelector('#app');

  let rx = body.offsetWidth / appContainer.offsetWidth;
  let ry = body.offsetHeight / appContainer.offsetHeight;
  if (rx < ry) {
    document.querySelector('#app').style.transform = `scale(${ rx }) translateY(${(body.offsetHeight - appContainer.offsetHeight * rx) / 2 / rx }px)`;
    store.commit('setScale', rx);
  } else {
    document.querySelector('#app').style.transform = `scale(${ ry }) translateX(${(body.offsetWidth - appContainer.offsetWidth * ry) / 2 / ry }px)`;
    store.commit('setScale', ry);
  }
}

resize();
document.querySelector('body').onresize = resize;
