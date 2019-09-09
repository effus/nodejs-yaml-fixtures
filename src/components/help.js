'use strict';

const chalk = require('chalk');

const Help = {
    print: () => {
        console.log(`
${chalk.blue('=== Gemosystem Fixture Loader ===')}
Usage:
${chalk.magenta('-m help')} // this help
${chalk.magenta('-m view --table=%table_name% --top=%number_of_top_rows%')} // view some rows at the top of table
${chalk.magenta('-m load -f %fixture_name%')} // load fixture 
${chalk.magenta('-m unload -f %fixture_name%')} // unload fixture 
${chalk.magenta('-m load-all -d %directory_path%')} // load all fixtures from directory
${chalk.magenta('-m unload-all -d %directory_path%')} // unload all fixtures from directory
        `);
    }
};
module.exports = Help;
