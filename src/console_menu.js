'use strict';

const commandLineArgs = require('command-line-args');
const Help = require('./components/help.js');
const TableViewer = require('./components/table_viewer.js');
const FixtureLoader = require('./components/fixture_loader.js');
const DbDiffHelper = require('./components/db_diff_helper.js');
const ConfigLoader = require('./config_loader.js');
const PullStructure = require('./components/pull_structure.js');

const optionDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'mode', alias: 'm', type: String, defaultOption: true },
    { name: 'table', type: String },
    { name: 'top', type: Number },
    { name: 'fixture', alias: 'f', type: String },
    { name: 'directory', alias: 'd', type: String },
    { name: 'source', type: String },
];

const options = commandLineArgs(optionDefinitions);

/**
 * @param {{ rootDir: string }} env 
 */
const ConsoleMenu = (env) => {

    ConfigLoader.load(env.rootDir + '/config.yml').then((config) => {
        if (options.mode === 'help') {
            Help.print();
        } else if (options.mode === 'view') {
            TableViewer.view(config.db, options.table, options.top);
        } else if (options.mode === 'load') {
            FixtureLoader.loadFile(config, options.fixture);
        } else if (options.mode === 'diff') {
            ConfigLoader.load(env.rootDir + options.source).then((sourceConfig) => {
                DbDiffHelper.diff(sourceConfig, config);
            }).catch((err)=>{
                console.log('ConsoleMenu.Diff >> Source db config error >> ', err);
            });
        } else if (options.mode === 'pull') {
            ConfigLoader.load(env.rootDir + options.source).then((sourceConfig) => {
                PullStructure.load(config, sourceConfig, options.table);
            }).catch((err)=>{
                console.log('ConsoleMenu.pull >> ', err);
            });
            
        } /*else if (options.mode === 'unload') {
            FixtureLoader.unloadFile(options.fixture);
        } else if (options.mode === 'load-all') {
            FixtureLoader.loadDirectory(options.directory);
        } else if (options.mode === 'unload-all') {
            FixtureLoader.unloadDirectory(options.directory);
        }*/ else {
            console.log('dir:', __dirname);
            Help.print();
        }
    }).catch((err) => {
        console.log('ConsoleMenu: error', err);
    });
}

module.exports = ConsoleMenu;