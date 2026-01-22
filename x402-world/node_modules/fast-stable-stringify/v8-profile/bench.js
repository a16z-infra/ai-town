var myStringify = require('../index');
var data = require("../fixtures/index").input;
var result = 0;

for (var i = 0; i < 1000; i++) {
     result += myStringify(data).length;
}
console.log('Finished running (cumulative string length: ' + result + ")");
