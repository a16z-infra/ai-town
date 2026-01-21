'use strict';

const jayson = require('../../');

/**
 * Constructor for a Jayson Promise Method
 * @see Method
 * @class PromiseMethod
 * @extends Method
 * @return {PromiseMethod}
 */
const PromiseMethod = module.exports = function(handler, options) {
  if(!(this instanceof PromiseMethod)) {
    return new PromiseMethod(handler, options);
  }
  jayson.Method.apply(this, arguments);
};
require('util').inherits(PromiseMethod, jayson.Method);

module.exports = PromiseMethod;

/**
 * @summary Executes this method in the context of a server
 * @param {Server} server
 * @param {Array|Object} requestParams
 * @param {Object} [context] Optional context object passed to methods
 * @param {Function} outerCallback
 * @return {Promise}
 */
PromiseMethod.prototype.execute = function(server, requestParams, context, outerCallback) {
  let wasPromised = false;

  if(typeof(context) === 'function') {
    outerCallback = context;
    context = {};
  }

  const promise = jayson.Method.prototype.execute.call(this, server, requestParams, context, function() {
    if(wasPromised) {
      return; // ignore any invocations of the callback if a promise was returned
    }
    outerCallback.apply(null, arguments);
  });

  wasPromised = promise && typeof promise.then === 'function';

  // if the handler returned a promise, call the callback when it resolves
  if(wasPromised) {
    return promise.then(
      function(fulfilled) { outerCallback(null, fulfilled); },
      function(rejected) { outerCallback(rejected); }
    );
  }
};
