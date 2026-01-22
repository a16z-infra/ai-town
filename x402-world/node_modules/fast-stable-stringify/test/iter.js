var assert = require('assert');
var stringify = require('json-stable-stringify');

var objectTest = {};
for (var i = 35; i < 91; i++) {
	objectTest[String.fromCharCode(i)] = i;
}
var objectExpected = stringify(objectTest);

var names = [];
var values = [];

var objKeys = Object.keys || function(obj) {
		var keys = [];
		for (var name in obj) {
			if (obj[name] !== undefined) {
				keys.push(name);
			}
		}
		return keys;
	};

suite('iter', function() {

	var minSamples = 120;

	benchmark('keys-while', function() {
		// only object is left
		var val = objectTest;
		var key;
		var keys = objKeys(val).sort();
		var max = keys.length;
		var str = "";
		var i = 0;
		while (i < max) {
			key = keys[i++];
			if (val[key] !== undefined) {
				if (str) {
					str += ',';
				}
				str += '"' + key + '":' + val[key];
			}
		}
		assert.equal('{' + str + '}', objectExpected);
	}, { minSamples: minSamples });

	benchmark('keys-for', function() {
		// only object is left
		var val = objectTest;
		var key;
		var keys = objKeys(val).sort();
		var max = keys.length;
		var str = "";
		var i = 0;
		for (; i < max; i++) {
			key = keys[i];
			if (val[key] !== undefined) {
				if (str) {
					str += ',';
				}
				str += '"' + key + '":' + val[key];
			}
		}
		assert.equal('{' + str + '}', objectExpected);
	}, { minSamples: minSamples });

	benchmark('incr-for', function() {
		names.length = 0;
		values.length = 0;
		var val = objectTest;
		var name;
		var i;
		var max = -1;
		for (name in val) {
			i = max;
			while (names[i] > name) i--;
			names.splice(i + 1, 0, name);
			values.splice(i + 1, 0, '"' + name + '":' + JSON.stringify(val[name]));
			max++;
		}
		assert.equal('{' + values.join(',') + '}', objectExpected);
	}, { minSamples: minSamples });

});