var argv = require('minimist')(process.argv.slice(2));
var formatTable = require('./format-table');
var glob = require('glob');
var filesToComparisonResults = require('./files-to-comparison-results');

var pattern = argv._.length > 1 ? '{' + argv._.slice(0).join(',') + '}' : argv._[0];
var fileList = glob.sync(pattern, { nodir: true });

//console.log(fileList);
filesToComparisonResults(fileList)
	.then(function(comparisonResult) {
		return formatTable(comparisonResult, { hideColumns: [], compareTo: 'json-stable-stringify@1.0.1' })
	})
	.then(function(str) {
		console.log(str);
	})
	.catch(function(err) {
		console.error(err);
	});
