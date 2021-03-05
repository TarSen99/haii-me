const express = require('express');
const path = require('path');
const logger = require('morgan');
const config = require('config');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { buildErrors } = require('@/helpers/buildErrors.js');
const indexRouter = require('@/routes/index');

const APP_CONFIG = config.get('env');
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(new Error('Page not found'));
});

// error handler
app.use(function (err, req, res, next) {
  if (APP_CONFIG !== 'test') {
    console.log(err);
  }

  if (err.errors) {
    return res.status(err.status || 400).json({
      error: buildErrors(err),
    });
  }

  res.status(err.status || 500);

  res.json({
    error: err.message,
  });
});

module.exports = app;
