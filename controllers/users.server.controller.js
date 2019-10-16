const express = require('express');

const router = express.Router();
const common = require('./common.server.controller');

// runs on all routes and checks password if one is setup
router.all('/users/*', common.checkLogin, (req, res, next) => {
  next();
});

// Creates a new user
router.post('/users/:conn/:db/user_create', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ msg: req.t('Invalid connection') });
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // do DB stuff
  const roles = req.body.roles_text ? req.body.roles_text.split(/\s*,\s*/) : [];

  // Add a user
  mongo_db.addUser(req.body.username, req.body.user_password, { roles }, (err) => {
    if (err) {
      console.error(`Error creating user: ${err}`);
      res.status(400).json({ msg: `${req.t('Error creating user')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('User successfully created') });
    }
  });
});

// Deletes a user
router.post('/users/:conn/:db/user_delete', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ msg: req.t('Invalid connection') });
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // remove a user
  mongo_db.removeUser(req.body.username, (err) => {
    if (err) {
      console.error(`Error deleting user: ${err}`);
      res.status(400).json({ msg: `${req.t('Error deleting user')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('User successfully deleted') });
    }
  });
});

module.exports = router;
