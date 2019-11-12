const common = require('./common.server.controller');

/**
 * Create a new collection
 * @controller Create
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.create = async function create(req, res) {
  const { dbName, collectionName } = req.params;
  // Validate database name
  if (!dbName || dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Validate collection name
  if (!collectionName || collectionName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid collection name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);

  // adding a new collection
  mongo_db.createCollection(collectionName, (err) => {
    if (err) {
      console.error(`Error creating collection: ${err}`);
      res.status(400).json({ msg: `${req.t('Error creating collection')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('Collection successfully created') });
    }
  });
};

/**
 * Rename an existing collection
 * @controller Rename
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.rename = async function rename(req, res) {
  const { dbName, collectionName } = req.params;
  const { newName } = req.body;
  // Validate database name
  if (!dbName || dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Validate collection name
  if (!newName || typeof newName !== 'string' || newName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid collection name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(dbName);

  // change a collection name
  mongo_db
    .collection(collectionName)
    .rename(
      newName,
      { dropTarget: false },
      (err) => {
        if (err) {
          console.error(`Error renaming collection: ${err}`);
          res.status(400).json({ msg: `${req.t('Error renaming collection')}: ${err}` });
        } else {
          res.status(200).json({ msg: req.t('Collection successfully renamed') });
        }
      },
    );
};

/**
 * Delete a collection
 * @controller Delete
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.remove = async function remove(req, res) {
  const { dbName, collectionName } = req.params;
  // Validate database name
  if (!dbName || dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(dbName);

  // delete a collection
  mongo_db.dropCollection(collectionName, (err) => {
    if (err) {
      console.error(`Error deleting collection: ${err}`);
      res.status(400).json({ msg: `${req.t('Error deleting collection')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('Collection successfully deleted'), coll_name: req.body.collection_name });
    }
  });
};

/**
 * Exports a collection
 * @controller Export
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.exportCollection = async function exportCollection(req, res) {
  // exclude _id from export
  let exportID = {};
  if (req.query.excludeID === 'true') {
    exportID = { _id: 0 };
  }

  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);

  mongo_db.collection(req.params.collectionName).find({}, exportID).toArray((err, data) => {
    if (data !== '') {
      res.set({ 'Content-Disposition': `attachment; filename=${req.params.collectionName}.json` });
      res.send(JSON.stringify(data, null, 2));
    } else {
      common.render_error(res, req, req.t('Export error: Collection not found'), req.params.conn);
    }
  });
};

/**
 * Create a new collection index
 * @controller Create Index
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.createIndex = async function createIndex(req, res) {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);
  let indexData = {};

  try {
    indexData = JSON.parse(req.body[0]);
  } catch (e) {
    console.error(`Error creating index: ${e.message}`);
  }

  // adding a new collection
  const unique_bool = (req.body[1] === 'true');
  const sparse_bool = (req.body[2] === 'true');
  const options = { unique: unique_bool, background: true, sparse: sparse_bool };
  mongo_db
    .collection(req.params.collectionName)
    .createIndex(
      indexData,
      options,
      (err) => {
        if (err) {
          console.error(`Error creating index: ${err}`);
          res.status(400).json({ msg: `${req.t('Error creating Index')}: ${err}` });
        } else {
          res.status(200).json({ msg: req.t('Index successfully created') });
        }
      },
    );
};

/**
 * Drops an existing collection index
 * @controller Dropn Index
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.dropIndex = async function dropIndex(req, res) {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);

  // adding a new index
  mongo_db.collection(req.params.collectionName).indexes((err, indexes) => {
    if (indexes.length <= req.body.index) {
      return res.status(400).json({ msg: `${req.t('Error dropping Index')}: index > ${indexes.length - 1}` });
    }

    return mongo_db
      .collection(req.params.collectionName)
      .dropIndex(indexes[req.body.index].name, (e) => {
        if (e) {
          console.error(`Error dropping Index: ${e}`);
          res.status(400).json({ msg: `${req.t('Error dropping Index')}: ${e}` });
        } else {
          res.status(200).json({ msg: req.t('Index successfully dropped') });
        }
      });
  });
};
