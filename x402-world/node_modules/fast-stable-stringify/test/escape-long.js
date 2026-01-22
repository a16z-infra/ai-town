var assert = require('assert');
var stringTest = "Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b. Quisque id mi. Fusce egestas elit eget lorem. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Vivamus euismod mauris. Nam eget dui.";
var stringResult = JSON.stringify(stringTest);

var strReg = /[\u0000-\u001f"\\]/g;

function strReplace(str) {
	var code = str.charCodeAt(0);
	switch (code) {
		case 34: return '\\"';
		case 92: return '\\\\';
		case 12: return "\\f";
		case 10: return "\\n";
		case 13: return "\\r";
		case 9: return "\\t";
		case 8: return "\\b";
		default:
			if (code > 15) {
				return "\\u00" + code.toString(16);
			} else {
				return "\\u000" + code.toString(16);
			}
	}
}

function strEscapeIf(str){
	var length = str.length;
	var buffer = '';
	var code = 0;
	var i = 0;

	for (; i < length; i++) {
		code = str.charCodeAt(i);

		if (code === 34) buffer += '\\"';
		else if (code === 92) buffer += '\\\\';
		else if (code > 31) buffer += str[i];
		else if (code > 15) buffer += "\\u00" + code.toString(16);
		else if (code === 12) buffer += "\\f";
		else if (code === 10) buffer += "\\n";
		else if (code === 13) buffer += "\\r";
		else if (code === 9) buffer += "\\t";
		else if (code === 8) buffer += "\\b";
		else buffer += "\\u000" + code.toString(16);
	}

	return buffer;
}

function strEscapeIfReverse(str){
	var buffer = '';
	var code = 0;
	var i = str.length - 1;

	for (; i >= 0; i--) {
		code = str.charCodeAt(i);

		if (code === 34) buffer = '\\"' + buffer;
		else if (code === 92) buffer = '\\\\' + buffer;
		else if (code > 31) buffer = str[i] + buffer;
		else if (code > 15) buffer = "\\u00" + code.toString(16) + buffer;
		else if (code === 12) buffer = "\\f" + buffer;
		else if (code === 10) buffer = "\\n" + buffer;
		else if (code === 13) buffer = "\\r" + buffer;
		else if (code === 9) buffer = "\\t" + buffer;
		else if (code === 8) buffer = "\\b" + buffer;
		else buffer = "\\u000" + code.toString(16) + buffer;
	}

	return buffer;
}

var escape31 = {
	'31': "\\u001f",
	'30': "\\u001e",
	'29': "\\u001d",
	'28': "\\u001c",
	'27': "\\u001b",
	'26': "\\u001a",
	'25': "\\u0019",
	'24': "\\u0018",
	'23': "\\u0017",
	'22': "\\u0016",
	'21': "\\u0015",
	'20': "\\u0014",
	'19': "\\u0013",
	'18': "\\u0012",
	'17': "\\u0011",
	'16': "\\u0010",
	'15': "\\u000f",
	'14': "\\u000e",
	'13': "\\r",
	'12': "\\f",
	'11': "\\u000b",
	'10': "\\n",
	'9': "\\t",
	'8': "\\b",
	'7': "\\u0007",
	'6': "\\u0006",
	'5': "\\u0005",
	'4': "\\u0004",
	'3': "\\u0003",
	'2': "\\u0002",
	'1': "\\u0001",
	'0': "\\u0000"
};

function stringEscapeObj(str) {
	var i = 0;
	var max = str.length;
	var buffer = '';
	var code = 0;
	for (; i < max; i++) {
		code = str.charCodeAt(i);

		if (code <= 31) buffer += escape31[code];
		else if (code === 34) buffer += '\\"';
		else if (code === 92) buffer += '\\\\';
		else buffer += str[i];
	}
	return buffer;
}

suite("escape-long", function() {

	var minSamples = 120;

	benchmark("reg", function() {
		assert.equal('"'+stringTest.replace(strReg, strReplace)+'"', stringResult);
	}, { minSamples: minSamples });

	benchmark("fn if", function() {
		assert.equal('"'+strEscapeIf(stringTest)+'"', stringResult);
	}, { minSamples: minSamples });

	benchmark("fn if reverse", function() {
		assert.equal('"'+strEscapeIfReverse(stringTest)+'"', stringResult);
	}, { minSamples: minSamples });

	benchmark("escape31", function() {
		assert.equal('"'+stringEscapeObj(stringTest)+'"', stringResult);
	}, { minSamples: minSamples });

	benchmark("native", function() {
		assert.equal(JSON.stringify(stringTest), stringResult);
	}, { minSamples: minSamples })
});