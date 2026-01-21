'use strict';

const ClientBrowser = require('../../../../lib/client/browser/index');
const promiseUtils = require('../../utils');

/**
 * Constructor for a Jayson Promise Browser Client that does not depend any node.js core libraries
 * @class PromiseClientBrowser
 * @extends ClientBrowser
 * @return {PromiseClientBrowser}
 */
const PromiseClientBrowser = function(callServerPromise, options) {
  if(!(this instanceof PromiseClientBrowser)) {
    return new PromiseClientBrowser(callServerPromise, options);
  }

  const callServer = function (request, callback) {
    callServerPromise(request).then(res => callback(null, res), err => callback(err));
  };

  ClientBrowser.call(this, callServer, options);
  this.request = promiseUtils.wrapClientRequestMethod(this.request.bind(this));
};

// let's hope this ancient method of inheriting works the way I remember it.
PromiseClientBrowser.prototype = ClientBrowser.prototype;

module.exports = PromiseClientBrowser;
