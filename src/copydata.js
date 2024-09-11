// copies the config, text, and persistent files from the public folder to the appdata folder

const fs = require('fs');
const os = require('os');
const path = require('path');

let appName = JSON.parse(fs.readFileSync('package.json')).name;

var appDataFolder;

switch (process.platform) {
  case 'darwin':
    appDataFolder = path.join(os.homedir(), 'Library', 'Application Support', appName + '-explo');
    break;

  case 'win32':
    appDataFolder = path.join(os.homedir(), 'AppData', 'Roaming', appName + '-explo');
    break;

  case 'linux':
    appDataFolder = path.join(os.homedir(), '.config', appName + '-explo');
    break;
}

if (!fs.existsSync(appDataFolder)) {
  fs.mkdirSync(appDataFolder);
} 

// repoDir is the files in the repo (the ones that will be packaged into the electron app)
const repoDir = 'public/';

let externalFilesFileName = 'external-files.json';
let configFileName = 'config.json';
let persistentFileName = 'persistent.json';
let textFileName = 'text.yaml';

// load and parse externalFilesFileName to find which files to copy
try {
  var externalFilesPublicConfig = JSON.parse(fs.readFileSync(path.join(repoDir, externalFilesFileName)).toString());
  if (externalFilesPublicConfig != null) {
    copyFile(externalFilesFileName, repoDir, appDataFolder);
  }
} catch (err) {
  console.log('public/external-files.json not found, will use default file names.');
}

if (externalFilesPublicConfig != null) {
  // parse out the new file names
  if (externalFilesPublicConfig.configFileName != null) {
    configFileName = externalFilesPublicConfig.configFileName;
  }
  if (externalFilesPublicConfig.persistentFileName != null) {
    persistentFileName = externalFilesPublicConfig.persistentFileName;
  }
  if (externalFilesPublicConfig.textFileName != null) {
    textFileName = externalFilesPublicConfig.textFileName;
  }
} 

// copy each file
copyFile(configFileName, repoDir, appDataFolder);
copyFile(persistentFileName, repoDir, appDataFolder);
copyFile(textFileName, repoDir, appDataFolder);

function copyFile(filename, repoDir, localDir) {
  fs.copyFile(path.join(repoDir, filename), path.join(localDir, filename), (err) => {
    if (err) {
      console.log('Error Found:', err);
    } else {
      console.log('copied', filename);
    }
  });
}