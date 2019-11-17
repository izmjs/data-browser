const ctrls = require('../controllers/document.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/dbrowser/document',
  params: [{
    name: 'dBrowserDocId',
    middleware: commonCtrls.validateId,
  }],
  routes: [{
    path: '/:dbName/:collectionName',
    methods: {
      /**
       * @body
       * {
       *   "objectData": ["{\"name\":\"New task\"}"]
       * }
       *
       * @test
       * pm.test("Status code is 200", function () {
       *   pm.response.to.have.status(200);
       *   const { doc_id } = pm.response.json();
       *   pm.environment.set("dBrowserDocId", doc_id);
       * });
       */
      post: {
        iam: 'modules:data-browser:document:insert',
        title: 'Insert document',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:document'],
        description: 'Inserts a new document',
        middlewares: [
          commonCtrls.init,
          ctrls.insert_doc,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/mass_delete',
    methods: {
      /**
       * @body
       * {
       *   "query": "{\"name\":\"New name\"}"
       * }
       */
      post: {
        iam: 'modules:data-browser:document:delete:mass',
        title: 'Delete documents',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:document'],
        description: 'Deletes a document or set of documents based on a query',
        middlewares: [
          commonCtrls.init,
          ctrls.mass_delete,
        ],
      },
    },
  }, {
    path: '/:dbName/:collectionName/:dBrowserDocId',
    methods: {
      /**
       * @body
       * {
       *   "objectData": "{\"name\":\"New name\"}"
       * }
       *
       * @test
       * pm.test("Status code is 200", function () {
       *   pm.response.to.have.status(200);
       *   const { doc_id } = pm.response.json();
       *   pm.environment.set("dBrowserDocId", doc_id);
       * });
       */
      post: {
        iam: 'modules:data-browser:document:edit:one',
        title: 'Edit document',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:document'],
        description: 'Edits/updates an existing document',
        middlewares: [
          commonCtrls.init,
          ctrls.edit_doc,
        ],
      },
      delete: {
        iam: 'modules:data-browser:document:delete:one',
        title: 'Remove a specific document',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:document'],
        description: 'Remove a specific document',
        middlewares: [
          commonCtrls.init,
          ctrls.doc_delete,
        ],
      },
    },
  }],
};
