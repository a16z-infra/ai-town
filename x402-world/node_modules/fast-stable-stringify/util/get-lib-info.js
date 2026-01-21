var getGitHashSync = require('./get-git-hash-sync');
var path = require('path');

module.exports = function(libName) {
	var pkg;
	var version;
	if (libName == 'index') {
		pkg = require('../package.json');
		version = getGitHashSync(require.resolve('../index'));
	} else if (libName == 'native') {
		pkg = { name: 'JSON.stringify', url: 'n/a' };
		version = 'native';
	} else {
		pkg = require(libName + '/package.json');
		version = pkg.version;
	}
	return {
		name: pkg.name,
		url: pkg.url,
		version: version
	}
};
