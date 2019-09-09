'use strict';

const fs   = require('fs');
const path = require('path');
const JsYaml = require('js-yaml');

const MsSqlQueryHelper = require('./ms_sql_query_helper.js');
const chalk = require('chalk');

const rootDir = path.resolve(__dirname) + '/../../';

const FixtureLoadHelper = {

    loadedFixtures: {},
    queries: [], // shared queries stack

    load: (fixtureName) => {
        return new Promise((resolve, reject) => {
            // load fixture file
            // get dependencies
            // load recursively if not loaded

            if (typeof FixtureLoadHelper.loadedFixtures[fixtureName] !== 'undefined') {
                // already loaded
                return resolve([]);
            }
            FixtureLoadHelper.loadedFixtures[fixtureName] = {};
            const afterLoadDependencies = (fixture) => {
                FixtureLoadHelper.queries.push(MsSqlQueryHelper.clearTableQuery(
                    fixture.table,
                    Array.isArray(fixture.relations) && fixture.relations.length > 0
                ));
                if (fixture.auto_increment === true) {
                    FixtureLoadHelper.queries.push(MsSqlQueryHelper.identityInsertToggle(fixture.table, true));
                    FixtureLoadHelper.queries.push(MsSqlQueryHelper.setDateFormat('ymd'));
                }
                for (let i in fixture.data) {
                    FixtureLoadHelper.queries.push(MsSqlQueryHelper.insertRow(fixture.table, fixture.data[i]));
                }
                if (fixture.auto_increment === true) {
                    FixtureLoadHelper.queries.push(MsSqlQueryHelper.identityInsertToggle(fixture.table, false));
                }
                console.debug(chalk.green('Load fixture: '), fixtureName);
            };

            FixtureLoadHelper.getFileContents('fixtures/' + fixtureName + '.yml')
                .then((fixture) => {
                    if (!Array.isArray(fixture.dependencies)) {
                        afterLoadDependencies(fixture);
                        return resolve();
                    }
                    if (fixture.dependencies.length === 0) {
                        afterLoadDependencies(fixture);
                        return resolve();
                    }
                    const promises = fixture.dependencies.map(FixtureLoadHelper.load);
                    Promise.all(promises)
                        .then(() => {
                            afterLoadDependencies(fixture);
                            resolve();
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    },

    /**
     *
     * @param fixtureFile
     * @returns {Promise}
     */
    getFileContents: (fixtureFile) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(rootDir + fixtureFile)) {
                console.error(chalk.red('Fixture not found'), rootDir + fixtureFile);
                reject('Fixture not found: ' + rootDir + fixtureFile);
            }
            const fixture = JsYaml.safeLoad(fs.readFileSync(rootDir + fixtureFile), 'utf8');
            if (FixtureLoadHelper.checkFormat(fixture) === false) {
                reject('Fixture not parsed or has incorrect format');
            }
            resolve(fixture);
        });
    },

    /**
     * @param content {{
     *     table: String,
     *     pk: string,
     *     auto_increment: boolean,
     *     data: Array,
     *     dependencies: Array
     * }}
     * @returns {boolean}
     */
    checkFormat: (content) => {
        const printError = (field) => {
            console.error('Fixture format error: ' + chalk.red(field + ' undefined'), content);
            return false;
        };
        if (typeof content.table === 'undefined') {
            return printError('table');
        }
        if (typeof content.pk === 'undefined') {
            return printError('pk');
        }
        if (typeof content.auto_increment === 'undefined') {
            return printError('auto_increment');
        }
        if (typeof content.data === 'undefined') {
            return printError('data');
        }
        if (typeof content.dependencies === 'undefined') {
            return printError('dependencies');
        }
        return true;
    }
};

module.exports = FixtureLoadHelper;
