const ctrls = require('../controllers/config.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/dbrowser/config',
  routes: [{
    path: '/add_config',
    methods: {
      /**
       * @body
       * ["localhost", "mongodb://localhost:27017/app-dev", "{\"useUnifiedTopology\": true}"]
       */
      post: {
        iam: 'modules:data-browser:config:add',
        title: 'Add connection',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:config'],
        description: 'Add a new connection config',
        middlewares: [
          commonCtrls.init,
          ctrls.add,
        ],
      },
    },
  }, {
    path: '/update_config',
    methods: {
      /**
       * @body
       * {
       *   "conn_name": "localhost",
       *   "conn_string": "mongodb://localhost:27017/app-dev",
       *   "curr_config": "localhost"
       * }
       */
      post: {
        iam: 'modules:data-browser:config:update',
        title: 'Update connection',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:config'],
        description: 'Update an existing connection config',
        middlewares: [
          commonCtrls.init,
          ctrls.update,
        ],
      },
    },
  }, {
    path: '/drop_config',
    methods: {
      /**
       * @body
       * {
       *   "curr_config": "localhost"
       * }
       */
      post: {
        iam: 'modules:data-browser:config:drop',
        title: 'Drop connection',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:config'],
        description: 'Drop an existing connection config',
        middlewares: [
          commonCtrls.init,
          ctrls.drop,
        ],
      },
    },
  }],
};
