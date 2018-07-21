var NodeRSA = require('node-rsa');
var CryptoJS = require('crypto-js');

module.exports = {
  encryptAES: function(data, key) {
    var enc = CryptoJS.AES.encrypt(JSON.stringify(data), key);
    return enc.toString();
  },

  decryptAES: function(data, key) {
    var dec = CryptoJS.AES.decrypt(data.toString(), key)
    var text = dec.toString(CryptoJS.enc.Utf8);
    return text.substring(1, text.length - 1)
  },

  generateKeyPair: function() {
    var key = new NodeRSA({
      b: 512
    });

    var publicKey = key.exportKey("public");
    var privateKey = key.exportKey("private");

    return [privateKey, publicKey];
  },

  encryptRSA: function(data, key) {
    var publicKey = new NodeRSA();

    publicKey.importKey(key, "public");
    var enc = publicKey.encrypt(data);
    return enc;
  },

  decryptRSA: function(data, key) {
    var privateKey = new NodeRSA();

    privateKey.importKey(key, "private");
    var dec = privateKey.decrypt(data);
    return dec.toString();
  }
}