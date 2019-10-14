'use strict';

const Config = require('./../config_loader.js');
const DbHelper = require('./db_helper.js');
const _ = require('lodash');

const DbDiffHelper = {

    createComparingStructure: function(tables) {
        let db = {};
        for (let i in tables) {
            const table = tables[i].table;
            const col = tables[i].column;
            if (typeof db[table] === 'undefined') {
                db[table] = {};
            }
            db[table][col] = tables[i].type;
        }
        return db;
    },

    /**
     * @param Array sourceTableList 
     * @param Array currentTableList 
     */
    comparing: function(sourceTableList, currentTableList) {
        let source = this.createComparingStructure(sourceTableList);
        let current = this.createComparingStructure(currentTableList);
        const allTables = _.merge(Object.keys(source), Object.keys(current));
        let diff = {
            current: {
                not_existed_tables: [],
                not_existed_columns: []
            },
            source: {
                not_existed_tables: [],
                not_existed_columns: [],
                unequal_column_types: []
            }
        };
        for (let i in allTables) {
            const table = allTables[i];
            if (typeof current[table] === 'undefined') {
                diff.current.not_existed_tables.push(table);
                continue;
            }
            if (typeof source[table] === 'undefined') {
                diff.source.not_existed_tables.push(table);
                continue;
            }
            const allColumns = _.merge(Object.keys(current[table]), Object.keys(source[table]));
            for (let j in allColumns) {
                const col = allColumns[j];
                if (typeof current[table][col] === 'undefined') {
                    diff.current.not_existed_columns.push(table + '.' + col);
                    continue;
                }
                if (typeof source[table][col] === 'undefined') {
                    diff.source.not_existed_columns.push(table + '.' + col);
                    continue;
                }
                if (current[table][col] !== source[table][col]) {
                    diff.source.unequal_column_types.push(table + '.' + col + '; current: ' + current[table][col] + ', source: ' + source[table][col]);
                }
            }
        }
        console.log('Compare result: ', diff);
    },

    /**
     * @param {string} sourceConfigPath 
     * @param {string} currentConfig 
     */
    diff: function(sourceConfigPath, currentConfig) {
        const onError = (err) => {
            console.log('DbDiffHelper.diff', err);
        }
        Config.load(__dirname + '/../../' + sourceConfigPath).then((sourceConfig) => {
            DbHelper.getTableList(sourceConfig.db).then((sourceTableList) => {
                DbHelper.getTableList(currentConfig.db).then((currentTableList) => {
                    this.comparing(sourceTableList, currentTableList);
                }).catch(onError);
            }).catch(onError);
        
        }).catch((error) => {
            console.error('DbDiffHelper error', error);
        });
    }
};

module.exports = DbDiffHelper;