// const ctrls = require('../controllers/database.server.controller');
// const commonCtrls = require('../controllers/common.server.controller');

/**
 * @type { IAM.default }
 */
// module.exports = {
//   prefix: '/dbrowser/database',
//   routes: [{
//     path: '/:dbName/backup',
//     methods: {
//       post: {
//         iam: 'modules:data-browser:database:backup',
//         title: 'Backup',
//         groups: [],
//         parents: ['modules:data-browser', 'modules:data-browser:database'],
//         description: 'Backup a database',
//         middlewares: [
//           commonCtrls.init,
//           ctrls.backup,
//         ],
//       },
//     },
//   }, {
//     path: '/:dbName/restore',
//     methods: {
//       /**
//        * @body
//        * {
//        *   "dropTarget": "false"
//        * }
//        */
//       post: {
//         iam: 'modules:data-browser:database:restore',
//         title: 'Restore',
//         groups: [],
//         parents: ['modules:data-browser', 'modules:data-browser:database'],
//         description: 'restore a database',
//         middlewares: [
//           commonCtrls.init,
//           ctrls.restore,
//         ],
//       },
//     },
//   }],
// };
