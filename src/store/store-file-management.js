import YAML from 'yaml';
import isElectron from 'is-electron';

var appName;
var localDataFolder;

let externalFilesFileName = 'external-files.json';
let configFileName = 'config.json';
let persistentFileName = 'persistent.json';
let textFileName = 'text.yaml';

if (isElectron()) {
  const fs = require('fs');

  appName = getAppName();
  localDataFolder = getLocalDataFolder(appName);

  if (!fs.existsSync(localDataFolder)) {
    fs.mkdirSync(localDataFolder);
  } 
}

// load external file names into the externalFilesConfig
const externalFilesConfig = await loadExternalFilesConfig();

// parse externalFilesConfig and determine if there are alternative config files to use
if (externalFilesConfig != null) {
  if (externalFilesConfig.configFileName != null) {
    // set the new name of configFile (found in metaConfig)
    configFileName = externalFilesConfig.configFileName;
  }
  if (externalFilesConfig.persistentFileName != null) {
    persistentFileName = externalFilesConfig.persistentFileName;
  }
  if (externalFilesConfig.textFileName != null) {
    textFileName = externalFilesConfig.textFileName;
  }
} 

const publicConfig = JSON.parse(await loadPublicDataFile(configFileName));
const publicPersistent = JSON.parse(await loadPublicDataFile(persistentFileName));
const publicText = await loadPublicDataFile(textFileName);

function getAppName() {
  // use remote to access the name of the app set in package.json
  const remote = require('@electron/remote');
  return remote.app.getName();
}

function getLocalDataFolder(appName) {
  const os = require('os');
  const path = require('path');
  
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appName + '-explo');
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', appName + '-explo');
    case 'linux':
      return path.join(os.homedir(), '.config', appName + '-explo');
    default:
      console.error('persistent data not yet supported on platform ' + process.platform);
      break;
  }

  return null; 
}

async function loadExternalFilesConfig () {
  try {
    const externalFilesPublicConfig = JSON.parse(await loadPublicDataFile(externalFilesFileName));
    if (isElectron()) {
      if (process.env.NODE_ENV != 'development') {
        const localFileData = await loadLocalDataFile (localDataFolder, externalFilesFileName);
        if (localFileData != null) {
          return JSON.parse(localFileData);
        } else {
          copyFile(externalFilesFileName, localDataFolder);
        }
      }
    } 
    return externalFilesPublicConfig;
  } catch (err) {
    console.log(externalFilesFileName + 'not found in public folder, will use default file names.');
    console.error(err);
    return null;
  }
}

async function loadConfig () {
  if (isElectron()) {
    if (process.env.NODE_ENV != 'development') {
      const localFileData = await loadLocalDataFile (localDataFolder, configFileName);
      if (localFileData != null) {
        return JSON.parse(localFileData);
      } else {
        copyFile(configFileName, localDataFolder);
      }
    } 
  } 
  return publicConfig;
}

async function loadPersistent () {
  if (isElectron()) {
    const localFileData = await loadLocalDataFile (localDataFolder, persistentFileName);
    if (localFileData != null) {
      return JSON.parse(localFileData);
    } else {
      copyFile(persistentFileName, localDataFolder);
    }
  } 
  return publicPersistent;
}

function savePersistent (data) {
  if (isElectron()) {
    // save to file
    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(localDataFolder, persistentFileName), JSON.stringify(data));
  } else {
    console.log('NOTE: file persistence is not supported on web');
  }
}

async function loadText () {
  if (isElectron()) {
    if (process.env.NODE_ENV != 'development') {
      const localFileData = await loadLocalDataFile (localDataFolder, textFileName);
      if (localFileData != null) {
        return YAML.parse(localFileData);
      } else {
        copyFile(textFileName, localDataFolder);
      }
    } 
  } 
  return YAML.parse(publicText);
}

async function loadPublicDataFile(filename) {
  if (isElectron()) {
    const fs = require('fs');
    const path = require('path');
    let result;
    if (process.env.NODE_ENV == 'development') {
      // dev
      result = fs.readFileSync('./public/' + filename).toString();
    } else {
      // production
      const filePath = path.join(__dirname, filename);
      result = fs.readFileSync(filePath).toString();
    }
    return result;
  } else {
    let response = await fetch('./' + filename);
    const text = await response.text();
    return text;
  }
}

async function loadLocalDataFile (localDataFolder, filename) {
  const fs = require('fs');
  const path = require('path');
  if (fs.existsSync(path.join(localDataFolder, filename))) {
    return fs.readFileSync(path.join(localDataFolder, filename)).toString();
  } else {
    return null;
  }
}

function copyFile(filename, localDir) {
  const fs = require('fs');
  const path = require('path');

  let filePath = null;

  if (process.env.NODE_ENV == 'development') {
    // dev
    filePath = './public';
  } else {
    // production
    filePath = __dirname;
  }

  fs.copyFile(path.join(filePath, filename), path.join(localDir, filename), (err) => {
    if (err) {
      console.log('Error Found:', err);
    } else {
      console.log('copied', filename);
    }
  });
}

function getExternalFileData() {
  // save these things to the store so that they will be availble to the admin if installed
  let externalFileData = {};

  let appDataFolder = __dirname;
  if (isElectron() && process.env.NODE_ENV == 'development') {
    appDataFolder = 'public/';
  }

  externalFileData.localDataFolder = localDataFolder;
  externalFileData.appDataFolder = appDataFolder;  
  externalFileData.externalFilesFileName = externalFilesFileName;  
  externalFileData.configFileName =  configFileName; 
  externalFileData.textFileName = textFileName; 
  externalFileData.persistentDataFileName = persistentFileName; // keep data in this string to work with admin

  return externalFileData;
}

export { loadConfig, loadPersistent, savePersistent, loadText, getExternalFileData };