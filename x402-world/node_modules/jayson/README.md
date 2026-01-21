# Jayson

Jayson is a [JSON-RPC 2.0][jsonrpc-spec] and [1.0][jsonrpc1-spec] compliant server and client written in JavaScript for [node.js][node.js] that aims to be as simple as possible to use.

[jsonrpc-spec]: http://jsonrpc.org/spec.html 
[jsonrpc1-spec]: http://json-rpc.org/wiki/specification
[node.js]: http://nodejs.org/
[jayson-npm]: https://www.npmjs.com/package/jayson
[badge-npm]: https://img.shields.io/npm/v/jayson.svg
[badge-downloads-month]: https://img.shields.io/npm/dm/jayson.svg

[![Coverage Status](https://coveralls.io/repos/github/tedeh/jayson/badge.svg?branch=master)](https://coveralls.io/github/tedeh/jayson?branch=master)
![GitHub issues](https://img.shields.io/github/issues/tedeh/jayson)
![Dependents (via libraries.io)](https://img.shields.io/librariesio/dependents/npm/jayson)
![node-current](https://img.shields.io/node/v/jayson)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/jayson)
[![npm version][badge-npm]][jayson-npm]
[![npm][badge-downloads-month]][jayson-npm]
![npm bundle size](https://img.shields.io/bundlephobia/min/jayson)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/jayson)
[![Known Vulnerabilities](https://snyk.io/test/npm/jayson/badge.svg)](https://snyk.io/test/npm/jayson)

## Table of contents

- [Features](#features)
- [Example](#example)
- [Installation](#installation)
- [Changelog](#changelog-only-notable-milestoneschanges)
- [Requirements](#requirements)
- [Class Documentation](#class-documentation)
- [Running tests](#running-tests)
- [Typescript](#typescript)
- [Usage](#usage)
  - [Client](#client)
     - [Interface description](#client-interface-description)
     - [Browser usage](#clientbrowser)
     - [Notifications](#notifications)
     - [Batches](#batches)
     - [Callback syntactic sugar](#client-callback-syntactic-sugar)
     - [Events](#client-events)
  - [Server](#server)
     - [Interface description](#server-interface-description)
     - [Many interfaces at the same time](#many-interfaces-at-the-same-time)
     - [Using the server as a relay](#using-the-server-as-a-relay)
     - [Method routing](#method-routing)
     - [Method definition](#method-definition)
     - [Events](#server-events)
     - [Errors](#server-errors)
     - [CORS](#server-cors)
     - [Context](#server-context)
- [Revivers and replacers](#revivers-and-replacers)
- [Named parameters](#named-parameters)
- [Promises](#promises)
  - [Batches](#promise-batches)
  - [Browser client](#promise-browser-client)
- [FAQ](#faq)
- [Recommended usage](#what-is-the-recommended-way-to-use-jayson)
- [Contributing](#contributing)

## Features

* [Servers that can listen to several interfaces at the same time](#many-interfaces-at-the-same-time)
* Supports both HTTP and TCP client and server connections
* [Server-side method routing](#method-routing)
* [Relaying of requests to other servers](#using-the-server-as-a-relay)
* [JSON reviving and replacing for transparent serialization of complex objects](#revivers-and-replacers)
* [CLI client](#cli-client)
* [Promises](#promises)
* Fully tested to comply with the [official JSON-RPC 2.0 specification][jsonrpc-spec]
* Also supports [JSON-RPC 1.0][jsonrpc1-spec]

## Example

A basic JSON-RPC 2.0 server via HTTP:

Server example in [examples/simple_example/server.js](examples/simple_example/server.js):

```javascript
const jayson = require('jayson');

// create a server
const server = new jayson.Server({
  add: function(args, callback) {
    callback(null, args[0] + args[1]);
  }
});

server.http().listen(3000);
```

Client example in [examples/simple_example/client.js](examples/simple_example/client.js) invoking `add` on the above server:

```javascript
const jayson = require('jayson');

// create a client
const client = jayson.Client.http({
  port: 3000
});

// invoke "add"
client.request('add', [1, 1], function(err, response) {
  if(err) throw err;
  console.log(response.result); // 2
});
```

## Installation

Install the latest version of _jayson_ from [npm](https://www.npmjs.com) by executing `npm install jayson` in your shell. Do a global install with `npm install --global jayson` if you want the `jayson` client CLI in your PATH.

## Changelog (only notable milestones/changes)

- *4.1.0*
  - New server option `maxBatchLength`
- *4.0.0*
  - Remove `lodash` dependency which should halve bundle size. There might be minor incompatibilities if you pass funky object or array types to jayson methods.
- *3.6.4*
  - Websocket client and server support
- *3.6.1*
  - JSON-RPC 2.0 notifications no longer have id property unless overridden
- *3.3.3*
  - Promise support for browser client
  - TypeScript declaration for promise browser client
  - TypeScript declaration for browser client
- *3.3.0*
  - Remove URL parsing when passing a string option to the TLS and TCP client, string options are instead treated as an IPC path
- *3.0.0*
  - Can pass a [context object](#server-context) to handlers
  - _Breaking_: `collect` option removed from `jayson.Server/Method`. JSON-RPC params to handlers are now **always** in the first argument.
- *2.1.0*
  - Experimental typescript support
- *2.0.6*
  - Clarified how to use [in the browser](#clientbrowser)
- *2.0.0*
  - Added [support for promises](#promises)
  - _Breaking_: `collect: true` is now the default option for a new `jayson.Server` and `jayson.Method`
- *1.2.0*
  - Greatly improved [server method definition](#method-definition)
- *1.1.1*
  - More http server events
  - Remove fork server and client
  - Add server routing
- *1.0.11*
  Add support for a HTTPS client
- *1.0.9*
  Add support for TCP servers and clients

### CLI client

There is a basic CLI client in `bin/jayson.js` and it should be available as `jayson` in your shell if you installed the package globally. Run `jayson --help` to see how it works.

## Requirements

Jayson does not have any special dependencies that cannot be resolved with a simple `npm install` or `yarn install`.

## Class documentation

In addition to this document, a comprehensive class documentation made with [jsdoc][jsdoc-spec] is available at [jayson.tedeh.net](http://jayson.tedeh.net).

[jsdoc-spec]: http://usejsdoc.org/

## Running tests

- Change directory to the repository root
- Install the development packages by executing `npm install --dev`
- Run the tests with `npm run test`
- Run the typescript tests with `npm run test-tsc`
- Run the coverage tests with `npm run coverage`

## Typescript

Since `v2.1.0` there is typescript support available with jayson.

If you encounter any problems with the type definitions, see the [Contributing](#contributing) section.

## Usage

### Client

The client is available as the `Client` or `client` property of `require('jayson')`.

#### Client interface description

| Name               | Description         |
|--------------------|---------------------|
| `Client`           | Base class          |
| `Client.tcp`       | TCP sub-class       |
| `Client.tls`       | TLS sub-class       |
| `Client.http`      | HTTP sub-class      |
| `Client.https`     | HTTPS sub-class     |
| `Client.browser`   | Standalone class    |
| `Client.websocket` | Websocket sub-class |

Every client supports these options:

| Option               | Default                            | Type       | Description                                                                              |
|----------------------|------------------------------------|------------|------------------------------------------------------------------------------------------|
| `reviver`            | `undefined`                        | `Function` | `JSON.parse` reviver                                                                     |
| `replacer`           | `undefined`                        | `Function` | `JSON.stringify` replacer                                                                |
| `generator`          | [RFC4122][rfc_4122_spec] generator | `Function` | Generates a `String` for request ID.                                                     |
| `version`            | 2                                  | `Number`   | JSON-RPC version to support (1 or 2)                                                     |
| `notificationIdNull` | `false`                            | `Boolean`  | *Since 3.6.1*. When true "id" property of a request will be set to null when version 2.  |

[rfc_4122_spec]: http://www.ietf.org/rfc/rfc4122.txt

##### Client.http

Uses the same options as [http.request][nodejs_docs_http_request] in addition to these options:

| Option     	| Default 	  | Type     	| Description                    	        |
|------------	|------------ |----------	|---------------------------------------- |
| `encoding` 	| `utf8`  	  | `String` 	| Determines the encoding to use 	        |
| `headers` 	| `undefined` | `Object` 	| Extend the headers sent by the client 	|

###### Client.http Events

The HTTP client will emit the following events:

| Event           	| When                              	| Arguments                                                                 	| Notes                                     	|
|-----------------	|-----------------------------------	|---------------------------------------------------------------------------	|-------------------------------------------	|
| `http request`  	| Created an HTTP request           	| 1. Instance of `http.ClientRequest`                                       	|                                           	|
| `http response` 	| Received an HTTP response         	| 1. Instance of `http.IncomingMessage` 2. Instance of `http.ClientRequest` 	|                                           	|
| `http error`    	| Underlying stream emits `error`   	| 1. Error                                                                  	|                                           	|
| `http timeout`  	| Underlying stream emits `timeout` 	|                                                                           	| Automatically causes the request to abort 	|

It is possible to pass a string URL as the first argument. The URL will be run through [url.parse][nodejs_docs_url_parse]. Example:

```javascript
const jayson = require('jayson');
const client = jayson.Client.http('http://localhost:3000');
// client.options is now the result of url.parse
```

[nodejs_docs_http_request]: http://nodejs.org/docs/latest/api/http.html#http_http_request_options_callback
[nodejs_docs_url_parse]: http://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost

##### Client.https

Uses the same options as [https.request][nodejs_docs_https_request] in addition _to the same options as `Client.http`_. This means it is also possible
to pass a string URL as the first argument and have it interpreted by [url.parse][nodejs_docs_url_parse].

Will emit the [same custom events](#clienthttp-events) as `Client.http`.

[nodejs_docs_https_request]: http://nodejs.org/api/all.html#all_https_request_options_callback

##### Client.tcp

Uses the same options as [net.connect][nodejs_docs_net_connect].

###### Client.tcp Events

*Since version 3.5.1*

The TCP client will emit the following events:

| Event      | When                   | Arguments                     | Notes                         |
|------------|------------------------|-------------------------------|-------------------------------|
| tcp socket | TCP socket is opened   | 1. `net.Socket`               | Can be used to setup timeouts |
| tcp error  | TCP socket emits error | 1. Error emit by `net.Socket` |                               |

[nodejs_docs_net_connect]: https://nodejs.org/api/net.html#net_net_connect

##### Client.tls

Uses the same options as [tls.connect][nodejs_docs_tls_connect].

###### Client.tls Events

*Since version 3.5.1*

The TLS client will emit the following events:

| Event      | When                   | Arguments                     | Notes                         |
|------------|------------------------|-------------------------------|-------------------------------|
| tcp socket | TCP socket is opened   | 1. `net.Socket`               | Can be used to setup timeouts |
| tcp error  | TCP socket emits error | 1. Error emit by `net.Socket` |                               |

[nodejs_docs_tls_connect]: https://nodejs.org/api/tls.html#tls_tls_connect_options_callback

##### Client.browser

The browser client is a simplified version of the regular client for use browser-side. It does not have any dependencies on node.js core libraries, but does depend on the `uuid` package for generating request ids. It also does not know how to "send" a request to a server like the other clients.

Because it does not depend on any core libraries, the browser client is **not** an instance of `JaysonClient` or `EventEmitter` and therefore does **not** emit any of the normal request events that the other clients do.

To use the browser client, `require('jayson/lib/client/browser')` and pass a calling/transport function as the first argument. The transport function receives a JSON-RPC string request and is expected to callback with a string response received from the server (not JSON) or an error (not a JSON-RPC error).

The reason for dealing with strings is to support the `reviver` and `replacer` options like the other clients.

This client example in [examples/browser_client/client.js](examples/browser_client/client.js) below uses [node-fetch](https://github.com/bitinn/node-fetch) in the transport function, but a dropin replacement for use in an *actual* browser could instead use [whatwg-fetch](https://github.com/github/fetch/issues/184).

The browser client has a separate TypeScript type declaration available in `jayson/lib/client/browser/index.d.ts` which depends on the main Jayson type declaration.

```javascript
'use strict';

const jaysonBrowserClient = require('jayson/lib/client/browser');
const fetch = require('node-fetch');

const callServer = function(request, callback) {
  const options = {
    method: 'POST',
    body: request,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  fetch('http://localhost:3000', options)
    .then(function(res) { return res.text(); })
    .then(function(text) { callback(null, text); })
    .catch(function(err) { callback(err); });
};

const client = new jaysonBrowserClient(callServer, {
  // other options go here
});

client.request('multiply', [5, 5], function(err, error, result) {
  if(err) throw err;
  console.log(result); // 25
});
```

##### Client.websocket

*Since v3.6.4*

Experimental websocket client that wraps around an `isomorphic-ws` instance. Will listen to every received (JSON) message and see if it matches any of the currently outstanding requests made, in which case the callback of that outstanding request will fire. If you do not provide the `timeout` option it will wait forever. Has a promise-based equivalent receiving the same options, and a [companion jayson server](#serverwebsocket) where you can find an example.

Has the following options:

| Option    | Default     | Type                                | Description                                                          |
|-----------|-------------|-------------------------------------|----------------------------------------------------------------------|
| `url`     | `undefined` | `String`                            | First argument to `require('isomorphic-ws')` if `options.ws` not set |
| `ws`      | `undefined` | `require('isomorphic-ws')` instance | WebSocket instance                                                   |
| `timeout` | `undefined` | `Number`                            | Timeout in ms before callbacking with an error                       |

If you want to "unwrap" the `isomorphic-ws` instance you can use the `Client.websocket.prototype.unlisten` which stops listening for messages on the `isomorphic-ws` instance.

- [isomorphic-ws docs](https://github.com/heineiuo/isomorphic-ws)

#### Notifications

Notification requests are for cases where the reply from the server is not important and should be ignored. This is accomplished by setting the `id` property of a request object to `null`.

Client example in [examples/notifications/client.js](examples/notifications/client.js) doing a notification request:

```javascript
const jayson = require('jayson');

const client = jayson.Client.http({
  port: 3000
});

// the third parameter is set to "null" to indicate a notification
client.request('ping', [], null, function(err) {
  if(err) throw err;
  console.log('ok'); // request was received successfully
});
```

Server example in [examples/notifications/server.js](examples/notifications/server.js):

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  ping: function(args, callback) {
    // do something, do nothing
    callback();
  }
});

server.http().listen(3000);
```

##### Notes

* Any value that the server returns will be discarded when doing a notification request.
* Omitting the third argument `null` to `Client.prototype.request` does not generate a notification request. This argument has to be set explicitly to `null` for this to happen.
* Network errors and the like will still reach the callback. When the callback is invoked (with or without error) one can be certain that the server has received the request.
* See the [Official JSON-RPC 2.0 Specification][jsonrpc-spec] for additional information on how Jayson handles notifications that are erroneous.
* *Since 3.6.1* When making a JSON-RPC 2.0 notification request the "id" property will be omitted in the request object. In previous versions it was set to `null` against the recommendation of the official specification. This behaviour can be overridden with the `notificationIdNull` option.


#### Batches

A batch request is an array of individual requests that are sent to the server as one. Doing a batch request is very simple in Jayson and consists of constructing an array of individual requests (created by not passing a callback to `Client.prototype.request`) that is then itself passed to `Client.prototype.request`. 

Combined server/client example in [examples/batch_request/index.js](examples/batch_request/index.js):

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  add: function(args, callback) {
    callback(null, args[0] + args[1]);
  }
});

const client = new jayson.Client(server);

const batch = [
  client.request('does_not_exist', [10, 5]),
  client.request('add', [1, 1]),
  client.request('add', [0, 0], null) // a notification
];

client.request(batch, function(err, errors, successes) {
  if(err) throw err;
  console.log('errors', errors); // array of requests that errored
  console.log('successes', successes); // array of requests that succeeded
});

client.request(batch, function(err, responses) {
  if(err) throw err;
  console.log('responses', responses); // all responses together
});
```

##### Notes

* See the [Official JSON-RPC 2.0 Specification][jsonrpc-spec] for additional information on how Jayson handles different types of batches, mainly with regards to notifications, request errors and so forth.
* There is no guarantee that the results will be in the same order as request Array `request`. To find the right result, compare the ID from the request with the ID in the result yourself.

#### Client callback syntactic sugar

When the length (number of arguments) of a client callback function is either 2 or 3 it receives slightly different values when invoked.

* 2 arguments: first argument is an error or `null`, second argument is the response object as returned (containing _either_ a `result` or a `error` property) or `null` for notifications.
* 3 arguments: first argument is an error or null, second argument is a JSON-RPC `error` property or `null` (if success), third argument is a JSON-RPC `result` property or `null` (if error).

When doing a batch request with a 3-length callback, the second argument will be an array of requests with a `error` property and the third argument will be an array of requests with a `result` property.

#### Client events

A client will emit the following events (in addition to any special ones emitted by a specific interface):

| Event      	| When                        	| Arguments                                     	| Notes 	|
|------------	|-----------------------------	|-----------------------------------------------	|-------	|
| `request`  	| About to dispatch a request 	| 1: Request object                             	|       	|
| `response` 	| Received a response         	| 1: Request object 2: Response object received 	|       	|

### Server

The server classes are available as the `Server` or `server` property of `require('jayson')`.

The server also sports several interfaces that can be accessed as properties of an instance of `Server`.

#### Server interface description

| Name                	| Description                                                                                	|
|---------------------	|--------------------------------------------------------------------------------------------	|
| `Server`            	| Base interface for a server that supports receiving JSON-RPC requests                      	|
| `Server.tcp`        	| TCP server that inherits from [net.Server][nodejs_doc_net_server]                          	|
| `Server.tls`        	| TLS server that inherits from [tls.Server][nodejs_doc_tls_server]                          	|
| `Server.http`       	| HTTP server that inherits from [http.Server][nodejs_doc_http_server]                       	|
| `Server.https`      	| HTTPS server that inherits from [https.Server][nodejs_doc_https_server]                    	|
| `Server.websocket`   	| Websocket server that uses [isomorphic-ws Server][isomorphic-ws-docs]                     	|
| `Server.middleware` 	| Method that returns a [Connect][connect]/[Express][express] compatible middleware function 	|

[isomorphic-ws-docs]: https://github.com/heineiuo/isomorphic-ws
[nodejs_doc_net_server]: http://nodejs.org/docs/latest/api/net.html#net_class_net_server
[nodejs_doc_http_server]: http://nodejs.org/docs/latest/api/http.html#http_class_http_server
[nodejs_doc_https_server]: http://nodejs.org/docs/latest/api/https.html#https_class_https_server
[nodejs_doc_tls_server]: https://nodejs.org/api/tls.html#tls_class_tls_server
[connect]: http://www.senchalabs.org/connect/
[express]: http://expressjs.com/

Servers supports these options:

| Option              	| Default         	| Type                	| Description                                               	|
|---------------------	|-----------------	|---------------------	|-----------------------------------------------------------	|
| `reviver`           	| `null`          	| `Function`          	| `JSON.parse` reviver                                      	|
| `replacer`          	| `null `         	| `Function`          	| `JSON.stringify` replacer                                 	|
| `router`            	| `null `         	| `Function`          	| Return the function for [method routing](#method-routing) 	|
| `useContext`         	| `false`          	| `Boolean`           	| Passed to `methodConstructor` options                     	|
| `params`            	| `undefined`     	| `Array/Object/null` 	| Passed to `methodConstructor` options                     	|
| `methodConstructor` 	| `jayson.Method` 	| `Function`          	| Server functions are made an instance of this class       	|
| `version`           	| 2               	| `Number`            	| JSON-RPC version to support (1 or 2)                      	|
| `maxBatchLength`     	| Infinity         	| `Number`            	| Maximum batch requests allowed                                |

##### Server.tcp

Uses the same options as the base class. Inherits from [net.Server][nodejs_doc_net_server].

##### Server.tls

Uses the same options as the base class. Inherits from [tls.Server][nodejs_doc_tls_server].

##### Server.http

Uses the same options as the base class. Inherits from [http.Server][nodejs_doc_http_server].

###### Server.http Events

| Event           	| When                          	| Arguments                                                                    	| Notes 	|
|-----------------	|-------------------------------	|------------------------------------------------------------------------------	|-------	|
| `http request`  	| Incoming HTTP request         	| 1. Instance of `http.IncomingMessage`                                        	|       	|
| `http response` 	| About to send a HTTP response 	| 1. Instance of `http.ServerResponse` 2. Instance of `http. IncomingMessage ` 	|       	|

##### Server.https

Uses the same options as the base class. Inherits from [https.Server][nodejs_doc_https_server] and `jayson.Server.http`. For information on how to configure certificates, [see the documentation on https.Server][nodejs_doc_https_server].

Will emit the [same custom events](#serverhttp-events) as `Server.http`.

##### Server.middleware

Uses the same options as the base class. Returns a function that is compatible with [Connect][connect] or [Express][express]. Will expect the request to be `req.body`, meaning that the request body must be parsed (typically using `connect.bodyParser`) before the middleware is invoked.

The middleware supports the following options:

| Option 	| Default 	| Type      	| Description                                                                               	|
|--------	|---------	|-----------	|-------------------------------------------------------------------------------------------	|
| `end`  	| `true`  	| `Boolean` 	| If set to `false` causes the middleware to `next()` instead of `res.end()` when finished. 	|

Middleware example in [examples/middleware/server.js](examples/middleware/server.js):

```javascript
const jayson = require('jayson');
const jsonParser = require('body-parser').json;
const connect = require('connect');
const app = connect();

const server = new jayson.Server({
  add: function(args, callback) {
    callback(null, args[0] + args[1]);
  }
});

// parse request body before the jayson middleware
app.use(jsonParser());
app.use(server.middleware());

app.listen(3000);
```

##### Server.websocket

Websocket server that either wraps around a provided `require('isomorphic-ws').Server` instance or creates one from scratch. Expects **every** incoming message on every connection to be a valid JSON-RPC call.

The websocket server supports the following options in addition to the base class:

| Option | Default     | Type                              | Description                     |
|--------|-------------|-----------------------------------|---------------------------------|
| `wss`  | `undefined` | `require('isomorphic-ws').Server` | If not provided will be created |


Websocket server example in [examples/websocket/server.js](examples/websocket/server.js):

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  add: function (args, done) {
    const sum = args.reduce((sum, val) => sum + val, 0);
    done(null, sum);
  },
});

const wss = server.websocket({
  port: 12345,
});
```

Websocket client example in [examples/websocket/client.js](examples/websocket/client.js):

```javascript
const jayson = require('jayson');

const client = jayson.Client.websocket({
  url: 'ws://localhost:12345',
});

client.ws.on('open', function () {
  client.request('add', [1,2,3,4], function (err, result) {
    console.log(err, result);
    client.ws.close();
  });
});
```

#### Many interfaces at the same time

A Jayson server can use many interfaces at the same time.

Server example in [examples/many_interfaces/server.js](examples/many_interfaces/server.js) that listens to both `http` and a `https` requests:

```javascript
const jayson = require('jayson');

const server = new jayson.Server();

// "http" will be an instance of require('http').Server
const http = server.http();

// "https" will be an instance of require('https').Server
const https = server.https({
  //cert: require('fs').readFileSync('cert.pem'),
  //key require('fs').readFileSync('key.pem')
});

http.listen(80, function() {
  console.log('Listening on *:80');
});

https.listen(443, function() {
  console.log('Listening on *:443');
});
```

#### Using the server as a relay

Passing an instance of a client as a method to the server makes the server relay incoming requests to wherever the client is pointing to. This might be used to delegate computationally expensive functions into a separate server or to abstract a cluster of servers behind a common interface.

Frontend server example in [examples/relay/server_public.js](examples/relay/server_public.js) listening on `*:3000`:

```javascript
const jayson = require('jayson');

// create a server where "add" will relay a localhost-only server
const server = new jayson.Server({
  add: jayson.Client.http({
    port: 3001
  })
});

// let the frontend server listen to *:3000
server.http().listen(3000);
```

Backend server example in [examples/relay/server_private.js](examples/relay/server_private.js) listening on `*:3001`:

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  add: function(args, callback) {
    callback(null, args[0] + args[1]);
  }
});

// let the backend listen to *:3001
server.http().listen(3001);
```

Every request to `add` on the public server will now relay the request to the private server. See the client example in [examples/relay/client.js](examples/relay/client.js).

#### Method routing

Passing a property named `router` in the server options will enable you to write your own logic for routing requests to specific functions. 

Server example with custom routing logic in [examples/method_routing/server.js](examples/method_routing/server.js):

**Note:** You are strongly recommended to check method names using `Object.prototype.hasOwnProperty` to prevent a denial-of-service attack against your Jayson server when names such as `__defineGetter__` are used in JSON-RPC calls.

```javascript
const jayson = require('jayson');

const methods = {
  add: function(args, callback) {
    callback(null, args[0] + args[1]);
  }
};

const server = new jayson.Server(methods, {
  router: function(method, params) {
    // regular by-name routing first
    const fn = Object.prototype.hasOwnProperty.call(this._methods, method) ? this._methods[method] : null;
    if(typeof fn === 'function') {
      return fn;
    }
    if(method === 'add_2') {
      const fn = server.getMethod('add').getHandler();
      return new jayson.Method(function(args, done) {
        args.unshift(2);
        fn(args, done);
      });
    }
  }
});

server.http().listen(3000);
```

Client example in [examples/method_routing/client.js](examples/method_routing/client.js) invoking `add_2` on the above server:

```javascript
const jayson = require('jayson');

// create a client
const client = jayson.Client.http({
  port: 3000
});

// invoke "add_2"
client.request('add_2', [3], function(err, response) {
  if(err) throw err;
  console.log(response.result); // 5!
});
```

Server example of nested routes where each property is separated by a dot (you do not need to use the router option for this):

```javascript
const jayson = require('jayson');

const methods = {
  foo: {
    bar: function(callback) {
      callback(null, 'ping pong');
    }
  },
  math: {
    add: function(args, callback) {
      callback(null, args[0] + args[1]);
    }
  }
};

// this reduction produces an object like this: {'foo.bar': [Function], 'math.add': [Function]}
const map = Object.keys(methods).reduce(collapse('', '.', methods), {});
const server = new jayson.Server(map);

function collapse(stem, sep, obj) {
  return function(map, key) {
    const prop = stem ? stem + sep + key : key;
    const value = obj[key];
    if(typeof value === 'function') map[prop] = value;
    else if(typeof value === 'object' && value !== null) map = Object.keys(value).reduce(collapse(prop, sep, value), map);
    return map;
  }
}
```

##### Notes

* If `router` does not return anything, the server will respond with a `Method Not Found` error.
* The `Server.prototype` methods `method`, `methods`, `removeMethod` and `hasMethod` will not use the `router` method, but will operate on the internal `Server.prototype._methods` map.
* The `router` method is expected to return instances of `jayson.Method` (>=1.2.0)

#### Method definition

You can also define server methods inside a wrapping object named `jayson.Method`. This allows additional options about the method to be specified. Using this wrapper - explicitly or implicitly (via server options) - makes it trivial to have your method accept a variable amount of arguments.

The method class is available as the `Method` or `method` property of  `require('jayson')`. It supports these options:

| Option    	| Default                        	| Type                	| Description                                                            	|
|-----------	|--------------------------------	|---------------------	|------------------------------------------------------------------------	|
| `handler` 	|                                	| `Function`          	| The actual function that will handle a JSON-RPC request to this method 	|
| `useContext` 	| false 	| `Boolean`           	| When true, the handler will receive a context object as the second argument
| `params`  	| null                           	| `Array\|Object\|null` 	| Force JSON-RPC parameters to be of a certain type                      	|

Server example showcasing most features and options in [examples/method_definitions/server.js](examples/method_definitions/server.js):

```javascript
const jayson = require('jayson');

const methods = {

  // this function will be wrapped in jayson.Method with options given to the server
  sum: function(args, done) {
    done(null, sum(args));
  },

  // this function always receives a context object as second arg
  // it can be overriden on the server level
  context: jayson.Method(function(args, context, done) {
    done(null, context);
  }, {useContext: true}),

  // specifies some default values (alternate definition too)
  sumDefault: jayson.Method(function(args, done) {
    const total = sum(args);
    done(null, total);
  }, {
    params: {a: 2, b: 5} // map of defaults
  }),

  // this method returns true when it gets an array (which it always does)
  isArray: new jayson.Method({
    handler: function(args, done) {
      const result = Array.isArray(args);
      done(null, result);
    },
    params: Array // could also be "Object"
  })

};

const server = new jayson.Server(methods, {
  // these options are given as options to jayson.Method when adding the method "sum".
  // this is because it is not wrapped in jayson.Method like the others.
  useContext: false,
  params: Array
});

server.http().listen(3000);

// sums all numbers in an array or object
function sum(list) {
  return Object.keys(list).reduce(function(sum, key) { return sum + list[key]; }, 0);
}
```

Client example in [examples/method_definitions/client.js](examples/method_definitions/client.js):

```javascript
const jayson = require('jayson');

const client = jayson.Client.http({
  port: 3000
});

// invoke "sum" with array
client.request('sum', [3, 5, 9, 11], function(err, response) {
  if(err) throw err;
  console.log(response.result); // 28
});

// invoke "sum" with an object
client.request('sum', {a: 2, b: 3, c: 4}, function(err, response) {
  if(err) throw err;
  console.log(response.result); // 9
});

// invoke "sumDefault" with object missing some defined members
client.request('sumDefault', {b: 10}, function(err, response) {
  if(err) throw err;
  console.log(response.result); // 12
});

// invoke "isArray" with an Object
client.request('isArray', {a: 5, b: 2, c: 9}, function(err, response) {
  if(err) throw err;
  console.log(response.result); // true
});

// invoke "context"
client.request('context', {hello: 'world'}, function(err, response) {
  if(err) throw err;
  console.log(response.result); // {} - just an empty object
});
```

#### Server events

In addition to events that are specific to certain interfaces, all servers will emit the following events:

| Event      	| When                                     	| Arguments                            	| Notes                          	|
|------------	|------------------------------------------	|--------------------------------------	|--------------------------------	|
| `request`  	| Interpretable non-batch request received 	| 1: Request object                    	|                                	|
| `response` 	| Returning a response                     	| 1: Request object 2: Response object 	|                                	|
| `batch`    	| Interpretable batch request received     	| 1. Array of requests                 	| Emits `request` for every part 	|

#### Server Errors

If you should like to return an error from an method request to indicate a failure, remember that the [JSON-RPC 2.0][jsonrpc-spec] specification requires the error to be an `Object` with a `code (Integer/Number)` to be regarded as valid. You can also provide a `message (String)` and a `data (Object)` with additional information. Example: 

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  i_cant_find_anything: function(args, callback) {
    const error = {code: 404, message: 'Cannot find ' + args.id};
    callback(error); // will return the error object as given
  },
  i_cant_return_a_valid_error: function(callback) {
    callback({message: 'I forgot to enter a code'}); // will return a pre-defined "Internal Error"
  }
});
```

##### Predefined Errors

It is also possible to cause a method to return one of the predefined [JSON-RPC 2.0 error codes][jsonrpc-spec#error_object] using the server helper function `Server.prototype.error` inside of a server method. Example:

[jsonrpc-spec#error_object]: http://jsonrpc.org/spec.html#error_object

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  invalid_params: function(args, callback) {
    const error = this.error(-32602); // returns an error with the default properties set
    callback(error);
  }
});
```

You can even override the default messages:

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  error_giver_of_doom: function(callback) {
    callback(true) // invalid error format, which causes an Internal Error to be returned instead
  }
});

// Override the default message
server.errorMessages[Server.errors.INTERNAL_ERROR] = 'I has a sad. I cant do anything right';
```

#### Server CORS

Jayson does not include functionality for supporting CORS requests natively but it is easy to use a CORS-enabling middleware
like [cors](https://github.com/expressjs/cors). An example of this can be found in [examples/cors/server.js](examples/cors/server.js):

```javascript
const jayson = require('jayson');
const cors = require('cors');
const connect = require('connect');
const jsonParser = require('body-parser').json;
const app = connect();

const server = new jayson.Server({
  myNameIs: function(args, callback) {
    callback(null, 'Your name is: ' + args.name);
  }
});

app.use(cors({methods: ['POST']}));
app.use(jsonParser());
app.use(server.middleware());

app.listen(3000);
```

#### Server Context

*Since version 3.0.0*

You can provide an optional context object to JSON-RPC method handlers. This can be used to give extra data to a handler  such as request headers, authentication tokens, and so on.

This feature is unlocked by having `jayson.Method` accepts a boolean option called `useContext`. It always defaults to `false` for backwards compatibility. When it is set to `true` the method handler that `jayson.Method` wraps will **always** receive a context object as the second argument. The object can be given as the third argument to `jayson.Server.prototype.call`.

Server example in [examples/context/server.js](examples/context/server.js):

```javascript
const jayson = require('jayson');
const jsonParser = require('body-parser').json;
const express = require('express');
const app = express();

const server = new jayson.Server({

  getHeaders: function(args, context, callback) {
    callback(null, context.headers);
  },

  // old method not receiving a context object (here for reference)
  oldMethod: new jayson.Method(function(args, callback) {
    callback(null, {});
  }, {
    // this setting overrides the server option set below for this particular method only
    useContext: false
  })

}, {
  // all methods will receive a context object as the second arg
  useContext: true
});

app.use(jsonParser());
app.use(function(req, res, next) {
  // prepare a context object passed into the JSON-RPC method
  const context = {headers: req.headers};
  server.call(req.body, context, function(err, result) {
    if(err) return next(err);
    res.send(result || {});
  });
});

app.listen(3001);
```

Client example in [examples/context/client.js](examples/context/client.js):

```javascript
const jayson = require('jayson');

// create a client
const client = jayson.Client.http({
  port: 3001
});

// invoke "getHeaders"
client.request('getHeaders', {}, function(err, response) {
  if(err) throw err;
  console.log(response.result);
});
```

##### Notes

- `jayson.Server` also accepts `useContext` as an option, and passes the value on to the `jayson.Method` constructor. This option can be overriden on a per-method basis as shown above.
- Individual requests in a JSON-RPC batch will all receive the exact same context object in their handler - take care not to mutate it
- If a falsy context value is given to `jayson.Server.prototype.call`, an empty object will be created
- None of the current jayson server transports (http, https, tls, tcp, middleware) can make use of the context object. You will need to rig your own transport implementation, like the one above based on an `express` http server. See the [FAQ](#faq) for more info about this.

### Revivers and Replacers

JSON lacks support for representing types other than the simple ones defined in the [JSON specification][jsonrpc-spec]. Fortunately the JSON methods in JavaScript (`JSON.parse` and `JSON.stringify`) provide options for custom serialization/deserialization routines. Jayson allows you to pass your own routines as options to both clients and servers.

Simple example transferring the state of an object between a client and a server:

Shared code between the server and the client in [examples/reviving_and_replacing/shared.js](examples/reviving_and_replacing/shared.js):

```javascript
'use strict';

const Counter = exports.Counter = function(value) {
  this.count = value || 0;
};

Counter.prototype.increment = function() {
  this.count += 1;
};

exports.replacer = function(key, value) {
  if(value instanceof Counter) {
    return {$class: 'counter', $props: {count: value.count}};
  }
  return value;
};

exports.reviver = function(key, value) {
  if(value && value.$class === 'counter') {
    const obj = new Counter();
    for(const prop in value.$props) obj[prop] = value.$props[prop];
    return obj;
  }
  return value;
};
```

Server example in [examples/reviving_and_replacing/server.js](examples/reviving_and_replacing/server.js):

```javascript
const jayson = require('jayson');
const shared = require('./shared');

// Set the reviver/replacer options
const options = {
  reviver: shared.reviver,
  replacer: shared.replacer
};

// create a server
const server = new jayson.Server({
  increment: function(args, callback) {
    args.counter.increment();
    callback(null, args.counter);
  }
}, options);

server.http().listen(3000);
```

A client example in [examples/reviving_and_replacing/client.js](examples/reviving_and_replacing/client.js) invoking "increment" on the server:

```javascript
const jayson = require('jayson');
const shared = require('./shared');

const client = jayson.Client.http({
  port: 3000,
  reviver: shared.reviver,
  replacer: shared.replacer
});

// create the object
const params = {
  counter: new shared.Counter(2)
};

// invoke "increment"
client.request('increment', params, function(err, response) {
  if(err) throw err;
  const result = response.result;
  console.log(
    result instanceof shared.Counter, // true
    result.count, // 3
    params.counter === result // false - result is a new object
  );
});
```

#### Notes

* Instead of using a replacer, it is possible to define a `toJSON` method for any JavaScript object. Unfortunately there is no corresponding method for reviving objects (that would not work, obviously), so the _reviver_ always has to be set up manually.

### Named parameters

It is possible to specify named parameters when doing a client request by passing an Object instead of an Array.

Client example in [examples/named_parameters/client.js](examples/named_parameters/client.js):

```javascript
const jayson = require('jayson');

const client = jayson.Client.http({
  port: 3000
});

client.request('add', {b: 1, a: 2}, function(err, response) {
  if(err) throw err;
  console.log(response.result); // 3!
});
```

Server example in [examples/named_parameters/server.js](examples/named_parameters/server.js):

```javascript
const jayson = require('jayson');

const server = new jayson.Server({
  add: function(params, callback) {
    callback(null, params.a + params.b);
  }
});

server.http().listen(3000);
```

#### Notes

* If requesting methods on a Jayson server, arguments left out will be `undefined`
* Too many arguments or arguments with invalid names will be ignored
* It is assumed that the last argument to a server method is the callback and it will not be filled with something else
* Parsing a function signature and filling in arguments is generally *not recommended* and should be avoided

## Promises

[es6-promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

*Since version 2.0.0*

A separate tree that does limited usage of the [ES6 Promise][es6-promise] object is available. The internal API remains callback based, with the addition that promises may be used for two things:

* Returning a Promise when requesting a JSON-RPC method using a Client
* Returning a Promise inside of a Server method

To use the separate tree, do a `require('jayson/promise')` instead of `require('jayson')`.

Server example in [examples/promise/server.js](examples/promise/server.js) showing how to return a `Promise` in a server method:

```javascript
const jayson = require('jayson/promise');

const server = new jayson.Server({

  add: async function(args) {
    const sum = Object.keys(args).reduce(function(sum, key) { return sum + args[key]; }, 0);
    return sum;
  },

  // example on how to reject
  rejection: async function(args) {
    // server.error just returns {code: 501, message: 'not implemented'}
    throw server.error(501, 'not implemented');
  }

});

server.http().listen(3000);
```

Client example in [examples/promise/client.js](examples/promise/client.js) showing how to do a request:

```javascript
const jayson = require('jayson/promise');

const client = jayson.Client.http({
  port: 3000
});

const reqs = [
  client.request('add', [1, 2, 3, 4, 5]),
  client.request('rejection', [])
];

Promise.all(reqs).then(function(responses) {
  console.log(responses[0].result);
  console.log(responses[1].error);
});
```

#### Notes

* JSON-RPC errors will not result in rejection of the Promise. It is however possible that a future version will include a client setting to have JSON-RPC errors result in rejection. Please note that network errors and the like will result in rejection.
* A `Promise` is considered to have been returned from a server method if the returned object has a property `then` that is a function.

#### Promise Batches

*Since version 2.0.5*

Sometimes you may want to return raw requests from a promise client. This needs to be handled differently, because `PromiseClient.prototype.request` would normally always be expected to *return a Promise* which we in this case don't want.

To solve this, we need to set the fourth parameter to `PromiseClient.prototype.request` explicitly to `false` in order to *not* return a Promise.

Client example in [examples/promise_batches/client.js](examples/promise_batches/client.js) showing how to properly execute a batch request:

```javascript
const jayson = require('jayson/promise');

const client = jayson.Client.http({
  port: 3000
});

const batch = [
  client.request('add', [1, 2, 3, 4, 5], undefined, false),
  client.request('add', [5, 6, 7, 8, 9], undefined, false),
];

client.request(batch).then(function(responses) {
  console.log(responses[0].result); // 15
  console.log(responses[1].result); // 35
});
```

##### Notes

* The third parameter to `PromiseClient.prototype.request` above is explicitly set to `undefined` - this parameter would normally represent the desired ID of the call. Remember that `null` would mean a notification (which does not return a response) and other falsy values may actually be used as ids. Setting `undefined` ensures that the id is generated automatically.

#### Promise Browser Client

A browser client that has no dependencies on node.js core libraries is available too. It works similar to how the regular callback-style [Browser Client](#clientbrowser) works. Here is an example:

```javascript
'use strict';

const jaysonPromiseBrowserClient = require('jayson/promise/lib/client/browser');
const fetch = require('node-fetch');

const callServer = function(request) {
  const options = {
    method: 'POST',
    body: request,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  return fetch('http://localhost:3000', options).then(res => res.text());
};

const client = new jaysonPromiseBrowserClient(callServer, {
  // other options go here
});

client.request('multiply', [5, 5]).then(function(result) {
  console.log(result);
}, function(err) {
  console.error(err);
});
```

Please refer to the [regular browser client](#clientbrowser) section of the README for more information.

## FAQ

### How can I pass HTTP headers/session/etc into my JSON-RPC request handler?

*Support for method context added in version 3.0.0*

See [Server context](#server-context) section.

### What is the recommended way to use jayson?

Using the provided clients and servers for http, https, tls, tcp and the express middleware is fine and works well for most use cases. However, sometimes issues like these crop up (quotes below are not directly from issue posters):

- "The (non-jayson) HTTP/TCP server I'm interacting with expects every call to terminate with `\r\n` but the jayson client does not"
- ["How can my jayson TLS server support requests encoded such and such?"](https://github.com/tedeh/jayson/issues/86)
- ["How can I make the jayson HTTP middleware accept GET requests?"](https://github.com/tedeh/jayson/issues/70)
- ["My jayson client interacting with a (non-jayson) TLS server closes the connection after every sent request. I think this is wasteful!"](https://github.com/tedeh/jayson/issues/92)

These are not issues with jayson, but stem from the fact that [JSON-RPC 2.0 specification][jsonrpc-spec] is **transport agnostic** and these kind of behaviours are **not defined** by that specification. The clients provided by jayson for http, https, tls, tcp are made to work and tested with their corresponding jayson server implementation. Any other compatibility with any other server or client is *accidental* when it comes to **details of the transport layer**. With that said, jayson is made to be 100 % compatible with the [JSON-RPC 2.0 specification][jsonrpc-spec] and compatibility with other non-jayson servers or clients when it comes to the *application layer* is pretty much guaranteed.

The library author [tedeh](https://github.com/tedeh) therefore recommends that if you have particular needs when it comes to the transport layer you create an implementation satisfying these details yourself. **Doing this is actually quite simple.**

Example of a http server built with express in [examples/faq_recommended_http_server/server.js](examples/faq_recommended_http_server/server.js):

```javascript
const jayson = require('jayson');
const jsonParser = require('body-parser').json;
const express = require('express');
const app = express();

// create a plain jayson server
const server = new jayson.Server({
  add: function(numbers, callback) {
    const sum = Object.keys(numbers).reduce(function(sum, key) { return sum + numbers[key]; }, 0);
    callback(null, sum);
  }
});

app.use(jsonParser()); // <- here we can deal with maximum body sizes, etc
app.use(function(req, res, next) {
  const request = req.body;
  // <- here we can check headers, modify the request, do logging, etc
  server.call(request, function(err, response) {
    if(err) {
      // if err is an Error, err is NOT a json-rpc error
      if(err instanceof Error) return next(err);
      // <- deal with json-rpc errors here, typically caused by the user
      res.status(400);
      res.send(err);
      return;
    }
    // <- here we can mutate the response, set response headers, etc
    if(response) {
      res.send(response);
    } else {
      // empty response (could be a notification)
      res.status(204);
      res.send('');
    }
  });
});

app.listen(3001);
```

Using some of the utilities provided and exported by jayson, creating a client offering the same kind of flexibility is also simple. Example of a compatible http client built with superagent in [examples/faq_recommended_http_server/client.js](examples/faq_recommended_http_server/client.js):

```javascript
const jayson = require('jayson');
const request = require('superagent');

// generate a json-rpc version 2 compatible request (non-notification)
const requestBody = jayson.Utils.request('add', [1,2,3,4], undefined, {
  version: 2, // generate a version 2 request
});

request.post('http://localhost:3001')
  // <- here we can setup timeouts, set headers, cookies, etc
  .timeout({response: 5000, deadline: 60000})
  .send(requestBody)
  .end(function(err, response) {
    if(err) {
      // superagent considers 300-499 status codes to be errors
      // @see http://visionmedia.github.io/superagent/#error-handling
      if(!err.status) throw err;
      const body = err.response.body;
      // body may be a JSON-RPC error, or something completely different
      // it can be handled here
      if(body && body.error && jayson.Utils.Response.isValidError(body.error, 2)) {
        // the error body was a valid JSON-RPC version 2
        // we may wish to deal with it differently
        console.err(body.error);
        return;
      }
      throw err; // error was something completely different
    }

    const body = response.body;

    // check if we got a valid JSON-RPC 2.0 response
    if(!jayson.Utils.Response.isValidResponse(body, 2)) {
      console.err(body);
    }

    if(body.error) {
      // we have a json-rpc error...
      console.err(body.error); // 10!
    } else {
      // do something useful with the result
      console.log(body.result); // 10!
    }
  });
```

## Contributing

Highlighting [issues](https://github.com/tedeh/jayson/issues) or submitting pull
requests on [Github](https://github.com/tedeh/jayson) is most welcome.

Please make sure to follow the style of the project, and lint your code with `npm run lint` before submitting a patch.

### Submitting issues or pull requests with the Typescript type definitions

You are required to provide an easily reproducible code sample of any errors with the Typescript type definitions so that they can be added to the typescript test file in [typescript/test.ts](typescript/test.ts). Better yet, issue a pull request adding a test there yourself that shows up when running the `package.json` script `test-tsc`.
