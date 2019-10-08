'use strict';

const MsSqlQuery = require('./mssql/ms_sql_query.js');
const MsSqlQueryHelper = require('./mssql/ms_sql_query_helper.js');

const DbHelper = {

    /**
     * @param dbConfig
     * @param tableName
     * @param topRows
     */
    getTopRowsFromTable: (dbConfig, tableName, topRows) => {
        if (dbConfig.driver === 'mssql') {
            MsSqlQuery.queryRows(dbConfig, 'select top ' + topRows + ' * from ' + tableName)
            .then((result) => {
                console.debug('Top table rows:', result);
                MsSqlQuery.connection.close();
            })
            .catch((err) => {
                console.error('TableViewer::show', err);
                MsSqlQuery.connection.close();
            });
        }
    },

    /**
     * @param dbConfig Object
     * @param instructions Array
     */
    applyInstructions: (dbConfig, instructions) => {
        return new Promise((resolve, reject) => {
            if (dbConfig.driver === 'mssql') {
                let queries = [];
                for (let i in instructions) {
                    queries.push(MsSqlQueryHelper.parseInstruction(instructions[i]));
                }
                MsSqlQuery.connect(dbConfig).then(() => {
                    MsSqlQuery.execute(queries.join(';' + "\n")).then(() => {
                        MsSqlQuery.disconnect();
                        resolve();
                    }).catch((err) => {
                        MsSqlQuery.disconnect();
                        reject(err);
                    });
                });
            } else {
                reject('Unknown driver');
            }
        });
        
    }
};

module.exports = DbHelper;