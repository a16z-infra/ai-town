// Karma configuration
// Generated on Sun Sep 03 2017 04:55:32 GMT+0200 (CEST)

module.exports = function(config) {

  // in seconds
  var TIMEOUT = 360;

  var customLaunchers = {
		// desktop evergreen
		sl_chrome: {	base: 'SauceLabs',	browserName: 'chrome',	version: '60',	idleTimeout: TIMEOUT },
		sl_firefox: {	base: 'SauceLabs',	browserName: 'firefox',	version: '54',	idleTimeout: TIMEOUT },
		sl_safari: {	base: "SauceLabs",	browserName: "safari",	version: '10',	platform: 'macOS 10.12', idleTimeout: TIMEOUT	},
		sl_edge: {		base: "SauceLabs", 	browserName: "microsoftedge", version: '14', platform: 'Windows 10',	idleTimeout: TIMEOUT },
		//sl_opera: {		base: "SauceLabs", 	browsername: "opera", version: '12',	platform: 'Windows 7', idleTimeout: TIMEOUT },

		// desktop legacy
		sl_ie_9: {		base: 'SauceLabs',	browserName: 'internet explorer',	version: '9',	idleTimeout: TIMEOUT	},
		sl_ie_10: {		base: 'SauceLabs',	browserName: 'internet explorer',	version: '10',	idleTimeout: TIMEOUT	},
		sl_ie_11: {		base: 'SauceLabs',	browserName: 'internet explorer',	version: '11',	idleTimeout: TIMEOUT	},

		// mobile
		sl_iphone: {	base: 'SauceLabs',	browserName: 'iphone',	version: '10.3', idleTimeout: TIMEOUT	},
		sl_android: {	base: 'SauceLabs',	browserName: 'android',	version: '6.0',	idleTimeout: TIMEOUT	},
  };

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['benchmark'],


    // list of files / patterns to load in the browser
    files: [
			'test/index.js'
    ],


    // list of files to exclude
    exclude: [
    ],

		client: {
			captureConsole: true,
			logLevel: config.LOG_LOG,
			mocha: {
				ui: 'tdd'
			}
		},

		browserConsoleLogOptions: {
			level: 'log',
			format: '%b %T: %m',
			terminal: true
		},


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/index.js': ['webpack']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['benchmark'],
    
    benchmarkReporter: {
			destDir: 'results',
			exclude: ['native', 'faster-stable-stringify', 'fast-stable-stringify'],
			resolveName: function(benchName, suiteName) {
                if (suiteName == 'libs') {
                    var libInfo = require('./util/get-lib-info')(benchName);
                    return libInfo.name + '@' + libInfo.version;
                } else {
                    return benchName;
                }
			},
			logStyle: 'benchmark'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    //browsers: ['Chrome', 'Firefox'],

    browserNoActivityTimeout: TIMEOUT * 1000,
    
    captureTimeout: TIMEOUT * 1000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 5
  })
};
