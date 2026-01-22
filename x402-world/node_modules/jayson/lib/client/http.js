'use strict';

const http = require('http');
const url = require('url');
const utils = require('../utils');
const Client = require('../client');
const { version } = require('../../package.json');

/**
 *  Constructor for a Jayson HTTP Client
 *  @class ClientHttp
 *  @constructor
 *  @extends Client
 *  @param {Object|String} [options] String interpreted as a URL
 *  @param {String} [options.encoding="utf8"] Encoding to use
 *  @return {ClientHttp}
 */
const ClientHttp = function(options) {
  // accept first parameter as a url string
  if(typeof(options) === 'string') {
    options = url.parse(options);
  }

  if(!(this instanceof ClientHttp)) {
    return new ClientHttp(options);
  }
  Client.call(this, options);

  const defaults = utils.merge(this.options, {
    encoding: 'utf8'
  });

  this.options = utils.merge(defaults, options || {});
};
require('util').inherits(ClientHttp, Client);

module.exports = ClientHttp;

ClientHttp.prototype._request = function(request, callback) {
  const self = this;
  // copies options so object can be modified in this context
  const options = utils.merge({}, this.options);

  utils.JSON.stringify(request, options, function(err, body) {
    if(err) {
      callback(err);
      return;
    }

    options.method = options.method || 'POST';

    const headers = {
      'Content-Length': Buffer.byteLength(body, options.encoding),
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
      'User-Agent': `jayson-${version}`,
    };

    // let user override the headers
    options.headers = utils.merge(headers, options.headers || {});

    const req = self._getRequestStream(options);

    self.emit('http request', req);

    req.on('response', function(res) {
      self.emit('http response', res, req);

      res.setEncoding(options.encoding);

      let data = '';
      res.on('data', function(chunk) { data += chunk; });

      res.on('end', function() {

        // assume we have an error
        if(res.statusCode < 200 || res.statusCode >= 300) {
          // assume the server gave the reason in the body
          const err = new Error(data);
          err.code = res.statusCode;
          callback(err);
        } else {
          // empty reply
          if(!data || typeof(data) !== 'string') {
            callback();
            return;
          }
          utils.JSON.parse(data, options, callback);
        }
      });

    });

    // abort on timeout
    req.on('timeout', function() {
      req.abort(); // req.abort causes "error" event
    });

    // abort on error
    req.on('error', function(err) {
      self.emit('http error', err);
      callback(err);
      req.abort();
    });

    req.end(body);
  });
};

/**
 *  Gets a stream interface to a http server
 *  @param {Object} options An options object
 *  @return {require('http').ClientRequest}
 *  @private
 */
ClientHttp.prototype._getRequestStream = function(options) {
  return http.request(options || {});
};
