const {globalShortcut} = require('electron').remote;
var connectionModule
var hook
var robot = require('robotjs')
var flag = true;
function startIOHookKeyboardHandlers()
{
    if(hook)
    {
        delete hook
    }
    hook = new require('iohook')

    hook.on("keydown", event => {
        event["EventName"] = "KeyboardKeyPressEvent";

        if(event.rawcode == 162 || event.rawcode == 163)
        {
          flag = false
        }
        if(flag)
        {
          connectionModule.sendKeyboardEventToCurrentlyActiveSystem(event)
        }
    });

    hook.on("keyup", event => {
        event["EventName"] = "KeyboardKeyPressEvent";

        if(event.rawcode == 162 || event.rawcode == 163)
        {
          flag = true
        }
    });

    // TODO detect keyboard events and ask the connection_module to pass them on the other systems
    console.log("Attaching IOHook Keyboard")
    hook.start();
    registerShortcuts();
}

function registerShortcuts()
{
   registerShortcut('CmdOrCtrl+V', '778' , ['v', ['control']] );
   registerShortcut('CmdOrCtrl+C', '777' , ['c', ['control']] );
}

function removeShortcut(key)
{
  globalShortcut.unregister(key)
}

function sendKey(code){
  var obj = {
      "rawcode" : code,
      "EventName" : "KeyboardKeyPressEvent"
  }

  connectionModule.sendKeyboardEventToCurrentlyActiveSystem(obj);
}

function registerShortcut(key, code, roboCode)
{
    const ret = globalShortcut.register(key, () => {
        removeShortcut(key)
        robot.keyTap(roboCode[0],roboCode[1]);
        sendKey(code)
        registerShortcut(key, code, roboCode);
    });

    if (!ret) {
        console.log('registration failed');
    }

    if(globalShortcut.isRegistered(key))
    {
        console.log(key,'Registration Successful!');
    }
}
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
