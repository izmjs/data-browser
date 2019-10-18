const ctrls = require('../controllers/document.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/dbrowser/document',
  routes: [{
    path: '/:collectionName/insert_doc',
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
       *   pm.environment.set("documentID", doc_id);
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
    path: '/:collectionName/edit_doc',
    methods: {
      /**
       * @body
       * {
       *   "objectData": "{\"name\":\"New name\",\"_id\":\"{{documentID}}\"}"
       * }
       *
       * @test
       * pm.test("Status code is 200", function () {
       *   pm.response.to.have.status(200);
       *   const { doc_id } = pm.response.json();
       *   pm.environment.set("documentID", doc_id);
       * });
       */
      post: {
        iam: 'modules:data-browser:document:edit',
        title: 'Edit document',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:document'],
        description: 'Edits/updates an existing document',
        middlewares: [
          commonCtrls.init,
          ctrls.edit_doc,
        ],
      },
    },
  }, {
    path: '/:collectionName/mass_delete',
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
    path: '/:collectionName/doc_delete',
    methods: {
      /**
       * @body
       * {
       *   "doc_id": "{{documentID}}"
       * }
       */
      post: {
        iam: 'modules:data-browser:document:delete:one',
        title: 'Deletes document',
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
