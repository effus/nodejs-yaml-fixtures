'use strict';

const FixtureLoadHelper = require('./fixture_load_helper.js');
const MsSqlQuery = require('./ms_sql_query.js');
const chalk = require('chalk');

const FixtureLoader = {
    loadFile: (fixtureName) => {
        FixtureLoadHelper.load(fixtureName).then(() => {
            MsSqlQuery.execute(FixtureLoadHelper.queries.join(';' + "\n")).then(() => {
                console.debug(chalk.green('Done'));
                MsSqlQuery.disconnect();
            }).catch((err) => {
                MsSqlQuery.disconnect();
                console.error('loadFile', err);
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
