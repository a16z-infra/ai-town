'use strict';

const promisify = require('es6-promisify');
const jayson = require('../../../');
const promiseUtils = require('../utils');

/**
 * Constructor for a Jayson Promise Client
 * @see Client
 * @class PromiseClient
 * @extends Client
 * @return {PromiseClient}
 */
const PromiseClient = function(server, options) {
  if(!(this instanceof PromiseClient)) {
    return new PromiseClient(server, options);
  }
  jayson.Client.apply(this, arguments);
  this.request = promiseUtils.wrapClientRequestMethod(this.request.bind(this));
};
require('util').inherits(PromiseClient, jayson.Client);

/**
 * @type PromiseClientHttp
 * @static
 */
PromiseClient.http = require('./http');

/**
 * @type PromiseClientHttps
 * @static
 */
PromiseClient.https = require('./https');

/**
 * @type PromiseClientTls
 * @static
 */
PromiseClient.tls = require('./tls');

/**
 * @type PromiseClientTcp
 * @static
 */
PromiseClient.tcp = require('./tcp');

/**
 * @type PromiseClientWebsocket
 * @static
 */
PromiseClient.websocket = require('./websocket');

module.exports = PromiseClient;
