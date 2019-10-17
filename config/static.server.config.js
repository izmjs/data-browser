const express = require('express');
const { resolve } = require('path');

module.exports = (app) => {
  app.use('/data-browser', express.static(resolve(__dirname, '../public')));
};
