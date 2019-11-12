const MongoURI = require('mongo-uri');
const { resolve } = require('path');

const common = require('./common.server.controller');
const bsonify = require('./bsonify.server.controller');

const { render } = require('../helpers/utils.server.helper');

// eslint-disable-next-line import/no-dynamic-require
const { uri: conn_string } = require(resolve('config')).db;

/**
 * Show server monitoring
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.monitoring = async function monitoring(req, res) {
  let monitoringMessage = '';
  let monitoringRequired = true;
  if (req.nconf.app.get('app:monitoring') === false) {
    monitoringRequired = false;
    monitoringMessage = 'Monitoring has been switched off in the config. Please enable or remove if you want this feature.';
  }

  render(req, res, 'monitoring', {
    message: monitoringMessage,
    monitoring: monitoringRequired,
  });
};

/**
 * The base connection route showing all DB's for connection
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.home = async function home(req, res) {
  // parse the connection string to get DB
  const uri = MongoURI.parse(conn_string);

  // Get DB's form pool
  const mongo_db = req.params.conn;

  common.get_db_status(mongo_db.db, (e1, db_status) => {
    common.get_backups((e2, backup_list) => {
      common.get_db_stats(mongo_db, null, (e3, db_stats) => {
        common.get_sidebar_list(mongo_db, null, (e4, sidebar_list) => {
          common.get_db_list({}, mongo_db.db, (e5, db_list) => {
            render(req, res, 'conn', {
              conn_name: 'local',
              db_stats,
              db_status,
              sidebar_list,
              db_list,
              backup_list,
              db_name: uri.database,
              session: req.session,
            });
          });
        });
      });
    });
  });
};

/**
 * The base route at the DB level showing all collections for DB
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.dbHome = async function dbHome(req, res) {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }
  // Get DB's form pool
  const mongo_db = req.params.conn;
  const { db } = mongo_db.useDb(req.params.dbName);

  // do DB stuff
  common.get_db_stats(mongo_db, req.params.dbName, (e1, db_stats) => {
    common.get_sidebar_list(mongo_db, req.params.dbName, (e2, sidebar_list) => {
      db.command({ usersInfo: 1 }, (e3, conn_users) => {
        db.listCollections().toArray((e4, collection_list) => {
          render(req, res, 'db', {
            conn_name: 'local',
            db_stats,
            conn_users,
            coll_list: common.cleanCollections(collection_list),
            db_name: req.params.dbName,
            show_db_name: true,
            sidebar_list,
            session: req.session,
          });
        });
      });
    });
  });
};

/**
 * Pagination redirect to page 1
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.collectionPage = async function collectionPage(req, res) {
  res.redirect(`${req.app_context}/app/${req.params.dbName}/${req.params.collectionName}/view/1`);
};

/**
 * Pagination redirect to page 1
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.viewCollection = async function viewCollection(req, res) {
  res.redirect(`${req.app_context}/app/${req.params.dbName}/${req.params.collectionName}/view/1`);
};

/**
 * Shows the document preview/pagination
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.view = async function view(req, res) {
  const docs_per_page = 5;

  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn;
  const { db } = mongo_db.useDb(req.params.dbName);

  // do DB stuff
  db.listCollections().toArray((err, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    common.get_sidebar_list(mongo_db, req.params.dbName, (e1, sidebar_list) => {
      db.collection(req.params.collectionName)
        .estimatedDocumentCount({}, (e2, coll_count) => {
          if (cl.indexOf(req.params.collectionName) === -1) {
            common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
          } else {
            render(req, res, 'coll-view', {
              conn_name: 'local',
              db_name: req.params.dbName,
              coll_name: req.params.collectionName,
              coll_count,
              page_num: req.query.page_num || '1',
              key_val: req.query.key_val,
              value_val: req.query.value_val,
              sidebar_list,
              docs_per_page,
              paginate: true,
              editor: true,
              session: req.session,
            });
          }
        });
    });
  });
};

/**
 * Show all indexes for collection
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.indexes = async function indexes(req, res) {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn;
  const { db } = mongo_db.useDb(req.params.dbName);

  // do DB stuff
  db.listCollections().toArray((e1, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    db.collection(req.params.collectionName).indexes((e2, coll_indexes) => {
      common.get_sidebar_list(mongo_db, req.params.dbName, (e3, sidebar_list) => {
        if (cl.indexOf(req.params.collectionName) === -1) {
          console.error('No collection found');
          common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
        } else {
          render(req, res, 'coll-indexes', {
            coll_indexes,
            db_name: req.params.dbName,
            coll_name: req.params.collectionName,
            sidebar_list,
            editor: true,
            session: req.session,
          });
        }
      });
    });
  });
};

/**
 * New document view
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.newDoc = async function newDoc(req, res) {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB form pool
  const mongo_db = req.params.conn;
  const { db } = mongo_db.useDb(req.params.dbName);

  // do DB stuff
  db.listCollections().toArray((e1, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    common.get_sidebar_list(mongo_db, req.params.dbName, (e2, sidebar_list) => {
      if (cl.indexOf(req.params.collectionName) === -1) {
        console.error('No collection found');
        common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
      } else {
        render(req, res, 'coll-new', {
          conn_name: 'local',
          coll_name: req.params.collectionName,
          sidebar_list,
          db_name: req.params.dbName,
          editor: true,
          session: req.session,
        });
      }
    });
  });
};

/**
 * Shows the document preview/pagination
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.showDoc = async function showDoc(req, res) {
  const docs_per_page = 5;

  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB form pool
  const mongo_db = req.params.conn;
  const { db } = mongo_db.useDb(req.params.dbName);

  // do DB stuff
  db.listCollections().toArray((e1, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    common.get_sidebar_list(mongo_db, req.params.dbName, (e2, sidebar_list) => {
      db
        .collection(req.params.collectionName)
        .countDocuments((e3, coll_count) => {
          if (cl.indexOf(req.params.collectionName) === -1) {
            common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
          } else {
            render(req, res, 'doc-view', {
              db_name: req.params.dbName,
              coll_name: req.params.collectionName,
              coll_count,
              doc_id: req.params.dBrowserDocId,
              key_val: req.params.key_val,
              value_val: req.params.value_val,
              sidebar_list,
              docs_per_page,
              paginate: true,
              editor: true,
              session: req.session,
            });
          }
        });
    });
  });
};

/**
 * Shows document editor
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.editDoc = async function editDoc(req, res) {
  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn;
  const { db } = mongo_db.useDb(req.params.dbName);

  // do DB stuff
  common.get_sidebar_list(mongo_db, req.params.dbName, (e1, sidebar_list) => {
    common.get_id_type(db, req.params.collectionName, req.params.dBrowserDocId, (e2, result) => {
      if (result.doc === undefined) {
        console.error('No document found');
        common.render_error(res, req, req.t('Document not found'), req.params.conn);
        return;
      }
      if (e2) {
        console.error('No document found');
        common.render_error(res, req, req.t('Document not found'), req.params.conn);
        return;
      }

      const images = [];
      const videos = [];
      const audio = [];

      Object.keys(result.doc).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(result.doc, key)) {
          return null;
        }

        const value = result.doc[key];

        switch (true) {
          case value.toString().substring(0, 10) === 'data:image':
            images.push({ field: key, src: value });
            break;
          case value.toString().substring(0, 10) === 'data:video':
            videos.push({ field: key, src: value });
            break;
          case value.toString().substring(0, 10) === 'data:audio':
            audio.push({ field: key, src: value });
            break;
          default:
            break;
        }

        return true;
      });

      render(req, res, 'coll-edit', {
        db_name: req.params.dbName,
        sidebar_list,
        coll_name: req.params.collectionName,
        coll_doc: bsonify.stringify(result.doc, null, '    '),
        editor: true,
        images_fields: images,
        video_fields: videos,
        audio_fields: audio,
        session: req.session,
      });
    });
  });
};
