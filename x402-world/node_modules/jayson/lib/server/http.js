'use strict';

const http = require('http');
const utils = require('../utils');

/**
 *  Constructor for a Jayson HTTP server
 *  @class ServerHttp
 *  @extends require('http').Server
 *  @param {Server} server Server instance
 *  @param {Object} [options] Options for this instance
 *  @return {ServerHttp}
 */
const ServerHttp = function(server, options) {
  if(!(this instanceof ServerHttp)) {
    return new ServerHttp(server, options);
  }

  this.options = utils.merge(server.options, options || {});

  const listener = utils.getHttpListener(this, server);
  http.Server.call(this, listener);
};
require('util').inherits(ServerHttp, http.Server);

module.exports = ServerHttp;
