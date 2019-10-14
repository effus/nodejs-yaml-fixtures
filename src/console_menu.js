'use strict';

const commandLineArgs = require('command-line-args');
const Help = require('./components/help.js');
const TableViewer = require('./components/table_viewer.js');
const FixtureLoader = require('./components/fixture_loader.js');
const DbDiffHelper = require('./components/db_diff_helper.js');

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

const ConsoleMenu = (config) => {
    if (options.mode === 'help') {
        Help.print();
    } else if (options.mode === 'view') {
        TableViewer.view(config.db, options.table, options.top);
    } else if (options.mode === 'load') {
        FixtureLoader.loadFile(config, options.fixture);
    } else if (options.mode === 'diff') {
        DbDiffHelper.diff(options.source, config);
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
}

module.exports = ConsoleMenu;