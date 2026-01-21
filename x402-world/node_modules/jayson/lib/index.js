'use strict';

/**
 * Namespace available as require('jayson')
 * @namespace Jayson
 */
const Jayson = module.exports;

/**
 * @static
 * @type Client
 */
Jayson.Client = Jayson.client = require('./client');

/**
 * @static
 * @type Server
 */
Jayson.Server = Jayson.server = require('./server');

/**
 * @static
 * @type Utils
 */
Jayson.Utils = Jayson.utils = require('./utils');

/**
 * @static
 * @type Method
 */
Jayson.Method = Jayson.method = require('./method');
