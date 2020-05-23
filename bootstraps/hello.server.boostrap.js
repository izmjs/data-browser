const { readFile } = require('fs');
const { promisify } = require('util');
const { resolve } = require('path');
const { renderString } = require('nunjucks');
const debug = require('debug')('modules:data-browser');

const readFile$ = promisify(readFile);
const SQUARE_LENGTH = 94;

function center(msg = '') {
  const spaces = ' '.repeat(parseInt((SQUARE_LENGTH - msg.length) / 2, 10));
  const text = `${spaces}${msg}${spaces}`;

  return `${text}${' '.repeat(SQUARE_LENGTH - text.length)}`;
}

module.exports = async ({ app: { secure, host, port } }) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const txt = await readFile$(resolve(__dirname, './hello.server.asset.txt'), {
    encoding: 'utf8',
  });


  const url = `http${secure && secure.ssl ? 's' : ''}://${host}:${port}`;

  renderString(txt, {
    message: `  |${center(`URL: ${url}/dbrowser/app`)}|`,
  }).split('\n').forEach((one) => debug(one));
};
