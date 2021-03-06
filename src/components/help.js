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
${chalk.magenta('-m diff --source %source_db_config%')} // get difference between databases
${chalk.magenta('-m pull --source %source_db_config% --table %table_name%')} // load table structure from source database and apply to local database
${chalk.magenta('-m build-fixture --source %source_db_config% --name %source_name%')} // load table structure from source database and apply to local database
        `);
    }
};
module.exports = Help;

/*
${chalk.magenta('-m unload -f %fixture_name%')} // unload fixture 
${chalk.magenta('-m load-all -d %directory_path%')} // load all fixtures from directory
${chalk.magenta('-m unload-all -d %directory_path%')} // unload all fixtures from directory
*/