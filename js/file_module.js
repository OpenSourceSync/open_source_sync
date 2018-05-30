var randomstring = require('randomstring');
const fs = require("fs");
var connectionModule
var hook
var isDragActive = false
var isDragWinOpen = false
const url = require('url');
const path = require('path');  

function handleFileDropEventLocal(path) {
  console.log("Handling Filedrop event")
  if (!connectionModule) {
    throw ("handleFileDropEvent called but connectionModule is not initialized")
  } else {
    var fileID = randomstring.generate();
    var splittedPath = path.toString().split('/')
    var filename = splittedPath[splittedPath.length - 1]
    var stats = fs.statSync(path)
    var fileSize = stats.size
    var senderSystem = connectionModule.getMyIP()
    var message = {
      'fileID': fileID,
      'filename': filename,
      'fileSize': fileSize,
      'senderSystem': senderSystem,
      'EventName': 'FileAvailableEvent'
    }
    connectionModule.sendFileEventToAllConnectedSystems(message)
    app.filesBeingOfferedList.push({
      'fileID': fileID,
      'path': path
    })
  }
  //connectionModule.sendClipBoardSyncEventToAllConnected(latestClipboardContent)
}

function registerFileDropEvents() {
  if(hook) {
    delete hook
  }
  hook = new require('iohook')
  const { screen } = require('electron').remote;
  const { BrowserWindow } = require('electron').remote;
  
  let win;

  function openDragWin(xcoord, ycoord) {
    var x = xcoord;
    var y = ycoord;

    win = new BrowserWindow({
      width: 200,
      height: 200,
      frame: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      backgroundColor: '#2F688D',
      x: x,
      y: y
    })

    win.loadURL(url.format({
      pathname: path.join(__dirname, 'grab.html'),
      protocol: 'file:',
      slashes: true
    }))
  }

  function closeDragWin() {
    win.close();
  }
  
  hook.on('mousedrag', event => {
    // console.log('Drag: ', event);

    // const { screen } = require('electron');
    var allScreens = screen.getAllDisplays();
    var min_width = 0;
    var max_width = allScreens[0].size.width;
        
    if(event.x >= max_width - 250) {
      if(!isDragWinOpen) {
        isDragWinOpen = true;
        openDragWin(max_width - 250, 50);
      }
    }
    if(event.x < max_width - 250) {
      if(isDragWinOpen) {
        isDragWinOpen = false;
        closeDragWin();
      }
    }
  });
  
  hook.on('mouseup', event => {
    //console.log('MouseUp: ', event);

    if (isDragWinOpen) {
      isDragWinOpen = false;
      closeDragWin();
      //handleFileDropEvent('/media/ferhan/Education_material_and_setups/BS_education_material/Semester 8/FYP-II/Final Phase/OpenSourceSync/package.json')
    }
  });
  if (!connectionModule) {
    throw ("registerFileDropEvents called but connectionModule is not initialized")
  } else {
    // Register and start hook
    console.log("Attaching IOHook Drag")
    hook.start();
  }
}
module.exports = {
  setInitVariables: function(connectionModuleVal) {
    connectionModule = connectionModuleVal
  },
  startHandlingFileDropEvents: function() {
    registerFileDropEvents()
    console.log("Started handling fileddrop events")
  },
  stopHandlingFileDropEvents: function() {
    if(hook)
    {
        delete hook
    }
    //iohook.stop()
  },
  handleFileSaveEvent: function(path, availableFileObject) {
    app.filesBeingAcceptedList.push({
      'fileID': availableFileObject.fileID,
      'path': path
    })

    var fileID = availableFileObject.fileID
    var recieverSystem = connectionModule.getMyIP()
    var message = {
      'fileID': fileID,
      'recieverSystem': recieverSystem,
      'EventName': 'StartSendingFileEvent'
    }
    connectionModule.sendFileEventToSpecifiedSystem(message, availableFileObject.senderSystem)
  },
  startSendingFile: function(fileID, recieverSystem) {
    app.filesBeingOfferedList.forEach(function(element) {
      if (element.fileID == fileID) {
        var path = element.path;
        fs.readFile(path, {
          encoding: 'utf-8'
        }, function(err, data) {
          if (!err) {
            // console.log('received data: ' + data);
            var fileData = {
              'fileID': fileID,
              'fileContent': data.toString(),
              'EventName': 'FileContent'
            }
            connectionModule.sendFileEventToSpecifiedSystem(fileData, recieverSystem)
          } else {
            console.log(err);
          }
        });
      }
    });
  },
  handleFileDropEvent:function(path){
    handleFileDropEventLocal(path)
  },
  handleFileSent: function(fileID, recieverSystem) {
    var confirmationEvent = {
      'EventName': 'ConfirmFileRecieved',
      'fileID': fileID
    }
    connectionModule.sendFileEventToSpecifiedSystem(confirmationEvent, recieverSystem)
  }
}
