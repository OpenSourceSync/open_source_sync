const path = require('path')
const url = require('url')
const os = require('os')
const net = require('net')
const fs = require('fs')
var swal = require('sweetalert2')

var store = null;

var PORTMOUSE= 12345
var PORTOTHER= 12346
var PORTFILE = 12347
var delimeter = "~~~";
var bonjour = require('bonjour')()
const {clipboard} = require('electron');
const filesizeconverter = require('filesize')
const file_module = require('./file_module.js')
var robot = require("robotjs")
var md5 = require("md5")
var connectedPCsMouse = []
var connectedPCsOthers = []
var connectedPCsList

var listOfActiveOSSHosts = []

var serverMouse
var serverOthers
var serverFile

var clientMouse
var clientOthers
var clientFile
var isConnectionAuthenticated = false

var keysList = []

var specialKeysLinux = {
    "65288": "backspace",
    "65535": "delete",
    "65535": "delete",
    "65293": "enter",
    "65289": "tab",
    "65307": "escape",
    "65362": "up",
    "65364": "down",
    "65363": "right",
    "65361": "left",
    "65360": "home",
    "65360": "home",
    "65367": "end",
    "65367": "end",
    "65365": "pageup",
    "65365": "pageup",
    "65366": "pagedown",
    "65366": "pagedown",
    "65470": "f1",
    "65471": "f2",
    "65472": "f3",
    "65473": "f4",
    "65474": "f5",
    "65475": "f6",
    "65476": "f7",
    "65477": "f8",
    "65478": "f9",
    "65479": "f10",
    "65480": "f11",
    "65481": "f12",
    "-1": "command",
    "65513": "alt",
    "65514": "alt",
    "65507": "control",
    "65508": "control",
    "65505": "shift",
    "65506": "right_shift",
    "32": "space",
    "65377": "printscreen",
    "65379": "insert",
    "65379": "insert",
    "777": ['c', ['control']],
    "778": ['v', ['control']]
    // skipped numpad, volume (up,down), brigtness
}

var specialKeys = {
    "8": "backspace",
    "46": "delete",
    "110": "delete",
    "13": "enter",
    "9": "tab",
    "27": "escape",
    "38": "up",
    "40": "down",
    "39": "right",
    "37": "left",
    "36": "home",
    "103": "home",
    "35": "end",
    "97": "end",
    "33": "pageup",
    "105": "pageup",
    "34": "pagedown",
    "99": "pagedown",
    "112": "f1",
    "113": "f2",
    "114": "f3",
    "115": "f4",
    "116": "f5",
    "117": "f6",
    "118": "f7",
    "119": "f8",
    "120": "f9",
    "121": "f10",
    "122": "f11",
    "123": "f12",
    "-1": "command",
    "164": "alt",
    "165": "alt",
    "162": "control",
    "163": "control",
    "160": "shift",
    "161": "right_shift",
    "32": "space",
    "44": "printscreen",
    "45": "insert",
    "96": "insert",
    "777": ['c', ['control']],
    "778": ['v', ['control']]
    // skipped numpad, volume (up,down), brigtness
}

function handleEvent(data)
{
    // var obj1 = data.toString().split('}')[0] + '}';
    var jsonObj

    try {
        //jsonObj = JSON.parse(obj1);
        jsonObj = JSON.parse(data);
    }
    catch (err) {
        //console.log('Invalid Others JSON Detected: ' + data);
        return
    }

    var event = jsonObj.EventName;

    if (event == "ClipboardEvent") {
        // clipboard event
        var text = jsonObj.text;
        console.log("Clipboard copy event recieved from other system")
        clipboard.writeText(text);
        //clipboard.writeText(data.toString())
    }
    else if (event == "KeyboardKeyPressEvent") {
        var keycode = jsonObj.keycode;
        var rawcode = jsonObj.rawcode;
        //console.log(String.fromCharCode(rawcode) + " pressed");
        var char = String.fromCharCode(rawcode)

        if(jsonObj.platform == "linux") {
            keysList = specialKeysLinux
        }
        else {
            keysList = specialKeys
        }

        if (keysList[rawcode.toString()] != undefined) {
            //robot.keyTap(keysList[rawcode.toString()]);
            console.log(rawcode.toString())
            if(typeof keysList[rawcode.toString()] === 'object')
            {
                robot.keyTap(keysList[rawcode.toString()][0], keysList[rawcode.toString()][1]);
            }
            else
            {
                robot.keyTap(keysList[rawcode.toString()]);
            }
        }
        else {
            try {
                robot.keyTap(char);
            }
            catch (err) {
                //console.log('Special Key Detected: ' + char);
                return
            }

        }
    }
    // ------------------- Hassan --------------


    // else if (event == "MouseClickEvent") {
    //     var button = jsonObj.button;
    //     var clicks = jsonObj.clicks;
    //     //console.log(button + " clicked");
    //     robot.mouseClick(button == 1 ? "left" : "right");
    // }
    else if (event == "MouseDownEvent") {
        var button = jsonObj.button;
        var clicks = jsonObj.clicks;
        robot.mouseToggle("down", button == 1 ? "left" : "right");
        console.log("Mouse toggled down")
    }
    else if (event == "MouseUpEvent") {
        var button = jsonObj.button;
        var clicks = jsonObj.clicks;
        robot.mouseToggle("up",button == 1 ? "left" : "right");
        console.log("Mouse toggled up")
    } 
    else if (event == "MouseDragEvent") { // this if isnt used 
        robot.mouseToggle("up");
        console.log("Mouse toggled up")
    }
// ----------------- Hassan ------------
    else if (event == "FileAvailableEvent") {
        console.log('Recieved file available event')
        var fileID = jsonObj.fileID;
        var filename = jsonObj.filename;
        var fileSize = filesizeconverter(jsonObj.fileSize);
        console.log("Running")
        var senderSystem = jsonObj.senderSystem;
        this.app.uiFilesAvailableList.push(
            {'filename': filename, 'senderSystem': senderSystem, 'fileSize': fileSize, 'fileID': fileID})//[filename, senderSystem, fileID, fileSize]
    }
    else if (event == "StartSendingFileEvent") {
        console.log('Recieved StartSendingFileEvent')
        var fileID = jsonObj.fileID;
        var recieverSystem = jsonObj.recieverSystem;
        //start sending file
        //file_module.startSendingFile(fileID, recieverSystem)
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
                    'EventName': 'FileContent', 
                    'senderID' : require('./connection_module.js').getMyIP()
                  }
                  require('./connection_module.js').sendFileEventToSpecifiedSystem(fileData, recieverSystem)
                } else {
                  console.log(err);
                }
              });
            }
        });
    }
    else if (event == "FileContent") {
        // recieve file
        // check the id and save file if id matches with recList ID
        var shouldRemove;
        var FD;
        app.filesBeingAcceptedList.forEach(function(element) {
            if(element.fileID == jsonObj.fileID) {

                app.uiFilesAvailableList.forEach(function(availableFile) {
                    if(element.fileID == availableFile.fileID 
                        && jsonObj.senderID==availableFile.senderSystem) {

                        var path = element.path.toString()
                        fs.open(path, 'w', function(err, fd) {
                            FD = fd;
                            console.log('pathawiodhioawdaiowhdiawhda: ', path)
                            console.log('Fd small: ', fd);
                            console.log('FD large: ', FD);
                            writeToFile(fd, jsonObj.fileContent.toString());
                        });
                        var senderSystem = availableFile.senderSystem;// this variable is not
                            // being used here because we are assuming that only central system will send file
                        var event = {
                            'fileID': element.fileID,
                            'EventName': 'ConfirmFileRecieved'
                        }
                        clientOthers.write(JSON.stringify(event) + delimeter);
                        shouldRemove = element;
                        shouldRemoveAvailableFile = availableFile
                    }
                });
            }
        });
        if(shouldRemove) {
            var index = app.filesBeingAcceptedList.indexOf(shouldRemove);
            if (index > -1) {
                app.filesBeingOfferedList.splice(index, 1);
            }
            var indexAvailableFile = app.uiFilesAvailableList.indexOf(shouldRemoveAvailableFile);
            if (indexAvailableFile > -1) {
                app.uiFilesAvailableList.splice(indexAvailableFile, 1);
            }
        }
        else {
            console.log("NO element to remove from filesBeingOfferedList");
        }
    }
    else if (event == "ConfirmFileRecieved") {
        console.log('Recieved FileRecievedConfirmation')
        var fileID = jsonObj.fileID;
        var shouldRemove = 0
        for(var i=0; i<app.filesBeingOfferedList.length; i++)
        {
            if(app.filesBeingOfferedList[i].fileID==fileID)
            {
                shouldRemove = i
            }
        }
        var index = app.filesBeingOfferedList.indexOf(shouldRemove);
        if (index > -1) {
            app.filesBeingOfferedList.splice(index, 1);
        }
    }
    else if(event == "ProvidePasscode") {
        // check for already stored passcode against event.MyName
        // if found connection_module.
        console.log("recieved ProvidePasscode")
        console.log("myname : ", jsonObj.MyName)
        var alreadyStoredPasscode = store.get(jsonObj.MyName)
        console.log("alreadyStoredPasscode : ", alreadyStoredPasscode)
        if(alreadyStoredPasscode==undefined)
        {
            require('./connection_module').loginDialog(jsonObj.MyName)
        }
        else
        {
            require('./connection_module').authenticatePasscodeForSpecifiedSystem(alreadyStoredPasscode, jsonObj.MyName)
        }
    }
    else if(event == "AuthenticatePasscode") {
        // match password with already stored password and return authenticated/unauthenticated message
        console.log("recieved AuthenticatePasscode")
        if(jsonObj.code==md5(store.get("CurrentSystemPassword").toString()))
        {
            isConnectionAuthenticated=true
            require('./connection_module').sendAuthenticationRequestReplyToSpecifiedSystem(clientOthers, true)
        }
        else
        {
            isConnectionAuthenticated=false
            require('./connection_module').sendAuthenticationRequestReplyToSpecifiedSystem(clientOthers, false)
        }
    }
    else if(event == "AuthenticationRequestReply") {
        console.log("recieved AuthenticationRequestReply")
        const toast = swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        
        if (jsonObj.status === true)
        {
            for(var i=0; i<app.connectedList.length; i++)
            {
                if(app.connectedList[i].name==jsonObj.MyName)
                {
                    console.log("NAME OF SYSTEM: ", app.connectedList[i].name);
                    app.connectedList[i].isConnectionAuthenticated = true;
                }
            }
            toast({
                type: 'success',
                title: 'Signed in successfully'
            });
        }
        else
        {
            toast({
                type: 'error',
                title: 'Signed in failed'
            });
            setTimeout(function() {
                require('./connection_module').loginDialog(jsonObj.MyName)
            }, 1000)
        }
    }
}
function writeToFile(FD, fileContent)
{
    fs.write(FD, fileContent, "utf8", fileContent.length, function(err) {
        if(err) {
            console.log('Error at Writing File: ', err);
        }
    });
    // fs.write(FD, jsonObj.fileContent.toString(), 0, jsonObj.fileContent.toString().length, function(err) {
    //     if(err) {
    //         console.log('Error at Writing File: ', err);
    //     }
    // });
}
module.exports = {
  foo: function () {
    console.log('TEST OUT')
  },
  loginDialog: function(targetSystemName) {
    swal({
      title: ('Enter Password for system '+targetSystemName),
      input: 'password',
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: true,
      confirmButtonText: 'Login'
    }).then(function(result){
        if(result.value)
        {
            require('./connection_module.js').authenticatePasscodeForSpecifiedSystem(result.value, targetSystemName)
        }
        else if(result.dismiss === swal.DismissReason.cancel)
        {
            require('./connection_module.js').sendConnectionCloseReqToSpecifiedSystem(targetSystemName)
        }
    })
  },
  showPasswordDialog: function () // NEW CHANGE
  {
    // UPDATE THE TEXT FIELD FROM STORE
    swal({
      title: 'Password',
      text: store.get("CurrentSystemPassword") == undefined ? "Not set yet": store.get("CurrentSystemPassword"),
    })
  },
  resetConnections: function() {
    swal('test function', 'resetConnections fn inside connection module')
  },
  findActiveOSSDevicesOnLocalNetwork:function () {

    bonjour.unpublishAll(function(){
        console.log("Unpublishing all services");
    });
    console.log('BONJOUR STOPPED');
    delete serverMouse;
    console.log('CONN serverMouse STOPPED');
    delete serverOthers;
    console.log('CONN serverOthers STOPPED');
    delete serverFile;
    console.log('CONN serverFile STOPPED');
    // When user clicks on 'Add a PC' on the main machine it searches for all hosts having type 'OSSActiveHost'
    // at port 5867 it adds it to the listOfActiveOSSHosts

    //app.selectList = [];

    listOfActiveOSSHosts = []
    // When user clicks on 'Add a PC' on the main machine it searches for all hosts having type 'OSSActiveHost'
    // at port 5867 it adds it to the listOfActiveOSSHosts
    var flag = true
    bonjour.find({ type: 'OSSActiveHost' }, function (service) {
        //console.log('Found an active OSS host on :', service.addresses[0]);
        if(service.host != os.hostname()) {
            listOfActiveOSSHosts.push({name: service.host, ip:service.referer.address});
            app.selectList.push({name: service.host, ip:service.referer.address})
            if(flag)
            {
                console.log("Trying to connect")
            }
        }
        else {
            app.connectionState = 'Active';
            console.log("You are running an OSSActiveHost service yourself");
        }
        //console.log(app.selectList);
        console.log(listOfActiveOSSHosts)
    })

    },
    resetConnections: function() {
        swal('test function', 'resetConnections fn inside connection module')
    },
    connectToAnOSSClient: function (ipAddress, hostname) {
        var client1 = new net.Socket();
        var client2 = new net.Socket();
        var client3 = new net.Socket(); //Files
        console.log("connectiong to : ", ipAddress)
        client1.connect(PORTMOUSE , ipAddress, function() {
            console.log("Connected to mouse port: ", ipAddress)
            // connectedPCsMouse.push({sockObj: client1, name: hostname,ip:ipAddress});
            // app.connectedList.push({name: hostname,ip:ipAddress, isActive:false})
        });
        client2.connect(PORTOTHER , ipAddress, function() {
            console.log("Connected to others port: ", ipAddress)
            // connectedPCsOthers.push({sockObj: client2, name: hostname,ip:ipAddress});
            //app.connectedList.push({name: hostname,ip:ipAddress, isActive:false, isCentral:false, mouseSockObj:client1, otherSockObj:client2})
            //app.connectedList.push({name: hostname,ip: ipAddress});
            //client.write('Hello serverMouse!');

        });
        client3.connect(PORTFILE , ipAddress, function() {
            console.log("Connected to file port: ", ipAddress)
            // connectedPCsOthers.push({sockObj: client2, name: hostname,ip:ipAddress});
            app.connectedList.push({name: hostname,ip:ipAddress, isActive:false, isCentral:false, mouseSockObj:client1, otherSockObj:client2, fileSockObj: client3, isConnectionAuthenticated: false})
            //app.connectedList.push({name: hostname,ip: ipAddress});
            //client.write('Hello serverMouse!');

        });
        // Add a 'data' event handler for the client socket
        // data is what the serverMouse sent to this socket
        client1.on('data', function(data) {
            console.log('Client1 data');
        });
        var completeData = ""
        client2.on('data', function(data) {
            console.log('Client2 data');
            data = data.toString()
            if(data.indexOf(delimeter)==-1)
            {
                completeData+=data
            }
            else
            {
                var chunks = data.split(delimeter);
                completeData+=chunks[0]
                handleEvent(completeData)
                var i=1
                for(; i<chunks.length-1; i++)
                {
                    completeData=chunks[i]
                    // send complete data to handler Function
                    handleEvent(completeData)
                }
                completeData=chunks[i]
            }
        });
        client3.on('data', function(data) {
            console.log('Client3 data');
        });
        // Add a 'close' event handler for the client socket
        client1.on('close', function() {
            console.log('Client1 Connection closed');
        });
        client2.on('close', function() {
            console.log('Client2 Connection closed');
        });
        client3.on('close', function() {
            console.log('Client3 Connection closed');
        });

        client1.on('error', function(err) {
            console.log("Error at Client1: ", err);
        });
        client2.on('error', function(err) {
            console.log("Error at Client2: ", err);
        });
        client3.on('error', function(err) {
            console.log("Error at Client3: ", err);
        });
    },
    getMyIP:function()
    {
        var address, ifaces = require('os').networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
        }
        return address;
    },
    initialize: function (storeObject)
    {
        store = storeObject;

        // ---------------------------- ELECTRON-STORE ------------------------
        // var object = {
        //     name: "system name",
        //     password: "1234"
        // }

        // store.set(object.name, object.password);
        // console.log("Password: ", store.get(object.name));
        // store.delete(object.name);
        // -----------------------------------------------------------
        
        var IP = this.getMyIP()
        console.log('HOST NAME : ' + os.hostname());
        //------------------------------------------------

        // When application starts we start a serverMouse on port 5867 that shows its type is 'OSSActiveHost'
        // Somebody else(from another host) asks this machine at port 5867 about its type and it returns 'OSSActiveHost'
        bonjour.publish({ name: os.hostname(), type: 'OSSActiveHost', host: os.hostname(), port: 5867 })
        console.log('BONJOUR STARTED');
        //----------------------------------------Zubair
        serverMouse = net.createServer(function(sock){
            console.log(sock.remoteAddress,' client connected to mouse server')
            clientMouse = sock
            console.log("Clientmouse changed to : ", (clientMouse!=null))
            sock.on('connect', function(){
                console.log("Connected to client on its request");
            });
            sock.on('data', function(data){
                var obj1= data.toString().split('}')[0]+'}';
                var jsonObj;

                try
                {
                    jsonObj = JSON.parse(obj1);
                }
                catch(err)
                {
                    //console.log('Invalid Mouse JSON Detected: ' + obj1);
                    return
                }
                var event= jsonObj.EventName;

                var x = jsonObj.x;
                var y = jsonObj.y;
                if(isConnectionAuthenticated)
                {
                    if(event == "MouseMoveEvent")
                        robot.moveMouse(x, y);
                    else 
                        robot.dragMouse(x, y)
                } 
                else
                {
                    console.log("Recieved mouse move event but connection is not authenticated")
                }
            });
            sock.on('close', function(){
                console.log("Connection closed!");
            });
            sock.on('error', function(err) {
                console.log("Error at SockMouse: , ", err);
            });
        }).listen(PORTMOUSE , IP);
        console.log('Mouse connection serverMouse STARTED');
        //---------------------------------------
        serverOthers = net.createServer(function(sock){
            var completeData = ""
            var isClientOtherNull = false
            console.log(sock.remoteAddress,' client connected to others server')
            console.log("clientOthers : ", clientOthers)
            if(clientOthers == null) {
                isClientOtherNull = true;
            }
            clientOthers = sock
            if(isClientOtherNull) {
                require('./connection_module.js').askSpecifiedSystemForPasscode(clientOthers)
            }
            console.log("Clientothers changed to : ", (clientOthers!=null))
            sock.on('connect', function(){
                console.log("Connected to client on its request");
            });
            sock.on('data', function(data){
                data = data.toString()
                if(data.indexOf(delimeter)==-1)
                {
                    completeData+=data
                }
                else
                {
                    var chunks = data.split(delimeter);
                    //console.log("CHUNKS START")
                    //console.log(chunks.length)
                    completeData+=chunks[0]
                    // send complete data to handler Function
                    var jsonObj = JSON.parse(completeData);
                    if(jsonObj.EventName == "ProvidePasscode" || jsonObj.EventName == "AuthenticatePasscode" || jsonObj.EventName == "AuthenticationRequestReply") {
                        handleEvent(completeData)
                    }
                    else {
                        if(isConnectionAuthenticated) {
                            handleEvent(completeData)
                        }
                    }
                    var i=1
                    for(; i<chunks.length-1; i++)
                    {
                        completeData=chunks[i]
                        jsonObj = JSON.parse(completeData);
                        // send complete data to handler Function
                        if(jsonObj.EventName == "ProvidePasscode" || jsonObj.EventName == "AuthenticatePasscode" || jsonObj.EventName == "AuthenticationRequestReply") {
                            handleEvent(completeData)
                        }
                        else {
                            if(isConnectionAuthenticated) {
                                handleEvent(completeData)
                            }
                        }
                    }
                    completeData=chunks[i]
                }
                //console.log("In data function: completeDate : ", completeData)
                //completeData+=data.toString()
            });
            sock.on('close', function(){
                clientOthers=null
                clientMouse = null
                clientFile = null
                console.log("Connection closed!");
            });
            sock.on('error', function(err) {
                console.log("Error at SockOthers: ", err);
            });
        }).listen(PORTOTHER , IP);
        console.log('Others connection serverOthers STARTED');

        //-----------------------------------------------------------------------------
        serverFile = net.createServer(function(sock){
            var completeData = ""
            console.log(sock.remoteAddress,' client connected to file server')
            clientFile = sock
            console.log("ClientFile changed to : ", (clientFile!=null))
            sock.on('connect', function(){
                console.log("Connected to client on its request");
            });
            sock.on('data', function(data){
                data = data.toString()
                if(data.indexOf(delimeter)==-1)
                {
                    completeData+=data
                }
                else
                {
                    var chunks = data.split(delimeter);
                    //console.log("CHUNKS START")
                    //console.log(chunks.length)
                    completeData+=chunks[0]
                    // send complete data to handler Function
                    if(isConnectionAuthenticated)
                    {
                        handleEvent(completeData)
                    }
                    else
                    {
                        console.log("Recieved OthersEvent but connection is not authenticated")
                    }
                    var i=1
                    for(; i<chunks.length-1; i++)
                    {
                        completeData=chunks[i]
                        // send complete data to handler Function
                        handleEvent(completeData)
                    }
                    completeData=chunks[i]
                }
                //console.log("In data function: completeDate : ", completeData)
                //completeData+=data.toString()
            });
            sock.on('close', function(){
                console.log("Connection closed!");
            });
            sock.on('error', function(err) {
                console.log("Error at SockFile: ", err);
            });
        }).listen(PORTFILE , IP);
        console.log('File connection serverFile STARTED');
        //----------------------------------------------------------------------------------------
    },
    sendMouseMovementEventToAllConnected:function(event){
        //console.log("Sending mouse movement event to ", connectedPCsMouse.length, " systems")
        for(var i=0; i<app.connectedList.length; i++)
        {
            var obj = {
                "EventName": "MouseMoveEvent",
                "x": event.x.toString(),
                "y": event.y.toString()
            }
            //connectedPCsMouse[i].sockObj.write(JSON.stringify(obj));
            //console.log(app.connectedList)
            if(app.connectedList[i].isCentral==false)
            {
                app.connectedList[i].mouseSockObj.write(JSON.stringify(obj));
            }
        }
    },
    sendClipBoardSyncEventToAllConnected:function(latestClipBoardContent){
        //console.log("Sending clipboard synchronize event to ", connectedPCsOthers.length, " systems")
        if(clientOthers!=null)
        {
            console.log("Client others not null. Should send clipboard event back to client")
            var obj = {
                    "EventName": "ClipboardEvent",
                    "text": latestClipBoardContent
                }
            clientOthers.write(JSON.stringify(obj) + delimeter);
        }
        else
        {
            for(var i=0; i<app.connectedList.length; i++)
            {
                var obj = {
                    "EventName": "ClipboardEvent",
                    "text": latestClipBoardContent
                }
                if(app.connectedList[i].isCentral==false)
                {
                    app.connectedList[i].otherSockObj.write(JSON.stringify(obj) + delimeter);
                }
            }
        }
    },
    sendMouseMovementEventToCurrentlyActiveSystem:function(event){
        for(var i=0; i<app.connectedList.length; i++)
        {
            //console.log("testing : ",app.connectedList.length,app.connectedList[i].isActive, app.connectedList[i].isCentral)

            if(app.connectedList[i].isActive && !app.connectedList[i].isCentral && app.connectedList[i].isConnectionAuthenticated)
            {
                // Hassan --------- Added an Drag mouse event in the if condition
                if (event.EventName == "MouseMoveEvent" || event.EventName == "MouseDragEvent")  {
                    app.connectedList[i].mouseSockObj.write(JSON.stringify(event));
                }
                else {
                    app.connectedList[i].otherSockObj.write(JSON.stringify(event) + delimeter);
                }
            }
        }
    },
    sendKeyboardEventToCurrentlyActiveSystem:function(event){
        event["platform"] = os.platform()
        for(var i=0; i<app.connectedList.length; i++)
        {
            // console.log("testing : ",app.connectedList.length,app.connectedList[i].isActive, app.connectedList[i].isCentral)
            if(app.connectedList[i].isActive && !app.connectedList[i].isCentral)
            {
                app.connectedList[i].otherSockObj.write(JSON.stringify(event) + delimeter);
            }
        }
    },
    sendFileEventToAllConnectedSystems:function(event){
        for(var i=0; i<app.connectedList.length; i++)
        {
            if(app.connectedList[i].isCentral==false)
            {
                app.connectedList[i].otherSockObj.write(JSON.stringify(event) + delimeter);
            }
        }
    },
    sendFileEventToSpecifiedSystem:function(event, specifiedSystem){
        console.log("sending file event to all systems")
        var systemFound = false
        for(var i=0; i<app.connectedList.length; i++)
        {
            if(app.connectedList[i].ip==specifiedSystem)
            {
                app.connectedList[i].otherSockObj.write(JSON.stringify(event) + delimeter);
                console.log("sending to system : ", app.connectedList[i].name)
                systemFound=true
            }
        }
        if(!systemFound)
        {
            if(clientOthers!=null) // assuming the client is the specified system
            {
                clientOthers.write(JSON.stringify(event) + delimeter);
                console.log("sending to client system")
            }
            else
            {
                console.log("Recieved sendFileEventToSpecifiedSystem but not such system available");
            }
        }
    },
    askSpecifiedSystemForPasscode:function(sockObj)
    {
        var message = {
            EventName: "ProvidePasscode",
            MyName: os.hostname()
        }
        console.log("sending askSpecifiedSystemForPasscode : ", message)
        sockObj.write(JSON.stringify(message) + delimeter);
    },
    authenticatePasscodeForSpecifiedSystem:function(passcode, systemName){
        var message = {
            EventName: "AuthenticatePasscode",
            code: md5(passcode)
        }
        for(var i=0; i<app.connectedList.length; i++)
        {
            if(app.connectedList[i].name==systemName)
            {
                console.log("sending authenticatePasscodeForSpecifiedSystem")
                app.connectedList[i].otherSockObj.write(JSON.stringify(message) + delimeter);
                console.log("sending to system : ", app.connectedList[i].name)
            }
        }
    },
    sendAuthenticationRequestReplyToSpecifiedSystem:function(systemSockObj, authStatus){
        var message = {
            EventName: "AuthenticationRequestReply",
            MyName: os.hostname(),
            status: authStatus
        }
        console.log("sending sendAuthenticationRequestReplyToSpecifiedSystem")
        systemSockObj.write(JSON.stringify(message) + delimeter);
    },
    sendConnectionCloseReqToSpecifiedSystem(systemName)
    {
        var indexToDelete;
        for(var i=0; i<app.connectedList.length; i++)
        {
            if(app.connectedList[i].name==systemName)
            {
                console.log("sending CloseServerConnection")
                app.connectedList[i].otherSockObj.destroy()
                app.connectedList[i].mouseSockObj.destroy()
                app.connectedList[i].fileSockObj.destroy()
                indexToDelete = i;
            }
        }
        app.connectedList.splice(indexToDelete, 1);
    }
};
