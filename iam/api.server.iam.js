const ctrls = require('../controllers/api.server.controller');
const commonCtrl = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/dbrowser/api',
  routes: [{
    path: '/monitoring',
    methods: {
      get: {
        iam: 'modules:data-browser:api:monitoring',
        title: 'Database monitor',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:api'],
        description: 'Get database statistics',
        middlewares: [
          commonCtrl.init,
          ctrls.monitoring,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName',
    methods: {
      /**
       * @params
       * [{
       *   "key": "page",
       *   "value": "1",
       *   "description": "Page number"
       * }]
       *
       * @body
       * {
       *   "docsPerPage": "40",
       *   "query": "{}"
       * }
       */
      post: {
        iam: 'modules:data-browser:api:paginate',
        title: 'Query a collection',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:api'],
        description: 'Query and get records of a specific collection',
        middlewares: [
          commonCtrl.init,
          ctrls.paginate,
        ],
      },
    },
  }],
};
