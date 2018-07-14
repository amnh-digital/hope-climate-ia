'use strict';

const electron = require('electron');
const { app, BrowserWindow, globalShortcut } = electron;
const express = require('express');
const config = require('./config.json');
const browserWindowSettings = config.windows || [{ fullscreen: true }];
const robot = require("robotjs");

if ( config.commandLineSwitches){
  Object.keys( config.commandLineSwitches ).forEach(function(s){
    app.commandLine.appendSwitch(s, config.commandLineSwitches[s]);
  });
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows=[];

function init(){
  startClient();
  // ... or, if you need a server to start first, comment line above and uncomment line below
  // startServer().then(startClient);
}

function startServer() {
  return new Promise(function(resolve,reject){
    // Launch a server
    resolve();
  });
}

function startClient(){
  if (config.launchDelay){
    // workaround ala https://github.com/atom/electron/issues/1054#issuecomment-173368614
    setTimeout(function(){
      for (var i=0; i<browserWindowSettings.length; i++) {
        createWindow(browserWindowSettings[i], i);
      }
    }, config.launchDelay);
  }else{
    for (var i=0; i<browserWindowSettings.length; i++) {
      createWindow(browserWindowSettings[i], i);
    }
  }
}

function createWindow (browserWindowSetting, index) {
  var appUrl = browserWindowSetting.url || 'file://' + __dirname + '/index.html';
  if (!/:\/\//.test(appUrl)){
    appUrl = 'file://' + __dirname + '/' + appUrl;
  }
  var isDebug = browserWindowSetting.debug;
  var isPrimary = (index===0);
  var isPageLoaded = false;

  // workaround ala https://github.com/atom/electron/issues/1054#issuecomment-173368614
  var kiosk = browserWindowSetting.kiosk;
  if (browserWindowSetting.kioskDelay && kiosk) {
    browserWindowSetting.kiosk = false;
  }

  var mainWindow = new BrowserWindow( browserWindowSetting.browserWindow );
  mainWindow.on('unresponsive',     function(e){ reload(mainWindow, appUrl, 'window unresponsive',e); });

  var webContents = mainWindow.webContents;

  if (isPrimary) {
    mainWindow.on('blur', function(e){
      if (isDebug) {
        // mainWindow.webContents.send('debug', 'event: blur');
        robot.keyTap("b");
      }
      if (isPageLoaded) {
        setTimeout(function(){
          // mainWindow.focusOnWebView();
          focusWindow(mainWindow.webContents);
        }, 1000);
      }
    });

    mainWindow.on('focus', function(e){
      if (isDebug) {
        // mainWindow.webContents.send('debug', 'event: focus');
        robot.keyTap("f");
      }
      if (isPageLoaded) {
        setTimeout(function(){
          // mainWindow.focusOnWebView();
          focusWindow(mainWindow.webContents);
        }, 1000);
      }
    });
  }

  webContents.on('did-finish-load', function (e) {
    // Open the DevTools.
    if (isDebug) {
      webContents.openDevTools();
      // webContents.send('debug', 'event: did-finish-load');
    }
    if (isPrimary) {
      focusWindow(webContents);
    }
    isPageLoaded = true;
  });

  globalShortcut.register('CommandOrControl+Shift+D', () => {
    console.log('Debug pressed');
    isDebug = !isDebug;
    if (isDebug){
      webContents.openDevTools();
    }else{
      webContents.closeDevTools();
    }
  });

  webContents.on('did-fail-load',   function(e){ reload(mainWindow, appUrl, 'contents did-fail-load',e); });
  webContents.on('crashed',         function(e){ reload(mainWindow, appUrl, 'contents crashed',e); });
  webContents.on('plugin-crashed',  function(e){ reload(mainWindow, appUrl, 'contents plugin-crashed',e); });

  // and load the index.html of the app.
  webContents.session.clearCache(function(){
    mainWindow.loadURL( appUrl, { extraHeaders: 'pragma: no-cache\n' } );
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // workaround ala https://github.com/atom/electron/issues/1054#issuecomment-173368614
  if (browserWindowSetting.kioskDelay && kiosk){
    setTimeout(function(){
      mainWindow.setKiosk(true);
    }, browserWindowSetting.kioskDelay);
  }

  if (browserWindowSetting.bounds){ resize( mainWindow, browserWindowSetting.bounds, browserWindowSetting.resizeTimeout ); }

  windows.push(mainWindow);

}

var focusInterval = false;

// User RobotJS to move mouse and click the top left screen
function focusWindow(contents){
  var delay = 5000;
  var clickDelay = 100;
  // click low enough so we don't evoke menubar
  var x = 100;
  var y = 100;

  // do it a few times just in case
  var times = 3;
  var count = 0;

  if (focusInterval) clearInterval(focusInterval);

  var focusInterval = setInterval(function(){
    // contents.focus();
    // if (!contents.isFocused()) contents.focus();

    robot.moveMouse(x, y);

    setTimeout(function(){
      robot.mouseClick();
    }, clickDelay);

    count++;
    if (count >= times) clearInterval(focusInterval);

  }, delay);

};

function reload(mainWindow, appUrl, eventName, eventObject) {
  setTimeout( function(){
    if (mainWindow) {
      mainWindow.loadURL( appUrl, { extraHeaders: 'pragma: no-cache\n' } );
    }
  }, config.reloadTimeout || 3000 );
}

function resize(mainWindow,bounds,resizeTimeout){
  mainWindow.setBounds(bounds);
  setInterval( function(){
    mainWindow.setBounds(bounds);
  }, resizeTimeout || 3000 );
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit();
});
