var connectionModule
var hook
var robot = require("robotjs")
const { spawn } = require('child_process');
var transparentScreen

function startIOHookMouseHandlers()
{
    if(hook) {
        delete hook
    }
    hook = new require('iohook')
    const {screen} = require('electron').remote;
    const {BrowserWindow} = require('electron').remote;
    
    const os = require('os')
    const url = require('url')
    const path = require('path')

    let win;

    var allScreens = screen.getAllDisplays();
    var width = allScreens[0].size.width;
    var height = allScreens[0].size.height;
    var min_width = 0;
    var max_width = width;

    console.log("ScreenRes: " + width + "x" + height);

    function openFilter() {
        if (os.platform() == 'win32') {
          win = new BrowserWindow({
            width: 800,
            height: 600,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            enableLargerThanScreen: true,
            thickFrame: false
          })
  
          win.loadURL(url.format({
            pathname: path.join(__dirname, '..', 'hide.html'),
            protocol: 'file:',
            slashes: true
          }))
  
          var allScreens = screen.getAllDisplays();
  
          win.setSize(allScreens[0].bounds.width + 100, allScreens[0].bounds.height + 100)
          win.setResizable(false)
          win.setPosition(-50, -50)
  
          win.focus()
        }
        else {
            //console.log("Starting transparent screen")
            if(transparentScreen==null)
            {
                transparentScreen = spawn('/media/ferhan/Education_material_and_setups/Qt/Projects/Test/build-transparentScreenTest-Desktop_Qt_5_10_1_GCC_64bit-Release/transparentScreenTest', []);
                //console.log("Starting transparent screen")
            }
        }
      }
  
      function closeFilter() {
        if (os.platform() == 'win32')
        {
          win.close();
        }
        else {
            //console.log("Killing transparent screen")
            if(transparentScreen!=null)
            {
                transparentScreen.kill();
                transparentScreen=null
                //console.log("Killing transparent screen")
            }
        }
      }

    hook.on("mousemove", event => {
        // iohook method giving mouse coordinates at all times
        if(event.x  >= max_width-1 || event.x  <= min_width+1) 
        // On ubuntu the cursor remains betweek 0-1365(not 1366) so to be on the safe side me keep a 1 pixel margin
        // on either side of the screen
        {
            var violator;
            var violatorIndex;
            var central;
            var centralIndex;
            var violated;
            for(var i=0; i<app.connectedList.length; i++)
            {
                if(app.connectedList[i].isActive)
                {
                    violator=app.connectedList[i];
                    violatorIndex=i;
                }
                else if(app.connectedList[i].isCentral)
                {
                    central=app.connectedList[i];
                    centralIndex=i;
                }
            }
            if(event.x  >= max_width-1)
            {
                violated="right"
            }
            else if(event.x  <= min_width+1)
            {
                violated="left"
            }
            //console.log('Cursor is out of the screen bounds and at coord: ' + event.x);
            //console.log("Before changing control : ", "active: ",violatorIndex)
            // violator= [the system currently having control], violated=[Boundry that was violated]

            // Central system will handle this scenario in the following way
            // ->if violated=left && violator=leftmost then do nothing
            if(violatorIndex==0 && violated=="left")
            {
                // do nothing
            }
            // ->if violated=right && violator=rightmost then do nothing
            if(violatorIndex==app.connectedList.length-1 && violated=="right")
            {
                //do nothing
            }
            // ->if violated=left && violator is not last system on left and not next to central system towards right then
            //          start sending events to the system on the right of violator
            if(violated=="left" && (violatorIndex!=0 && violatorIndex!=centralIndex+1))
            {
                // transfer control to the system on the left of violator
                openFilter()
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[violatorIndex-1].isActive=true;
                event["EventName"] = "MouseMoveEvent";
                event.x = 0;
                robot.moveMouse(3, event.y);
            }
            // ->if violated=right && violator is not last system on right and not next to central system towards left then
            //          start sending events to the system on the right of violator
            if(violated=="right" && (violatorIndex!=app.connectedList.length-1 && violatorIndex!=centralIndex-1))
            {
                // transfer control to the system on the right of violator
                openFilter()
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[violatorIndex+1].isActive=true;
                event["EventName"] = "MouseMoveEvent";
                event.x = 0;
                robot.moveMouse(3, event.y);
            }
            // ->if violated=left && violator is not last system on left or right BUT IS next to the central system
            //          towards right then stop sending events
            if(violated=="left" && violatorIndex==centralIndex+1)
            {
                // stop sending events or set central system as active
                closeFilter()
                robot.moveMouse(width - 3, event.y); 
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[centralIndex].isActive=true;
            }
            // ->if violated=right && violator is not last system on left or right BUT IS next to the central system
            //          towards left then stop sending events
            if(violated=="right" && violatorIndex==centralIndex-1)
            {
                // stop sending events or set central system as active
                closeFilter()
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[centralIndex].isActive=true;
            }
            //console.log("Before changing control : ", "active: ",violatorIndex)
        }
        //else connectionModule.sendMouseMovementEventToAllConnected(event)
        else {
            event["EventName"] = "MouseMoveEvent";
            connectionModule.sendMouseMovementEventToCurrentlyActiveSystem(event)
        }
    });

    hook.on("mouseclick", event => {
        event["EventName"] = "MouseClickEvent";
        connectionModule.sendMouseMovementEventToCurrentlyActiveSystem(event)
    });

    console.log("Attaching IOHook Mouse")
    hook.start();
}
module.exports = {
    setInitVariables:function(connectionModuleVal){
        connectionModule=connectionModuleVal
    },
    startHandlingMouseEvents:function(){
        startIOHookMouseHandlers()
        console.log("Started listening mouse events!");
    },
    stopHandlingMouseEvents:function(){
        if(hook)
        {
            delete hook
        }
    }
}