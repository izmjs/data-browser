const express = require('express');
const MongoURI = require('mongo-uri');

const router = express.Router();

const connPool = {};

// Add a new connection config
router.post('/config/add_config', (req, res) => {
  const nconf = req.nconf.connections;
  const connection_list = req.nconf.connections.get('connections');

  // check if name already exists
  if (connection_list !== undefined) {
    if (connection_list[req.body[0]] !== undefined) {
      res.status(400).json({ msg: req.t('Config error: A connection by that name already exists') });
      return;
    }
  }

  // try parse uri string. If pass, add, else throw an error
  try {
    MongoURI.parse(req.body[1]);
    let options = {};
    try {
      options = JSON.parse(req.body[2]);
    } catch (err) {
      res.status(400).json({ msg: `${req.t('Error in connection options')}: ${err}` });
      return;
    }

    // try add the connection
    connPool.addConnection({
      connName: req.body[0],
      connString: req.body[1],
      connOptions: options,
    },
    req.app,
    (err) => {
      if (err) {
        console.error(`DB Connect error: ${err}`);
        res.status(400).json({ msg: `${req.t('Config error')}: ${err}` });
      } else {
        // set the new config
        nconf.set(`connections:${req.body[0]}`, { connection_string: req.body[1], connection_options: options });

        // save for ron
        nconf.save((e) => {
          if (e) {
            console.error(`Config error: ${e}`);
            res.status(400).json({ msg: `${req.t('Config error')}: ${e}` });
          } else {
            res.status(200).json({ msg: req.t('Config successfully added') });
          }
        });
      }
    });
  } catch (err) {
    console.error(`Config error: ${err}`);
    res.status(400).json({ msg: `${req.t('Config error')}: ${err}` });
  }
});

// Updates an existing connection config
router.post('/config/update_config', (req, res) => {
  const nconf = req.nconf.connections;

  // try parse uri string. If pass, add, else throw an error
  try {
    MongoURI.parse(req.body.conn_string);

    // var get current options
    const current_options = nconf.store.connections[req.body.curr_config].connection_options;

    // try add the connection
    connPool.addConnection({
      connName: req.body.conn_name,
      connString: req.body.conn_string,
      connOptions: current_options,
    },
    req.app,
    (err) => {
      if (err) {
        console.error(`DB Connect error: ${err}`);
        res.status(400).json({ msg: `${req.t('Config error')}: ${err}` });
      } else {
        // delete current config
        delete nconf.store.connections[req.body.curr_config];

        // set the new
        nconf.set(`connections:${req.body.conn_name}`, { connection_string: req.body.conn_string, connection_options: current_options });

        // save for ron
        nconf.save((e) => {
          if (e) {
            console.error(`Config error1: ${e}`);
            res.status(400).json({ msg: `${req.t('Config error')}: ${e}` });
          } else {
            res.status(200).json({ msg: req.t('Config successfully updated'), name: req.body.conn_name, string: req.body.conn_string });
          }
        });
      }
    });
  } catch (err) {
    console.error(`Config error: ${err}`);
    res.status(400).json({ msg: `${req.t('Config error')}: ${err}` });
  }
});

// Drops an existing connection config
router.post('/config/drop_config', (req, res) => {
  const nconf = req.nconf.connections;

  // delete current config
  delete nconf.store.connections[req.body.curr_config];
  connPool.removeConnection(req.body.curr_config, req.app);

  // save config
  nconf.save((err) => {
    if (err) {
      console.error(`Config error: ${err}`);
      res.status(400).json({ msg: `${req.t('Config error')}: ${err}` });
    } else {
      res.status(200).json({ msg: req.t('Config successfully deleted') });
    }
  });
});

module.exports = router;
