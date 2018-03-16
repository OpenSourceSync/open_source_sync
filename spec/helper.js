var path = require('path');

module.exports = {
  appPath: function() {
    switch (process.platform) {
      case 'darwin':
        return path.join(__dirname, '..', '.tmp', 'mac', 'OpenSourceSync.app', 'Contents', 'MacOS', 'OpenSourceSync');
      case 'linux':
        return path.join(__dirname, '..', '.tmp', 'linux', 'OpenSourceSync');
      default:
        throw 'Unsupported platform';
    }
  }
};
