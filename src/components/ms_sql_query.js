'use strict';

const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const dbParams = require('./../db_params.js');
const chalk = require('chalk');

const SqlQuery = {
    connection: null,
    isConnected: false,
    init: function() {
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
                    resolve();
                }
            });
        });
    },
    connect: function() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                this.init().then(resolve).catch(reject);
            } else {
                resolve();
            }
        });
    },
    disconnect: function() {
        SqlQuery.connection.close();
        SqlQuery.isConnected = false;
    },
    execute: function(sql, getRows) {
        return new Promise((resolve, reject) => {
            this.connect().then(() => {
                let totalRows = 0;
                let result = [];
                const request = new Request(sql, function(err, rowCount) {
                    if (err) {
                        console.error('Execute: Request error', chalk.red(err));
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
                console.debug('Executed: ', chalk.gray(sql));

                this.connection.execSql(request);
            }).catch(reject);
        });
    },
    queryRows: function(sql) {
        return new Promise((resolve, reject) => {
            this.connect().then(() => {
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
module.exports = SqlQuery;
