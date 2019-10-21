'use strict';

const MsSqlQuery = require('./mssql/ms_sql_query.js');
const MsSqlQueryHelper = require('./mssql/ms_sql_query_helper.js');
const chalk = require('chalk');

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
                let truncates = [];
                try {
                    // clear instructions in reversed order and first in stack
                    for (let i in instructions) {
                        if (instructions[i].type === 'clear') {
                            truncates.push(instructions[i]);
                        }
                    }
                    truncates = truncates.reverse();
                    for (let i in truncates) {
                        queries.push(MsSqlQueryHelper.parseInstruction(truncates[i]));
                    }
                    // other instructions in direct order
                    for (let i in instructions) {
                        if (instructions[i].type === 'clear') {
                            continue;
                        }
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
                } catch(e) {
                    console.error('applyInstructions error', e);
                }
            } else {
                reject('DbHelper.applyInstructions error: Unknown driver');
            }
        });
    },

    /**
     * @param dbConfig Object
     */
    getTableList: (dbConfig) => {
        return new Promise((resolve, reject) => {
            if (dbConfig.driver === 'mssql') {
                let tables = [];
                MsSqlQuery.queryRows(dbConfig, MsSqlQueryHelper.getTableList()).then((result) => {
                    for (let i in result) {
                        tables.push({
                            table: result[i].tbl,
                            column: result[i].col,
                            type: String(result[i].col_type).trim(),
                        });
                    }
                    MsSqlQuery.disconnect();
                    resolve(tables);
                }).catch(reject);
            } else {
                reject('DbHelper.getTableList error: Unknown driver');
            }
        });
    },

    /**
     * @param dbConfig Object
     * @param tableName {string}
     */
    getTableColumns: (dbConfig, tableName) => {

        const checkType = (typeStr) => {
            typeStr = typeStr.replace(/text\(([0-9]+)\)/g, 'nvarchar(max)');
            return String(typeStr).trim();
        }

        return new Promise((resolve, reject) => {
            if (dbConfig.driver === 'mssql') {
                let fields = [];
                MsSqlQuery.queryRows(dbConfig, MsSqlQueryHelper.getTableColumns(tableName)).then((result) => {
                    for (let i in result) {
                        fields.push({
                            column: result[i].col,
                            type: checkType(result[i].col_type),
                            isPk: result[i].is_pk,
                            hasIdentity: result[i].has_identity,
                            index: result[i].index_name,
                            isDesc: result[i].is_desc
                        });
                    }
                    MsSqlQuery.disconnect();
                    resolve(fields);
                }).catch(reject);
            } else {
                reject('DbHelper.getTableList error: Unknown driver');
            }
        });
    },

    /**
     * @param dbConfig Object
     * @param tableName {string}
     */
    getReferences: (dbConfig, tableName) => {
        return new Promise((resolve, reject) => {
            MsSqlQuery.queryRows(dbConfig, MsSqlQueryHelper.getReferences(tableName)).then((result) => {
                resolve(result);
            }).catch(reject);
        });
    },

    /**
     * @param references Array
     */
    dropReferences: async function(references) {
        for (let i in references) {
            const query = MsSqlQueryHelper.dropReference(references[i]);
            await MsSqlQuery.asyncExecute(query);
        }
        return true;
    },

    /**
     * @param references Array
     */
    createReferences: async function(references) {
        for (let i in references) {
            const query = MsSqlQueryHelper.createReference(references[i]);
            await MsSqlQuery.asyncExecute(query);
        }
        return true;
    },

    /**
     * @param tableName {string}
     */
    dropTable: async function(tableName) {
        const query = MsSqlQueryHelper.dropTable(tableName);
        await MsSqlQuery.asyncExecute(query);
        return true;
    },

    checkIfTableExist: async function(dbConfig, tableName) {
        return new Promise((resolve, reject) => {
            MsSqlQuery.queryRows(dbConfig, MsSqlQueryHelper.checkIfTableExist(tableName)).then((result) => {
                resolve(result[0].c);
            }).catch(reject);
        });
    },

    /**
     * @param dbConfig Object
     * @param tableName {string}
     * @param fields Object
     */
    recreateTableByFieldsObject: async function(dbConfig, tableName, fields) {
        const onComplete = () => {
            MsSqlQuery.disconnect();
            resolve();
        }
        const onError = (err) => {
            MsSqlQuery.disconnect();
            reject();
        }
        if (dbConfig.driver === 'mssql') {
            const tableParsed = tableName.split('.');
            let scheme = '';
            if (tableParsed.length === 2) {
                scheme = tableParsed[0];
                tableName = tableParsed[1];
            }
            console.log(chalk.blue('Implemented DB'), dbConfig);
            const references = await this.getReferences(dbConfig, tableName);
            try {
                const tableCount = await this.checkIfTableExist(dbConfig, tableName);
                if (tableCount > 0) {
                    console.log(chalk.yellow('Table exist, drop table references...'));
                    await this.dropReferences(references);
                    console.log(chalk.yellow('Drop table...'));
                    await this.dropTable(tableName);
                }
                console.log(chalk.yellow('Create table...'));
                const createTableQuery = MsSqlQueryHelper.createTableQuery(tableName, fields);
                await MsSqlQuery.asyncExecute(createTableQuery);
                console.log(chalk.yellow('Create references...'));
                await this.createReferences(references);
            } catch (e) {
                console.log('Catch error, aborting...');
            }
            
            MsSqlQuery.disconnect();

        } else {
            reject('DbHelper.getTableList error: Unknown driver');
        }
    }
};

module.exports = DbHelper;