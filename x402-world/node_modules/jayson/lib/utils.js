'use strict';

const StreamValues = require('stream-json/streamers/StreamValues');
const Verifier = require('stream-json/utils/Verifier');
const JSONstringify = require('json-stringify-safe');
const uuid = require('uuid').v4;

const generateRequest = require('./generateRequest');

/** * @namespace */
const Utils = module.exports;

// same reference as other files use, for tidyness
const utils = Utils;

Utils.request = generateRequest;

/**
 *  Generates a JSON-RPC 1.0 or 2.0 response
 *  @param {Object} error Error member
 *  @param {Object} result Result member
 *  @param {String|Number|null} id Id of request
 *  @param {Number} version JSON-RPC version to use
 *  @return {Object} A JSON-RPC 1.0 or 2.0 response
 */
Utils.response = function(error, result, id, version) {
  id = typeof(id) === 'undefined' || id === null ? null : id;
  error = typeof(error) === 'undefined' || error === null ? null : error;
  version = typeof(version) === 'undefined' || version === null ? 2 : version;
  result = typeof(result) === 'undefined' || result === null ? null : result;
  const response = (version === 2) ? { jsonrpc: "2.0", id: id } : { id: id };

  // errors are always included in version 1
  if(version === 1) {
    response.error = error;
  }

  // one or the other with precedence for errors
  if(error) {
    response.error = error;
  } else {
    response.result = result;
  }
  return response;
};

/**
 *  Generates a random UUID
 *  @return {String}
 */
Utils.generateId = function() {
  return uuid();
};

/**
 *  Merges properties of object b into object a
 *  @param {...Object} args Objects to be merged
 *  @return {Object}
 *  @private
 */
Utils.merge = function(...args) {
  return args.reduce(function (out, obj) {
    return {...out, ...obj};
  }, {});
};

/**
 * Parses an incoming stream for requests using stream-json
 * @param {Stream} stream
 * @param {Object} options
 * @param {Function} onRequest Called once for stream errors and an unlimited amount of times for valid requests
 */
Utils.parseStream = function(stream, options, onRequest) {
  const onError = Utils.once(onRequest);
  const onSuccess = (...args) => onRequest(null, ...args);

  const verifier = new Verifier({jsonStreaming: true});
  const parser = StreamValues.withParser();

  parser.on('data', function(obj) {
    let data = obj.value;

    // apply reviver walk function to prevent stringify/parse again
    if(typeof options.reviver === 'function') {
      data = Utils.walk({'': data}, '', options.reviver);
    }

    onSuccess(data);
  });

  parser.on('error', onError);
  verifier.on('error', onError);
  stream.on('error', onError);

  stream.pipe(verifier);
  stream.pipe(parser);
};

/**
 * Returns a function that can only be called once
 * @param {Function} fn
 * @return {Function}
 */
Utils.once = function (fn) {
  let called = false;
  let lastRetval;
  return function (...args) {
    if (called) return lastRetval;
    called = true;
    lastRetval = fn.call(this, ...args);
  };
};

/**
 * Returns true if obj is a plain object (not null)
 * @param {*} obj
 * @return {Boolean}
 */
Utils.isPlainObject = function (obj) {
  return typeof obj === 'object' && obj !== null;
};

/**
 * Converts an object to an array
 * @param {*} obj
 * @return {Array}
 */
Utils.toArray = function (obj) {
  if (Array.isArray(obj)) return obj;
  if (Utils.isPlainObject(obj)) return Object.keys(obj).map(function (key) {
    return obj[key];
  });
  if (!obj) return [];
  return Array.prototype.slice.call(obj);
};

/**
 * Converts an object to a plain object
 * @param {*} obj
 * @return {Object}
 */
Utils.toPlainObject = function (value) {
  value = Object(value);
  const result = {};
  for (const key in value) {
    result[key] = value[key];
  }
  return result;
};

/**
 * Picks keys from obj
 * @param {Object} obj
 * @param {String[]} keys
 * @return {Object}
 */
Utils.pick = function (obj, keys) {
  return keys.reduce(function (out, key) {
    out[key] = obj[key];
    return out;
  }, {});
};

/**
 *  Helper to parse a stream and interpret it as JSON
 *  @param {Stream} stream Stream instance
 *  @param {Function} [options] Optional options for JSON.parse
 *  @param {Function} callback
 */
Utils.parseBody = function(stream, options, callback) {

  callback = Utils.once(callback);
  let data = '';

  stream.setEncoding('utf8');

  stream.on('data', function(str) {
    data += str;
  });

  stream.on('error', function(err) {
    callback(err);
  });

  stream.on('end', function() {
    utils.JSON.parse(data, options, function(err, request) {
      if(err) {
        callback(err);
        return;
      }
      callback(null, request);
    });
  });

};

/**
 *  Returns a HTTP request listener bound to the server in the argument.
 *  @param {http.Server} self Instance of a HTTP server
 *  @param {JaysonServer} server Instance of JaysonServer (typically jayson.Server)
 *  @return {Function}
 *  @private
 */
Utils.getHttpListener = function(self, server) {
  return function(req, res) {
    const options = self.options || {};

    server.emit('http request', req);

    //  405 method not allowed if not POST
    if(!Utils.isMethod(req, 'POST')) {
      return respond('Method Not Allowed', 405, {'allow': 'POST'});
    }

    // 415 unsupported media type if Content-Type is not correct
    if(!Utils.isContentType(req, 'application/json')) {
      return respond('Unsupported Media Type', 415);
    }

    Utils.parseBody(req, options, function(err, request) {
      if(err) {
        return respond(err, 400);
      }

      server.call(request, function(error, success) {
        const response = error || success;
        if(!response) {
          // no response received at all, must be a notification
          return respond('', 204);
        }

        utils.JSON.stringify(response, options, function(err, body) {
          if(err) {
            return respond(err, 500);
          }

          const headers = {
            'content-length': Buffer.byteLength(body, options.encoding),
            'content-type': 'application/json; charset=utf-8'
          };

          respond(body, 200, headers);
        });

      });

    });

    function respond(response, code, headers) {
      const body = response instanceof Error ? response.toString() : response;
      server.emit('http response', res, req);
      res.writeHead(code, headers || {});
      res.end(body);
    }

  };
};

/**
 *  Determines if a HTTP Request comes with a specific Content-Type
 *  @param {ServerRequest} request
 *  @param {String} type
 *  @return {Boolean}
 *  @private
 */
Utils.isContentType = function(request, type) {
  request = request || {headers: {}};
  const contentType = request.headers['content-type'] || '';
  return RegExp(type, 'i').test(contentType);
};

/**
 *  Determines if a HTTP Request is of a specific method
 *  @param {ServerRequest} request
 *  @param {String} method
 *  @return {Boolean}
 *  @private
 */
Utils.isMethod = function(request, method) {
  method = (method || '').toUpperCase();
  return (request.method || '') === method;
};

/**
 * Recursively walk an object and apply a function on its members
 * @param {Object} holder The object to walk
 * @param {String} key The key to look at
 * @param {Function} fn The function to apply to members
 * @return {Object}
 */
Utils.walk = function(holder, key, fn) {
  let k, v, value = holder[key];
  if (value && typeof value === 'object') {
    for (k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        v = Utils.walk(value, k, fn);
        if (v !== undefined) {
          value[k] = v;
        } else {
          delete value[k];
        }
      }
    }
  }
  return fn.call(holder, key, value);
};

/** * @namespace */
Utils.JSON = {};

/**
 * Parses a JSON string and then invokes the given callback
 * @param {String} str The string to parse
 * @param {Object} options Object with options, possibly holding a "reviver" function
 * @param {Function} callback
 */
Utils.JSON.parse = function(str, options, callback) {
  let reviver = null;
  let obj = null;
  options = options || {};

  if(typeof options.reviver === 'function') {
    reviver = options.reviver;
  }

  try {
    obj = JSON.parse.apply(JSON, [str, reviver].filter(v => v));
  } catch(err) {
    callback(err);
    return;
  }

  callback(null, obj);
};

/**
 * Stringifies JSON and then invokes the given callback
 * @param {Object} obj The object to stringify
 * @param {Object} options Object with options, possibly holding a "replacer" function
 * @param {Function} callback
 */
Utils.JSON.stringify = function(obj, options, callback) {
  let replacer = null;
  let str = null;
  options = options || {};

  if(typeof options.replacer === 'function') {
    replacer = options.replacer;
  }

  try {
    str = JSONstringify.apply(JSON, [obj, replacer].filter(v => v));
  } catch(err) {
    callback(err);
    return;
  }

  callback(null, str);
};

/** * @namespace */
Utils.Request = {};

/**
 * Determines if the passed request is a batch request
 * @param {Object} request The request
 * @return {Boolean}
 */
Utils.Request.isBatch = function(request) {
  return Array.isArray(request);
};

/**
 * Determines if the passed request is a notification request
 * @param {Object} request The request
 * @return {Boolean}
 */
Utils.Request.isNotification = function(request) {
  return Boolean(
    request
    && !Utils.Request.isBatch(request)
    && (typeof(request.id) === 'undefined'
         || request.id === null)
  );
};

/**
 * Determines if the passed request is a valid JSON-RPC 2.0 Request
 * @param {Object} request The request
 * @return {Boolean}
 */
Utils.Request.isValidVersionTwoRequest = function(request) {
  return Boolean(
    request
    && typeof(request) === 'object'
    && request.jsonrpc === '2.0'
    && typeof(request.method) === 'string'
    && (
      typeof(request.params) === 'undefined'
      || Array.isArray(request.params)
      || (request.params && typeof(request.params) === 'object')
    )
    && (
      typeof(request.id) === 'undefined'
      || typeof(request.id) === 'string'
      || typeof(request.id) === 'number'
      || request.id === null
    )
  );
};

/**
 * Determines if the passed request is a valid JSON-RPC 1.0 Request
 * @param {Object} request The request
 * @return {Boolean}
 */
Utils.Request.isValidVersionOneRequest = function(request) {
  return Boolean(
    request
    && typeof(request) === 'object'
    && typeof(request.method) === 'string'
    && Array.isArray(request.params)
    && typeof(request.id) !== 'undefined'
  );
};

/**
 * Determines if the passed request is a valid JSON-RPC Request
 * @param {Object} request The request
 * @param {Number} [version=2] JSON-RPC version 1 or 2
 * @return {Boolean}
 */
Utils.Request.isValidRequest = function(request, version) {
  version = version === 1 ? 1 : 2;
  return Boolean(
    request
    && (
      (version === 1 && Utils.Request.isValidVersionOneRequest(request)) ||
      (version === 2 && Utils.Request.isValidVersionTwoRequest(request))
    )
  );
};

/** * @namespace */
Utils.Response = {};

/**
 * Determines if the passed error is a valid JSON-RPC error response
 * @param {Object} error The error
 * @param {Number} [version=2] JSON-RPC version 1 or 2
 * @return {Boolean}
 */
Utils.Response.isValidError = function(error, version) {
  version = version === 1 ? 1 : 2;
  return Boolean(
    version === 1 && (
      typeof(error) !== 'undefined'
      && error !== null
    )
    || version === 2 && (
      error
      && typeof(error.code) === 'number'
      && parseInt(error.code, 10) === error.code
      && typeof(error.message) === 'string'
    )
  );
};

/**
 * Determines if the passed object is a valid JSON-RPC response
 * @param {Object} response The response
 * @param {Number} [version=2] JSON-RPC version 1 or 2
 * @return {Boolean}
 */
Utils.Response.isValidResponse = function(response, version) {
  version = version === 1 ? 1 : 2;
  return Boolean(
    response !== null
    && typeof response === 'object'
    && (version === 2 && (
      // check version
      response.jsonrpc === '2.0'
      && (
        // check id
        response.id === null
        || typeof response.id === 'string'
        || typeof response.id === 'number'
      )
      && (
        // result and error do not exist at the same time
        (typeof response.result === 'undefined' && typeof response.error !== 'undefined')
        || (typeof response.result !== 'undefined' && typeof response.error === 'undefined')
      )
      && (
        // check result
        (typeof response.result !== 'undefined')
        // check error object
        || (
          response.error !== null
          && typeof response.error === 'object'
          && typeof response.error.code === 'number'
          // check error.code is integer
          && ((response.error.code | 0) === response.error.code)
          && typeof response.error.message === 'string'
        )
      )
    )
      || version === 1 && (
        typeof response.id !== 'undefined'
        && (
          // result and error relation (the other null if one is not)
          (typeof response.result !== 'undefined' && response.error === null)
          || (typeof response.error !== 'undefined' && response.result === null)
        )
      ))
  );
};
