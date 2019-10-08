'use strict';

const FixtureLoadHelper = require('./fixture_load_helper.js');
const chalk = require('chalk');
const DbHelper = require('./db_helper.js');

const FixtureLoader = {
    loadFile: (config, fixtureName) => {
        console.log('FixtureLoader', fixtureName);
        FixtureLoadHelper.load(config, fixtureName).then((instructions) => {
            DbHelper.applyInstructions(config.db, instructions).then(() => {
                console.debug('Fixture loading result', chalk.green('Done'));
            }).catch((error) => {
                console.debug('Fixture loading result', chalk.red('failed'));
            });
        });
    },
    unloadFile: () => {
        //@todo
    },
    loadDirectory: () => {
        //@todo
    },
    unloadDirectory: () => {
        //@todo
    }
};

module.exports = FixtureLoader;
