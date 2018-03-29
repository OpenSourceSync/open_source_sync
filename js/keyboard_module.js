const {globalShortcut} = require('electron').remote;
var connectionModule
var hook
var robot = require('robotjs')
function startIOHookKeyboardHandlers()
{
    if(hook)
    {
        delete hook
    }
    hook = new require('iohook')
    
    hook.on("keydown", event => {
        event["EventName"] = "KeyboardKeyPressEvent";
        connectionModule.sendKeyboardEventToCurrentlyActiveSystem(event)
    });
    
    // TODO detect keyboard events and ask the connection_module to pass them on the other systems
    console.log("Attaching IOHook Keyboard")
    hook.start();    
    //registerShortcuts();
}

// function registerShortcuts()
// {
//    registerShortcut('CmdOrCtrl+V', '778' , ['v', ['control']] );
//    registerShortcut('CmdOrCtrl+C', '777' , ['c', ['control']] );
// }

// function registerShortcut(key, code, roboCode)
// {
//     const ret = globalShortcut.register(key, () => {
//         robot.keyTap(roboCode[0],roboCode[1]);
//         var obj = {
//             "rawcode" : "778",
//             "EventName" : "KeyboardKeyPressEvent"
//         }
        
//         connectionModule.sendKeyboardEventToCurrentlyActiveSystem(obj);
//         console.log(key + ' has been registered (' + code + ')');
//     });


//     if (!ret) {
//         console.log('registration failed');
//     }

//     if(globalShortcut.isRegistered(key))
//     {
//         console.log(key,'Registration Successful!');
//     }
// }
module.exports = {
    setInitVariables:function(connectionModuleVal){
        connectionModule=connectionModuleVal
    },
    startHandlingKeyboardEvents:function(){
        startIOHookKeyboardHandlers()
    },
    stopHandlingKeyboardEvents:function(){
        if(hook)
        {
            delete hook
        }
    }
}