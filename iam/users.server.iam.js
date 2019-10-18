const ctrls = require('../controllers/users.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
* @type { IAM.default }
*/
module.exports = {
  prefix: '/dbrowser/users',
  routes: [{
    path: '/user_create',
    methods: {
      /**
       * @body
       * {
       *   "username": "idrissi",
       *   "user_password": "123456",
       *   "roles_text": ""
       * }
       */
      post: {
        iam: 'modules:data-browser:users:create',
        title: 'Create user',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:users'],
        description: 'Create a new user',
        middlewares: [
          commonCtrls.init,
          ctrls.user_create,
        ],
      },
    },
  }, {
    path: '/user_delete',
    methods: {
      /**
       * @body
       * {
       *   "username": "idrissi"
       * }
       */
      post: {
        iam: 'modules:data-browser:users:delete',
        title: 'Delete a user',
        groups: [],
        parents: ['modules:data-browser', 'modules:data-browser:users'],
        description: 'Delete an existing user',
        middlewares: [
          commonCtrls.init,
          ctrls.user_delete,
        ],
      },
    },
  }],
};
