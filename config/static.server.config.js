const express = require('express');
const { resolve } = require('path');

module.exports = (app) => {
  app.use('/dbrowser', express.static(resolve(__dirname, '../public')));
};
