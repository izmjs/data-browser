const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const nconf = require('nconf');

const dir_config = join(__dirname, '../data/');
const config_connections = join(dir_config, 'config.json');
const config_app = join(dir_config, 'app.json');

module.exports = async () => {
  if (
    !existsSync(config_connections)
    || readFileSync(config_connections, 'utf8') === '{}'
  ) {
    writeFileSync(config_connections, JSON.stringify({
      connections: {},
    }));
  }

  if (
    !existsSync(config_app, 'utf8')
    || readFileSync(config_app, 'utf8') === ''
  ) {
    writeFileSync(config_app, '{}', 'utf8');
  }

  nconf.add('connections', { type: 'file', file: config_connections });
  nconf.add('app', { type: 'file', file: config_app });
};
