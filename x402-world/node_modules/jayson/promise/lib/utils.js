'use strict';

const promisify = require('es6-promisify');

/** * @namespace */
const PromiseUtils = module.exports;

/**
 * Wraps the client request method on an instance, making it return a promise in every case except when the fourth argument is explicitly set to false
 * @param {Function} request The original request method
 * @return {Function}
 */
PromiseUtils.wrapClientRequestMethod = function(request) {
  const promisified = promisify(request);

  return function(method, params, id, shouldCall) {
    if(shouldCall === false) {
      // this should return a raw request for use in batches
      return request(method, params, id);
    }
    return promisified.apply(this, arguments);
  };
};
