'use strict';

const path = require('path');
// eslint-disable-next-line @typescript-eslint/naming-convention
const { app, BrowserWindow, ipcMain } = require ('electron');

// this process.env.NODE_ENV set in script, only appears in develpoment mode
var isDevelopment = process.env.NODE_ENV == 'development';

// setup main log
// mac: ~/Library/Logs/electron-vue-template
// win: %USERPROFILE%\AppData\Roaming\{app name}\logs
const log = require('electron-log'); 
log.catchErrors(); // include errors (unhandled exceptions ramin uncaught)
log.transports.file.level = 'error'; // set level of console.log messages to be saved to file
Object.assign(console, log.functions); // include console.log output as well

async function createWindow() {
  // Create the browser window.
  let win = null;
  if (app.commandLine.hasSwitch('windowed')) {
    // to run in windowed mode use the command `npm run electron:dev_win`
    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
  } else {
    win = new BrowserWindow({
      width: 800,
      height: 600,
      kiosk: true,
      fullscreen: true,
      frame: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
  }

  // to enable remote in renderer
  require('@electron/remote/main').initialize();
  require('@electron/remote/main').enable(win.webContents);

  // Permissions needed for WebSerial API (used by the evt-arduion package)
  win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'serial') {
      return true;
    }
    return false;
  });
  win.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial') {
      return true;
    }
    return false;
  });

  win.loadURL(isDevelopment
    ? 'http://localhost:3000/index.html'
    : `file://${path.join(__dirname, '../dist/index.html')}`);

  win.webContents.once('dom-ready', () => {
    if (isDevelopment) {
      // win.webContents.openDevTools();
    }
  });
  
  // Handle keycommands that are unhandled by the renderer process
  ipcMain.on('handleKey', (ev, key) => {
    switch (key) {
      case 'q': 
        app.quit();
        break;
      case 'd':
        win.openDevTools();
        break;
      default: 
        // NOTE: these logged messages appear in the terminal window, not the browser.
        console.log('keystroke unhandeled in background.js:' + key);
        break;      
    } 
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment) {
    // Install Vue Devtools
    try {
      const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
