/* eslint-disable no-underscore-dangle */
const ejson = require('mongodb-extended-json');

const common = require('./common.server.controller');

/**
 * Inserts a new document
 * @controller Insert
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.insert_doc = (req, res) => {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);
  let eJsonData;

  try {
    eJsonData = ejson.parse(req.body.objectData);
  } catch (e) {
    console.error(`Syntax error: ${e}`);
    res.status(400).json({ msg: req.t('Syntax error. Please check the syntax') });
    return;
  }

  // if it's like an array of documents, we "insertMany"
  if (eJsonData && eJsonData.length) {
    mongo_db.collection(req.params.collectionName).insertMany(eJsonData, (err, docs) => {
      if (err || docs.ops === undefined) {
        console.error('Error inserting documents', err);
        res.status(400).json({ msg: req.t('Error inserting documents') });
      } else {
        // get the first inserted doc
        let dataReturn = '';
        if (docs.ops) {
          dataReturn = docs.ops[0]._id;
        }
        res.status(200).json({ msg: req.t('Documents successfully added'), doc_id: dataReturn });
      }
    });
  } else {
    // just the one document it seems so we call "save"
    mongo_db.collection(req.params.collectionName).insertOne(eJsonData, (err, docs) => {
      if (err || docs.ops === undefined) {
        console.error('Error inserting document', err);
        res.status(400).json({ msg: req.t('Error inserting document') });
      } else {
        let dataReturn = '';
        if (docs.ops) {
          dataReturn = docs.ops[0]._id;
        }
        res.status(200).json({ msg: req.t('Document successfully added'), doc_id: dataReturn });
      }
    });
  }
};

/**
 * Edits/updates an existing document
 * @controller Edit
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.edit_doc = (req, res) => {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);
  let eJsonData;

  try {
    eJsonData = ejson.parse(req.body.objectData);
  } catch (e) {
    console.error(`Syntax error: ${e}`);
    res.status(400).json({ msg: req.t('Syntax error. Please check the syntax') });
    return;
  }

  mongo_db.collection(req.params.collectionName).update(eJsonData, (err, doc) => {
    if (err) {
      console.error(`Error updating document: ${err}`);
      res.status(400).json({ msg: `${req.t('Error updating document')}: ${err}` });
    } else if (doc.nModified === 0) {
      console.error('Error updating document: Document ID is incorrect');
      res.status(400).json({ msg: req.t('Error updating document: Syntax error') });
    } else {
      res.status(200).json({ msg: req.t('Document successfully updated') });
    }
  });
};

/**
 * Deletes a document or set of documents based on a query
 * @controller Delete
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.mass_delete = (req, res) => {
  let query_obj = {};
  let validQuery = true;
  if (req.body.query) {
    try {
      query_obj = ejson.parse(req.body.query);
    } catch (e) {
      validQuery = false;
      query_obj = {};
    }
  }

  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);

  if (validQuery) {
    mongo_db.collection(req.params.collectionName).remove(query_obj, true, (err, docs) => {
      if (err || docs.result.n === 0) {
        console.error(`Error deleting document(s): ${err}`);
        res.status(400).json({ msg: `${req.t('Error deleting document(s)')}: ${req.t('Invalid query specified')}` });
      } else {
        res.status(200).json({ msg: req.t('Document(s) successfully deleted') });
      }
    });
  } else {
    res.status(400).json({ msg: `${req.t('Error deleting document(s)')}: ${req.t('Invalid query specified')}` });
  }
};

/**
 * Deletes a document
 * @controller Delete
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.doc_delete = (req, res) => {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);
  common.get_id_type(mongo_db, req.params.collectionName, req.body.doc_id, (err, result) => {
    if (result.doc) {
      mongo_db
        .collection(req.params.collectionName)
        .remove({ _id: result.doc_id_type }, true, (e, docs) => {
          if (e || docs.result.n === 0) {
            console.error(`Error deleting document: ${e}`);
            res.status(400).json({ msg: `${req.t('Error deleting document')}: ${req.t('Cannot find document by Id')}` });
          } else {
            res.status(200).json({ msg: req.t('Document successfully deleted') });
          }
        });
    } else {
      console.error(`Error deleting document: ${err}`);
      res.status(400).json({ msg: req.t('Cannot find document by Id') });
    }
  });
};
