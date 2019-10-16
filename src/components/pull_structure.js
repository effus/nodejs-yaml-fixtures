'use strict';

const DbHelper = require('./db_helper.js');

const PullStructure = {
    load: function(localDbConfig, sourceDbConfig, tableName) {
        DbHelper.getTableColumns(sourceDbConfig.db, tableName).then((sourceTableColumns) => {
            DbHelper.recreateTableByFieldsObject(localDbConfig.db, tableName, sourceTableColumns)
                .then(()=>{})
                .catch(()=>{});
        }).catch((err) => {
            console.log('Error', err);
        });
    }
};

module.exports = PullStructure;