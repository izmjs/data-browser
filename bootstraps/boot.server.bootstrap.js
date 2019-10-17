
const Datastore = require('nedb');
const mongoose = require('mongoose');
const { join } = require('path');

// eslint-disable-next-line import/no-unresolved
const { addIamToRoles } = require('utils');

const { serverMonitoring } = require('../helpers/monitoring.server.helper');

const db = new Datastore({
  filename: join(__dirname, '../data/dbStats.db'),
  autoload: true,
});

/**
 * Clean server cache
 */
module.exports = async (config) => {
  const { addIamToGuest, monitoring } = config['data-browser'];
  const { enable, interval } = monitoring;

  if (addIamToGuest === true) {
    try {
      await addIamToRoles('modules:data-browser', ['guest', 'user']);
    } catch (e) {
      // Ignore, just proceed
    }
  }

  if (enable === true) {
    // start the initial monitoring
    serverMonitoring(db, mongoose.connection);

    // Keep firing monitoring every 30 seconds
    setInterval(() => {
      serverMonitoring(db, mongoose.connection);
    }, interval);
  }

  return true;
};
