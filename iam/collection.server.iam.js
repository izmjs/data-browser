const ctrls = require('../controllers/collection.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/dbrowser/collection',
  routes: [{
    path: '/:dbName/coll_create',
    methods: {
      /**
       * @body
       * {
       *   "collection_name": "{{collectionName}}"
       * }
       */
      post: {
        iam: 'modules:data-browser:collection:create',
        title: 'Create a new collection',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:collection'],
        description: 'Create a new collection and add it to the current database',
        middlewares: [
          commonCtrls.init,
          ctrls.create,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/coll_name_edit',
    methods: {
      /**
       * @body
       * {
       *   "new_collection_name": "{{collectionName}}"
       * }
       */
      post: {
        iam: 'modules:data-browser:collection:name:edit',
        title: 'Rename collection',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:collection'],
        description: 'Rename an existing collection',
        middlewares: [
          commonCtrls.init,
          ctrls.rename,
        ],
      },
    },
  }, {
    path: '/:dbName/coll_delete',
    methods: {
      /**
       * @body
       * {
       *   "collection_name": "{{collectionName}}"
       * }
       */
      post: {
        iam: 'modules:data-browser:collection:remove',
        title: 'Delete a collection',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:collection'],
        description: 'Remove an existing collection',
        middlewares: [
          commonCtrls.init,
          ctrls.remove,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/export',
    methods: {
      /**
       * @params
       * [{
       *   "key": "excludeID",
       *   "value": "false",
       *   "description": "Exclude IDs from the export"
       * }]
       */
      get: {
        iam: 'modules:data-browser:collection:export',
        title: 'Export collection',
        groups: [],
        parents: [
          'modules:data-browser',
          'modules:data-browser:collection',
        ],
        description: 'Export an existing collection',
        middlewares: [
          commonCtrls.init,
          ctrls.exportCollection,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/create_index',
    methods: {
      /**
       * @body
       * ["{\"name\":1}", true, true]
       */
      post: {
        iam: 'modules:data-browser:collection:index:create',
        title: 'Create an index',
        groups: [],
        parents: [
          'modules:data-browser',
          'modules:data-browser:collection',
          'modules:data-browser:collection:index',
        ],
        description: 'Create an index in a collection',
        middlewares: [
          commonCtrls.init,
          ctrls.createIndex,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/drop_index',
    methods: {
      /**
       * @body
       * {
       *   "index": 1
       * }
       */
      post: {
        iam: 'modules:data-browser:collection:index:drop',
        title: 'Drop an index',
        groups: [],
        parents: [
          'modules:data-browser',
          'modules:data-browser:collection',
          'modules:data-browser:collection:index',
        ],
        description: 'Drops an existing collection index',
        middlewares: [
          commonCtrls.init,
          ctrls.dropIndex,
        ],
      },
    },
  }],
};
