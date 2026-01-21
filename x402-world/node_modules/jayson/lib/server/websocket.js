'use strict';

const WebSocket = require('isomorphic-ws');
const utils = require('../utils');

/**
 *  Constructor for a Jayson Websocket Server
 *  @name ServerWebsocket
 *  @param {Server} server Server instance
 *  @param {Object} [options] Options for this instance
 *  @param {ws.Websocket.Server} [options.wss] When provided will not create a new ws.WebSocket.Server but use this one
 *  @return {ws.WebSocket.Server}
 */
const ServerWebsocket = function(server, options) {
  const jaysonOptions = utils.merge(server.options, options || {});
  const wss = options.wss || new WebSocket.Server(options);

  wss.on('connection', onConnection);

  function onConnection (ws) {
    // every message received on the socket is handled as a JSON-RPC message
    ws.on('message', function (buf) {
      const str = Buffer.isBuffer(buf) ? buf.toString('utf8') : buf;
      utils.JSON.parse(str, jaysonOptions, function(err, request) {
        if (err) {
          return respondError(err);
        }

        server.call(request, function(error, success) {
          const response = error || success;
          if (response) {
            utils.JSON.stringify(response, jaysonOptions, function (err, str) {
              if (err) {
                return respondError(err);
              }
              ws.send(str);
            });
          } else {
            // no response received at all, must be a notification which we do nothing about
          }
        });
      });
    });

    // writes an error message to the client
    function respondError (err) {
      const error = server.error(-32700, null, String(err));
      const response = utils.response(error, undefined, undefined, jaysonOptions.version);
      utils.JSON.stringify(response, jaysonOptions, function(err, str) {
        if(err) {
          // not much to do here, we couldn't even respond with an error
          throw err;
        }
        ws.send(str);
      });
    }
  }

  return wss;
};

module.exports = ServerWebsocket;
