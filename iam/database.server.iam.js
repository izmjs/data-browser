const ctrls = require('../controllers/database.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/dbrowser/database',
  routes: [{
    path: '/:dbName',
    methods: {
      post: {
        iam: 'modules:data-browser:database:create',
        title: 'Create new database',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:database'],
        description: 'Create a new database',
        middlewares: [
          commonCtrls.init,
          ctrls.create,
        ],
      },
      delete: {
        iam: 'modules:data-browser:database:delete',
        title: '',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:database'],
        description: 'Remove an existing database',
        middlewares: [
          commonCtrls.init,
          ctrls.remove,
        ],
      },
    },
  }],
};
