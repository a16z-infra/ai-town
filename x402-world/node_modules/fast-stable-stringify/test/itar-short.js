var assert = require('assert');
var arrTest = [];
var arrExpected;

for (var i = 0; i < 10; i++) { arrTest[i] = i; }
arrExpected = JSON.stringify(arrTest);

var arrReuse = [];

suite('itar-short', function() {

	var minSamples = 160;

	benchmark("for + if", function() {
		var val = arrTest.slice();
		var str = '[';
		var max = val.length - 1;
		var i;
		for (i = 0; i < max; i++) {
			str += JSON.stringify(val[i]) + ',';
		}
		if (max > -1) {
			str += JSON.stringify(val[i]);
		}
		assert.equal(str + ']', arrExpected);
	}, { minSamples: minSamples });

	benchmark("while + if", function() {
		var val = arrTest.slice();
		var str = '[';
		var max = val.length - 1;
		var i = 0;
		while (i < max) {
			str += JSON.stringify(val[i++]) + ',';
		}
		if (max > -1) {
			str += JSON.stringify(val[i]);
		}
		assert.equal(str + ']', arrExpected);
	}, { minSamples: minSamples });

	benchmark("array join", function() {
		arrReuse.length = 0;
		var val = arrTest.slice();
		var max = val.length;
		var i;
		for (i = 0; i < max; i++) {
			arrReuse[i] = JSON.stringify(val[i]);
		}
		assert.equal('[' + arrReuse.join(',') + ']', arrExpected);
	}, { minSamples: minSamples });
});