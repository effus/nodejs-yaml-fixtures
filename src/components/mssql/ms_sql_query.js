'use strict';

const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const chalk = require('chalk');

const MsSqlQuery = {
    connection: null,
    isConnected: false,
    init: function(dbParams) {
        return new Promise((resolve, reject) => {
            this.connection = new Connection({
                server: dbParams.server,
                authentication: {
                    type: "default",
                    options: {
                        userName: dbParams.user,
                        password: dbParams.password,
                    }
                }
            });
            this.connection.on('connect', (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.isConnected = true;
                    this.selectDb(dbParams.database).then(resolve).catch(reject);
                }
            });
        });
    },
    selectDb: function(dbName) {
        return new Promise((resolve, reject) => {
            this.execute('use ' + dbName, false).then(resolve).catch(reject);
        });
    },
    connect: function(dbParams) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                this.init(dbParams).then(resolve).catch(reject);
            } else {
                resolve();
            }
        });
    },
    disconnect: function() {
        MsSqlQuery.connection.close();
        MsSqlQuery.isConnected = false;
    },
    execute: function(sql, getRows) {
        return new Promise((resolve, reject) => {
            this.connect().then(() => {
                let totalRows = 0;
                let result = [];
                const request = new Request(sql, function(err, rowCount) {
                    if (err) {
                        console.log('Execute: Request error', chalk.red(err));
                        return reject(err);
                    } else {
                        totalRows = rowCount;
                    }
                });
                if (getRows) {
                    request.on('row', (columns) => {
                        let row = {};
                        columns.forEach((column) => {
                            row[column.metadata.colName] = column.value;
                        });
                        result.push(row);
                    });
                }
                request.on('requestCompleted', () => {
                    return resolve(result);
                });
                console.log('Executing: ', chalk.gray(sql));

                this.connection.execSql(request);
            }).catch(reject);
        });
    },
    
    /**
     * @param sql {string}
     */
    asyncExecute: async function(sql) {
        await new Promise((resolve, reject) => {
            MsSqlQuery.connect().then(() => {
                MsSqlQuery.execute(sql).then(() => {
                    resolve();
                }).catch(reject);
            }).catch(reject);
        });
        return true;
    },
    queryRows: function(dbParams, sql) {
        return new Promise((resolve, reject) => {
            this.connect(dbParams).then(() => {
                this.execute(sql, true)
                    .then((rows)=>{
                        resolve(rows);
                    }).catch(e => {
                        reject(e);
                    });
            }).catch(reject)
        });
    }
};
module.exports = MsSqlQuery;
