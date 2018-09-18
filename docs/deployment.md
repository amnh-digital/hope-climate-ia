# Deployment of HoPE interactive applications

The interactive applications are deployed as [Electron apps](https://electronjs.org/) on Mac Minis. Electron essentially wraps web applications in native apps using Node and Chromium, a bare-bones version of a Chrome browser.

## Basic Electron app deployment

Currently there is support for deploying one or two interactive screens per computer, using dual screen output for the computers with two interactive screens. Here is an example process for deploying one of the interactive screens ([./consequences-change/](../consequences-change/)) on to a Mac computer as an Electron app called `hope-mac-mac-1.app`:

1. Install [Node.js](https://nodejs.org/en/)
1. Install the [Electron packager](https://github.com/electron-userland/electron-packager):

  ```
  npm install electron-packager -g
  ```

1. Clone and install this repository:

   ```
   git clone https://github.com/amnh-digital/hope-climate-ia.git`
   cd hope-climate-ia
   npm install
   ```

1. For this example app, the Electron configuration can be found in [./electron/hope-mac-1/config.json](../electron/hope-mac-1/config.json). Here, you indicate the app's url, launch delay, etc. More options can be found on [Electron's API documentation](https://github.com/electron/electron/blob/master/docs/api/browser-window.md).

1. Run a script that wraps [./consequences-change/](../consequences-change/) (and other relevant files) into an Electron app called `hope-mac-1.app`

   ```
   sudo npm run build:mac1
   ```

   Accept any prompts for overwriting files. This particular command can be found in [./package.json](../package.json) which runs a script [./electron/build-hope-mac-1.sh](../electron/build-hope-mac-1.sh). This script copies the appropriate files for this interactive and installs its dependencies.

1. You should now see an app generated in `./build/mac/hope-mac-1-darwin-x64/hope-mac-1.app`.  You can simply double click this file to view the interactive. You can _Command+Q_ to quit the app and _Command+Shift+D_ to open developer tools.

1. You can copy and paste `hope-mac-1.app` into the `Applications` folder of any mac computer.

## Deploying on other operating systems

There currently is only support for deploying on OSX, however, deploying to Windows or Linux wouldn't be too difficult since Electron is cross platform compatible. The main thing that you'll need to update is the script that the build command runs. In the above example `npm run buid:mac1` runs the script `./electron/build-hope-mac-1.sh`. For other operating systems, you'll need to create a new script using OS-specfic commands. The script essentially copies files, runs node package install, and runs the electron packager command. For example:

Instead of:

```
electron-packager electron/hope-mac-1 hope-mac-1 --platform=darwin --arch=x64 --out=build/mac/ --overwrite
```

You'd run for Windows:

```
electron-packager electron/hope-win-1 hope-win-1 --platform=win32 --arch=x64 --out=build/win/ --overwrite
```
