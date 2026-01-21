/**
 * Returns the element within root under the path given by pathSegments.
 * @param {Object} root
 * @param {string[]} pathSegments
 * @param {boolean} [appendIfMissing=false] - all objects are created if they do not exist
 * @returns {Object} - the object under the path. If appendIsMissing is false and the path does not exist, returns null
 */
module.exports.getObject = function getObject(root, pathSegments, appendIfMissing) {
	var target = root;
	var pathSeg;
	var i;
	for (i = 0; i < pathSegments.length; i++) {
		pathSeg = pathSegments[i];
		if (!target.hasOwnProperty(pathSeg)) {
			if (appendIfMissing) {
				target[pathSeg] = {};
			} else {
				return null;
			}
		}
		target = target[pathSeg];
	}
	return target;
};

/**
 * Writes the object to the path in root. Overwrites if an object exists.
 * Note: root is edited in place!
 * @param {Object} root
 * @param {string[]} pathSegments
 * @param {Object} obj
 */
module.exports.setObject = function setObject(root, pathSegments, obj) {
	var target = root;
	var pathSeg;
	var i;
	var max = pathSegments.length;
	for (i = 0; i < max; i++) {
		pathSeg = pathSegments[i];
		if (i === max - 1) {
			target[pathSeg] = obj;
		} else if (!target.hasOwnProperty(pathSeg)) {
			target[pathSeg] = {};
		}
		target = target[pathSeg];
	}
};