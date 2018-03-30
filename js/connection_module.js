const path = require('path')
const url = require('url')
const os = require('os')
const net = require('net')
var PORTMOUSE= 12345;
var PORTOTHER= 12346;
var delimeter = "~~~";
var bonjour = require('bonjour')()
const {clipboard} = require('electron');
var robot = require("robotjs")
var connectedPCsMouse = []
var connectedPCsOthers = []

var connectedPCsList

var listOfActiveOSSHosts = []
var serverMouse
var serverOthers

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
    "65379": "insert"
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
    else if (event == "MouseClickEvent") {
        var button = jsonObj.button;
        var clicks = jsonObj.clicks;
        //console.log(button + " clicked");
        robot.mouseClick(button == 1 ? "left" : "right");
    }
}
module.exports = {
  foo: function () {
    console.log('TEST OUT')
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
            console.log("You are running an OSSActiveHost service yourself");
        }
        //console.log(app.selectList);
        console.log(listOfActiveOSSHosts)
    })

    },
    connectToAnOSSClient: function (ipAddress, hostname) {
        var client1 = new net.Socket();
        var client2 = new net.Socket();
        console.log("connectiong to : ", ipAddress)
        client1.connect(PORTMOUSE , ipAddress, function() {
            console.log("Connected to mouse port: ", ipAddress)
            // connectedPCsMouse.push({sockObj: client1, name: hostname,ip:ipAddress});
            // app.connectedList.push({name: hostname,ip:ipAddress, isActive:false})
        });
        client2.connect(PORTOTHER , ipAddress, function() {
            console.log("Connected to others port: ", ipAddress)
            // connectedPCsOthers.push({sockObj: client2, name: hostname,ip:ipAddress});
            app.connectedList.push({name: hostname,ip:ipAddress, isActive:false, isCentral:false, mouseSockObj:client1, otherSockObj:client2})
            //app.connectedList.push({name: hostname,ip: ipAddress});
            //client.write('Hello serverMouse!');

        });

        // Add a 'data' event handler for the client socket
        // data is what the serverMouse sent to this socket
        client1.on('data', function(data) {
            console.log('Client1 data');
        });
        client2.on('data', function(data) {
            console.log('Client2 data');
        });

        // Add a 'close' event handler for the client socket
        client1.on('close', function() {
            console.log('Client1 Connection closed');
        });
        client2.on('close', function() {
            console.log('Client2 Connection closed');
        });
    },

    initialize: function ()
    {
        var address, ifaces = require('os').networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
        }
        var IP = address;
        console.log('HOST NAME : ' + os.hostname());
        //------------------------------------------------

        // When application starts we start a serverMouse on port 5867 that shows its type is 'OSSActiveHost'
        // Somebody else(from another host) asks this machine at port 5867 about its type and it returns 'OSSActiveHost'
        bonjour.publish({ name: os.hostname(), type: 'OSSActiveHost', host: os.hostname(), port: 5867 })
        console.log('BONJOUR STARTED');
        //----------------------------------------Zubair
        serverMouse = net.createServer(function(sock){
            sock.on('connection', function(){
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
                robot.moveMouse(x, y);
            });
            sock.on('close', function(){
                console.log("Connection closed!");
            });
        }).listen(PORTMOUSE , IP);
        console.log('Mouse connection serverMouse STARTED');
        //---------------------------------------
        serverOthers = net.createServer(function(sock){
            var completeData = ""
            sock.on('connection', function(){
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
                //console.log("In data function: completeDate : ", completeData)
                //completeData+=data.toString()
            });
            sock.on('close', function(){
                console.log("Connection closed!");
            });
        }).listen(PORTOTHER , IP);
        console.log('Others connection serverOthers STARTED');
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
    },
    sendMouseMovementEventToCurrentlyActiveSystem:function(event){
        for(var i=0; i<app.connectedList.length; i++)
        {
            //console.log("testing : ",app.connectedList.length,app.connectedList[i].isActive, app.connectedList[i].isCentral)

            if(app.connectedList[i].isActive && !app.connectedList[i].isCentral)
            {
                if (event.EventName == "MouseMoveEvent") {
                    app.connectedList[i].mouseSockObj.write(JSON.stringify(event));
                }
                else {
                    app.connectedList[i].otherSockObj.write(JSON.stringify(event) + delimeter);
                }
            }
        }
    },
    // sendClipBoardSyncEventToCurrentlyActiveSystem:function(latestClipBoardContent){
    //     for(var i=0; i<app.connectedList.length; i++)
    //     {
    //         // console.log("testing : ",app.connectedList.length,app.connectedList[i].isActive, app.connectedList[i].isCentral)
    //         if(app.connectedList[i].isActive && !app.connectedList[i].isCentral)
    //         {
    //             var obj = {
    //                 "EventName": "ClipboardEvent",
    //                 "text": latestClipBoardContent
    //             }
    //             app.connectedList[i].otherSockObj.write(JSON.stringify(obj));
    //         }
    //     }
    // },
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
    }
};
