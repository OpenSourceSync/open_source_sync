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
        // On ubuntu the cursor remains betweek 0-1365(not 1366) so to be on the safe side me keep a 1 pixel marin
        // on either side of the screen
        {
            console.log('Cursor is out of the screen bounds and at coord: ' + event.x);
            // violator= [the system currently having control], violated=[Boundry that was violated]
            // Central system will handle this request in the following way
            // ->if violated=left && violator=leftmost then do nothing
            // ->if violated=right && violator=rightmost then do nothing
            // ->if violated=left && violator is not last system on left or right and not next to central system then
            //          start sending events to the system on the left of violator
            // ->if violated=right && violator is not last system on left or right and not next to central system then
            //          start sending events to the system on the right of violator
            // ->if violated=left && violator is not last system on left or right BUT IS next to the central system
            //          towards right then stop sending events
            // ->if violated=right && violator is not last system on left or right BUT IS next to the central system
            //          towards left then stop sending events
        }
        else connectionModule.sendMouseMovementEventToAllConnected(event)
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
    },
    stopHandlingMouseEvents:function(){
        if(hook)
        {
            delete hook
        }
    }
}