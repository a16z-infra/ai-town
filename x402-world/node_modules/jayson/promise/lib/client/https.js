'use strict';

const promisify = require('es6-promisify');
const jayson = require('../../../');
const promiseUtils = require('../utils');

/**
 * Constructor for a Jayson Promise Client Http
 * @see Client
 * @class PromiseClientHttps
 * @extends ClientHttps
 * @return {PromiseClientHttps}
 */
const PromiseClientHttps = function(options) {
  if(!(this instanceof PromiseClientHttps)) {
    return new PromiseClientHttps(options);
  }
  jayson.Client.https.apply(this, arguments);
  this.request = promiseUtils.wrapClientRequestMethod(this.request.bind(this));
};
require('util').inherits(PromiseClientHttps, jayson.Client.https);

module.exports = PromiseClientHttps;

