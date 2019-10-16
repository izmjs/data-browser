const express = require('express');
const mongodbBackup = require('mongodb-backup');
const MongoURI = require('mongo-uri');
const mongodbRestore = require('mongodb-restore');

const router = express.Router();
const path = require('path');

const common = require('./common.server.controller');

// runs on all routes and checks password if one is setup
router.all('/db/*', common.checkLogin, (req, res, next) => {
  next();
});

// create a new database
router.post('/database/:conn/db_create', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ message: req.t('Invalid connection') });
    return;
  }

  // check for valid DB name
  if (req.body.db_name.indexOf(' ') >= 0 || req.body.db_name.indexOf('.') >= 0) {
    res.status(400).json({ message: req.t('Invalid database name') });
    return;
  }

  // Get DB form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.body.db_name);

  // adding a new collection to create the DB
  mongo_db.collection('test').save({}, (err) => {
    if (err) {
      console.error(`Error creating database: ${err}`);
      res.status(400).json({ msg: `${req.t('Error creating database')}: ${err}` });
    } else {
      res.status(200).json({ message: req.t('Database successfully created') });
    }
  });
});

// delete a database
router.post('/database/:conn/db_delete', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ message: req.t('Invalid connection') });
  }

  // Get DB form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.body.db_name);

  // delete a collection
  mongo_db.dropDatabase((err) => {
    if (err) {
      console.error(`Error deleting database: ${err}`);
      res.status(400).json({ msg: `${req.t('Error deleting database')}: ${err}` });
    } else {
      res.status(200).json({ message: req.t('Database successfully deleted'), db_name: req.body.db_name });
    }
  });
});

// Backup a database
router.post('/database/:conn/:db/db_backup', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ message: req.t('Invalid connection') });
  }

  // get the URI
  const conn_uri = MongoURI.parse(connection_list[req.params.conn].connString);
  const db_name = req.params.db;

  let uri = connection_list[req.params.conn].connString;

  // add DB to URI if not present
  if (!conn_uri.database) {
    uri = `${uri}/${db_name}`;
  }

  // kick off the backup
  mongodbBackup({
    uri,
    root: path.join(__dirname, '../backups'),
    callback(err) {
      if (err) {
        console.error(`Backup DB error: ${err}`);
        res.status(400).json({ message: req.t('Unable to backup database') });
      } else {
        res.status(200).json({ message: req.t('Database successfully backed up') });
      }
    },
  });
});

// Restore a database
router.post('/database/:conn/:db/db_restore', (req, res) => {
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
    root: path.join(__dirname, '../backups', db_name),
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
});

module.exports = router;
