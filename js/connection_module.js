const path = require('path')
const url = require('url')
const os = require('os')
const net = require('net')
var PORTMOUSE= 12345;
var PORTOTHER= 12346;
var bonjour = require('bonjour')()
const {clipboard} = require('electron');
var robot = require("robotjs")
var connectedPCsMouse = []
var connectedPCsOthers = []

var connectedPCsList

var listOfActiveOSSHosts = []
var serverMouse
var serverOthers
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
            connectedPCsMouse.push({sockObj: client1, name: hostname,ip:ipAddress});
            //app.connectedList.push({name: hostname,ip:ipAddress, isActive:false})
        });
        client2.connect(PORTOTHER , ipAddress, function() {
            console.log("Connected to others port: ", ipAddress)
            connectedPCsOthers.push({sockObj: client2, name: hostname,ip:ipAddress});
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
                var jsonObj = JSON.parse(obj1);

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
            sock.on('connection', function(){
                console.log("Connected to client on its request");
            });
            sock.on('data', function(data){
                var obj1= data.toString().split('}')[0]+'}';
                var jsonObj = JSON.parse(obj1);

                var event= jsonObj.EventName;
                // clipboard event
                var text = jsonObj.text.toString();
                console.log("Clipboard copy event recieved from other system")
                clipboard.writeText(text.toString());
                //clipboard.writeText(data.toString())
            });
            sock.on('close', function(){
                console.log("Connection closed!");
            });
        }).listen(PORTOTHER , IP);
        console.log('Others connection serverOthers STARTED');
    },
    sendMouseMovementEventToAllConnected:function(event){
        console.log("Sending mouse movement event to ", connectedPCsMouse.length, " systems")
        for(var i=0; i<app.connectedList.length; i++)
        {
            var obj = {
                "EventName": "MouseEvent",
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
        console.log("Sending clipboard synchronize event to ", connectedPCsOthers.length, " systems")
        for(var i=0; i<app.connectedList.length; i++)
        {
            var obj = {
                "EventName": "ClipboardEvent",
                "text": latestClipBoardContent.toString()
            }
            //connectedPCsOthers[i].sockObj.write(JSON.stringify(obj));
            //console.log(app.connectedList)
            if(app.connectedList[i].isCentral==false)
            {
                app.connectedList[i].otherSockObj.write(JSON.stringify(obj));
            }
        }
    },
    sendMouseMovementEventToCurrentlyActiveSystem:function(event){
        for(var i=0; i<app.connectedList.length; i++)
        {
            console.log("testing : ",app.connectedList.length,app.connectedList[i].isActive, app.connectedList[i].isCentral)
            if(app.connectedList[i].isActive && !app.connectedList[i].isCentral)
            {
                var obj = {
                "EventName": "MouseEvent",
                "x": event.x.toString(),
                "y": event.y.toString()
                }
                app.connectedList[i].mouseSockObj.write(JSON.stringify(obj));
            }
        }
    },
    sendClipBoardSyncEventToCurrentlyActiveSystem:function(latestClipBoardContent){
        for(var i=0; i<app.connectedList.length; i++)
        {
            console.log("testing : ",app.connectedList.length,app.connectedList[i].isActive, app.connectedList[i].isCentral)
            if(app.connectedList[i].isActive && !app.connectedList[i].isCentral)
            {
                var obj = {
                "EventName": "ClipboardEvent",
                "text": latestClipBoardContent.toString()
                }
                app.connectedList[i].otherSockObj.write(JSON.stringify(obj));
            }
        }
    }
};