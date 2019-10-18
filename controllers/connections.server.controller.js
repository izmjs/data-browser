const { MongoClient } = require('mongodb');

/**
 * Add a new connection
 * @param {String} c The connection name
 * @param {ExpressApp} a The application
 * @param {Function} callback The function callback
 */
exports.addConnection = function addConnection(c, a, callback) {
  const app = a;
  const connection = c;

  if (!app.locals.dbConnections) {
    app.locals.dbConnections = [];
  }

  if (!connection.connOptions) {
    connection.connOptions = {};
  }

  MongoClient.connect(connection.connString, connection.connOptions, (err, database) => {
    if (err) {
      callback(err, null);
    } else {
      const dbObj = {};
      dbObj.native = database;
      dbObj.connString = connection.connString;
      dbObj.connOptions = connection.connOptions;

      app.locals.dbConnections[connection.connName] = null;
      app.locals.dbConnections[connection.connName] = dbObj;
      callback(null, null);
    }
  });
};

/**
 * Remove an existing connection
 * @param {String} c The connection name
 * @param {ExpressApp} a The application
 */
exports.removeConnection = function removeConnection(c, a) {
  const app = a;
  const connection = c;

  if (!app.locals.dbConnections) {
    app.locals.dbConnections = [];
  }

  try {
    app.locals.dbConnections[connection].native.close();
  } catch (e) {
    // Do nothing, proceed...
  }

  delete app.locals.dbConnections[connection];
};
