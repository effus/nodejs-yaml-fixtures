'use strict';

const chalk = require('chalk');
const DbHelper = require('./db_helper.js');

/**
 * Looking for top table rows
 */
const TableViewer = {
    view: (dbConfig, tableName, topRows) => {
        console.debug('View top rows from table:', chalk.blue(tableName));
        if (!tableName) {
            console.error(chalk.red('No one table for view'));
            return false;
        }
        if (!topRows || Number.isNaN(parseInt(topRows)) || topRows < 0) {
            console.error(chalk.yellow('Top rows number must be an integer with value > 0, set default value = 10'));
            topRows = 10;
        }
        DbHelper.getTopRowsFromTable(dbConfig, tableName, topRows);
    }
};
module.exports = TableViewer;
