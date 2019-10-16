const express = require('express');

const router = express.Router();
const _ = require('lodash');

// pagination API
router.post('/api/:conn/:db/:coll/:page', (req, res, next) => {
  const connection_list = req.app.locals.dbConnections;
  const ejson = require('mongodb-extended-json');
  const docs_per_page = parseInt(req.body.docsPerPage) !== undefined ? parseInt(req.body.docsPerPage) : 5;

  // Check for existance of connection
  if (connection_list[req.params.conn] === undefined) {
    res.status(400).json({ msg: req.i18n.__('Invalid connection name') });
  }

  // Validate database name
  if (req.params.db.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.i18n.__('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = connection_list[req.params.conn].native.db(req.params.db);

  const page_size = docs_per_page;
  let page = 1;

  if (req.params.page !== undefined) {
    page = parseInt(req.params.page);
  }

  let skip = 0;
  if (page > 1) {
    skip = (page - 1) * page_size;
  }

  const limit = page_size;

  let query_obj = {};
  let validQuery = true;
  let queryMessage = '';
  if (req.body.query) {
    try {
      query_obj = ejson.parse(req.body.query);
    } catch (e) {
      validQuery = false;
      queryMessage = e.toString();
      query_obj = {};
    }
  }

  mongo_db.collection(req.params.coll).find(query_obj, { skip, limit }).toArray((err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json(err);
    } else {
      mongo_db.collection(req.params.coll).find({}, { skip, limit }).toArray((err, simpleSearchFields) => {
        // get field names/keys of the Documents in collection
        let fields = [];
        for (let i = 0; i < simpleSearchFields.length; i++) {
          const doc = simpleSearchFields[i];

          for (const key in doc) {
            if (key === '__v') continue;
            fields.push(key);
          }
        }

        fields = fields.filter((item, pos) => fields.indexOf(item) === pos);

        // get total num docs in query
        mongo_db.collection(req.params.coll).count(query_obj, (err, doc_count) => {
          const return_data = {
            data: result,
            fields,
            total_docs: doc_count,
            deleteButton: req.i18n.__('Delete'),
            linkButton: req.i18n.__('Link'),
            editButton: req.i18n.__('Edit'),
            validQuery,
            queryMessage,
          };
          res.status(200).json(return_data);
        });
      });
    }
  });
});

// Gets monitoring data
router.get('/api/monitoring/:conn', (req, res, next) => {
  const dayBack = new Date();
  dayBack.setDate(dayBack.getDate() - 1);

  req.db.find({ connectionName: req.params.conn, eventDate: { $gte: dayBack } }).sort({ eventDate: 1 }).exec((err, serverEvents) => {
    const connectionsCurrent = [];
    const connectionsAvailable = [];
    const connectionsTotalCreated = [];

    const clientsTotal = [];
    const clientsReaders = [];
    const clientsWriters = [];

    const memoryVirtual = [];
    const memoryMapped = [];
    const memoryCurrent = [];

    const docsQueried = [];
    const docsInserted = [];
    const docsDeleted = [];
    const docsUpdated = [];

    if (serverEvents.length > 0) {
      if (serverEvents[0].dataRetrieved === true) {
        if (serverEvents) {
          _.each(serverEvents, (value, key) => {
            // connections
            if (value.connections) {
              connectionsCurrent.push({ x: value.eventDate, y: value.connections.current });
              connectionsAvailable.push({ x: value.eventDate, y: value.connections.available });
              connectionsTotalCreated.push({ x: value.eventDate, y: value.connections.totalCreated });
            }
            // clients
            if (value.activeClients) {
              clientsTotal.push({ x: value.eventDate, y: value.activeClients.total });
              clientsReaders.push({ x: value.eventDate, y: value.activeClients.readers });
              clientsWriters.push({ x: value.eventDate, y: value.activeClients.writers });
            }
            // memory
            if (value.memory) {
              memoryVirtual.push({ x: value.eventDate, y: value.memory.virtual });
              memoryMapped.push({ x: value.eventDate, y: value.memory.mapped });
              memoryCurrent.push({ x: value.eventDate, y: value.memory.resident });
            }

            if (value.docCounts) {
              docsQueried.push({ x: value.eventDate, y: value.docCounts.queried });
              docsInserted.push({ x: value.eventDate, y: value.docCounts.inserted });
              docsDeleted.push({ x: value.eventDate, y: value.docCounts.deleted });
              docsUpdated.push({ x: value.eventDate, y: value.docCounts.updated });
            }
          });
        }
      }

      const dataPointsLimit = 1000;

      const returnedData = {
        connectionsCurrent: averageDatapoints(connectionsCurrent, dataPointsLimit),
        connectionsAvailable: averageDatapoints(connectionsAvailable, dataPointsLimit),
        connectionsTotalCreated: averageDatapoints(connectionsTotalCreated, dataPointsLimit),
        clientsTotal: averageDatapoints(clientsTotal, dataPointsLimit),
        clientsReaders: averageDatapoints(clientsReaders, dataPointsLimit),
        clientsWriters: averageDatapoints(clientsWriters, dataPointsLimit),
        memoryVirtual: averageDatapoints(memoryVirtual, dataPointsLimit),
        memoryMapped: averageDatapoints(memoryMapped, dataPointsLimit),
        memoryCurrent: averageDatapoints(memoryCurrent, dataPointsLimit),
        docsQueried: averageDatapoints(docsQueried, dataPointsLimit),
        docsInserted: averageDatapoints(docsInserted, dataPointsLimit),
        docsDeleted: averageDatapoints(docsDeleted, dataPointsLimit),
        docsUpdated: averageDatapoints(docsUpdated, dataPointsLimit),
      };

      // get hours or mins
      let uptime = (serverEvents[0].uptime / 60).toFixed(2);
      if (uptime > 61) {
        uptime = `${(uptime / 60).toFixed(2)} hours`;
      } else {
        uptime += ' minutes';
      }

      if (err) {
        res.status(400).json({ msg: req.i18n.__('Could not get server monitoring') });
      } else {
        res.status(200).json({
          data: returnedData, dataRetrieved: serverEvents[0].dataRetrieved, pid: serverEvents[0].pid, version: serverEvents[0].version, uptime,
        });
      }
    }
  });
});

function averageDatapoints(datapoints, limit) {
  if (limit >= datapoints.length) {
    return datapoints;
  }

  const min = datapoints[0].x.getTime();
  const max = datapoints[datapoints.length - 1].x.getTime();

  if (limit < 1) {
    return [{
      x: new Date((min + max) / 2),
      y: datapoints.reduce((a, b) => a.y + b.y, 0) / datapoints.length,
    }];
  }
  const step = (max - min) / limit;
  const result = [];
  let l = min + step;
  let n = 0;
  let sumx = 0;
  let sumy = 0;
  for (let i = 0; i < datapoints.length; i++) {
    if (datapoints[i].x.getTime() > l) {
      if (n > 0) {
        result.push({
          x: sumy ? new Date(sumx / sumy) : new Date(l - step / 2),
          y: sumy / n,
        });
      }
      while (datapoints[i].x.getTime() > l) {
        l += step;
      }
      n = 0;
      sumx = 0;
      sumy = 0;
    }
    n++;
    sumx += datapoints[i].x.getTime() * datapoints[i].y;
    sumy += datapoints[i].y;
  }
  if (n > 0) {
    result.push({
      x: sumy ? new Date(sumx / sumy) : new Date(l - step / 2),
      y: sumy / n,
    });
  }
  return result;
}

module.exports = router;
