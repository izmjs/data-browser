const _ = require('lodash');
const { readdir } = require('fs');
const { join, resolve } = require('path');
const { promisify } = require('util');
const { not } = require('junk');

const readdir$ = promisify(readdir);

/**
 * gets some db stats
 * @param {Object} mongo_db MongoDB client
 */
exports.get_db_status = async (mongo_db) => {
  const adminDb = mongo_db.admin();
  const serverStatus$ = promisify(adminDb.serverStatus);

  const status = await serverStatus$();
  return status;
};

/**
 * gets the backup dirs
 */
exports.get_backups = async () => {
  const backupPath = join(__dirname, '../backups');

  const files = await readdir$(backupPath);
  return files.filter(not);
};

/**
 * gets the db stats
 */
exports.get_db_stats = async (mongo_db, db_name, cb) => {
  const db_obj = {};

  // if at connection level we loop db's and collections
  if (db_name == null) {
    const adminDb = mongo_db.admin();
    adminDb.listDatabases((err, db_list) => {
      if (err) {
        cb('User is not authorised', null);
        return;
      }
      if (db_list !== undefined) {
        // const ordered = exports.order_object(db_list.databases);
        // Object.keys(ordered).forEach(async (key) => {
        //   const value = ordered[key];
        //   const skipped_dbs = ['null', 'admin', 'local'];

        //   if(skipped_dbs.includes) {
        //     return;
        //   }

        //   const tempDBName = value.name;
        //   const toArray$ = promisify(mongo_db.db(tempDBName).listCollections().toArray);

        //   const coll_list = await toArray$();
        //   const coll_obj = {};
        // });
        async.forEachOf(exports.order_object(db_list.databases), (value, key, callback) => {
          exports.order_object(db_list.databases);
          const skipped_dbs = ['null', 'admin', 'local'];
          if (skipped_dbs.indexOf(value.name) === -1) {
            const tempDBName = value.name;
            mongo_db.db(tempDBName).listCollections().toArray((err, coll_list) => {
              const coll_obj = {};
              async.forEachOf(exports.cleanCollections(coll_list), (value, key, callback) => {
                mongo_db.db(tempDBName).collection(value).stats((err, coll_stat) => {
                  coll_obj[value] = { Storage: coll_stat.size, Documents: coll_stat.count };
                  callback();
                });
              }, (err) => {
                if (err) console.error(err.message);
                // add the collection object to the DB object with the DB as key
                db_obj[value.name] = exports.order_object(coll_obj);
                callback();
              });
            });
          } else {
            callback();
          }
        }, (err) => {
          if (err) console.error(err.message);
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
    mongo_db.db(db_name).listCollections().toArray((err, coll_list) => {
      const coll_obj = {};
      async.forEachOf(exports.cleanCollections(coll_list), (value, key, callback) => {
        mongo_db.db(db_name).collection(value).stats((err, coll_stat) => {
          coll_obj[value] = {
            Storage: coll_stat ? coll_stat.size : 0,
            Documents: coll_stat ? coll_stat.count : 0,
          };

          callback();
        });
      }, (err) => {
        if (err) console.error(err.message);
        db_obj[db_name] = exports.order_object(coll_obj);
        cb(null, db_obj);
      });
    });
  }
};

// gets the Databases
exports.get_db_list = function get_db_list(uri, mongo_db, cb) {
  const async = require('async');
  const adminDb = mongo_db.admin();
  const db_arr = [];

  // if a DB is not specified in the Conn string we try get a list
  if (uri.database === undefined || uri.database === null) {
    // try go all admin and get the list of DB's
    adminDb.listDatabases((err, db_list) => {
      if (db_list !== undefined) {
        async.forEachOf(db_list.databases, (value, key, callback) => {
          const skipped_dbs = ['null', 'admin', 'local'];
          if (skipped_dbs.indexOf(value.name) === -1) {
            db_arr.push(value.name);
          }
          callback();
        }, (err) => {
          if (err) console.error(err.message);
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
    const { ObjectID } = require('mongodb');
    // if a valid ObjectId we try that, then then try as a string
    if (ObjectID.isValid(doc_id)) {
      mongo.collection(collection).findOne({ _id: ObjectID(doc_id) }, (err, doc) => {
        if (doc) {
          // doc_id is an ObjectId
          cb(null, { doc_id_type: ObjectID(doc_id), doc });
        } else {
          mongo.collection(collection).findOne({ _id: doc_id }, (err, doc) => {
            if (doc) {
              // doc_id is string
              cb(null, { doc_id_type: doc_id, doc });
            } else {
              cb('Document not found', { doc_id_type: null, doc: null });
            }
          });
        }
      });
    } else {
      // if the value is not a valid ObjectId value we try as an integer then as a last resort, a string.
      mongo.collection(collection).findOne({ _id: parseInt(doc_id) }, (err, doc) => {
        if (doc) {
          // doc_id is integer
          cb(null, { doc_id_type: parseInt(doc_id), doc });
        } else {
          mongo.collection(collection).findOne({ _id: doc_id }, (err, doc) => {
            if (doc) {
              // doc_id is string
              cb(null, { doc_id_type: doc_id, doc });
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
  const async = require('async');
  const db_obj = {};

  // if no DB is specified, we get all DBs and collections
  if (db_name == null) {
    const adminDb = mongo_db.admin();
    adminDb.listDatabases((err, db_list) => {
      if (db_list) {
        async.forEachOf(db_list.databases, (value, key, callback) => {
          const skipped_dbs = ['null', 'admin', 'local'];
          if (skipped_dbs.indexOf(value.name) === -1) {
            mongo_db.db(value.name).listCollections().toArray((err, collections) => {
              collections = exports.cleanCollections(collections);
              exports.order_array(collections);
              db_obj[value.name] = collections;
              callback();
            });
          } else {
            callback();
          }
        }, (err) => {
          if (err) console.error(err.message);
          cb(null, exports.order_object(db_obj));
        });
      } else {
        cb(null, exports.order_object(db_obj));
      }
    });
  } else {
    mongo_db.db(db_name).listCollections().toArray((err, collections) => {
      collections = exports.cleanCollections(collections);
      exports.order_array(collections);
      db_obj[db_name] = collections;
      cb(null, db_obj);
    });
  }
};

/**
 * order the object by alpha key
 * @param {Object} unordered The object to order
 */
exports.order_object = function order_object(unordered) {
  const ordered = {};
  if (unordered !== undefined) {
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
exports.order_array = (array) => {
  if (!Array.isArray(array)) {
    return array;
  }

  return array.sort((a, b) => {
    const A = a.toLowerCase();
    const B = b.toLowerCase();
    if (A === B) return 0;
    if (A > B) return 1;
    return -1;
  });
};

/**
 * render the error page
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Error} err The exception
 * @param {MongoConnection} conn MongDB connection
 */
exports.render_error = (res, req, err, conn) => {
  const connection_list = req.nconf.connections.get('connections');

  let conn_string = '';

  if (connection_list[conn] !== undefined) {
    conn_string = connection_list[conn].connection_string;
  }

  res.render(resolve(__dirname, 'views/error'), {
    message: err,
    conn,
    conn_string,
    connection_list: exports.order_object(connection_list),
    helpers: req.handlebars.helpers,
  });
};

/**
 * Clean the collection
 * @param {Array<Object>} collection_list The collectin list
 */
exports.cleanCollections = (collection_list) => collection_list.map((item) => item.name);
