'use strict';

const MsSqlQueryHelper = {

    /**
     * @param tableName {string}
     */
    truncateTableQuery: (tableName) => {
        return 'truncate table ' + tableName;
    },

    setDateFormat: (format) => {
        return 'SET DATEFORMAT ' + format;
    },

    /**
     * @param tableName {string}
     * @param flag boolean
     * @returns {string}
     */
    identityInsertToggle: (tableName, flag) => {
        return 'SET IDENTITY_INSERT ' + tableName + ' ' + (flag ? 'ON' : 'OFF');
    },

    deleteAll: (tableName) => {
        return 'DELETE FROM ' + tableName;
    },

    resetIdentityValue: (tableName) => {
        return "DBCC CHECKIDENT ('" + tableName + "',RESEED, 0)";
    },

    hasIdentity: (tableName) => {
        return 'select o.name as tbl, c.name as col ' +
            'from sys.objects o ' +
            'inner join sys.columns c on o.object_id = c.object_id ' +
            'where c.is_identity = 1 and o.name = \'' + tableName + '\''
    },

    /**
     * @param tableName {string}
     * @param hasRelations {boolean}
     * @returns {string}
     */
    clearTableQuery: (tableName, hasRelations) => {
        if (hasRelations) {
            return MsSqlQueryHelper.deleteAll(tableName);
        } else {
            return MsSqlQueryHelper.truncateTableQuery(tableName);
        }
    },

    /**
     * вставка строки
     * @param tableName
     * @param row
     * @returns {string}
     */
    insertRow: (tableName, row) => {
        const fields = Object.keys(row).map((field) => {
            return "[" + field + "]";
        });

        const checkStringTemplate = function(str) {
            if (str === '%current_date%') {
                const currentTime = new Date();
                return [
                        currentTime.getMonth()+1,
                        currentTime.getDate(),
                        currentTime.getFullYear()
                    ].join('/') + ' ' +
                    [
                        currentTime.getHours(),
                        currentTime.getMinutes(),
                        currentTime.getSeconds()
                    ].join(':');
            } else {
                return str;
            }
        };

        const values = Object.values(row).map((value) => {
            if (typeof value === 'number') {
                return value;
            } else if (typeof value === 'string') {
                value = checkStringTemplate(value);
                return "'" + value + "'";
            } else if (value && typeof value === 'object' && typeof value['getMonth'] === 'function') {
                return "'" + [value.getMonth()+1,
                        value.getDate(),
                        value.getFullYear()].join('/')+' '+
                    [value.getHours(),
                        value.getMinutes(),
                        value.getSeconds()].join(':') + "'";
            } else if (value === null) {
                return 'null';
            } else if (typeof value === 'boolean') {
                return value ? 1 : 0;
            } else {
                console.debug('type: ', typeof value, value);
            }
        });
        return 'INSERT INTO ' + tableName + ' (' + fields + ') VALUES (' + values + ')';
    },

    /**
     * @param instruction Object
     */
    parseInstruction: (instruction) => {
        if (instruction.type === 'clear') {
            return MsSqlQueryHelper.clearTableQuery(instruction.target, instruction.hasRelations);
        } else if (instruction.type === 'identity') {
            return MsSqlQueryHelper.identityInsertToggle(instruction.target, instruction.flag);
        } else if (instruction.type === 'dateformat') {
            return MsSqlQueryHelper.setDateFormat(instruction.mask);
        } else if (instruction.type === 'insert') {
            return MsSqlQueryHelper.insertRow(instruction.target, instruction.data);
        } else {
            throw Error('Unknown instruction type');
        }
    },

    /**
     * @return {string}
     */
    getTableList: () => {
        return `SELECT 
        CONCAT(t.TABLE_SCHEMA, '.', t.TABLE_NAME) as tbl,
        c.COLUMN_NAME as col, 
        CONCAT(
            c.DATA_TYPE, 
            (CASE WHEN c.CHARACTER_MAXIMUM_LENGTH > 0 THEN CONCAT('(', c.CHARACTER_MAXIMUM_LENGTH, ') ') ELSE ' ' END), 
            (CASE WHEN c.IS_NULLABLE = 'YES' THEN 'NULL ' ELSE 'NOT NULL ' END),
            c.COLLATION_NAME
        ) as col_type
        --(CASE c.IS_NULLABLE WHEN 'YES' THEN ' NULL' ELSE ' NOT NULL' END)
    FROM INFORMATION_SCHEMA.TABLES t 
    INNER JOIN INFORMATION_SCHEMA.COLUMNS c ON c.TABLE_NAME = t.TABLE_NAME
    WHERE TABLE_TYPE='BASE TABLE' 
    ORDER BY tbl, c.COLUMN_NAME
    `;
    }
};

module.exports = MsSqlQueryHelper;
