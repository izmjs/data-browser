const { resolve } = require('path');
const { promisify } = require('util');
const { writeFile, exists } = require('fs');

const exists$ = promisify(exists);
const writeFile$ = promisify(writeFile);

module.exports = async () => {
  const p = resolve(__dirname, '../data/dbStats.db~');
  const isExist = await exists$(p);

  if (!isExist) {
    try {
      writeFile$(p, '', { encoding: 'utf8' });
    } catch (e) {
      console.info('Impossible to remove dbStats.db~. Please remove it manually');
    }
  }

  return true;
};
