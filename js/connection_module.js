const path = require('path')
const url = require('url')
const os = require('os')
const net = require('net')
var PORT = 12345;
var bonjour = require('bonjour')()
const {clipboard} = require('electron')
// var robot = require("robotjs");

var connectedPCs = []
var listOfActiveOSSHosts = []
var server
module.exports = {
  foo: function () {
    console.log('TEST OUT')
  },
  findActiveOSSDevicesOnLocalNetwork:function () {
  
    bonjour.unpublishAll(function(){
        console.log("Unpublishing all services");
    });
    console.log('BONJOUR STOPPED');
    delete server;
    console.log('CONN SERVER STOPPED');
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
        var client = new net.Socket();
        console.log("connectiong to : ", ipAddress)
        client.connect(PORT, ipAddress, function() {
            console.log("Connected to : ", ipAddress)
            connectedPCs.push({sockObj: client, name: hostname,ip:ipAddress});
            app.connectedList.push({name: hostname,ip:ipAddress})
            //app.connectedList.push({name: hostname,ip: ipAddress});
            //client.write('Hello Server!');

        });

        // Add a 'data' event handler for the client socket
        // data is what the server sent to this socket
        client.on('data', function(data) {
            
            //console.log('DATA: ' + data);
            
            // Close the client socket completely
            
        });

        // Add a 'close' event handler for the client socket
        client.on('close', function() {
            console.log('Connection closed');
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

        // When application starts we start a server on port 5867 that shows its type is 'OSSActiveHost'
        // Somebody else(from another host) asks this machine at port 5867 about its type and it returns 'OSSActiveHost'
        bonjour.publish({ name: os.hostname(), type: 'OSSActiveHost', host: os.hostname(), port: 5867 })
        console.log('BONJOUR STARTED');
        //----------------------------------------Zubair
        server = net.createServer(function(sock){
            sock.on('connect', function(){
                console.log("Connected to client on its request");
            });
            sock.on('connection', function(){
                console.log("Connected to client on its request");
            });
            sock.on('data', function(data){
                console.log(data.toString());
                var jsonObj = JSON.parse(data.toString());

                var event= jsonObj.EventName;
                
                if(event == "MouseEvent") {
                    var x = jsonObj.x;
                    var y = jsonObj.y;
                    // robot.moveMouse(x, y);
                    console.log(x,y);
                }
                else {
                    var text = jsonObj.text.toString();
                    console.log("Clipboard copy event recieved from other system")
                    clipboard.write(text);
                    //clipboard.writeText(data.toString())
                }
                
                
            });
            sock.on('close', function(){
                console.log("Connection closed!");
            });
        }).listen(PORT, IP);
        console.log('CONN SERVER STARTED');
        //---------------------------------------
    },
    sendMouseMovementEventToAllConnected:function(event){
        console.log("Sending mouse movement event to ", connectedPCs.length, " systems")
        for(var i=0; i<connectedPCs.length; i++)
        {
            var obj = {
                "EventName": "MouseEvent",
                "x": event.x.toString(),
                "y": event.y.toString()
            }
            connectedPCs[i].sockObj.write(JSON.stringify(obj));
            //connectedPCs[i].sockObj.write(event.x.toString()+","+event.y.toString()+',')
        }
    },
    sendClipBoardSyncEventToAllConnected:function(latestClipBoardContent){
        console.log("Sending clipboard synchronize event to ", connectedPCs.length, " systems")
        for(var i=0; i<connectedPCs.length; i++)
        {
            var obj = {
                "EventName": "ClipboardEvent",
                "text": latestClipBoardContent.toString()
            }
            connectedPCs[i].sockObj.write(JSON.stringify(obj));
            //connectedPCs[i].sockObj.write(latestClipBoardContent.toString())
        }
    }
};