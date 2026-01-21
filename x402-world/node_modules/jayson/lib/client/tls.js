'use strict';

const tls = require('tls');
const utils = require('../utils');
const Client = require('../client');

/**
 *  Constructor for a Jayson TLS-encrypted TCP Client
 *  @class ClientTls
 *  @constructor
 *  @extends Client
 *  @param {Object|String} [options] Object goes into options for tls.connect, String goes into options.path. String option argument is NOT recommended.
 *  @return {ClientTls}
 */
const ClientTls = function(options) {
  if(typeof(options) === 'string') {
    options = {path: options};
  }

  if(!(this instanceof ClientTls)) {
    return new ClientTls(options);
  }
  Client.call(this, options);

  const defaults = utils.merge(this.options, {
    encoding: 'utf8'
  });

  this.options = utils.merge(defaults, options || {});
};
require('util').inherits(ClientTls, Client);

module.exports = ClientTls;

ClientTls.prototype._request = function(request, callback) {
  const self = this;

  // copies options so object can be modified in this context
  const options = utils.merge({}, this.options);

  utils.JSON.stringify(request, options, function(err, body) {
    if(err) {
      callback(err);
      return;
    }

    let handled = false;

    const conn = tls.connect(options, function() {

      conn.setEncoding(options.encoding);

      // wont get anything for notifications, just end here
      if(utils.Request.isNotification(request)) {

        handled = true;
        conn.end(body + '\n');
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

        conn.write(body + '\n');
      
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
