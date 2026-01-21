'use strict';

const events = require('events');
const utils = require('../utils');

/**
 *  Constructor for a Jayson Client
 *  @class Client
 *  @extends require('events').EventEmitter
 *  @param {Server} [server] An instance of Server (a object with a "call" method")
 *  @param {Object} [options]
 *  @param {Function} [options.reviver] Reviver function for JSON
 *  @param {Function} [options.replacer] Replacer function for JSON
 *  @param {Number} [options.version=2] JSON-RPC version to use (1|2)
 *  @param {Boolean} [options.notificationIdNull=false] When true, version 2 requests will set id to null instead of omitting it
 *  @param {Function} [options.generator] Function to use for generating request IDs
 *  @return {Client}
 */
const Client = function(server, options) {
  if(arguments.length === 1 && utils.isPlainObject(server)) {
    options = server;
    server = null;
  }

  if(!(this instanceof Client)) {
    return new Client(server, options);
  }

  const defaults = {
    reviver: null,
    replacer: null,
    generator: utils.generateId,
    version: 2,
    notificationIdNull: false,
  };

  this.options = utils.merge(defaults, options || {});

  if(server) {
    this.server = server;
  }
};
require('util').inherits(Client, events.EventEmitter);

module.exports = Client;

/**
 * HTTP client constructor
 * @type ClientHttp
 * @static
 */
Client.http = require('./http');

/**
 * HTTPS client constructor
 * @type ClientHttps
 * @static
 */
Client.https = require('./https');

/**
 * TCP client constructor
 * @type ClientTcp
 * @static
 */
Client.tcp = require('./tcp');

/**
 * TLS client constructor
 * @type ClientTls
 * @static
 */
Client.tls = require('./tls');

/**
 * Browser client constructor
 * @type ClientBrowser
 * @static
 */
Client.browser = require('./browser');

/**
 * Websocket client constructor
 * @type ClientWebsocket
 * @static
 */
Client.websocket = require('./websocket');

/**
 *  Creates a request and dispatches it if given a callback.
 *  @param {String|Array} method A batch request if passed an Array, or a method name if passed a String
 *  @param {Array|Object} params Parameters for the method
 *  @param {String|Number} [id] Optional id. If undefined an id will be generated. If null it creates a notification request
 *  @param {Function} [callback] Request callback. If specified, executes the request rather than only returning it.
 *  @throws {TypeError} Invalid parameters
 *  @return {Object} JSON-RPC 1.0 or 2.0 compatible request
 */
Client.prototype.request = function(method, params, id, callback) {
  const self = this;
  let request = null;

  // is this a batch request?
  const isBatch = Array.isArray(method) && typeof(params) === 'function';

  if (this.options.version === 1 && isBatch) {
    throw new TypeError('JSON-RPC 1.0 does not support batching');
  }

  // is this a raw request?
  const isRaw = !isBatch && method && typeof(method) === 'object' && typeof(params) === 'function';

  if(isBatch || isRaw) {
    callback = params;
    request = method;
  } else {
    if(typeof(id) === 'function') {
      callback = id;
      // specifically undefined because "null" is a notification request
      id = undefined;
    }

    const hasCallback = typeof(callback) === 'function';

    try {
      request = utils.request(method, params, id, {
        generator: this.options.generator,
        version: this.options.version,
        notificationIdNull: this.options.notificationIdNull,
      });
    } catch(err) {
      if(hasCallback) {
        callback(err);
        return;
      }
      throw err;
    }

    // no callback means we should just return a raw request before sending
    if(!hasCallback) {
      return request;
    }

  }

  this.emit('request', request);

  this._request(request, function(err, response) {
    self.emit('response', request, response);
    self._parseResponse(err, response, callback);
  });

  // always return the raw request
  return request;
};

/**
 *  Executes a request on a directly bound server
 *  @param {Object} request A JSON-RPC 1.0 or 2.0 request
 *  @param {Function} callback Request callback that will receive the server response as the second argument
 *  @private
 */
Client.prototype._request = function(request, callback) {
  const self = this;

  // serializes the request as a JSON string so that we get a copy and can run the replacer as intended
  utils.JSON.stringify(request, this.options, function(err, message) {
    if(err) {
      callback(err);
      return;
    }

    self.server.call(message, function(error, success) {
      const response = error || success;
      callback(null, response);
    });

  });

};

/**
 * Parses a response from a server, taking care of sugaring
 * @param {Object} err Error to pass on that is unrelated to the actual response
 * @param {Object} response JSON-RPC 1.0 or 2.0 response
 * @param {Function} callback Callback that will receive different arguments depending on the amount of parameters
 * @private
 */
Client.prototype._parseResponse = function(err, response, callback) {
  if(err) {
    callback(err);
    return;
  }

  if(!response || typeof(response) !== 'object') {
    callback();
    return;
  }

  if(callback.length === 3) {
    // if callback length is 3, we split callback arguments on error and response

    // is batch response?
    if(Array.isArray(response)) {

      // necessary to split strictly on validity according to spec here
      const isError = function(res) { return typeof(res.error) !== 'undefined'; };
      const isNotError = function(res) { return !isError(res); };

      callback(null, response.filter(isError), response.filter(isNotError));
      return;
    } else {

      // split regardless of validity
      callback(null, response.error, response.result);
      return;
    }
  
  }

  callback(null, response);
};
