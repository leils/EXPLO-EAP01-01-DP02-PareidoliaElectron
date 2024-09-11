// clears the config, text, and persistent files from the appdata folder

const fs = require('fs');
const os = require('os');
const path = require('path');

let appName = JSON.parse(fs.readFileSync('package.json')).name;
// var appDataFolder = process.platform == 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support', appName) : path.join(os.homedir(), 'AppData', 'Roaming', appName);
// appDataFolder = appDataFolder + '-explo';

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

if (fs.existsSync(appDataFolder)) {
  fs.readdir(appDataFolder, function (err, files) {
    // handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } 
    // listing all files using forEach
    for (const file of files) {
      // Do whatever you want to do with the file
      removeFile(appDataFolder, file);
    }
  });
} else {
  console.log('Folder not found: ' + appDataFolder);
}

function removeFile(folder, file) {
  console.log('deleting ' + file);
  fs.unlinkSync(path.join(folder, file));
}
