module.exports = function eachRecursive(obj, fn, path) {
	path = path ? path + '.' : '';
	for (var name in obj) {
		if (typeof obj === "object" && obj !== null) {
			eachRecursive(obj[name], fn, path + name);
		}
		fn(obj[name], path + name);
	}
};