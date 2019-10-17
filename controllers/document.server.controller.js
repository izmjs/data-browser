/* eslint-disable no-underscore-dangle */
const express = require('express');
const ejson = require('mongodb-extended-json');

const router = express.Router();

const common = require('./common.server.controller');

// Inserts a new document
router.post('/document/:conn/:db/:coll/insert_doc', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ msg: req.t('Invalid connection name') });
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);
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
    mongo_db.collection(req.params.coll).insertMany(eJsonData, (err, docs) => {
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
    mongo_db.collection(req.params.coll).save(eJsonData, (err, docs) => {
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
});

// Edits/updates an existing document
router.post('/document/:conn/:db/:coll/edit_doc', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ msg: req.t('Invalid connection name') });
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);
  let eJsonData;

  try {
    eJsonData = ejson.parse(req.body.objectData);
  } catch (e) {
    console.error(`Syntax error: ${e}`);
    res.status(400).json({ msg: req.t('Syntax error. Please check the syntax') });
    return;
  }

  mongo_db.collection(req.params.coll).save(eJsonData, (err, doc) => {
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
});

// Deletes a document or set of documents based on a query
router.post('/document/:conn/:db/:coll/mass_delete', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ msg: req.t('Invalid connection name') });
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

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

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  if (validQuery) {
    mongo_db.collection(req.params.coll).remove(query_obj, true, (err, docs) => {
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
});

// Deletes a document
router.post('/document/:conn/:db/:coll/doc_delete', (req, res) => {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ msg: req.t('Invalid connection name') });
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);
  common.get_id_type(mongo_db, req.params.coll, req.body.doc_id, (err, result) => {
    if (result.doc) {
      mongo_db
        .collection(req.params.coll)
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
});

module.exports = router;
