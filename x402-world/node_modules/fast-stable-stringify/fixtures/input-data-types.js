function ImplementingToJSON() {}
ImplementingToJSON.prototype.toJSON = function() {
	return 'dummy!';
};

function NotImplementingToJSON() {}

module.exports = {
	"objects": {
		"string": {
			"VALUES_WITH_SPACES": "a b c",
			"LOWERCASE": "abc",
			"UPPERCASE": "ABC",
			"NUMBER_ONLY": "123",
			"EMPTY_STRING": "",
			"ESCAPE_RANGE": "\u0000\u001F",
			"NON_ESCAPE_RANGE": "\u0020\uFFFF",
			"UTF16": "☃",
			"QUOTATION_MARK": "\"",
			"REVERSE_SOLIDUS": "\\",
			"SOLIDUS": "\/",
			"FORM_FEED": "\f",
			"LINE_FEED": "\n",
			"CARRIAGE_RETURN": "\r",
			"TAB": "\t",
			"BACKSPACE": "\b",
			"MIXED": "Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b"
		},
		"key": {
			"a b c": "VALUES_WITH_SPACES",
			"abc": "LOWERCASE",
			"ABC": "UPPERCASE",
			"NUMBER_ONLY": "123",
			"": "EMPTY_STRING",
			"\u0000\u001F": "ESCAPE_RANGE",
			"\u0020\uFFFF": "NON_ESCAPE_RANGE",
			"☃": "UTF16",
			"\"": "QUOTATION_MARK",
			"\\": "REVERSE_SOLIDUS",
			"\/": "SOLIDUS",
			"\f": "FORM_FEED",
			"\n": "LINE_FEED",
			"\r": "CARRIAGE_RETURN",
			"\t": "TAB",
			"\b": "BACKSPACE",
			"Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b": "MIXED"
		},
		"number": {
			"MAX_SAFE_INTEGER": 9007199254740991,
			"MIN_SAFE_INTEGER": -9007199254740991,
			"FALSY": 0,
			"NEGATIVE": -1,
			"FLOAT": 0.1234567,
			"NEGATIVE_FLOAT": -0.9876543,
			"MAX_VALUE": 1.7976931348623157e+308,
			"MIN_VALUE": 5e-324,
			"NEGATIVE_MAX_VALUE": -1.7976931348623157e+308,
			"NEGATIVE_MIN_VALUE": -5e-324,
            "INFINITY": Infinity,
            "NEG_INFINITY": -Infinity,
            "NAN": NaN
		},
		"boolean": {
			"TRUE": true,
			"FALSE": false
		},
		"null": {
			"NULL": null
		},
		"undefined": undefined,
		"undefineds": {
			"ONE": undefined,
			"TWO": undefined,
			"THREE": undefined
		},
		"date": new Date('2017'),
		"function": function() {},
		"instances": {
			'implementingToJSON': new ImplementingToJSON(),
			'notImplementingToJSON': new NotImplementingToJSON()
		},
		"mixed": {
			"Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b": "MIXED",
			"MIXED": "Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b",
			"MAX_VALUE": 1.7976931348623157e+308,
			"MIN_VALUE": 5e-324,
			"NEGATIVE_MAX_VALUE": -1.7976931348623157e+308,
			"NEGATIVE_MIN_VALUE": -5e-324,
			"TRUE": true,
			"FALSE": false,
			"NULL": null,
			"UNDEFINED": undefined,
			"zzz": "ending"
		}
	},
	"arrays": {
		"number": [
			9007199254740991,
			-9007199254740991,
			0,
			-1,
			0.1234567,
			-0.9876543,
			1.7976931348623157e+308,
			5e-324,
			-1.7976931348623157e+308,
			-5e-324,
            Infinity,
            -Infinity,
            NaN
		],
		"string": [
			"a b c",
			"abc",
			"ABC",
			"NUMBER_ONLY",
			"",
			"\u0000\u001F",
			"\u0020\uFFFF",
			"☃",
			"\"",
			"\\",
			"\/",
			"\f",
			"\n",
			"\r",
			"\t",
			"\b",
			"Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b"
		],
		"boolean": [
			true,
			false
		],
		"null": [
			null
		],
		"undefined": [
			undefined
		],
		"date": [
			new Date('2017')
		],
		"instances": [
			new ImplementingToJSON(),
			new NotImplementingToJSON()
		],
		"function": [
			function(){}
		],
		"mixed": [
			-1.7976931348623157e+308,
			-5e-324,
			"Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b",
			true,
			false,
			null,
			undefined
		]
	},
	"mixed": [
		{
			"Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b": "MIXED",
			"MIXED": "Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b",
			"MAX_VALUE": 1.7976931348623157e+308,
			"MIN_VALUE": 5e-324,
			"NEGATIVE_MAX_VALUE": -1.7976931348623157e+308,
			"NEGATIVE_MIN_VALUE": -5e-324,
			"TRUE": true,
			"FALSE": false,
			"NULL": null,
			"UNDEFINED": undefined,
			"DATE": new Date('2017'),
			"IMPLEMENTING_TO_JSON": new ImplementingToJSON(),
			"NOT_IMPLEMENTING_TO_JSON": new NotImplementingToJSON(),
			"FUNCTION": function(){},
			"zzz": "ending"
		},
		-1.7976931348623157e+308,
		-5e-324,
		"Aa1 Bb2 Cc3 \u0000\u001F\u0020\uFFFF☃\"\\\/\f\n\r\t\b",
		true,
		false,
		null,
		undefined,
		new Date('2017'),
		function(){},
		new ImplementingToJSON(),
		new NotImplementingToJSON()
	]
};
