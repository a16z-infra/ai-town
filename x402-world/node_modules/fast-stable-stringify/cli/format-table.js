var table = require('markdown-table');

// Crude, but should be enough internally
function toFixedWidth(value, maxChars) {
	var result = value.toFixed(2).substr(0, maxChars);
	if (result[result.length - 1] == '.') {
		result = result.substr(0, result.length - 2) + ' ';
	}
	return result;
}

/**
 *
 * @param {DataSetComparisonResult[]} results
 * @param {Object} [options]
 */
function createTable(results, options) {
	options || (options = {});
	var columnAlign = ['l', 'l'];
	var header = ['Suite', 'Browser'];
	var libNames = [];
	var rows = [];
	var errorCell = 'X';
	var emptyCell = '?';
	var hideColumns = options.hideColumns || [];
	var compareTo = options.compareTo;
	results.forEach(function(comparisonResult) {
		var resultMap = comparisonResult.resultMap;
		var libName;
		var libResults;
		var result;
		var compareRHZ = resultMap[compareTo] && resultMap[compareTo].rhz || 1;
		for (libName in resultMap) {
			// dictates order
			if (libNames.indexOf(libName) === -1 && hideColumns.indexOf(libName) === -1) {
				libNames.push(libName);
				columnAlign.push('r');
				rows.forEach(function(row) {
					// new column added, push empty element
					row.push(emptyCell);
				})
			}
		}
		libResults = libNames.map(function(libName) {
			result = resultMap[libName];
			if (result) {
				if (result.success) {
					return (result.fastest ? '*' : '')
						+ (100 * result.rhz / compareRHZ).toFixed(2) + '% '
						+ '(\xb1' + toFixedWidth(100 * (result.rhz  / compareRHZ) * result.rme, 4) + '%)';
				} else {
					return errorCell;
				}
			} else {
				return emptyCell;
			}
		});

		rows.push([comparisonResult.suite, comparisonResult.browser].concat(libResults));
	});

	// slap header before it
	rows.unshift(header.concat(libNames));

	return table(rows, { align: columnAlign });
}

module.exports = function(data, options) {
	return createTable(data, options);
};
