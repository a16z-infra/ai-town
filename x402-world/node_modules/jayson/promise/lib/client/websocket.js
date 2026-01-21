'use strict';

const promisify = require('es6-promisify');
const jayson = require('../../../');
const promiseUtils = require('../utils');

/**
 * Constructor for a Jayson Promise Client Websocket
 * @see Client
 * @class PromiseClientWebsocket
 * @extends ClientWebsocket
 * @return {PromiseClientWebsocket}
 */
const PromiseClientWebsocket = function(options) {
  if(!(this instanceof PromiseClientWebsocket)) {
    return new PromiseClientWebsocket(options);
  }
  jayson.Client.websocket.apply(this, arguments);
  this.request = promiseUtils.wrapClientRequestMethod(this.request.bind(this));
};
require('util').inherits(PromiseClientWebsocket, jayson.Client.websocket);

module.exports = PromiseClientWebsocket;
