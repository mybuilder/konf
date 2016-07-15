import execute from './core';
import adminApi from './adminApi';
import colors from 'colors';
import configLoader from './configLoader';
import {repeatableOptionCallback} from './utils';
import {addSchemasFromOptions, addSchemasFromConfig} from './consumerCredentials';

import program from 'commander';

program
    .version(require("../package.json").version)
    .option('--path <value>', 'Path to the configuration file')
    .option('--host <value>', 'Kong admin host (default: localhost:8001)')
    .option('--https', 'Use https for admin API requests')
    .option('--no-cache', 'Do not cache kong state in memory')
    .option('--ignore-consumers', 'Do not sync consumers')
    .option('--credential-schema <value>', 'Add custom auth plugin in <name>:<key> format. Ex: custom_jwt:key. Repeat option for multiple custom plugins', repeatableOptionCallback, [])
    .parse(process.argv);

if (!program.path) {
    console.log('--path to the config file is required'.red);
    process.exit(1);
}

try{
    addSchemasFromOptions(program.credentialSchema)
}catch(e){
    console.log(e.message.red)
    process.exit(1);
}

let config = configLoader(program.path);
let host = program.host || config.host || 'localhost:8001';
let https = program.https || config.https || false;
let ignoreConsumers = program.ignoreConsumers || !config.consumers || config.consumers.length === 0 || false;
let cache = program.cache;

if (!host) {
    console.log('Kong admin host must be specified in config or --host'.red);
    process.exit(1);
}

if (ignoreConsumers) {
    config.consumers = [];
}
else {
  try{
      addSchemasFromConfig(config);
  }catch(e){
      console.log(e.message.red)
      process.exit(1);
  }
}

console.log(`Apply config to ${host}`.green);

execute(config, adminApi({host, https, ignoreConsumers, cache}))
  .catch(error => {
      console.log(`${error}`.red, '\n', error.stack);
      process.exit(1);
  });
