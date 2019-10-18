const MongoURI = require('mongo-uri');

const common = require('./common.server.controller');
const bsonify = require('./bsonify.server.controller');

const { render } = require('../helpers/utils.server.helper');

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
  const connection_list = req.app.locals.dbConnections;

  // if no connection found
  if (!connection_list || Object.keys(connection_list).length === 0) {
    res.redirect(`${req.app_context}/app`);
    return;
  }

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    common.render_error(res, req, req.t('Invalid connection name'), req.params.conn);
    return;
  }

  // parse the connection string to get DB
  const conn_string = connection_list[req.params.conn].connString;
  const uri = MongoURI.parse(conn_string);

  // If there is a DB in the connection string, we redirect to the DB level
  if (uri.database) {
    res.redirect(`${req.app_context}/app/${req.params.conn}/${uri.database}`);
    return;
  }

  // Get DB's form pool
  const mongo_db = req.params.db;

  common.get_db_status(mongo_db, (e1, db_status) => {
    common.get_backups((e2, backup_list) => {
      common.get_db_stats(mongo_db, uri.database, (e3, db_stats) => {
        common.get_sidebar_list(mongo_db, uri.database, (e4, sidebar_list) => {
          common.get_db_list(uri, mongo_db, (e5, db_list) => {
            res.render('conn', {
              conn_list: common.order_object(connection_list),
              db_stats,
              db_status,
              conn_name: req.params.conn,
              sidebar_list,
              db_list,
              backup_list,
              helpers: req.handlebars.helpers,
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
exports.func_name = async function funcName(req, res) {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    common.render_error(res, req, req.t('Invalid connection name'), req.params.conn);
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    common.render_error(res, req, req.t('Invalid database name'), req.params.conn);
    return;
  }
  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // do DB stuff
  common.get_db_stats(mongo_db, req.params.db, (e1, db_stats) => {
    common.get_sidebar_list(mongo_db, req.params.db, (e2, sidebar_list) => {
      mongo_db.command({ usersInfo: 1 }, (e3, conn_users) => {
        mongo_db.listCollections().toArray((e4, collection_list) => {
          res.render('db', {
            conn_name: req.params.conn,
            conn_list: common.order_object(connection_list),
            db_stats,
            conn_users,
            coll_list: common.cleanCollections(collection_list),
            db_name: req.params.db,
            show_db_name: true,
            sidebar_list,
            helpers: req.handlebars.helpers,
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
exports.func_name = async function funcName(req, res) {
  res.redirect(`${req.app_context}/app/${req.params.conn}/${req.params.db}/${req.params.coll}/view/1`);
};

/**
 * Pagination redirect to page 1
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.func_name = async function funcName(req, res) {
  res.redirect(`${req.app_context}/app/${req.params.conn}/${req.params.db}/${req.params.coll}/view/1`);
};

/**
 * Shows the document preview/pagination
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.func_name = async function funcName(req, res) {
  const connection_list = req.app.locals.dbConnections;
  const docs_per_page = 5;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    common.render_error(res, req, req.t('Invalid connection name'), req.params.conn);
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    common.render_error(res, req, req.t('Invalid database name'), req.params.conn);
    return;
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // do DB stuff
  mongo_db.listCollections().toArray((err, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    common.get_sidebar_list(mongo_db, req.params.db, (e1, sidebar_list) => {
      mongo_db.db(req.params.db).collection(req.params.coll).count((e2, coll_count) => {
        if (cl.indexOf(req.params.coll) === -1) {
          common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
        } else {
          res.render('coll-view', {
            conn_list: common.order_object(req.nconf.connections.get('connections')),
            conn_name: req.params.conn,
            db_name: req.params.db,
            coll_name: req.params.coll,
            coll_count,
            page_num: req.params.page_num,
            key_val: req.params.key_val,
            value_val: req.params.value_val,
            sidebar_list,
            docs_per_page,
            helpers: req.handlebars.helpers,
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
exports.func_name = async function funcName(req, res) {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    common.render_error(res, req, req.t('Invalid connection name'), req.params.conn);
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    common.render_error(res, req, req.t('Invalid database name'), req.params.conn);
    return;
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // do DB stuff
  mongo_db.listCollections().toArray((e1, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    mongo_db.collection(req.params.coll).indexes((e2, coll_indexes) => {
      common.get_sidebar_list(mongo_db, req.params.db, (e3, sidebar_list) => {
        if (cl.indexOf(req.params.coll) === -1) {
          console.error('No collection found');
          common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
        } else {
          res.render('coll-indexes', {
            coll_indexes,
            conn_list: common.order_object(connection_list),
            conn_name: req.params.conn,
            db_name: req.params.db,
            coll_name: req.params.coll,
            sidebar_list,
            helpers: req.handlebars.helpers,
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
exports.func_name = async function funcName(req, res) {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    common.render_error(res, req, req.t('Invalid connection name'), req.params.conn);
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    common.render_error(res, req, req.t('Invalid database name'), req.params.conn);
    return;
  }

  // Get DB form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // do DB stuff
  mongo_db.listCollections().toArray((e1, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    common.get_sidebar_list(mongo_db, req.params.db, (e2, sidebar_list) => {
      if (cl.indexOf(req.params.coll) === -1) {
        console.error('No collection found');
        common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
      } else {
        res.render('coll-new', {
          conn_name: req.params.conn,
          conn_list: common.order_object(connection_list),
          coll_name: req.params.coll,
          sidebar_list,
          db_name: req.params.db,
          helpers: req.handlebars.helpers,
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
exports.func_name = async function funcName(req, res) {
  const connection_list = req.app.locals.dbConnections;
  const docs_per_page = 5;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    common.render_error(res, req, req.t('Invalid connection name'), req.params.conn);
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    common.render_error(res, req, req.t('Invalid database name'), req.params.conn);
    return;
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // do DB stuff
  mongo_db.listCollections().toArray((e1, collection_list) => {
    // clean up the collection list
    const cl = common.cleanCollections(collection_list);
    common.get_sidebar_list(mongo_db, req.params.db, (e2, sidebar_list) => {
      mongo_db.db(req.params.db).collection(req.params.coll).count((e3, coll_count) => {
        if (cl.indexOf(req.params.coll) === -1) {
          common.render_error(res, req, 'Database or Collection does not exist', req.params.conn);
        } else {
          res.render('doc-view', {
            conn_list: common.order_object(req.nconf.connections.get('connections')),
            conn_name: req.params.conn,
            db_name: req.params.db,
            coll_name: req.params.coll,
            coll_count,
            doc_id: req.params.id,
            key_val: req.params.key_val,
            value_val: req.params.value_val,
            sidebar_list,
            docs_per_page,
            helpers: req.handlebars.helpers,
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
exports.func_name = async function funcName(req, res) {
  const connection_list = req.app.locals.dbConnections;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    common.render_error(res, req, req.t('Invalid connection name'), req.params.conn);
    return;
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    common.render_error(res, req, req.t('Invalid database name'), req.params.conn);
    return;
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  // do DB stuff
  common.get_sidebar_list(mongo_db, req.params.db, (e1, sidebar_list) => {
    common.get_id_type(mongo_db, req.params.coll, req.params.doc_id, (e2, result) => {
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

      res.render('coll-edit', {
        conn_name: req.params.conn,
        db_name: req.params.db,
        conn_list: common.order_object(req.nconf.connections.get('connections')),
        sidebar_list,
        coll_name: req.params.coll,
        coll_doc: bsonify.stringify(result.doc, null, '    '),
        helpers: req.handlebars.helpers,
        editor: true,
        images_fields: images,
        video_fields: videos,
        audio_fields: audio,
        session: req.session,
      });
    });
  });
};
