# nodejs-yaml-fixtures

## Command
```
$ node index.js

Usage:
-m help // this help
-m view --table=%table_name% --top=%number_of_top_rows% // view some rows at the top of table
-m load -f %fixture_name% // load fixture
-m diff --source %source_db_config% // get difference between databases
-m pull --source %source_db_config% --table %table_name% // load table structure from source database and apply to local database
```
* `node index.js -m help` - show this help
* `node index.js -m view --table=dbo.Prices` - show top rows from table *dbo.Prices*
* `node index.js -m load -f access_tests/Users.yml` - load fixture from `<config_fixture_dir>/access_tests/Users.yml` and its dependencies
* `node index.js -m diff --source=config.source.yml` - connects to databases from config.yml (as current) and config.source.yml (as source) and compares tables, columns and its types
* `node index.js -m pull --source=config.source.yml --table=dbo.Catalog` - drop table *dbo.Catalog* (and referenced constraints) in current database and create it according to source database table structure (some references may be lost)

## Config template
```yaml
# config.yml or config.source.yml
db:
  driver: mssql #allow only that database
  server: 'MSSQL_SERVER' 
  database: 'your_datebase'
  user: 'db_user'
  password: 'user_passwoer'
  options:
    reuseConnection: true
fixtures:
  path: 'fixtures/' #base dir for your fixtures
```

## Fixture template
```yaml
table: <fixture_table_name>
pk:
  <primary_key_field(s)>
auto_increment: true/false
data:
  - 
    <field1>: <value1>
    <field2>: <value2>
  -
    ...
dependencies:
  -
    <fixtures_that_loads_before>
relations:
  -
    <fixtures_that_loads_after>
```

