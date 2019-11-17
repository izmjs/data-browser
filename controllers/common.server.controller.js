const fs = require('fs');
const junk = require('junk');
const async = require('async');
const { ObjectID } = require('mongodb');
const Datastore = require('nedb');
const mongoose = require('mongoose');
const { join } = require('path');
const nconf = require('nconf');
const { render } = require('../helpers/utils.server.helper');

exports.SYSTEM_DB = [
  'admin',
  'config',
  'null',
  'local',
];

// setup DB for server stats

const db = new Datastore({
  filename: join(__dirname, '../data/dbStats.db'),
  autoload: true,
});

/**
 * Init request params
 * @controller Init
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.init = async function init(req, res, next) {
  req.nconf = nconf.stores;
  req.db = db;
  req.params.conn = mongoose.connection;
  req.params.db = mongoose.connection.db;
  return next();
};

/**
 * gets some db stats
 * @param {Object} mongo_db MongoDB client
 */
exports.get_db_status = function get_db_status(mongo_db, cb) {
  const adminDb = mongo_db.admin();
  adminDb.serverStatus((err, status) => {
    if (err) {
      cb('Error', null);
    } else {
      cb(null, status);
    }
  });
};

/**
 * gets the backup dirs
 */
exports.get_backups = function get_backups(cb) {
  const backupPath = join(__dirname, '../backups');

  fs.readdir(backupPath, (err, files) => {
    cb(null, files.filter(junk.not));
  });
};

/**
 * gets the db stats
 */
exports.get_db_stats = function get_db_stats(mongo_db, db_name, cb) {
  const db_obj = {};

  // if at connection level we loop db's and collections
  if (db_name == null) {
    const adminDb = mongo_db.db.admin();
    adminDb.listDatabases((err, db_list) => {
      if (err) {
        cb('User is not authorised', null);
        return;
      }
      if (db_list !== undefined) {
        async.forEachOf(exports.order_object(db_list.databases), (value, key, callback) => {
          exports.order_object(db_list.databases);
          if (exports.SYSTEM_DB.indexOf(value.name) === -1) {
            const tempDBName = value.name;
            mongo_db.useDb(tempDBName).db.listCollections().toArray((e1, coll_list) => {
              const coll_obj = {};
              async.forEachOf(exports.cleanCollections(coll_list), (v1, k1, cb1) => {
                mongo_db.useDb(tempDBName).db.collection(v1).stats((e4, coll_stat) => {
                  coll_obj[v1] = { Storage: coll_stat.size, Documents: coll_stat.count };
                  cb1();
                });
              }, (e2) => {
                if (e2) console.error(e2.message);
                // add the collection object to the DB object with the DB as key
                db_obj[value.name] = exports.order_object(coll_obj);
                callback();
              });
            });
          } else {
            callback();
          }
        }, (e3) => {
          if (e3) console.error(e3.message);
          // wrap this whole thing up
          cb(null, exports.order_object(db_obj));
        });
      } else {
        // if doesnt have the access to get all DB's
        cb(null, null);
      }
    });
    // if at DB level, we just grab the collections below
  } else {
    mongo_db.useDb(db_name).db.listCollections().toArray((err, coll_list) => {
      const coll_obj = {};
      async.forEachOf(exports.cleanCollections(coll_list), (value, key, callback) => {
        mongo_db.useDb(db_name).db.collection(value).stats((e1, coll_stat) => {
          coll_obj[value] = {
            Storage: coll_stat ? coll_stat.size : 0,
            Documents: coll_stat ? coll_stat.count : 0,
          };

          callback();
        });
      }, (e2) => {
        if (e2) console.error(e2.message);
        db_obj[db_name] = exports.order_object(coll_obj);
        cb(null, db_obj);
      });
    });
  }
};

// gets the Databases
exports.get_db_list = function get_db_list(uri, mongo_db, cb) {
  const adminDb = mongo_db.admin();
  const db_arr = [];

  // if a DB is not specified in the Conn string we try get a list
  if (uri.database === undefined || uri.database === null) {
    // try go all admin and get the list of DB's
    adminDb.listDatabases((err, db_list) => {
      if (db_list !== undefined) {
        async.forEachOf(db_list.databases, (value, key, callback) => {
          if (exports.SYSTEM_DB.indexOf(value.name) === -1) {
            db_arr.push(value.name);
          }
          callback();
        }, (e1) => {
          if (e1) console.error(e1.message);
          exports.order_array(db_arr);
          cb(null, db_arr);
        });
      } else {
        cb(null, null);
      }
    });
  } else {
    cb(null, null);
  }
};

// Normally you would know how your ID's are stored in your DB. As the _id value which is used to handle
// all document viewing in adminMongo is a parameter we dont know if it is an ObjectId, string or integer. We can check if
// the _id string is a valid MongoDb ObjectId but this does not guarantee it is stored as an ObjectId in the DB. It's most likely
// the value will be an ObjectId (hopefully) so we try that first then go from there
exports.get_id_type = function get_id_type(mongo, collection, doc_id, cb) {
  if (doc_id) {
    // if a valid ObjectId we try that, then then try as a string
    if (ObjectID.isValid(doc_id)) {
      mongo.collection(collection).findOne({ _id: ObjectID(doc_id) }, (err, doc) => {
        if (doc) {
          // doc_id is an ObjectId
          cb(null, { doc_id_type: ObjectID(doc_id), doc });
        } else {
          mongo.collection(collection).findOne({ _id: doc_id }, (e1, d) => {
            if (d) {
              // doc_id is string
              cb(null, { doc_id_type: doc_id, doc: d });
            } else {
              cb('Document not found', { doc_id_type: null, doc: null });
            }
          });
        }
      });
    } else {
      // if the value is not a valid ObjectId value we try as an integer then as a last resort, a string.
      mongo.collection(collection).findOne({ _id: parseInt(doc_id, 10) }, (err, doc) => {
        if (doc) {
          // doc_id is integer
          cb(null, { doc_id_type: parseInt(doc_id, 10), doc });
        } else {
          mongo.collection(collection).findOne({ _id: doc_id }, (e1, d) => {
            if (d) {
              // doc_id is string
              cb(null, { doc_id_type: doc_id, doc: d });
            } else {
              cb('Document not found', { doc_id_type: null, doc: null });
            }
          });
        }
      });
    }
  } else {
    cb(null, { doc_id_type: null, doc: null });
  }
};

// gets the Databases and collections
exports.get_sidebar_list = function get_sidebar_list(mongo_db, db_name, cb) {
  const db_obj = {};

  // if no DB is specified, we get all DBs and collections
  if (db_name == null) {
    const adminDb = mongo_db.db.admin();
    adminDb.listDatabases((err, db_list) => {
      if (db_list) {
        async.forEachOf(db_list.databases, (value, key, callback) => {
          if (exports.SYSTEM_DB.indexOf(value.name) === -1) {
            mongo_db.useDb(value.name).db.listCollections().toArray((e1, collections) => {
              const list = exports.cleanCollections(collections);
              exports.order_array(list);
              db_obj[value.name] = list;
              callback();
            });
          } else {
            callback();
          }
        }, (e2) => {
          if (e2) console.error(e2.message);
          cb(null, exports.order_object(db_obj));
        });
      } else {
        cb(null, exports.order_object(db_obj));
      }
    });
  } else {
    mongo_db.useDb(db_name).db.listCollections().toArray((err, collections) => {
      const list = exports.cleanCollections(collections);
      exports.order_array(list);
      db_obj[db_name] = list;
      cb(null, db_obj);
    });
  }
};

/**
 * order the object by alpha key
 * @param {Object} unordered The object to order
 */
exports.order_object = function order_object(unordered) {
  let ordered;
  if (unordered !== undefined) {
    ordered = {};
    const keys = Object.keys(unordered);
    exports.order_array(keys);
    keys.forEach((key) => {
      ordered[key] = unordered[key];
    });
  }
  return ordered;
};

/**
 * Sort the array
 * @param {Array<String>} array Array of strings to sort
 */
exports.order_array = function order_array(array) {
  if (array) {
    array.sort((a, b) => {
      const A = a.toLowerCase();
      const B = b.toLowerCase();
      if (A === B) return 0;
      if (A > B) return 1;
      return -1;
    });
  }
  return array;
};

/**
 * render the error page
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Error} err The exception
 * @param {MongoConnection} conn MongDB connection
 */
exports.render_error = function render_error(res, req, err, conn) {
  const connection_list = req.nconf.connections.get('connections');

  let conn_string = '';
  if (connection_list[conn] !== undefined) {
    conn_string = connection_list[conn].connection_string;
  }

  render(req, res, 'error', {
    message: err,
    conn,
    conn_string,
    connection_list: exports.order_object(connection_list),
  });
};

/**
 * Clean the collection
 * @param {Array<Object>} collection_list The collectin list
 */
exports.cleanCollections = (collection_list) => collection_list.map((item) => item.name);

/**
 * Validate the id of a document
 * @controller Validate Id
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.validateId = async function validateId(req, res, next, id) {
  if (ObjectID.isValid(id)) {
    return next();
  }

  return res.status(400).json({
    msg: req.t('INVALID_ID', { id }),
  });
};
