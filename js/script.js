//const hook = require('iohook')
const path = require('path')
const Store = require('electron-store');
const store = new Store({
  name: "myFile"
});
var swal = require('sweetalert2')
/*const url = require('url')
const os = require('os')
const net = require('net')
var PORT = 12345;
var bonjour = require('bonjour')()

var connectedPCs = []
var listOfActiveOSSHosts = []*/
var connection_module = new require('./js/connection_module.js')
var mouse_module = require('./js/mouse_module.js')
var clipboard_module = require('./js/clipboard_module.js')
var Keyboard_module = require('./js/keyboard_module.js')
var file_module = require('./js/file_module.js')
// var file_module = require('electron').remote.getGlobal('fileModule');
connection_module.initialize(store)
const {
  dialog
} = require('electron').remote;
mouse_module.setInitVariables(connection_module)
clipboard_module.setInitVariables(connection_module)
<<<<<<< Updated upstream
Keyboard_module.setInitVariables(connection_module,store)
=======
Keyboard_module.setInitVariables(connection_module, store)
>>>>>>> Stashed changes
file_module.setInitVariables(connection_module)

var myPasscode = store.get("CurrentSystemPassword")
if (myPasscode == undefined) {
  setPasswordDialog()
}
////////// Initializing the connectedPC List
var os = require('os');
var IP = connection_module.getMyIP();
console.log('HOST NAME : ' + os.hostname());
var list = [{
  name: os.hostname(),
  ip: IP,
  isActive: true,
  isCentral: true,
  mouseSockObj: null,
  otherSockObj: null,
  fileSockObj: null
}]
//////////////////////////////////////////////
var draggable = require('vuedraggable');

Vue.component('draggable', draggable);

var app = new Vue({
  el: '#app',
  data: {
    selectingP: false, // Page Flags
    homeP: true,
    connectP: false,
    bindingsP: false,
    securityP: false,
    loading: false,
    downloadP: false,
    sslState: 'disabled',
    connectionState: 'Inactive',
    selectList: [],
    bindingList: [],
    connectedList: list,
    filesBeingOfferedList: [], //[fileID, path]
    filesBeingAcceptedList: [], //[fileID, path]
    uiFilesAvailableList: [] //[filename, senderSystem, fileID, fileSize]
  },
  methods: {
    homeClick: function() {
      this.homeP = true;
      this.connectP = false;
      this.selectingP = false;
      this.bindingsP = false;
      this.securityP = false;
      this.downloadP = false;
    },
    connectClick: function() {
      this.homeP = false;
      this.selectingP = false;
      this.connectP = true;
      this.bindingsP = false;
      this.securityP = false;
      this.downloadP = false;
    },
    bindingsClick: function() {
      this.selectingP = false;
      this.homeP = false;
      this.connectP = false;
      this.bindingsP = true;
      this.securityP = false;
      this.downloadP = false;
    },
    securityClick: function() {
      this.homeP = false;
      this.connectP = false;
      this.bindingsP = false;
      this.securityP = true;
      this.selectingP = false;
      this.downloadP = false;
    },
    downloadClick: function() {
      this.homeP = false;
      this.connectP = false;
      this.bindingsP = false;
      this.securityP = false;
      this.selectingP = false;
      this.downloadP = true;
    },
    toggleSSL: function() {
      if (this.sslState == 'disabled') {
        this.sslState = 'enabled';
      } else {
        this.sslState = 'disabled';
      }
    },
    saveFileButtonClicked: function(path, availableFileObject) {
      file_module.handleFileSaveEvent(path, availableFileObject)
    },
    searchDevices: function() {
      this.connectP = false;
      this.selectingP = true;
      console.log("running");
      connection_module.findActiveOSSDevicesOnLocalNetwork();
      mouse_module.startHandlingMouseEvents()
      Keyboard_module.startHandlingKeyboardEvents()
      file_module.startHandlingFileDropEvents()
    },
    addSelected: function(item) {
      console.log("Connected list before : ", this.connectedList)
      connection_module.connectToAnOSSClient(item.ip, item.name);
<<<<<<< Updated upstream
=======
      console.log("Connected list after : ", this.connectedList)
      /*this.connectedList.push({
          name: item.name,
          ip: item.ip
      });*/
>>>>>>> Stashed changes
    },
    connected: function(ip) {
      var flag = false;

      this.connectedList.forEach((data) => {
        if (ip === data.ip)
        {
          flag = true;
        }
      })

      return flag;
    },
    stopOSS: function() {
      clipboard_module.stopHandlingClipboardEvents()
      Keyboard_module.stopHandlingKeyboardEvents()
      mouse_module.stopHandlingMouseEvents()
      file_module.stopHandlingFileDropEvents()
      console.log("All hooks disabled")
      for(var i=0; i<this.connectedList.length; i++)
      {
        if(this.connectedList[i].isActive==true && this.connectedList[i].isCentral==false)
        {
          this.connectedList[i].isActive==true
        }
        if(this.connectedList[i].isCentral==true)
        {
          this.connectedList[i].isActive==true
        }
      }
      console.log("Connedted list state after pausing : ", this.connectedList)
    },
    resumeOSS:function(){
      clipboard_module.stopHandlingClipboardEvents()
      mouse_module.startHandlingMouseEvents()
      Keyboard_module.startHandlingKeyboardEvents()
      file_module.startHandlingFileDropEvents()
      console.log("Connedted list state after resuming : ", this.connectedList)
    },
    removeSelected: function(item) {
      // INSERT FUNCTION HERE WHICH REMOVES THE CONNECTED DEVICE FROM LIST AND DISCONNECT
    },
    connected: function(ip) {
      var flag = false;

      this.connectedList.forEach((data) => {
        if (ip === data.ip)
        {
          flag = true;
        }
      })

      return flag;
    },
    downloadSelected: function(item) {
      var dir = dialog.showSaveDialog({
        title: "Save Your Private Key",
        defaultPath: path.resolve('..', item.filename)
      });

      if (dir == null) {
        return;
      } else {
        this.saveFileButtonClicked(dir, item);
      }
    },
    showPassword: function() { // NEW CHANGE
      connection_module.showPasswordDialog();
    },
    setPassword: function() {
      setPasswordDialog();
    },
    updateKeys: function() {
      var previous = store.get('customKeys');
      store.set('customKeys', this.bindingList);

      Keyboard_module.setCustomKey(previous);
    },
    destroyConnections: function() {
      connection_module.resetConnections();
    }
  }
});
clipboard_module.startHandlingClipboardEvents() // handle clipboard event in either case(connected/unconnected)

function handleFileDropEventInRenderer(arg) {
  // console.log("Handling file drop event in renderer");
  file_module.handleFileDropEvent(arg);
}

function setPasswordDialog() {
  swal({
    title: 'Enter Passcode for this system',
    input: 'password',
    backdrop: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    confirmButtonText: 'Update'
  }).then((result) => {
    const toast = swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
    if (result.value != '') {
      store.set("CurrentSystemPassword", result.value)
      toast({
        type: 'success',
        title: 'Passcode saved successfully'
      })
    } else {
      toast({
        type: 'error',
        title: 'Passcode save failed'
      });
    }
  })
}
//console.log("File Path: ", app.getPath("userData"));

var customKeys = store.get('customKeys');
console.log(customKeys);
if (customKeys === undefined) {
  var def = [
    {
      action: 'Copy',
      binding: 'Ctrl + C',
      code: '777',
      roboCode: ['c', ['control']]
    },
    {
      action: 'Paste',
      binding: 'Ctrl + V',
      code: '778',
      roboCode: ['v', ['control']]
    }
  ];

  store.set('customKeys', def)
  app.bindingList = def;
} else {
  app.bindingList = customKeys;
}

console.log('SCRIPT JS ENDED')
