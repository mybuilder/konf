import readKongApi from './readKongApi';
import {pretty} from './prettyConfig';
import adminApi from './adminApi';
import {repeatableOptionCallback} from './utils';
import {addSchemasFromOptions} from './consumerCredentials';
import colors from 'colors';

import program from 'commander';


program
    .version(require("../package.json").version)
    .option('-f, --format <value>', 'Export format [screen, json, yaml] (default: yaml)', /^(screen|json|yaml|yml)$/, 'yaml')
    .option('--host <value>', 'Kong admin host (default: localhost:8001)', 'localhost:8001')
    .option('--https', 'Use https for admin API requests')
    .option('--ignore-consumers', 'Ignore consumers in kong')
    .option('--credential-schema <value>', 'Add custom auth plugin in <name>:<key> format. Ex: custom_jwt:key. Repeat option for multiple custom plugins', repeatableOptionCallback, [])
    .parse(process.argv);

if (!program.host) {
    console.log('--host to the kong admin is required e.g. localhost:8001'.red);
    process.exit(1);
}

try {
    addSchemasFromOptions(program.credentialSchema);
} catch(e){
    console.log(e.message.red);
    process.exit(1);
}

readKongApi(adminApi({ host: program.host, https: program.https, ignoreConsumers: program.ignoreConsumers }))
    .then(results => {
        return {host: program.host, https: program.https, ...results};
    })
    .then(pretty(program.format))
    .then(config => {
        process.stdout.write(config + '\n');
    })
    .catch(error => {
        console.log(`${error}`.red, '\n', error.stack);
        process.exit(1);
    });
