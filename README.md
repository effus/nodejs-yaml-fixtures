# nodejs-yaml-fixtures

## template
```
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