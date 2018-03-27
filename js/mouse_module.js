var connectionModule
var hook
function startIOHookMouseHandlers()
{
    if(hook)
    {
        delete hook
    }
    hook = new require('iohook')

    var electron = require('electron')
    var screenElectron = electron.screen;
    var allScreens = screenElectron.getAllDisplays();
    var width = allScreens[0].size.width;
    var height = allScreens[0].size.height;
    var min_width = 0;
    var max_width = width;
    console.log("ScreenRes: " + width + "x" + height);
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
            console.log('Cursor is out of the screen bounds and at coord: ' + event.x);
            console.log("Before changing control : ", "active: ",violatorIndex)
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
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[violatorIndex-1].isActive=true;
            }
            // ->if violated=right && violator is not last system on right and not next to central system towards left then
            //          start sending events to the system on the right of violator
            if(violated=="right" && (violatorIndex!=app.connectedList.length-1 && violatorIndex!=centralIndex-1))
            {
                // transfer control to the system on the right of violator
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[violatorIndex+1].isActive=true;
            }
            // ->if violated=left && violator is not last system on left or right BUT IS next to the central system
            //          towards right then stop sending events
            if(violated=="left" && violatorIndex==centralIndex+1)
            {
                // stop sending events or set central system as active
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[centralIndex].isActive=true;
            }
            // ->if violated=right && violator is not last system on left or right BUT IS next to the central system
            //          towards left then stop sending events
            if(violated=="right" && violatorIndex==centralIndex-1)
            {
                // stop sending events or set central system as active
                app.connectedList[violatorIndex].isActive=false;
                app.connectedList[centralIndex].isActive=true;
            }
            console.log("Before changing control : ", "active: ",violatorIndex)
        }
        //else connectionModule.sendMouseMovementEventToAllConnected(event)
        else connectionModule.sendMouseMovementEventToCurrentlyActiveSystem(event)
    });

    hook.on("mouseclick", event => {
        connectionModule.sendMouseClickEventToAllConnected(event)
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