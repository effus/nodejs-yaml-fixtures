'use strict';

const commandLineArgs = require('command-line-args');
const Help = require('./src/components/help.js');
const TableViewer = require('./src/components/table_viewer.js');
const FixtureLoader = require('./src/components/fixture_loader.js');

const optionDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'mode', alias: 'm', type: String, defaultOption: true },
    { name: 'table', type: String },
    { name: 'top', type: Number },
    { name: 'fixture', alias: 'f', type: String },
    { name: 'directory', alias: 'd', type: String },
];

const options = commandLineArgs(optionDefinitions);

if (options.mode === 'help') {
    Help.print();
} else if (options.mode === 'view') {
    TableViewer.view(options.table, options.top);
} else if (options.mode === 'load') {
    FixtureLoader.loadFile(options.fixture);
} else if (options.mode === 'unload') {
    FixtureLoader.unloadFile(options.fixture);
} else if (options.mode === 'load-all') {
    FixtureLoader.loadDirectory(options.directory);
} else if (options.mode === 'unload-all') {
    FixtureLoader.unloadDirectory(options.directory);
} else {
    Help.print();
}

