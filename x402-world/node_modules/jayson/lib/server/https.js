'use strict';

const https = require('https');
const utils = require('../utils');

/**
 *  Constructor for a Jayson HTTPS server
 *  @class ServerHttps
 *  @extends require('https').Server
 *  @param {Server} server Server instance
 *  @param {Object} [options] Options for this instance
 *  @return {ServerHttps}
 */
const ServerHttps = function(server, options) {
  if(!(this instanceof ServerHttps)) {
    return new ServerHttps(server, options);
  }

  this.options = utils.merge(server.options, options || {});

  const listener = utils.getHttpListener(this, server);
  https.Server.call(this, this.options, listener);
};
require('util').inherits(ServerHttps, https.Server);

module.exports = ServerHttps;
