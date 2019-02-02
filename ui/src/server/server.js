'use strict';

const {
  all,
  applyMiddleware,
  assets,
  error,
  getBuildContext,
  https,
  security,
  setupDevelopment,
  setupHTML,
  setupLocale,
} = require('@carbon/server');
const express = require('express');
const path = require('path');
const { supported } = require('../shared/languages');
const { getMessages } = require('./tools/language');

function getConfig() {
  return {
    config: require('../../config/webpack/webpack.config.dev'),
    paths: require('../../config/webpack/paths'),
  };
}

const server = express();
const middleware = [
  // Secure middleware for redirecting to HTTPS, when applicable
  https,

  // Development Middleware for handling client-side related development
  setupDevelopment(getConfig),

  // Middleware that should be enabled for most requests
  all,

  // "Security" middleware
  security,

  // Setup handling of different languages/locales
  setupLocale([...supported]),

  // Handle serving static assets provided through ASSET_PATH
  assets,
  server => {
    server.use(
      '/static',
      express.static(path.resolve(__dirname, '../../public'))
    );
    return server;
  },

  // Handle generating HTML responses, serving static assets, and error handling
  setupHTML({
    getTitle: () => 'Page Title',
    getMetaTags: () => ({
      og: {
        title: 'Page Title',
        type: 'website',
        url: 'https://google.com',
        description: 'Page description',
      },
    }),
    getMessages,
  }),

  // Error handling so we don't pollute the response with stack traces
  error,
].filter(Boolean);
const ASSET_PATH = path.resolve(__dirname, '../../build');
const context = {
  build: getBuildContext({
    assetPath: ASSET_PATH,
    getConfig,
  }),
};

module.exports = () =>
  applyMiddleware(
    server,
    [
      server => {
        server.use((req, res) => {
          res.send('OK');
        });
        return server;
      },
    ],
    context
  );