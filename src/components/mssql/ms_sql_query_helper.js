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
            (CASE WHEN c.IS_NULLABLE = 'YES' THEN '' ELSE 'NOT NULL ' END),
            (CASE WHEN c.COLLATION_NAME IS NOT NULL THEN CONCAT('COLLATE ', c.COLLATION_NAME) ELSE '' END)
        ) as col_type
    FROM INFORMATION_SCHEMA.TABLES t 
    INNER JOIN INFORMATION_SCHEMA.COLUMNS c ON c.TABLE_NAME = t.TABLE_NAME
    WHERE TABLE_TYPE='BASE TABLE' 
    ORDER BY tbl, c.COLUMN_NAME
    `;
    },

    /**
     * @param {string} tableName
     * @return {string}
     */
    getTableColumns: (tableName) => {
        return `
        SELECT 
        c.COLUMN_NAME as col, 
        CONCAT(
            c.DATA_TYPE, 
            (CASE WHEN c.CHARACTER_MAXIMUM_LENGTH > 0 THEN CONCAT('(', c.CHARACTER_MAXIMUM_LENGTH, ') ') ELSE ' ' END), 
            (CASE WHEN c.COLLATION_NAME IS NOT NULL THEN CONCAT(' COLLATE ', c.COLLATION_NAME, ' ') ELSE '' END),
            (CASE WHEN c.IS_NULLABLE = 'YES' THEN '' ELSE 'NOT NULL ' END)
        ) as col_type,
        ISNULL(OBJECTPROPERTY(OBJECT_ID(cu.CONSTRAINT_SCHEMA + '.' + QUOTENAME(cu.CONSTRAINT_NAME)), 'IsPrimaryKey'), 0) as is_pk,
        COLUMNPROPERTY(OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') as has_identity,
        ind.name as index_name,
        ind_col.is_descending_key as is_desc
    FROM INFORMATION_SCHEMA.TABLES t 
    INNER JOIN INFORMATION_SCHEMA.COLUMNS c ON c.TABLE_NAME = t.TABLE_NAME
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE cu ON cu.TABLE_NAME = t.TABLE_NAME AND c.COLUMN_NAME = cu.COLUMN_NAME AND OBJECTPROPERTY(OBJECT_ID(cu.CONSTRAINT_SCHEMA + '.' + QUOTENAME(cu.CONSTRAINT_NAME)), 'IsPrimaryKey') = 1
    LEFT JOIN sys.index_columns ind_col ON ind_col.object_id = OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME) 
        AND ind_col.column_id = COLUMNPROPERTY(OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME), c.COLUMN_NAME, 'ColumnId') AND ind_col.index_id = 1
    LEFT JOIN sys.indexes ind ON ind.index_id = 1 AND ind.object_id = ind_col.object_id 
    WHERE 
        TABLE_TYPE='BASE TABLE' AND 
        CONCAT(t.TABLE_SCHEMA, '.', t.TABLE_NAME) = '${tableName}'
    ORDER BY c.COLUMN_NAME
        `;
    },

    /**
     * @return {string}
     */
    createTableQuery: (tableName, fields) => {
        let fieldsStr = '';
        for (let i in fields) {
            const field = fields[i];
            if (fieldsStr !== '') {
                fieldsStr += ', ';
            }
            fieldsStr += ' ' + field.column + ' ' + field.type;
            if (field.hasIdentity) {
                fieldsStr += ' identity ';
            }
            if (field.isPk && field.index) {
                fieldsStr += ' constraint ' + field.index + ' primary key nonclustered ';
            }
        }
        return `CREATE TABLE ${tableName} (${fieldsStr})`;
    },

    /**
     * @return {string}
     */
    dropTable: (tableName) => {
        return `DROP TABLE ${tableName}`;
    },

    /**
     * @param {string} tableName
     * @return {string}
     */
    getReferences: (tableName) => {
        return `SELECT 
        OBJECT_NAME(f.parent_object_id) table_name,
        COL_NAME(fc.parent_object_id,fc.parent_column_id) column_name,
        f.name as reference_name,
        OBJECT_NAME(f.referenced_object_id) reference_table_name,
        COL_NAME(f.referenced_object_id, fc.referenced_column_id) reference_column_name
     FROM 
        sys.foreign_keys AS f
     INNER JOIN 
        sys.foreign_key_columns AS fc 
           ON f.OBJECT_ID = fc.constraint_object_id
     INNER JOIN 
        sys.tables t 
           ON t.OBJECT_ID = fc.referenced_object_id
     WHERE 
        OBJECT_NAME (f.referenced_object_id) = '${tableName}'`;
    },

    /**
     * @param reference {{ table_name: string, reference_name: string }}
     * @return {string}
     */
    dropReference: (reference) => {
        return `ALTER TABLE ${reference.table_name} DROP CONSTRAINT ${reference.reference_name}`;
    },

    /**
     * @param reference {{ table_name: string, reference_name: string, column_name: string, reference_table_name: string, reference_column_name: string }}
     * @return {string}
     */
    createReference: (reference) => {
        // ALTER TABLE Table1 ADD CONSTRAINT fk_constraint1 FOREIGN KEY (field1) REFERENCES Table2 (field2);
        return `ALTER TABLE ${reference.table_name} 
        ADD CONSTRAINT ${reference.reference_name} 
        FOREIGN KEY (${reference.column_name}) 
        REFERENCES ${reference.reference_table_name} (${reference.reference_column_name})`;
    },

    /**
     * @param tableName
     * @return {string}
     */
    checkIfTableExist: (tableName) => {
        return `SELECT count(t.TABLE_NAME) c FROM INFORMATION_SCHEMA.TABLES t WHERE TABLE_NAME = '${tableName}'`;
    }
};

module.exports = MsSqlQueryHelper;
