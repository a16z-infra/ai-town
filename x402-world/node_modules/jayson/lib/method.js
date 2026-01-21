'use strict';

const utils = require('./utils');

/**
 * @summary Constructor for a Jayson Method
 * @class Method
 * @param {Function} [handler] Function to set as handler
 * @param {Object} [options] 
 * @param {Function} [options.handler] Same as separate handler
 * @param {Boolean} [options.useContext=false] When true, the handler expects a context object
 * @param {Array|Object} [options.params] Defines params that the handler accepts
 */
const Method = function(handler, options) {

  if(!(this instanceof Method)) {
    return new Method(handler, options);
  }

  // only got passed options
  if(utils.isPlainObject(handler)) {
    options = handler;
    handler = null;
  }

  const defaults = {
    useContext: false,
  };

  options = options || {};

  this.options = utils.merge(defaults, options);
  this.handler = handler || options.handler;
};

module.exports = Method;

/**
 * @summary Returns the handler function associated with this method
 * @return {Function}
 */
Method.prototype.getHandler = function() {
  return this.handler;
};

/**
 * @summary Sets the handler function associated with this method
 * @param {Function} handler
 */
Method.prototype.setHandler = function(handler) {
  this.handler = handler;
};

/**
 * @summary Prepare parameters for the method handler
 * @private
 */
Method.prototype._getHandlerParams = function(params) {
  const options = this.options;

  const isObjectParams = !Array.isArray(params) && utils.isPlainObject(params) && params;
  const isArrayParams = Array.isArray(params);

  switch(true) {

      // handler always gets an array
    case options.params === Array:
      return isArrayParams ? params : utils.toArray(params);

      // handler always gets an object
    case options.params === Object:
      return isObjectParams ? params : utils.toPlainObject(params);

      // handler gets a list of defined properties that should always be set
    case Array.isArray(options.params): {
      const undefinedParams = Object.keys(options.params).reduce(function (out, index) {
        const key = options.params[index];
        out[key] = undefined;
        return out;
      }, {});
      return {...undefinedParams, ...utils.pick(params, Object.keys(params))};
    }

      // handler gets a map of defined properties and their default values
    case utils.isPlainObject(options.params):
      return {...options.params, ...utils.pick(params, Object.keys(params))};

      // give params as is
    default:
      return params;

  }

};

/**
 * @summary Executes this method in the context of a server
 * @param {Server} server
 * @param {Array|Object} requestParams
 * @param {Object} [context]
 * @param {Function} callback
 */
Method.prototype.execute = function(server, requestParams, context, callback) {
  if(typeof(context) === 'function') {
    callback = context;
    context = {};
  }

  if(!context) {
    context = {};
  }

  // when useContext is true, the handler gets a context object every time
  const useContext = Boolean(this.options.useContext);
  const handler = this.getHandler();
  const params = this._getHandlerParams(requestParams);

  const args = useContext ? [params, context, callback] : [params, callback];
  return handler.call(server, ...args);
};
