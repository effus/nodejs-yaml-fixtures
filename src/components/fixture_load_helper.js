'use strict';

const fs   = require('fs');
const path = require('path');
const JsYaml = require('js-yaml');

const chalk = require('chalk');

const rootDir = path.resolve(__dirname) + '/../../';

const FixtureLoadHelper = {

    config: null,
    loadedFixtures: {},
    instructions: [], // shared db instructions stack

    /**
     * @param config Object
     * @returns FixtureLoadHelper
     */
    setConfig: function(config) {
        this.config = config;
        return this;
    },

    /**
     * @param config {{db: Object, fixtures: Object}}
     * @param fixtureName {string}
     */
    load: function (config, fixtureName) {
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
                FixtureLoadHelper.instructions.push({
                    type: 'clear', 
                    target: fixture.table, 
                    hasRelations: Array.isArray(fixture.relations) && fixture.relations.length > 0
                });
                if (fixture.auto_increment === true) {
                    FixtureLoadHelper.instructions.push({
                        type: 'identity',
                        target: fixture.table, 
                        flag: true
                    });
                    FixtureLoadHelper.instructions.push({
                        type: 'dateformat',
                        mask: 'ymd'
                    });
                }
                for (let i in fixture.data) {
                    FixtureLoadHelper.instructions.push({
                        type: 'insert',
                        target: fixture.table,
                        data: fixture.data[i]
                    });
                }
                if (fixture.auto_increment === true) {
                    FixtureLoadHelper.instructions.push({
                        type: 'identity',
                        target: fixture.table, 
                        flag: false
                    });
                }
            };

            const recursivelyLoad = (dependencyFixtureName) => {
                return FixtureLoadHelper.load(config, dependencyFixtureName);
            }

            FixtureLoadHelper.getFileContents(config.fixtures.path + fixtureName)
                .then((fixture) => {
                    if (!Array.isArray(fixture.dependencies)) {
                        afterLoadDependencies(fixture);
                        return resolve(FixtureLoadHelper.instructions);
                    }
                    if (fixture.dependencies.length === 0) {
                        afterLoadDependencies(fixture);
                        return resolve(FixtureLoadHelper.instructions);
                    }
                    const promises = fixture.dependencies.map(recursivelyLoad);
                    Promise.all(promises)
                        .then(() => {
                            afterLoadDependencies(fixture);
                            resolve(FixtureLoadHelper.instructions);
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
            if (!fs.existsSync(fixtureFile)) {
                console.error(chalk.red('Fixture not found'), fixtureFile);
                reject('Fixture not found: ' + fixtureFile);
            }
            const fixture = JsYaml.safeLoad(fs.readFileSync(fixtureFile), 'utf8');
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
