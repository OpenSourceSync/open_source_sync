const electron = require('electron')
var keypress = require('keypress');
//var conn = new require('./js/connection_module.js')
var $ = jQuery = require('./jquery.min.js')
const {globalShortcut} = require('electron')

//var robot = require("robotjs");
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

process.on('uncaughtException', (err) => {
  console.log(err);
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let splashWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#0A2435',
    show: false
  })
  
  splashWindow = new BrowserWindow({
    parent: mainWindow,
    width: 370,
    height: 450,
    frame: false,
    backgroundColor: '#313131'
  })

  splashWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'Splash.html'),
    protocol: 'file:',
    slashes: true
  }))

  splashWindow.show()

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'Homescreen.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
    setTimeout(function () { splashWindow.close() }, 1000);
    //conn.initialize()
  })

  // Emitted when the window is closed.
  mainWindow.webContents.on('did-finish-load', function() {
});
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', () => {
  if (process.env.NODE_ENV !== 'production') {
    require('vue-devtools').install()
    // const ret = globalShortcut.register('Super+X', () => {
    //   console.log('CommandOrControl+X is pressed')
    // })
    //onAddAPCButton()
  }
})

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    console.log("All windows closed")
    electron.app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

const { ipcMain } = require('electron')
ipcMain.on('fileDropped', (event, arg) => {
  console.log("File drop event recieved for file:  ", arg)
  //event.sender.send('handleFileDropped', arg);
  //BrowserWindow.fromId(mainWindow.id).webContents.send(arg);
  mainWindow.webContents.send('sendToRenderer', arg);
});