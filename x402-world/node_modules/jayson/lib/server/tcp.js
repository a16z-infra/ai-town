'use strict';

const net = require('net');
const utils = require('../utils');

/**
 *  Constructor for a Jayson TCP server
 *  @class ServerTcp
 *  @extends require('net').Server
 *  @param {Server} server Server instance
 *  @param {Object} [options] Options for this instance
 *  @return {ServerTcp}
 */
const ServerTcp = function(server, options) {
  if(!(this instanceof ServerTcp)) {
    return new ServerTcp(server, options);
  }

  this.options = utils.merge(server.options, options || {});

  net.Server.call(this, getTcpListener(this, server));
};
require('util').inherits(ServerTcp, net.Server);

module.exports = ServerTcp;

/**
 *  Returns a TCP connection listener bound to the server in the argument.
 *  @param {Server} server Instance of JaysonServer
 *  @param {net.Server} self Instance of net.Server
 *  @return {Function}
 *  @private
 *  @ignore
 */
function getTcpListener(self, server) {
  return function(conn) {
    const options = self.options || {};

    utils.parseStream(conn, options, function(err, request) {
      if(err) {
        return respondError(err);
      }

      server.call(request, function(error, success) {
        const response = error || success;
        if(response) {
          utils.JSON.stringify(response, options, function(err, body) {
            if(err) {
              return respondError(err);
            }
            conn.write(body);
          });
        } else {
          // no response received at all, must be a notification
        }
      });
    });

    // ends the request with an error code
    function respondError(err) {
      const error = server.error(-32700, null, String(err));
      const response = utils.response(error, undefined, undefined, self.options.version);
      utils.JSON.stringify(response, options, function(err, body) {
        if(err) {
          body = ''; // we tried our best.
        }
        conn.end(body);
      });
    }

  };
}
