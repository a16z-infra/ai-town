'use strict';

const events = require('events');
const jayson = require('../');
const utils = require('../utils');

/**
 *  Constructor for a Jayson Server
 *  @class Server
 *  @extends require('events').EventEmitter
 *  @param {Object<String,Function>} [methods] Methods to add
 *  @param {Object} [options]
 *  @param {Array|Object} [options.params] Passed to Jayson.Method as an option when created
 *  @param {Boolean} [options.useContext=false] Passed to Jayson.Method as an option when created
 *  @param {Function} [options.reviver] Reviver function for JSON
 *  @param {Function} [options.replacer] Replacer function for JSON
 *  @param {Function} [options.methodConstructor] Methods will be made instances of this class
 *  @param {String} [options.encoding="utf8"] Encoding to use
 *  @param {Number} [options.version=2] JSON-RPC version to use (1|2)
 *  @param {Number} [options.maxBatchLength=Infinity] Maximum requests allowed in a batch
 *  @param {Function} [options.router] Function to use for routing methods
 *  @property {Object} options A reference to the internal options object that can be modified directly
 *  @property {Object} errorMessages Map of error code to error message pairs that will be used in server responses
 *  @property {ServerHttp} http HTTP interface constructor
 *  @property {ServerHttps} https HTTPS interface constructor
 *  @property {ServerTcp} tcp TCP interface constructor
 *  @property {ServerTls} tls TLS interface constructor
 *  @property {Middleware} middleware Middleware generator function
 *  @return {Server}
 */
const Server = function(methods, options) {
  if(!(this instanceof Server)) {
    return new Server(methods, options);
  }

  const defaults = {
    reviver: null,
    replacer: null,
    encoding: 'utf8',
    version: 2,
    useContext: false,
    methodConstructor: jayson.Method,
    maxBatchLength: Infinity,
    router: function(method) {
      return this.getMethod(method);
    }
  };

  this.options = utils.merge(defaults, options || {});

  // bind router to the server
  this.options.router = this.options.router.bind(this);
  
  this._methods = {};

  // adds methods passed to constructor
  this.methods(methods || {});

  // assigns interfaces to this instance
  const interfaces = Server.interfaces;
  for(let name in interfaces) {
    this[name] = interfaces[name].bind(interfaces[name], this);
  }

  // copies error messages for defined codes into this instance
  this.errorMessages = {};
  for(let handle in Server.errors) {
    const code = Server.errors[handle];
    this.errorMessages[code] = Server.errorMessages[code];
  }

};
require('util').inherits(Server, events.EventEmitter);

module.exports = Server;

/**
 * Interfaces that will be automatically bound as properties of a Server instance
 * @enum {Function}
 * @static
 */
Server.interfaces = {
  http: require('./http'),
  https: require('./https'),
  tcp: require('./tcp'),
  tls: require('./tls'),
  websocket: require('./websocket'),
  middleware: require('./middleware')
};

/**
 * JSON-RPC specification errors that map to an integer code
 * @enum {Number}
 * @static
 */
Server.errors = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  INVALID_REQUEST_MAX_BATCH_LENGTH_EXCEEDED: -32099,
};

/*
 * Error codes that map to an error message
 * @enum {String}
 * @static
 */
Server.errorMessages = {};
Server.errorMessages[Server.errors.PARSE_ERROR] = 'Parse Error';
Server.errorMessages[Server.errors.INVALID_REQUEST] = 'Invalid request';
Server.errorMessages[Server.errors.METHOD_NOT_FOUND] = 'Method not found';
Server.errorMessages[Server.errors.INVALID_PARAMS] = 'Invalid method parameter(s)';
Server.errorMessages[Server.errors.INTERNAL_ERROR] = 'Internal error';
Server.errorMessages[Server.errors.INVALID_REQUEST_MAX_BATCH_LENGTH_EXCEEDED] = 'Invalid request: Maximum batch length exceeded';

/**
 *  Adds a single method to the server
 *  @param {String} name Name of method to add
 *  @param {Function|Client} definition Function or Client for a relayed method
 *  @throws {TypeError} Invalid parameters
 */
Server.prototype.method = function(name, definition) {
  const Method = this.options.methodConstructor;

  const isRelay = definition instanceof jayson.Client;
  const isMethod = definition instanceof Method;
  const isDefinitionFunction = typeof definition === 'function';

  // a valid method is either a function or a client (relayed method)
  if(!isRelay && !isMethod && !isDefinitionFunction) {
    throw new TypeError('method definition must be either a function, an instance of jayson.Client or an instance of jayson.Method');
  }

  if(!name || typeof(name) !== 'string') {
    throw new TypeError('"' + name + '" must be a non-zero length string');
  }

  if(/^rpc\./.test(name)) {
    throw new TypeError('"' + name + '" is a reserved method name');
  }

  // make instance of jayson.Method
  if(!isRelay && !isMethod) {
    definition = new Method(definition, {
      params: this.options.params,
      useContext: this.options.useContext
    });
  }

  this._methods[name] = definition;
};

/**
 *  Adds a batch of methods to the server
 *  @param {Object} methods Methods to add
 */
Server.prototype.methods = function(methods) {
  methods = methods || {};

  for(let name in methods) {
    this.method(name, methods[name]);
  }

};

/**
 *  Checks if a method is registered with the server
 *  @param {String} name Name of method
 *  @return {Boolean}
 */
Server.prototype.hasMethod = function(name) {
  return name in this._methods;
};

/**
 *  Removes a method from the server
 *  @param {String} name
 */
Server.prototype.removeMethod = function(name) {
  if(this.hasMethod(name)) {
    delete this._methods[name];
  }
};

/**
 * Gets a method from the server
 * @param {String} name
 * @return {Method}
 */
Server.prototype.getMethod = function(name) {
  if (Object.prototype.hasOwnProperty.call(this._methods, name)) {
    return this._methods[name];
  }
};

/**
 *  Returns a JSON-RPC compatible error property
 *  @param {Number} [code=-32603] Error code
 *  @param {String} [message="Internal error"] Error message
 *  @param {Object} [data] Additional data that should be provided
 *  @return {Object}
 */
Server.prototype.error = function(code, message, data) {
  if(typeof(code) !== 'number') {
    code = Server.errors.INTERNAL_ERROR;
  }

  if(typeof(message) !== 'string') {
    message = this.errorMessages[code] || '';
  }

  const error = { code: code, message: message };
  if(typeof(data) !== 'undefined') {
    error.data = data;
  }
  return error;
};

/**
 *  Calls a method on the server
 *  @param {Object|Array|String} request A JSON-RPC request object. Object for single request, Array for batches and String for automatic parsing (using the reviver option)
 *  @param {Object} [context] Optional context object passed to methods
 *  @param {Function} [originalCallback] Callback that receives one of two arguments: first is an error and the second a response
 */
Server.prototype.call = function(request, context, originalCallback) {
  const self = this;

  if(typeof(context) === 'function') {
    originalCallback = context;
    context = {};
  }

  if(typeof(context) === 'undefined') {
    context = {};
  }

  if(typeof(originalCallback) !== 'function') {
    originalCallback = function() {};
  }

  // compose the callback so that we may emit an event on every response
  const callback = function(error, response) {
    self.emit('response', request, response || error);
    originalCallback.apply(null, arguments);
  };

  maybeParse(request, this.options, function(err, request) {
    let error = null; // JSON-RPC error

    if(err) {
      error = self.error(Server.errors.PARSE_ERROR, null, err);
      callback(utils.response(error, undefined, undefined, self.options.version));
      return;
    }

    // is this a batch request?
    if(utils.Request.isBatch(request)) {

      // batch requests not allowed for version 1
      if(self.options.version === 1) {
        error = self.error(Server.errors.INVALID_REQUEST);
        callback(utils.response(error, undefined, undefined, self.options.version));
        return;
      }

      // special case if empty batch request
      if(!request.length) {
        error = self.error(Server.errors.INVALID_REQUEST);
        callback(utils.response(error, undefined, undefined, self.options.version));
        return;
      }

      // verify number of batch requests does not exceed maximum allowed length
      if (self.options.maxBatchLength >= 0 && request.length > self.options.maxBatchLength) {
        error = self.error(Server.errors.INVALID_REQUEST_MAX_BATCH_LENGTH_EXCEEDED);
        callback(utils.response(error, undefined, undefined, self.options.version));
        return;
      }

      self._batch(request, context, callback);
      return;
    }

    self.emit('request', request);

    // is the request valid?
    if(!utils.Request.isValidRequest(request, self.options.version)) {
      error = self.error(Server.errors.INVALID_REQUEST);
      callback(utils.response(error, undefined, undefined, self.options.version));
      return;
    }

    // from now on we are "notification-aware" and can deliberately ignore errors for such requests
    const respond = function(error, result) {
      if(utils.Request.isNotification(request)) {
        callback();
        return;
      }
      const response = utils.response(error, result, request.id, self.options.version);
      if(response.error) {
        callback(response);
      } else {
        callback(null, response);
      }
    };

    const method = self._resolveRouter(request.method, request.params);

    // are we attempting to invoke a relayed method?
    if(method instanceof jayson.Client) {
      return method.request(request.method, request.params, request.id, function(error, response) {
        if(utils.Request.isNotification(request)) {
          callback();
          return;
        }
        callback(error, response);
      });
    }
    
    // does the method exist?
    if(!(method instanceof jayson.Method)) {
      respond(self.error(Server.errors.METHOD_NOT_FOUND));
      return;
    }

    // execute jayson.Method instance
    method.execute(self, request.params, context, function(error, result) {
    
      if(utils.Response.isValidError(error, self.options.version)) {
        respond(error);
        return;
      }

      // got an invalid error
      if(error) {
        respond(self.error(Server.errors.INTERNAL_ERROR));
        return;
      }

      respond(null, result);
    
    });

  });
};

/**
 *  Calls a method on the server returning a promise
 *  @param {Object|Array|String} request A JSON-RPC request object. Object for single request, Array for batches and String for automatic parsing (using the reviver option)
 *  @param {Object} [context] Optional context object passed to methods
 *  @return {Promise<Object>}
 */
Server.prototype.callp = function (...args) {
  const self = this;
  return new Promise(function (resolve, reject) {
    return self.call(...args, function (err, response) {
      if (err) {
        reject(err);
        return;
      }
      resolve(response);
    });
  });
};

/**
 * Invoke the router
 * @param {String} method Method to resolve
 * @param {Array|Object} params Request params
 * @return {Method}
 */
Server.prototype._resolveRouter = function(method, params) {

  let router = this.options.router;

  if(typeof router !== 'function') {
    router = function(method) {
      return this.getMethod(method);
    };
  }

  const resolved = router.call(this, method, params);

  // got a jayson.Method or a jayson.Client, return it
  if((resolved instanceof jayson.Method) || (resolved instanceof jayson.Client)) {
    return resolved;
  }

  // got a regular function, make it an instance of jayson.Method
  if(typeof resolved === 'function') {
    return new jayson.Method(resolved);
  }

};

/**
 *  Evaluates a batch request
 *  @private
 */
Server.prototype._batch = function(requests, context, callback) {
  const self = this;
  
  const responses = [];

  this.emit('batch', requests);

  /**
   * @ignore
   */
  const maybeRespond = function() {

    // done when we have filled up all the responses with a truthy value
    const isDone = responses.every(function(response) { return response !== null; });
    if(isDone) {

      // filters away notifications
      const filtered = responses.filter(function(res) {
        return res !== true;
      });

      // only notifications in request means empty response
      if(!filtered.length) {
        callback();
        return;
      }
      callback(null, filtered);
    }
  };

  /**
   * @ignore
   */
  const wrapper = function(request, index) {
    responses[index] = null;
    return function() {
      if(utils.Request.isValidRequest(request, self.options.version)) {
        self.call(request, context, function(error, response) {
          responses[index] = error || response || true;
          maybeRespond();
        });
      } else {
        const error = self.error(Server.errors.INVALID_REQUEST);
        responses[index] = utils.response(error, undefined, undefined, self.options.version);
        maybeRespond();
      }
    };
  };

  const stack = requests.map(function(request, index) {
    // ignore possibly nested requests
    if(utils.Request.isBatch(request)) {
      return null;
    }
    return wrapper(request, index);
  });

  stack.forEach(function(method) {
    if(typeof(method) === 'function') {
      method();
    }
  });
};

/**
 * Parse "request" if it is a string, else just invoke callback
 * @ignore
 */
function maybeParse(request, options, callback) {
  if(typeof(request) === 'string') {
    utils.JSON.parse(request, options, callback);
  } else {
    callback(null, request);
  }
}
