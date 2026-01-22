'use strict';

const promisify = require('es6-promisify');
const jayson = require('../../../');
const promiseUtils = require('../utils');

/**
 * Constructor for a Jayson Promise Client Http
 * @see Client
 * @class PromiseClientHttp
 * @extends ClientHttp
 * @return {PromiseClientHttp}
 */
const PromiseClientHttp = function(options) {
  if(!(this instanceof PromiseClientHttp)) {
    return new PromiseClientHttp(options);
  }
  jayson.Client.http.apply(this, arguments);
  this.request = promiseUtils.wrapClientRequestMethod(this.request.bind(this));
};
require('util').inherits(PromiseClientHttp, jayson.Client.http);

module.exports = PromiseClientHttp;
