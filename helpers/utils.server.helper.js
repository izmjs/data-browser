const { join } = require('path');
const expressHandlebars = require('express-handlebars');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const duration = require('dayjs/plugin/duration');

dayjs.extend(relativeTime);
dayjs.extend(duration);

const viewsDir = join(__dirname, '../views');

const handlebars = expressHandlebars.create({
  extname: 'server.view.hbs',
  layoutsDir: join(viewsDir, 'layouts'),
  defaultLayout: join(viewsDir, 'layouts/layout.server.view.hbs'),
  partialsDir: join(viewsDir, 'partials'),
  helpers: {
    toJSON(object) {
      return JSON.stringify(object);
    },
    niceBool(object) {
      if (object === undefined) return 'No';
      if (object === true) return 'Yes';
      return 'No';
    },
    app_context() {
      return '/dbrowser';
    },
    ifOr(v1, v2, options) {
      return (v1 || v2) ? options.fn(this) : options.inverse(this);
    },
    ifNotOr(v1, v2, options) {
      return (v1 || v2) ? options.inverse(this) : options.fn(this);
    },
    formatBytes(bytes) {
      if (bytes === 0) return '0 Byte';
      const k = 1000;
      const decimals = 2;
      const dm = decimals + 1 || 3;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / k ** i).toPrecision(dm)} ${sizes[i]}`;
    },
    formatDuration(time) {
      return dayjs.duration(time, 'seconds').humanize();
    },
  },
});

/**
 * Render a template
 * @param {OutcommingMessage} res HTTP response object
 * @param {String} template The template name
 * @param {Object} data The template data
 */
exports.render = async (req, res, template, data) => {
  handlebars.renderView(join(viewsDir, `${template}.server.view.hbs`), {
    ...data,
    helpers: {
      ...handlebars.helpers,
      __: req.t,
    },
    conn_name: req.t('Connection'),
  }, (err, html) => {
    if (err) {
      console.error(err);
      return res.status(404).json({ message: req.t('Not found') });
    }

    res.set('Content-Type', 'text/html');
    return res.send(html);
  });
};
