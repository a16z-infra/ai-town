'use strict';

const Method = require('./method');
const jayson = require('../../');

/**
 * Constructor for a Jayson Promise Server
 * @see Server
 * @class PromiseServer
 * @extends Server
 * @return {PromiseServer}
 */
const PromiseServer = function(methods, options) {
  if(!(this instanceof PromiseServer)) {
    return new PromiseServer(methods, options);
  }
  options = options || {};
  options.methodConstructor = options.methodConstructor || Method;
  jayson.Server.call(this, methods, options);
};
require('util').inherits(PromiseServer, jayson.Server);

module.exports = PromiseServer;
