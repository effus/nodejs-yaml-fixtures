const Config = require('./src/config_loader.js');
const ConsoleMenu = require('./src/console_menu.js');

Config.load(__dirname + '/config.yml').then((config) => {
    ConsoleMenu(config);

}).catch((error) => {
    console.error('error', error);
});