'use strict';

const WebSocket = require('isomorphic-ws');
const utils = require('../utils');
const delay = require('delay');
const Client = require('../client');

/**
 *  Constructor for a Jayson Websocket Client
 *  @class ClientWebsocket
 *  @constructor
 *  @extends Client
 *  @param {Object} [options]
 *  @param {String} [options.url] When options.ws not provided this will be the URL to open the websocket to
 *  @param {ws.WebSocket} [options.ws] When not provided will create a WebSocket instance with options.url
 *  @param {Number} [options.timeout] Will wait this long in ms until callbacking with an error
 *  @return {ClientWebsocket}
 */
const ClientWebsocket = function(options) {
  if(!(this instanceof ClientWebsocket)) {
    return new ClientWebsocket(options);
  }
  Client.call(this, options);

  const defaults = utils.merge(this.options, {});
  this.options = utils.merge(defaults, options || {});

  const self = this;
  
  this.ws = this.options.ws || new WebSocket(this.options.url);
  this.outstandingRequests = [];
  this.handlers = {};

  this.handlers.message = function (str) {
    utils.JSON.parse(str, self.options, function(err, response) {
      if (err) {
        // invalid JSON is ignored
        return;
      }

      if (Array.isArray(response)) {

        // we have a batch reply
        const matchingRequest = self.outstandingRequests.find(function ([request]) {
          if (Array.isArray(request)) {
            // a batch is considered matching if at least one response id matches one request id
            return response.some(function (resp) {
              if (utils.Response.isValidResponse(resp)) {
                return request.some(function (req) {
                  return req.id === resp.id;
                });
              }
              return false;
            });
          }
        });

        if (matchingRequest) {
          const [ , resolve ] = matchingRequest;
          return resolve(response);
        }

      } else if (utils.Response.isValidResponse(response)) {

        const matchingRequest = self.outstandingRequests.find(function ([request]) {
          return !Array.isArray(request) && request.id === response.id;
        });

        if (matchingRequest) {
          const [ , resolve ] = matchingRequest;
          return resolve(response);
        }
      }

    });
  };

  this.ws.on('message', this.handlers.message);
};
require('util').inherits(ClientWebsocket, Client);

module.exports = ClientWebsocket;

/**
 * @desc Removes all event listeners from Websocket instance which cancels all outstanding requests too
 */
ClientWebsocket.prototype.unlisten = function () {
  for (const eventName in this.handlers) {
    this.ws.off(eventName, this.handlers[eventName]);
  }
};

ClientWebsocket.prototype._request = function(request, callback) {
  const self = this;
  const { ws, options } = this;

  // we have to remove the object representing this request when the promise resolves/rejects
  let outstandingItem;

  Promise.race([
    options.timeout > 0 ? delay(options.timeout).then(function () {
      throw new Error('timeout reached after ' + options.timeout + ' ms');
    }) : null,
    new Promise(function (resolve, reject) {
      utils.JSON.stringify(request, options, function(err, body) {
        if (err) {
          return resolve(err);
        }

        ws.send(body);

        if (utils.Request.isNotification(request)) {
          // notifications callback immediately since they don't have a reply
          return resolve();
        }

        outstandingItem = [request, resolve, reject];
        self.outstandingRequests.push(outstandingItem);
      });
    }),
  ].filter(v => v !== null)).then(function (result) {
    removeOutstandingRequest();
    callback(null, result);
  }).catch(function (err) {
    removeOutstandingRequest();
    callback(err);
  });

  function removeOutstandingRequest () {
    if (!outstandingItem) {
      return;
    }
    self.outstandingRequests = self.outstandingRequests.filter(v => v !== outstandingItem);
  }
};
