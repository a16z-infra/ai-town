'use strict';

const net = require('net');
const utils = require('../utils');
const Client = require('../client');

/**
 *  Constructor for a Jayson TCP Client
 *  @class ClientTcp
 *  @constructor
 *  @extends Client
 *  @param {Object|String} [options] Object goes into options for net.connect, String goes into options.path. String option argument is NOT recommended.
 *  @return {ClientTcp}
 */
const ClientTcp = function(options) {
  if(typeof(options) === 'string') {
    options = {path: options};
  }

  if(!(this instanceof ClientTcp)) {
    return new ClientTcp(options);
  }
  Client.call(this, options);

  const defaults = utils.merge(this.options, {
    encoding: 'utf8'
  });

  this.options = utils.merge(defaults, options || {});
};
require('util').inherits(ClientTcp, Client);

module.exports = ClientTcp;

ClientTcp.prototype._request = function(request, callback) {
  const self = this;

  // copies options so object can be modified in this context
  const options = utils.merge({}, this.options);
  const delimiter = options.delimiter || '\n';

  utils.JSON.stringify(request, options, function(err, body) {
    if(err) {
      callback(err);
      return;
    }

    let handled = false;

    const conn = net.connect(options, function() {

      conn.setEncoding(options.encoding);

      // wont get anything for notifications, just end here
      if(utils.Request.isNotification(request)) {

        handled = true;
        conn.end(body + delimiter);
        callback();

      } else {

        utils.parseStream(conn, options, function(err, response) {
          handled = true;
          conn.end();
          if(err) {
            callback(err);
            return;
          }
          callback(null, response);
        });

        conn.write(body + delimiter);

      }

    });

    self.emit('tcp socket', conn);

    conn.on('error', function(err) {
      self.emit('tcp error', err);
      callback(err);
    });

    conn.on('end', function() {
      if(!handled) {
        callback();
      }
    });
  });
};
