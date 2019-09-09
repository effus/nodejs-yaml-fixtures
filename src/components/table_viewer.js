'use strict';

const chalk = require('chalk');
const MsSqlQuery = require('./ms_sql_query.js');

const TableViewer = {
    view: (tableName, topRows) => {
        console.debug('view', tableName);
        if (!tableName) {
            console.error(chalk.red('No one table for view'));
            return false;
        }
        if (!topRows || Number.isNaN(parseInt(topRows)) || topRows < 0) {
            console.error(chalk.yellow('Top rows number must be an integer with value > 0, set default value = 10'));
            topRows = 10;
        }
        MsSqlQuery.queryRows('select top ' + topRows + ' * from ' + tableName)
            .then((result) => {
                TableViewer.showResult(result);
                MsSqlQuery.connection.close();
            })
            .catch((err) => {
                console.error('TableViewer::show', err);
                MsSqlQuery.connection.close();
            });
    },
    showResult: (result) => {
        console.debug('TableViewer::show', result);
    }
};
module.exports = TableViewer;
