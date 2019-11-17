/**
 * Create new database
 * @controller Create
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.create = async function create(req, res) {
  const { dbName } = req.params;
  // check for valid DB name
  if (dbName.indexOf(' ') >= 0 || dbName.indexOf('.') >= 0) {
    res.status(400).json({ msg: req.t('Invalid database name') });
    return;
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(dbName);

  // adding a new collection to create the DB
  mongo_db.collection('test').insertOne({}, (err) => {
    if (err) {
      console.error(`Error creating database: ${err}`);
      res.status(400).json({ msg: `${req.t('Error creating database')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('Database successfully created') });
    }
  });
};

/**
 * Remove a, existing database
 * @controller Remove
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.remove = async function remove(req, res) {
  const { dbName } = req.params;

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(dbName);

  // delete a collection
  mongo_db.dropDatabase((err) => {
    if (err) {
      console.error(`Error deleting database: ${err}`);
      res.status(400).json({ msg: `${req.t('Error deleting database')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('Database successfully deleted'), db_name: dbName });
    }
  });
};
