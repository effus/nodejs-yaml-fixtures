'use strict';

const fs   = require('fs');
const chalk = require('chalk');
const JsYaml = require('js-yaml');

const ConfigLoader = {

    /**
     * @param baseDir
     */
    load: (configYml) => {
        return new Promise((resolve, reject) => {
            if (!configYml) {
                console.error(chalk.red('Config path not defined'));
                return reject('Config path not defined');
            }
            if (!fs.existsSync(configYml)) {
                console.error(chalk.red('Config not found'), configYml);
                return reject('Config not found');
            }
            const config = JsYaml.safeLoad(fs.readFileSync(configYml), 'utf8');
            if (ConfigLoader.checkFormat(config) === false) {
                return reject('Config not parsed or has incorrect format');
            }
            resolve(config);
        });
    },

    /**
     * @param config
     */
    checkFormat: (config) => {
        if (!config.db) {
            return false;
        }
        if (!config.fixtures) {
            return false;
        }
        return true;
    }
};

module.exports = ConfigLoader;