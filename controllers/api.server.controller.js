const ejson = require('mongodb-extended-json');

/**
 * Calculate the average of a list of datapoints
 * @param {Array<Object>} datapoints List of datapoints
 * @param {Number} limit Number of records to return
 */
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
  for (let i = 0; i < datapoints.length; i += 1) {
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
    n += 1;
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

/**
 * pagination API
 * @controller paginate
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.paginate = function paginate(req, res) {
  const docs_per_page = parseInt(req.body.docsPerPage, 10) !== undefined
    ? parseInt(req.body.docsPerPage, 10)
    : 5;

  // Validate database name
  if (!req.params.dbName || req.params.dbName.indexOf(' ') > -1) {
    res.status(400).json({ msg: req.t('Invalid database name') });
  }

  // Get DB's form pool
  const mongo_db = req.params.conn.useDb(req.params.dbName);
  const { db } = mongo_db;

  const page_size = docs_per_page;
  let page = 1;

  if (req.query.page !== undefined) {
    page = parseInt(req.query.page, 10);
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

  db.collection(
    req.params.collectionName,
  ).find(query_obj, { skip, limit })
    .toArray((err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
      } else {
        db.collection(req.params.collectionName)
          .find({}, { skip, limit })
          .toArray((e, simpleSearchFields) => {
            // get field names/keys of the Documents in collection
            let fields = [];
            simpleSearchFields.forEach((doc) => {
              Object.keys(doc).forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(doc, key) && key !== '__v') {
                  fields.push(key);
                }
              });
            });

            fields = fields.filter((item, pos) => fields.indexOf(item) === pos);

            // get total num docs in query
            db
              .collection(req.params.collectionName)
              .countDocuments(query_obj, (err1, doc_count) => {
                const return_data = {
                  data: result,
                  fields,
                  total_docs: doc_count,
                  deleteButton: req.t('Delete'),
                  linkButton: req.t('Link'),
                  editButton: req.t('Edit'),
                  validQuery,
                  queryMessage,
                };
                res.status(200).json(return_data);
              });
          });
      }
    });
};

/**
 * Gets monitoring data
 * @controller monitoring
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.monitoring = function monitoring(req, res) {
  const dayBack = new Date();
  dayBack.setDate(dayBack.getDate() - 1);

  req.db.find({
    eventDate: {
      $gte: dayBack,
    },
  }).sort({ eventDate: 1 }).exec((err, serverEvents) => {
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
          serverEvents.forEach((value) => {
            // connections
            if (value.connections) {
              connectionsCurrent.push({ x: value.eventDate, y: value.connections.current });
              connectionsAvailable.push({ x: value.eventDate, y: value.connections.available });
              connectionsTotalCreated.push({
                x: value.eventDate,
                y: value.connections.totalCreated,
              });
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
        res.status(400).json({ msg: req.t('Could not get server monitoring') });
      } else {
        res.status(200).json({
          uptime,
          data: returnedData,
          pid: serverEvents[0].pid,
          version: serverEvents[0].version,
          dataRetrieved: serverEvents[0].dataRetrieved,
        });
      }
    }
  });
};
