const mongodbBackup = require('mongodb-backup');
const MongoURI = require('mongo-uri');
const mongodbRestore = require('mongodb-restore');
const { join } = require('path');
const moment = require('moment');

// eslint-disable-next-line import/no-dynamic-require
// const { uri: conn_string } = require(resolve('config')).db;

/**
 * Backup a database
 * @controller Backup
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.backup = async function backup(req, res) {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // get the URI
  // const conn_uri = MongoURI.parse(conn_string);
  // const db_name = req.params.dbName;

  // const uri = conn_string;

  // kick off the backup
  mongodbBackup({
    uri: 'mongodb://localhost:27017/app-dev',
    root: join(__dirname, '../backups'),
    tar: `${moment(new Date()).format('YYYYMMDD-HHmmss')}.tar.gz`,
    callback(err) {
      if (err) {
        console.error(`Backup DB error: ${err}`);
        res.status(400).json({ message: req.t('Unable to backup database') });
      } else {
        res.status(200).json({ message: req.t('Database successfully backed up') });
      }
    },
  });
};

/**
 * Restore a database
 * @controller Restore
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.restore = async function restore(req, res) {
  const connection_list = req.app.locals.dbConnections;
  let dropTarget = false;
  if (req.body.dropTarget === true || req.body.dropTarget === false) {
    dropTarget = req.body.dropTarget;
  }

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ message: req.t('Invalid connection') });
  }

  // get the URI
  const conn_uri = MongoURI.parse(connection_list[req.params.conn].connString);
  const db_name = req.params.db;

  let uri = connection_list.Local.connString;

  // add DB to URI if not present
  if (!conn_uri.database) {
    uri = `${uri}/${db_name}`;
  }

  // kick off the restore
  mongodbRestore({
    uri,
    root: join(__dirname, '../backups', db_name),
    drop: dropTarget,
    callback(err) {
      if (err) {
        console.error(`Restore DB error: ${err}`);
        res.status(400).json({ message: req.t('Unable to restore database') });
      } else {
        res.status(200).json({ message: req.t('Database successfully restored') });
      }
    },
  });
};
