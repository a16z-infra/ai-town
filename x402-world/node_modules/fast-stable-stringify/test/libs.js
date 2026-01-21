var assert = require("assert");
var indexStringify = require('../index');
var jsonStableStringify = require('json-stable-stringify');
var fasterStableStringify = require('faster-stable-stringify');

var validateLibOutput = require('./validate');

var data = require("../fixtures/index").input;
var dataLength = JSON.stringify(data).length;

suite("libs", function() {

	var minSamples = 120;

	// This needs to be true before anything else
	console.log('Checking index validity...');
	validateLibOutput(indexStringify);
	console.log('Checking index validity success');

	benchmark('native', function () {
		var result = JSON.stringify(data);
		assert.equal(result.length, dataLength);
	}, {
		minSamples: minSamples
	});

	benchmark('index', function () {
		var result = indexStringify(data);
		assert.equal(result.length, dataLength);
	}, {
		minSamples: minSamples
	});

	benchmark('json-stable-stringify', function () {
		var result = jsonStableStringify(data);
		assert.equal(result.length, dataLength);
	}, {
		minSamples: minSamples
	});

	benchmark('faster-stable-stringify', function () {
		var result = fasterStableStringify(data);
		assert.equal(result.length, dataLength);
	}, {
		minSamples: minSamples
	});
}, {
	onComplete: function() {
		var namesFastest = this
			.filter(function(bench) {
				return bench.name !== 'native';
			})
			.filter('fastest')
			.map('name');
		assert.notEqual(namesFastest.indexOf('index'), -1, "index should be among the fastest");
	}
});
