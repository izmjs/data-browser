const Datastore = require('nedb');
const { join } = require('path');

exports.db = new Datastore({
  filename: join(__dirname, '../data/dbStats.db'),
  autoload: false,
});

function getDocCounts(currCounts, newCounts) {
  const count = currCounts;
  const newDocCounts = {
    queried: 0,
    inserted: 0,
    deleted: 0,
    updated: 0,
  };

  // queried
  if (count.queried === 0) {
    count.queried = newCounts.returned;
  } else {
    newDocCounts.queried = newCounts.returned - count.queried;
    count.queried = newCounts.returned;
  }

  // inserts
  if (count.inserted === 0) {
    count.inserted = newCounts.inserted;
  } else {
    newDocCounts.inserted = newCounts.inserted - count.inserted;
    count.inserted = newCounts.inserted;
  }

  // deleted
  if (count.deleted === 0) {
    count.deleted = newCounts.deleted;
  } else {
    newDocCounts.deleted = newCounts.deleted - count.deleted;
    count.deleted = newCounts.deleted;
  }

  // updated
  if (count.updated === 0) {
    count.updated = newCounts.updated;
  } else {
    newDocCounts.updated = newCounts.updated - count.updated;
    count.updated = newCounts.updated;
  }

  return newDocCounts;
}

// Removes old monitoring data. We only want basic monitoring with the last 100 events.
// We keep last 80 and remove the rest to be sure.
function serverMonitoringCleanup(db) {
  const exclude = {
    eventDate: 0,
    pid: 0,
    version: 0,
    uptime: 0,
    network: 0,
    connections: 0,
    memory: 0,
    dataRetrieved: 0,
    docCounts: 0,
  };

  const retainedRecords = ((24 * 60) * 60) / 30; // 24 hours worth of 30 sec blocks (data refresh interval)

  db.find({})
    .skip(retainedRecords)
    .sort({ eventDate: -1 })
    .projection(exclude)
    .exec((err, serverEvents) => {
      const idArray = serverEvents.map(({ _id: id }) => id);

      db.remove({ _id: { $in: idArray } }, { multi: true }, () => {});
    });
}

// runs a regular job against the connections and inserts into a local DB
const currDocCounts = {
  queried: 0,
  inserted: 0,
  deleted: 0,
  updated: 0,
};

exports.serverMonitoring = (monitoringDB, conn) => {
  if (conn && conn.db) {
    const adminDb = conn.db.admin();
    adminDb.serverStatus((err, info) => {
      // if we got data back from db. If not, normally related to permissions
      let dataRetrieved = false;
      if (info) {
        dataRetrieved = true;
      }

      // doc numbers. We get the last interval number and subtract the current to get the diff
      let docCounts = '';
      let activeClients = '';
      let pid = 'N/A';
      let version = 'N/A';
      let uptime = 'N/A';
      let connections = '';
      let memory = '';

      // set the values if we can get them
      if (info) {
        docCounts = info.metrics ? getDocCounts(currDocCounts, info.metrics.document) : 0;
        activeClients = info.globalLock ? info.globalLock.activeClients : 0;
        pid = info.pid;
        version = info.version;
        uptime = info.uptime;
        connections = info.connections;
        memory = info.mem;
      }

      const doc = {
        eventDate: new Date(),
        pid,
        version,
        uptime,
        activeClients,
        connections,
        memory,
        dataRetrieved,
        docCounts,
      };

      // insert the data into local DB
      monitoringDB.insert(doc, () => {});

      // clean up old docs
      serverMonitoringCleanup(monitoringDB);
    });
  }
};
