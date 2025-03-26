# Pareidolia port to Electron + Vue template
template tested with node v17.9.1.

This template demonstrates common uses of Electron and Vue at the Exploratorium. 

## To build or run use one of these commands:

- **```npm run app:dev```** -- dev in electron fullscreen
- **```npm run app:dev_win```** -- dev in electron windowed
- **```npm run app:build```** -- build electron
- **```npm run app:cleanbuild```** -- build electronafter removing the local data
- **```npm run app:removedata```** -- clear external data files from local data
- **```npm run app:copydata```** -- copy external data files from public to local data
- **```npm run web:dev```** -- dev in browser
- **```npm run web:build```** -- build for browser

To debug in production see: https://stackoverflow.com/questions/45485262/how-to-debug-electron-production-binaries

- lldb path/to/build.app
  - run --remote-debugging-port=8315
- http://localhost:8315/

to test web build on mac:
python2 -m SimpleHTTPServer 8000

or 

python3 -m http.server

## For eslint
For VS Code, use https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
to run in command line: 
    npx eslint --ext .js,.vue src
ir to run and auto-fix issues
    npx eslint --ext .js,.vue src --fix

## Log files
When running the built app, Log files are saved to the drive at the following locations:

- on Mac: ~/Library/Logs/<appName>
- on Win: %USERPROFILE%\AppData\Roaming\<appName>\logs

By default, only errors (both caught and uncaught) are logged.

These log files are automatically rotated when they are 1MB and only one previous log file is kept.
 
## Roadmap for further improvements
- Move text, buttons and UI overall out of the sketch component into their own components 
- Handle line drawing issues, including re-render being different than original line 
- Admin mode integrated  
- call resetTimeout during show mode to prevent double image changes on end of show mode 