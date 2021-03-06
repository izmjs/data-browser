const ctrls = require('../controllers/index.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  is_global: true,
  prefix: '/dbrowser/app',
  routes: [{
    path: '/',
    methods: {
      get: {
        iam: 'modules:data-browser:app:home',
        title: 'Home page',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:app'],
        description: 'The home page',
        middlewares: [
          commonCtrls.init,
          ctrls.home,
        ],
      },
    },
  }, {
    path: '/monitoring',
    methods: {
      get: {
        iam: 'modules:data-browser:app:monitoring',
        title: 'Server monitoring',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:app'],
        description: 'Show server monitoring',
        middlewares: [
          commonCtrls.init,
          ctrls.monitoring,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/indexes',
    methods: {
      get: {
        iam: 'modules:data-browser:app:collection:indexes',
        title: 'List indexes',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:app'],
        description: 'Show all indexes for collection',
        middlewares: [
          commonCtrls.init,
          ctrls.indexes,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/view',
    methods: {
      get: {
        iam: 'modules:data-browser:app:collection:view',
        title: 'Shows documents',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:app'],
        description: 'Shows the document preview/pagination',
        middlewares: [
          commonCtrls.init,
          ctrls.view,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/new',
    methods: {
      get: {
        iam: 'modules:data-browser:app:collection:doc:new',
        title: 'Create document',
        groups: [],
        parents: [
          'modules:data-browser',
          'modules:data-browser:app',
          'modules:data-browser:app:doc',
        ],
        description: 'Create new document',
        middlewares: [
          commonCtrls.init,
          ctrls.newDoc,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/:dBrowserDocId',
    methods: {
      get: {
        iam: 'modules:data-browser:app:collection:doc:show',
        title: 'Show document',
        groups: [],
        parents: [
          'modules:data-browser',
          'modules:data-browser:app',
          'modules:data-browser:app:doc',
        ],
        description: 'Shows the document preview/pagination',
        middlewares: [
          commonCtrls.init,
          ctrls.showDoc,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/edit/:dBrowserDocId',
    methods: {
      get: {
        iam: 'modules:data-browser:app:collection:doc:edit',
        title: 'Edit document',
        groups: [],
        parents: [
          'modules:data-browser',
          'modules:data-browser:app',
          'modules:data-browser:app:doc',
        ],
        description: 'Edit an existing document',
        middlewares: [
          commonCtrls.init,
          ctrls.editDoc,
        ],
      },
    },
  }, {
    path: '/:dbName',
    methods: {
      get: {
        iam: 'modules:data-browser:app:db',
        title: 'Database page',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:app'],
        description: 'The base connection route showing all DB\'s for connection',
        middlewares: [
          commonCtrls.init,
          ctrls.dbHome,
        ],
      },
    },
  }],
};
