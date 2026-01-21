'use strict';

const Jayson = require('../..');

/**
 * Namespace available as require('jayson/promise')
 * @namespace JaysonPromise
 */
const JaysonPromise = module.exports;

/**
 * @static
 * @type PromiseClient
 */
JaysonPromise.Client = JaysonPromise.client = require('./client');

/**
 * @static
 * @type Server
 */
JaysonPromise.Server = JaysonPromise.server = require('./server');

/**
 * @static
 * @type Utils
 */
JaysonPromise.Utils = JaysonPromise.utils = Jayson.utils;

/**
 * @static
 * @type PromiseMethod
 */
JaysonPromise.Method = JaysonPromise.method = require('./method');
