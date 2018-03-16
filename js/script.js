/*const hook = require('iohook')
const path = require('path')
const url = require('url')
const os = require('os')
const net = require('net')
var PORT = 12345;
var bonjour = require('bonjour')()

var connectedPCs = []
var listOfActiveOSSHosts = []*/

var connection_module= new require('./js/connection_module.js')
var mouse_module = require('./js/mouse_module.js')
var clipboard_module = require('./js/clipboard_module.js')
var Keyboard_module = require('./js/keyboard_module.js')

mouse_module.setInitVariables(connection_module)
clipboard_module.setInitVariables(connection_module)
Keyboard_module.setInitVariables(connection_module)

var draggable = require('vuedraggable');

Vue.component('draggable', draggable);

function initialize() {
    connection_module.foo;
}

var app = new Vue({
    el: '#app',
    data: {
        selectingP: false, // Page Flags
        homeP: true,
        connectP: false,
        bindingsP: false,
        securityP: false,
        loading: false,
        sslState: 'disabled',
        connectionState: 'Inactive',
        selectList: [],
        bindingList: [{
                action: 'Copy',
                binding: 'Ctrl + C'
            },
            {
                action: 'Paste',
                binding: 'Ctrl + V'
            }
        ],
        connectedList: []
    },
    methods: {
        homeClick: function () {
            this.homeP = true;
            this.connectP = false;
            this.selectingP = false;
            this.bindingsP = false;
            this.securityP = false;
        },
        connectClick: function () {
            this.homeP = false;
            this.selectingP = false;
            this.connectP = true;
            this.bindingsP = false;
            this.securityP = false;
        },
        bindingsClick: function () {
            this.selectingP = false;
            this.homeP = false;
            this.connectP = false;
            this.bindingsP = true;
            this.securityP = false;
        },
        securityClick: function () {
            this.homeP = false;
            this.connectP = false;
            this.bindingsP = false;
            this.securityP = true;
            this.selectingP = false;
        },
        toggleSSL: function () {
            if (this.sslState == 'disabled') {
                this.sslState = 'enabled';
            } else {
                this.sslState = 'disabled';
            }
        },
        searchDevices: function () {
            this.connectP = false;
            this.selectingP = true;
            connection_module.findActiveOSSDevicesOnLocalNetwork();
            mouse_module.startHandlingMouseEvents()
            clipboard_module.startHandlingClipboardEvents()
            Keyboard_module.startHandlingKeyboardEvents()
        },
        addSelected: function (item) {
            connection_module.connectToAnOSSClient(item.ip, item.name);
            /*this.connectedList.push({
                name: item.name,
                ip: item.ip
            });*/
        }
    }
});