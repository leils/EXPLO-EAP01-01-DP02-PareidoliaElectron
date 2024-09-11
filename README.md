# Electron + Vue template
v 2.1.1
intended for use with Node 17.
tested with node v17.9.1.

This template demonstrates common uses of Electron and Vue at the Exploratorium. 

The template includes examples of how to use the external data files. For information on external files, refer to the [Repository Wiki](https://bitbucket.org/exploratorium/electron-vue-template/wiki/Home)

The template also includes examples of how to integrate the following optional elements:

- Admin. Demonstrates how to integrate and customize an admin UI for the electron app.
- Arduino. Demonstrates how to integrate sending and receiving messages to an Arduino connected via USB.
- p5. Demonstrates how to intergrate and communicate with a p5 sketch.

## Exploratorium template packages
There are some elements of the template that are externalized into modular packages. At present, these packages include:

- @explo/admin - https://bitbucket.org/exploratorium/evt-admin
- @explo/arduino - https://bitbucket.org/exploratorium/evt-arduino

Refer to the readme documents in those repositories for additional details. 

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
Feature requests and other issues are tracked on Bitbucket: https://bitbucket.org/exploratorium/electron-vue-template/issues