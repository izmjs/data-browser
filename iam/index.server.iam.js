const ctrls = require('../controllers/index.server.controller');
const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  is_global: true,
  prefix: '/dbrowser/app',
  routes: [{
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
  }],
};
