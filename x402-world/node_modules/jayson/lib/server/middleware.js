'use strict';

const utils = require('../utils');

/**
 * Creates a Connect/Express compatible middleware bound to a Server
 * @class ServerMiddleware
 * @param {Server} server Server instance
 * @param {Object} [outerOptions] Specific options for the middleware
 * @return {Function}
 */
const Middleware = function(server, outerOptions) {
  return function(req, res, next) {
    const options = utils.merge(server.options, outerOptions || {});

    // default options.end to true
    if(typeof(options.end) !== 'boolean') {
      options.end = true;
    }

    //  405 method not allowed if not POST
    if(!utils.isMethod(req, 'POST')) {
      return error(405, { 'Allow': 'POST' });
    }

    // 415 unsupported media type if Content-Type is not correct
    if(!utils.isContentType(req, 'application/json')) {
      return error(415);
    }

    // body does not appear to be parsed, 500 server error
    if(!req.body || typeof(req.body) !== 'object') {
      return next(new Error('Request body must be parsed'));
    }

    server.call(req.body, function(error, success) {
      const response = error || success;

      utils.JSON.stringify(response, options, function(err, body) {
        if(err) {
          return next(err);
        }

        // empty response?
        if(body) {
          const headers = {
            'content-length': Buffer.byteLength(body, options.encoding),
            'content-type': 'application/json; charset=utf-8'
          };

          res.writeHead(200, headers);
          res.write(body);
        } else {
          res.writeHead(204);
        }

        // if end is false, next request instead of ending it
        if(options.end) {
          res.end();
        } else {
          next();
        }

      });
    });

    // ends the request with an error code
    function error(code, headers) {
      res.writeHead(code, headers || {});
      res.end();
    }
  };
};

module.exports = Middleware;
