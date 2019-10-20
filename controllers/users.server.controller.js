/**
 * Creates a new user
 * @controller Create user
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.user_create = (req, res) => {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);
  const { db } = mongo_db;

  // do DB stuff
  const roles = req.body.roles_text ? req.body.roles_text.split(/\s*,\s*/) : [];
  // Add a user
  db.addUser(req.body.username, req.body.user_password, { roles }, (err) => {
    if (err) {
      console.error(`Error creating user: ${err}`);
      res.status(400).json({ msg: `${req.t('Error creating user')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('User successfully created') });
    }
  });
};

/**
 * Delete an existing user
 * @controller Delete user
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.user_delete = (req, res) => {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);
  const { db } = mongo_db;

  // remove a user
  db.removeUser(req.body.username, (err) => {
    if (err) {
      console.error(`Error deleting user: ${err}`);
      res.status(400).json({ msg: `${req.t('Error deleting user')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('User successfully deleted') });
    }
  });
};
