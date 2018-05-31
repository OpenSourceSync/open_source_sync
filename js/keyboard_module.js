const {globalShortcut} = require('electron').remote;
var connectionModule
var hook
var robot = require('robotjs')
var flag = true;
var customKeybind = []
var store
var previous = null

var shortcuts = [
    { 
        "key" : "CmdOrCtrl+V",
        "code" : "778",
        "roboCode" : ["v", ["control"]]
    },{
        "key" : "CmdOrCtrl+C",
        "code" : "777",
        "roboCode" : ["c", ["control"]]
    },{
        "key" : "CmdOrCtrl+X",
        "code" : "789",
        "roboCode" : ["x", ["control"]]
    },{
        "key" : "CmdOrCtrl+A",
        "code" : "780",
        "roboCode" : ["a", ["control"]]
    },{
        "key" : "CmdOrCtrl+S",
        "code" : "781",
        "roboCode" : ["s", ["control"]]
    },{
        "key" : "CmdOrCtrl+F",
        "code" : "782",
        "roboCode" : ["f", ["control"]]
    },{
        "key" : "CmdOrCtrl+P",
        "code" : "783",
        "roboCode" : ["p", ["control"]]
    }
]

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

    //store = connectionModule.getStore()
    
    registerShortcuts();
}

function registerShortcuts()
{
//    registerShortcut('CmdOrCtrl+V', '778' , ['v', ['control']] );
//    registerShortcut('CmdOrCtrl+C', '777' , ['c', ['control']] );
    shortcuts.forEach(element => {
        registerShortcut(element.key, element.code, element.roboCode)
    })
    
    // if(store.get('customKeys') != undefined)
    // {
    //     customKeybind = store.get('customKeys')
    //     customKeybind.forEach(element => {
    //         registerShortcut(element.key, element.code, element.roboCode)
    //     });
    // }
    if(store.get('customKeys') != undefined)
    {    
        setNewBinding(store.get('customKeys'))
    }

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

function setNewBinding(prev){
    var flag1 = true
    var flag2 = true
    
    var len = prev[0].binding.length-1
    var temp1 = prev[0].binding[len];
    console.log(temp1)
    len = prev[1].binding.length-1
    var temp2 = prev[1].binding[len];
    console.log(temp2)
    temp1 = 'CmdOrCtrl+' + temp1;
    temp2 = 'CmdOrCtrl+' + temp2;
    console.log(temp1)
    console.log(temp2)
    shortcuts.forEach(element => {
        if(element.key == temp1)
            flag1 = false
        else if(element.key == temp2)
            flag2 = false
    })
    if(flag1)
    {
        if(temp1 != undefined)
        if(globalShortcut.isRegistered(temp1))
        {
            removeShortcut(temp1)
        }
    }
    if(flag2)
    {
        if(temp2 != undefined)
        if(globalShortcut.isRegistered(temp2))
        {
            removeShortcut(temp2)
        }
    }
    if(store.get('customKeys') != undefined)
    {
        
        customKeybind = store.get('customKeys')
        console.log(customKeybind)
        customKeybind[0].key = customKeybind[0].binding[customKeybind[0].binding.length-1];
        customKeybind[1].key = customKeybind[1].binding[customKeybind[1].binding.length-1];
        customKeybind[0].key = 'CmdOrCtrl+' + customKeybind[0].key;
        customKeybind[1].key = 'CmdOrCtrl+' + customKeybind[1].key;
        console.log(customKeybind)
        customKeybind.forEach(element => {
            if(element.key !== temp1 && element.key !== temp2)
                if(!globalShortcut.isRegistered(element.key))
                    registerShortcut(element.key, element.code, element.roboCode)
        });
    }
}

module.exports = {
    setInitVariables:function(connectionModuleVal, storeObj){
        connectionModule=connectionModuleVal
        store = storeObj
    },
    startHandlingKeyboardEvents:function(){
        startIOHookKeyboardHandlers()
    },
    stopHandlingKeyboardEvents:function(){
        if(hook)
        {
            delete hook
        }
    },
    setCustomKey:function(prev){
        previous = prev
        setNewBinding(prev)
    }
}
