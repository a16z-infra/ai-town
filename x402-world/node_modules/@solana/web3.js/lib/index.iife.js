var solanaWeb3 = (function (exports) {
	'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getAugmentedNamespace(n) {
	  if (n.__esModule) return n;
	  var f = n.default;
		if (typeof f == "function") {
			var a = function a () {
				if (this instanceof a) {
	        return Reflect.construct(f, arguments, this.constructor);
				}
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var buffer = {};

	var base64Js = {};

	var hasRequiredBase64Js;

	function requireBase64Js () {
		if (hasRequiredBase64Js) return base64Js;
		hasRequiredBase64Js = 1;

		base64Js.byteLength = byteLength;
		base64Js.toByteArray = toByteArray;
		base64Js.fromByteArray = fromByteArray;

		var lookup = [];
		var revLookup = [];
		var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

		var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
		for (var i = 0, len = code.length; i < len; ++i) {
		  lookup[i] = code[i];
		  revLookup[code.charCodeAt(i)] = i;
		}

		// Support decoding URL-safe base64 strings, as Node.js does.
		// See: https://en.wikipedia.org/wiki/Base64#URL_applications
		revLookup['-'.charCodeAt(0)] = 62;
		revLookup['_'.charCodeAt(0)] = 63;

		function getLens (b64) {
		  var len = b64.length;

		  if (len % 4 > 0) {
		    throw new Error('Invalid string. Length must be a multiple of 4')
		  }

		  // Trim off extra bytes after placeholder bytes are found
		  // See: https://github.com/beatgammit/base64-js/issues/42
		  var validLen = b64.indexOf('=');
		  if (validLen === -1) validLen = len;

		  var placeHoldersLen = validLen === len
		    ? 0
		    : 4 - (validLen % 4);

		  return [validLen, placeHoldersLen]
		}

		// base64 is 4/3 + up to two characters of the original data
		function byteLength (b64) {
		  var lens = getLens(b64);
		  var validLen = lens[0];
		  var placeHoldersLen = lens[1];
		  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
		}

		function _byteLength (b64, validLen, placeHoldersLen) {
		  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
		}

		function toByteArray (b64) {
		  var tmp;
		  var lens = getLens(b64);
		  var validLen = lens[0];
		  var placeHoldersLen = lens[1];

		  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

		  var curByte = 0;

		  // if there are placeholders, only get up to the last complete 4 chars
		  var len = placeHoldersLen > 0
		    ? validLen - 4
		    : validLen;

		  var i;
		  for (i = 0; i < len; i += 4) {
		    tmp =
		      (revLookup[b64.charCodeAt(i)] << 18) |
		      (revLookup[b64.charCodeAt(i + 1)] << 12) |
		      (revLookup[b64.charCodeAt(i + 2)] << 6) |
		      revLookup[b64.charCodeAt(i + 3)];
		    arr[curByte++] = (tmp >> 16) & 0xFF;
		    arr[curByte++] = (tmp >> 8) & 0xFF;
		    arr[curByte++] = tmp & 0xFF;
		  }

		  if (placeHoldersLen === 2) {
		    tmp =
		      (revLookup[b64.charCodeAt(i)] << 2) |
		      (revLookup[b64.charCodeAt(i + 1)] >> 4);
		    arr[curByte++] = tmp & 0xFF;
		  }

		  if (placeHoldersLen === 1) {
		    tmp =
		      (revLookup[b64.charCodeAt(i)] << 10) |
		      (revLookup[b64.charCodeAt(i + 1)] << 4) |
		      (revLookup[b64.charCodeAt(i + 2)] >> 2);
		    arr[curByte++] = (tmp >> 8) & 0xFF;
		    arr[curByte++] = tmp & 0xFF;
		  }

		  return arr
		}

		function tripletToBase64 (num) {
		  return lookup[num >> 18 & 0x3F] +
		    lookup[num >> 12 & 0x3F] +
		    lookup[num >> 6 & 0x3F] +
		    lookup[num & 0x3F]
		}

		function encodeChunk (uint8, start, end) {
		  var tmp;
		  var output = [];
		  for (var i = start; i < end; i += 3) {
		    tmp =
		      ((uint8[i] << 16) & 0xFF0000) +
		      ((uint8[i + 1] << 8) & 0xFF00) +
		      (uint8[i + 2] & 0xFF);
		    output.push(tripletToBase64(tmp));
		  }
		  return output.join('')
		}

		function fromByteArray (uint8) {
		  var tmp;
		  var len = uint8.length;
		  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
		  var parts = [];
		  var maxChunkLength = 16383; // must be multiple of 3

		  // go through the array every three bytes, we'll deal with trailing stuff later
		  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
		    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
		  }

		  // pad the end with zeros, but make sure to not forget the extra bytes
		  if (extraBytes === 1) {
		    tmp = uint8[len - 1];
		    parts.push(
		      lookup[tmp >> 2] +
		      lookup[(tmp << 4) & 0x3F] +
		      '=='
		    );
		  } else if (extraBytes === 2) {
		    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
		    parts.push(
		      lookup[tmp >> 10] +
		      lookup[(tmp >> 4) & 0x3F] +
		      lookup[(tmp << 2) & 0x3F] +
		      '='
		    );
		  }

		  return parts.join('')
		}
		return base64Js;
	}

	var ieee754 = {};

	/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */

	var hasRequiredIeee754;

	function requireIeee754 () {
		if (hasRequiredIeee754) return ieee754;
		hasRequiredIeee754 = 1;
		ieee754.read = function (buffer, offset, isLE, mLen, nBytes) {
		  var e, m;
		  var eLen = (nBytes * 8) - mLen - 1;
		  var eMax = (1 << eLen) - 1;
		  var eBias = eMax >> 1;
		  var nBits = -7;
		  var i = isLE ? (nBytes - 1) : 0;
		  var d = isLE ? -1 : 1;
		  var s = buffer[offset + i];

		  i += d;

		  e = s & ((1 << (-nBits)) - 1);
		  s >>= (-nBits);
		  nBits += eLen;
		  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

		  m = e & ((1 << (-nBits)) - 1);
		  e >>= (-nBits);
		  nBits += mLen;
		  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

		  if (e === 0) {
		    e = 1 - eBias;
		  } else if (e === eMax) {
		    return m ? NaN : ((s ? -1 : 1) * Infinity)
		  } else {
		    m = m + Math.pow(2, mLen);
		    e = e - eBias;
		  }
		  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
		};

		ieee754.write = function (buffer, value, offset, isLE, mLen, nBytes) {
		  var e, m, c;
		  var eLen = (nBytes * 8) - mLen - 1;
		  var eMax = (1 << eLen) - 1;
		  var eBias = eMax >> 1;
		  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
		  var i = isLE ? 0 : (nBytes - 1);
		  var d = isLE ? 1 : -1;
		  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

		  value = Math.abs(value);

		  if (isNaN(value) || value === Infinity) {
		    m = isNaN(value) ? 1 : 0;
		    e = eMax;
		  } else {
		    e = Math.floor(Math.log(value) / Math.LN2);
		    if (value * (c = Math.pow(2, -e)) < 1) {
		      e--;
		      c *= 2;
		    }
		    if (e + eBias >= 1) {
		      value += rt / c;
		    } else {
		      value += rt * Math.pow(2, 1 - eBias);
		    }
		    if (value * c >= 2) {
		      e++;
		      c /= 2;
		    }

		    if (e + eBias >= eMax) {
		      m = 0;
		      e = eMax;
		    } else if (e + eBias >= 1) {
		      m = ((value * c) - 1) * Math.pow(2, mLen);
		      e = e + eBias;
		    } else {
		      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
		      e = 0;
		    }
		  }

		  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

		  e = (e << mLen) | m;
		  eLen += mLen;
		  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

		  buffer[offset + i - d] |= s * 128;
		};
		return ieee754;
	}

	/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */

	var hasRequiredBuffer;

	function requireBuffer () {
		if (hasRequiredBuffer) return buffer;
		hasRequiredBuffer = 1;
		(function (exports) {

			const base64 = /*@__PURE__*/ requireBase64Js();
			const ieee754 = /*@__PURE__*/ requireIeee754();
			const customInspectSymbol =
			  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
			    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
			    : null;

			exports.Buffer = Buffer;
			exports.SlowBuffer = SlowBuffer;
			exports.INSPECT_MAX_BYTES = 50;

			const K_MAX_LENGTH = 0x7fffffff;
			exports.kMaxLength = K_MAX_LENGTH;

			/**
			 * If `Buffer.TYPED_ARRAY_SUPPORT`:
			 *   === true    Use Uint8Array implementation (fastest)
			 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
			 *               implementation (most compatible, even IE6)
			 *
			 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
			 * Opera 11.6+, iOS 4.2+.
			 *
			 * We report that the browser does not support typed arrays if the are not subclassable
			 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
			 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
			 * for __proto__ and has a buggy typed array implementation.
			 */
			Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

			if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
			    typeof console.error === 'function') {
			  console.error(
			    'This browser lacks typed array (Uint8Array) support which is required by ' +
			    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
			  );
			}

			function typedArraySupport () {
			  // Can typed array instances can be augmented?
			  try {
			    const arr = new Uint8Array(1);
			    const proto = { foo: function () { return 42 } };
			    Object.setPrototypeOf(proto, Uint8Array.prototype);
			    Object.setPrototypeOf(arr, proto);
			    return arr.foo() === 42
			  } catch (e) {
			    return false
			  }
			}

			Object.defineProperty(Buffer.prototype, 'parent', {
			  enumerable: true,
			  get: function () {
			    if (!Buffer.isBuffer(this)) return undefined
			    return this.buffer
			  }
			});

			Object.defineProperty(Buffer.prototype, 'offset', {
			  enumerable: true,
			  get: function () {
			    if (!Buffer.isBuffer(this)) return undefined
			    return this.byteOffset
			  }
			});

			function createBuffer (length) {
			  if (length > K_MAX_LENGTH) {
			    throw new RangeError('The value "' + length + '" is invalid for option "size"')
			  }
			  // Return an augmented `Uint8Array` instance
			  const buf = new Uint8Array(length);
			  Object.setPrototypeOf(buf, Buffer.prototype);
			  return buf
			}

			/**
			 * The Buffer constructor returns instances of `Uint8Array` that have their
			 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
			 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
			 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
			 * returns a single octet.
			 *
			 * The `Uint8Array` prototype remains unmodified.
			 */

			function Buffer (arg, encodingOrOffset, length) {
			  // Common case.
			  if (typeof arg === 'number') {
			    if (typeof encodingOrOffset === 'string') {
			      throw new TypeError(
			        'The "string" argument must be of type string. Received type number'
			      )
			    }
			    return allocUnsafe(arg)
			  }
			  return from(arg, encodingOrOffset, length)
			}

			Buffer.poolSize = 8192; // not used by this implementation

			function from (value, encodingOrOffset, length) {
			  if (typeof value === 'string') {
			    return fromString(value, encodingOrOffset)
			  }

			  if (ArrayBuffer.isView(value)) {
			    return fromArrayView(value)
			  }

			  if (value == null) {
			    throw new TypeError(
			      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
			      'or Array-like Object. Received type ' + (typeof value)
			    )
			  }

			  if (isInstance(value, ArrayBuffer) ||
			      (value && isInstance(value.buffer, ArrayBuffer))) {
			    return fromArrayBuffer(value, encodingOrOffset, length)
			  }

			  if (typeof SharedArrayBuffer !== 'undefined' &&
			      (isInstance(value, SharedArrayBuffer) ||
			      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
			    return fromArrayBuffer(value, encodingOrOffset, length)
			  }

			  if (typeof value === 'number') {
			    throw new TypeError(
			      'The "value" argument must not be of type number. Received type number'
			    )
			  }

			  const valueOf = value.valueOf && value.valueOf();
			  if (valueOf != null && valueOf !== value) {
			    return Buffer.from(valueOf, encodingOrOffset, length)
			  }

			  const b = fromObject(value);
			  if (b) return b

			  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
			      typeof value[Symbol.toPrimitive] === 'function') {
			    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
			  }

			  throw new TypeError(
			    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
			    'or Array-like Object. Received type ' + (typeof value)
			  )
			}

			/**
			 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
			 * if value is a number.
			 * Buffer.from(str[, encoding])
			 * Buffer.from(array)
			 * Buffer.from(buffer)
			 * Buffer.from(arrayBuffer[, byteOffset[, length]])
			 **/
			Buffer.from = function (value, encodingOrOffset, length) {
			  return from(value, encodingOrOffset, length)
			};

			// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
			// https://github.com/feross/buffer/pull/148
			Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
			Object.setPrototypeOf(Buffer, Uint8Array);

			function assertSize (size) {
			  if (typeof size !== 'number') {
			    throw new TypeError('"size" argument must be of type number')
			  } else if (size < 0) {
			    throw new RangeError('The value "' + size + '" is invalid for option "size"')
			  }
			}

			function alloc (size, fill, encoding) {
			  assertSize(size);
			  if (size <= 0) {
			    return createBuffer(size)
			  }
			  if (fill !== undefined) {
			    // Only pay attention to encoding if it's a string. This
			    // prevents accidentally sending in a number that would
			    // be interpreted as a start offset.
			    return typeof encoding === 'string'
			      ? createBuffer(size).fill(fill, encoding)
			      : createBuffer(size).fill(fill)
			  }
			  return createBuffer(size)
			}

			/**
			 * Creates a new filled Buffer instance.
			 * alloc(size[, fill[, encoding]])
			 **/
			Buffer.alloc = function (size, fill, encoding) {
			  return alloc(size, fill, encoding)
			};

			function allocUnsafe (size) {
			  assertSize(size);
			  return createBuffer(size < 0 ? 0 : checked(size) | 0)
			}

			/**
			 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
			 * */
			Buffer.allocUnsafe = function (size) {
			  return allocUnsafe(size)
			};
			/**
			 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
			 */
			Buffer.allocUnsafeSlow = function (size) {
			  return allocUnsafe(size)
			};

			function fromString (string, encoding) {
			  if (typeof encoding !== 'string' || encoding === '') {
			    encoding = 'utf8';
			  }

			  if (!Buffer.isEncoding(encoding)) {
			    throw new TypeError('Unknown encoding: ' + encoding)
			  }

			  const length = byteLength(string, encoding) | 0;
			  let buf = createBuffer(length);

			  const actual = buf.write(string, encoding);

			  if (actual !== length) {
			    // Writing a hex string, for example, that contains invalid characters will
			    // cause everything after the first invalid character to be ignored. (e.g.
			    // 'abxxcd' will be treated as 'ab')
			    buf = buf.slice(0, actual);
			  }

			  return buf
			}

			function fromArrayLike (array) {
			  const length = array.length < 0 ? 0 : checked(array.length) | 0;
			  const buf = createBuffer(length);
			  for (let i = 0; i < length; i += 1) {
			    buf[i] = array[i] & 255;
			  }
			  return buf
			}

			function fromArrayView (arrayView) {
			  if (isInstance(arrayView, Uint8Array)) {
			    const copy = new Uint8Array(arrayView);
			    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
			  }
			  return fromArrayLike(arrayView)
			}

			function fromArrayBuffer (array, byteOffset, length) {
			  if (byteOffset < 0 || array.byteLength < byteOffset) {
			    throw new RangeError('"offset" is outside of buffer bounds')
			  }

			  if (array.byteLength < byteOffset + (length || 0)) {
			    throw new RangeError('"length" is outside of buffer bounds')
			  }

			  let buf;
			  if (byteOffset === undefined && length === undefined) {
			    buf = new Uint8Array(array);
			  } else if (length === undefined) {
			    buf = new Uint8Array(array, byteOffset);
			  } else {
			    buf = new Uint8Array(array, byteOffset, length);
			  }

			  // Return an augmented `Uint8Array` instance
			  Object.setPrototypeOf(buf, Buffer.prototype);

			  return buf
			}

			function fromObject (obj) {
			  if (Buffer.isBuffer(obj)) {
			    const len = checked(obj.length) | 0;
			    const buf = createBuffer(len);

			    if (buf.length === 0) {
			      return buf
			    }

			    obj.copy(buf, 0, 0, len);
			    return buf
			  }

			  if (obj.length !== undefined) {
			    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
			      return createBuffer(0)
			    }
			    return fromArrayLike(obj)
			  }

			  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
			    return fromArrayLike(obj.data)
			  }
			}

			function checked (length) {
			  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
			  // length is NaN (which is otherwise coerced to zero.)
			  if (length >= K_MAX_LENGTH) {
			    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
			                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
			  }
			  return length | 0
			}

			function SlowBuffer (length) {
			  if (+length != length) { // eslint-disable-line eqeqeq
			    length = 0;
			  }
			  return Buffer.alloc(+length)
			}

			Buffer.isBuffer = function isBuffer (b) {
			  return b != null && b._isBuffer === true &&
			    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
			};

			Buffer.compare = function compare (a, b) {
			  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
			  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
			  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
			    throw new TypeError(
			      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
			    )
			  }

			  if (a === b) return 0

			  let x = a.length;
			  let y = b.length;

			  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
			    if (a[i] !== b[i]) {
			      x = a[i];
			      y = b[i];
			      break
			    }
			  }

			  if (x < y) return -1
			  if (y < x) return 1
			  return 0
			};

			Buffer.isEncoding = function isEncoding (encoding) {
			  switch (String(encoding).toLowerCase()) {
			    case 'hex':
			    case 'utf8':
			    case 'utf-8':
			    case 'ascii':
			    case 'latin1':
			    case 'binary':
			    case 'base64':
			    case 'ucs2':
			    case 'ucs-2':
			    case 'utf16le':
			    case 'utf-16le':
			      return true
			    default:
			      return false
			  }
			};

			Buffer.concat = function concat (list, length) {
			  if (!Array.isArray(list)) {
			    throw new TypeError('"list" argument must be an Array of Buffers')
			  }

			  if (list.length === 0) {
			    return Buffer.alloc(0)
			  }

			  let i;
			  if (length === undefined) {
			    length = 0;
			    for (i = 0; i < list.length; ++i) {
			      length += list[i].length;
			    }
			  }

			  const buffer = Buffer.allocUnsafe(length);
			  let pos = 0;
			  for (i = 0; i < list.length; ++i) {
			    let buf = list[i];
			    if (isInstance(buf, Uint8Array)) {
			      if (pos + buf.length > buffer.length) {
			        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
			        buf.copy(buffer, pos);
			      } else {
			        Uint8Array.prototype.set.call(
			          buffer,
			          buf,
			          pos
			        );
			      }
			    } else if (!Buffer.isBuffer(buf)) {
			      throw new TypeError('"list" argument must be an Array of Buffers')
			    } else {
			      buf.copy(buffer, pos);
			    }
			    pos += buf.length;
			  }
			  return buffer
			};

			function byteLength (string, encoding) {
			  if (Buffer.isBuffer(string)) {
			    return string.length
			  }
			  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
			    return string.byteLength
			  }
			  if (typeof string !== 'string') {
			    throw new TypeError(
			      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
			      'Received type ' + typeof string
			    )
			  }

			  const len = string.length;
			  const mustMatch = (arguments.length > 2 && arguments[2] === true);
			  if (!mustMatch && len === 0) return 0

			  // Use a for loop to avoid recursion
			  let loweredCase = false;
			  for (;;) {
			    switch (encoding) {
			      case 'ascii':
			      case 'latin1':
			      case 'binary':
			        return len
			      case 'utf8':
			      case 'utf-8':
			        return utf8ToBytes(string).length
			      case 'ucs2':
			      case 'ucs-2':
			      case 'utf16le':
			      case 'utf-16le':
			        return len * 2
			      case 'hex':
			        return len >>> 1
			      case 'base64':
			        return base64ToBytes(string).length
			      default:
			        if (loweredCase) {
			          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
			        }
			        encoding = ('' + encoding).toLowerCase();
			        loweredCase = true;
			    }
			  }
			}
			Buffer.byteLength = byteLength;

			function slowToString (encoding, start, end) {
			  let loweredCase = false;

			  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
			  // property of a typed array.

			  // This behaves neither like String nor Uint8Array in that we set start/end
			  // to their upper/lower bounds if the value passed is out of range.
			  // undefined is handled specially as per ECMA-262 6th Edition,
			  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
			  if (start === undefined || start < 0) {
			    start = 0;
			  }
			  // Return early if start > this.length. Done here to prevent potential uint32
			  // coercion fail below.
			  if (start > this.length) {
			    return ''
			  }

			  if (end === undefined || end > this.length) {
			    end = this.length;
			  }

			  if (end <= 0) {
			    return ''
			  }

			  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
			  end >>>= 0;
			  start >>>= 0;

			  if (end <= start) {
			    return ''
			  }

			  if (!encoding) encoding = 'utf8';

			  while (true) {
			    switch (encoding) {
			      case 'hex':
			        return hexSlice(this, start, end)

			      case 'utf8':
			      case 'utf-8':
			        return utf8Slice(this, start, end)

			      case 'ascii':
			        return asciiSlice(this, start, end)

			      case 'latin1':
			      case 'binary':
			        return latin1Slice(this, start, end)

			      case 'base64':
			        return base64Slice(this, start, end)

			      case 'ucs2':
			      case 'ucs-2':
			      case 'utf16le':
			      case 'utf-16le':
			        return utf16leSlice(this, start, end)

			      default:
			        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
			        encoding = (encoding + '').toLowerCase();
			        loweredCase = true;
			    }
			  }
			}

			// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
			// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
			// reliably in a browserify context because there could be multiple different
			// copies of the 'buffer' package in use. This method works even for Buffer
			// instances that were created from another copy of the `buffer` package.
			// See: https://github.com/feross/buffer/issues/154
			Buffer.prototype._isBuffer = true;

			function swap (b, n, m) {
			  const i = b[n];
			  b[n] = b[m];
			  b[m] = i;
			}

			Buffer.prototype.swap16 = function swap16 () {
			  const len = this.length;
			  if (len % 2 !== 0) {
			    throw new RangeError('Buffer size must be a multiple of 16-bits')
			  }
			  for (let i = 0; i < len; i += 2) {
			    swap(this, i, i + 1);
			  }
			  return this
			};

			Buffer.prototype.swap32 = function swap32 () {
			  const len = this.length;
			  if (len % 4 !== 0) {
			    throw new RangeError('Buffer size must be a multiple of 32-bits')
			  }
			  for (let i = 0; i < len; i += 4) {
			    swap(this, i, i + 3);
			    swap(this, i + 1, i + 2);
			  }
			  return this
			};

			Buffer.prototype.swap64 = function swap64 () {
			  const len = this.length;
			  if (len % 8 !== 0) {
			    throw new RangeError('Buffer size must be a multiple of 64-bits')
			  }
			  for (let i = 0; i < len; i += 8) {
			    swap(this, i, i + 7);
			    swap(this, i + 1, i + 6);
			    swap(this, i + 2, i + 5);
			    swap(this, i + 3, i + 4);
			  }
			  return this
			};

			Buffer.prototype.toString = function toString () {
			  const length = this.length;
			  if (length === 0) return ''
			  if (arguments.length === 0) return utf8Slice(this, 0, length)
			  return slowToString.apply(this, arguments)
			};

			Buffer.prototype.toLocaleString = Buffer.prototype.toString;

			Buffer.prototype.equals = function equals (b) {
			  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
			  if (this === b) return true
			  return Buffer.compare(this, b) === 0
			};

			Buffer.prototype.inspect = function inspect () {
			  let str = '';
			  const max = exports.INSPECT_MAX_BYTES;
			  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
			  if (this.length > max) str += ' ... ';
			  return '<Buffer ' + str + '>'
			};
			if (customInspectSymbol) {
			  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
			}

			Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
			  if (isInstance(target, Uint8Array)) {
			    target = Buffer.from(target, target.offset, target.byteLength);
			  }
			  if (!Buffer.isBuffer(target)) {
			    throw new TypeError(
			      'The "target" argument must be one of type Buffer or Uint8Array. ' +
			      'Received type ' + (typeof target)
			    )
			  }

			  if (start === undefined) {
			    start = 0;
			  }
			  if (end === undefined) {
			    end = target ? target.length : 0;
			  }
			  if (thisStart === undefined) {
			    thisStart = 0;
			  }
			  if (thisEnd === undefined) {
			    thisEnd = this.length;
			  }

			  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
			    throw new RangeError('out of range index')
			  }

			  if (thisStart >= thisEnd && start >= end) {
			    return 0
			  }
			  if (thisStart >= thisEnd) {
			    return -1
			  }
			  if (start >= end) {
			    return 1
			  }

			  start >>>= 0;
			  end >>>= 0;
			  thisStart >>>= 0;
			  thisEnd >>>= 0;

			  if (this === target) return 0

			  let x = thisEnd - thisStart;
			  let y = end - start;
			  const len = Math.min(x, y);

			  const thisCopy = this.slice(thisStart, thisEnd);
			  const targetCopy = target.slice(start, end);

			  for (let i = 0; i < len; ++i) {
			    if (thisCopy[i] !== targetCopy[i]) {
			      x = thisCopy[i];
			      y = targetCopy[i];
			      break
			    }
			  }

			  if (x < y) return -1
			  if (y < x) return 1
			  return 0
			};

			// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
			// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
			//
			// Arguments:
			// - buffer - a Buffer to search
			// - val - a string, Buffer, or number
			// - byteOffset - an index into `buffer`; will be clamped to an int32
			// - encoding - an optional encoding, relevant is val is a string
			// - dir - true for indexOf, false for lastIndexOf
			function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
			  // Empty buffer means no match
			  if (buffer.length === 0) return -1

			  // Normalize byteOffset
			  if (typeof byteOffset === 'string') {
			    encoding = byteOffset;
			    byteOffset = 0;
			  } else if (byteOffset > 0x7fffffff) {
			    byteOffset = 0x7fffffff;
			  } else if (byteOffset < -0x80000000) {
			    byteOffset = -0x80000000;
			  }
			  byteOffset = +byteOffset; // Coerce to Number.
			  if (numberIsNaN(byteOffset)) {
			    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
			    byteOffset = dir ? 0 : (buffer.length - 1);
			  }

			  // Normalize byteOffset: negative offsets start from the end of the buffer
			  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
			  if (byteOffset >= buffer.length) {
			    if (dir) return -1
			    else byteOffset = buffer.length - 1;
			  } else if (byteOffset < 0) {
			    if (dir) byteOffset = 0;
			    else return -1
			  }

			  // Normalize val
			  if (typeof val === 'string') {
			    val = Buffer.from(val, encoding);
			  }

			  // Finally, search either indexOf (if dir is true) or lastIndexOf
			  if (Buffer.isBuffer(val)) {
			    // Special case: looking for empty string/buffer always fails
			    if (val.length === 0) {
			      return -1
			    }
			    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
			  } else if (typeof val === 'number') {
			    val = val & 0xFF; // Search for a byte value [0-255]
			    if (typeof Uint8Array.prototype.indexOf === 'function') {
			      if (dir) {
			        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
			      } else {
			        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
			      }
			    }
			    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
			  }

			  throw new TypeError('val must be string, number or Buffer')
			}

			function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
			  let indexSize = 1;
			  let arrLength = arr.length;
			  let valLength = val.length;

			  if (encoding !== undefined) {
			    encoding = String(encoding).toLowerCase();
			    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
			        encoding === 'utf16le' || encoding === 'utf-16le') {
			      if (arr.length < 2 || val.length < 2) {
			        return -1
			      }
			      indexSize = 2;
			      arrLength /= 2;
			      valLength /= 2;
			      byteOffset /= 2;
			    }
			  }

			  function read (buf, i) {
			    if (indexSize === 1) {
			      return buf[i]
			    } else {
			      return buf.readUInt16BE(i * indexSize)
			    }
			  }

			  let i;
			  if (dir) {
			    let foundIndex = -1;
			    for (i = byteOffset; i < arrLength; i++) {
			      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
			        if (foundIndex === -1) foundIndex = i;
			        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
			      } else {
			        if (foundIndex !== -1) i -= i - foundIndex;
			        foundIndex = -1;
			      }
			    }
			  } else {
			    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
			    for (i = byteOffset; i >= 0; i--) {
			      let found = true;
			      for (let j = 0; j < valLength; j++) {
			        if (read(arr, i + j) !== read(val, j)) {
			          found = false;
			          break
			        }
			      }
			      if (found) return i
			    }
			  }

			  return -1
			}

			Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
			  return this.indexOf(val, byteOffset, encoding) !== -1
			};

			Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
			  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
			};

			Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
			  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
			};

			function hexWrite (buf, string, offset, length) {
			  offset = Number(offset) || 0;
			  const remaining = buf.length - offset;
			  if (!length) {
			    length = remaining;
			  } else {
			    length = Number(length);
			    if (length > remaining) {
			      length = remaining;
			    }
			  }

			  const strLen = string.length;

			  if (length > strLen / 2) {
			    length = strLen / 2;
			  }
			  let i;
			  for (i = 0; i < length; ++i) {
			    const parsed = parseInt(string.substr(i * 2, 2), 16);
			    if (numberIsNaN(parsed)) return i
			    buf[offset + i] = parsed;
			  }
			  return i
			}

			function utf8Write (buf, string, offset, length) {
			  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
			}

			function asciiWrite (buf, string, offset, length) {
			  return blitBuffer(asciiToBytes(string), buf, offset, length)
			}

			function base64Write (buf, string, offset, length) {
			  return blitBuffer(base64ToBytes(string), buf, offset, length)
			}

			function ucs2Write (buf, string, offset, length) {
			  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
			}

			Buffer.prototype.write = function write (string, offset, length, encoding) {
			  // Buffer#write(string)
			  if (offset === undefined) {
			    encoding = 'utf8';
			    length = this.length;
			    offset = 0;
			  // Buffer#write(string, encoding)
			  } else if (length === undefined && typeof offset === 'string') {
			    encoding = offset;
			    length = this.length;
			    offset = 0;
			  // Buffer#write(string, offset[, length][, encoding])
			  } else if (isFinite(offset)) {
			    offset = offset >>> 0;
			    if (isFinite(length)) {
			      length = length >>> 0;
			      if (encoding === undefined) encoding = 'utf8';
			    } else {
			      encoding = length;
			      length = undefined;
			    }
			  } else {
			    throw new Error(
			      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
			    )
			  }

			  const remaining = this.length - offset;
			  if (length === undefined || length > remaining) length = remaining;

			  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
			    throw new RangeError('Attempt to write outside buffer bounds')
			  }

			  if (!encoding) encoding = 'utf8';

			  let loweredCase = false;
			  for (;;) {
			    switch (encoding) {
			      case 'hex':
			        return hexWrite(this, string, offset, length)

			      case 'utf8':
			      case 'utf-8':
			        return utf8Write(this, string, offset, length)

			      case 'ascii':
			      case 'latin1':
			      case 'binary':
			        return asciiWrite(this, string, offset, length)

			      case 'base64':
			        // Warning: maxLength not taken into account in base64Write
			        return base64Write(this, string, offset, length)

			      case 'ucs2':
			      case 'ucs-2':
			      case 'utf16le':
			      case 'utf-16le':
			        return ucs2Write(this, string, offset, length)

			      default:
			        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
			        encoding = ('' + encoding).toLowerCase();
			        loweredCase = true;
			    }
			  }
			};

			Buffer.prototype.toJSON = function toJSON () {
			  return {
			    type: 'Buffer',
			    data: Array.prototype.slice.call(this._arr || this, 0)
			  }
			};

			function base64Slice (buf, start, end) {
			  if (start === 0 && end === buf.length) {
			    return base64.fromByteArray(buf)
			  } else {
			    return base64.fromByteArray(buf.slice(start, end))
			  }
			}

			function utf8Slice (buf, start, end) {
			  end = Math.min(buf.length, end);
			  const res = [];

			  let i = start;
			  while (i < end) {
			    const firstByte = buf[i];
			    let codePoint = null;
			    let bytesPerSequence = (firstByte > 0xEF)
			      ? 4
			      : (firstByte > 0xDF)
			          ? 3
			          : (firstByte > 0xBF)
			              ? 2
			              : 1;

			    if (i + bytesPerSequence <= end) {
			      let secondByte, thirdByte, fourthByte, tempCodePoint;

			      switch (bytesPerSequence) {
			        case 1:
			          if (firstByte < 0x80) {
			            codePoint = firstByte;
			          }
			          break
			        case 2:
			          secondByte = buf[i + 1];
			          if ((secondByte & 0xC0) === 0x80) {
			            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
			            if (tempCodePoint > 0x7F) {
			              codePoint = tempCodePoint;
			            }
			          }
			          break
			        case 3:
			          secondByte = buf[i + 1];
			          thirdByte = buf[i + 2];
			          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
			            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
			            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
			              codePoint = tempCodePoint;
			            }
			          }
			          break
			        case 4:
			          secondByte = buf[i + 1];
			          thirdByte = buf[i + 2];
			          fourthByte = buf[i + 3];
			          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
			            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
			            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
			              codePoint = tempCodePoint;
			            }
			          }
			      }
			    }

			    if (codePoint === null) {
			      // we did not generate a valid codePoint so insert a
			      // replacement char (U+FFFD) and advance only 1 byte
			      codePoint = 0xFFFD;
			      bytesPerSequence = 1;
			    } else if (codePoint > 0xFFFF) {
			      // encode to utf16 (surrogate pair dance)
			      codePoint -= 0x10000;
			      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
			      codePoint = 0xDC00 | codePoint & 0x3FF;
			    }

			    res.push(codePoint);
			    i += bytesPerSequence;
			  }

			  return decodeCodePointsArray(res)
			}

			// Based on http://stackoverflow.com/a/22747272/680742, the browser with
			// the lowest limit is Chrome, with 0x10000 args.
			// We go 1 magnitude less, for safety
			const MAX_ARGUMENTS_LENGTH = 0x1000;

			function decodeCodePointsArray (codePoints) {
			  const len = codePoints.length;
			  if (len <= MAX_ARGUMENTS_LENGTH) {
			    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
			  }

			  // Decode in chunks to avoid "call stack size exceeded".
			  let res = '';
			  let i = 0;
			  while (i < len) {
			    res += String.fromCharCode.apply(
			      String,
			      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
			    );
			  }
			  return res
			}

			function asciiSlice (buf, start, end) {
			  let ret = '';
			  end = Math.min(buf.length, end);

			  for (let i = start; i < end; ++i) {
			    ret += String.fromCharCode(buf[i] & 0x7F);
			  }
			  return ret
			}

			function latin1Slice (buf, start, end) {
			  let ret = '';
			  end = Math.min(buf.length, end);

			  for (let i = start; i < end; ++i) {
			    ret += String.fromCharCode(buf[i]);
			  }
			  return ret
			}

			function hexSlice (buf, start, end) {
			  const len = buf.length;

			  if (!start || start < 0) start = 0;
			  if (!end || end < 0 || end > len) end = len;

			  let out = '';
			  for (let i = start; i < end; ++i) {
			    out += hexSliceLookupTable[buf[i]];
			  }
			  return out
			}

			function utf16leSlice (buf, start, end) {
			  const bytes = buf.slice(start, end);
			  let res = '';
			  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
			  for (let i = 0; i < bytes.length - 1; i += 2) {
			    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256));
			  }
			  return res
			}

			Buffer.prototype.slice = function slice (start, end) {
			  const len = this.length;
			  start = ~~start;
			  end = end === undefined ? len : ~~end;

			  if (start < 0) {
			    start += len;
			    if (start < 0) start = 0;
			  } else if (start > len) {
			    start = len;
			  }

			  if (end < 0) {
			    end += len;
			    if (end < 0) end = 0;
			  } else if (end > len) {
			    end = len;
			  }

			  if (end < start) end = start;

			  const newBuf = this.subarray(start, end);
			  // Return an augmented `Uint8Array` instance
			  Object.setPrototypeOf(newBuf, Buffer.prototype);

			  return newBuf
			};

			/*
			 * Need to make sure that buffer isn't trying to write out of bounds.
			 */
			function checkOffset (offset, ext, length) {
			  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
			  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
			}

			Buffer.prototype.readUintLE =
			Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
			  offset = offset >>> 0;
			  byteLength = byteLength >>> 0;
			  if (!noAssert) checkOffset(offset, byteLength, this.length);

			  let val = this[offset];
			  let mul = 1;
			  let i = 0;
			  while (++i < byteLength && (mul *= 0x100)) {
			    val += this[offset + i] * mul;
			  }

			  return val
			};

			Buffer.prototype.readUintBE =
			Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
			  offset = offset >>> 0;
			  byteLength = byteLength >>> 0;
			  if (!noAssert) {
			    checkOffset(offset, byteLength, this.length);
			  }

			  let val = this[offset + --byteLength];
			  let mul = 1;
			  while (byteLength > 0 && (mul *= 0x100)) {
			    val += this[offset + --byteLength] * mul;
			  }

			  return val
			};

			Buffer.prototype.readUint8 =
			Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 1, this.length);
			  return this[offset]
			};

			Buffer.prototype.readUint16LE =
			Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 2, this.length);
			  return this[offset] | (this[offset + 1] << 8)
			};

			Buffer.prototype.readUint16BE =
			Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 2, this.length);
			  return (this[offset] << 8) | this[offset + 1]
			};

			Buffer.prototype.readUint32LE =
			Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 4, this.length);

			  return ((this[offset]) |
			      (this[offset + 1] << 8) |
			      (this[offset + 2] << 16)) +
			      (this[offset + 3] * 0x1000000)
			};

			Buffer.prototype.readUint32BE =
			Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 4, this.length);

			  return (this[offset] * 0x1000000) +
			    ((this[offset + 1] << 16) |
			    (this[offset + 2] << 8) |
			    this[offset + 3])
			};

			Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
			  offset = offset >>> 0;
			  validateNumber(offset, 'offset');
			  const first = this[offset];
			  const last = this[offset + 7];
			  if (first === undefined || last === undefined) {
			    boundsError(offset, this.length - 8);
			  }

			  const lo = first +
			    this[++offset] * 2 ** 8 +
			    this[++offset] * 2 ** 16 +
			    this[++offset] * 2 ** 24;

			  const hi = this[++offset] +
			    this[++offset] * 2 ** 8 +
			    this[++offset] * 2 ** 16 +
			    last * 2 ** 24;

			  return BigInt(lo) + (BigInt(hi) << BigInt(32))
			});

			Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
			  offset = offset >>> 0;
			  validateNumber(offset, 'offset');
			  const first = this[offset];
			  const last = this[offset + 7];
			  if (first === undefined || last === undefined) {
			    boundsError(offset, this.length - 8);
			  }

			  const hi = first * 2 ** 24 +
			    this[++offset] * 2 ** 16 +
			    this[++offset] * 2 ** 8 +
			    this[++offset];

			  const lo = this[++offset] * 2 ** 24 +
			    this[++offset] * 2 ** 16 +
			    this[++offset] * 2 ** 8 +
			    last;

			  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
			});

			Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
			  offset = offset >>> 0;
			  byteLength = byteLength >>> 0;
			  if (!noAssert) checkOffset(offset, byteLength, this.length);

			  let val = this[offset];
			  let mul = 1;
			  let i = 0;
			  while (++i < byteLength && (mul *= 0x100)) {
			    val += this[offset + i] * mul;
			  }
			  mul *= 0x80;

			  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

			  return val
			};

			Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
			  offset = offset >>> 0;
			  byteLength = byteLength >>> 0;
			  if (!noAssert) checkOffset(offset, byteLength, this.length);

			  let i = byteLength;
			  let mul = 1;
			  let val = this[offset + --i];
			  while (i > 0 && (mul *= 0x100)) {
			    val += this[offset + --i] * mul;
			  }
			  mul *= 0x80;

			  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

			  return val
			};

			Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 1, this.length);
			  if (!(this[offset] & 0x80)) return (this[offset])
			  return ((0xff - this[offset] + 1) * -1)
			};

			Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 2, this.length);
			  const val = this[offset] | (this[offset + 1] << 8);
			  return (val & 0x8000) ? val | 0xFFFF0000 : val
			};

			Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 2, this.length);
			  const val = this[offset + 1] | (this[offset] << 8);
			  return (val & 0x8000) ? val | 0xFFFF0000 : val
			};

			Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 4, this.length);

			  return (this[offset]) |
			    (this[offset + 1] << 8) |
			    (this[offset + 2] << 16) |
			    (this[offset + 3] << 24)
			};

			Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 4, this.length);

			  return (this[offset] << 24) |
			    (this[offset + 1] << 16) |
			    (this[offset + 2] << 8) |
			    (this[offset + 3])
			};

			Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
			  offset = offset >>> 0;
			  validateNumber(offset, 'offset');
			  const first = this[offset];
			  const last = this[offset + 7];
			  if (first === undefined || last === undefined) {
			    boundsError(offset, this.length - 8);
			  }

			  const val = this[offset + 4] +
			    this[offset + 5] * 2 ** 8 +
			    this[offset + 6] * 2 ** 16 +
			    (last << 24); // Overflow

			  return (BigInt(val) << BigInt(32)) +
			    BigInt(first +
			    this[++offset] * 2 ** 8 +
			    this[++offset] * 2 ** 16 +
			    this[++offset] * 2 ** 24)
			});

			Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
			  offset = offset >>> 0;
			  validateNumber(offset, 'offset');
			  const first = this[offset];
			  const last = this[offset + 7];
			  if (first === undefined || last === undefined) {
			    boundsError(offset, this.length - 8);
			  }

			  const val = (first << 24) + // Overflow
			    this[++offset] * 2 ** 16 +
			    this[++offset] * 2 ** 8 +
			    this[++offset];

			  return (BigInt(val) << BigInt(32)) +
			    BigInt(this[++offset] * 2 ** 24 +
			    this[++offset] * 2 ** 16 +
			    this[++offset] * 2 ** 8 +
			    last)
			});

			Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 4, this.length);
			  return ieee754.read(this, offset, true, 23, 4)
			};

			Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 4, this.length);
			  return ieee754.read(this, offset, false, 23, 4)
			};

			Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 8, this.length);
			  return ieee754.read(this, offset, true, 52, 8)
			};

			Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
			  offset = offset >>> 0;
			  if (!noAssert) checkOffset(offset, 8, this.length);
			  return ieee754.read(this, offset, false, 52, 8)
			};

			function checkInt (buf, value, offset, ext, max, min) {
			  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
			  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
			  if (offset + ext > buf.length) throw new RangeError('Index out of range')
			}

			Buffer.prototype.writeUintLE =
			Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  byteLength = byteLength >>> 0;
			  if (!noAssert) {
			    const maxBytes = Math.pow(2, 8 * byteLength) - 1;
			    checkInt(this, value, offset, byteLength, maxBytes, 0);
			  }

			  let mul = 1;
			  let i = 0;
			  this[offset] = value & 0xFF;
			  while (++i < byteLength && (mul *= 0x100)) {
			    this[offset + i] = (value / mul) & 0xFF;
			  }

			  return offset + byteLength
			};

			Buffer.prototype.writeUintBE =
			Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  byteLength = byteLength >>> 0;
			  if (!noAssert) {
			    const maxBytes = Math.pow(2, 8 * byteLength) - 1;
			    checkInt(this, value, offset, byteLength, maxBytes, 0);
			  }

			  let i = byteLength - 1;
			  let mul = 1;
			  this[offset + i] = value & 0xFF;
			  while (--i >= 0 && (mul *= 0x100)) {
			    this[offset + i] = (value / mul) & 0xFF;
			  }

			  return offset + byteLength
			};

			Buffer.prototype.writeUint8 =
			Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
			  this[offset] = (value & 0xff);
			  return offset + 1
			};

			Buffer.prototype.writeUint16LE =
			Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
			  this[offset] = (value & 0xff);
			  this[offset + 1] = (value >>> 8);
			  return offset + 2
			};

			Buffer.prototype.writeUint16BE =
			Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
			  this[offset] = (value >>> 8);
			  this[offset + 1] = (value & 0xff);
			  return offset + 2
			};

			Buffer.prototype.writeUint32LE =
			Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
			  this[offset + 3] = (value >>> 24);
			  this[offset + 2] = (value >>> 16);
			  this[offset + 1] = (value >>> 8);
			  this[offset] = (value & 0xff);
			  return offset + 4
			};

			Buffer.prototype.writeUint32BE =
			Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
			  this[offset] = (value >>> 24);
			  this[offset + 1] = (value >>> 16);
			  this[offset + 2] = (value >>> 8);
			  this[offset + 3] = (value & 0xff);
			  return offset + 4
			};

			function wrtBigUInt64LE (buf, value, offset, min, max) {
			  checkIntBI(value, min, max, buf, offset, 7);

			  let lo = Number(value & BigInt(0xffffffff));
			  buf[offset++] = lo;
			  lo = lo >> 8;
			  buf[offset++] = lo;
			  lo = lo >> 8;
			  buf[offset++] = lo;
			  lo = lo >> 8;
			  buf[offset++] = lo;
			  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
			  buf[offset++] = hi;
			  hi = hi >> 8;
			  buf[offset++] = hi;
			  hi = hi >> 8;
			  buf[offset++] = hi;
			  hi = hi >> 8;
			  buf[offset++] = hi;
			  return offset
			}

			function wrtBigUInt64BE (buf, value, offset, min, max) {
			  checkIntBI(value, min, max, buf, offset, 7);

			  let lo = Number(value & BigInt(0xffffffff));
			  buf[offset + 7] = lo;
			  lo = lo >> 8;
			  buf[offset + 6] = lo;
			  lo = lo >> 8;
			  buf[offset + 5] = lo;
			  lo = lo >> 8;
			  buf[offset + 4] = lo;
			  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
			  buf[offset + 3] = hi;
			  hi = hi >> 8;
			  buf[offset + 2] = hi;
			  hi = hi >> 8;
			  buf[offset + 1] = hi;
			  hi = hi >> 8;
			  buf[offset] = hi;
			  return offset + 8
			}

			Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
			  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
			});

			Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
			  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
			});

			Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) {
			    const limit = Math.pow(2, (8 * byteLength) - 1);

			    checkInt(this, value, offset, byteLength, limit - 1, -limit);
			  }

			  let i = 0;
			  let mul = 1;
			  let sub = 0;
			  this[offset] = value & 0xFF;
			  while (++i < byteLength && (mul *= 0x100)) {
			    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
			      sub = 1;
			    }
			    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
			  }

			  return offset + byteLength
			};

			Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) {
			    const limit = Math.pow(2, (8 * byteLength) - 1);

			    checkInt(this, value, offset, byteLength, limit - 1, -limit);
			  }

			  let i = byteLength - 1;
			  let mul = 1;
			  let sub = 0;
			  this[offset + i] = value & 0xFF;
			  while (--i >= 0 && (mul *= 0x100)) {
			    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
			      sub = 1;
			    }
			    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
			  }

			  return offset + byteLength
			};

			Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
			  if (value < 0) value = 0xff + value + 1;
			  this[offset] = (value & 0xff);
			  return offset + 1
			};

			Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
			  this[offset] = (value & 0xff);
			  this[offset + 1] = (value >>> 8);
			  return offset + 2
			};

			Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
			  this[offset] = (value >>> 8);
			  this[offset + 1] = (value & 0xff);
			  return offset + 2
			};

			Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
			  this[offset] = (value & 0xff);
			  this[offset + 1] = (value >>> 8);
			  this[offset + 2] = (value >>> 16);
			  this[offset + 3] = (value >>> 24);
			  return offset + 4
			};

			Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
			  if (value < 0) value = 0xffffffff + value + 1;
			  this[offset] = (value >>> 24);
			  this[offset + 1] = (value >>> 16);
			  this[offset + 2] = (value >>> 8);
			  this[offset + 3] = (value & 0xff);
			  return offset + 4
			};

			Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
			  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
			});

			Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
			  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
			});

			function checkIEEE754 (buf, value, offset, ext, max, min) {
			  if (offset + ext > buf.length) throw new RangeError('Index out of range')
			  if (offset < 0) throw new RangeError('Index out of range')
			}

			function writeFloat (buf, value, offset, littleEndian, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) {
			    checkIEEE754(buf, value, offset, 4);
			  }
			  ieee754.write(buf, value, offset, littleEndian, 23, 4);
			  return offset + 4
			}

			Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
			  return writeFloat(this, value, offset, true, noAssert)
			};

			Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
			  return writeFloat(this, value, offset, false, noAssert)
			};

			function writeDouble (buf, value, offset, littleEndian, noAssert) {
			  value = +value;
			  offset = offset >>> 0;
			  if (!noAssert) {
			    checkIEEE754(buf, value, offset, 8);
			  }
			  ieee754.write(buf, value, offset, littleEndian, 52, 8);
			  return offset + 8
			}

			Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
			  return writeDouble(this, value, offset, true, noAssert)
			};

			Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
			  return writeDouble(this, value, offset, false, noAssert)
			};

			// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
			Buffer.prototype.copy = function copy (target, targetStart, start, end) {
			  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
			  if (!start) start = 0;
			  if (!end && end !== 0) end = this.length;
			  if (targetStart >= target.length) targetStart = target.length;
			  if (!targetStart) targetStart = 0;
			  if (end > 0 && end < start) end = start;

			  // Copy 0 bytes; we're done
			  if (end === start) return 0
			  if (target.length === 0 || this.length === 0) return 0

			  // Fatal error conditions
			  if (targetStart < 0) {
			    throw new RangeError('targetStart out of bounds')
			  }
			  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
			  if (end < 0) throw new RangeError('sourceEnd out of bounds')

			  // Are we oob?
			  if (end > this.length) end = this.length;
			  if (target.length - targetStart < end - start) {
			    end = target.length - targetStart + start;
			  }

			  const len = end - start;

			  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
			    // Use built-in when available, missing from IE11
			    this.copyWithin(targetStart, start, end);
			  } else {
			    Uint8Array.prototype.set.call(
			      target,
			      this.subarray(start, end),
			      targetStart
			    );
			  }

			  return len
			};

			// Usage:
			//    buffer.fill(number[, offset[, end]])
			//    buffer.fill(buffer[, offset[, end]])
			//    buffer.fill(string[, offset[, end]][, encoding])
			Buffer.prototype.fill = function fill (val, start, end, encoding) {
			  // Handle string cases:
			  if (typeof val === 'string') {
			    if (typeof start === 'string') {
			      encoding = start;
			      start = 0;
			      end = this.length;
			    } else if (typeof end === 'string') {
			      encoding = end;
			      end = this.length;
			    }
			    if (encoding !== undefined && typeof encoding !== 'string') {
			      throw new TypeError('encoding must be a string')
			    }
			    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
			      throw new TypeError('Unknown encoding: ' + encoding)
			    }
			    if (val.length === 1) {
			      const code = val.charCodeAt(0);
			      if ((encoding === 'utf8' && code < 128) ||
			          encoding === 'latin1') {
			        // Fast path: If `val` fits into a single byte, use that numeric value.
			        val = code;
			      }
			    }
			  } else if (typeof val === 'number') {
			    val = val & 255;
			  } else if (typeof val === 'boolean') {
			    val = Number(val);
			  }

			  // Invalid ranges are not set to a default, so can range check early.
			  if (start < 0 || this.length < start || this.length < end) {
			    throw new RangeError('Out of range index')
			  }

			  if (end <= start) {
			    return this
			  }

			  start = start >>> 0;
			  end = end === undefined ? this.length : end >>> 0;

			  if (!val) val = 0;

			  let i;
			  if (typeof val === 'number') {
			    for (i = start; i < end; ++i) {
			      this[i] = val;
			    }
			  } else {
			    const bytes = Buffer.isBuffer(val)
			      ? val
			      : Buffer.from(val, encoding);
			    const len = bytes.length;
			    if (len === 0) {
			      throw new TypeError('The value "' + val +
			        '" is invalid for argument "value"')
			    }
			    for (i = 0; i < end - start; ++i) {
			      this[i + start] = bytes[i % len];
			    }
			  }

			  return this
			};

			// CUSTOM ERRORS
			// =============

			// Simplified versions from Node, changed for Buffer-only usage
			const errors = {};
			function E (sym, getMessage, Base) {
			  errors[sym] = class NodeError extends Base {
			    constructor () {
			      super();

			      Object.defineProperty(this, 'message', {
			        value: getMessage.apply(this, arguments),
			        writable: true,
			        configurable: true
			      });

			      // Add the error code to the name to include it in the stack trace.
			      this.name = `${this.name} [${sym}]`;
			      // Access the stack to generate the error message including the error code
			      // from the name.
			      this.stack; // eslint-disable-line no-unused-expressions
			      // Reset the name to the actual name.
			      delete this.name;
			    }

			    get code () {
			      return sym
			    }

			    set code (value) {
			      Object.defineProperty(this, 'code', {
			        configurable: true,
			        enumerable: true,
			        value,
			        writable: true
			      });
			    }

			    toString () {
			      return `${this.name} [${sym}]: ${this.message}`
			    }
			  };
			}

			E('ERR_BUFFER_OUT_OF_BOUNDS',
			  function (name) {
			    if (name) {
			      return `${name} is outside of buffer bounds`
			    }

			    return 'Attempt to access memory outside buffer bounds'
			  }, RangeError);
			E('ERR_INVALID_ARG_TYPE',
			  function (name, actual) {
			    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
			  }, TypeError);
			E('ERR_OUT_OF_RANGE',
			  function (str, range, input) {
			    let msg = `The value of "${str}" is out of range.`;
			    let received = input;
			    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
			      received = addNumericalSeparator(String(input));
			    } else if (typeof input === 'bigint') {
			      received = String(input);
			      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
			        received = addNumericalSeparator(received);
			      }
			      received += 'n';
			    }
			    msg += ` It must be ${range}. Received ${received}`;
			    return msg
			  }, RangeError);

			function addNumericalSeparator (val) {
			  let res = '';
			  let i = val.length;
			  const start = val[0] === '-' ? 1 : 0;
			  for (; i >= start + 4; i -= 3) {
			    res = `_${val.slice(i - 3, i)}${res}`;
			  }
			  return `${val.slice(0, i)}${res}`
			}

			// CHECK FUNCTIONS
			// ===============

			function checkBounds (buf, offset, byteLength) {
			  validateNumber(offset, 'offset');
			  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
			    boundsError(offset, buf.length - (byteLength + 1));
			  }
			}

			function checkIntBI (value, min, max, buf, offset, byteLength) {
			  if (value > max || value < min) {
			    const n = typeof min === 'bigint' ? 'n' : '';
			    let range;
			    {
			      if (min === 0 || min === BigInt(0)) {
			        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
			      } else {
			        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
			                `${(byteLength + 1) * 8 - 1}${n}`;
			      }
			    }
			    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
			  }
			  checkBounds(buf, offset, byteLength);
			}

			function validateNumber (value, name) {
			  if (typeof value !== 'number') {
			    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
			  }
			}

			function boundsError (value, length, type) {
			  if (Math.floor(value) !== value) {
			    validateNumber(value, type);
			    throw new errors.ERR_OUT_OF_RANGE('offset', 'an integer', value)
			  }

			  if (length < 0) {
			    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
			  }

			  throw new errors.ERR_OUT_OF_RANGE('offset',
			                                    `>= ${0} and <= ${length}`,
			                                    value)
			}

			// HELPER FUNCTIONS
			// ================

			const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

			function base64clean (str) {
			  // Node takes equal signs as end of the Base64 encoding
			  str = str.split('=')[0];
			  // Node strips out invalid characters like \n and \t from the string, base64-js does not
			  str = str.trim().replace(INVALID_BASE64_RE, '');
			  // Node converts strings with length < 2 to ''
			  if (str.length < 2) return ''
			  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
			  while (str.length % 4 !== 0) {
			    str = str + '=';
			  }
			  return str
			}

			function utf8ToBytes (string, units) {
			  units = units || Infinity;
			  let codePoint;
			  const length = string.length;
			  let leadSurrogate = null;
			  const bytes = [];

			  for (let i = 0; i < length; ++i) {
			    codePoint = string.charCodeAt(i);

			    // is surrogate component
			    if (codePoint > 0xD7FF && codePoint < 0xE000) {
			      // last char was a lead
			      if (!leadSurrogate) {
			        // no lead yet
			        if (codePoint > 0xDBFF) {
			          // unexpected trail
			          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
			          continue
			        } else if (i + 1 === length) {
			          // unpaired lead
			          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
			          continue
			        }

			        // valid lead
			        leadSurrogate = codePoint;

			        continue
			      }

			      // 2 leads in a row
			      if (codePoint < 0xDC00) {
			        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
			        leadSurrogate = codePoint;
			        continue
			      }

			      // valid surrogate pair
			      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
			    } else if (leadSurrogate) {
			      // valid bmp char, but last char was a lead
			      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
			    }

			    leadSurrogate = null;

			    // encode utf8
			    if (codePoint < 0x80) {
			      if ((units -= 1) < 0) break
			      bytes.push(codePoint);
			    } else if (codePoint < 0x800) {
			      if ((units -= 2) < 0) break
			      bytes.push(
			        codePoint >> 0x6 | 0xC0,
			        codePoint & 0x3F | 0x80
			      );
			    } else if (codePoint < 0x10000) {
			      if ((units -= 3) < 0) break
			      bytes.push(
			        codePoint >> 0xC | 0xE0,
			        codePoint >> 0x6 & 0x3F | 0x80,
			        codePoint & 0x3F | 0x80
			      );
			    } else if (codePoint < 0x110000) {
			      if ((units -= 4) < 0) break
			      bytes.push(
			        codePoint >> 0x12 | 0xF0,
			        codePoint >> 0xC & 0x3F | 0x80,
			        codePoint >> 0x6 & 0x3F | 0x80,
			        codePoint & 0x3F | 0x80
			      );
			    } else {
			      throw new Error('Invalid code point')
			    }
			  }

			  return bytes
			}

			function asciiToBytes (str) {
			  const byteArray = [];
			  for (let i = 0; i < str.length; ++i) {
			    // Node's code seems to be doing this and not & 0x7F..
			    byteArray.push(str.charCodeAt(i) & 0xFF);
			  }
			  return byteArray
			}

			function utf16leToBytes (str, units) {
			  let c, hi, lo;
			  const byteArray = [];
			  for (let i = 0; i < str.length; ++i) {
			    if ((units -= 2) < 0) break

			    c = str.charCodeAt(i);
			    hi = c >> 8;
			    lo = c % 256;
			    byteArray.push(lo);
			    byteArray.push(hi);
			  }

			  return byteArray
			}

			function base64ToBytes (str) {
			  return base64.toByteArray(base64clean(str))
			}

			function blitBuffer (src, dst, offset, length) {
			  let i;
			  for (i = 0; i < length; ++i) {
			    if ((i + offset >= dst.length) || (i >= src.length)) break
			    dst[i + offset] = src[i];
			  }
			  return i
			}

			// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
			// the `instanceof` check but they should be treated as of that type.
			// See: https://github.com/feross/buffer/issues/166
			function isInstance (obj, type) {
			  return obj instanceof type ||
			    (obj != null && obj.constructor != null && obj.constructor.name != null &&
			      obj.constructor.name === type.name)
			}
			function numberIsNaN (obj) {
			  // For IE11 support
			  return obj !== obj // eslint-disable-line no-self-compare
			}

			// Create lookup table for `toString('hex')`
			// See: https://github.com/feross/buffer/issues/219
			const hexSliceLookupTable = (function () {
			  const alphabet = '0123456789abcdef';
			  const table = new Array(256);
			  for (let i = 0; i < 16; ++i) {
			    const i16 = i * 16;
			    for (let j = 0; j < 16; ++j) {
			      table[i16 + j] = alphabet[i] + alphabet[j];
			    }
			  }
			  return table
			})();

			// Return not function with Error if BigInt not supported
			function defineBigIntMethod (fn) {
			  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
			}

			function BufferBigIntNotDefined () {
			  throw new Error('BigInt not supported')
			} 
		} (buffer));
		return buffer;
	}

	var bufferExports = /*@__PURE__*/ requireBuffer();

	function anumber$1(n) {
	    if (!Number.isSafeInteger(n) || n < 0)
	        throw new Error('positive integer expected, got ' + n);
	}
	// copied from utils
	function isBytes$2(a) {
	    return a instanceof Uint8Array || (ArrayBuffer.isView(a) && a.constructor.name === 'Uint8Array');
	}
	function abytes$2(b, ...lengths) {
	    if (!isBytes$2(b))
	        throw new Error('Uint8Array expected');
	    if (lengths.length > 0 && !lengths.includes(b.length))
	        throw new Error('Uint8Array expected of length ' + lengths + ', got length=' + b.length);
	}
	function ahash(h) {
	    if (typeof h !== 'function' || typeof h.create !== 'function')
	        throw new Error('Hash should be wrapped by utils.wrapConstructor');
	    anumber$1(h.outputLen);
	    anumber$1(h.blockLen);
	}
	function aexists$1(instance, checkFinished = true) {
	    if (instance.destroyed)
	        throw new Error('Hash instance has been destroyed');
	    if (checkFinished && instance.finished)
	        throw new Error('Hash#digest() has already been called');
	}
	function aoutput$1(out, instance) {
	    abytes$2(out);
	    const min = instance.outputLen;
	    if (out.length < min) {
	        throw new Error('digestInto() expects output buffer of length at least ' + min);
	    }
	}

	const crypto$1 = typeof globalThis === 'object' && 'crypto' in globalThis ? globalThis.crypto : undefined;

	/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
	// node.js versions earlier than v19 don't declare it in global scope.
	// For node.js, package.json#exports field mapping rewrites import
	// from `crypto` to `cryptoNode`, which imports native module.
	// Makes the utils un-importable in browsers without a bundler.
	// Once node.js 18 is deprecated (2025-04-30), we can just drop the import.
	// Cast array to view
	const createView$1 = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
	// The rotate right (circular right shift) operation for uint32
	const rotr$1 = (word, shift) => (word << (32 - shift)) | (word >>> shift);
	/**
	 * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	 */
	function utf8ToBytes$2(str) {
	    if (typeof str !== 'string')
	        throw new Error('utf8ToBytes expected string, got ' + typeof str);
	    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
	}
	/**
	 * Normalizes (non-hex) string or Uint8Array to Uint8Array.
	 * Warning: when Uint8Array is passed, it would NOT get copied.
	 * Keep in mind for future mutable operations.
	 */
	function toBytes$1(data) {
	    if (typeof data === 'string')
	        data = utf8ToBytes$2(data);
	    abytes$2(data);
	    return data;
	}
	/**
	 * Copies several Uint8Arrays into one.
	 */
	function concatBytes$1(...arrays) {
	    let sum = 0;
	    for (let i = 0; i < arrays.length; i++) {
	        const a = arrays[i];
	        abytes$2(a);
	        sum += a.length;
	    }
	    const res = new Uint8Array(sum);
	    for (let i = 0, pad = 0; i < arrays.length; i++) {
	        const a = arrays[i];
	        res.set(a, pad);
	        pad += a.length;
	    }
	    return res;
	}
	// For runtime check if class implements interface
	let Hash$1 = class Hash {
	    // Safe version that clones internal state
	    clone() {
	        return this._cloneInto();
	    }
	};
	function wrapConstructor$1(hashCons) {
	    const hashC = (msg) => hashCons().update(toBytes$1(msg)).digest();
	    const tmp = hashCons();
	    hashC.outputLen = tmp.outputLen;
	    hashC.blockLen = tmp.blockLen;
	    hashC.create = () => hashCons();
	    return hashC;
	}
	/**
	 * Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
	 */
	function randomBytes(bytesLength = 32) {
	    if (crypto$1 && typeof crypto$1.getRandomValues === 'function') {
	        return crypto$1.getRandomValues(new Uint8Array(bytesLength));
	    }
	    // Legacy Node.js compatibility
	    if (crypto$1 && typeof crypto$1.randomBytes === 'function') {
	        return crypto$1.randomBytes(bytesLength);
	    }
	    throw new Error('crypto.getRandomValues must be defined');
	}

	/**
	 * Polyfill for Safari 14
	 */
	function setBigUint64$1(view, byteOffset, value, isLE) {
	    if (typeof view.setBigUint64 === 'function')
	        return view.setBigUint64(byteOffset, value, isLE);
	    const _32n = BigInt(32);
	    const _u32_max = BigInt(0xffffffff);
	    const wh = Number((value >> _32n) & _u32_max);
	    const wl = Number(value & _u32_max);
	    const h = isLE ? 4 : 0;
	    const l = isLE ? 0 : 4;
	    view.setUint32(byteOffset + h, wh, isLE);
	    view.setUint32(byteOffset + l, wl, isLE);
	}
	/**
	 * Choice: a ? b : c
	 */
	const Chi$1 = (a, b, c) => (a & b) ^ (~a & c);
	/**
	 * Majority function, true if any two inputs is true
	 */
	const Maj$1 = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
	/**
	 * Merkle-Damgard hash construction base class.
	 * Could be used to create MD5, RIPEMD, SHA1, SHA2.
	 */
	let HashMD$1 = class HashMD extends Hash$1 {
	    constructor(blockLen, outputLen, padOffset, isLE) {
	        super();
	        this.blockLen = blockLen;
	        this.outputLen = outputLen;
	        this.padOffset = padOffset;
	        this.isLE = isLE;
	        this.finished = false;
	        this.length = 0;
	        this.pos = 0;
	        this.destroyed = false;
	        this.buffer = new Uint8Array(blockLen);
	        this.view = createView$1(this.buffer);
	    }
	    update(data) {
	        aexists$1(this);
	        const { view, buffer, blockLen } = this;
	        data = toBytes$1(data);
	        const len = data.length;
	        for (let pos = 0; pos < len;) {
	            const take = Math.min(blockLen - this.pos, len - pos);
	            // Fast path: we have at least one block in input, cast it to view and process
	            if (take === blockLen) {
	                const dataView = createView$1(data);
	                for (; blockLen <= len - pos; pos += blockLen)
	                    this.process(dataView, pos);
	                continue;
	            }
	            buffer.set(data.subarray(pos, pos + take), this.pos);
	            this.pos += take;
	            pos += take;
	            if (this.pos === blockLen) {
	                this.process(view, 0);
	                this.pos = 0;
	            }
	        }
	        this.length += data.length;
	        this.roundClean();
	        return this;
	    }
	    digestInto(out) {
	        aexists$1(this);
	        aoutput$1(out, this);
	        this.finished = true;
	        // Padding
	        // We can avoid allocation of buffer for padding completely if it
	        // was previously not allocated here. But it won't change performance.
	        const { buffer, view, blockLen, isLE } = this;
	        let { pos } = this;
	        // append the bit '1' to the message
	        buffer[pos++] = 0b10000000;
	        this.buffer.subarray(pos).fill(0);
	        // we have less than padOffset left in buffer, so we cannot put length in
	        // current block, need process it and pad again
	        if (this.padOffset > blockLen - pos) {
	            this.process(view, 0);
	            pos = 0;
	        }
	        // Pad until full block byte with zeros
	        for (let i = pos; i < blockLen; i++)
	            buffer[i] = 0;
	        // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
	        // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
	        // So we just write lowest 64 bits of that value.
	        setBigUint64$1(view, blockLen - 8, BigInt(this.length * 8), isLE);
	        this.process(view, 0);
	        const oview = createView$1(out);
	        const len = this.outputLen;
	        // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
	        if (len % 4)
	            throw new Error('_sha2: outputLen should be aligned to 32bit');
	        const outLen = len / 4;
	        const state = this.get();
	        if (outLen > state.length)
	            throw new Error('_sha2: outputLen bigger than state');
	        for (let i = 0; i < outLen; i++)
	            oview.setUint32(4 * i, state[i], isLE);
	    }
	    digest() {
	        const { buffer, outputLen } = this;
	        this.digestInto(buffer);
	        const res = buffer.slice(0, outputLen);
	        this.destroy();
	        return res;
	    }
	    _cloneInto(to) {
	        to || (to = new this.constructor());
	        to.set(...this.get());
	        const { blockLen, buffer, length, finished, destroyed, pos } = this;
	        to.length = length;
	        to.pos = pos;
	        to.finished = finished;
	        to.destroyed = destroyed;
	        if (length % blockLen)
	            to.buffer.set(buffer);
	        return to;
	    }
	};

	const U32_MASK64$1 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
	const _32n$1 = /* @__PURE__ */ BigInt(32);
	// BigUint64Array is too slow as per 2024, so we implement it using Uint32Array.
	// TODO: re-check https://issues.chromium.org/issues/42212588
	function fromBig$1(n, le = false) {
	    if (le)
	        return { h: Number(n & U32_MASK64$1), l: Number((n >> _32n$1) & U32_MASK64$1) };
	    return { h: Number((n >> _32n$1) & U32_MASK64$1) | 0, l: Number(n & U32_MASK64$1) | 0 };
	}
	function split$1(lst, le = false) {
	    let Ah = new Uint32Array(lst.length);
	    let Al = new Uint32Array(lst.length);
	    for (let i = 0; i < lst.length; i++) {
	        const { h, l } = fromBig$1(lst[i], le);
	        [Ah[i], Al[i]] = [h, l];
	    }
	    return [Ah, Al];
	}
	const toBig = (h, l) => (BigInt(h >>> 0) << _32n$1) | BigInt(l >>> 0);
	// for Shift in [0, 32)
	const shrSH = (h, _l, s) => h >>> s;
	const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
	// Right rotate for Shift in [1, 32)
	const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
	const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
	// Right rotate for Shift in (32, 64), NOTE: 32 is special case.
	const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
	const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
	// Right rotate for shift===32 (just swaps l&h)
	const rotr32H = (_h, l) => l;
	const rotr32L = (h, _l) => h;
	// Left rotate for Shift in [1, 32)
	const rotlSH$1 = (h, l, s) => (h << s) | (l >>> (32 - s));
	const rotlSL$1 = (h, l, s) => (l << s) | (h >>> (32 - s));
	// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
	const rotlBH$1 = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
	const rotlBL$1 = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
	// JS uses 32-bit signed integers for bitwise operations which means we cannot
	// simple take carry out of low bit sum by shift, we need to use division.
	function add(Ah, Al, Bh, Bl) {
	    const l = (Al >>> 0) + (Bl >>> 0);
	    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
	}
	// Addition with more than 2 elements
	const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
	const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
	const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
	const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
	const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
	const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
	// prettier-ignore
	const u64$1 = {
	    fromBig: fromBig$1, split: split$1, toBig,
	    shrSH, shrSL,
	    rotrSH, rotrSL, rotrBH, rotrBL,
	    rotr32H, rotr32L,
	    rotlSH: rotlSH$1, rotlSL: rotlSL$1, rotlBH: rotlBH$1, rotlBL: rotlBL$1,
	    add, add3L, add3H, add4L, add4H, add5H, add5L,
	};

	// Round contants (first 32 bits of the fractional parts of the cube roots of the first 80 primes 2..409):
	// prettier-ignore
	const [SHA512_Kh, SHA512_Kl] = /* @__PURE__ */ (() => u64$1.split([
	    '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
	    '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
	    '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
	    '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
	    '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
	    '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
	    '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
	    '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
	    '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
	    '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
	    '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
	    '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
	    '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
	    '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
	    '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
	    '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
	    '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
	    '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
	    '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
	    '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
	].map(n => BigInt(n))))();
	// Temporary buffer, not used to store anything between runs
	const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
	const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
	class SHA512 extends HashMD$1 {
	    constructor() {
	        super(128, 64, 16, false);
	        // We cannot use array here since array allows indexing by variable which means optimizer/compiler cannot use registers.
	        // Also looks cleaner and easier to verify with spec.
	        // Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
	        // h -- high 32 bits, l -- low 32 bits
	        this.Ah = 0x6a09e667 | 0;
	        this.Al = 0xf3bcc908 | 0;
	        this.Bh = 0xbb67ae85 | 0;
	        this.Bl = 0x84caa73b | 0;
	        this.Ch = 0x3c6ef372 | 0;
	        this.Cl = 0xfe94f82b | 0;
	        this.Dh = 0xa54ff53a | 0;
	        this.Dl = 0x5f1d36f1 | 0;
	        this.Eh = 0x510e527f | 0;
	        this.El = 0xade682d1 | 0;
	        this.Fh = 0x9b05688c | 0;
	        this.Fl = 0x2b3e6c1f | 0;
	        this.Gh = 0x1f83d9ab | 0;
	        this.Gl = 0xfb41bd6b | 0;
	        this.Hh = 0x5be0cd19 | 0;
	        this.Hl = 0x137e2179 | 0;
	    }
	    // prettier-ignore
	    get() {
	        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
	        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
	    }
	    // prettier-ignore
	    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
	        this.Ah = Ah | 0;
	        this.Al = Al | 0;
	        this.Bh = Bh | 0;
	        this.Bl = Bl | 0;
	        this.Ch = Ch | 0;
	        this.Cl = Cl | 0;
	        this.Dh = Dh | 0;
	        this.Dl = Dl | 0;
	        this.Eh = Eh | 0;
	        this.El = El | 0;
	        this.Fh = Fh | 0;
	        this.Fl = Fl | 0;
	        this.Gh = Gh | 0;
	        this.Gl = Gl | 0;
	        this.Hh = Hh | 0;
	        this.Hl = Hl | 0;
	    }
	    process(view, offset) {
	        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
	        for (let i = 0; i < 16; i++, offset += 4) {
	            SHA512_W_H[i] = view.getUint32(offset);
	            SHA512_W_L[i] = view.getUint32((offset += 4));
	        }
	        for (let i = 16; i < 80; i++) {
	            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
	            const W15h = SHA512_W_H[i - 15] | 0;
	            const W15l = SHA512_W_L[i - 15] | 0;
	            const s0h = u64$1.rotrSH(W15h, W15l, 1) ^ u64$1.rotrSH(W15h, W15l, 8) ^ u64$1.shrSH(W15h, W15l, 7);
	            const s0l = u64$1.rotrSL(W15h, W15l, 1) ^ u64$1.rotrSL(W15h, W15l, 8) ^ u64$1.shrSL(W15h, W15l, 7);
	            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
	            const W2h = SHA512_W_H[i - 2] | 0;
	            const W2l = SHA512_W_L[i - 2] | 0;
	            const s1h = u64$1.rotrSH(W2h, W2l, 19) ^ u64$1.rotrBH(W2h, W2l, 61) ^ u64$1.shrSH(W2h, W2l, 6);
	            const s1l = u64$1.rotrSL(W2h, W2l, 19) ^ u64$1.rotrBL(W2h, W2l, 61) ^ u64$1.shrSL(W2h, W2l, 6);
	            // SHA256_W[i] = s0 + s1 + SHA256_W[i - 7] + SHA256_W[i - 16];
	            const SUMl = u64$1.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
	            const SUMh = u64$1.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
	            SHA512_W_H[i] = SUMh | 0;
	            SHA512_W_L[i] = SUMl | 0;
	        }
	        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
	        // Compression function main loop, 80 rounds
	        for (let i = 0; i < 80; i++) {
	            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
	            const sigma1h = u64$1.rotrSH(Eh, El, 14) ^ u64$1.rotrSH(Eh, El, 18) ^ u64$1.rotrBH(Eh, El, 41);
	            const sigma1l = u64$1.rotrSL(Eh, El, 14) ^ u64$1.rotrSL(Eh, El, 18) ^ u64$1.rotrBL(Eh, El, 41);
	            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
	            const CHIh = (Eh & Fh) ^ (~Eh & Gh);
	            const CHIl = (El & Fl) ^ (~El & Gl);
	            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
	            // prettier-ignore
	            const T1ll = u64$1.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
	            const T1h = u64$1.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
	            const T1l = T1ll | 0;
	            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
	            const sigma0h = u64$1.rotrSH(Ah, Al, 28) ^ u64$1.rotrBH(Ah, Al, 34) ^ u64$1.rotrBH(Ah, Al, 39);
	            const sigma0l = u64$1.rotrSL(Ah, Al, 28) ^ u64$1.rotrBL(Ah, Al, 34) ^ u64$1.rotrBL(Ah, Al, 39);
	            const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
	            const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
	            Hh = Gh | 0;
	            Hl = Gl | 0;
	            Gh = Fh | 0;
	            Gl = Fl | 0;
	            Fh = Eh | 0;
	            Fl = El | 0;
	            ({ h: Eh, l: El } = u64$1.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
	            Dh = Ch | 0;
	            Dl = Cl | 0;
	            Ch = Bh | 0;
	            Cl = Bl | 0;
	            Bh = Ah | 0;
	            Bl = Al | 0;
	            const All = u64$1.add3L(T1l, sigma0l, MAJl);
	            Ah = u64$1.add3H(All, T1h, sigma0h, MAJh);
	            Al = All | 0;
	        }
	        // Add the compressed chunk to the current hash value
	        ({ h: Ah, l: Al } = u64$1.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
	        ({ h: Bh, l: Bl } = u64$1.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
	        ({ h: Ch, l: Cl } = u64$1.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
	        ({ h: Dh, l: Dl } = u64$1.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
	        ({ h: Eh, l: El } = u64$1.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
	        ({ h: Fh, l: Fl } = u64$1.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
	        ({ h: Gh, l: Gl } = u64$1.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
	        ({ h: Hh, l: Hl } = u64$1.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
	        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
	    }
	    roundClean() {
	        SHA512_W_H.fill(0);
	        SHA512_W_L.fill(0);
	    }
	    destroy() {
	        this.buffer.fill(0);
	        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
	    }
	}
	const sha512 = /* @__PURE__ */ wrapConstructor$1(() => new SHA512());

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// 100 lines of code in the file are duplicated from noble-hashes (utils).
	// This is OK: `abstract` directory does not use noble-hashes.
	// User may opt-in into using different hashing library. This way, noble-hashes
	// won't be included into their bundle.
	const _0n$5 = /* @__PURE__ */ BigInt(0);
	const _1n$7 = /* @__PURE__ */ BigInt(1);
	const _2n$5 = /* @__PURE__ */ BigInt(2);
	function isBytes$1(a) {
	    return a instanceof Uint8Array || (ArrayBuffer.isView(a) && a.constructor.name === 'Uint8Array');
	}
	function abytes$1(item) {
	    if (!isBytes$1(item))
	        throw new Error('Uint8Array expected');
	}
	function abool(title, value) {
	    if (typeof value !== 'boolean')
	        throw new Error(title + ' boolean expected, got ' + value);
	}
	// Array where index 0xf0 (240) is mapped to string 'f0'
	const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
	/**
	 * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
	 */
	function bytesToHex(bytes) {
	    abytes$1(bytes);
	    // pre-caching improves the speed 6x
	    let hex = '';
	    for (let i = 0; i < bytes.length; i++) {
	        hex += hexes[bytes[i]];
	    }
	    return hex;
	}
	function numberToHexUnpadded(num) {
	    const hex = num.toString(16);
	    return hex.length & 1 ? '0' + hex : hex;
	}
	function hexToNumber(hex) {
	    if (typeof hex !== 'string')
	        throw new Error('hex string expected, got ' + typeof hex);
	    return hex === '' ? _0n$5 : BigInt('0x' + hex); // Big Endian
	}
	// We use optimized technique to convert hex string to byte array
	const asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
	function asciiToBase16(ch) {
	    if (ch >= asciis._0 && ch <= asciis._9)
	        return ch - asciis._0; // '2' => 50-48
	    if (ch >= asciis.A && ch <= asciis.F)
	        return ch - (asciis.A - 10); // 'B' => 66-(65-10)
	    if (ch >= asciis.a && ch <= asciis.f)
	        return ch - (asciis.a - 10); // 'b' => 98-(97-10)
	    return;
	}
	/**
	 * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
	 */
	function hexToBytes(hex) {
	    if (typeof hex !== 'string')
	        throw new Error('hex string expected, got ' + typeof hex);
	    const hl = hex.length;
	    const al = hl / 2;
	    if (hl % 2)
	        throw new Error('hex string expected, got unpadded hex of length ' + hl);
	    const array = new Uint8Array(al);
	    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
	        const n1 = asciiToBase16(hex.charCodeAt(hi));
	        const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
	        if (n1 === undefined || n2 === undefined) {
	            const char = hex[hi] + hex[hi + 1];
	            throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
	        }
	        array[ai] = n1 * 16 + n2; // multiply first octet, e.g. 'a3' => 10*16+3 => 160 + 3 => 163
	    }
	    return array;
	}
	// BE: Big Endian, LE: Little Endian
	function bytesToNumberBE(bytes) {
	    return hexToNumber(bytesToHex(bytes));
	}
	function bytesToNumberLE(bytes) {
	    abytes$1(bytes);
	    return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
	}
	function numberToBytesBE(n, len) {
	    return hexToBytes(n.toString(16).padStart(len * 2, '0'));
	}
	function numberToBytesLE(n, len) {
	    return numberToBytesBE(n, len).reverse();
	}
	// Unpadded, rarely used
	function numberToVarBytesBE(n) {
	    return hexToBytes(numberToHexUnpadded(n));
	}
	/**
	 * Takes hex string or Uint8Array, converts to Uint8Array.
	 * Validates output length.
	 * Will throw error for other types.
	 * @param title descriptive title for an error e.g. 'private key'
	 * @param hex hex string or Uint8Array
	 * @param expectedLength optional, will compare to result array's length
	 * @returns
	 */
	function ensureBytes(title, hex, expectedLength) {
	    let res;
	    if (typeof hex === 'string') {
	        try {
	            res = hexToBytes(hex);
	        }
	        catch (e) {
	            throw new Error(title + ' must be hex string or Uint8Array, cause: ' + e);
	        }
	    }
	    else if (isBytes$1(hex)) {
	        // Uint8Array.from() instead of hash.slice() because node.js Buffer
	        // is instance of Uint8Array, and its slice() creates **mutable** copy
	        res = Uint8Array.from(hex);
	    }
	    else {
	        throw new Error(title + ' must be hex string or Uint8Array');
	    }
	    const len = res.length;
	    if (typeof expectedLength === 'number' && len !== expectedLength)
	        throw new Error(title + ' of length ' + expectedLength + ' expected, got ' + len);
	    return res;
	}
	/**
	 * Copies several Uint8Arrays into one.
	 */
	function concatBytes(...arrays) {
	    let sum = 0;
	    for (let i = 0; i < arrays.length; i++) {
	        const a = arrays[i];
	        abytes$1(a);
	        sum += a.length;
	    }
	    const res = new Uint8Array(sum);
	    for (let i = 0, pad = 0; i < arrays.length; i++) {
	        const a = arrays[i];
	        res.set(a, pad);
	        pad += a.length;
	    }
	    return res;
	}
	// Compares 2 u8a-s in kinda constant time
	function equalBytes(a, b) {
	    if (a.length !== b.length)
	        return false;
	    let diff = 0;
	    for (let i = 0; i < a.length; i++)
	        diff |= a[i] ^ b[i];
	    return diff === 0;
	}
	/**
	 * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	 */
	function utf8ToBytes$1(str) {
	    if (typeof str !== 'string')
	        throw new Error('string expected');
	    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
	}
	// Is positive bigint
	const isPosBig = (n) => typeof n === 'bigint' && _0n$5 <= n;
	function inRange(n, min, max) {
	    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
	}
	/**
	 * Asserts min <= n < max. NOTE: It's < max and not <= max.
	 * @example
	 * aInRange('x', x, 1n, 256n); // would assume x is in (1n..255n)
	 */
	function aInRange(title, n, min, max) {
	    // Why min <= n < max and not a (min < n < max) OR b (min <= n <= max)?
	    // consider P=256n, min=0n, max=P
	    // - a for min=0 would require -1:          `inRange('x', x, -1n, P)`
	    // - b would commonly require subtraction:  `inRange('x', x, 0n, P - 1n)`
	    // - our way is the cleanest:               `inRange('x', x, 0n, P)
	    if (!inRange(n, min, max))
	        throw new Error('expected valid ' + title + ': ' + min + ' <= n < ' + max + ', got ' + n);
	}
	// Bit operations
	/**
	 * Calculates amount of bits in a bigint.
	 * Same as `n.toString(2).length`
	 */
	function bitLen(n) {
	    let len;
	    for (len = 0; n > _0n$5; n >>= _1n$7, len += 1)
	        ;
	    return len;
	}
	/**
	 * Gets single bit at position.
	 * NOTE: first bit position is 0 (same as arrays)
	 * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
	 */
	function bitGet(n, pos) {
	    return (n >> BigInt(pos)) & _1n$7;
	}
	/**
	 * Sets single bit at position.
	 */
	function bitSet(n, pos, value) {
	    return n | ((value ? _1n$7 : _0n$5) << BigInt(pos));
	}
	/**
	 * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
	 * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
	 */
	const bitMask = (n) => (_2n$5 << BigInt(n - 1)) - _1n$7;
	// DRBG
	const u8n = (data) => new Uint8Array(data); // creates Uint8Array
	const u8fr = (arr) => Uint8Array.from(arr); // another shortcut
	/**
	 * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
	 * @returns function that will call DRBG until 2nd arg returns something meaningful
	 * @example
	 *   const drbg = createHmacDRBG<Key>(32, 32, hmac);
	 *   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
	 */
	function createHmacDrbg(hashLen, qByteLen, hmacFn) {
	    if (typeof hashLen !== 'number' || hashLen < 2)
	        throw new Error('hashLen must be a number');
	    if (typeof qByteLen !== 'number' || qByteLen < 2)
	        throw new Error('qByteLen must be a number');
	    if (typeof hmacFn !== 'function')
	        throw new Error('hmacFn must be a function');
	    // Step B, Step C: set hashLen to 8*ceil(hlen/8)
	    let v = u8n(hashLen); // Minimal non-full-spec HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
	    let k = u8n(hashLen); // Steps B and C of RFC6979 3.2: set hashLen, in our case always same
	    let i = 0; // Iterations counter, will throw when over 1000
	    const reset = () => {
	        v.fill(1);
	        k.fill(0);
	        i = 0;
	    };
	    const h = (...b) => hmacFn(k, v, ...b); // hmac(k)(v, ...values)
	    const reseed = (seed = u8n()) => {
	        // HMAC-DRBG reseed() function. Steps D-G
	        k = h(u8fr([0x00]), seed); // k = hmac(k || v || 0x00 || seed)
	        v = h(); // v = hmac(k || v)
	        if (seed.length === 0)
	            return;
	        k = h(u8fr([0x01]), seed); // k = hmac(k || v || 0x01 || seed)
	        v = h(); // v = hmac(k || v)
	    };
	    const gen = () => {
	        // HMAC-DRBG generate() function
	        if (i++ >= 1000)
	            throw new Error('drbg: tried 1000 values');
	        let len = 0;
	        const out = [];
	        while (len < qByteLen) {
	            v = h();
	            const sl = v.slice();
	            out.push(sl);
	            len += v.length;
	        }
	        return concatBytes(...out);
	    };
	    const genUntil = (seed, pred) => {
	        reset();
	        reseed(seed); // Steps D-G
	        let res = undefined; // Step H: grind until k is in [1..n-1]
	        while (!(res = pred(gen())))
	            reseed();
	        reset();
	        return res;
	    };
	    return genUntil;
	}
	// Validating curves and fields
	const validatorFns = {
	    bigint: (val) => typeof val === 'bigint',
	    function: (val) => typeof val === 'function',
	    boolean: (val) => typeof val === 'boolean',
	    string: (val) => typeof val === 'string',
	    stringOrUint8Array: (val) => typeof val === 'string' || isBytes$1(val),
	    isSafeInteger: (val) => Number.isSafeInteger(val),
	    array: (val) => Array.isArray(val),
	    field: (val, object) => object.Fp.isValid(val),
	    hash: (val) => typeof val === 'function' && Number.isSafeInteger(val.outputLen),
	};
	// type Record<K extends string | number | symbol, T> = { [P in K]: T; }
	function validateObject(object, validators, optValidators = {}) {
	    const checkField = (fieldName, type, isOptional) => {
	        const checkVal = validatorFns[type];
	        if (typeof checkVal !== 'function')
	            throw new Error('invalid validator function');
	        const val = object[fieldName];
	        if (isOptional && val === undefined)
	            return;
	        if (!checkVal(val, object)) {
	            throw new Error('param ' + String(fieldName) + ' is invalid. Expected ' + type + ', got ' + val);
	        }
	    };
	    for (const [fieldName, type] of Object.entries(validators))
	        checkField(fieldName, type, false);
	    for (const [fieldName, type] of Object.entries(optValidators))
	        checkField(fieldName, type, true);
	    return object;
	}
	// validate type tests
	// const o: { a: number; b: number; c: number } = { a: 1, b: 5, c: 6 };
	// const z0 = validateObject(o, { a: 'isSafeInteger' }, { c: 'bigint' }); // Ok!
	// // Should fail type-check
	// const z1 = validateObject(o, { a: 'tmp' }, { c: 'zz' });
	// const z2 = validateObject(o, { a: 'isSafeInteger' }, { c: 'zz' });
	// const z3 = validateObject(o, { test: 'boolean', z: 'bug' });
	// const z4 = validateObject(o, { a: 'boolean', z: 'bug' });
	/**
	 * throws not implemented error
	 */
	const notImplemented = () => {
	    throw new Error('not implemented');
	};
	/**
	 * Memoizes (caches) computation result.
	 * Uses WeakMap: the value is going auto-cleaned by GC after last reference is removed.
	 */
	function memoized(fn) {
	    const map = new WeakMap();
	    return (arg, ...args) => {
	        const val = map.get(arg);
	        if (val !== undefined)
	            return val;
	        const computed = fn(arg, ...args);
	        map.set(arg, computed);
	        return computed;
	    };
	}

	var ut = /*#__PURE__*/Object.freeze({
		__proto__: null,
		aInRange: aInRange,
		abool: abool,
		abytes: abytes$1,
		bitGet: bitGet,
		bitLen: bitLen,
		bitMask: bitMask,
		bitSet: bitSet,
		bytesToHex: bytesToHex,
		bytesToNumberBE: bytesToNumberBE,
		bytesToNumberLE: bytesToNumberLE,
		concatBytes: concatBytes,
		createHmacDrbg: createHmacDrbg,
		ensureBytes: ensureBytes,
		equalBytes: equalBytes,
		hexToBytes: hexToBytes,
		hexToNumber: hexToNumber,
		inRange: inRange,
		isBytes: isBytes$1,
		memoized: memoized,
		notImplemented: notImplemented,
		numberToBytesBE: numberToBytesBE,
		numberToBytesLE: numberToBytesLE,
		numberToHexUnpadded: numberToHexUnpadded,
		numberToVarBytesBE: numberToVarBytesBE,
		utf8ToBytes: utf8ToBytes$1,
		validateObject: validateObject
	});

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// Utilities for modular arithmetics and finite fields
	// prettier-ignore
	const _0n$4 = BigInt(0), _1n$6 = BigInt(1), _2n$4 = /* @__PURE__ */ BigInt(2), _3n$1 = /* @__PURE__ */ BigInt(3);
	// prettier-ignore
	const _4n = /* @__PURE__ */ BigInt(4), _5n$1 = /* @__PURE__ */ BigInt(5), _8n$2 = /* @__PURE__ */ BigInt(8);
	// Calculates a modulo b
	function mod(a, b) {
	    const result = a % b;
	    return result >= _0n$4 ? result : b + result;
	}
	/**
	 * Efficiently raise num to power and do modular division.
	 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
	 * @example
	 * pow(2n, 6n, 11n) // 64n % 11n == 9n
	 */
	// TODO: use field version && remove
	function pow(num, power, modulo) {
	    if (power < _0n$4)
	        throw new Error('invalid exponent, negatives unsupported');
	    if (modulo <= _0n$4)
	        throw new Error('invalid modulus');
	    if (modulo === _1n$6)
	        return _0n$4;
	    let res = _1n$6;
	    while (power > _0n$4) {
	        if (power & _1n$6)
	            res = (res * num) % modulo;
	        num = (num * num) % modulo;
	        power >>= _1n$6;
	    }
	    return res;
	}
	// Does x ^ (2 ^ power) mod p. pow2(30, 4) == 30 ^ (2 ^ 4)
	function pow2(x, power, modulo) {
	    let res = x;
	    while (power-- > _0n$4) {
	        res *= res;
	        res %= modulo;
	    }
	    return res;
	}
	// Inverses number over modulo
	function invert(number, modulo) {
	    if (number === _0n$4)
	        throw new Error('invert: expected non-zero number');
	    if (modulo <= _0n$4)
	        throw new Error('invert: expected positive modulus, got ' + modulo);
	    // Euclidean GCD https://brilliant.org/wiki/extended-euclidean-algorithm/
	    // Fermat's little theorem "CT-like" version inv(n) = n^(m-2) mod m is 30x slower.
	    let a = mod(number, modulo);
	    let b = modulo;
	    // prettier-ignore
	    let x = _0n$4, u = _1n$6;
	    while (a !== _0n$4) {
	        // JIT applies optimization if those two lines follow each other
	        const q = b / a;
	        const r = b % a;
	        const m = x - u * q;
	        // prettier-ignore
	        b = a, a = r, x = u, u = m;
	    }
	    const gcd = b;
	    if (gcd !== _1n$6)
	        throw new Error('invert: does not exist');
	    return mod(x, modulo);
	}
	/**
	 * Tonelli-Shanks square root search algorithm.
	 * 1. https://eprint.iacr.org/2012/685.pdf (page 12)
	 * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
	 * Will start an infinite loop if field order P is not prime.
	 * @param P field order
	 * @returns function that takes field Fp (created from P) and number n
	 */
	function tonelliShanks(P) {
	    // Legendre constant: used to calculate Legendre symbol (a | p),
	    // which denotes the value of a^((p-1)/2) (mod p).
	    // (a | p) ≡ 1    if a is a square (mod p)
	    // (a | p) ≡ -1   if a is not a square (mod p)
	    // (a | p) ≡ 0    if a ≡ 0 (mod p)
	    const legendreC = (P - _1n$6) / _2n$4;
	    let Q, S, Z;
	    // Step 1: By factoring out powers of 2 from p - 1,
	    // find q and s such that p - 1 = q*(2^s) with q odd
	    for (Q = P - _1n$6, S = 0; Q % _2n$4 === _0n$4; Q /= _2n$4, S++)
	        ;
	    // Step 2: Select a non-square z such that (z | p) ≡ -1 and set c ≡ zq
	    for (Z = _2n$4; Z < P && pow(Z, legendreC, P) !== P - _1n$6; Z++) {
	        // Crash instead of infinity loop, we cannot reasonable count until P.
	        if (Z > 1000)
	            throw new Error('Cannot find square root: likely non-prime P');
	    }
	    // Fast-path
	    if (S === 1) {
	        const p1div4 = (P + _1n$6) / _4n;
	        return function tonelliFast(Fp, n) {
	            const root = Fp.pow(n, p1div4);
	            if (!Fp.eql(Fp.sqr(root), n))
	                throw new Error('Cannot find square root');
	            return root;
	        };
	    }
	    // Slow-path
	    const Q1div2 = (Q + _1n$6) / _2n$4;
	    return function tonelliSlow(Fp, n) {
	        // Step 0: Check that n is indeed a square: (n | p) should not be ≡ -1
	        if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE))
	            throw new Error('Cannot find square root');
	        let r = S;
	        // TODO: will fail at Fp2/etc
	        let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q); // will update both x and b
	        let x = Fp.pow(n, Q1div2); // first guess at the square root
	        let b = Fp.pow(n, Q); // first guess at the fudge factor
	        while (!Fp.eql(b, Fp.ONE)) {
	            if (Fp.eql(b, Fp.ZERO))
	                return Fp.ZERO; // https://en.wikipedia.org/wiki/Tonelli%E2%80%93Shanks_algorithm (4. If t = 0, return r = 0)
	            // Find m such b^(2^m)==1
	            let m = 1;
	            for (let t2 = Fp.sqr(b); m < r; m++) {
	                if (Fp.eql(t2, Fp.ONE))
	                    break;
	                t2 = Fp.sqr(t2); // t2 *= t2
	            }
	            // NOTE: r-m-1 can be bigger than 32, need to convert to bigint before shift, otherwise there will be overflow
	            const ge = Fp.pow(g, _1n$6 << BigInt(r - m - 1)); // ge = 2^(r-m-1)
	            g = Fp.sqr(ge); // g = ge * ge
	            x = Fp.mul(x, ge); // x *= ge
	            b = Fp.mul(b, g); // b *= g
	            r = m;
	        }
	        return x;
	    };
	}
	function FpSqrt(P) {
	    // NOTE: different algorithms can give different roots, it is up to user to decide which one they want.
	    // For example there is FpSqrtOdd/FpSqrtEven to choice root based on oddness (used for hash-to-curve).
	    // P ≡ 3 (mod 4)
	    // √n = n^((P+1)/4)
	    if (P % _4n === _3n$1) {
	        // Not all roots possible!
	        // const ORDER =
	        //   0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
	        // const NUM = 72057594037927816n;
	        const p1div4 = (P + _1n$6) / _4n;
	        return function sqrt3mod4(Fp, n) {
	            const root = Fp.pow(n, p1div4);
	            // Throw if root**2 != n
	            if (!Fp.eql(Fp.sqr(root), n))
	                throw new Error('Cannot find square root');
	            return root;
	        };
	    }
	    // Atkin algorithm for q ≡ 5 (mod 8), https://eprint.iacr.org/2012/685.pdf (page 10)
	    if (P % _8n$2 === _5n$1) {
	        const c1 = (P - _5n$1) / _8n$2;
	        return function sqrt5mod8(Fp, n) {
	            const n2 = Fp.mul(n, _2n$4);
	            const v = Fp.pow(n2, c1);
	            const nv = Fp.mul(n, v);
	            const i = Fp.mul(Fp.mul(nv, _2n$4), v);
	            const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
	            if (!Fp.eql(Fp.sqr(root), n))
	                throw new Error('Cannot find square root');
	            return root;
	        };
	    }
	    // Other cases: Tonelli-Shanks algorithm
	    return tonelliShanks(P);
	}
	// Little-endian check for first LE bit (last BE bit);
	const isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n$6) === _1n$6;
	// prettier-ignore
	const FIELD_FIELDS = [
	    'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
	    'eql', 'add', 'sub', 'mul', 'pow', 'div',
	    'addN', 'subN', 'mulN', 'sqrN'
	];
	function validateField(field) {
	    const initial = {
	        ORDER: 'bigint',
	        MASK: 'bigint',
	        BYTES: 'isSafeInteger',
	        BITS: 'isSafeInteger',
	    };
	    const opts = FIELD_FIELDS.reduce((map, val) => {
	        map[val] = 'function';
	        return map;
	    }, initial);
	    return validateObject(field, opts);
	}
	// Generic field functions
	/**
	 * Same as `pow` but for Fp: non-constant-time.
	 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
	 */
	function FpPow(f, num, power) {
	    // Should have same speed as pow for bigints
	    // TODO: benchmark!
	    if (power < _0n$4)
	        throw new Error('invalid exponent, negatives unsupported');
	    if (power === _0n$4)
	        return f.ONE;
	    if (power === _1n$6)
	        return num;
	    let p = f.ONE;
	    let d = num;
	    while (power > _0n$4) {
	        if (power & _1n$6)
	            p = f.mul(p, d);
	        d = f.sqr(d);
	        power >>= _1n$6;
	    }
	    return p;
	}
	/**
	 * Efficiently invert an array of Field elements.
	 * `inv(0)` will return `undefined` here: make sure to throw an error.
	 */
	function FpInvertBatch(f, nums) {
	    const tmp = new Array(nums.length);
	    // Walk from first to last, multiply them by each other MOD p
	    const lastMultiplied = nums.reduce((acc, num, i) => {
	        if (f.is0(num))
	            return acc;
	        tmp[i] = acc;
	        return f.mul(acc, num);
	    }, f.ONE);
	    // Invert last element
	    const inverted = f.inv(lastMultiplied);
	    // Walk from last to first, multiply them by inverted each other MOD p
	    nums.reduceRight((acc, num, i) => {
	        if (f.is0(num))
	            return acc;
	        tmp[i] = f.mul(acc, tmp[i]);
	        return f.mul(acc, num);
	    }, inverted);
	    return tmp;
	}
	// CURVE.n lengths
	function nLength(n, nBitLength) {
	    // Bit size, byte size of CURVE.n
	    const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
	    const nByteLength = Math.ceil(_nBitLength / 8);
	    return { nBitLength: _nBitLength, nByteLength };
	}
	/**
	 * Initializes a finite field over prime. **Non-primes are not supported.**
	 * Do not init in loop: slow. Very fragile: always run a benchmark on a change.
	 * Major performance optimizations:
	 * * a) denormalized operations like mulN instead of mul
	 * * b) same object shape: never add or remove keys
	 * * c) Object.freeze
	 * NOTE: operations don't check 'isValid' for all elements for performance reasons,
	 * it is caller responsibility to check this.
	 * This is low-level code, please make sure you know what you doing.
	 * @param ORDER prime positive bigint
	 * @param bitLen how many bits the field consumes
	 * @param isLE (def: false) if encoding / decoding should be in little-endian
	 * @param redef optional faster redefinitions of sqrt and other methods
	 */
	function Field(ORDER, bitLen, isLE = false, redef = {}) {
	    if (ORDER <= _0n$4)
	        throw new Error('invalid field: expected ORDER > 0, got ' + ORDER);
	    const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
	    if (BYTES > 2048)
	        throw new Error('invalid field: expected ORDER of <= 2048 bytes');
	    let sqrtP; // cached sqrtP
	    const f = Object.freeze({
	        ORDER,
	        BITS,
	        BYTES,
	        MASK: bitMask(BITS),
	        ZERO: _0n$4,
	        ONE: _1n$6,
	        create: (num) => mod(num, ORDER),
	        isValid: (num) => {
	            if (typeof num !== 'bigint')
	                throw new Error('invalid field element: expected bigint, got ' + typeof num);
	            return _0n$4 <= num && num < ORDER; // 0 is valid element, but it's not invertible
	        },
	        is0: (num) => num === _0n$4,
	        isOdd: (num) => (num & _1n$6) === _1n$6,
	        neg: (num) => mod(-num, ORDER),
	        eql: (lhs, rhs) => lhs === rhs,
	        sqr: (num) => mod(num * num, ORDER),
	        add: (lhs, rhs) => mod(lhs + rhs, ORDER),
	        sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
	        mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
	        pow: (num, power) => FpPow(f, num, power),
	        div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
	        // Same as above, but doesn't normalize
	        sqrN: (num) => num * num,
	        addN: (lhs, rhs) => lhs + rhs,
	        subN: (lhs, rhs) => lhs - rhs,
	        mulN: (lhs, rhs) => lhs * rhs,
	        inv: (num) => invert(num, ORDER),
	        sqrt: redef.sqrt ||
	            ((n) => {
	                if (!sqrtP)
	                    sqrtP = FpSqrt(ORDER);
	                return sqrtP(f, n);
	            }),
	        invertBatch: (lst) => FpInvertBatch(f, lst),
	        // TODO: do we really need constant cmov?
	        // We don't have const-time bigints anyway, so probably will be not very useful
	        cmov: (a, b, c) => (c ? b : a),
	        toBytes: (num) => (isLE ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES)),
	        fromBytes: (bytes) => {
	            if (bytes.length !== BYTES)
	                throw new Error('Field.fromBytes: expected ' + BYTES + ' bytes, got ' + bytes.length);
	            return isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
	        },
	    });
	    return Object.freeze(f);
	}
	/**
	 * Returns total number of bytes consumed by the field element.
	 * For example, 32 bytes for usual 256-bit weierstrass curve.
	 * @param fieldOrder number of field elements, usually CURVE.n
	 * @returns byte length of field
	 */
	function getFieldBytesLength(fieldOrder) {
	    if (typeof fieldOrder !== 'bigint')
	        throw new Error('field order must be bigint');
	    const bitLength = fieldOrder.toString(2).length;
	    return Math.ceil(bitLength / 8);
	}
	/**
	 * Returns minimal amount of bytes that can be safely reduced
	 * by field order.
	 * Should be 2^-128 for 128-bit curve such as P256.
	 * @param fieldOrder number of field elements, usually CURVE.n
	 * @returns byte length of target hash
	 */
	function getMinHashLength(fieldOrder) {
	    const length = getFieldBytesLength(fieldOrder);
	    return length + Math.ceil(length / 2);
	}
	/**
	 * "Constant-time" private key generation utility.
	 * Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
	 * and convert them into private scalar, with the modulo bias being negligible.
	 * Needs at least 48 bytes of input for 32-byte private key.
	 * https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
	 * FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
	 * RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
	 * @param hash hash output from SHA3 or a similar function
	 * @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
	 * @param isLE interpret hash bytes as LE num
	 * @returns valid private scalar
	 */
	function mapHashToField(key, fieldOrder, isLE = false) {
	    const len = key.length;
	    const fieldLen = getFieldBytesLength(fieldOrder);
	    const minLen = getMinHashLength(fieldOrder);
	    // No small numbers: need to understand bias story. No huge numbers: easier to detect JS timings.
	    if (len < 16 || len < minLen || len > 1024)
	        throw new Error('expected ' + minLen + '-1024 bytes of input, got ' + len);
	    const num = isLE ? bytesToNumberBE(key) : bytesToNumberLE(key);
	    // `mod(x, 11)` can sometimes produce 0. `mod(x, 10) + 1` is the same, but no 0
	    const reduced = mod(num, fieldOrder - _1n$6) + _1n$6;
	    return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
	}

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// Abelian group utilities
	const _0n$3 = BigInt(0);
	const _1n$5 = BigInt(1);
	function constTimeNegate(condition, item) {
	    const neg = item.negate();
	    return condition ? neg : item;
	}
	function validateW(W, bits) {
	    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
	        throw new Error('invalid window size, expected [1..' + bits + '], got W=' + W);
	}
	function calcWOpts(W, bits) {
	    validateW(W, bits);
	    const windows = Math.ceil(bits / W) + 1; // +1, because
	    const windowSize = 2 ** (W - 1); // -1 because we skip zero
	    return { windows, windowSize };
	}
	function validateMSMPoints(points, c) {
	    if (!Array.isArray(points))
	        throw new Error('array expected');
	    points.forEach((p, i) => {
	        if (!(p instanceof c))
	            throw new Error('invalid point at index ' + i);
	    });
	}
	function validateMSMScalars(scalars, field) {
	    if (!Array.isArray(scalars))
	        throw new Error('array of scalars expected');
	    scalars.forEach((s, i) => {
	        if (!field.isValid(s))
	            throw new Error('invalid scalar at index ' + i);
	    });
	}
	// Since points in different groups cannot be equal (different object constructor),
	// we can have single place to store precomputes
	const pointPrecomputes = new WeakMap();
	const pointWindowSizes = new WeakMap(); // This allows use make points immutable (nothing changes inside)
	function getW(P) {
	    return pointWindowSizes.get(P) || 1;
	}
	// Elliptic curve multiplication of Point by scalar. Fragile.
	// Scalars should always be less than curve order: this should be checked inside of a curve itself.
	// Creates precomputation tables for fast multiplication:
	// - private scalar is split by fixed size windows of W bits
	// - every window point is collected from window's table & added to accumulator
	// - since windows are different, same point inside tables won't be accessed more than once per calc
	// - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
	// - +1 window is neccessary for wNAF
	// - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
	// TODO: Research returning 2d JS array of windows, instead of a single window. This would allow
	// windows to be in different memory locations
	function wNAF(c, bits) {
	    return {
	        constTimeNegate,
	        hasPrecomputes(elm) {
	            return getW(elm) !== 1;
	        },
	        // non-const time multiplication ladder
	        unsafeLadder(elm, n, p = c.ZERO) {
	            let d = elm;
	            while (n > _0n$3) {
	                if (n & _1n$5)
	                    p = p.add(d);
	                d = d.double();
	                n >>= _1n$5;
	            }
	            return p;
	        },
	        /**
	         * Creates a wNAF precomputation window. Used for caching.
	         * Default window size is set by `utils.precompute()` and is equal to 8.
	         * Number of precomputed points depends on the curve size:
	         * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
	         * - 𝑊 is the window size
	         * - 𝑛 is the bitlength of the curve order.
	         * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
	         * @param elm Point instance
	         * @param W window size
	         * @returns precomputed point tables flattened to a single array
	         */
	        precomputeWindow(elm, W) {
	            const { windows, windowSize } = calcWOpts(W, bits);
	            const points = [];
	            let p = elm;
	            let base = p;
	            for (let window = 0; window < windows; window++) {
	                base = p;
	                points.push(base);
	                // =1, because we skip zero
	                for (let i = 1; i < windowSize; i++) {
	                    base = base.add(p);
	                    points.push(base);
	                }
	                p = base.double();
	            }
	            return points;
	        },
	        /**
	         * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
	         * @param W window size
	         * @param precomputes precomputed tables
	         * @param n scalar (we don't check here, but should be less than curve order)
	         * @returns real and fake (for const-time) points
	         */
	        wNAF(W, precomputes, n) {
	            // TODO: maybe check that scalar is less than group order? wNAF behavious is undefined otherwise
	            // But need to carefully remove other checks before wNAF. ORDER == bits here
	            const { windows, windowSize } = calcWOpts(W, bits);
	            let p = c.ZERO;
	            let f = c.BASE;
	            const mask = BigInt(2 ** W - 1); // Create mask with W ones: 0b1111 for W=4 etc.
	            const maxNumber = 2 ** W;
	            const shiftBy = BigInt(W);
	            for (let window = 0; window < windows; window++) {
	                const offset = window * windowSize;
	                // Extract W bits.
	                let wbits = Number(n & mask);
	                // Shift number by W bits.
	                n >>= shiftBy;
	                // If the bits are bigger than max size, we'll split those.
	                // +224 => 256 - 32
	                if (wbits > windowSize) {
	                    wbits -= maxNumber;
	                    n += _1n$5;
	                }
	                // This code was first written with assumption that 'f' and 'p' will never be infinity point:
	                // since each addition is multiplied by 2 ** W, it cannot cancel each other. However,
	                // there is negate now: it is possible that negated element from low value
	                // would be the same as high element, which will create carry into next window.
	                // It's not obvious how this can fail, but still worth investigating later.
	                // Check if we're onto Zero point.
	                // Add random point inside current window to f.
	                const offset1 = offset;
	                const offset2 = offset + Math.abs(wbits) - 1; // -1 because we skip zero
	                const cond1 = window % 2 !== 0;
	                const cond2 = wbits < 0;
	                if (wbits === 0) {
	                    // The most important part for const-time getPublicKey
	                    f = f.add(constTimeNegate(cond1, precomputes[offset1]));
	                }
	                else {
	                    p = p.add(constTimeNegate(cond2, precomputes[offset2]));
	                }
	            }
	            // JIT-compiler should not eliminate f here, since it will later be used in normalizeZ()
	            // Even if the variable is still unused, there are some checks which will
	            // throw an exception, so compiler needs to prove they won't happen, which is hard.
	            // At this point there is a way to F be infinity-point even if p is not,
	            // which makes it less const-time: around 1 bigint multiply.
	            return { p, f };
	        },
	        /**
	         * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
	         * @param W window size
	         * @param precomputes precomputed tables
	         * @param n scalar (we don't check here, but should be less than curve order)
	         * @param acc accumulator point to add result of multiplication
	         * @returns point
	         */
	        wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
	            const { windows, windowSize } = calcWOpts(W, bits);
	            const mask = BigInt(2 ** W - 1); // Create mask with W ones: 0b1111 for W=4 etc.
	            const maxNumber = 2 ** W;
	            const shiftBy = BigInt(W);
	            for (let window = 0; window < windows; window++) {
	                const offset = window * windowSize;
	                if (n === _0n$3)
	                    break; // No need to go over empty scalar
	                // Extract W bits.
	                let wbits = Number(n & mask);
	                // Shift number by W bits.
	                n >>= shiftBy;
	                // If the bits are bigger than max size, we'll split those.
	                // +224 => 256 - 32
	                if (wbits > windowSize) {
	                    wbits -= maxNumber;
	                    n += _1n$5;
	                }
	                if (wbits === 0)
	                    continue;
	                let curr = precomputes[offset + Math.abs(wbits) - 1]; // -1 because we skip zero
	                if (wbits < 0)
	                    curr = curr.negate();
	                // NOTE: by re-using acc, we can save a lot of additions in case of MSM
	                acc = acc.add(curr);
	            }
	            return acc;
	        },
	        getPrecomputes(W, P, transform) {
	            // Calculate precomputes on a first run, reuse them after
	            let comp = pointPrecomputes.get(P);
	            if (!comp) {
	                comp = this.precomputeWindow(P, W);
	                if (W !== 1)
	                    pointPrecomputes.set(P, transform(comp));
	            }
	            return comp;
	        },
	        wNAFCached(P, n, transform) {
	            const W = getW(P);
	            return this.wNAF(W, this.getPrecomputes(W, P, transform), n);
	        },
	        wNAFCachedUnsafe(P, n, transform, prev) {
	            const W = getW(P);
	            if (W === 1)
	                return this.unsafeLadder(P, n, prev); // For W=1 ladder is ~x2 faster
	            return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform), n, prev);
	        },
	        // We calculate precomputes for elliptic curve point multiplication
	        // using windowed method. This specifies window size and
	        // stores precomputed values. Usually only base point would be precomputed.
	        setWindowSize(P, W) {
	            validateW(W, bits);
	            pointWindowSizes.set(P, W);
	            pointPrecomputes.delete(P);
	        },
	    };
	}
	/**
	 * Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
	 * 30x faster vs naive addition on L=4096, 10x faster with precomputes.
	 * For N=254bit, L=1, it does: 1024 ADD + 254 DBL. For L=5: 1536 ADD + 254 DBL.
	 * Algorithmically constant-time (for same L), even when 1 point + scalar, or when scalar = 0.
	 * @param c Curve Point constructor
	 * @param fieldN field over CURVE.N - important that it's not over CURVE.P
	 * @param points array of L curve points
	 * @param scalars array of L scalars (aka private keys / bigints)
	 */
	function pippenger(c, fieldN, points, scalars) {
	    // If we split scalars by some window (let's say 8 bits), every chunk will only
	    // take 256 buckets even if there are 4096 scalars, also re-uses double.
	    // TODO:
	    // - https://eprint.iacr.org/2024/750.pdf
	    // - https://tches.iacr.org/index.php/TCHES/article/view/10287
	    // 0 is accepted in scalars
	    validateMSMPoints(points, c);
	    validateMSMScalars(scalars, fieldN);
	    if (points.length !== scalars.length)
	        throw new Error('arrays of points and scalars must have equal length');
	    const zero = c.ZERO;
	    const wbits = bitLen(BigInt(points.length));
	    const windowSize = wbits > 12 ? wbits - 3 : wbits > 4 ? wbits - 2 : wbits ? 2 : 1; // in bits
	    const MASK = (1 << windowSize) - 1;
	    const buckets = new Array(MASK + 1).fill(zero); // +1 for zero array
	    const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
	    let sum = zero;
	    for (let i = lastBits; i >= 0; i -= windowSize) {
	        buckets.fill(zero);
	        for (let j = 0; j < scalars.length; j++) {
	            const scalar = scalars[j];
	            const wbits = Number((scalar >> BigInt(i)) & BigInt(MASK));
	            buckets[wbits] = buckets[wbits].add(points[j]);
	        }
	        let resI = zero; // not using this will do small speed-up, but will lose ct
	        // Skip first bucket, because it is zero
	        for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
	            sumI = sumI.add(buckets[j]);
	            resI = resI.add(sumI);
	        }
	        sum = sum.add(resI);
	        if (i !== 0)
	            for (let j = 0; j < windowSize; j++)
	                sum = sum.double();
	    }
	    return sum;
	}
	function validateBasic(curve) {
	    validateField(curve.Fp);
	    validateObject(curve, {
	        n: 'bigint',
	        h: 'bigint',
	        Gx: 'field',
	        Gy: 'field',
	    }, {
	        nBitLength: 'isSafeInteger',
	        nByteLength: 'isSafeInteger',
	    });
	    // Set defaults
	    return Object.freeze({
	        ...nLength(curve.n, curve.nBitLength),
	        ...curve,
	        ...{ p: curve.Fp.ORDER },
	    });
	}

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// Twisted Edwards curve. The formula is: ax² + y² = 1 + dx²y²
	// Be friendly to bad ECMAScript parsers by not using bigint literals
	// prettier-ignore
	const _0n$2 = BigInt(0), _1n$4 = BigInt(1), _2n$3 = BigInt(2), _8n$1 = BigInt(8);
	// verification rule is either zip215 or rfc8032 / nist186-5. Consult fromHex:
	const VERIFY_DEFAULT = { zip215: true };
	function validateOpts$1(curve) {
	    const opts = validateBasic(curve);
	    validateObject(curve, {
	        hash: 'function',
	        a: 'bigint',
	        d: 'bigint',
	        randomBytes: 'function',
	    }, {
	        adjustScalarBytes: 'function',
	        domain: 'function',
	        uvRatio: 'function',
	        mapToCurve: 'function',
	    });
	    // Set defaults
	    return Object.freeze({ ...opts });
	}
	/**
	 * Creates Twisted Edwards curve with EdDSA signatures.
	 * @example
	 * import { Field } from '@noble/curves/abstract/modular';
	 * // Before that, define BigInt-s: a, d, p, n, Gx, Gy, h
	 * const curve = twistedEdwards({ a, d, Fp: Field(p), n, Gx, Gy, h })
	 */
	function twistedEdwards(curveDef) {
	    const CURVE = validateOpts$1(curveDef);
	    const { Fp, n: CURVE_ORDER, prehash: prehash, hash: cHash, randomBytes, nByteLength, h: cofactor, } = CURVE;
	    // Important:
	    // There are some places where Fp.BYTES is used instead of nByteLength.
	    // So far, everything has been tested with curves of Fp.BYTES == nByteLength.
	    // TODO: test and find curves which behave otherwise.
	    const MASK = _2n$3 << (BigInt(nByteLength * 8) - _1n$4);
	    const modP = Fp.create; // Function overrides
	    const Fn = Field(CURVE.n, CURVE.nBitLength);
	    // sqrt(u/v)
	    const uvRatio = CURVE.uvRatio ||
	        ((u, v) => {
	            try {
	                return { isValid: true, value: Fp.sqrt(u * Fp.inv(v)) };
	            }
	            catch (e) {
	                return { isValid: false, value: _0n$2 };
	            }
	        });
	    const adjustScalarBytes = CURVE.adjustScalarBytes || ((bytes) => bytes); // NOOP
	    const domain = CURVE.domain ||
	        ((data, ctx, phflag) => {
	            abool('phflag', phflag);
	            if (ctx.length || phflag)
	                throw new Error('Contexts/pre-hash are not supported');
	            return data;
	        }); // NOOP
	    // 0 <= n < MASK
	    // Coordinates larger than Fp.ORDER are allowed for zip215
	    function aCoordinate(title, n) {
	        aInRange('coordinate ' + title, n, _0n$2, MASK);
	    }
	    function assertPoint(other) {
	        if (!(other instanceof Point))
	            throw new Error('ExtendedPoint expected');
	    }
	    // Converts Extended point to default (x, y) coordinates.
	    // Can accept precomputed Z^-1 - for example, from invertBatch.
	    const toAffineMemo = memoized((p, iz) => {
	        const { ex: x, ey: y, ez: z } = p;
	        const is0 = p.is0();
	        if (iz == null)
	            iz = is0 ? _8n$1 : Fp.inv(z); // 8 was chosen arbitrarily
	        const ax = modP(x * iz);
	        const ay = modP(y * iz);
	        const zz = modP(z * iz);
	        if (is0)
	            return { x: _0n$2, y: _1n$4 };
	        if (zz !== _1n$4)
	            throw new Error('invZ was invalid');
	        return { x: ax, y: ay };
	    });
	    const assertValidMemo = memoized((p) => {
	        const { a, d } = CURVE;
	        if (p.is0())
	            throw new Error('bad point: ZERO'); // TODO: optimize, with vars below?
	        // Equation in affine coordinates: ax² + y² = 1 + dx²y²
	        // Equation in projective coordinates (X/Z, Y/Z, Z):  (aX² + Y²)Z² = Z⁴ + dX²Y²
	        const { ex: X, ey: Y, ez: Z, et: T } = p;
	        const X2 = modP(X * X); // X²
	        const Y2 = modP(Y * Y); // Y²
	        const Z2 = modP(Z * Z); // Z²
	        const Z4 = modP(Z2 * Z2); // Z⁴
	        const aX2 = modP(X2 * a); // aX²
	        const left = modP(Z2 * modP(aX2 + Y2)); // (aX² + Y²)Z²
	        const right = modP(Z4 + modP(d * modP(X2 * Y2))); // Z⁴ + dX²Y²
	        if (left !== right)
	            throw new Error('bad point: equation left != right (1)');
	        // In Extended coordinates we also have T, which is x*y=T/Z: check X*Y == Z*T
	        const XY = modP(X * Y);
	        const ZT = modP(Z * T);
	        if (XY !== ZT)
	            throw new Error('bad point: equation left != right (2)');
	        return true;
	    });
	    // Extended Point works in extended coordinates: (x, y, z, t) ∋ (x=x/z, y=y/z, t=xy).
	    // https://en.wikipedia.org/wiki/Twisted_Edwards_curve#Extended_coordinates
	    class Point {
	        constructor(ex, ey, ez, et) {
	            this.ex = ex;
	            this.ey = ey;
	            this.ez = ez;
	            this.et = et;
	            aCoordinate('x', ex);
	            aCoordinate('y', ey);
	            aCoordinate('z', ez);
	            aCoordinate('t', et);
	            Object.freeze(this);
	        }
	        get x() {
	            return this.toAffine().x;
	        }
	        get y() {
	            return this.toAffine().y;
	        }
	        static fromAffine(p) {
	            if (p instanceof Point)
	                throw new Error('extended point not allowed');
	            const { x, y } = p || {};
	            aCoordinate('x', x);
	            aCoordinate('y', y);
	            return new Point(x, y, _1n$4, modP(x * y));
	        }
	        static normalizeZ(points) {
	            const toInv = Fp.invertBatch(points.map((p) => p.ez));
	            return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
	        }
	        // Multiscalar Multiplication
	        static msm(points, scalars) {
	            return pippenger(Point, Fn, points, scalars);
	        }
	        // "Private method", don't use it directly
	        _setWindowSize(windowSize) {
	            wnaf.setWindowSize(this, windowSize);
	        }
	        // Not required for fromHex(), which always creates valid points.
	        // Could be useful for fromAffine().
	        assertValidity() {
	            assertValidMemo(this);
	        }
	        // Compare one point to another.
	        equals(other) {
	            assertPoint(other);
	            const { ex: X1, ey: Y1, ez: Z1 } = this;
	            const { ex: X2, ey: Y2, ez: Z2 } = other;
	            const X1Z2 = modP(X1 * Z2);
	            const X2Z1 = modP(X2 * Z1);
	            const Y1Z2 = modP(Y1 * Z2);
	            const Y2Z1 = modP(Y2 * Z1);
	            return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
	        }
	        is0() {
	            return this.equals(Point.ZERO);
	        }
	        negate() {
	            // Flips point sign to a negative one (-x, y in affine coords)
	            return new Point(modP(-this.ex), this.ey, this.ez, modP(-this.et));
	        }
	        // Fast algo for doubling Extended Point.
	        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
	        // Cost: 4M + 4S + 1*a + 6add + 1*2.
	        double() {
	            const { a } = CURVE;
	            const { ex: X1, ey: Y1, ez: Z1 } = this;
	            const A = modP(X1 * X1); // A = X12
	            const B = modP(Y1 * Y1); // B = Y12
	            const C = modP(_2n$3 * modP(Z1 * Z1)); // C = 2*Z12
	            const D = modP(a * A); // D = a*A
	            const x1y1 = X1 + Y1;
	            const E = modP(modP(x1y1 * x1y1) - A - B); // E = (X1+Y1)2-A-B
	            const G = D + B; // G = D+B
	            const F = G - C; // F = G-C
	            const H = D - B; // H = D-B
	            const X3 = modP(E * F); // X3 = E*F
	            const Y3 = modP(G * H); // Y3 = G*H
	            const T3 = modP(E * H); // T3 = E*H
	            const Z3 = modP(F * G); // Z3 = F*G
	            return new Point(X3, Y3, Z3, T3);
	        }
	        // Fast algo for adding 2 Extended Points.
	        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
	        // Cost: 9M + 1*a + 1*d + 7add.
	        add(other) {
	            assertPoint(other);
	            const { a, d } = CURVE;
	            const { ex: X1, ey: Y1, ez: Z1, et: T1 } = this;
	            const { ex: X2, ey: Y2, ez: Z2, et: T2 } = other;
	            // Faster algo for adding 2 Extended Points when curve's a=-1.
	            // http://hyperelliptic.org/EFD/g1p/auto-twisted-extended-1.html#addition-add-2008-hwcd-4
	            // Cost: 8M + 8add + 2*2.
	            // Note: It does not check whether the `other` point is valid.
	            if (a === BigInt(-1)) {
	                const A = modP((Y1 - X1) * (Y2 + X2));
	                const B = modP((Y1 + X1) * (Y2 - X2));
	                const F = modP(B - A);
	                if (F === _0n$2)
	                    return this.double(); // Same point. Tests say it doesn't affect timing
	                const C = modP(Z1 * _2n$3 * T2);
	                const D = modP(T1 * _2n$3 * Z2);
	                const E = D + C;
	                const G = B + A;
	                const H = D - C;
	                const X3 = modP(E * F);
	                const Y3 = modP(G * H);
	                const T3 = modP(E * H);
	                const Z3 = modP(F * G);
	                return new Point(X3, Y3, Z3, T3);
	            }
	            const A = modP(X1 * X2); // A = X1*X2
	            const B = modP(Y1 * Y2); // B = Y1*Y2
	            const C = modP(T1 * d * T2); // C = T1*d*T2
	            const D = modP(Z1 * Z2); // D = Z1*Z2
	            const E = modP((X1 + Y1) * (X2 + Y2) - A - B); // E = (X1+Y1)*(X2+Y2)-A-B
	            const F = D - C; // F = D-C
	            const G = D + C; // G = D+C
	            const H = modP(B - a * A); // H = B-a*A
	            const X3 = modP(E * F); // X3 = E*F
	            const Y3 = modP(G * H); // Y3 = G*H
	            const T3 = modP(E * H); // T3 = E*H
	            const Z3 = modP(F * G); // Z3 = F*G
	            return new Point(X3, Y3, Z3, T3);
	        }
	        subtract(other) {
	            return this.add(other.negate());
	        }
	        wNAF(n) {
	            return wnaf.wNAFCached(this, n, Point.normalizeZ);
	        }
	        // Constant-time multiplication.
	        multiply(scalar) {
	            const n = scalar;
	            aInRange('scalar', n, _1n$4, CURVE_ORDER); // 1 <= scalar < L
	            const { p, f } = this.wNAF(n);
	            return Point.normalizeZ([p, f])[0];
	        }
	        // Non-constant-time multiplication. Uses double-and-add algorithm.
	        // It's faster, but should only be used when you don't care about
	        // an exposed private key e.g. sig verification.
	        // Does NOT allow scalars higher than CURVE.n.
	        // Accepts optional accumulator to merge with multiply (important for sparse scalars)
	        multiplyUnsafe(scalar, acc = Point.ZERO) {
	            const n = scalar;
	            aInRange('scalar', n, _0n$2, CURVE_ORDER); // 0 <= scalar < L
	            if (n === _0n$2)
	                return I;
	            if (this.is0() || n === _1n$4)
	                return this;
	            return wnaf.wNAFCachedUnsafe(this, n, Point.normalizeZ, acc);
	        }
	        // Checks if point is of small order.
	        // If you add something to small order point, you will have "dirty"
	        // point with torsion component.
	        // Multiplies point by cofactor and checks if the result is 0.
	        isSmallOrder() {
	            return this.multiplyUnsafe(cofactor).is0();
	        }
	        // Multiplies point by curve order and checks if the result is 0.
	        // Returns `false` is the point is dirty.
	        isTorsionFree() {
	            return wnaf.unsafeLadder(this, CURVE_ORDER).is0();
	        }
	        // Converts Extended point to default (x, y) coordinates.
	        // Can accept precomputed Z^-1 - for example, from invertBatch.
	        toAffine(iz) {
	            return toAffineMemo(this, iz);
	        }
	        clearCofactor() {
	            const { h: cofactor } = CURVE;
	            if (cofactor === _1n$4)
	                return this;
	            return this.multiplyUnsafe(cofactor);
	        }
	        // Converts hash string or Uint8Array to Point.
	        // Uses algo from RFC8032 5.1.3.
	        static fromHex(hex, zip215 = false) {
	            const { d, a } = CURVE;
	            const len = Fp.BYTES;
	            hex = ensureBytes('pointHex', hex, len); // copy hex to a new array
	            abool('zip215', zip215);
	            const normed = hex.slice(); // copy again, we'll manipulate it
	            const lastByte = hex[len - 1]; // select last byte
	            normed[len - 1] = lastByte & ~0x80; // clear last bit
	            const y = bytesToNumberLE(normed);
	            // zip215=true is good for consensus-critical apps. =false follows RFC8032 / NIST186-5.
	            // RFC8032 prohibits >= p, but ZIP215 doesn't
	            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
	            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
	            const max = zip215 ? MASK : Fp.ORDER;
	            aInRange('pointHex.y', y, _0n$2, max);
	            // Ed25519: x² = (y²-1)/(dy²+1) mod p. Ed448: x² = (y²-1)/(dy²-1) mod p. Generic case:
	            // ax²+y²=1+dx²y² => y²-1=dx²y²-ax² => y²-1=x²(dy²-a) => x²=(y²-1)/(dy²-a)
	            const y2 = modP(y * y); // denominator is always non-0 mod p.
	            const u = modP(y2 - _1n$4); // u = y² - 1
	            const v = modP(d * y2 - a); // v = d y² + 1.
	            let { isValid, value: x } = uvRatio(u, v); // √(u/v)
	            if (!isValid)
	                throw new Error('Point.fromHex: invalid y coordinate');
	            const isXOdd = (x & _1n$4) === _1n$4; // There are 2 square roots. Use x_0 bit to select proper
	            const isLastByteOdd = (lastByte & 0x80) !== 0; // x_0, last bit
	            if (!zip215 && x === _0n$2 && isLastByteOdd)
	                // if x=0 and x_0 = 1, fail
	                throw new Error('Point.fromHex: x=0 and x_0=1');
	            if (isLastByteOdd !== isXOdd)
	                x = modP(-x); // if x_0 != x mod 2, set x = p-x
	            return Point.fromAffine({ x, y });
	        }
	        static fromPrivateKey(privKey) {
	            return getExtendedPublicKey(privKey).point;
	        }
	        toRawBytes() {
	            const { x, y } = this.toAffine();
	            const bytes = numberToBytesLE(y, Fp.BYTES); // each y has 2 x values (x, -y)
	            bytes[bytes.length - 1] |= x & _1n$4 ? 0x80 : 0; // when compressing, it's enough to store y
	            return bytes; // and use the last byte to encode sign of x
	        }
	        toHex() {
	            return bytesToHex(this.toRawBytes()); // Same as toRawBytes, but returns string.
	        }
	    }
	    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, _1n$4, modP(CURVE.Gx * CURVE.Gy));
	    Point.ZERO = new Point(_0n$2, _1n$4, _1n$4, _0n$2); // 0, 1, 1, 0
	    const { BASE: G, ZERO: I } = Point;
	    const wnaf = wNAF(Point, nByteLength * 8);
	    function modN(a) {
	        return mod(a, CURVE_ORDER);
	    }
	    // Little-endian SHA512 with modulo n
	    function modN_LE(hash) {
	        return modN(bytesToNumberLE(hash));
	    }
	    /** Convenience method that creates public key and other stuff. RFC8032 5.1.5 */
	    function getExtendedPublicKey(key) {
	        const len = Fp.BYTES;
	        key = ensureBytes('private key', key, len);
	        // Hash private key with curve's hash function to produce uniformingly random input
	        // Check byte lengths: ensure(64, h(ensure(32, key)))
	        const hashed = ensureBytes('hashed private key', cHash(key), 2 * len);
	        const head = adjustScalarBytes(hashed.slice(0, len)); // clear first half bits, produce FE
	        const prefix = hashed.slice(len, 2 * len); // second half is called key prefix (5.1.6)
	        const scalar = modN_LE(head); // The actual private scalar
	        const point = G.multiply(scalar); // Point on Edwards curve aka public key
	        const pointBytes = point.toRawBytes(); // Uint8Array representation
	        return { head, prefix, scalar, point, pointBytes };
	    }
	    // Calculates EdDSA pub key. RFC8032 5.1.5. Privkey is hashed. Use first half with 3 bits cleared
	    function getPublicKey(privKey) {
	        return getExtendedPublicKey(privKey).pointBytes;
	    }
	    // int('LE', SHA512(dom2(F, C) || msgs)) mod N
	    function hashDomainToScalar(context = new Uint8Array(), ...msgs) {
	        const msg = concatBytes(...msgs);
	        return modN_LE(cHash(domain(msg, ensureBytes('context', context), !!prehash)));
	    }
	    /** Signs message with privateKey. RFC8032 5.1.6 */
	    function sign(msg, privKey, options = {}) {
	        msg = ensureBytes('message', msg);
	        if (prehash)
	            msg = prehash(msg); // for ed25519ph etc.
	        const { prefix, scalar, pointBytes } = getExtendedPublicKey(privKey);
	        const r = hashDomainToScalar(options.context, prefix, msg); // r = dom2(F, C) || prefix || PH(M)
	        const R = G.multiply(r).toRawBytes(); // R = rG
	        const k = hashDomainToScalar(options.context, R, pointBytes, msg); // R || A || PH(M)
	        const s = modN(r + k * scalar); // S = (r + k * s) mod L
	        aInRange('signature.s', s, _0n$2, CURVE_ORDER); // 0 <= s < l
	        const res = concatBytes(R, numberToBytesLE(s, Fp.BYTES));
	        return ensureBytes('result', res, Fp.BYTES * 2); // 64-byte signature
	    }
	    const verifyOpts = VERIFY_DEFAULT;
	    /**
	     * Verifies EdDSA signature against message and public key. RFC8032 5.1.7.
	     * An extended group equation is checked.
	     */
	    function verify(sig, msg, publicKey, options = verifyOpts) {
	        const { context, zip215 } = options;
	        const len = Fp.BYTES; // Verifies EdDSA signature against message and public key. RFC8032 5.1.7.
	        sig = ensureBytes('signature', sig, 2 * len); // An extended group equation is checked.
	        msg = ensureBytes('message', msg);
	        publicKey = ensureBytes('publicKey', publicKey, len);
	        if (zip215 !== undefined)
	            abool('zip215', zip215);
	        if (prehash)
	            msg = prehash(msg); // for ed25519ph, etc
	        const s = bytesToNumberLE(sig.slice(len, 2 * len));
	        let A, R, SB;
	        try {
	            // zip215=true is good for consensus-critical apps. =false follows RFC8032 / NIST186-5.
	            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
	            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
	            A = Point.fromHex(publicKey, zip215);
	            R = Point.fromHex(sig.slice(0, len), zip215);
	            SB = G.multiplyUnsafe(s); // 0 <= s < l is done inside
	        }
	        catch (error) {
	            return false;
	        }
	        if (!zip215 && A.isSmallOrder())
	            return false;
	        const k = hashDomainToScalar(context, R.toRawBytes(), A.toRawBytes(), msg);
	        const RkA = R.add(A.multiplyUnsafe(k));
	        // Extended group equation
	        // [8][S]B = [8]R + [8][k]A'
	        return RkA.subtract(SB).clearCofactor().equals(Point.ZERO);
	    }
	    G._setWindowSize(8); // Enable precomputes. Slows down first publicKey computation by 20ms.
	    const utils = {
	        getExtendedPublicKey,
	        // ed25519 private keys are uniform 32b. No need to check for modulo bias, like in secp256k1.
	        randomPrivateKey: () => randomBytes(Fp.BYTES),
	        /**
	         * We're doing scalar multiplication (used in getPublicKey etc) with precomputed BASE_POINT
	         * values. This slows down first getPublicKey() by milliseconds (see Speed section),
	         * but allows to speed-up subsequent getPublicKey() calls up to 20x.
	         * @param windowSize 2, 4, 8, 16
	         */
	        precompute(windowSize = 8, point = Point.BASE) {
	            point._setWindowSize(windowSize);
	            point.multiply(BigInt(3));
	            return point;
	        },
	    };
	    return {
	        CURVE,
	        getPublicKey,
	        sign,
	        verify,
	        ExtendedPoint: Point,
	        utils,
	    };
	}

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	/**
	 * ed25519 Twisted Edwards curve with following addons:
	 * - X25519 ECDH
	 * - Ristretto cofactor elimination
	 * - Elligator hash-to-group / point indistinguishability
	 */
	const ED25519_P = BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949');
	// √(-1) aka √(a) aka 2^((p-1)/4)
	const ED25519_SQRT_M1 = /* @__PURE__ */ BigInt('19681161376707505956807079304988542015446066515923890162744021073123829784752');
	// prettier-ignore
	BigInt(0); const _1n$3 = BigInt(1), _2n$2 = BigInt(2); BigInt(3);
	// prettier-ignore
	const _5n = BigInt(5), _8n = BigInt(8);
	function ed25519_pow_2_252_3(x) {
	    // prettier-ignore
	    const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
	    const P = ED25519_P;
	    const x2 = (x * x) % P;
	    const b2 = (x2 * x) % P; // x^3, 11
	    const b4 = (pow2(b2, _2n$2, P) * b2) % P; // x^15, 1111
	    const b5 = (pow2(b4, _1n$3, P) * x) % P; // x^31
	    const b10 = (pow2(b5, _5n, P) * b5) % P;
	    const b20 = (pow2(b10, _10n, P) * b10) % P;
	    const b40 = (pow2(b20, _20n, P) * b20) % P;
	    const b80 = (pow2(b40, _40n, P) * b40) % P;
	    const b160 = (pow2(b80, _80n, P) * b80) % P;
	    const b240 = (pow2(b160, _80n, P) * b80) % P;
	    const b250 = (pow2(b240, _10n, P) * b10) % P;
	    const pow_p_5_8 = (pow2(b250, _2n$2, P) * x) % P;
	    // ^ To pow to (p+3)/8, multiply it by x.
	    return { pow_p_5_8, b2 };
	}
	function adjustScalarBytes(bytes) {
	    // Section 5: For X25519, in order to decode 32 random bytes as an integer scalar,
	    // set the three least significant bits of the first byte
	    bytes[0] &= 248; // 0b1111_1000
	    // and the most significant bit of the last to zero,
	    bytes[31] &= 127; // 0b0111_1111
	    // set the second most significant bit of the last byte to 1
	    bytes[31] |= 64; // 0b0100_0000
	    return bytes;
	}
	// sqrt(u/v)
	function uvRatio(u, v) {
	    const P = ED25519_P;
	    const v3 = mod(v * v * v, P); // v³
	    const v7 = mod(v3 * v3 * v, P); // v⁷
	    // (p+3)/8 and (p-5)/8
	    const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
	    let x = mod(u * v3 * pow, P); // (uv³)(uv⁷)^(p-5)/8
	    const vx2 = mod(v * x * x, P); // vx²
	    const root1 = x; // First root candidate
	    const root2 = mod(x * ED25519_SQRT_M1, P); // Second root candidate
	    const useRoot1 = vx2 === u; // If vx² = u (mod p), x is a square root
	    const useRoot2 = vx2 === mod(-u, P); // If vx² = -u, set x <-- x * 2^((p-1)/4)
	    const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P); // There is no valid root, vx² = -u√(-1)
	    if (useRoot1)
	        x = root1;
	    if (useRoot2 || noRoot)
	        x = root2; // We return root2 anyway, for const-time
	    if (isNegativeLE(x, P))
	        x = mod(-x, P);
	    return { isValid: useRoot1 || useRoot2, value: x };
	}
	const Fp = /* @__PURE__ */ (() => Field(ED25519_P, undefined, true))();
	const ed25519Defaults = /* @__PURE__ */ (() => ({
	    // Param: a
	    a: BigInt(-1), // Fp.create(-1) is proper; our way still works and is faster
	    // d is equal to -121665/121666 over finite field.
	    // Negative number is P - number, and division is invert(number, P)
	    d: BigInt('37095705934669439343138083508754565189542113879843219016388785533085940283555'),
	    // Finite field 𝔽p over which we'll do calculations; 2n**255n - 19n
	    Fp,
	    // Subgroup order: how many points curve has
	    // 2n**252n + 27742317777372353535851937790883648493n;
	    n: BigInt('7237005577332262213973186563042994240857116359379907606001950938285454250989'),
	    // Cofactor
	    h: _8n,
	    // Base point (x, y) aka generator point
	    Gx: BigInt('15112221349535400772501151409588531511454012693041857206046113283949847762202'),
	    Gy: BigInt('46316835694926478169428394003475163141307993866256225615783033603165251855960'),
	    hash: sha512,
	    randomBytes,
	    adjustScalarBytes,
	    // dom2
	    // Ratio of u to v. Allows us to combine inversion and square root. Uses algo from RFC8032 5.1.3.
	    // Constant-time, u/√v
	    uvRatio,
	}))();
	/**
	 * ed25519 curve with EdDSA signatures.
	 */
	const ed25519 = /* @__PURE__ */ (() => twistedEdwards(ed25519Defaults))();

	/**
	 * A 64 byte secret key, the first 32 bytes of which is the
	 * private scalar and the last 32 bytes is the public key.
	 * Read more: https://blog.mozilla.org/warner/2011/11/29/ed25519-keys/
	 */

	/**
	 * Ed25519 Keypair
	 */

	const generatePrivateKey = ed25519.utils.randomPrivateKey;
	const generateKeypair = () => {
	  const privateScalar = ed25519.utils.randomPrivateKey();
	  const publicKey = getPublicKey(privateScalar);
	  const secretKey = new Uint8Array(64);
	  secretKey.set(privateScalar);
	  secretKey.set(publicKey, 32);
	  return {
	    publicKey,
	    secretKey
	  };
	};
	const getPublicKey = ed25519.getPublicKey;
	function isOnCurve(publicKey) {
	  try {
	    ed25519.ExtendedPoint.fromHex(publicKey);
	    return true;
	  } catch {
	    return false;
	  }
	}
	const sign = (message, secretKey) => ed25519.sign(message, secretKey.slice(0, 32));
	const verify = ed25519.verify;

	const toBuffer = arr => {
	  if (bufferExports.Buffer.isBuffer(arr)) {
	    return arr;
	  } else if (arr instanceof Uint8Array) {
	    return bufferExports.Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
	  } else {
	    return bufferExports.Buffer.from(arr);
	  }
	};

	var bn$1 = {exports: {}};

	var _nodeResolve_empty = {};

	var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		default: _nodeResolve_empty
	});

	var require$$0$1 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

	var bn = bn$1.exports;

	var hasRequiredBn;

	function requireBn () {
		if (hasRequiredBn) return bn$1.exports;
		hasRequiredBn = 1;
		(function (module) {
			(function (module, exports) {

			  // Utils
			  function assert (val, msg) {
			    if (!val) throw new Error(msg || 'Assertion failed');
			  }

			  // Could use `inherits` module, but don't want to move from single file
			  // architecture yet.
			  function inherits (ctor, superCtor) {
			    ctor.super_ = superCtor;
			    var TempCtor = function () {};
			    TempCtor.prototype = superCtor.prototype;
			    ctor.prototype = new TempCtor();
			    ctor.prototype.constructor = ctor;
			  }

			  // BN

			  function BN (number, base, endian) {
			    if (BN.isBN(number)) {
			      return number;
			    }

			    this.negative = 0;
			    this.words = null;
			    this.length = 0;

			    // Reduction context
			    this.red = null;

			    if (number !== null) {
			      if (base === 'le' || base === 'be') {
			        endian = base;
			        base = 10;
			      }

			      this._init(number || 0, base || 10, endian || 'be');
			    }
			  }
			  if (typeof module === 'object') {
			    module.exports = BN;
			  } else {
			    exports.BN = BN;
			  }

			  BN.BN = BN;
			  BN.wordSize = 26;

			  var Buffer;
			  try {
			    if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
			      Buffer = window.Buffer;
			    } else {
			      Buffer = require$$0$1.Buffer;
			    }
			  } catch (e) {
			  }

			  BN.isBN = function isBN (num) {
			    if (num instanceof BN) {
			      return true;
			    }

			    return num !== null && typeof num === 'object' &&
			      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
			  };

			  BN.max = function max (left, right) {
			    if (left.cmp(right) > 0) return left;
			    return right;
			  };

			  BN.min = function min (left, right) {
			    if (left.cmp(right) < 0) return left;
			    return right;
			  };

			  BN.prototype._init = function init (number, base, endian) {
			    if (typeof number === 'number') {
			      return this._initNumber(number, base, endian);
			    }

			    if (typeof number === 'object') {
			      return this._initArray(number, base, endian);
			    }

			    if (base === 'hex') {
			      base = 16;
			    }
			    assert(base === (base | 0) && base >= 2 && base <= 36);

			    number = number.toString().replace(/\s+/g, '');
			    var start = 0;
			    if (number[0] === '-') {
			      start++;
			      this.negative = 1;
			    }

			    if (start < number.length) {
			      if (base === 16) {
			        this._parseHex(number, start, endian);
			      } else {
			        this._parseBase(number, base, start);
			        if (endian === 'le') {
			          this._initArray(this.toArray(), base, endian);
			        }
			      }
			    }
			  };

			  BN.prototype._initNumber = function _initNumber (number, base, endian) {
			    if (number < 0) {
			      this.negative = 1;
			      number = -number;
			    }
			    if (number < 0x4000000) {
			      this.words = [number & 0x3ffffff];
			      this.length = 1;
			    } else if (number < 0x10000000000000) {
			      this.words = [
			        number & 0x3ffffff,
			        (number / 0x4000000) & 0x3ffffff
			      ];
			      this.length = 2;
			    } else {
			      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
			      this.words = [
			        number & 0x3ffffff,
			        (number / 0x4000000) & 0x3ffffff,
			        1
			      ];
			      this.length = 3;
			    }

			    if (endian !== 'le') return;

			    // Reverse the bytes
			    this._initArray(this.toArray(), base, endian);
			  };

			  BN.prototype._initArray = function _initArray (number, base, endian) {
			    // Perhaps a Uint8Array
			    assert(typeof number.length === 'number');
			    if (number.length <= 0) {
			      this.words = [0];
			      this.length = 1;
			      return this;
			    }

			    this.length = Math.ceil(number.length / 3);
			    this.words = new Array(this.length);
			    for (var i = 0; i < this.length; i++) {
			      this.words[i] = 0;
			    }

			    var j, w;
			    var off = 0;
			    if (endian === 'be') {
			      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
			        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
			        this.words[j] |= (w << off) & 0x3ffffff;
			        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
			        off += 24;
			        if (off >= 26) {
			          off -= 26;
			          j++;
			        }
			      }
			    } else if (endian === 'le') {
			      for (i = 0, j = 0; i < number.length; i += 3) {
			        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
			        this.words[j] |= (w << off) & 0x3ffffff;
			        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
			        off += 24;
			        if (off >= 26) {
			          off -= 26;
			          j++;
			        }
			      }
			    }
			    return this._strip();
			  };

			  function parseHex4Bits (string, index) {
			    var c = string.charCodeAt(index);
			    // '0' - '9'
			    if (c >= 48 && c <= 57) {
			      return c - 48;
			    // 'A' - 'F'
			    } else if (c >= 65 && c <= 70) {
			      return c - 55;
			    // 'a' - 'f'
			    } else if (c >= 97 && c <= 102) {
			      return c - 87;
			    } else {
			      assert(false, 'Invalid character in ' + string);
			    }
			  }

			  function parseHexByte (string, lowerBound, index) {
			    var r = parseHex4Bits(string, index);
			    if (index - 1 >= lowerBound) {
			      r |= parseHex4Bits(string, index - 1) << 4;
			    }
			    return r;
			  }

			  BN.prototype._parseHex = function _parseHex (number, start, endian) {
			    // Create possibly bigger array to ensure that it fits the number
			    this.length = Math.ceil((number.length - start) / 6);
			    this.words = new Array(this.length);
			    for (var i = 0; i < this.length; i++) {
			      this.words[i] = 0;
			    }

			    // 24-bits chunks
			    var off = 0;
			    var j = 0;

			    var w;
			    if (endian === 'be') {
			      for (i = number.length - 1; i >= start; i -= 2) {
			        w = parseHexByte(number, start, i) << off;
			        this.words[j] |= w & 0x3ffffff;
			        if (off >= 18) {
			          off -= 18;
			          j += 1;
			          this.words[j] |= w >>> 26;
			        } else {
			          off += 8;
			        }
			      }
			    } else {
			      var parseLength = number.length - start;
			      for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
			        w = parseHexByte(number, start, i) << off;
			        this.words[j] |= w & 0x3ffffff;
			        if (off >= 18) {
			          off -= 18;
			          j += 1;
			          this.words[j] |= w >>> 26;
			        } else {
			          off += 8;
			        }
			      }
			    }

			    this._strip();
			  };

			  function parseBase (str, start, end, mul) {
			    var r = 0;
			    var b = 0;
			    var len = Math.min(str.length, end);
			    for (var i = start; i < len; i++) {
			      var c = str.charCodeAt(i) - 48;

			      r *= mul;

			      // 'a'
			      if (c >= 49) {
			        b = c - 49 + 0xa;

			      // 'A'
			      } else if (c >= 17) {
			        b = c - 17 + 0xa;

			      // '0' - '9'
			      } else {
			        b = c;
			      }
			      assert(c >= 0 && b < mul, 'Invalid character');
			      r += b;
			    }
			    return r;
			  }

			  BN.prototype._parseBase = function _parseBase (number, base, start) {
			    // Initialize as zero
			    this.words = [0];
			    this.length = 1;

			    // Find length of limb in base
			    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
			      limbLen++;
			    }
			    limbLen--;
			    limbPow = (limbPow / base) | 0;

			    var total = number.length - start;
			    var mod = total % limbLen;
			    var end = Math.min(total, total - mod) + start;

			    var word = 0;
			    for (var i = start; i < end; i += limbLen) {
			      word = parseBase(number, i, i + limbLen, base);

			      this.imuln(limbPow);
			      if (this.words[0] + word < 0x4000000) {
			        this.words[0] += word;
			      } else {
			        this._iaddn(word);
			      }
			    }

			    if (mod !== 0) {
			      var pow = 1;
			      word = parseBase(number, i, number.length, base);

			      for (i = 0; i < mod; i++) {
			        pow *= base;
			      }

			      this.imuln(pow);
			      if (this.words[0] + word < 0x4000000) {
			        this.words[0] += word;
			      } else {
			        this._iaddn(word);
			      }
			    }

			    this._strip();
			  };

			  BN.prototype.copy = function copy (dest) {
			    dest.words = new Array(this.length);
			    for (var i = 0; i < this.length; i++) {
			      dest.words[i] = this.words[i];
			    }
			    dest.length = this.length;
			    dest.negative = this.negative;
			    dest.red = this.red;
			  };

			  function move (dest, src) {
			    dest.words = src.words;
			    dest.length = src.length;
			    dest.negative = src.negative;
			    dest.red = src.red;
			  }

			  BN.prototype._move = function _move (dest) {
			    move(dest, this);
			  };

			  BN.prototype.clone = function clone () {
			    var r = new BN(null);
			    this.copy(r);
			    return r;
			  };

			  BN.prototype._expand = function _expand (size) {
			    while (this.length < size) {
			      this.words[this.length++] = 0;
			    }
			    return this;
			  };

			  // Remove leading `0` from `this`
			  BN.prototype._strip = function strip () {
			    while (this.length > 1 && this.words[this.length - 1] === 0) {
			      this.length--;
			    }
			    return this._normSign();
			  };

			  BN.prototype._normSign = function _normSign () {
			    // -0 = 0
			    if (this.length === 1 && this.words[0] === 0) {
			      this.negative = 0;
			    }
			    return this;
			  };

			  // Check Symbol.for because not everywhere where Symbol defined
			  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
			  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
			    try {
			      BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
			    } catch (e) {
			      BN.prototype.inspect = inspect;
			    }
			  } else {
			    BN.prototype.inspect = inspect;
			  }

			  function inspect () {
			    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
			  }

			  /*

			  var zeros = [];
			  var groupSizes = [];
			  var groupBases = [];

			  var s = '';
			  var i = -1;
			  while (++i < BN.wordSize) {
			    zeros[i] = s;
			    s += '0';
			  }
			  groupSizes[0] = 0;
			  groupSizes[1] = 0;
			  groupBases[0] = 0;
			  groupBases[1] = 0;
			  var base = 2 - 1;
			  while (++base < 36 + 1) {
			    var groupSize = 0;
			    var groupBase = 1;
			    while (groupBase < (1 << BN.wordSize) / base) {
			      groupBase *= base;
			      groupSize += 1;
			    }
			    groupSizes[base] = groupSize;
			    groupBases[base] = groupBase;
			  }

			  */

			  var zeros = [
			    '',
			    '0',
			    '00',
			    '000',
			    '0000',
			    '00000',
			    '000000',
			    '0000000',
			    '00000000',
			    '000000000',
			    '0000000000',
			    '00000000000',
			    '000000000000',
			    '0000000000000',
			    '00000000000000',
			    '000000000000000',
			    '0000000000000000',
			    '00000000000000000',
			    '000000000000000000',
			    '0000000000000000000',
			    '00000000000000000000',
			    '000000000000000000000',
			    '0000000000000000000000',
			    '00000000000000000000000',
			    '000000000000000000000000',
			    '0000000000000000000000000'
			  ];

			  var groupSizes = [
			    0, 0,
			    25, 16, 12, 11, 10, 9, 8,
			    8, 7, 7, 7, 7, 6, 6,
			    6, 6, 6, 6, 6, 5, 5,
			    5, 5, 5, 5, 5, 5, 5,
			    5, 5, 5, 5, 5, 5, 5
			  ];

			  var groupBases = [
			    0, 0,
			    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
			    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
			    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
			    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
			    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
			  ];

			  BN.prototype.toString = function toString (base, padding) {
			    base = base || 10;
			    padding = padding | 0 || 1;

			    var out;
			    if (base === 16 || base === 'hex') {
			      out = '';
			      var off = 0;
			      var carry = 0;
			      for (var i = 0; i < this.length; i++) {
			        var w = this.words[i];
			        var word = (((w << off) | carry) & 0xffffff).toString(16);
			        carry = (w >>> (24 - off)) & 0xffffff;
			        off += 2;
			        if (off >= 26) {
			          off -= 26;
			          i--;
			        }
			        if (carry !== 0 || i !== this.length - 1) {
			          out = zeros[6 - word.length] + word + out;
			        } else {
			          out = word + out;
			        }
			      }
			      if (carry !== 0) {
			        out = carry.toString(16) + out;
			      }
			      while (out.length % padding !== 0) {
			        out = '0' + out;
			      }
			      if (this.negative !== 0) {
			        out = '-' + out;
			      }
			      return out;
			    }

			    if (base === (base | 0) && base >= 2 && base <= 36) {
			      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
			      var groupSize = groupSizes[base];
			      // var groupBase = Math.pow(base, groupSize);
			      var groupBase = groupBases[base];
			      out = '';
			      var c = this.clone();
			      c.negative = 0;
			      while (!c.isZero()) {
			        var r = c.modrn(groupBase).toString(base);
			        c = c.idivn(groupBase);

			        if (!c.isZero()) {
			          out = zeros[groupSize - r.length] + r + out;
			        } else {
			          out = r + out;
			        }
			      }
			      if (this.isZero()) {
			        out = '0' + out;
			      }
			      while (out.length % padding !== 0) {
			        out = '0' + out;
			      }
			      if (this.negative !== 0) {
			        out = '-' + out;
			      }
			      return out;
			    }

			    assert(false, 'Base should be between 2 and 36');
			  };

			  BN.prototype.toNumber = function toNumber () {
			    var ret = this.words[0];
			    if (this.length === 2) {
			      ret += this.words[1] * 0x4000000;
			    } else if (this.length === 3 && this.words[2] === 0x01) {
			      // NOTE: at this stage it is known that the top bit is set
			      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
			    } else if (this.length > 2) {
			      assert(false, 'Number can only safely store up to 53 bits');
			    }
			    return (this.negative !== 0) ? -ret : ret;
			  };

			  BN.prototype.toJSON = function toJSON () {
			    return this.toString(16, 2);
			  };

			  if (Buffer) {
			    BN.prototype.toBuffer = function toBuffer (endian, length) {
			      return this.toArrayLike(Buffer, endian, length);
			    };
			  }

			  BN.prototype.toArray = function toArray (endian, length) {
			    return this.toArrayLike(Array, endian, length);
			  };

			  var allocate = function allocate (ArrayType, size) {
			    if (ArrayType.allocUnsafe) {
			      return ArrayType.allocUnsafe(size);
			    }
			    return new ArrayType(size);
			  };

			  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
			    this._strip();

			    var byteLength = this.byteLength();
			    var reqLength = length || Math.max(1, byteLength);
			    assert(byteLength <= reqLength, 'byte array longer than desired length');
			    assert(reqLength > 0, 'Requested array length <= 0');

			    var res = allocate(ArrayType, reqLength);
			    var postfix = endian === 'le' ? 'LE' : 'BE';
			    this['_toArrayLike' + postfix](res, byteLength);
			    return res;
			  };

			  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
			    var position = 0;
			    var carry = 0;

			    for (var i = 0, shift = 0; i < this.length; i++) {
			      var word = (this.words[i] << shift) | carry;

			      res[position++] = word & 0xff;
			      if (position < res.length) {
			        res[position++] = (word >> 8) & 0xff;
			      }
			      if (position < res.length) {
			        res[position++] = (word >> 16) & 0xff;
			      }

			      if (shift === 6) {
			        if (position < res.length) {
			          res[position++] = (word >> 24) & 0xff;
			        }
			        carry = 0;
			        shift = 0;
			      } else {
			        carry = word >>> 24;
			        shift += 2;
			      }
			    }

			    if (position < res.length) {
			      res[position++] = carry;

			      while (position < res.length) {
			        res[position++] = 0;
			      }
			    }
			  };

			  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
			    var position = res.length - 1;
			    var carry = 0;

			    for (var i = 0, shift = 0; i < this.length; i++) {
			      var word = (this.words[i] << shift) | carry;

			      res[position--] = word & 0xff;
			      if (position >= 0) {
			        res[position--] = (word >> 8) & 0xff;
			      }
			      if (position >= 0) {
			        res[position--] = (word >> 16) & 0xff;
			      }

			      if (shift === 6) {
			        if (position >= 0) {
			          res[position--] = (word >> 24) & 0xff;
			        }
			        carry = 0;
			        shift = 0;
			      } else {
			        carry = word >>> 24;
			        shift += 2;
			      }
			    }

			    if (position >= 0) {
			      res[position--] = carry;

			      while (position >= 0) {
			        res[position--] = 0;
			      }
			    }
			  };

			  if (Math.clz32) {
			    BN.prototype._countBits = function _countBits (w) {
			      return 32 - Math.clz32(w);
			    };
			  } else {
			    BN.prototype._countBits = function _countBits (w) {
			      var t = w;
			      var r = 0;
			      if (t >= 0x1000) {
			        r += 13;
			        t >>>= 13;
			      }
			      if (t >= 0x40) {
			        r += 7;
			        t >>>= 7;
			      }
			      if (t >= 0x8) {
			        r += 4;
			        t >>>= 4;
			      }
			      if (t >= 0x02) {
			        r += 2;
			        t >>>= 2;
			      }
			      return r + t;
			    };
			  }

			  BN.prototype._zeroBits = function _zeroBits (w) {
			    // Short-cut
			    if (w === 0) return 26;

			    var t = w;
			    var r = 0;
			    if ((t & 0x1fff) === 0) {
			      r += 13;
			      t >>>= 13;
			    }
			    if ((t & 0x7f) === 0) {
			      r += 7;
			      t >>>= 7;
			    }
			    if ((t & 0xf) === 0) {
			      r += 4;
			      t >>>= 4;
			    }
			    if ((t & 0x3) === 0) {
			      r += 2;
			      t >>>= 2;
			    }
			    if ((t & 0x1) === 0) {
			      r++;
			    }
			    return r;
			  };

			  // Return number of used bits in a BN
			  BN.prototype.bitLength = function bitLength () {
			    var w = this.words[this.length - 1];
			    var hi = this._countBits(w);
			    return (this.length - 1) * 26 + hi;
			  };

			  function toBitArray (num) {
			    var w = new Array(num.bitLength());

			    for (var bit = 0; bit < w.length; bit++) {
			      var off = (bit / 26) | 0;
			      var wbit = bit % 26;

			      w[bit] = (num.words[off] >>> wbit) & 0x01;
			    }

			    return w;
			  }

			  // Number of trailing zero bits
			  BN.prototype.zeroBits = function zeroBits () {
			    if (this.isZero()) return 0;

			    var r = 0;
			    for (var i = 0; i < this.length; i++) {
			      var b = this._zeroBits(this.words[i]);
			      r += b;
			      if (b !== 26) break;
			    }
			    return r;
			  };

			  BN.prototype.byteLength = function byteLength () {
			    return Math.ceil(this.bitLength() / 8);
			  };

			  BN.prototype.toTwos = function toTwos (width) {
			    if (this.negative !== 0) {
			      return this.abs().inotn(width).iaddn(1);
			    }
			    return this.clone();
			  };

			  BN.prototype.fromTwos = function fromTwos (width) {
			    if (this.testn(width - 1)) {
			      return this.notn(width).iaddn(1).ineg();
			    }
			    return this.clone();
			  };

			  BN.prototype.isNeg = function isNeg () {
			    return this.negative !== 0;
			  };

			  // Return negative clone of `this`
			  BN.prototype.neg = function neg () {
			    return this.clone().ineg();
			  };

			  BN.prototype.ineg = function ineg () {
			    if (!this.isZero()) {
			      this.negative ^= 1;
			    }

			    return this;
			  };

			  // Or `num` with `this` in-place
			  BN.prototype.iuor = function iuor (num) {
			    while (this.length < num.length) {
			      this.words[this.length++] = 0;
			    }

			    for (var i = 0; i < num.length; i++) {
			      this.words[i] = this.words[i] | num.words[i];
			    }

			    return this._strip();
			  };

			  BN.prototype.ior = function ior (num) {
			    assert((this.negative | num.negative) === 0);
			    return this.iuor(num);
			  };

			  // Or `num` with `this`
			  BN.prototype.or = function or (num) {
			    if (this.length > num.length) return this.clone().ior(num);
			    return num.clone().ior(this);
			  };

			  BN.prototype.uor = function uor (num) {
			    if (this.length > num.length) return this.clone().iuor(num);
			    return num.clone().iuor(this);
			  };

			  // And `num` with `this` in-place
			  BN.prototype.iuand = function iuand (num) {
			    // b = min-length(num, this)
			    var b;
			    if (this.length > num.length) {
			      b = num;
			    } else {
			      b = this;
			    }

			    for (var i = 0; i < b.length; i++) {
			      this.words[i] = this.words[i] & num.words[i];
			    }

			    this.length = b.length;

			    return this._strip();
			  };

			  BN.prototype.iand = function iand (num) {
			    assert((this.negative | num.negative) === 0);
			    return this.iuand(num);
			  };

			  // And `num` with `this`
			  BN.prototype.and = function and (num) {
			    if (this.length > num.length) return this.clone().iand(num);
			    return num.clone().iand(this);
			  };

			  BN.prototype.uand = function uand (num) {
			    if (this.length > num.length) return this.clone().iuand(num);
			    return num.clone().iuand(this);
			  };

			  // Xor `num` with `this` in-place
			  BN.prototype.iuxor = function iuxor (num) {
			    // a.length > b.length
			    var a;
			    var b;
			    if (this.length > num.length) {
			      a = this;
			      b = num;
			    } else {
			      a = num;
			      b = this;
			    }

			    for (var i = 0; i < b.length; i++) {
			      this.words[i] = a.words[i] ^ b.words[i];
			    }

			    if (this !== a) {
			      for (; i < a.length; i++) {
			        this.words[i] = a.words[i];
			      }
			    }

			    this.length = a.length;

			    return this._strip();
			  };

			  BN.prototype.ixor = function ixor (num) {
			    assert((this.negative | num.negative) === 0);
			    return this.iuxor(num);
			  };

			  // Xor `num` with `this`
			  BN.prototype.xor = function xor (num) {
			    if (this.length > num.length) return this.clone().ixor(num);
			    return num.clone().ixor(this);
			  };

			  BN.prototype.uxor = function uxor (num) {
			    if (this.length > num.length) return this.clone().iuxor(num);
			    return num.clone().iuxor(this);
			  };

			  // Not ``this`` with ``width`` bitwidth
			  BN.prototype.inotn = function inotn (width) {
			    assert(typeof width === 'number' && width >= 0);

			    var bytesNeeded = Math.ceil(width / 26) | 0;
			    var bitsLeft = width % 26;

			    // Extend the buffer with leading zeroes
			    this._expand(bytesNeeded);

			    if (bitsLeft > 0) {
			      bytesNeeded--;
			    }

			    // Handle complete words
			    for (var i = 0; i < bytesNeeded; i++) {
			      this.words[i] = ~this.words[i] & 0x3ffffff;
			    }

			    // Handle the residue
			    if (bitsLeft > 0) {
			      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
			    }

			    // And remove leading zeroes
			    return this._strip();
			  };

			  BN.prototype.notn = function notn (width) {
			    return this.clone().inotn(width);
			  };

			  // Set `bit` of `this`
			  BN.prototype.setn = function setn (bit, val) {
			    assert(typeof bit === 'number' && bit >= 0);

			    var off = (bit / 26) | 0;
			    var wbit = bit % 26;

			    this._expand(off + 1);

			    if (val) {
			      this.words[off] = this.words[off] | (1 << wbit);
			    } else {
			      this.words[off] = this.words[off] & ~(1 << wbit);
			    }

			    return this._strip();
			  };

			  // Add `num` to `this` in-place
			  BN.prototype.iadd = function iadd (num) {
			    var r;

			    // negative + positive
			    if (this.negative !== 0 && num.negative === 0) {
			      this.negative = 0;
			      r = this.isub(num);
			      this.negative ^= 1;
			      return this._normSign();

			    // positive + negative
			    } else if (this.negative === 0 && num.negative !== 0) {
			      num.negative = 0;
			      r = this.isub(num);
			      num.negative = 1;
			      return r._normSign();
			    }

			    // a.length > b.length
			    var a, b;
			    if (this.length > num.length) {
			      a = this;
			      b = num;
			    } else {
			      a = num;
			      b = this;
			    }

			    var carry = 0;
			    for (var i = 0; i < b.length; i++) {
			      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
			      this.words[i] = r & 0x3ffffff;
			      carry = r >>> 26;
			    }
			    for (; carry !== 0 && i < a.length; i++) {
			      r = (a.words[i] | 0) + carry;
			      this.words[i] = r & 0x3ffffff;
			      carry = r >>> 26;
			    }

			    this.length = a.length;
			    if (carry !== 0) {
			      this.words[this.length] = carry;
			      this.length++;
			    // Copy the rest of the words
			    } else if (a !== this) {
			      for (; i < a.length; i++) {
			        this.words[i] = a.words[i];
			      }
			    }

			    return this;
			  };

			  // Add `num` to `this`
			  BN.prototype.add = function add (num) {
			    var res;
			    if (num.negative !== 0 && this.negative === 0) {
			      num.negative = 0;
			      res = this.sub(num);
			      num.negative ^= 1;
			      return res;
			    } else if (num.negative === 0 && this.negative !== 0) {
			      this.negative = 0;
			      res = num.sub(this);
			      this.negative = 1;
			      return res;
			    }

			    if (this.length > num.length) return this.clone().iadd(num);

			    return num.clone().iadd(this);
			  };

			  // Subtract `num` from `this` in-place
			  BN.prototype.isub = function isub (num) {
			    // this - (-num) = this + num
			    if (num.negative !== 0) {
			      num.negative = 0;
			      var r = this.iadd(num);
			      num.negative = 1;
			      return r._normSign();

			    // -this - num = -(this + num)
			    } else if (this.negative !== 0) {
			      this.negative = 0;
			      this.iadd(num);
			      this.negative = 1;
			      return this._normSign();
			    }

			    // At this point both numbers are positive
			    var cmp = this.cmp(num);

			    // Optimization - zeroify
			    if (cmp === 0) {
			      this.negative = 0;
			      this.length = 1;
			      this.words[0] = 0;
			      return this;
			    }

			    // a > b
			    var a, b;
			    if (cmp > 0) {
			      a = this;
			      b = num;
			    } else {
			      a = num;
			      b = this;
			    }

			    var carry = 0;
			    for (var i = 0; i < b.length; i++) {
			      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
			      carry = r >> 26;
			      this.words[i] = r & 0x3ffffff;
			    }
			    for (; carry !== 0 && i < a.length; i++) {
			      r = (a.words[i] | 0) + carry;
			      carry = r >> 26;
			      this.words[i] = r & 0x3ffffff;
			    }

			    // Copy rest of the words
			    if (carry === 0 && i < a.length && a !== this) {
			      for (; i < a.length; i++) {
			        this.words[i] = a.words[i];
			      }
			    }

			    this.length = Math.max(this.length, i);

			    if (a !== this) {
			      this.negative = 1;
			    }

			    return this._strip();
			  };

			  // Subtract `num` from `this`
			  BN.prototype.sub = function sub (num) {
			    return this.clone().isub(num);
			  };

			  function smallMulTo (self, num, out) {
			    out.negative = num.negative ^ self.negative;
			    var len = (self.length + num.length) | 0;
			    out.length = len;
			    len = (len - 1) | 0;

			    // Peel one iteration (compiler can't do it, because of code complexity)
			    var a = self.words[0] | 0;
			    var b = num.words[0] | 0;
			    var r = a * b;

			    var lo = r & 0x3ffffff;
			    var carry = (r / 0x4000000) | 0;
			    out.words[0] = lo;

			    for (var k = 1; k < len; k++) {
			      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
			      // note that ncarry could be >= 0x3ffffff
			      var ncarry = carry >>> 26;
			      var rword = carry & 0x3ffffff;
			      var maxJ = Math.min(k, num.length - 1);
			      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
			        var i = (k - j) | 0;
			        a = self.words[i] | 0;
			        b = num.words[j] | 0;
			        r = a * b + rword;
			        ncarry += (r / 0x4000000) | 0;
			        rword = r & 0x3ffffff;
			      }
			      out.words[k] = rword | 0;
			      carry = ncarry | 0;
			    }
			    if (carry !== 0) {
			      out.words[k] = carry | 0;
			    } else {
			      out.length--;
			    }

			    return out._strip();
			  }

			  // TODO(indutny): it may be reasonable to omit it for users who don't need
			  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
			  // multiplication (like elliptic secp256k1).
			  var comb10MulTo = function comb10MulTo (self, num, out) {
			    var a = self.words;
			    var b = num.words;
			    var o = out.words;
			    var c = 0;
			    var lo;
			    var mid;
			    var hi;
			    var a0 = a[0] | 0;
			    var al0 = a0 & 0x1fff;
			    var ah0 = a0 >>> 13;
			    var a1 = a[1] | 0;
			    var al1 = a1 & 0x1fff;
			    var ah1 = a1 >>> 13;
			    var a2 = a[2] | 0;
			    var al2 = a2 & 0x1fff;
			    var ah2 = a2 >>> 13;
			    var a3 = a[3] | 0;
			    var al3 = a3 & 0x1fff;
			    var ah3 = a3 >>> 13;
			    var a4 = a[4] | 0;
			    var al4 = a4 & 0x1fff;
			    var ah4 = a4 >>> 13;
			    var a5 = a[5] | 0;
			    var al5 = a5 & 0x1fff;
			    var ah5 = a5 >>> 13;
			    var a6 = a[6] | 0;
			    var al6 = a6 & 0x1fff;
			    var ah6 = a6 >>> 13;
			    var a7 = a[7] | 0;
			    var al7 = a7 & 0x1fff;
			    var ah7 = a7 >>> 13;
			    var a8 = a[8] | 0;
			    var al8 = a8 & 0x1fff;
			    var ah8 = a8 >>> 13;
			    var a9 = a[9] | 0;
			    var al9 = a9 & 0x1fff;
			    var ah9 = a9 >>> 13;
			    var b0 = b[0] | 0;
			    var bl0 = b0 & 0x1fff;
			    var bh0 = b0 >>> 13;
			    var b1 = b[1] | 0;
			    var bl1 = b1 & 0x1fff;
			    var bh1 = b1 >>> 13;
			    var b2 = b[2] | 0;
			    var bl2 = b2 & 0x1fff;
			    var bh2 = b2 >>> 13;
			    var b3 = b[3] | 0;
			    var bl3 = b3 & 0x1fff;
			    var bh3 = b3 >>> 13;
			    var b4 = b[4] | 0;
			    var bl4 = b4 & 0x1fff;
			    var bh4 = b4 >>> 13;
			    var b5 = b[5] | 0;
			    var bl5 = b5 & 0x1fff;
			    var bh5 = b5 >>> 13;
			    var b6 = b[6] | 0;
			    var bl6 = b6 & 0x1fff;
			    var bh6 = b6 >>> 13;
			    var b7 = b[7] | 0;
			    var bl7 = b7 & 0x1fff;
			    var bh7 = b7 >>> 13;
			    var b8 = b[8] | 0;
			    var bl8 = b8 & 0x1fff;
			    var bh8 = b8 >>> 13;
			    var b9 = b[9] | 0;
			    var bl9 = b9 & 0x1fff;
			    var bh9 = b9 >>> 13;

			    out.negative = self.negative ^ num.negative;
			    out.length = 19;
			    /* k = 0 */
			    lo = Math.imul(al0, bl0);
			    mid = Math.imul(al0, bh0);
			    mid = (mid + Math.imul(ah0, bl0)) | 0;
			    hi = Math.imul(ah0, bh0);
			    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
			    w0 &= 0x3ffffff;
			    /* k = 1 */
			    lo = Math.imul(al1, bl0);
			    mid = Math.imul(al1, bh0);
			    mid = (mid + Math.imul(ah1, bl0)) | 0;
			    hi = Math.imul(ah1, bh0);
			    lo = (lo + Math.imul(al0, bl1)) | 0;
			    mid = (mid + Math.imul(al0, bh1)) | 0;
			    mid = (mid + Math.imul(ah0, bl1)) | 0;
			    hi = (hi + Math.imul(ah0, bh1)) | 0;
			    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
			    w1 &= 0x3ffffff;
			    /* k = 2 */
			    lo = Math.imul(al2, bl0);
			    mid = Math.imul(al2, bh0);
			    mid = (mid + Math.imul(ah2, bl0)) | 0;
			    hi = Math.imul(ah2, bh0);
			    lo = (lo + Math.imul(al1, bl1)) | 0;
			    mid = (mid + Math.imul(al1, bh1)) | 0;
			    mid = (mid + Math.imul(ah1, bl1)) | 0;
			    hi = (hi + Math.imul(ah1, bh1)) | 0;
			    lo = (lo + Math.imul(al0, bl2)) | 0;
			    mid = (mid + Math.imul(al0, bh2)) | 0;
			    mid = (mid + Math.imul(ah0, bl2)) | 0;
			    hi = (hi + Math.imul(ah0, bh2)) | 0;
			    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
			    w2 &= 0x3ffffff;
			    /* k = 3 */
			    lo = Math.imul(al3, bl0);
			    mid = Math.imul(al3, bh0);
			    mid = (mid + Math.imul(ah3, bl0)) | 0;
			    hi = Math.imul(ah3, bh0);
			    lo = (lo + Math.imul(al2, bl1)) | 0;
			    mid = (mid + Math.imul(al2, bh1)) | 0;
			    mid = (mid + Math.imul(ah2, bl1)) | 0;
			    hi = (hi + Math.imul(ah2, bh1)) | 0;
			    lo = (lo + Math.imul(al1, bl2)) | 0;
			    mid = (mid + Math.imul(al1, bh2)) | 0;
			    mid = (mid + Math.imul(ah1, bl2)) | 0;
			    hi = (hi + Math.imul(ah1, bh2)) | 0;
			    lo = (lo + Math.imul(al0, bl3)) | 0;
			    mid = (mid + Math.imul(al0, bh3)) | 0;
			    mid = (mid + Math.imul(ah0, bl3)) | 0;
			    hi = (hi + Math.imul(ah0, bh3)) | 0;
			    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
			    w3 &= 0x3ffffff;
			    /* k = 4 */
			    lo = Math.imul(al4, bl0);
			    mid = Math.imul(al4, bh0);
			    mid = (mid + Math.imul(ah4, bl0)) | 0;
			    hi = Math.imul(ah4, bh0);
			    lo = (lo + Math.imul(al3, bl1)) | 0;
			    mid = (mid + Math.imul(al3, bh1)) | 0;
			    mid = (mid + Math.imul(ah3, bl1)) | 0;
			    hi = (hi + Math.imul(ah3, bh1)) | 0;
			    lo = (lo + Math.imul(al2, bl2)) | 0;
			    mid = (mid + Math.imul(al2, bh2)) | 0;
			    mid = (mid + Math.imul(ah2, bl2)) | 0;
			    hi = (hi + Math.imul(ah2, bh2)) | 0;
			    lo = (lo + Math.imul(al1, bl3)) | 0;
			    mid = (mid + Math.imul(al1, bh3)) | 0;
			    mid = (mid + Math.imul(ah1, bl3)) | 0;
			    hi = (hi + Math.imul(ah1, bh3)) | 0;
			    lo = (lo + Math.imul(al0, bl4)) | 0;
			    mid = (mid + Math.imul(al0, bh4)) | 0;
			    mid = (mid + Math.imul(ah0, bl4)) | 0;
			    hi = (hi + Math.imul(ah0, bh4)) | 0;
			    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
			    w4 &= 0x3ffffff;
			    /* k = 5 */
			    lo = Math.imul(al5, bl0);
			    mid = Math.imul(al5, bh0);
			    mid = (mid + Math.imul(ah5, bl0)) | 0;
			    hi = Math.imul(ah5, bh0);
			    lo = (lo + Math.imul(al4, bl1)) | 0;
			    mid = (mid + Math.imul(al4, bh1)) | 0;
			    mid = (mid + Math.imul(ah4, bl1)) | 0;
			    hi = (hi + Math.imul(ah4, bh1)) | 0;
			    lo = (lo + Math.imul(al3, bl2)) | 0;
			    mid = (mid + Math.imul(al3, bh2)) | 0;
			    mid = (mid + Math.imul(ah3, bl2)) | 0;
			    hi = (hi + Math.imul(ah3, bh2)) | 0;
			    lo = (lo + Math.imul(al2, bl3)) | 0;
			    mid = (mid + Math.imul(al2, bh3)) | 0;
			    mid = (mid + Math.imul(ah2, bl3)) | 0;
			    hi = (hi + Math.imul(ah2, bh3)) | 0;
			    lo = (lo + Math.imul(al1, bl4)) | 0;
			    mid = (mid + Math.imul(al1, bh4)) | 0;
			    mid = (mid + Math.imul(ah1, bl4)) | 0;
			    hi = (hi + Math.imul(ah1, bh4)) | 0;
			    lo = (lo + Math.imul(al0, bl5)) | 0;
			    mid = (mid + Math.imul(al0, bh5)) | 0;
			    mid = (mid + Math.imul(ah0, bl5)) | 0;
			    hi = (hi + Math.imul(ah0, bh5)) | 0;
			    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
			    w5 &= 0x3ffffff;
			    /* k = 6 */
			    lo = Math.imul(al6, bl0);
			    mid = Math.imul(al6, bh0);
			    mid = (mid + Math.imul(ah6, bl0)) | 0;
			    hi = Math.imul(ah6, bh0);
			    lo = (lo + Math.imul(al5, bl1)) | 0;
			    mid = (mid + Math.imul(al5, bh1)) | 0;
			    mid = (mid + Math.imul(ah5, bl1)) | 0;
			    hi = (hi + Math.imul(ah5, bh1)) | 0;
			    lo = (lo + Math.imul(al4, bl2)) | 0;
			    mid = (mid + Math.imul(al4, bh2)) | 0;
			    mid = (mid + Math.imul(ah4, bl2)) | 0;
			    hi = (hi + Math.imul(ah4, bh2)) | 0;
			    lo = (lo + Math.imul(al3, bl3)) | 0;
			    mid = (mid + Math.imul(al3, bh3)) | 0;
			    mid = (mid + Math.imul(ah3, bl3)) | 0;
			    hi = (hi + Math.imul(ah3, bh3)) | 0;
			    lo = (lo + Math.imul(al2, bl4)) | 0;
			    mid = (mid + Math.imul(al2, bh4)) | 0;
			    mid = (mid + Math.imul(ah2, bl4)) | 0;
			    hi = (hi + Math.imul(ah2, bh4)) | 0;
			    lo = (lo + Math.imul(al1, bl5)) | 0;
			    mid = (mid + Math.imul(al1, bh5)) | 0;
			    mid = (mid + Math.imul(ah1, bl5)) | 0;
			    hi = (hi + Math.imul(ah1, bh5)) | 0;
			    lo = (lo + Math.imul(al0, bl6)) | 0;
			    mid = (mid + Math.imul(al0, bh6)) | 0;
			    mid = (mid + Math.imul(ah0, bl6)) | 0;
			    hi = (hi + Math.imul(ah0, bh6)) | 0;
			    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
			    w6 &= 0x3ffffff;
			    /* k = 7 */
			    lo = Math.imul(al7, bl0);
			    mid = Math.imul(al7, bh0);
			    mid = (mid + Math.imul(ah7, bl0)) | 0;
			    hi = Math.imul(ah7, bh0);
			    lo = (lo + Math.imul(al6, bl1)) | 0;
			    mid = (mid + Math.imul(al6, bh1)) | 0;
			    mid = (mid + Math.imul(ah6, bl1)) | 0;
			    hi = (hi + Math.imul(ah6, bh1)) | 0;
			    lo = (lo + Math.imul(al5, bl2)) | 0;
			    mid = (mid + Math.imul(al5, bh2)) | 0;
			    mid = (mid + Math.imul(ah5, bl2)) | 0;
			    hi = (hi + Math.imul(ah5, bh2)) | 0;
			    lo = (lo + Math.imul(al4, bl3)) | 0;
			    mid = (mid + Math.imul(al4, bh3)) | 0;
			    mid = (mid + Math.imul(ah4, bl3)) | 0;
			    hi = (hi + Math.imul(ah4, bh3)) | 0;
			    lo = (lo + Math.imul(al3, bl4)) | 0;
			    mid = (mid + Math.imul(al3, bh4)) | 0;
			    mid = (mid + Math.imul(ah3, bl4)) | 0;
			    hi = (hi + Math.imul(ah3, bh4)) | 0;
			    lo = (lo + Math.imul(al2, bl5)) | 0;
			    mid = (mid + Math.imul(al2, bh5)) | 0;
			    mid = (mid + Math.imul(ah2, bl5)) | 0;
			    hi = (hi + Math.imul(ah2, bh5)) | 0;
			    lo = (lo + Math.imul(al1, bl6)) | 0;
			    mid = (mid + Math.imul(al1, bh6)) | 0;
			    mid = (mid + Math.imul(ah1, bl6)) | 0;
			    hi = (hi + Math.imul(ah1, bh6)) | 0;
			    lo = (lo + Math.imul(al0, bl7)) | 0;
			    mid = (mid + Math.imul(al0, bh7)) | 0;
			    mid = (mid + Math.imul(ah0, bl7)) | 0;
			    hi = (hi + Math.imul(ah0, bh7)) | 0;
			    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
			    w7 &= 0x3ffffff;
			    /* k = 8 */
			    lo = Math.imul(al8, bl0);
			    mid = Math.imul(al8, bh0);
			    mid = (mid + Math.imul(ah8, bl0)) | 0;
			    hi = Math.imul(ah8, bh0);
			    lo = (lo + Math.imul(al7, bl1)) | 0;
			    mid = (mid + Math.imul(al7, bh1)) | 0;
			    mid = (mid + Math.imul(ah7, bl1)) | 0;
			    hi = (hi + Math.imul(ah7, bh1)) | 0;
			    lo = (lo + Math.imul(al6, bl2)) | 0;
			    mid = (mid + Math.imul(al6, bh2)) | 0;
			    mid = (mid + Math.imul(ah6, bl2)) | 0;
			    hi = (hi + Math.imul(ah6, bh2)) | 0;
			    lo = (lo + Math.imul(al5, bl3)) | 0;
			    mid = (mid + Math.imul(al5, bh3)) | 0;
			    mid = (mid + Math.imul(ah5, bl3)) | 0;
			    hi = (hi + Math.imul(ah5, bh3)) | 0;
			    lo = (lo + Math.imul(al4, bl4)) | 0;
			    mid = (mid + Math.imul(al4, bh4)) | 0;
			    mid = (mid + Math.imul(ah4, bl4)) | 0;
			    hi = (hi + Math.imul(ah4, bh4)) | 0;
			    lo = (lo + Math.imul(al3, bl5)) | 0;
			    mid = (mid + Math.imul(al3, bh5)) | 0;
			    mid = (mid + Math.imul(ah3, bl5)) | 0;
			    hi = (hi + Math.imul(ah3, bh5)) | 0;
			    lo = (lo + Math.imul(al2, bl6)) | 0;
			    mid = (mid + Math.imul(al2, bh6)) | 0;
			    mid = (mid + Math.imul(ah2, bl6)) | 0;
			    hi = (hi + Math.imul(ah2, bh6)) | 0;
			    lo = (lo + Math.imul(al1, bl7)) | 0;
			    mid = (mid + Math.imul(al1, bh7)) | 0;
			    mid = (mid + Math.imul(ah1, bl7)) | 0;
			    hi = (hi + Math.imul(ah1, bh7)) | 0;
			    lo = (lo + Math.imul(al0, bl8)) | 0;
			    mid = (mid + Math.imul(al0, bh8)) | 0;
			    mid = (mid + Math.imul(ah0, bl8)) | 0;
			    hi = (hi + Math.imul(ah0, bh8)) | 0;
			    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
			    w8 &= 0x3ffffff;
			    /* k = 9 */
			    lo = Math.imul(al9, bl0);
			    mid = Math.imul(al9, bh0);
			    mid = (mid + Math.imul(ah9, bl0)) | 0;
			    hi = Math.imul(ah9, bh0);
			    lo = (lo + Math.imul(al8, bl1)) | 0;
			    mid = (mid + Math.imul(al8, bh1)) | 0;
			    mid = (mid + Math.imul(ah8, bl1)) | 0;
			    hi = (hi + Math.imul(ah8, bh1)) | 0;
			    lo = (lo + Math.imul(al7, bl2)) | 0;
			    mid = (mid + Math.imul(al7, bh2)) | 0;
			    mid = (mid + Math.imul(ah7, bl2)) | 0;
			    hi = (hi + Math.imul(ah7, bh2)) | 0;
			    lo = (lo + Math.imul(al6, bl3)) | 0;
			    mid = (mid + Math.imul(al6, bh3)) | 0;
			    mid = (mid + Math.imul(ah6, bl3)) | 0;
			    hi = (hi + Math.imul(ah6, bh3)) | 0;
			    lo = (lo + Math.imul(al5, bl4)) | 0;
			    mid = (mid + Math.imul(al5, bh4)) | 0;
			    mid = (mid + Math.imul(ah5, bl4)) | 0;
			    hi = (hi + Math.imul(ah5, bh4)) | 0;
			    lo = (lo + Math.imul(al4, bl5)) | 0;
			    mid = (mid + Math.imul(al4, bh5)) | 0;
			    mid = (mid + Math.imul(ah4, bl5)) | 0;
			    hi = (hi + Math.imul(ah4, bh5)) | 0;
			    lo = (lo + Math.imul(al3, bl6)) | 0;
			    mid = (mid + Math.imul(al3, bh6)) | 0;
			    mid = (mid + Math.imul(ah3, bl6)) | 0;
			    hi = (hi + Math.imul(ah3, bh6)) | 0;
			    lo = (lo + Math.imul(al2, bl7)) | 0;
			    mid = (mid + Math.imul(al2, bh7)) | 0;
			    mid = (mid + Math.imul(ah2, bl7)) | 0;
			    hi = (hi + Math.imul(ah2, bh7)) | 0;
			    lo = (lo + Math.imul(al1, bl8)) | 0;
			    mid = (mid + Math.imul(al1, bh8)) | 0;
			    mid = (mid + Math.imul(ah1, bl8)) | 0;
			    hi = (hi + Math.imul(ah1, bh8)) | 0;
			    lo = (lo + Math.imul(al0, bl9)) | 0;
			    mid = (mid + Math.imul(al0, bh9)) | 0;
			    mid = (mid + Math.imul(ah0, bl9)) | 0;
			    hi = (hi + Math.imul(ah0, bh9)) | 0;
			    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
			    w9 &= 0x3ffffff;
			    /* k = 10 */
			    lo = Math.imul(al9, bl1);
			    mid = Math.imul(al9, bh1);
			    mid = (mid + Math.imul(ah9, bl1)) | 0;
			    hi = Math.imul(ah9, bh1);
			    lo = (lo + Math.imul(al8, bl2)) | 0;
			    mid = (mid + Math.imul(al8, bh2)) | 0;
			    mid = (mid + Math.imul(ah8, bl2)) | 0;
			    hi = (hi + Math.imul(ah8, bh2)) | 0;
			    lo = (lo + Math.imul(al7, bl3)) | 0;
			    mid = (mid + Math.imul(al7, bh3)) | 0;
			    mid = (mid + Math.imul(ah7, bl3)) | 0;
			    hi = (hi + Math.imul(ah7, bh3)) | 0;
			    lo = (lo + Math.imul(al6, bl4)) | 0;
			    mid = (mid + Math.imul(al6, bh4)) | 0;
			    mid = (mid + Math.imul(ah6, bl4)) | 0;
			    hi = (hi + Math.imul(ah6, bh4)) | 0;
			    lo = (lo + Math.imul(al5, bl5)) | 0;
			    mid = (mid + Math.imul(al5, bh5)) | 0;
			    mid = (mid + Math.imul(ah5, bl5)) | 0;
			    hi = (hi + Math.imul(ah5, bh5)) | 0;
			    lo = (lo + Math.imul(al4, bl6)) | 0;
			    mid = (mid + Math.imul(al4, bh6)) | 0;
			    mid = (mid + Math.imul(ah4, bl6)) | 0;
			    hi = (hi + Math.imul(ah4, bh6)) | 0;
			    lo = (lo + Math.imul(al3, bl7)) | 0;
			    mid = (mid + Math.imul(al3, bh7)) | 0;
			    mid = (mid + Math.imul(ah3, bl7)) | 0;
			    hi = (hi + Math.imul(ah3, bh7)) | 0;
			    lo = (lo + Math.imul(al2, bl8)) | 0;
			    mid = (mid + Math.imul(al2, bh8)) | 0;
			    mid = (mid + Math.imul(ah2, bl8)) | 0;
			    hi = (hi + Math.imul(ah2, bh8)) | 0;
			    lo = (lo + Math.imul(al1, bl9)) | 0;
			    mid = (mid + Math.imul(al1, bh9)) | 0;
			    mid = (mid + Math.imul(ah1, bl9)) | 0;
			    hi = (hi + Math.imul(ah1, bh9)) | 0;
			    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
			    w10 &= 0x3ffffff;
			    /* k = 11 */
			    lo = Math.imul(al9, bl2);
			    mid = Math.imul(al9, bh2);
			    mid = (mid + Math.imul(ah9, bl2)) | 0;
			    hi = Math.imul(ah9, bh2);
			    lo = (lo + Math.imul(al8, bl3)) | 0;
			    mid = (mid + Math.imul(al8, bh3)) | 0;
			    mid = (mid + Math.imul(ah8, bl3)) | 0;
			    hi = (hi + Math.imul(ah8, bh3)) | 0;
			    lo = (lo + Math.imul(al7, bl4)) | 0;
			    mid = (mid + Math.imul(al7, bh4)) | 0;
			    mid = (mid + Math.imul(ah7, bl4)) | 0;
			    hi = (hi + Math.imul(ah7, bh4)) | 0;
			    lo = (lo + Math.imul(al6, bl5)) | 0;
			    mid = (mid + Math.imul(al6, bh5)) | 0;
			    mid = (mid + Math.imul(ah6, bl5)) | 0;
			    hi = (hi + Math.imul(ah6, bh5)) | 0;
			    lo = (lo + Math.imul(al5, bl6)) | 0;
			    mid = (mid + Math.imul(al5, bh6)) | 0;
			    mid = (mid + Math.imul(ah5, bl6)) | 0;
			    hi = (hi + Math.imul(ah5, bh6)) | 0;
			    lo = (lo + Math.imul(al4, bl7)) | 0;
			    mid = (mid + Math.imul(al4, bh7)) | 0;
			    mid = (mid + Math.imul(ah4, bl7)) | 0;
			    hi = (hi + Math.imul(ah4, bh7)) | 0;
			    lo = (lo + Math.imul(al3, bl8)) | 0;
			    mid = (mid + Math.imul(al3, bh8)) | 0;
			    mid = (mid + Math.imul(ah3, bl8)) | 0;
			    hi = (hi + Math.imul(ah3, bh8)) | 0;
			    lo = (lo + Math.imul(al2, bl9)) | 0;
			    mid = (mid + Math.imul(al2, bh9)) | 0;
			    mid = (mid + Math.imul(ah2, bl9)) | 0;
			    hi = (hi + Math.imul(ah2, bh9)) | 0;
			    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
			    w11 &= 0x3ffffff;
			    /* k = 12 */
			    lo = Math.imul(al9, bl3);
			    mid = Math.imul(al9, bh3);
			    mid = (mid + Math.imul(ah9, bl3)) | 0;
			    hi = Math.imul(ah9, bh3);
			    lo = (lo + Math.imul(al8, bl4)) | 0;
			    mid = (mid + Math.imul(al8, bh4)) | 0;
			    mid = (mid + Math.imul(ah8, bl4)) | 0;
			    hi = (hi + Math.imul(ah8, bh4)) | 0;
			    lo = (lo + Math.imul(al7, bl5)) | 0;
			    mid = (mid + Math.imul(al7, bh5)) | 0;
			    mid = (mid + Math.imul(ah7, bl5)) | 0;
			    hi = (hi + Math.imul(ah7, bh5)) | 0;
			    lo = (lo + Math.imul(al6, bl6)) | 0;
			    mid = (mid + Math.imul(al6, bh6)) | 0;
			    mid = (mid + Math.imul(ah6, bl6)) | 0;
			    hi = (hi + Math.imul(ah6, bh6)) | 0;
			    lo = (lo + Math.imul(al5, bl7)) | 0;
			    mid = (mid + Math.imul(al5, bh7)) | 0;
			    mid = (mid + Math.imul(ah5, bl7)) | 0;
			    hi = (hi + Math.imul(ah5, bh7)) | 0;
			    lo = (lo + Math.imul(al4, bl8)) | 0;
			    mid = (mid + Math.imul(al4, bh8)) | 0;
			    mid = (mid + Math.imul(ah4, bl8)) | 0;
			    hi = (hi + Math.imul(ah4, bh8)) | 0;
			    lo = (lo + Math.imul(al3, bl9)) | 0;
			    mid = (mid + Math.imul(al3, bh9)) | 0;
			    mid = (mid + Math.imul(ah3, bl9)) | 0;
			    hi = (hi + Math.imul(ah3, bh9)) | 0;
			    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
			    w12 &= 0x3ffffff;
			    /* k = 13 */
			    lo = Math.imul(al9, bl4);
			    mid = Math.imul(al9, bh4);
			    mid = (mid + Math.imul(ah9, bl4)) | 0;
			    hi = Math.imul(ah9, bh4);
			    lo = (lo + Math.imul(al8, bl5)) | 0;
			    mid = (mid + Math.imul(al8, bh5)) | 0;
			    mid = (mid + Math.imul(ah8, bl5)) | 0;
			    hi = (hi + Math.imul(ah8, bh5)) | 0;
			    lo = (lo + Math.imul(al7, bl6)) | 0;
			    mid = (mid + Math.imul(al7, bh6)) | 0;
			    mid = (mid + Math.imul(ah7, bl6)) | 0;
			    hi = (hi + Math.imul(ah7, bh6)) | 0;
			    lo = (lo + Math.imul(al6, bl7)) | 0;
			    mid = (mid + Math.imul(al6, bh7)) | 0;
			    mid = (mid + Math.imul(ah6, bl7)) | 0;
			    hi = (hi + Math.imul(ah6, bh7)) | 0;
			    lo = (lo + Math.imul(al5, bl8)) | 0;
			    mid = (mid + Math.imul(al5, bh8)) | 0;
			    mid = (mid + Math.imul(ah5, bl8)) | 0;
			    hi = (hi + Math.imul(ah5, bh8)) | 0;
			    lo = (lo + Math.imul(al4, bl9)) | 0;
			    mid = (mid + Math.imul(al4, bh9)) | 0;
			    mid = (mid + Math.imul(ah4, bl9)) | 0;
			    hi = (hi + Math.imul(ah4, bh9)) | 0;
			    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
			    w13 &= 0x3ffffff;
			    /* k = 14 */
			    lo = Math.imul(al9, bl5);
			    mid = Math.imul(al9, bh5);
			    mid = (mid + Math.imul(ah9, bl5)) | 0;
			    hi = Math.imul(ah9, bh5);
			    lo = (lo + Math.imul(al8, bl6)) | 0;
			    mid = (mid + Math.imul(al8, bh6)) | 0;
			    mid = (mid + Math.imul(ah8, bl6)) | 0;
			    hi = (hi + Math.imul(ah8, bh6)) | 0;
			    lo = (lo + Math.imul(al7, bl7)) | 0;
			    mid = (mid + Math.imul(al7, bh7)) | 0;
			    mid = (mid + Math.imul(ah7, bl7)) | 0;
			    hi = (hi + Math.imul(ah7, bh7)) | 0;
			    lo = (lo + Math.imul(al6, bl8)) | 0;
			    mid = (mid + Math.imul(al6, bh8)) | 0;
			    mid = (mid + Math.imul(ah6, bl8)) | 0;
			    hi = (hi + Math.imul(ah6, bh8)) | 0;
			    lo = (lo + Math.imul(al5, bl9)) | 0;
			    mid = (mid + Math.imul(al5, bh9)) | 0;
			    mid = (mid + Math.imul(ah5, bl9)) | 0;
			    hi = (hi + Math.imul(ah5, bh9)) | 0;
			    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
			    w14 &= 0x3ffffff;
			    /* k = 15 */
			    lo = Math.imul(al9, bl6);
			    mid = Math.imul(al9, bh6);
			    mid = (mid + Math.imul(ah9, bl6)) | 0;
			    hi = Math.imul(ah9, bh6);
			    lo = (lo + Math.imul(al8, bl7)) | 0;
			    mid = (mid + Math.imul(al8, bh7)) | 0;
			    mid = (mid + Math.imul(ah8, bl7)) | 0;
			    hi = (hi + Math.imul(ah8, bh7)) | 0;
			    lo = (lo + Math.imul(al7, bl8)) | 0;
			    mid = (mid + Math.imul(al7, bh8)) | 0;
			    mid = (mid + Math.imul(ah7, bl8)) | 0;
			    hi = (hi + Math.imul(ah7, bh8)) | 0;
			    lo = (lo + Math.imul(al6, bl9)) | 0;
			    mid = (mid + Math.imul(al6, bh9)) | 0;
			    mid = (mid + Math.imul(ah6, bl9)) | 0;
			    hi = (hi + Math.imul(ah6, bh9)) | 0;
			    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
			    w15 &= 0x3ffffff;
			    /* k = 16 */
			    lo = Math.imul(al9, bl7);
			    mid = Math.imul(al9, bh7);
			    mid = (mid + Math.imul(ah9, bl7)) | 0;
			    hi = Math.imul(ah9, bh7);
			    lo = (lo + Math.imul(al8, bl8)) | 0;
			    mid = (mid + Math.imul(al8, bh8)) | 0;
			    mid = (mid + Math.imul(ah8, bl8)) | 0;
			    hi = (hi + Math.imul(ah8, bh8)) | 0;
			    lo = (lo + Math.imul(al7, bl9)) | 0;
			    mid = (mid + Math.imul(al7, bh9)) | 0;
			    mid = (mid + Math.imul(ah7, bl9)) | 0;
			    hi = (hi + Math.imul(ah7, bh9)) | 0;
			    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
			    w16 &= 0x3ffffff;
			    /* k = 17 */
			    lo = Math.imul(al9, bl8);
			    mid = Math.imul(al9, bh8);
			    mid = (mid + Math.imul(ah9, bl8)) | 0;
			    hi = Math.imul(ah9, bh8);
			    lo = (lo + Math.imul(al8, bl9)) | 0;
			    mid = (mid + Math.imul(al8, bh9)) | 0;
			    mid = (mid + Math.imul(ah8, bl9)) | 0;
			    hi = (hi + Math.imul(ah8, bh9)) | 0;
			    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
			    w17 &= 0x3ffffff;
			    /* k = 18 */
			    lo = Math.imul(al9, bl9);
			    mid = Math.imul(al9, bh9);
			    mid = (mid + Math.imul(ah9, bl9)) | 0;
			    hi = Math.imul(ah9, bh9);
			    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
			    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
			    w18 &= 0x3ffffff;
			    o[0] = w0;
			    o[1] = w1;
			    o[2] = w2;
			    o[3] = w3;
			    o[4] = w4;
			    o[5] = w5;
			    o[6] = w6;
			    o[7] = w7;
			    o[8] = w8;
			    o[9] = w9;
			    o[10] = w10;
			    o[11] = w11;
			    o[12] = w12;
			    o[13] = w13;
			    o[14] = w14;
			    o[15] = w15;
			    o[16] = w16;
			    o[17] = w17;
			    o[18] = w18;
			    if (c !== 0) {
			      o[19] = c;
			      out.length++;
			    }
			    return out;
			  };

			  // Polyfill comb
			  if (!Math.imul) {
			    comb10MulTo = smallMulTo;
			  }

			  function bigMulTo (self, num, out) {
			    out.negative = num.negative ^ self.negative;
			    out.length = self.length + num.length;

			    var carry = 0;
			    var hncarry = 0;
			    for (var k = 0; k < out.length - 1; k++) {
			      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
			      // note that ncarry could be >= 0x3ffffff
			      var ncarry = hncarry;
			      hncarry = 0;
			      var rword = carry & 0x3ffffff;
			      var maxJ = Math.min(k, num.length - 1);
			      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
			        var i = k - j;
			        var a = self.words[i] | 0;
			        var b = num.words[j] | 0;
			        var r = a * b;

			        var lo = r & 0x3ffffff;
			        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
			        lo = (lo + rword) | 0;
			        rword = lo & 0x3ffffff;
			        ncarry = (ncarry + (lo >>> 26)) | 0;

			        hncarry += ncarry >>> 26;
			        ncarry &= 0x3ffffff;
			      }
			      out.words[k] = rword;
			      carry = ncarry;
			      ncarry = hncarry;
			    }
			    if (carry !== 0) {
			      out.words[k] = carry;
			    } else {
			      out.length--;
			    }

			    return out._strip();
			  }

			  function jumboMulTo (self, num, out) {
			    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
			    // var fftm = new FFTM();
			    // return fftm.mulp(self, num, out);
			    return bigMulTo(self, num, out);
			  }

			  BN.prototype.mulTo = function mulTo (num, out) {
			    var res;
			    var len = this.length + num.length;
			    if (this.length === 10 && num.length === 10) {
			      res = comb10MulTo(this, num, out);
			    } else if (len < 63) {
			      res = smallMulTo(this, num, out);
			    } else if (len < 1024) {
			      res = bigMulTo(this, num, out);
			    } else {
			      res = jumboMulTo(this, num, out);
			    }

			    return res;
			  };

			  // Multiply `this` by `num`
			  BN.prototype.mul = function mul (num) {
			    var out = new BN(null);
			    out.words = new Array(this.length + num.length);
			    return this.mulTo(num, out);
			  };

			  // Multiply employing FFT
			  BN.prototype.mulf = function mulf (num) {
			    var out = new BN(null);
			    out.words = new Array(this.length + num.length);
			    return jumboMulTo(this, num, out);
			  };

			  // In-place Multiplication
			  BN.prototype.imul = function imul (num) {
			    return this.clone().mulTo(num, this);
			  };

			  BN.prototype.imuln = function imuln (num) {
			    var isNegNum = num < 0;
			    if (isNegNum) num = -num;

			    assert(typeof num === 'number');
			    assert(num < 0x4000000);

			    // Carry
			    var carry = 0;
			    for (var i = 0; i < this.length; i++) {
			      var w = (this.words[i] | 0) * num;
			      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
			      carry >>= 26;
			      carry += (w / 0x4000000) | 0;
			      // NOTE: lo is 27bit maximum
			      carry += lo >>> 26;
			      this.words[i] = lo & 0x3ffffff;
			    }

			    if (carry !== 0) {
			      this.words[i] = carry;
			      this.length++;
			    }

			    return isNegNum ? this.ineg() : this;
			  };

			  BN.prototype.muln = function muln (num) {
			    return this.clone().imuln(num);
			  };

			  // `this` * `this`
			  BN.prototype.sqr = function sqr () {
			    return this.mul(this);
			  };

			  // `this` * `this` in-place
			  BN.prototype.isqr = function isqr () {
			    return this.imul(this.clone());
			  };

			  // Math.pow(`this`, `num`)
			  BN.prototype.pow = function pow (num) {
			    var w = toBitArray(num);
			    if (w.length === 0) return new BN(1);

			    // Skip leading zeroes
			    var res = this;
			    for (var i = 0; i < w.length; i++, res = res.sqr()) {
			      if (w[i] !== 0) break;
			    }

			    if (++i < w.length) {
			      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
			        if (w[i] === 0) continue;

			        res = res.mul(q);
			      }
			    }

			    return res;
			  };

			  // Shift-left in-place
			  BN.prototype.iushln = function iushln (bits) {
			    assert(typeof bits === 'number' && bits >= 0);
			    var r = bits % 26;
			    var s = (bits - r) / 26;
			    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
			    var i;

			    if (r !== 0) {
			      var carry = 0;

			      for (i = 0; i < this.length; i++) {
			        var newCarry = this.words[i] & carryMask;
			        var c = ((this.words[i] | 0) - newCarry) << r;
			        this.words[i] = c | carry;
			        carry = newCarry >>> (26 - r);
			      }

			      if (carry) {
			        this.words[i] = carry;
			        this.length++;
			      }
			    }

			    if (s !== 0) {
			      for (i = this.length - 1; i >= 0; i--) {
			        this.words[i + s] = this.words[i];
			      }

			      for (i = 0; i < s; i++) {
			        this.words[i] = 0;
			      }

			      this.length += s;
			    }

			    return this._strip();
			  };

			  BN.prototype.ishln = function ishln (bits) {
			    // TODO(indutny): implement me
			    assert(this.negative === 0);
			    return this.iushln(bits);
			  };

			  // Shift-right in-place
			  // NOTE: `hint` is a lowest bit before trailing zeroes
			  // NOTE: if `extended` is present - it will be filled with destroyed bits
			  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
			    assert(typeof bits === 'number' && bits >= 0);
			    var h;
			    if (hint) {
			      h = (hint - (hint % 26)) / 26;
			    } else {
			      h = 0;
			    }

			    var r = bits % 26;
			    var s = Math.min((bits - r) / 26, this.length);
			    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
			    var maskedWords = extended;

			    h -= s;
			    h = Math.max(0, h);

			    // Extended mode, copy masked part
			    if (maskedWords) {
			      for (var i = 0; i < s; i++) {
			        maskedWords.words[i] = this.words[i];
			      }
			      maskedWords.length = s;
			    }

			    if (s === 0) ; else if (this.length > s) {
			      this.length -= s;
			      for (i = 0; i < this.length; i++) {
			        this.words[i] = this.words[i + s];
			      }
			    } else {
			      this.words[0] = 0;
			      this.length = 1;
			    }

			    var carry = 0;
			    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
			      var word = this.words[i] | 0;
			      this.words[i] = (carry << (26 - r)) | (word >>> r);
			      carry = word & mask;
			    }

			    // Push carried bits as a mask
			    if (maskedWords && carry !== 0) {
			      maskedWords.words[maskedWords.length++] = carry;
			    }

			    if (this.length === 0) {
			      this.words[0] = 0;
			      this.length = 1;
			    }

			    return this._strip();
			  };

			  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
			    // TODO(indutny): implement me
			    assert(this.negative === 0);
			    return this.iushrn(bits, hint, extended);
			  };

			  // Shift-left
			  BN.prototype.shln = function shln (bits) {
			    return this.clone().ishln(bits);
			  };

			  BN.prototype.ushln = function ushln (bits) {
			    return this.clone().iushln(bits);
			  };

			  // Shift-right
			  BN.prototype.shrn = function shrn (bits) {
			    return this.clone().ishrn(bits);
			  };

			  BN.prototype.ushrn = function ushrn (bits) {
			    return this.clone().iushrn(bits);
			  };

			  // Test if n bit is set
			  BN.prototype.testn = function testn (bit) {
			    assert(typeof bit === 'number' && bit >= 0);
			    var r = bit % 26;
			    var s = (bit - r) / 26;
			    var q = 1 << r;

			    // Fast case: bit is much higher than all existing words
			    if (this.length <= s) return false;

			    // Check bit and return
			    var w = this.words[s];

			    return !!(w & q);
			  };

			  // Return only lowers bits of number (in-place)
			  BN.prototype.imaskn = function imaskn (bits) {
			    assert(typeof bits === 'number' && bits >= 0);
			    var r = bits % 26;
			    var s = (bits - r) / 26;

			    assert(this.negative === 0, 'imaskn works only with positive numbers');

			    if (this.length <= s) {
			      return this;
			    }

			    if (r !== 0) {
			      s++;
			    }
			    this.length = Math.min(s, this.length);

			    if (r !== 0) {
			      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
			      this.words[this.length - 1] &= mask;
			    }

			    return this._strip();
			  };

			  // Return only lowers bits of number
			  BN.prototype.maskn = function maskn (bits) {
			    return this.clone().imaskn(bits);
			  };

			  // Add plain number `num` to `this`
			  BN.prototype.iaddn = function iaddn (num) {
			    assert(typeof num === 'number');
			    assert(num < 0x4000000);
			    if (num < 0) return this.isubn(-num);

			    // Possible sign change
			    if (this.negative !== 0) {
			      if (this.length === 1 && (this.words[0] | 0) <= num) {
			        this.words[0] = num - (this.words[0] | 0);
			        this.negative = 0;
			        return this;
			      }

			      this.negative = 0;
			      this.isubn(num);
			      this.negative = 1;
			      return this;
			    }

			    // Add without checks
			    return this._iaddn(num);
			  };

			  BN.prototype._iaddn = function _iaddn (num) {
			    this.words[0] += num;

			    // Carry
			    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
			      this.words[i] -= 0x4000000;
			      if (i === this.length - 1) {
			        this.words[i + 1] = 1;
			      } else {
			        this.words[i + 1]++;
			      }
			    }
			    this.length = Math.max(this.length, i + 1);

			    return this;
			  };

			  // Subtract plain number `num` from `this`
			  BN.prototype.isubn = function isubn (num) {
			    assert(typeof num === 'number');
			    assert(num < 0x4000000);
			    if (num < 0) return this.iaddn(-num);

			    if (this.negative !== 0) {
			      this.negative = 0;
			      this.iaddn(num);
			      this.negative = 1;
			      return this;
			    }

			    this.words[0] -= num;

			    if (this.length === 1 && this.words[0] < 0) {
			      this.words[0] = -this.words[0];
			      this.negative = 1;
			    } else {
			      // Carry
			      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
			        this.words[i] += 0x4000000;
			        this.words[i + 1] -= 1;
			      }
			    }

			    return this._strip();
			  };

			  BN.prototype.addn = function addn (num) {
			    return this.clone().iaddn(num);
			  };

			  BN.prototype.subn = function subn (num) {
			    return this.clone().isubn(num);
			  };

			  BN.prototype.iabs = function iabs () {
			    this.negative = 0;

			    return this;
			  };

			  BN.prototype.abs = function abs () {
			    return this.clone().iabs();
			  };

			  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
			    var len = num.length + shift;
			    var i;

			    this._expand(len);

			    var w;
			    var carry = 0;
			    for (i = 0; i < num.length; i++) {
			      w = (this.words[i + shift] | 0) + carry;
			      var right = (num.words[i] | 0) * mul;
			      w -= right & 0x3ffffff;
			      carry = (w >> 26) - ((right / 0x4000000) | 0);
			      this.words[i + shift] = w & 0x3ffffff;
			    }
			    for (; i < this.length - shift; i++) {
			      w = (this.words[i + shift] | 0) + carry;
			      carry = w >> 26;
			      this.words[i + shift] = w & 0x3ffffff;
			    }

			    if (carry === 0) return this._strip();

			    // Subtraction overflow
			    assert(carry === -1);
			    carry = 0;
			    for (i = 0; i < this.length; i++) {
			      w = -(this.words[i] | 0) + carry;
			      carry = w >> 26;
			      this.words[i] = w & 0x3ffffff;
			    }
			    this.negative = 1;

			    return this._strip();
			  };

			  BN.prototype._wordDiv = function _wordDiv (num, mode) {
			    var shift = this.length - num.length;

			    var a = this.clone();
			    var b = num;

			    // Normalize
			    var bhi = b.words[b.length - 1] | 0;
			    var bhiBits = this._countBits(bhi);
			    shift = 26 - bhiBits;
			    if (shift !== 0) {
			      b = b.ushln(shift);
			      a.iushln(shift);
			      bhi = b.words[b.length - 1] | 0;
			    }

			    // Initialize quotient
			    var m = a.length - b.length;
			    var q;

			    if (mode !== 'mod') {
			      q = new BN(null);
			      q.length = m + 1;
			      q.words = new Array(q.length);
			      for (var i = 0; i < q.length; i++) {
			        q.words[i] = 0;
			      }
			    }

			    var diff = a.clone()._ishlnsubmul(b, 1, m);
			    if (diff.negative === 0) {
			      a = diff;
			      if (q) {
			        q.words[m] = 1;
			      }
			    }

			    for (var j = m - 1; j >= 0; j--) {
			      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
			        (a.words[b.length + j - 1] | 0);

			      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
			      // (0x7ffffff)
			      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

			      a._ishlnsubmul(b, qj, j);
			      while (a.negative !== 0) {
			        qj--;
			        a.negative = 0;
			        a._ishlnsubmul(b, 1, j);
			        if (!a.isZero()) {
			          a.negative ^= 1;
			        }
			      }
			      if (q) {
			        q.words[j] = qj;
			      }
			    }
			    if (q) {
			      q._strip();
			    }
			    a._strip();

			    // Denormalize
			    if (mode !== 'div' && shift !== 0) {
			      a.iushrn(shift);
			    }

			    return {
			      div: q || null,
			      mod: a
			    };
			  };

			  // NOTE: 1) `mode` can be set to `mod` to request mod only,
			  //       to `div` to request div only, or be absent to
			  //       request both div & mod
			  //       2) `positive` is true if unsigned mod is requested
			  BN.prototype.divmod = function divmod (num, mode, positive) {
			    assert(!num.isZero());

			    if (this.isZero()) {
			      return {
			        div: new BN(0),
			        mod: new BN(0)
			      };
			    }

			    var div, mod, res;
			    if (this.negative !== 0 && num.negative === 0) {
			      res = this.neg().divmod(num, mode);

			      if (mode !== 'mod') {
			        div = res.div.neg();
			      }

			      if (mode !== 'div') {
			        mod = res.mod.neg();
			        if (positive && mod.negative !== 0) {
			          mod.iadd(num);
			        }
			      }

			      return {
			        div: div,
			        mod: mod
			      };
			    }

			    if (this.negative === 0 && num.negative !== 0) {
			      res = this.divmod(num.neg(), mode);

			      if (mode !== 'mod') {
			        div = res.div.neg();
			      }

			      return {
			        div: div,
			        mod: res.mod
			      };
			    }

			    if ((this.negative & num.negative) !== 0) {
			      res = this.neg().divmod(num.neg(), mode);

			      if (mode !== 'div') {
			        mod = res.mod.neg();
			        if (positive && mod.negative !== 0) {
			          mod.isub(num);
			        }
			      }

			      return {
			        div: res.div,
			        mod: mod
			      };
			    }

			    // Both numbers are positive at this point

			    // Strip both numbers to approximate shift value
			    if (num.length > this.length || this.cmp(num) < 0) {
			      return {
			        div: new BN(0),
			        mod: this
			      };
			    }

			    // Very short reduction
			    if (num.length === 1) {
			      if (mode === 'div') {
			        return {
			          div: this.divn(num.words[0]),
			          mod: null
			        };
			      }

			      if (mode === 'mod') {
			        return {
			          div: null,
			          mod: new BN(this.modrn(num.words[0]))
			        };
			      }

			      return {
			        div: this.divn(num.words[0]),
			        mod: new BN(this.modrn(num.words[0]))
			      };
			    }

			    return this._wordDiv(num, mode);
			  };

			  // Find `this` / `num`
			  BN.prototype.div = function div (num) {
			    return this.divmod(num, 'div', false).div;
			  };

			  // Find `this` % `num`
			  BN.prototype.mod = function mod (num) {
			    return this.divmod(num, 'mod', false).mod;
			  };

			  BN.prototype.umod = function umod (num) {
			    return this.divmod(num, 'mod', true).mod;
			  };

			  // Find Round(`this` / `num`)
			  BN.prototype.divRound = function divRound (num) {
			    var dm = this.divmod(num);

			    // Fast case - exact division
			    if (dm.mod.isZero()) return dm.div;

			    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

			    var half = num.ushrn(1);
			    var r2 = num.andln(1);
			    var cmp = mod.cmp(half);

			    // Round down
			    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

			    // Round up
			    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
			  };

			  BN.prototype.modrn = function modrn (num) {
			    var isNegNum = num < 0;
			    if (isNegNum) num = -num;

			    assert(num <= 0x3ffffff);
			    var p = (1 << 26) % num;

			    var acc = 0;
			    for (var i = this.length - 1; i >= 0; i--) {
			      acc = (p * acc + (this.words[i] | 0)) % num;
			    }

			    return isNegNum ? -acc : acc;
			  };

			  // WARNING: DEPRECATED
			  BN.prototype.modn = function modn (num) {
			    return this.modrn(num);
			  };

			  // In-place division by number
			  BN.prototype.idivn = function idivn (num) {
			    var isNegNum = num < 0;
			    if (isNegNum) num = -num;

			    assert(num <= 0x3ffffff);

			    var carry = 0;
			    for (var i = this.length - 1; i >= 0; i--) {
			      var w = (this.words[i] | 0) + carry * 0x4000000;
			      this.words[i] = (w / num) | 0;
			      carry = w % num;
			    }

			    this._strip();
			    return isNegNum ? this.ineg() : this;
			  };

			  BN.prototype.divn = function divn (num) {
			    return this.clone().idivn(num);
			  };

			  BN.prototype.egcd = function egcd (p) {
			    assert(p.negative === 0);
			    assert(!p.isZero());

			    var x = this;
			    var y = p.clone();

			    if (x.negative !== 0) {
			      x = x.umod(p);
			    } else {
			      x = x.clone();
			    }

			    // A * x + B * y = x
			    var A = new BN(1);
			    var B = new BN(0);

			    // C * x + D * y = y
			    var C = new BN(0);
			    var D = new BN(1);

			    var g = 0;

			    while (x.isEven() && y.isEven()) {
			      x.iushrn(1);
			      y.iushrn(1);
			      ++g;
			    }

			    var yp = y.clone();
			    var xp = x.clone();

			    while (!x.isZero()) {
			      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
			      if (i > 0) {
			        x.iushrn(i);
			        while (i-- > 0) {
			          if (A.isOdd() || B.isOdd()) {
			            A.iadd(yp);
			            B.isub(xp);
			          }

			          A.iushrn(1);
			          B.iushrn(1);
			        }
			      }

			      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
			      if (j > 0) {
			        y.iushrn(j);
			        while (j-- > 0) {
			          if (C.isOdd() || D.isOdd()) {
			            C.iadd(yp);
			            D.isub(xp);
			          }

			          C.iushrn(1);
			          D.iushrn(1);
			        }
			      }

			      if (x.cmp(y) >= 0) {
			        x.isub(y);
			        A.isub(C);
			        B.isub(D);
			      } else {
			        y.isub(x);
			        C.isub(A);
			        D.isub(B);
			      }
			    }

			    return {
			      a: C,
			      b: D,
			      gcd: y.iushln(g)
			    };
			  };

			  // This is reduced incarnation of the binary EEA
			  // above, designated to invert members of the
			  // _prime_ fields F(p) at a maximal speed
			  BN.prototype._invmp = function _invmp (p) {
			    assert(p.negative === 0);
			    assert(!p.isZero());

			    var a = this;
			    var b = p.clone();

			    if (a.negative !== 0) {
			      a = a.umod(p);
			    } else {
			      a = a.clone();
			    }

			    var x1 = new BN(1);
			    var x2 = new BN(0);

			    var delta = b.clone();

			    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
			      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
			      if (i > 0) {
			        a.iushrn(i);
			        while (i-- > 0) {
			          if (x1.isOdd()) {
			            x1.iadd(delta);
			          }

			          x1.iushrn(1);
			        }
			      }

			      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
			      if (j > 0) {
			        b.iushrn(j);
			        while (j-- > 0) {
			          if (x2.isOdd()) {
			            x2.iadd(delta);
			          }

			          x2.iushrn(1);
			        }
			      }

			      if (a.cmp(b) >= 0) {
			        a.isub(b);
			        x1.isub(x2);
			      } else {
			        b.isub(a);
			        x2.isub(x1);
			      }
			    }

			    var res;
			    if (a.cmpn(1) === 0) {
			      res = x1;
			    } else {
			      res = x2;
			    }

			    if (res.cmpn(0) < 0) {
			      res.iadd(p);
			    }

			    return res;
			  };

			  BN.prototype.gcd = function gcd (num) {
			    if (this.isZero()) return num.abs();
			    if (num.isZero()) return this.abs();

			    var a = this.clone();
			    var b = num.clone();
			    a.negative = 0;
			    b.negative = 0;

			    // Remove common factor of two
			    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
			      a.iushrn(1);
			      b.iushrn(1);
			    }

			    do {
			      while (a.isEven()) {
			        a.iushrn(1);
			      }
			      while (b.isEven()) {
			        b.iushrn(1);
			      }

			      var r = a.cmp(b);
			      if (r < 0) {
			        // Swap `a` and `b` to make `a` always bigger than `b`
			        var t = a;
			        a = b;
			        b = t;
			      } else if (r === 0 || b.cmpn(1) === 0) {
			        break;
			      }

			      a.isub(b);
			    } while (true);

			    return b.iushln(shift);
			  };

			  // Invert number in the field F(num)
			  BN.prototype.invm = function invm (num) {
			    return this.egcd(num).a.umod(num);
			  };

			  BN.prototype.isEven = function isEven () {
			    return (this.words[0] & 1) === 0;
			  };

			  BN.prototype.isOdd = function isOdd () {
			    return (this.words[0] & 1) === 1;
			  };

			  // And first word and num
			  BN.prototype.andln = function andln (num) {
			    return this.words[0] & num;
			  };

			  // Increment at the bit position in-line
			  BN.prototype.bincn = function bincn (bit) {
			    assert(typeof bit === 'number');
			    var r = bit % 26;
			    var s = (bit - r) / 26;
			    var q = 1 << r;

			    // Fast case: bit is much higher than all existing words
			    if (this.length <= s) {
			      this._expand(s + 1);
			      this.words[s] |= q;
			      return this;
			    }

			    // Add bit and propagate, if needed
			    var carry = q;
			    for (var i = s; carry !== 0 && i < this.length; i++) {
			      var w = this.words[i] | 0;
			      w += carry;
			      carry = w >>> 26;
			      w &= 0x3ffffff;
			      this.words[i] = w;
			    }
			    if (carry !== 0) {
			      this.words[i] = carry;
			      this.length++;
			    }
			    return this;
			  };

			  BN.prototype.isZero = function isZero () {
			    return this.length === 1 && this.words[0] === 0;
			  };

			  BN.prototype.cmpn = function cmpn (num) {
			    var negative = num < 0;

			    if (this.negative !== 0 && !negative) return -1;
			    if (this.negative === 0 && negative) return 1;

			    this._strip();

			    var res;
			    if (this.length > 1) {
			      res = 1;
			    } else {
			      if (negative) {
			        num = -num;
			      }

			      assert(num <= 0x3ffffff, 'Number is too big');

			      var w = this.words[0] | 0;
			      res = w === num ? 0 : w < num ? -1 : 1;
			    }
			    if (this.negative !== 0) return -res | 0;
			    return res;
			  };

			  // Compare two numbers and return:
			  // 1 - if `this` > `num`
			  // 0 - if `this` == `num`
			  // -1 - if `this` < `num`
			  BN.prototype.cmp = function cmp (num) {
			    if (this.negative !== 0 && num.negative === 0) return -1;
			    if (this.negative === 0 && num.negative !== 0) return 1;

			    var res = this.ucmp(num);
			    if (this.negative !== 0) return -res | 0;
			    return res;
			  };

			  // Unsigned comparison
			  BN.prototype.ucmp = function ucmp (num) {
			    // At this point both numbers have the same sign
			    if (this.length > num.length) return 1;
			    if (this.length < num.length) return -1;

			    var res = 0;
			    for (var i = this.length - 1; i >= 0; i--) {
			      var a = this.words[i] | 0;
			      var b = num.words[i] | 0;

			      if (a === b) continue;
			      if (a < b) {
			        res = -1;
			      } else if (a > b) {
			        res = 1;
			      }
			      break;
			    }
			    return res;
			  };

			  BN.prototype.gtn = function gtn (num) {
			    return this.cmpn(num) === 1;
			  };

			  BN.prototype.gt = function gt (num) {
			    return this.cmp(num) === 1;
			  };

			  BN.prototype.gten = function gten (num) {
			    return this.cmpn(num) >= 0;
			  };

			  BN.prototype.gte = function gte (num) {
			    return this.cmp(num) >= 0;
			  };

			  BN.prototype.ltn = function ltn (num) {
			    return this.cmpn(num) === -1;
			  };

			  BN.prototype.lt = function lt (num) {
			    return this.cmp(num) === -1;
			  };

			  BN.prototype.lten = function lten (num) {
			    return this.cmpn(num) <= 0;
			  };

			  BN.prototype.lte = function lte (num) {
			    return this.cmp(num) <= 0;
			  };

			  BN.prototype.eqn = function eqn (num) {
			    return this.cmpn(num) === 0;
			  };

			  BN.prototype.eq = function eq (num) {
			    return this.cmp(num) === 0;
			  };

			  //
			  // A reduce context, could be using montgomery or something better, depending
			  // on the `m` itself.
			  //
			  BN.red = function red (num) {
			    return new Red(num);
			  };

			  BN.prototype.toRed = function toRed (ctx) {
			    assert(!this.red, 'Already a number in reduction context');
			    assert(this.negative === 0, 'red works only with positives');
			    return ctx.convertTo(this)._forceRed(ctx);
			  };

			  BN.prototype.fromRed = function fromRed () {
			    assert(this.red, 'fromRed works only with numbers in reduction context');
			    return this.red.convertFrom(this);
			  };

			  BN.prototype._forceRed = function _forceRed (ctx) {
			    this.red = ctx;
			    return this;
			  };

			  BN.prototype.forceRed = function forceRed (ctx) {
			    assert(!this.red, 'Already a number in reduction context');
			    return this._forceRed(ctx);
			  };

			  BN.prototype.redAdd = function redAdd (num) {
			    assert(this.red, 'redAdd works only with red numbers');
			    return this.red.add(this, num);
			  };

			  BN.prototype.redIAdd = function redIAdd (num) {
			    assert(this.red, 'redIAdd works only with red numbers');
			    return this.red.iadd(this, num);
			  };

			  BN.prototype.redSub = function redSub (num) {
			    assert(this.red, 'redSub works only with red numbers');
			    return this.red.sub(this, num);
			  };

			  BN.prototype.redISub = function redISub (num) {
			    assert(this.red, 'redISub works only with red numbers');
			    return this.red.isub(this, num);
			  };

			  BN.prototype.redShl = function redShl (num) {
			    assert(this.red, 'redShl works only with red numbers');
			    return this.red.shl(this, num);
			  };

			  BN.prototype.redMul = function redMul (num) {
			    assert(this.red, 'redMul works only with red numbers');
			    this.red._verify2(this, num);
			    return this.red.mul(this, num);
			  };

			  BN.prototype.redIMul = function redIMul (num) {
			    assert(this.red, 'redMul works only with red numbers');
			    this.red._verify2(this, num);
			    return this.red.imul(this, num);
			  };

			  BN.prototype.redSqr = function redSqr () {
			    assert(this.red, 'redSqr works only with red numbers');
			    this.red._verify1(this);
			    return this.red.sqr(this);
			  };

			  BN.prototype.redISqr = function redISqr () {
			    assert(this.red, 'redISqr works only with red numbers');
			    this.red._verify1(this);
			    return this.red.isqr(this);
			  };

			  // Square root over p
			  BN.prototype.redSqrt = function redSqrt () {
			    assert(this.red, 'redSqrt works only with red numbers');
			    this.red._verify1(this);
			    return this.red.sqrt(this);
			  };

			  BN.prototype.redInvm = function redInvm () {
			    assert(this.red, 'redInvm works only with red numbers');
			    this.red._verify1(this);
			    return this.red.invm(this);
			  };

			  // Return negative clone of `this` % `red modulo`
			  BN.prototype.redNeg = function redNeg () {
			    assert(this.red, 'redNeg works only with red numbers');
			    this.red._verify1(this);
			    return this.red.neg(this);
			  };

			  BN.prototype.redPow = function redPow (num) {
			    assert(this.red && !num.red, 'redPow(normalNum)');
			    this.red._verify1(this);
			    return this.red.pow(this, num);
			  };

			  // Prime numbers with efficient reduction
			  var primes = {
			    k256: null,
			    p224: null,
			    p192: null,
			    p25519: null
			  };

			  // Pseudo-Mersenne prime
			  function MPrime (name, p) {
			    // P = 2 ^ N - K
			    this.name = name;
			    this.p = new BN(p, 16);
			    this.n = this.p.bitLength();
			    this.k = new BN(1).iushln(this.n).isub(this.p);

			    this.tmp = this._tmp();
			  }

			  MPrime.prototype._tmp = function _tmp () {
			    var tmp = new BN(null);
			    tmp.words = new Array(Math.ceil(this.n / 13));
			    return tmp;
			  };

			  MPrime.prototype.ireduce = function ireduce (num) {
			    // Assumes that `num` is less than `P^2`
			    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
			    var r = num;
			    var rlen;

			    do {
			      this.split(r, this.tmp);
			      r = this.imulK(r);
			      r = r.iadd(this.tmp);
			      rlen = r.bitLength();
			    } while (rlen > this.n);

			    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
			    if (cmp === 0) {
			      r.words[0] = 0;
			      r.length = 1;
			    } else if (cmp > 0) {
			      r.isub(this.p);
			    } else {
			      if (r.strip !== undefined) {
			        // r is a BN v4 instance
			        r.strip();
			      } else {
			        // r is a BN v5 instance
			        r._strip();
			      }
			    }

			    return r;
			  };

			  MPrime.prototype.split = function split (input, out) {
			    input.iushrn(this.n, 0, out);
			  };

			  MPrime.prototype.imulK = function imulK (num) {
			    return num.imul(this.k);
			  };

			  function K256 () {
			    MPrime.call(
			      this,
			      'k256',
			      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
			  }
			  inherits(K256, MPrime);

			  K256.prototype.split = function split (input, output) {
			    // 256 = 9 * 26 + 22
			    var mask = 0x3fffff;

			    var outLen = Math.min(input.length, 9);
			    for (var i = 0; i < outLen; i++) {
			      output.words[i] = input.words[i];
			    }
			    output.length = outLen;

			    if (input.length <= 9) {
			      input.words[0] = 0;
			      input.length = 1;
			      return;
			    }

			    // Shift by 9 limbs
			    var prev = input.words[9];
			    output.words[output.length++] = prev & mask;

			    for (i = 10; i < input.length; i++) {
			      var next = input.words[i] | 0;
			      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
			      prev = next;
			    }
			    prev >>>= 22;
			    input.words[i - 10] = prev;
			    if (prev === 0 && input.length > 10) {
			      input.length -= 10;
			    } else {
			      input.length -= 9;
			    }
			  };

			  K256.prototype.imulK = function imulK (num) {
			    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
			    num.words[num.length] = 0;
			    num.words[num.length + 1] = 0;
			    num.length += 2;

			    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
			    var lo = 0;
			    for (var i = 0; i < num.length; i++) {
			      var w = num.words[i] | 0;
			      lo += w * 0x3d1;
			      num.words[i] = lo & 0x3ffffff;
			      lo = w * 0x40 + ((lo / 0x4000000) | 0);
			    }

			    // Fast length reduction
			    if (num.words[num.length - 1] === 0) {
			      num.length--;
			      if (num.words[num.length - 1] === 0) {
			        num.length--;
			      }
			    }
			    return num;
			  };

			  function P224 () {
			    MPrime.call(
			      this,
			      'p224',
			      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
			  }
			  inherits(P224, MPrime);

			  function P192 () {
			    MPrime.call(
			      this,
			      'p192',
			      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
			  }
			  inherits(P192, MPrime);

			  function P25519 () {
			    // 2 ^ 255 - 19
			    MPrime.call(
			      this,
			      '25519',
			      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
			  }
			  inherits(P25519, MPrime);

			  P25519.prototype.imulK = function imulK (num) {
			    // K = 0x13
			    var carry = 0;
			    for (var i = 0; i < num.length; i++) {
			      var hi = (num.words[i] | 0) * 0x13 + carry;
			      var lo = hi & 0x3ffffff;
			      hi >>>= 26;

			      num.words[i] = lo;
			      carry = hi;
			    }
			    if (carry !== 0) {
			      num.words[num.length++] = carry;
			    }
			    return num;
			  };

			  // Exported mostly for testing purposes, use plain name instead
			  BN._prime = function prime (name) {
			    // Cached version of prime
			    if (primes[name]) return primes[name];

			    var prime;
			    if (name === 'k256') {
			      prime = new K256();
			    } else if (name === 'p224') {
			      prime = new P224();
			    } else if (name === 'p192') {
			      prime = new P192();
			    } else if (name === 'p25519') {
			      prime = new P25519();
			    } else {
			      throw new Error('Unknown prime ' + name);
			    }
			    primes[name] = prime;

			    return prime;
			  };

			  //
			  // Base reduction engine
			  //
			  function Red (m) {
			    if (typeof m === 'string') {
			      var prime = BN._prime(m);
			      this.m = prime.p;
			      this.prime = prime;
			    } else {
			      assert(m.gtn(1), 'modulus must be greater than 1');
			      this.m = m;
			      this.prime = null;
			    }
			  }

			  Red.prototype._verify1 = function _verify1 (a) {
			    assert(a.negative === 0, 'red works only with positives');
			    assert(a.red, 'red works only with red numbers');
			  };

			  Red.prototype._verify2 = function _verify2 (a, b) {
			    assert((a.negative | b.negative) === 0, 'red works only with positives');
			    assert(a.red && a.red === b.red,
			      'red works only with red numbers');
			  };

			  Red.prototype.imod = function imod (a) {
			    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

			    move(a, a.umod(this.m)._forceRed(this));
			    return a;
			  };

			  Red.prototype.neg = function neg (a) {
			    if (a.isZero()) {
			      return a.clone();
			    }

			    return this.m.sub(a)._forceRed(this);
			  };

			  Red.prototype.add = function add (a, b) {
			    this._verify2(a, b);

			    var res = a.add(b);
			    if (res.cmp(this.m) >= 0) {
			      res.isub(this.m);
			    }
			    return res._forceRed(this);
			  };

			  Red.prototype.iadd = function iadd (a, b) {
			    this._verify2(a, b);

			    var res = a.iadd(b);
			    if (res.cmp(this.m) >= 0) {
			      res.isub(this.m);
			    }
			    return res;
			  };

			  Red.prototype.sub = function sub (a, b) {
			    this._verify2(a, b);

			    var res = a.sub(b);
			    if (res.cmpn(0) < 0) {
			      res.iadd(this.m);
			    }
			    return res._forceRed(this);
			  };

			  Red.prototype.isub = function isub (a, b) {
			    this._verify2(a, b);

			    var res = a.isub(b);
			    if (res.cmpn(0) < 0) {
			      res.iadd(this.m);
			    }
			    return res;
			  };

			  Red.prototype.shl = function shl (a, num) {
			    this._verify1(a);
			    return this.imod(a.ushln(num));
			  };

			  Red.prototype.imul = function imul (a, b) {
			    this._verify2(a, b);
			    return this.imod(a.imul(b));
			  };

			  Red.prototype.mul = function mul (a, b) {
			    this._verify2(a, b);
			    return this.imod(a.mul(b));
			  };

			  Red.prototype.isqr = function isqr (a) {
			    return this.imul(a, a.clone());
			  };

			  Red.prototype.sqr = function sqr (a) {
			    return this.mul(a, a);
			  };

			  Red.prototype.sqrt = function sqrt (a) {
			    if (a.isZero()) return a.clone();

			    var mod3 = this.m.andln(3);
			    assert(mod3 % 2 === 1);

			    // Fast case
			    if (mod3 === 3) {
			      var pow = this.m.add(new BN(1)).iushrn(2);
			      return this.pow(a, pow);
			    }

			    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
			    //
			    // Find Q and S, that Q * 2 ^ S = (P - 1)
			    var q = this.m.subn(1);
			    var s = 0;
			    while (!q.isZero() && q.andln(1) === 0) {
			      s++;
			      q.iushrn(1);
			    }
			    assert(!q.isZero());

			    var one = new BN(1).toRed(this);
			    var nOne = one.redNeg();

			    // Find quadratic non-residue
			    // NOTE: Max is such because of generalized Riemann hypothesis.
			    var lpow = this.m.subn(1).iushrn(1);
			    var z = this.m.bitLength();
			    z = new BN(2 * z * z).toRed(this);

			    while (this.pow(z, lpow).cmp(nOne) !== 0) {
			      z.redIAdd(nOne);
			    }

			    var c = this.pow(z, q);
			    var r = this.pow(a, q.addn(1).iushrn(1));
			    var t = this.pow(a, q);
			    var m = s;
			    while (t.cmp(one) !== 0) {
			      var tmp = t;
			      for (var i = 0; tmp.cmp(one) !== 0; i++) {
			        tmp = tmp.redSqr();
			      }
			      assert(i < m);
			      var b = this.pow(c, new BN(1).iushln(m - i - 1));

			      r = r.redMul(b);
			      c = b.redSqr();
			      t = t.redMul(c);
			      m = i;
			    }

			    return r;
			  };

			  Red.prototype.invm = function invm (a) {
			    var inv = a._invmp(this.m);
			    if (inv.negative !== 0) {
			      inv.negative = 0;
			      return this.imod(inv).redNeg();
			    } else {
			      return this.imod(inv);
			    }
			  };

			  Red.prototype.pow = function pow (a, num) {
			    if (num.isZero()) return new BN(1).toRed(this);
			    if (num.cmpn(1) === 0) return a.clone();

			    var windowSize = 4;
			    var wnd = new Array(1 << windowSize);
			    wnd[0] = new BN(1).toRed(this);
			    wnd[1] = a;
			    for (var i = 2; i < wnd.length; i++) {
			      wnd[i] = this.mul(wnd[i - 1], a);
			    }

			    var res = wnd[0];
			    var current = 0;
			    var currentLen = 0;
			    var start = num.bitLength() % 26;
			    if (start === 0) {
			      start = 26;
			    }

			    for (i = num.length - 1; i >= 0; i--) {
			      var word = num.words[i];
			      for (var j = start - 1; j >= 0; j--) {
			        var bit = (word >> j) & 1;
			        if (res !== wnd[0]) {
			          res = this.sqr(res);
			        }

			        if (bit === 0 && current === 0) {
			          currentLen = 0;
			          continue;
			        }

			        current <<= 1;
			        current |= bit;
			        currentLen++;
			        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

			        res = this.mul(res, wnd[current]);
			        currentLen = 0;
			        current = 0;
			      }
			      start = 26;
			    }

			    return res;
			  };

			  Red.prototype.convertTo = function convertTo (num) {
			    var r = num.umod(this.m);

			    return r === num ? r.clone() : r;
			  };

			  Red.prototype.convertFrom = function convertFrom (num) {
			    var res = num.clone();
			    res.red = null;
			    return res;
			  };

			  //
			  // Montgomery method engine
			  //

			  BN.mont = function mont (num) {
			    return new Mont(num);
			  };

			  function Mont (m) {
			    Red.call(this, m);

			    this.shift = this.m.bitLength();
			    if (this.shift % 26 !== 0) {
			      this.shift += 26 - (this.shift % 26);
			    }

			    this.r = new BN(1).iushln(this.shift);
			    this.r2 = this.imod(this.r.sqr());
			    this.rinv = this.r._invmp(this.m);

			    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
			    this.minv = this.minv.umod(this.r);
			    this.minv = this.r.sub(this.minv);
			  }
			  inherits(Mont, Red);

			  Mont.prototype.convertTo = function convertTo (num) {
			    return this.imod(num.ushln(this.shift));
			  };

			  Mont.prototype.convertFrom = function convertFrom (num) {
			    var r = this.imod(num.mul(this.rinv));
			    r.red = null;
			    return r;
			  };

			  Mont.prototype.imul = function imul (a, b) {
			    if (a.isZero() || b.isZero()) {
			      a.words[0] = 0;
			      a.length = 1;
			      return a;
			    }

			    var t = a.imul(b);
			    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
			    var u = t.isub(c).iushrn(this.shift);
			    var res = u;

			    if (u.cmp(this.m) >= 0) {
			      res = u.isub(this.m);
			    } else if (u.cmpn(0) < 0) {
			      res = u.iadd(this.m);
			    }

			    return res._forceRed(this);
			  };

			  Mont.prototype.mul = function mul (a, b) {
			    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

			    var t = a.mul(b);
			    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
			    var u = t.isub(c).iushrn(this.shift);
			    var res = u;
			    if (u.cmp(this.m) >= 0) {
			      res = u.isub(this.m);
			    } else if (u.cmpn(0) < 0) {
			      res = u.iadd(this.m);
			    }

			    return res._forceRed(this);
			  };

			  Mont.prototype.invm = function invm (a) {
			    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
			    var res = this.imod(a._invmp(this.m).mul(this.r2));
			    return res._forceRed(this);
			  };
			})(module, bn); 
		} (bn$1));
		return bn$1.exports;
	}

	var bnExports = /*@__PURE__*/ requireBn();
	var BN = /*@__PURE__*/getDefaultExportFromCjs(bnExports);

	var safeBuffer = {exports: {}};

	/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

	var hasRequiredSafeBuffer;

	function requireSafeBuffer () {
		if (hasRequiredSafeBuffer) return safeBuffer.exports;
		hasRequiredSafeBuffer = 1;
		(function (module, exports) {
			/* eslint-disable node/no-deprecated-api */
			var buffer = /*@__PURE__*/ requireBuffer();
			var Buffer = buffer.Buffer;

			// alternative to using Object.keys for old browsers
			function copyProps (src, dst) {
			  for (var key in src) {
			    dst[key] = src[key];
			  }
			}
			if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
			  module.exports = buffer;
			} else {
			  // Copy properties from require('buffer')
			  copyProps(buffer, exports);
			  exports.Buffer = SafeBuffer;
			}

			function SafeBuffer (arg, encodingOrOffset, length) {
			  return Buffer(arg, encodingOrOffset, length)
			}

			SafeBuffer.prototype = Object.create(Buffer.prototype);

			// Copy static methods from Buffer
			copyProps(Buffer, SafeBuffer);

			SafeBuffer.from = function (arg, encodingOrOffset, length) {
			  if (typeof arg === 'number') {
			    throw new TypeError('Argument must not be a number')
			  }
			  return Buffer(arg, encodingOrOffset, length)
			};

			SafeBuffer.alloc = function (size, fill, encoding) {
			  if (typeof size !== 'number') {
			    throw new TypeError('Argument must be a number')
			  }
			  var buf = Buffer(size);
			  if (fill !== undefined) {
			    if (typeof encoding === 'string') {
			      buf.fill(fill, encoding);
			    } else {
			      buf.fill(fill);
			    }
			  } else {
			    buf.fill(0);
			  }
			  return buf
			};

			SafeBuffer.allocUnsafe = function (size) {
			  if (typeof size !== 'number') {
			    throw new TypeError('Argument must be a number')
			  }
			  return Buffer(size)
			};

			SafeBuffer.allocUnsafeSlow = function (size) {
			  if (typeof size !== 'number') {
			    throw new TypeError('Argument must be a number')
			  }
			  return buffer.SlowBuffer(size)
			}; 
		} (safeBuffer, safeBuffer.exports));
		return safeBuffer.exports;
	}

	var src;
	var hasRequiredSrc;

	function requireSrc () {
		if (hasRequiredSrc) return src;
		hasRequiredSrc = 1;
		// base-x encoding / decoding
		// Copyright (c) 2018 base-x contributors
		// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
		// Distributed under the MIT software license, see the accompanying
		// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
		// @ts-ignore
		var _Buffer = /*@__PURE__*/ requireSafeBuffer().Buffer;
		function base (ALPHABET) {
		  if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
		  var BASE_MAP = new Uint8Array(256);
		  for (var j = 0; j < BASE_MAP.length; j++) {
		    BASE_MAP[j] = 255;
		  }
		  for (var i = 0; i < ALPHABET.length; i++) {
		    var x = ALPHABET.charAt(i);
		    var xc = x.charCodeAt(0);
		    if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
		    BASE_MAP[xc] = i;
		  }
		  var BASE = ALPHABET.length;
		  var LEADER = ALPHABET.charAt(0);
		  var FACTOR = Math.log(BASE) / Math.log(256); // log(BASE) / log(256), rounded up
		  var iFACTOR = Math.log(256) / Math.log(BASE); // log(256) / log(BASE), rounded up
		  function encode (source) {
		    if (Array.isArray(source) || source instanceof Uint8Array) { source = _Buffer.from(source); }
		    if (!_Buffer.isBuffer(source)) { throw new TypeError('Expected Buffer') }
		    if (source.length === 0) { return '' }
		        // Skip & count leading zeroes.
		    var zeroes = 0;
		    var length = 0;
		    var pbegin = 0;
		    var pend = source.length;
		    while (pbegin !== pend && source[pbegin] === 0) {
		      pbegin++;
		      zeroes++;
		    }
		        // Allocate enough space in big-endian base58 representation.
		    var size = ((pend - pbegin) * iFACTOR + 1) >>> 0;
		    var b58 = new Uint8Array(size);
		        // Process the bytes.
		    while (pbegin !== pend) {
		      var carry = source[pbegin];
		            // Apply "b58 = b58 * 256 + ch".
		      var i = 0;
		      for (var it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
		        carry += (256 * b58[it1]) >>> 0;
		        b58[it1] = (carry % BASE) >>> 0;
		        carry = (carry / BASE) >>> 0;
		      }
		      if (carry !== 0) { throw new Error('Non-zero carry') }
		      length = i;
		      pbegin++;
		    }
		        // Skip leading zeroes in base58 result.
		    var it2 = size - length;
		    while (it2 !== size && b58[it2] === 0) {
		      it2++;
		    }
		        // Translate the result into a string.
		    var str = LEADER.repeat(zeroes);
		    for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]); }
		    return str
		  }
		  function decodeUnsafe (source) {
		    if (typeof source !== 'string') { throw new TypeError('Expected String') }
		    if (source.length === 0) { return _Buffer.alloc(0) }
		    var psz = 0;
		        // Skip and count leading '1's.
		    var zeroes = 0;
		    var length = 0;
		    while (source[psz] === LEADER) {
		      zeroes++;
		      psz++;
		    }
		        // Allocate enough space in big-endian base256 representation.
		    var size = (((source.length - psz) * FACTOR) + 1) >>> 0; // log(58) / log(256), rounded up.
		    var b256 = new Uint8Array(size);
		        // Process the characters.
		    while (psz < source.length) {
		            // Find code of next character
		      var charCode = source.charCodeAt(psz);
		            // Base map can not be indexed using char code
		      if (charCode > 255) { return }
		            // Decode character
		      var carry = BASE_MAP[charCode];
		            // Invalid character
		      if (carry === 255) { return }
		      var i = 0;
		      for (var it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
		        carry += (BASE * b256[it3]) >>> 0;
		        b256[it3] = (carry % 256) >>> 0;
		        carry = (carry / 256) >>> 0;
		      }
		      if (carry !== 0) { throw new Error('Non-zero carry') }
		      length = i;
		      psz++;
		    }
		        // Skip leading zeroes in b256.
		    var it4 = size - length;
		    while (it4 !== size && b256[it4] === 0) {
		      it4++;
		    }
		    var vch = _Buffer.allocUnsafe(zeroes + (size - it4));
		    vch.fill(0x00, 0, zeroes);
		    var j = zeroes;
		    while (it4 !== size) {
		      vch[j++] = b256[it4++];
		    }
		    return vch
		  }
		  function decode (string) {
		    var buffer = decodeUnsafe(string);
		    if (buffer) { return buffer }
		    throw new Error('Non-base' + BASE + ' character')
		  }
		  return {
		    encode: encode,
		    decodeUnsafe: decodeUnsafe,
		    decode: decode
		  }
		}
		src = base;
		return src;
	}

	var bs58$1;
	var hasRequiredBs58;

	function requireBs58 () {
		if (hasRequiredBs58) return bs58$1;
		hasRequiredBs58 = 1;
		var basex = /*@__PURE__*/ requireSrc();
		var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

		bs58$1 = basex(ALPHABET);
		return bs58$1;
	}

	var bs58Exports = /*@__PURE__*/ requireBs58();
	var bs58 = /*@__PURE__*/getDefaultExportFromCjs(bs58Exports);

	function anumber(n) {
	    if (!Number.isSafeInteger(n) || n < 0)
	        throw new Error('positive integer expected, got ' + n);
	}
	// copied from utils
	function isBytes(a) {
	    return a instanceof Uint8Array || (ArrayBuffer.isView(a) && a.constructor.name === 'Uint8Array');
	}
	function abytes(b, ...lengths) {
	    if (!isBytes(b))
	        throw new Error('Uint8Array expected');
	    if (lengths.length > 0 && !lengths.includes(b.length))
	        throw new Error('Uint8Array expected of length ' + lengths + ', got length=' + b.length);
	}
	function aexists(instance, checkFinished = true) {
	    if (instance.destroyed)
	        throw new Error('Hash instance has been destroyed');
	    if (checkFinished && instance.finished)
	        throw new Error('Hash#digest() has already been called');
	}
	function aoutput(out, instance) {
	    abytes(out);
	    const min = instance.outputLen;
	    if (out.length < min) {
	        throw new Error('digestInto() expects output buffer of length at least ' + min);
	    }
	}

	/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
	// node.js versions earlier than v19 don't declare it in global scope.
	// For node.js, package.json#exports field mapping rewrites import
	// from `crypto` to `cryptoNode`, which imports native module.
	// Makes the utils un-importable in browsers without a bundler.
	// Once node.js 18 is deprecated (2025-04-30), we can just drop the import.
	const u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
	// Cast array to view
	const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
	// The rotate right (circular right shift) operation for uint32
	const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
	const isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44)();
	// The byte swap operation for uint32
	const byteSwap = (word) => ((word << 24) & 0xff000000) |
	    ((word << 8) & 0xff0000) |
	    ((word >>> 8) & 0xff00) |
	    ((word >>> 24) & 0xff);
	// In place byte swap for Uint32Array
	function byteSwap32(arr) {
	    for (let i = 0; i < arr.length; i++) {
	        arr[i] = byteSwap(arr[i]);
	    }
	}
	/**
	 * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	 */
	function utf8ToBytes(str) {
	    if (typeof str !== 'string')
	        throw new Error('utf8ToBytes expected string, got ' + typeof str);
	    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
	}
	/**
	 * Normalizes (non-hex) string or Uint8Array to Uint8Array.
	 * Warning: when Uint8Array is passed, it would NOT get copied.
	 * Keep in mind for future mutable operations.
	 */
	function toBytes(data) {
	    if (typeof data === 'string')
	        data = utf8ToBytes(data);
	    abytes(data);
	    return data;
	}
	// For runtime check if class implements interface
	class Hash {
	    // Safe version that clones internal state
	    clone() {
	        return this._cloneInto();
	    }
	}
	function wrapConstructor(hashCons) {
	    const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
	    const tmp = hashCons();
	    hashC.outputLen = tmp.outputLen;
	    hashC.blockLen = tmp.blockLen;
	    hashC.create = () => hashCons();
	    return hashC;
	}

	/**
	 * Polyfill for Safari 14
	 */
	function setBigUint64(view, byteOffset, value, isLE) {
	    if (typeof view.setBigUint64 === 'function')
	        return view.setBigUint64(byteOffset, value, isLE);
	    const _32n = BigInt(32);
	    const _u32_max = BigInt(0xffffffff);
	    const wh = Number((value >> _32n) & _u32_max);
	    const wl = Number(value & _u32_max);
	    const h = isLE ? 4 : 0;
	    const l = isLE ? 0 : 4;
	    view.setUint32(byteOffset + h, wh, isLE);
	    view.setUint32(byteOffset + l, wl, isLE);
	}
	/**
	 * Choice: a ? b : c
	 */
	const Chi = (a, b, c) => (a & b) ^ (~a & c);
	/**
	 * Majority function, true if any two inputs is true
	 */
	const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
	/**
	 * Merkle-Damgard hash construction base class.
	 * Could be used to create MD5, RIPEMD, SHA1, SHA2.
	 */
	class HashMD extends Hash {
	    constructor(blockLen, outputLen, padOffset, isLE) {
	        super();
	        this.blockLen = blockLen;
	        this.outputLen = outputLen;
	        this.padOffset = padOffset;
	        this.isLE = isLE;
	        this.finished = false;
	        this.length = 0;
	        this.pos = 0;
	        this.destroyed = false;
	        this.buffer = new Uint8Array(blockLen);
	        this.view = createView(this.buffer);
	    }
	    update(data) {
	        aexists(this);
	        const { view, buffer, blockLen } = this;
	        data = toBytes(data);
	        const len = data.length;
	        for (let pos = 0; pos < len;) {
	            const take = Math.min(blockLen - this.pos, len - pos);
	            // Fast path: we have at least one block in input, cast it to view and process
	            if (take === blockLen) {
	                const dataView = createView(data);
	                for (; blockLen <= len - pos; pos += blockLen)
	                    this.process(dataView, pos);
	                continue;
	            }
	            buffer.set(data.subarray(pos, pos + take), this.pos);
	            this.pos += take;
	            pos += take;
	            if (this.pos === blockLen) {
	                this.process(view, 0);
	                this.pos = 0;
	            }
	        }
	        this.length += data.length;
	        this.roundClean();
	        return this;
	    }
	    digestInto(out) {
	        aexists(this);
	        aoutput(out, this);
	        this.finished = true;
	        // Padding
	        // We can avoid allocation of buffer for padding completely if it
	        // was previously not allocated here. But it won't change performance.
	        const { buffer, view, blockLen, isLE } = this;
	        let { pos } = this;
	        // append the bit '1' to the message
	        buffer[pos++] = 0b10000000;
	        this.buffer.subarray(pos).fill(0);
	        // we have less than padOffset left in buffer, so we cannot put length in
	        // current block, need process it and pad again
	        if (this.padOffset > blockLen - pos) {
	            this.process(view, 0);
	            pos = 0;
	        }
	        // Pad until full block byte with zeros
	        for (let i = pos; i < blockLen; i++)
	            buffer[i] = 0;
	        // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
	        // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
	        // So we just write lowest 64 bits of that value.
	        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
	        this.process(view, 0);
	        const oview = createView(out);
	        const len = this.outputLen;
	        // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
	        if (len % 4)
	            throw new Error('_sha2: outputLen should be aligned to 32bit');
	        const outLen = len / 4;
	        const state = this.get();
	        if (outLen > state.length)
	            throw new Error('_sha2: outputLen bigger than state');
	        for (let i = 0; i < outLen; i++)
	            oview.setUint32(4 * i, state[i], isLE);
	    }
	    digest() {
	        const { buffer, outputLen } = this;
	        this.digestInto(buffer);
	        const res = buffer.slice(0, outputLen);
	        this.destroy();
	        return res;
	    }
	    _cloneInto(to) {
	        to || (to = new this.constructor());
	        to.set(...this.get());
	        const { blockLen, buffer, length, finished, destroyed, pos } = this;
	        to.length = length;
	        to.pos = pos;
	        to.finished = finished;
	        to.destroyed = destroyed;
	        if (length % blockLen)
	            to.buffer.set(buffer);
	        return to;
	    }
	}

	// SHA2-256 need to try 2^128 hashes to execute birthday attack.
	// BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per late 2024.
	// Round constants:
	// first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
	// prettier-ignore
	const SHA256_K$1 = /* @__PURE__ */ new Uint32Array([
	    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
	]);
	// Initial state:
	// first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19
	// prettier-ignore
	const SHA256_IV$1 = /* @__PURE__ */ new Uint32Array([
	    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
	]);
	// Temporary buffer, not used to store anything between runs
	// Named this way because it matches specification.
	const SHA256_W$1 = /* @__PURE__ */ new Uint32Array(64);
	let SHA256$1 = class SHA256 extends HashMD {
	    constructor() {
	        super(64, 32, 8, false);
	        // We cannot use array here since array allows indexing by variable
	        // which means optimizer/compiler cannot use registers.
	        this.A = SHA256_IV$1[0] | 0;
	        this.B = SHA256_IV$1[1] | 0;
	        this.C = SHA256_IV$1[2] | 0;
	        this.D = SHA256_IV$1[3] | 0;
	        this.E = SHA256_IV$1[4] | 0;
	        this.F = SHA256_IV$1[5] | 0;
	        this.G = SHA256_IV$1[6] | 0;
	        this.H = SHA256_IV$1[7] | 0;
	    }
	    get() {
	        const { A, B, C, D, E, F, G, H } = this;
	        return [A, B, C, D, E, F, G, H];
	    }
	    // prettier-ignore
	    set(A, B, C, D, E, F, G, H) {
	        this.A = A | 0;
	        this.B = B | 0;
	        this.C = C | 0;
	        this.D = D | 0;
	        this.E = E | 0;
	        this.F = F | 0;
	        this.G = G | 0;
	        this.H = H | 0;
	    }
	    process(view, offset) {
	        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
	        for (let i = 0; i < 16; i++, offset += 4)
	            SHA256_W$1[i] = view.getUint32(offset, false);
	        for (let i = 16; i < 64; i++) {
	            const W15 = SHA256_W$1[i - 15];
	            const W2 = SHA256_W$1[i - 2];
	            const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
	            const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
	            SHA256_W$1[i] = (s1 + SHA256_W$1[i - 7] + s0 + SHA256_W$1[i - 16]) | 0;
	        }
	        // Compression function main loop, 64 rounds
	        let { A, B, C, D, E, F, G, H } = this;
	        for (let i = 0; i < 64; i++) {
	            const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
	            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K$1[i] + SHA256_W$1[i]) | 0;
	            const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
	            const T2 = (sigma0 + Maj(A, B, C)) | 0;
	            H = G;
	            G = F;
	            F = E;
	            E = (D + T1) | 0;
	            D = C;
	            C = B;
	            B = A;
	            A = (T1 + T2) | 0;
	        }
	        // Add the compressed chunk to the current hash value
	        A = (A + this.A) | 0;
	        B = (B + this.B) | 0;
	        C = (C + this.C) | 0;
	        D = (D + this.D) | 0;
	        E = (E + this.E) | 0;
	        F = (F + this.F) | 0;
	        G = (G + this.G) | 0;
	        H = (H + this.H) | 0;
	        this.set(A, B, C, D, E, F, G, H);
	    }
	    roundClean() {
	        SHA256_W$1.fill(0);
	    }
	    destroy() {
	        this.set(0, 0, 0, 0, 0, 0, 0, 0);
	        this.buffer.fill(0);
	    }
	};
	/**
	 * SHA2-256 hash function
	 * @param message - data that would be hashed
	 */
	const sha256$1 = /* @__PURE__ */ wrapConstructor(() => new SHA256$1());

	var lib = {};

	var encoding_lib = {};

	var hasRequiredEncoding_lib;

	function requireEncoding_lib () {
		if (hasRequiredEncoding_lib) return encoding_lib;
		hasRequiredEncoding_lib = 1;

		// This is free and unencumbered software released into the public domain.
		// See LICENSE.md for more information.

		//
		// Utilities
		//

		/**
		 * @param {number} a The number to test.
		 * @param {number} min The minimum value in the range, inclusive.
		 * @param {number} max The maximum value in the range, inclusive.
		 * @return {boolean} True if a >= min and a <= max.
		 */
		function inRange(a, min, max) {
		  return min <= a && a <= max;
		}

		/**
		 * @param {*} o
		 * @return {Object}
		 */
		function ToDictionary(o) {
		  if (o === undefined) return {};
		  if (o === Object(o)) return o;
		  throw TypeError('Could not convert argument to dictionary');
		}

		/**
		 * @param {string} string Input string of UTF-16 code units.
		 * @return {!Array.<number>} Code points.
		 */
		function stringToCodePoints(string) {
		  // https://heycam.github.io/webidl/#dfn-obtain-unicode

		  // 1. Let S be the DOMString value.
		  var s = String(string);

		  // 2. Let n be the length of S.
		  var n = s.length;

		  // 3. Initialize i to 0.
		  var i = 0;

		  // 4. Initialize U to be an empty sequence of Unicode characters.
		  var u = [];

		  // 5. While i < n:
		  while (i < n) {

		    // 1. Let c be the code unit in S at index i.
		    var c = s.charCodeAt(i);

		    // 2. Depending on the value of c:

		    // c < 0xD800 or c > 0xDFFF
		    if (c < 0xD800 || c > 0xDFFF) {
		      // Append to U the Unicode character with code point c.
		      u.push(c);
		    }

		    // 0xDC00 ≤ c ≤ 0xDFFF
		    else if (0xDC00 <= c && c <= 0xDFFF) {
		      // Append to U a U+FFFD REPLACEMENT CHARACTER.
		      u.push(0xFFFD);
		    }

		    // 0xD800 ≤ c ≤ 0xDBFF
		    else if (0xD800 <= c && c <= 0xDBFF) {
		      // 1. If i = n−1, then append to U a U+FFFD REPLACEMENT
		      // CHARACTER.
		      if (i === n - 1) {
		        u.push(0xFFFD);
		      }
		      // 2. Otherwise, i < n−1:
		      else {
		        // 1. Let d be the code unit in S at index i+1.
		        var d = string.charCodeAt(i + 1);

		        // 2. If 0xDC00 ≤ d ≤ 0xDFFF, then:
		        if (0xDC00 <= d && d <= 0xDFFF) {
		          // 1. Let a be c & 0x3FF.
		          var a = c & 0x3FF;

		          // 2. Let b be d & 0x3FF.
		          var b = d & 0x3FF;

		          // 3. Append to U the Unicode character with code point
		          // 2^16+2^10*a+b.
		          u.push(0x10000 + (a << 10) + b);

		          // 4. Set i to i+1.
		          i += 1;
		        }

		        // 3. Otherwise, d < 0xDC00 or d > 0xDFFF. Append to U a
		        // U+FFFD REPLACEMENT CHARACTER.
		        else  {
		          u.push(0xFFFD);
		        }
		      }
		    }

		    // 3. Set i to i+1.
		    i += 1;
		  }

		  // 6. Return U.
		  return u;
		}

		/**
		 * @param {!Array.<number>} code_points Array of code points.
		 * @return {string} string String of UTF-16 code units.
		 */
		function codePointsToString(code_points) {
		  var s = '';
		  for (var i = 0; i < code_points.length; ++i) {
		    var cp = code_points[i];
		    if (cp <= 0xFFFF) {
		      s += String.fromCharCode(cp);
		    } else {
		      cp -= 0x10000;
		      s += String.fromCharCode((cp >> 10) + 0xD800,
		                               (cp & 0x3FF) + 0xDC00);
		    }
		  }
		  return s;
		}


		//
		// Implementation of Encoding specification
		// https://encoding.spec.whatwg.org/
		//

		//
		// 3. Terminology
		//

		/**
		 * End-of-stream is a special token that signifies no more tokens
		 * are in the stream.
		 * @const
		 */ var end_of_stream = -1;

		/**
		 * A stream represents an ordered sequence of tokens.
		 *
		 * @constructor
		 * @param {!(Array.<number>|Uint8Array)} tokens Array of tokens that provide the
		 * stream.
		 */
		function Stream(tokens) {
		  /** @type {!Array.<number>} */
		  this.tokens = [].slice.call(tokens);
		}

		Stream.prototype = {
		  /**
		   * @return {boolean} True if end-of-stream has been hit.
		   */
		  endOfStream: function() {
		    return !this.tokens.length;
		  },

		  /**
		   * When a token is read from a stream, the first token in the
		   * stream must be returned and subsequently removed, and
		   * end-of-stream must be returned otherwise.
		   *
		   * @return {number} Get the next token from the stream, or
		   * end_of_stream.
		   */
		   read: function() {
		    if (!this.tokens.length)
		      return end_of_stream;
		     return this.tokens.shift();
		   },

		  /**
		   * When one or more tokens are prepended to a stream, those tokens
		   * must be inserted, in given order, before the first token in the
		   * stream.
		   *
		   * @param {(number|!Array.<number>)} token The token(s) to prepend to the stream.
		   */
		  prepend: function(token) {
		    if (Array.isArray(token)) {
		      var tokens = /**@type {!Array.<number>}*/(token);
		      while (tokens.length)
		        this.tokens.unshift(tokens.pop());
		    } else {
		      this.tokens.unshift(token);
		    }
		  },

		  /**
		   * When one or more tokens are pushed to a stream, those tokens
		   * must be inserted, in given order, after the last token in the
		   * stream.
		   *
		   * @param {(number|!Array.<number>)} token The tokens(s) to prepend to the stream.
		   */
		  push: function(token) {
		    if (Array.isArray(token)) {
		      var tokens = /**@type {!Array.<number>}*/(token);
		      while (tokens.length)
		        this.tokens.push(tokens.shift());
		    } else {
		      this.tokens.push(token);
		    }
		  }
		};

		//
		// 4. Encodings
		//

		// 4.1 Encoders and decoders

		/** @const */
		var finished = -1;

		/**
		 * @param {boolean} fatal If true, decoding errors raise an exception.
		 * @param {number=} opt_code_point Override the standard fallback code point.
		 * @return {number} The code point to insert on a decoding error.
		 */
		function decoderError(fatal, opt_code_point) {
		  if (fatal)
		    throw TypeError('Decoder error');
		  return opt_code_point || 0xFFFD;
		}

		//
		// 7. API
		//

		/** @const */ var DEFAULT_ENCODING = 'utf-8';

		// 7.1 Interface TextDecoder

		/**
		 * @constructor
		 * @param {string=} encoding The label of the encoding;
		 *     defaults to 'utf-8'.
		 * @param {Object=} options
		 */
		function TextDecoder(encoding, options) {
		  if (!(this instanceof TextDecoder)) {
		    return new TextDecoder(encoding, options);
		  }
		  encoding = encoding !== undefined ? String(encoding).toLowerCase() : DEFAULT_ENCODING;
		  if (encoding !== DEFAULT_ENCODING) {
		    throw new Error('Encoding not supported. Only utf-8 is supported');
		  }
		  options = ToDictionary(options);

		  /** @private @type {boolean} */
		  this._streaming = false;
		  /** @private @type {boolean} */
		  this._BOMseen = false;
		  /** @private @type {?Decoder} */
		  this._decoder = null;
		  /** @private @type {boolean} */
		  this._fatal = Boolean(options['fatal']);
		  /** @private @type {boolean} */
		  this._ignoreBOM = Boolean(options['ignoreBOM']);

		  Object.defineProperty(this, 'encoding', {value: 'utf-8'});
		  Object.defineProperty(this, 'fatal', {value: this._fatal});
		  Object.defineProperty(this, 'ignoreBOM', {value: this._ignoreBOM});
		}

		TextDecoder.prototype = {
		  /**
		   * @param {ArrayBufferView=} input The buffer of bytes to decode.
		   * @param {Object=} options
		   * @return {string} The decoded string.
		   */
		  decode: function decode(input, options) {
		    var bytes;
		    if (typeof input === 'object' && input instanceof ArrayBuffer) {
		      bytes = new Uint8Array(input);
		    } else if (typeof input === 'object' && 'buffer' in input &&
		               input.buffer instanceof ArrayBuffer) {
		      bytes = new Uint8Array(input.buffer,
		                             input.byteOffset,
		                             input.byteLength);
		    } else {
		      bytes = new Uint8Array(0);
		    }

		    options = ToDictionary(options);

		    if (!this._streaming) {
		      this._decoder = new UTF8Decoder({fatal: this._fatal});
		      this._BOMseen = false;
		    }
		    this._streaming = Boolean(options['stream']);

		    var input_stream = new Stream(bytes);

		    var code_points = [];

		    /** @type {?(number|!Array.<number>)} */
		    var result;

		    while (!input_stream.endOfStream()) {
		      result = this._decoder.handler(input_stream, input_stream.read());
		      if (result === finished)
		        break;
		      if (result === null)
		        continue;
		      if (Array.isArray(result))
		        code_points.push.apply(code_points, /**@type {!Array.<number>}*/(result));
		      else
		        code_points.push(result);
		    }
		    if (!this._streaming) {
		      do {
		        result = this._decoder.handler(input_stream, input_stream.read());
		        if (result === finished)
		          break;
		        if (result === null)
		          continue;
		        if (Array.isArray(result))
		          code_points.push.apply(code_points, /**@type {!Array.<number>}*/(result));
		        else
		          code_points.push(result);
		      } while (!input_stream.endOfStream());
		      this._decoder = null;
		    }

		    if (code_points.length) {
		      // If encoding is one of utf-8, utf-16be, and utf-16le, and
		      // ignore BOM flag and BOM seen flag are unset, run these
		      // subsubsteps:
		      if (['utf-8'].indexOf(this.encoding) !== -1 &&
		          !this._ignoreBOM && !this._BOMseen) {
		        // If token is U+FEFF, set BOM seen flag.
		        if (code_points[0] === 0xFEFF) {
		          this._BOMseen = true;
		          code_points.shift();
		        } else {
		          // Otherwise, if token is not end-of-stream, set BOM seen
		          // flag and append token to output.
		          this._BOMseen = true;
		        }
		      }
		    }

		    return codePointsToString(code_points);
		  }
		};

		// 7.2 Interface TextEncoder

		/**
		 * @constructor
		 * @param {string=} encoding The label of the encoding;
		 *     defaults to 'utf-8'.
		 * @param {Object=} options
		 */
		function TextEncoder(encoding, options) {
		  if (!(this instanceof TextEncoder))
		    return new TextEncoder(encoding, options);
		  encoding = encoding !== undefined ? String(encoding).toLowerCase() : DEFAULT_ENCODING;
		  if (encoding !== DEFAULT_ENCODING) {
		    throw new Error('Encoding not supported. Only utf-8 is supported');
		  }
		  options = ToDictionary(options);

		  /** @private @type {boolean} */
		  this._streaming = false;
		  /** @private @type {?Encoder} */
		  this._encoder = null;
		  /** @private @type {{fatal: boolean}} */
		  this._options = {fatal: Boolean(options['fatal'])};

		  Object.defineProperty(this, 'encoding', {value: 'utf-8'});
		}

		TextEncoder.prototype = {
		  /**
		   * @param {string=} opt_string The string to encode.
		   * @param {Object=} options
		   * @return {Uint8Array} Encoded bytes, as a Uint8Array.
		   */
		  encode: function encode(opt_string, options) {
		    opt_string = opt_string ? String(opt_string) : '';
		    options = ToDictionary(options);

		    // NOTE: This option is nonstandard. None of the encodings
		    // permitted for encoding (i.e. UTF-8, UTF-16) are stateful,
		    // so streaming is not necessary.
		    if (!this._streaming)
		      this._encoder = new UTF8Encoder(this._options);
		    this._streaming = Boolean(options['stream']);

		    var bytes = [];
		    var input_stream = new Stream(stringToCodePoints(opt_string));
		    /** @type {?(number|!Array.<number>)} */
		    var result;
		    while (!input_stream.endOfStream()) {
		      result = this._encoder.handler(input_stream, input_stream.read());
		      if (result === finished)
		        break;
		      if (Array.isArray(result))
		        bytes.push.apply(bytes, /**@type {!Array.<number>}*/(result));
		      else
		        bytes.push(result);
		    }
		    if (!this._streaming) {
		      while (true) {
		        result = this._encoder.handler(input_stream, input_stream.read());
		        if (result === finished)
		          break;
		        if (Array.isArray(result))
		          bytes.push.apply(bytes, /**@type {!Array.<number>}*/(result));
		        else
		          bytes.push(result);
		      }
		      this._encoder = null;
		    }
		    return new Uint8Array(bytes);
		  }
		};

		//
		// 8. The encoding
		//

		// 8.1 utf-8

		/**
		 * @constructor
		 * @implements {Decoder}
		 * @param {{fatal: boolean}} options
		 */
		function UTF8Decoder(options) {
		  var fatal = options.fatal;

		  // utf-8's decoder's has an associated utf-8 code point, utf-8
		  // bytes seen, and utf-8 bytes needed (all initially 0), a utf-8
		  // lower boundary (initially 0x80), and a utf-8 upper boundary
		  // (initially 0xBF).
		  var /** @type {number} */ utf8_code_point = 0,
		      /** @type {number} */ utf8_bytes_seen = 0,
		      /** @type {number} */ utf8_bytes_needed = 0,
		      /** @type {number} */ utf8_lower_boundary = 0x80,
		      /** @type {number} */ utf8_upper_boundary = 0xBF;

		  /**
		   * @param {Stream} stream The stream of bytes being decoded.
		   * @param {number} bite The next byte read from the stream.
		   * @return {?(number|!Array.<number>)} The next code point(s)
		   *     decoded, or null if not enough data exists in the input
		   *     stream to decode a complete code point.
		   */
		  this.handler = function(stream, bite) {
		    // 1. If byte is end-of-stream and utf-8 bytes needed is not 0,
		    // set utf-8 bytes needed to 0 and return error.
		    if (bite === end_of_stream && utf8_bytes_needed !== 0) {
		      utf8_bytes_needed = 0;
		      return decoderError(fatal);
		    }

		    // 2. If byte is end-of-stream, return finished.
		    if (bite === end_of_stream)
		      return finished;

		    // 3. If utf-8 bytes needed is 0, based on byte:
		    if (utf8_bytes_needed === 0) {

		      // 0x00 to 0x7F
		      if (inRange(bite, 0x00, 0x7F)) {
		        // Return a code point whose value is byte.
		        return bite;
		      }

		      // 0xC2 to 0xDF
		      if (inRange(bite, 0xC2, 0xDF)) {
		        // Set utf-8 bytes needed to 1 and utf-8 code point to byte
		        // − 0xC0.
		        utf8_bytes_needed = 1;
		        utf8_code_point = bite - 0xC0;
		      }

		      // 0xE0 to 0xEF
		      else if (inRange(bite, 0xE0, 0xEF)) {
		        // 1. If byte is 0xE0, set utf-8 lower boundary to 0xA0.
		        if (bite === 0xE0)
		          utf8_lower_boundary = 0xA0;
		        // 2. If byte is 0xED, set utf-8 upper boundary to 0x9F.
		        if (bite === 0xED)
		          utf8_upper_boundary = 0x9F;
		        // 3. Set utf-8 bytes needed to 2 and utf-8 code point to
		        // byte − 0xE0.
		        utf8_bytes_needed = 2;
		        utf8_code_point = bite - 0xE0;
		      }

		      // 0xF0 to 0xF4
		      else if (inRange(bite, 0xF0, 0xF4)) {
		        // 1. If byte is 0xF0, set utf-8 lower boundary to 0x90.
		        if (bite === 0xF0)
		          utf8_lower_boundary = 0x90;
		        // 2. If byte is 0xF4, set utf-8 upper boundary to 0x8F.
		        if (bite === 0xF4)
		          utf8_upper_boundary = 0x8F;
		        // 3. Set utf-8 bytes needed to 3 and utf-8 code point to
		        // byte − 0xF0.
		        utf8_bytes_needed = 3;
		        utf8_code_point = bite - 0xF0;
		      }

		      // Otherwise
		      else {
		        // Return error.
		        return decoderError(fatal);
		      }

		      // Then (byte is in the range 0xC2 to 0xF4) set utf-8 code
		      // point to utf-8 code point << (6 × utf-8 bytes needed) and
		      // return continue.
		      utf8_code_point = utf8_code_point << (6 * utf8_bytes_needed);
		      return null;
		    }

		    // 4. If byte is not in the range utf-8 lower boundary to utf-8
		    // upper boundary, run these substeps:
		    if (!inRange(bite, utf8_lower_boundary, utf8_upper_boundary)) {

		      // 1. Set utf-8 code point, utf-8 bytes needed, and utf-8
		      // bytes seen to 0, set utf-8 lower boundary to 0x80, and set
		      // utf-8 upper boundary to 0xBF.
		      utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
		      utf8_lower_boundary = 0x80;
		      utf8_upper_boundary = 0xBF;

		      // 2. Prepend byte to stream.
		      stream.prepend(bite);

		      // 3. Return error.
		      return decoderError(fatal);
		    }

		    // 5. Set utf-8 lower boundary to 0x80 and utf-8 upper boundary
		    // to 0xBF.
		    utf8_lower_boundary = 0x80;
		    utf8_upper_boundary = 0xBF;

		    // 6. Increase utf-8 bytes seen by one and set utf-8 code point
		    // to utf-8 code point + (byte − 0x80) << (6 × (utf-8 bytes
		    // needed − utf-8 bytes seen)).
		    utf8_bytes_seen += 1;
		    utf8_code_point += (bite - 0x80) << (6 * (utf8_bytes_needed - utf8_bytes_seen));

		    // 7. If utf-8 bytes seen is not equal to utf-8 bytes needed,
		    // continue.
		    if (utf8_bytes_seen !== utf8_bytes_needed)
		      return null;

		    // 8. Let code point be utf-8 code point.
		    var code_point = utf8_code_point;

		    // 9. Set utf-8 code point, utf-8 bytes needed, and utf-8 bytes
		    // seen to 0.
		    utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;

		    // 10. Return a code point whose value is code point.
		    return code_point;
		  };
		}

		/**
		 * @constructor
		 * @implements {Encoder}
		 * @param {{fatal: boolean}} options
		 */
		function UTF8Encoder(options) {
		  options.fatal;
		  /**
		   * @param {Stream} stream Input stream.
		   * @param {number} code_point Next code point read from the stream.
		   * @return {(number|!Array.<number>)} Byte(s) to emit.
		   */
		  this.handler = function(stream, code_point) {
		    // 1. If code point is end-of-stream, return finished.
		    if (code_point === end_of_stream)
		      return finished;

		    // 2. If code point is in the range U+0000 to U+007F, return a
		    // byte whose value is code point.
		    if (inRange(code_point, 0x0000, 0x007f))
		      return code_point;

		    // 3. Set count and offset based on the range code point is in:
		    var count, offset;
		    // U+0080 to U+07FF:    1 and 0xC0
		    if (inRange(code_point, 0x0080, 0x07FF)) {
		      count = 1;
		      offset = 0xC0;
		    }
		    // U+0800 to U+FFFF:    2 and 0xE0
		    else if (inRange(code_point, 0x0800, 0xFFFF)) {
		      count = 2;
		      offset = 0xE0;
		    }
		    // U+10000 to U+10FFFF: 3 and 0xF0
		    else if (inRange(code_point, 0x10000, 0x10FFFF)) {
		      count = 3;
		      offset = 0xF0;
		    }

		    // 4.Let bytes be a byte sequence whose first byte is (code
		    // point >> (6 × count)) + offset.
		    var bytes = [(code_point >> (6 * count)) + offset];

		    // 5. Run these substeps while count is greater than 0:
		    while (count > 0) {

		      // 1. Set temp to code point >> (6 × (count − 1)).
		      var temp = code_point >> (6 * (count - 1));

		      // 2. Append to bytes 0x80 | (temp & 0x3F).
		      bytes.push(0x80 | (temp & 0x3F));

		      // 3. Decrease count by one.
		      count -= 1;
		    }

		    // 6. Return bytes bytes, in order.
		    return bytes;
		  };
		}

		encoding_lib.TextEncoder = TextEncoder;
		encoding_lib.TextDecoder = TextDecoder;
		return encoding_lib;
	}

	var hasRequiredLib;

	function requireLib () {
		if (hasRequiredLib) return lib;
		hasRequiredLib = 1;
		var __createBinding = (lib && lib.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (lib && lib.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __decorate = (lib && lib.__decorate) || function (decorators, target, key, desc) {
		    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
		    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
		    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		    return c > 3 && r && Object.defineProperty(target, key, r), r;
		};
		var __importStar = (lib && lib.__importStar) || function (mod) {
		    if (mod && mod.__esModule) return mod;
		    var result = {};
		    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		    __setModuleDefault(result, mod);
		    return result;
		};
		var __importDefault = (lib && lib.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(lib, "__esModule", { value: true });
		lib.deserializeUnchecked = lib.deserialize = lib.serialize = lib.BinaryReader = lib.BinaryWriter = lib.BorshError = lib.baseDecode = lib.baseEncode = void 0;
		const bn_js_1 = __importDefault(/*@__PURE__*/ requireBn());
		const bs58_1 = __importDefault(/*@__PURE__*/ requireBs58());
		// TODO: Make sure this polyfill not included when not required
		const encoding = __importStar(/*@__PURE__*/ requireEncoding_lib());
		const ResolvedTextDecoder = typeof TextDecoder !== "function" ? encoding.TextDecoder : TextDecoder;
		const textDecoder = new ResolvedTextDecoder("utf-8", { fatal: true });
		function baseEncode(value) {
		    if (typeof value === "string") {
		        value = Buffer.from(value, "utf8");
		    }
		    return bs58_1.default.encode(Buffer.from(value));
		}
		lib.baseEncode = baseEncode;
		function baseDecode(value) {
		    return Buffer.from(bs58_1.default.decode(value));
		}
		lib.baseDecode = baseDecode;
		const INITIAL_LENGTH = 1024;
		class BorshError extends Error {
		    constructor(message) {
		        super(message);
		        this.fieldPath = [];
		        this.originalMessage = message;
		    }
		    addToFieldPath(fieldName) {
		        this.fieldPath.splice(0, 0, fieldName);
		        // NOTE: Modifying message directly as jest doesn't use .toString()
		        this.message = this.originalMessage + ": " + this.fieldPath.join(".");
		    }
		}
		lib.BorshError = BorshError;
		/// Binary encoder.
		class BinaryWriter {
		    constructor() {
		        this.buf = Buffer.alloc(INITIAL_LENGTH);
		        this.length = 0;
		    }
		    maybeResize() {
		        if (this.buf.length < 16 + this.length) {
		            this.buf = Buffer.concat([this.buf, Buffer.alloc(INITIAL_LENGTH)]);
		        }
		    }
		    writeU8(value) {
		        this.maybeResize();
		        this.buf.writeUInt8(value, this.length);
		        this.length += 1;
		    }
		    writeU16(value) {
		        this.maybeResize();
		        this.buf.writeUInt16LE(value, this.length);
		        this.length += 2;
		    }
		    writeU32(value) {
		        this.maybeResize();
		        this.buf.writeUInt32LE(value, this.length);
		        this.length += 4;
		    }
		    writeU64(value) {
		        this.maybeResize();
		        this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 8)));
		    }
		    writeU128(value) {
		        this.maybeResize();
		        this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 16)));
		    }
		    writeU256(value) {
		        this.maybeResize();
		        this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 32)));
		    }
		    writeU512(value) {
		        this.maybeResize();
		        this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 64)));
		    }
		    writeBuffer(buffer) {
		        // Buffer.from is needed as this.buf.subarray can return plain Uint8Array in browser
		        this.buf = Buffer.concat([
		            Buffer.from(this.buf.subarray(0, this.length)),
		            buffer,
		            Buffer.alloc(INITIAL_LENGTH),
		        ]);
		        this.length += buffer.length;
		    }
		    writeString(str) {
		        this.maybeResize();
		        const b = Buffer.from(str, "utf8");
		        this.writeU32(b.length);
		        this.writeBuffer(b);
		    }
		    writeFixedArray(array) {
		        this.writeBuffer(Buffer.from(array));
		    }
		    writeArray(array, fn) {
		        this.maybeResize();
		        this.writeU32(array.length);
		        for (const elem of array) {
		            this.maybeResize();
		            fn(elem);
		        }
		    }
		    toArray() {
		        return this.buf.subarray(0, this.length);
		    }
		}
		lib.BinaryWriter = BinaryWriter;
		function handlingRangeError(target, propertyKey, propertyDescriptor) {
		    const originalMethod = propertyDescriptor.value;
		    propertyDescriptor.value = function (...args) {
		        try {
		            return originalMethod.apply(this, args);
		        }
		        catch (e) {
		            if (e instanceof RangeError) {
		                const code = e.code;
		                if (["ERR_BUFFER_OUT_OF_BOUNDS", "ERR_OUT_OF_RANGE"].indexOf(code) >= 0) {
		                    throw new BorshError("Reached the end of buffer when deserializing");
		                }
		            }
		            throw e;
		        }
		    };
		}
		class BinaryReader {
		    constructor(buf) {
		        this.buf = buf;
		        this.offset = 0;
		    }
		    readU8() {
		        const value = this.buf.readUInt8(this.offset);
		        this.offset += 1;
		        return value;
		    }
		    readU16() {
		        const value = this.buf.readUInt16LE(this.offset);
		        this.offset += 2;
		        return value;
		    }
		    readU32() {
		        const value = this.buf.readUInt32LE(this.offset);
		        this.offset += 4;
		        return value;
		    }
		    readU64() {
		        const buf = this.readBuffer(8);
		        return new bn_js_1.default(buf, "le");
		    }
		    readU128() {
		        const buf = this.readBuffer(16);
		        return new bn_js_1.default(buf, "le");
		    }
		    readU256() {
		        const buf = this.readBuffer(32);
		        return new bn_js_1.default(buf, "le");
		    }
		    readU512() {
		        const buf = this.readBuffer(64);
		        return new bn_js_1.default(buf, "le");
		    }
		    readBuffer(len) {
		        if (this.offset + len > this.buf.length) {
		            throw new BorshError(`Expected buffer length ${len} isn't within bounds`);
		        }
		        const result = this.buf.slice(this.offset, this.offset + len);
		        this.offset += len;
		        return result;
		    }
		    readString() {
		        const len = this.readU32();
		        const buf = this.readBuffer(len);
		        try {
		            // NOTE: Using TextDecoder to fail on invalid UTF-8
		            return textDecoder.decode(buf);
		        }
		        catch (e) {
		            throw new BorshError(`Error decoding UTF-8 string: ${e}`);
		        }
		    }
		    readFixedArray(len) {
		        return new Uint8Array(this.readBuffer(len));
		    }
		    readArray(fn) {
		        const len = this.readU32();
		        const result = Array();
		        for (let i = 0; i < len; ++i) {
		            result.push(fn());
		        }
		        return result;
		    }
		}
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readU8", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readU16", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readU32", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readU64", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readU128", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readU256", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readU512", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readString", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readFixedArray", null);
		__decorate([
		    handlingRangeError
		], BinaryReader.prototype, "readArray", null);
		lib.BinaryReader = BinaryReader;
		function capitalizeFirstLetter(string) {
		    return string.charAt(0).toUpperCase() + string.slice(1);
		}
		function serializeField(schema, fieldName, value, fieldType, writer) {
		    try {
		        // TODO: Handle missing values properly (make sure they never result in just skipped write)
		        if (typeof fieldType === "string") {
		            writer[`write${capitalizeFirstLetter(fieldType)}`](value);
		        }
		        else if (fieldType instanceof Array) {
		            if (typeof fieldType[0] === "number") {
		                if (value.length !== fieldType[0]) {
		                    throw new BorshError(`Expecting byte array of length ${fieldType[0]}, but got ${value.length} bytes`);
		                }
		                writer.writeFixedArray(value);
		            }
		            else if (fieldType.length === 2 && typeof fieldType[1] === "number") {
		                if (value.length !== fieldType[1]) {
		                    throw new BorshError(`Expecting byte array of length ${fieldType[1]}, but got ${value.length} bytes`);
		                }
		                for (let i = 0; i < fieldType[1]; i++) {
		                    serializeField(schema, null, value[i], fieldType[0], writer);
		                }
		            }
		            else {
		                writer.writeArray(value, (item) => {
		                    serializeField(schema, fieldName, item, fieldType[0], writer);
		                });
		            }
		        }
		        else if (fieldType.kind !== undefined) {
		            switch (fieldType.kind) {
		                case "option": {
		                    if (value === null || value === undefined) {
		                        writer.writeU8(0);
		                    }
		                    else {
		                        writer.writeU8(1);
		                        serializeField(schema, fieldName, value, fieldType.type, writer);
		                    }
		                    break;
		                }
		                case "map": {
		                    writer.writeU32(value.size);
		                    value.forEach((val, key) => {
		                        serializeField(schema, fieldName, key, fieldType.key, writer);
		                        serializeField(schema, fieldName, val, fieldType.value, writer);
		                    });
		                    break;
		                }
		                default:
		                    throw new BorshError(`FieldType ${fieldType} unrecognized`);
		            }
		        }
		        else {
		            serializeStruct(schema, value, writer);
		        }
		    }
		    catch (error) {
		        if (error instanceof BorshError) {
		            error.addToFieldPath(fieldName);
		        }
		        throw error;
		    }
		}
		function serializeStruct(schema, obj, writer) {
		    if (typeof obj.borshSerialize === "function") {
		        obj.borshSerialize(writer);
		        return;
		    }
		    const structSchema = schema.get(obj.constructor);
		    if (!structSchema) {
		        throw new BorshError(`Class ${obj.constructor.name} is missing in schema`);
		    }
		    if (structSchema.kind === "struct") {
		        structSchema.fields.map(([fieldName, fieldType]) => {
		            serializeField(schema, fieldName, obj[fieldName], fieldType, writer);
		        });
		    }
		    else if (structSchema.kind === "enum") {
		        const name = obj[structSchema.field];
		        for (let idx = 0; idx < structSchema.values.length; ++idx) {
		            const [fieldName, fieldType] = structSchema.values[idx];
		            if (fieldName === name) {
		                writer.writeU8(idx);
		                serializeField(schema, fieldName, obj[fieldName], fieldType, writer);
		                break;
		            }
		        }
		    }
		    else {
		        throw new BorshError(`Unexpected schema kind: ${structSchema.kind} for ${obj.constructor.name}`);
		    }
		}
		/// Serialize given object using schema of the form:
		/// { class_name -> [ [field_name, field_type], .. ], .. }
		function serialize(schema, obj, Writer = BinaryWriter) {
		    const writer = new Writer();
		    serializeStruct(schema, obj, writer);
		    return writer.toArray();
		}
		lib.serialize = serialize;
		function deserializeField(schema, fieldName, fieldType, reader) {
		    try {
		        if (typeof fieldType === "string") {
		            return reader[`read${capitalizeFirstLetter(fieldType)}`]();
		        }
		        if (fieldType instanceof Array) {
		            if (typeof fieldType[0] === "number") {
		                return reader.readFixedArray(fieldType[0]);
		            }
		            else if (typeof fieldType[1] === "number") {
		                const arr = [];
		                for (let i = 0; i < fieldType[1]; i++) {
		                    arr.push(deserializeField(schema, null, fieldType[0], reader));
		                }
		                return arr;
		            }
		            else {
		                return reader.readArray(() => deserializeField(schema, fieldName, fieldType[0], reader));
		            }
		        }
		        if (fieldType.kind === "option") {
		            const option = reader.readU8();
		            if (option) {
		                return deserializeField(schema, fieldName, fieldType.type, reader);
		            }
		            return undefined;
		        }
		        if (fieldType.kind === "map") {
		            let map = new Map();
		            const length = reader.readU32();
		            for (let i = 0; i < length; i++) {
		                const key = deserializeField(schema, fieldName, fieldType.key, reader);
		                const val = deserializeField(schema, fieldName, fieldType.value, reader);
		                map.set(key, val);
		            }
		            return map;
		        }
		        return deserializeStruct(schema, fieldType, reader);
		    }
		    catch (error) {
		        if (error instanceof BorshError) {
		            error.addToFieldPath(fieldName);
		        }
		        throw error;
		    }
		}
		function deserializeStruct(schema, classType, reader) {
		    if (typeof classType.borshDeserialize === "function") {
		        return classType.borshDeserialize(reader);
		    }
		    const structSchema = schema.get(classType);
		    if (!structSchema) {
		        throw new BorshError(`Class ${classType.name} is missing in schema`);
		    }
		    if (structSchema.kind === "struct") {
		        const result = {};
		        for (const [fieldName, fieldType] of schema.get(classType).fields) {
		            result[fieldName] = deserializeField(schema, fieldName, fieldType, reader);
		        }
		        return new classType(result);
		    }
		    if (structSchema.kind === "enum") {
		        const idx = reader.readU8();
		        if (idx >= structSchema.values.length) {
		            throw new BorshError(`Enum index: ${idx} is out of range`);
		        }
		        const [fieldName, fieldType] = structSchema.values[idx];
		        const fieldValue = deserializeField(schema, fieldName, fieldType, reader);
		        return new classType({ [fieldName]: fieldValue });
		    }
		    throw new BorshError(`Unexpected schema kind: ${structSchema.kind} for ${classType.constructor.name}`);
		}
		/// Deserializes object from bytes using schema.
		function deserialize(schema, classType, buffer, Reader = BinaryReader) {
		    const reader = new Reader(buffer);
		    const result = deserializeStruct(schema, classType, reader);
		    if (reader.offset < buffer.length) {
		        throw new BorshError(`Unexpected ${buffer.length - reader.offset} bytes after deserialized data`);
		    }
		    return result;
		}
		lib.deserialize = deserialize;
		/// Deserializes object from bytes using schema, without checking the length read
		function deserializeUnchecked(schema, classType, buffer, Reader = BinaryReader) {
		    const reader = new Reader(buffer);
		    return deserializeStruct(schema, classType, reader);
		}
		lib.deserializeUnchecked = deserializeUnchecked;
		return lib;
	}

	var libExports = /*@__PURE__*/ requireLib();

	// Class wrapping a plain object
	let Struct$1 = class Struct {
	  constructor(properties) {
	    Object.assign(this, properties);
	  }
	  encode() {
	    return bufferExports.Buffer.from(libExports.serialize(SOLANA_SCHEMA, this));
	  }
	  static decode(data) {
	    return libExports.deserialize(SOLANA_SCHEMA, this, data);
	  }
	  static decodeUnchecked(data) {
	    return libExports.deserializeUnchecked(SOLANA_SCHEMA, this, data);
	  }
	};

	// Class representing a Rust-compatible enum, since enums are only strings or
	// numbers in pure JS
	class Enum extends Struct$1 {
	  constructor(properties) {
	    super(properties);
	    this.enum = '';
	    if (Object.keys(properties).length !== 1) {
	      throw new Error('Enum can only take single value');
	    }
	    Object.keys(properties).map(key => {
	      this.enum = key;
	    });
	  }
	}
	const SOLANA_SCHEMA = new Map();

	var _PublicKey;

	/**
	 * Maximum length of derived pubkey seed
	 */
	const MAX_SEED_LENGTH = 32;

	/**
	 * Size of public key in bytes
	 */
	const PUBLIC_KEY_LENGTH = 32;

	/**
	 * Value to be converted into public key
	 */

	/**
	 * JSON object representation of PublicKey class
	 */

	function isPublicKeyData(value) {
	  return value._bn !== undefined;
	}

	// local counter used by PublicKey.unique()
	let uniquePublicKeyCounter = 1;

	/**
	 * A public key
	 */
	class PublicKey extends Struct$1 {
	  /**
	   * Create a new PublicKey object
	   * @param value ed25519 public key as buffer or base-58 encoded string
	   */
	  constructor(value) {
	    super({});
	    /** @internal */
	    this._bn = void 0;
	    if (isPublicKeyData(value)) {
	      this._bn = value._bn;
	    } else {
	      if (typeof value === 'string') {
	        // assume base 58 encoding by default
	        const decoded = bs58.decode(value);
	        if (decoded.length != PUBLIC_KEY_LENGTH) {
	          throw new Error(`Invalid public key input`);
	        }
	        this._bn = new BN(decoded);
	      } else {
	        this._bn = new BN(value);
	      }
	      if (this._bn.byteLength() > PUBLIC_KEY_LENGTH) {
	        throw new Error(`Invalid public key input`);
	      }
	    }
	  }

	  /**
	   * Returns a unique PublicKey for tests and benchmarks using a counter
	   */
	  static unique() {
	    const key = new PublicKey(uniquePublicKeyCounter);
	    uniquePublicKeyCounter += 1;
	    return new PublicKey(key.toBuffer());
	  }

	  /**
	   * Default public key value. The base58-encoded string representation is all ones (as seen below)
	   * The underlying BN number is 32 bytes that are all zeros
	   */

	  /**
	   * Checks if two publicKeys are equal
	   */
	  equals(publicKey) {
	    return this._bn.eq(publicKey._bn);
	  }

	  /**
	   * Return the base-58 representation of the public key
	   */
	  toBase58() {
	    return bs58.encode(this.toBytes());
	  }
	  toJSON() {
	    return this.toBase58();
	  }

	  /**
	   * Return the byte array representation of the public key in big endian
	   */
	  toBytes() {
	    const buf = this.toBuffer();
	    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
	  }

	  /**
	   * Return the Buffer representation of the public key in big endian
	   */
	  toBuffer() {
	    const b = this._bn.toArrayLike(bufferExports.Buffer);
	    if (b.length === PUBLIC_KEY_LENGTH) {
	      return b;
	    }
	    const zeroPad = bufferExports.Buffer.alloc(32);
	    b.copy(zeroPad, 32 - b.length);
	    return zeroPad;
	  }
	  get [Symbol.toStringTag]() {
	    return `PublicKey(${this.toString()})`;
	  }

	  /**
	   * Return the base-58 representation of the public key
	   */
	  toString() {
	    return this.toBase58();
	  }

	  /**
	   * Derive a public key from another key, a seed, and a program ID.
	   * The program ID will also serve as the owner of the public key, giving
	   * it permission to write data to the account.
	   */
	  /* eslint-disable require-await */
	  static async createWithSeed(fromPublicKey, seed, programId) {
	    const buffer = bufferExports.Buffer.concat([fromPublicKey.toBuffer(), bufferExports.Buffer.from(seed), programId.toBuffer()]);
	    const publicKeyBytes = sha256$1(buffer);
	    return new PublicKey(publicKeyBytes);
	  }

	  /**
	   * Derive a program address from seeds and a program ID.
	   */
	  /* eslint-disable require-await */
	  static createProgramAddressSync(seeds, programId) {
	    let buffer = bufferExports.Buffer.alloc(0);
	    seeds.forEach(function (seed) {
	      if (seed.length > MAX_SEED_LENGTH) {
	        throw new TypeError(`Max seed length exceeded`);
	      }
	      buffer = bufferExports.Buffer.concat([buffer, toBuffer(seed)]);
	    });
	    buffer = bufferExports.Buffer.concat([buffer, programId.toBuffer(), bufferExports.Buffer.from('ProgramDerivedAddress')]);
	    const publicKeyBytes = sha256$1(buffer);
	    if (isOnCurve(publicKeyBytes)) {
	      throw new Error(`Invalid seeds, address must fall off the curve`);
	    }
	    return new PublicKey(publicKeyBytes);
	  }

	  /**
	   * Async version of createProgramAddressSync
	   * For backwards compatibility
	   *
	   * @deprecated Use {@link createProgramAddressSync} instead
	   */
	  /* eslint-disable require-await */
	  static async createProgramAddress(seeds, programId) {
	    return this.createProgramAddressSync(seeds, programId);
	  }

	  /**
	   * Find a valid program address
	   *
	   * Valid program addresses must fall off the ed25519 curve.  This function
	   * iterates a nonce until it finds one that when combined with the seeds
	   * results in a valid program address.
	   */
	  static findProgramAddressSync(seeds, programId) {
	    let nonce = 255;
	    let address;
	    while (nonce != 0) {
	      try {
	        const seedsWithNonce = seeds.concat(bufferExports.Buffer.from([nonce]));
	        address = this.createProgramAddressSync(seedsWithNonce, programId);
	      } catch (err) {
	        if (err instanceof TypeError) {
	          throw err;
	        }
	        nonce--;
	        continue;
	      }
	      return [address, nonce];
	    }
	    throw new Error(`Unable to find a viable program address nonce`);
	  }

	  /**
	   * Async version of findProgramAddressSync
	   * For backwards compatibility
	   *
	   * @deprecated Use {@link findProgramAddressSync} instead
	   */
	  static async findProgramAddress(seeds, programId) {
	    return this.findProgramAddressSync(seeds, programId);
	  }

	  /**
	   * Check that a pubkey is on the ed25519 curve.
	   */
	  static isOnCurve(pubkeyData) {
	    const pubkey = new PublicKey(pubkeyData);
	    return isOnCurve(pubkey.toBytes());
	  }
	}
	_PublicKey = PublicKey;
	PublicKey.default = new _PublicKey('11111111111111111111111111111111');
	SOLANA_SCHEMA.set(PublicKey, {
	  kind: 'struct',
	  fields: [['_bn', 'u256']]
	});

	/**
	 * An account key pair (public and secret keys).
	 *
	 * @deprecated since v1.10.0, please use {@link Keypair} instead.
	 */
	class Account {
	  /**
	   * Create a new Account object
	   *
	   * If the secretKey parameter is not provided a new key pair is randomly
	   * created for the account
	   *
	   * @param secretKey Secret key for the account
	   */
	  constructor(secretKey) {
	    /** @internal */
	    this._publicKey = void 0;
	    /** @internal */
	    this._secretKey = void 0;
	    if (secretKey) {
	      const secretKeyBuffer = toBuffer(secretKey);
	      if (secretKey.length !== 64) {
	        throw new Error('bad secret key size');
	      }
	      this._publicKey = secretKeyBuffer.slice(32, 64);
	      this._secretKey = secretKeyBuffer.slice(0, 32);
	    } else {
	      this._secretKey = toBuffer(generatePrivateKey());
	      this._publicKey = toBuffer(getPublicKey(this._secretKey));
	    }
	  }

	  /**
	   * The public key for this account
	   */
	  get publicKey() {
	    return new PublicKey(this._publicKey);
	  }

	  /**
	   * The **unencrypted** secret key for this account. The first 32 bytes
	   * is the private scalar and the last 32 bytes is the public key.
	   * Read more: https://blog.mozilla.org/warner/2011/11/29/ed25519-keys/
	   */
	  get secretKey() {
	    return bufferExports.Buffer.concat([this._secretKey, this._publicKey], 64);
	  }
	}

	const BPF_LOADER_DEPRECATED_PROGRAM_ID = new PublicKey('BPFLoader1111111111111111111111111111111111');

	var Layout = {};

	/* The MIT License (MIT)
	 *
	 * Copyright 2015-2018 Peter A. Bigot
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	var hasRequiredLayout;

	function requireLayout () {
		if (hasRequiredLayout) return Layout;
		hasRequiredLayout = 1;
		Object.defineProperty(Layout, "__esModule", { value: true });
		Layout.s16 = Layout.s8 = Layout.nu64be = Layout.u48be = Layout.u40be = Layout.u32be = Layout.u24be = Layout.u16be = Layout.nu64 = Layout.u48 = Layout.u40 = Layout.u32 = Layout.u24 = Layout.u16 = Layout.u8 = Layout.offset = Layout.greedy = Layout.Constant = Layout.UTF8 = Layout.CString = Layout.Blob = Layout.Boolean = Layout.BitField = Layout.BitStructure = Layout.VariantLayout = Layout.Union = Layout.UnionLayoutDiscriminator = Layout.UnionDiscriminator = Layout.Structure = Layout.Sequence = Layout.DoubleBE = Layout.Double = Layout.FloatBE = Layout.Float = Layout.NearInt64BE = Layout.NearInt64 = Layout.NearUInt64BE = Layout.NearUInt64 = Layout.IntBE = Layout.Int = Layout.UIntBE = Layout.UInt = Layout.OffsetLayout = Layout.GreedyCount = Layout.ExternalLayout = Layout.bindConstructorLayout = Layout.nameWithProperty = Layout.Layout = Layout.uint8ArrayToBuffer = Layout.checkUint8Array = void 0;
		Layout.constant = Layout.utf8 = Layout.cstr = Layout.blob = Layout.unionLayoutDiscriminator = Layout.union = Layout.seq = Layout.bits = Layout.struct = Layout.f64be = Layout.f64 = Layout.f32be = Layout.f32 = Layout.ns64be = Layout.s48be = Layout.s40be = Layout.s32be = Layout.s24be = Layout.s16be = Layout.ns64 = Layout.s48 = Layout.s40 = Layout.s32 = Layout.s24 = void 0;
		const buffer_1 = /*@__PURE__*/ requireBuffer();
		/* Check if a value is a Uint8Array.
		 *
		 * @ignore */
		function checkUint8Array(b) {
		    if (!(b instanceof Uint8Array)) {
		        throw new TypeError('b must be a Uint8Array');
		    }
		}
		Layout.checkUint8Array = checkUint8Array;
		/* Create a Buffer instance from a Uint8Array.
		 *
		 * @ignore */
		function uint8ArrayToBuffer(b) {
		    checkUint8Array(b);
		    return buffer_1.Buffer.from(b.buffer, b.byteOffset, b.length);
		}
		Layout.uint8ArrayToBuffer = uint8ArrayToBuffer;
		/**
		 * Base class for layout objects.
		 *
		 * **NOTE** This is an abstract base class; you can create instances
		 * if it amuses you, but they won't support the {@link
		 * Layout#encode|encode} or {@link Layout#decode|decode} functions.
		 *
		 * @param {Number} span - Initializer for {@link Layout#span|span}.  The
		 * parameter must be an integer; a negative value signifies that the
		 * span is {@link Layout#getSpan|value-specific}.
		 *
		 * @param {string} [property] - Initializer for {@link
		 * Layout#property|property}.
		 *
		 * @abstract
		 */
		let Layout$1 = class Layout {
		    constructor(span, property) {
		        if (!Number.isInteger(span)) {
		            throw new TypeError('span must be an integer');
		        }
		        /** The span of the layout in bytes.
		         *
		         * Positive values are generally expected.
		         *
		         * Zero will only appear in {@link Constant}s and in {@link
		         * Sequence}s where the {@link Sequence#count|count} is zero.
		         *
		         * A negative value indicates that the span is value-specific, and
		         * must be obtained using {@link Layout#getSpan|getSpan}. */
		        this.span = span;
		        /** The property name used when this layout is represented in an
		         * Object.
		         *
		         * Used only for layouts that {@link Layout#decode|decode} to Object
		         * instances.  If left undefined the span of the unnamed layout will
		         * be treated as padding: it will not be mutated by {@link
		         * Layout#encode|encode} nor represented as a property in the
		         * decoded Object. */
		        this.property = property;
		    }
		    /** Function to create an Object into which decoded properties will
		     * be written.
		     *
		     * Used only for layouts that {@link Layout#decode|decode} to Object
		     * instances, which means:
		     * * {@link Structure}
		     * * {@link Union}
		     * * {@link VariantLayout}
		     * * {@link BitStructure}
		     *
		     * If left undefined the JavaScript representation of these layouts
		     * will be Object instances.
		     *
		     * See {@link bindConstructorLayout}.
		     */
		    makeDestinationObject() {
		        return {};
		    }
		    /**
		     * Calculate the span of a specific instance of a layout.
		     *
		     * @param {Uint8Array} b - the buffer that contains an encoded instance.
		     *
		     * @param {Number} [offset] - the offset at which the encoded instance
		     * starts.  If absent a zero offset is inferred.
		     *
		     * @return {Number} - the number of bytes covered by the layout
		     * instance.  If this method is not overridden in a subclass the
		     * definition-time constant {@link Layout#span|span} will be
		     * returned.
		     *
		     * @throws {RangeError} - if the length of the value cannot be
		     * determined.
		     */
		    getSpan(b, offset) {
		        if (0 > this.span) {
		            throw new RangeError('indeterminate span');
		        }
		        return this.span;
		    }
		    /**
		     * Replicate the layout using a new property.
		     *
		     * This function must be used to get a structurally-equivalent layout
		     * with a different name since all {@link Layout} instances are
		     * immutable.
		     *
		     * **NOTE** This is a shallow copy.  All fields except {@link
		     * Layout#property|property} are strictly equal to the origin layout.
		     *
		     * @param {String} property - the value for {@link
		     * Layout#property|property} in the replica.
		     *
		     * @returns {Layout} - the copy with {@link Layout#property|property}
		     * set to `property`.
		     */
		    replicate(property) {
		        const rv = Object.create(this.constructor.prototype);
		        Object.assign(rv, this);
		        rv.property = property;
		        return rv;
		    }
		    /**
		     * Create an object from layout properties and an array of values.
		     *
		     * **NOTE** This function returns `undefined` if invoked on a layout
		     * that does not return its value as an Object.  Objects are
		     * returned for things that are a {@link Structure}, which includes
		     * {@link VariantLayout|variant layouts} if they are structures, and
		     * excludes {@link Union}s.  If you want this feature for a union
		     * you must use {@link Union.getVariant|getVariant} to select the
		     * desired layout.
		     *
		     * @param {Array} values - an array of values that correspond to the
		     * default order for properties.  As with {@link Layout#decode|decode}
		     * layout elements that have no property name are skipped when
		     * iterating over the array values.  Only the top-level properties are
		     * assigned; arguments are not assigned to properties of contained
		     * layouts.  Any unused values are ignored.
		     *
		     * @return {(Object|undefined)}
		     */
		    fromArray(values) {
		        return undefined;
		    }
		};
		Layout.Layout = Layout$1;
		/* Provide text that carries a name (such as for a function that will
		 * be throwing an error) annotated with the property of a given layout
		 * (such as one for which the value was unacceptable).
		 *
		 * @ignore */
		function nameWithProperty(name, lo) {
		    if (lo.property) {
		        return name + '[' + lo.property + ']';
		    }
		    return name;
		}
		Layout.nameWithProperty = nameWithProperty;
		/**
		 * Augment a class so that instances can be encoded/decoded using a
		 * given layout.
		 *
		 * Calling this function couples `Class` with `layout` in several ways:
		 *
		 * * `Class.layout_` becomes a static member property equal to `layout`;
		 * * `layout.boundConstructor_` becomes a static member property equal
		 *    to `Class`;
		 * * The {@link Layout#makeDestinationObject|makeDestinationObject()}
		 *   property of `layout` is set to a function that returns a `new
		 *   Class()`;
		 * * `Class.decode(b, offset)` becomes a static member function that
		 *   delegates to {@link Layout#decode|layout.decode}.  The
		 *   synthesized function may be captured and extended.
		 * * `Class.prototype.encode(b, offset)` provides an instance member
		 *   function that delegates to {@link Layout#encode|layout.encode}
		 *   with `src` set to `this`.  The synthesized function may be
		 *   captured and extended, but when the extension is invoked `this`
		 *   must be explicitly bound to the instance.
		 *
		 * @param {class} Class - a JavaScript class with a nullary
		 * constructor.
		 *
		 * @param {Layout} layout - the {@link Layout} instance used to encode
		 * instances of `Class`.
		 */
		// `Class` must be a constructor Function, but the assignment of a `layout_` property to it makes it difficult to type
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		function bindConstructorLayout(Class, layout) {
		    if ('function' !== typeof Class) {
		        throw new TypeError('Class must be constructor');
		    }
		    if (Object.prototype.hasOwnProperty.call(Class, 'layout_')) {
		        throw new Error('Class is already bound to a layout');
		    }
		    if (!(layout && (layout instanceof Layout$1))) {
		        throw new TypeError('layout must be a Layout');
		    }
		    if (Object.prototype.hasOwnProperty.call(layout, 'boundConstructor_')) {
		        throw new Error('layout is already bound to a constructor');
		    }
		    Class.layout_ = layout;
		    layout.boundConstructor_ = Class;
		    layout.makeDestinationObject = (() => new Class());
		    Object.defineProperty(Class.prototype, 'encode', {
		        value(b, offset) {
		            return layout.encode(this, b, offset);
		        },
		        writable: true,
		    });
		    Object.defineProperty(Class, 'decode', {
		        value(b, offset) {
		            return layout.decode(b, offset);
		        },
		        writable: true,
		    });
		}
		Layout.bindConstructorLayout = bindConstructorLayout;
		/**
		 * An object that behaves like a layout but does not consume space
		 * within its containing layout.
		 *
		 * This is primarily used to obtain metadata about a member, such as a
		 * {@link OffsetLayout} that can provide data about a {@link
		 * Layout#getSpan|value-specific span}.
		 *
		 * **NOTE** This is an abstract base class; you can create instances
		 * if it amuses you, but they won't support {@link
		 * ExternalLayout#isCount|isCount} or other {@link Layout} functions.
		 *
		 * @param {Number} span - initializer for {@link Layout#span|span}.
		 * The parameter can range from 1 through 6.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @abstract
		 * @augments {Layout}
		 */
		class ExternalLayout extends Layout$1 {
		    /**
		     * Return `true` iff the external layout decodes to an unsigned
		     * integer layout.
		     *
		     * In that case it can be used as the source of {@link
		     * Sequence#count|Sequence counts}, {@link Blob#length|Blob lengths},
		     * or as {@link UnionLayoutDiscriminator#layout|external union
		     * discriminators}.
		     *
		     * @abstract
		     */
		    isCount() {
		        throw new Error('ExternalLayout is abstract');
		    }
		}
		Layout.ExternalLayout = ExternalLayout;
		/**
		 * An {@link ExternalLayout} that determines its {@link
		 * Layout#decode|value} based on offset into and length of the buffer
		 * on which it is invoked.
		 *
		 * *Factory*: {@link module:Layout.greedy|greedy}
		 *
		 * @param {Number} [elementSpan] - initializer for {@link
		 * GreedyCount#elementSpan|elementSpan}.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {ExternalLayout}
		 */
		class GreedyCount extends ExternalLayout {
		    constructor(elementSpan = 1, property) {
		        if ((!Number.isInteger(elementSpan)) || (0 >= elementSpan)) {
		            throw new TypeError('elementSpan must be a (positive) integer');
		        }
		        super(-1, property);
		        /** The layout for individual elements of the sequence.  The value
		         * must be a positive integer.  If not provided, the value will be
		         * 1. */
		        this.elementSpan = elementSpan;
		    }
		    /** @override */
		    isCount() {
		        return true;
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        checkUint8Array(b);
		        const rem = b.length - offset;
		        return Math.floor(rem / this.elementSpan);
		    }
		    /** @override */
		    encode(src, b, offset) {
		        return 0;
		    }
		}
		Layout.GreedyCount = GreedyCount;
		/**
		 * An {@link ExternalLayout} that supports accessing a {@link Layout}
		 * at a fixed offset from the start of another Layout.  The offset may
		 * be before, within, or after the base layout.
		 *
		 * *Factory*: {@link module:Layout.offset|offset}
		 *
		 * @param {Layout} layout - initializer for {@link
		 * OffsetLayout#layout|layout}, modulo `property`.
		 *
		 * @param {Number} [offset] - Initializes {@link
		 * OffsetLayout#offset|offset}.  Defaults to zero.
		 *
		 * @param {string} [property] - Optional new property name for a
		 * {@link Layout#replicate| replica} of `layout` to be used as {@link
		 * OffsetLayout#layout|layout}.  If not provided the `layout` is used
		 * unchanged.
		 *
		 * @augments {Layout}
		 */
		class OffsetLayout extends ExternalLayout {
		    constructor(layout, offset = 0, property) {
		        if (!(layout instanceof Layout$1)) {
		            throw new TypeError('layout must be a Layout');
		        }
		        if (!Number.isInteger(offset)) {
		            throw new TypeError('offset must be integer or undefined');
		        }
		        super(layout.span, property || layout.property);
		        /** The subordinated layout. */
		        this.layout = layout;
		        /** The location of {@link OffsetLayout#layout} relative to the
		         * start of another layout.
		         *
		         * The value may be positive or negative, but an error will thrown
		         * if at the point of use it goes outside the span of the Uint8Array
		         * being accessed.  */
		        this.offset = offset;
		    }
		    /** @override */
		    isCount() {
		        return ((this.layout instanceof UInt)
		            || (this.layout instanceof UIntBE));
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return this.layout.decode(b, offset + this.offset);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        return this.layout.encode(src, b, offset + this.offset);
		    }
		}
		Layout.OffsetLayout = OffsetLayout;
		/**
		 * Represent an unsigned integer in little-endian format.
		 *
		 * *Factory*: {@link module:Layout.u8|u8}, {@link
		 *  module:Layout.u16|u16}, {@link module:Layout.u24|u24}, {@link
		 *  module:Layout.u32|u32}, {@link module:Layout.u40|u40}, {@link
		 *  module:Layout.u48|u48}
		 *
		 * @param {Number} span - initializer for {@link Layout#span|span}.
		 * The parameter can range from 1 through 6.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class UInt extends Layout$1 {
		    constructor(span, property) {
		        super(span, property);
		        if (6 < this.span) {
		            throw new RangeError('span must not exceed 6 bytes');
		        }
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readUIntLE(offset, this.span);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeUIntLE(src, offset, this.span);
		        return this.span;
		    }
		}
		Layout.UInt = UInt;
		/**
		 * Represent an unsigned integer in big-endian format.
		 *
		 * *Factory*: {@link module:Layout.u8be|u8be}, {@link
		 * module:Layout.u16be|u16be}, {@link module:Layout.u24be|u24be},
		 * {@link module:Layout.u32be|u32be}, {@link
		 * module:Layout.u40be|u40be}, {@link module:Layout.u48be|u48be}
		 *
		 * @param {Number} span - initializer for {@link Layout#span|span}.
		 * The parameter can range from 1 through 6.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class UIntBE extends Layout$1 {
		    constructor(span, property) {
		        super(span, property);
		        if (6 < this.span) {
		            throw new RangeError('span must not exceed 6 bytes');
		        }
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readUIntBE(offset, this.span);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeUIntBE(src, offset, this.span);
		        return this.span;
		    }
		}
		Layout.UIntBE = UIntBE;
		/**
		 * Represent a signed integer in little-endian format.
		 *
		 * *Factory*: {@link module:Layout.s8|s8}, {@link
		 *  module:Layout.s16|s16}, {@link module:Layout.s24|s24}, {@link
		 *  module:Layout.s32|s32}, {@link module:Layout.s40|s40}, {@link
		 *  module:Layout.s48|s48}
		 *
		 * @param {Number} span - initializer for {@link Layout#span|span}.
		 * The parameter can range from 1 through 6.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class Int extends Layout$1 {
		    constructor(span, property) {
		        super(span, property);
		        if (6 < this.span) {
		            throw new RangeError('span must not exceed 6 bytes');
		        }
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readIntLE(offset, this.span);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeIntLE(src, offset, this.span);
		        return this.span;
		    }
		}
		Layout.Int = Int;
		/**
		 * Represent a signed integer in big-endian format.
		 *
		 * *Factory*: {@link module:Layout.s8be|s8be}, {@link
		 * module:Layout.s16be|s16be}, {@link module:Layout.s24be|s24be},
		 * {@link module:Layout.s32be|s32be}, {@link
		 * module:Layout.s40be|s40be}, {@link module:Layout.s48be|s48be}
		 *
		 * @param {Number} span - initializer for {@link Layout#span|span}.
		 * The parameter can range from 1 through 6.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class IntBE extends Layout$1 {
		    constructor(span, property) {
		        super(span, property);
		        if (6 < this.span) {
		            throw new RangeError('span must not exceed 6 bytes');
		        }
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readIntBE(offset, this.span);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeIntBE(src, offset, this.span);
		        return this.span;
		    }
		}
		Layout.IntBE = IntBE;
		const V2E32 = Math.pow(2, 32);
		/* True modulus high and low 32-bit words, where low word is always
		 * non-negative. */
		function divmodInt64(src) {
		    const hi32 = Math.floor(src / V2E32);
		    const lo32 = src - (hi32 * V2E32);
		    return { hi32, lo32 };
		}
		/* Reconstruct Number from quotient and non-negative remainder */
		function roundedInt64(hi32, lo32) {
		    return hi32 * V2E32 + lo32;
		}
		/**
		 * Represent an unsigned 64-bit integer in little-endian format when
		 * encoded and as a near integral JavaScript Number when decoded.
		 *
		 * *Factory*: {@link module:Layout.nu64|nu64}
		 *
		 * **NOTE** Values with magnitude greater than 2^52 may not decode to
		 * the exact value of the encoded representation.
		 *
		 * @augments {Layout}
		 */
		class NearUInt64 extends Layout$1 {
		    constructor(property) {
		        super(8, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const buffer = uint8ArrayToBuffer(b);
		        const lo32 = buffer.readUInt32LE(offset);
		        const hi32 = buffer.readUInt32LE(offset + 4);
		        return roundedInt64(hi32, lo32);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        const split = divmodInt64(src);
		        const buffer = uint8ArrayToBuffer(b);
		        buffer.writeUInt32LE(split.lo32, offset);
		        buffer.writeUInt32LE(split.hi32, offset + 4);
		        return 8;
		    }
		}
		Layout.NearUInt64 = NearUInt64;
		/**
		 * Represent an unsigned 64-bit integer in big-endian format when
		 * encoded and as a near integral JavaScript Number when decoded.
		 *
		 * *Factory*: {@link module:Layout.nu64be|nu64be}
		 *
		 * **NOTE** Values with magnitude greater than 2^52 may not decode to
		 * the exact value of the encoded representation.
		 *
		 * @augments {Layout}
		 */
		class NearUInt64BE extends Layout$1 {
		    constructor(property) {
		        super(8, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const buffer = uint8ArrayToBuffer(b);
		        const hi32 = buffer.readUInt32BE(offset);
		        const lo32 = buffer.readUInt32BE(offset + 4);
		        return roundedInt64(hi32, lo32);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        const split = divmodInt64(src);
		        const buffer = uint8ArrayToBuffer(b);
		        buffer.writeUInt32BE(split.hi32, offset);
		        buffer.writeUInt32BE(split.lo32, offset + 4);
		        return 8;
		    }
		}
		Layout.NearUInt64BE = NearUInt64BE;
		/**
		 * Represent a signed 64-bit integer in little-endian format when
		 * encoded and as a near integral JavaScript Number when decoded.
		 *
		 * *Factory*: {@link module:Layout.ns64|ns64}
		 *
		 * **NOTE** Values with magnitude greater than 2^52 may not decode to
		 * the exact value of the encoded representation.
		 *
		 * @augments {Layout}
		 */
		class NearInt64 extends Layout$1 {
		    constructor(property) {
		        super(8, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const buffer = uint8ArrayToBuffer(b);
		        const lo32 = buffer.readUInt32LE(offset);
		        const hi32 = buffer.readInt32LE(offset + 4);
		        return roundedInt64(hi32, lo32);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        const split = divmodInt64(src);
		        const buffer = uint8ArrayToBuffer(b);
		        buffer.writeUInt32LE(split.lo32, offset);
		        buffer.writeInt32LE(split.hi32, offset + 4);
		        return 8;
		    }
		}
		Layout.NearInt64 = NearInt64;
		/**
		 * Represent a signed 64-bit integer in big-endian format when
		 * encoded and as a near integral JavaScript Number when decoded.
		 *
		 * *Factory*: {@link module:Layout.ns64be|ns64be}
		 *
		 * **NOTE** Values with magnitude greater than 2^52 may not decode to
		 * the exact value of the encoded representation.
		 *
		 * @augments {Layout}
		 */
		class NearInt64BE extends Layout$1 {
		    constructor(property) {
		        super(8, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const buffer = uint8ArrayToBuffer(b);
		        const hi32 = buffer.readInt32BE(offset);
		        const lo32 = buffer.readUInt32BE(offset + 4);
		        return roundedInt64(hi32, lo32);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        const split = divmodInt64(src);
		        const buffer = uint8ArrayToBuffer(b);
		        buffer.writeInt32BE(split.hi32, offset);
		        buffer.writeUInt32BE(split.lo32, offset + 4);
		        return 8;
		    }
		}
		Layout.NearInt64BE = NearInt64BE;
		/**
		 * Represent a 32-bit floating point number in little-endian format.
		 *
		 * *Factory*: {@link module:Layout.f32|f32}
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class Float extends Layout$1 {
		    constructor(property) {
		        super(4, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readFloatLE(offset);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeFloatLE(src, offset);
		        return 4;
		    }
		}
		Layout.Float = Float;
		/**
		 * Represent a 32-bit floating point number in big-endian format.
		 *
		 * *Factory*: {@link module:Layout.f32be|f32be}
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class FloatBE extends Layout$1 {
		    constructor(property) {
		        super(4, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readFloatBE(offset);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeFloatBE(src, offset);
		        return 4;
		    }
		}
		Layout.FloatBE = FloatBE;
		/**
		 * Represent a 64-bit floating point number in little-endian format.
		 *
		 * *Factory*: {@link module:Layout.f64|f64}
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class Double extends Layout$1 {
		    constructor(property) {
		        super(8, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readDoubleLE(offset);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeDoubleLE(src, offset);
		        return 8;
		    }
		}
		Layout.Double = Double;
		/**
		 * Represent a 64-bit floating point number in big-endian format.
		 *
		 * *Factory*: {@link module:Layout.f64be|f64be}
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class DoubleBE extends Layout$1 {
		    constructor(property) {
		        super(8, property);
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        return uint8ArrayToBuffer(b).readDoubleBE(offset);
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        uint8ArrayToBuffer(b).writeDoubleBE(src, offset);
		        return 8;
		    }
		}
		Layout.DoubleBE = DoubleBE;
		/**
		 * Represent a contiguous sequence of a specific layout as an Array.
		 *
		 * *Factory*: {@link module:Layout.seq|seq}
		 *
		 * @param {Layout} elementLayout - initializer for {@link
		 * Sequence#elementLayout|elementLayout}.
		 *
		 * @param {(Number|ExternalLayout)} count - initializer for {@link
		 * Sequence#count|count}.  The parameter must be either a positive
		 * integer or an instance of {@link ExternalLayout}.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class Sequence extends Layout$1 {
		    constructor(elementLayout, count, property) {
		        if (!(elementLayout instanceof Layout$1)) {
		            throw new TypeError('elementLayout must be a Layout');
		        }
		        if (!(((count instanceof ExternalLayout) && count.isCount())
		            || (Number.isInteger(count) && (0 <= count)))) {
		            throw new TypeError('count must be non-negative integer '
		                + 'or an unsigned integer ExternalLayout');
		        }
		        let span = -1;
		        if ((!(count instanceof ExternalLayout))
		            && (0 < elementLayout.span)) {
		            span = count * elementLayout.span;
		        }
		        super(span, property);
		        /** The layout for individual elements of the sequence. */
		        this.elementLayout = elementLayout;
		        /** The number of elements in the sequence.
		         *
		         * This will be either a non-negative integer or an instance of
		         * {@link ExternalLayout} for which {@link
		         * ExternalLayout#isCount|isCount()} is `true`. */
		        this.count = count;
		    }
		    /** @override */
		    getSpan(b, offset = 0) {
		        if (0 <= this.span) {
		            return this.span;
		        }
		        let span = 0;
		        let count = this.count;
		        if (count instanceof ExternalLayout) {
		            count = count.decode(b, offset);
		        }
		        if (0 < this.elementLayout.span) {
		            span = count * this.elementLayout.span;
		        }
		        else {
		            let idx = 0;
		            while (idx < count) {
		                span += this.elementLayout.getSpan(b, offset + span);
		                ++idx;
		            }
		        }
		        return span;
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const rv = [];
		        let i = 0;
		        let count = this.count;
		        if (count instanceof ExternalLayout) {
		            count = count.decode(b, offset);
		        }
		        while (i < count) {
		            rv.push(this.elementLayout.decode(b, offset));
		            offset += this.elementLayout.getSpan(b, offset);
		            i += 1;
		        }
		        return rv;
		    }
		    /** Implement {@link Layout#encode|encode} for {@link Sequence}.
		     *
		     * **NOTE** If `src` is shorter than {@link Sequence#count|count} then
		     * the unused space in the buffer is left unchanged.  If `src` is
		     * longer than {@link Sequence#count|count} the unneeded elements are
		     * ignored.
		     *
		     * **NOTE** If {@link Layout#count|count} is an instance of {@link
		     * ExternalLayout} then the length of `src` will be encoded as the
		     * count after `src` is encoded. */
		    encode(src, b, offset = 0) {
		        const elo = this.elementLayout;
		        const span = src.reduce((span, v) => {
		            return span + elo.encode(v, b, offset + span);
		        }, 0);
		        if (this.count instanceof ExternalLayout) {
		            this.count.encode(src.length, b, offset);
		        }
		        return span;
		    }
		}
		Layout.Sequence = Sequence;
		/**
		 * Represent a contiguous sequence of arbitrary layout elements as an
		 * Object.
		 *
		 * *Factory*: {@link module:Layout.struct|struct}
		 *
		 * **NOTE** The {@link Layout#span|span} of the structure is variable
		 * if any layout in {@link Structure#fields|fields} has a variable
		 * span.  When {@link Layout#encode|encoding} we must have a value for
		 * all variable-length fields, or we wouldn't be able to figure out
		 * how much space to use for storage.  We can only identify the value
		 * for a field when it has a {@link Layout#property|property}.  As
		 * such, although a structure may contain both unnamed fields and
		 * variable-length fields, it cannot contain an unnamed
		 * variable-length field.
		 *
		 * @param {Layout[]} fields - initializer for {@link
		 * Structure#fields|fields}.  An error is raised if this contains a
		 * variable-length field for which a {@link Layout#property|property}
		 * is not defined.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @param {Boolean} [decodePrefixes] - initializer for {@link
		 * Structure#decodePrefixes|property}.
		 *
		 * @throws {Error} - if `fields` contains an unnamed variable-length
		 * layout.
		 *
		 * @augments {Layout}
		 */
		class Structure extends Layout$1 {
		    constructor(fields, property, decodePrefixes) {
		        if (!(Array.isArray(fields)
		            && fields.reduce((acc, v) => acc && (v instanceof Layout$1), true))) {
		            throw new TypeError('fields must be array of Layout instances');
		        }
		        if (('boolean' === typeof property)
		            && (undefined === decodePrefixes)) {
		            decodePrefixes = property;
		            property = undefined;
		        }
		        /* Verify absence of unnamed variable-length fields. */
		        for (const fd of fields) {
		            if ((0 > fd.span)
		                && (undefined === fd.property)) {
		                throw new Error('fields cannot contain unnamed variable-length layout');
		            }
		        }
		        let span = -1;
		        try {
		            span = fields.reduce((span, fd) => span + fd.getSpan(), 0);
		        }
		        catch (e) {
		            // ignore error
		        }
		        super(span, property);
		        /** The sequence of {@link Layout} values that comprise the
		         * structure.
		         *
		         * The individual elements need not be the same type, and may be
		         * either scalar or aggregate layouts.  If a member layout leaves
		         * its {@link Layout#property|property} undefined the
		         * corresponding region of the buffer associated with the element
		         * will not be mutated.
		         *
		         * @type {Layout[]} */
		        this.fields = fields;
		        /** Control behavior of {@link Layout#decode|decode()} given short
		         * buffers.
		         *
		         * In some situations a structure many be extended with additional
		         * fields over time, with older installations providing only a
		         * prefix of the full structure.  If this property is `true`
		         * decoding will accept those buffers and leave subsequent fields
		         * undefined, as long as the buffer ends at a field boundary.
		         * Defaults to `false`. */
		        this.decodePrefixes = !!decodePrefixes;
		    }
		    /** @override */
		    getSpan(b, offset = 0) {
		        if (0 <= this.span) {
		            return this.span;
		        }
		        let span = 0;
		        try {
		            span = this.fields.reduce((span, fd) => {
		                const fsp = fd.getSpan(b, offset);
		                offset += fsp;
		                return span + fsp;
		            }, 0);
		        }
		        catch (e) {
		            throw new RangeError('indeterminate span');
		        }
		        return span;
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        checkUint8Array(b);
		        const dest = this.makeDestinationObject();
		        for (const fd of this.fields) {
		            if (undefined !== fd.property) {
		                dest[fd.property] = fd.decode(b, offset);
		            }
		            offset += fd.getSpan(b, offset);
		            if (this.decodePrefixes
		                && (b.length === offset)) {
		                break;
		            }
		        }
		        return dest;
		    }
		    /** Implement {@link Layout#encode|encode} for {@link Structure}.
		     *
		     * If `src` is missing a property for a member with a defined {@link
		     * Layout#property|property} the corresponding region of the buffer is
		     * left unmodified. */
		    encode(src, b, offset = 0) {
		        const firstOffset = offset;
		        let lastOffset = 0;
		        let lastWrote = 0;
		        for (const fd of this.fields) {
		            let span = fd.span;
		            lastWrote = (0 < span) ? span : 0;
		            if (undefined !== fd.property) {
		                const fv = src[fd.property];
		                if (undefined !== fv) {
		                    lastWrote = fd.encode(fv, b, offset);
		                    if (0 > span) {
		                        /* Read the as-encoded span, which is not necessarily the
		                         * same as what we wrote. */
		                        span = fd.getSpan(b, offset);
		                    }
		                }
		            }
		            lastOffset = offset;
		            offset += span;
		        }
		        /* Use (lastOffset + lastWrote) instead of offset because the last
		         * item may have had a dynamic length and we don't want to include
		         * the padding between it and the end of the space reserved for
		         * it. */
		        return (lastOffset + lastWrote) - firstOffset;
		    }
		    /** @override */
		    fromArray(values) {
		        const dest = this.makeDestinationObject();
		        for (const fd of this.fields) {
		            if ((undefined !== fd.property)
		                && (0 < values.length)) {
		                dest[fd.property] = values.shift();
		            }
		        }
		        return dest;
		    }
		    /**
		     * Get access to the layout of a given property.
		     *
		     * @param {String} property - the structure member of interest.
		     *
		     * @return {Layout} - the layout associated with `property`, or
		     * undefined if there is no such property.
		     */
		    layoutFor(property) {
		        if ('string' !== typeof property) {
		            throw new TypeError('property must be string');
		        }
		        for (const fd of this.fields) {
		            if (fd.property === property) {
		                return fd;
		            }
		        }
		        return undefined;
		    }
		    /**
		     * Get the offset of a structure member.
		     *
		     * @param {String} property - the structure member of interest.
		     *
		     * @return {Number} - the offset in bytes to the start of `property`
		     * within the structure, or undefined if `property` is not a field
		     * within the structure.  If the property is a member but follows a
		     * variable-length structure member a negative number will be
		     * returned.
		     */
		    offsetOf(property) {
		        if ('string' !== typeof property) {
		            throw new TypeError('property must be string');
		        }
		        let offset = 0;
		        for (const fd of this.fields) {
		            if (fd.property === property) {
		                return offset;
		            }
		            if (0 > fd.span) {
		                offset = -1;
		            }
		            else if (0 <= offset) {
		                offset += fd.span;
		            }
		        }
		        return undefined;
		    }
		}
		Layout.Structure = Structure;
		/**
		 * An object that can provide a {@link
		 * Union#discriminator|discriminator} API for {@link Union}.
		 *
		 * **NOTE** This is an abstract base class; you can create instances
		 * if it amuses you, but they won't support the {@link
		 * UnionDiscriminator#encode|encode} or {@link
		 * UnionDiscriminator#decode|decode} functions.
		 *
		 * @param {string} [property] - Default for {@link
		 * UnionDiscriminator#property|property}.
		 *
		 * @abstract
		 */
		class UnionDiscriminator {
		    constructor(property) {
		        /** The {@link Layout#property|property} to be used when the
		         * discriminator is referenced in isolation (generally when {@link
		         * Union#decode|Union decode} cannot delegate to a specific
		         * variant). */
		        this.property = property;
		    }
		    /** Analog to {@link Layout#decode|Layout decode} for union discriminators.
		     *
		     * The implementation of this method need not reference the buffer if
		     * variant information is available through other means. */
		    decode(b, offset) {
		        throw new Error('UnionDiscriminator is abstract');
		    }
		    /** Analog to {@link Layout#decode|Layout encode} for union discriminators.
		     *
		     * The implementation of this method need not store the value if
		     * variant information is maintained through other means. */
		    encode(src, b, offset) {
		        throw new Error('UnionDiscriminator is abstract');
		    }
		}
		Layout.UnionDiscriminator = UnionDiscriminator;
		/**
		 * An object that can provide a {@link
		 * UnionDiscriminator|discriminator API} for {@link Union} using an
		 * unsigned integral {@link Layout} instance located either inside or
		 * outside the union.
		 *
		 * @param {ExternalLayout} layout - initializes {@link
		 * UnionLayoutDiscriminator#layout|layout}.  Must satisfy {@link
		 * ExternalLayout#isCount|isCount()}.
		 *
		 * @param {string} [property] - Default for {@link
		 * UnionDiscriminator#property|property}, superseding the property
		 * from `layout`, but defaulting to `variant` if neither `property`
		 * nor layout provide a property name.
		 *
		 * @augments {UnionDiscriminator}
		 */
		class UnionLayoutDiscriminator extends UnionDiscriminator {
		    constructor(layout, property) {
		        if (!((layout instanceof ExternalLayout)
		            && layout.isCount())) {
		            throw new TypeError('layout must be an unsigned integer ExternalLayout');
		        }
		        super(property || layout.property || 'variant');
		        /** The {@link ExternalLayout} used to access the discriminator
		         * value. */
		        this.layout = layout;
		    }
		    /** Delegate decoding to {@link UnionLayoutDiscriminator#layout|layout}. */
		    decode(b, offset) {
		        return this.layout.decode(b, offset);
		    }
		    /** Delegate encoding to {@link UnionLayoutDiscriminator#layout|layout}. */
		    encode(src, b, offset) {
		        return this.layout.encode(src, b, offset);
		    }
		}
		Layout.UnionLayoutDiscriminator = UnionLayoutDiscriminator;
		/**
		 * Represent any number of span-compatible layouts.
		 *
		 * *Factory*: {@link module:Layout.union|union}
		 *
		 * If the union has a {@link Union#defaultLayout|default layout} that
		 * layout must have a non-negative {@link Layout#span|span}.  The span
		 * of a fixed-span union includes its {@link
		 * Union#discriminator|discriminator} if the variant is a {@link
		 * Union#usesPrefixDiscriminator|prefix of the union}, plus the span
		 * of its {@link Union#defaultLayout|default layout}.
		 *
		 * If the union does not have a default layout then the encoded span
		 * of the union depends on the encoded span of its variant (which may
		 * be fixed or variable).
		 *
		 * {@link VariantLayout#layout|Variant layout}s are added through
		 * {@link Union#addVariant|addVariant}.  If the union has a default
		 * layout, the span of the {@link VariantLayout#layout|layout
		 * contained by the variant} must not exceed the span of the {@link
		 * Union#defaultLayout|default layout} (minus the span of a {@link
		 * Union#usesPrefixDiscriminator|prefix disriminator}, if used).  The
		 * span of the variant will equal the span of the union itself.
		 *
		 * The variant for a buffer can only be identified from the {@link
		 * Union#discriminator|discriminator} {@link
		 * UnionDiscriminator#property|property} (in the case of the {@link
		 * Union#defaultLayout|default layout}), or by using {@link
		 * Union#getVariant|getVariant} and examining the resulting {@link
		 * VariantLayout} instance.
		 *
		 * A variant compatible with a JavaScript object can be identified
		 * using {@link Union#getSourceVariant|getSourceVariant}.
		 *
		 * @param {(UnionDiscriminator|ExternalLayout|Layout)} discr - How to
		 * identify the layout used to interpret the union contents.  The
		 * parameter must be an instance of {@link UnionDiscriminator}, an
		 * {@link ExternalLayout} that satisfies {@link
		 * ExternalLayout#isCount|isCount()}, or {@link UInt} (or {@link
		 * UIntBE}).  When a non-external layout element is passed the layout
		 * appears at the start of the union.  In all cases the (synthesized)
		 * {@link UnionDiscriminator} instance is recorded as {@link
		 * Union#discriminator|discriminator}.
		 *
		 * @param {(Layout|null)} defaultLayout - initializer for {@link
		 * Union#defaultLayout|defaultLayout}.  If absent defaults to `null`.
		 * If `null` there is no default layout: the union has data-dependent
		 * length and attempts to decode or encode unrecognized variants will
		 * throw an exception.  A {@link Layout} instance must have a
		 * non-negative {@link Layout#span|span}, and if it lacks a {@link
		 * Layout#property|property} the {@link
		 * Union#defaultLayout|defaultLayout} will be a {@link
		 * Layout#replicate|replica} with property `content`.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class Union extends Layout$1 {
		    constructor(discr, defaultLayout, property) {
		        let discriminator;
		        if ((discr instanceof UInt)
		            || (discr instanceof UIntBE)) {
		            discriminator = new UnionLayoutDiscriminator(new OffsetLayout(discr));
		        }
		        else if ((discr instanceof ExternalLayout)
		            && discr.isCount()) {
		            discriminator = new UnionLayoutDiscriminator(discr);
		        }
		        else if (!(discr instanceof UnionDiscriminator)) {
		            throw new TypeError('discr must be a UnionDiscriminator '
		                + 'or an unsigned integer layout');
		        }
		        else {
		            discriminator = discr;
		        }
		        if (undefined === defaultLayout) {
		            defaultLayout = null;
		        }
		        if (!((null === defaultLayout)
		            || (defaultLayout instanceof Layout$1))) {
		            throw new TypeError('defaultLayout must be null or a Layout');
		        }
		        if (null !== defaultLayout) {
		            if (0 > defaultLayout.span) {
		                throw new Error('defaultLayout must have constant span');
		            }
		            if (undefined === defaultLayout.property) {
		                defaultLayout = defaultLayout.replicate('content');
		            }
		        }
		        /* The union span can be estimated only if there's a default
		         * layout.  The union spans its default layout, plus any prefix
		         * variant layout.  By construction both layouts, if present, have
		         * non-negative span. */
		        let span = -1;
		        if (defaultLayout) {
		            span = defaultLayout.span;
		            if ((0 <= span) && ((discr instanceof UInt)
		                || (discr instanceof UIntBE))) {
		                span += discriminator.layout.span;
		            }
		        }
		        super(span, property);
		        /** The interface for the discriminator value in isolation.
		         *
		         * This a {@link UnionDiscriminator} either passed to the
		         * constructor or synthesized from the `discr` constructor
		         * argument.  {@link
		         * Union#usesPrefixDiscriminator|usesPrefixDiscriminator} will be
		         * `true` iff the `discr` parameter was a non-offset {@link
		         * Layout} instance. */
		        this.discriminator = discriminator;
		        /** `true` if the {@link Union#discriminator|discriminator} is the
		         * first field in the union.
		         *
		         * If `false` the discriminator is obtained from somewhere
		         * else. */
		        this.usesPrefixDiscriminator = (discr instanceof UInt)
		            || (discr instanceof UIntBE);
		        /** The layout for non-discriminator content when the value of the
		         * discriminator is not recognized.
		         *
		         * This is the value passed to the constructor.  It is
		         * structurally equivalent to the second component of {@link
		         * Union#layout|layout} but may have a different property
		         * name. */
		        this.defaultLayout = defaultLayout;
		        /** A registry of allowed variants.
		         *
		         * The keys are unsigned integers which should be compatible with
		         * {@link Union.discriminator|discriminator}.  The property value
		         * is the corresponding {@link VariantLayout} instances assigned
		         * to this union by {@link Union#addVariant|addVariant}.
		         *
		         * **NOTE** The registry remains mutable so that variants can be
		         * {@link Union#addVariant|added} at any time.  Users should not
		         * manipulate the content of this property. */
		        this.registry = {};
		        /* Private variable used when invoking getSourceVariant */
		        let boundGetSourceVariant = this.defaultGetSourceVariant.bind(this);
		        /** Function to infer the variant selected by a source object.
		         *
		         * Defaults to {@link
		         * Union#defaultGetSourceVariant|defaultGetSourceVariant} but may
		         * be overridden using {@link
		         * Union#configGetSourceVariant|configGetSourceVariant}.
		         *
		         * @param {Object} src - as with {@link
		         * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
		         *
		         * @returns {(undefined|VariantLayout)} The default variant
		         * (`undefined`) or first registered variant that uses a property
		         * available in `src`. */
		        this.getSourceVariant = function (src) {
		            return boundGetSourceVariant(src);
		        };
		        /** Function to override the implementation of {@link
		         * Union#getSourceVariant|getSourceVariant}.
		         *
		         * Use this if the desired variant cannot be identified using the
		         * algorithm of {@link
		         * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
		         *
		         * **NOTE** The provided function will be invoked bound to this
		         * Union instance, providing local access to {@link
		         * Union#registry|registry}.
		         *
		         * @param {Function} gsv - a function that follows the API of
		         * {@link Union#defaultGetSourceVariant|defaultGetSourceVariant}. */
		        this.configGetSourceVariant = function (gsv) {
		            boundGetSourceVariant = gsv.bind(this);
		        };
		    }
		    /** @override */
		    getSpan(b, offset = 0) {
		        if (0 <= this.span) {
		            return this.span;
		        }
		        /* Default layouts always have non-negative span, so we don't have
		         * one and we have to recognize the variant which will in turn
		         * determine the span. */
		        const vlo = this.getVariant(b, offset);
		        if (!vlo) {
		            throw new Error('unable to determine span for unrecognized variant');
		        }
		        return vlo.getSpan(b, offset);
		    }
		    /**
		     * Method to infer a registered Union variant compatible with `src`.
		     *
		     * The first satisfied rule in the following sequence defines the
		     * return value:
		     * * If `src` has properties matching the Union discriminator and
		     *   the default layout, `undefined` is returned regardless of the
		     *   value of the discriminator property (this ensures the default
		     *   layout will be used);
		     * * If `src` has a property matching the Union discriminator, the
		     *   value of the discriminator identifies a registered variant, and
		     *   either (a) the variant has no layout, or (b) `src` has the
		     *   variant's property, then the variant is returned (because the
		     *   source satisfies the constraints of the variant it identifies);
		     * * If `src` does not have a property matching the Union
		     *   discriminator, but does have a property matching a registered
		     *   variant, then the variant is returned (because the source
		     *   matches a variant without an explicit conflict);
		     * * An error is thrown (because we either can't identify a variant,
		     *   or we were explicitly told the variant but can't satisfy it).
		     *
		     * @param {Object} src - an object presumed to be compatible with
		     * the content of the Union.
		     *
		     * @return {(undefined|VariantLayout)} - as described above.
		     *
		     * @throws {Error} - if `src` cannot be associated with a default or
		     * registered variant.
		     */
		    defaultGetSourceVariant(src) {
		        if (Object.prototype.hasOwnProperty.call(src, this.discriminator.property)) {
		            if (this.defaultLayout && this.defaultLayout.property
		                && Object.prototype.hasOwnProperty.call(src, this.defaultLayout.property)) {
		                return undefined;
		            }
		            const vlo = this.registry[src[this.discriminator.property]];
		            if (vlo
		                && ((!vlo.layout)
		                    || (vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property)))) {
		                return vlo;
		            }
		        }
		        else {
		            for (const tag in this.registry) {
		                const vlo = this.registry[tag];
		                if (vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property)) {
		                    return vlo;
		                }
		            }
		        }
		        throw new Error('unable to infer src variant');
		    }
		    /** Implement {@link Layout#decode|decode} for {@link Union}.
		     *
		     * If the variant is {@link Union#addVariant|registered} the return
		     * value is an instance of that variant, with no explicit
		     * discriminator.  Otherwise the {@link Union#defaultLayout|default
		     * layout} is used to decode the content. */
		    decode(b, offset = 0) {
		        let dest;
		        const dlo = this.discriminator;
		        const discr = dlo.decode(b, offset);
		        const clo = this.registry[discr];
		        if (undefined === clo) {
		            const defaultLayout = this.defaultLayout;
		            let contentOffset = 0;
		            if (this.usesPrefixDiscriminator) {
		                contentOffset = dlo.layout.span;
		            }
		            dest = this.makeDestinationObject();
		            dest[dlo.property] = discr;
		            // defaultLayout.property can be undefined, but this is allowed by buffer-layout
		            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		            dest[defaultLayout.property] = defaultLayout.decode(b, offset + contentOffset);
		        }
		        else {
		            dest = clo.decode(b, offset);
		        }
		        return dest;
		    }
		    /** Implement {@link Layout#encode|encode} for {@link Union}.
		     *
		     * This API assumes the `src` object is consistent with the union's
		     * {@link Union#defaultLayout|default layout}.  To encode variants
		     * use the appropriate variant-specific {@link VariantLayout#encode}
		     * method. */
		    encode(src, b, offset = 0) {
		        const vlo = this.getSourceVariant(src);
		        if (undefined === vlo) {
		            const dlo = this.discriminator;
		            // this.defaultLayout is not undefined when vlo is undefined
		            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		            const clo = this.defaultLayout;
		            let contentOffset = 0;
		            if (this.usesPrefixDiscriminator) {
		                contentOffset = dlo.layout.span;
		            }
		            dlo.encode(src[dlo.property], b, offset);
		            // clo.property is not undefined when vlo is undefined
		            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		            return contentOffset + clo.encode(src[clo.property], b, offset + contentOffset);
		        }
		        return vlo.encode(src, b, offset);
		    }
		    /** Register a new variant structure within a union.  The newly
		     * created variant is returned.
		     *
		     * @param {Number} variant - initializer for {@link
		     * VariantLayout#variant|variant}.
		     *
		     * @param {Layout} layout - initializer for {@link
		     * VariantLayout#layout|layout}.
		     *
		     * @param {String} property - initializer for {@link
		     * Layout#property|property}.
		     *
		     * @return {VariantLayout} */
		    addVariant(variant, layout, property) {
		        const rv = new VariantLayout(this, variant, layout, property);
		        this.registry[variant] = rv;
		        return rv;
		    }
		    /**
		     * Get the layout associated with a registered variant.
		     *
		     * If `vb` does not produce a registered variant the function returns
		     * `undefined`.
		     *
		     * @param {(Number|Uint8Array)} vb - either the variant number, or a
		     * buffer from which the discriminator is to be read.
		     *
		     * @param {Number} offset - offset into `vb` for the start of the
		     * union.  Used only when `vb` is an instance of {Uint8Array}.
		     *
		     * @return {({VariantLayout}|undefined)}
		     */
		    getVariant(vb, offset = 0) {
		        let variant;
		        if (vb instanceof Uint8Array) {
		            variant = this.discriminator.decode(vb, offset);
		        }
		        else {
		            variant = vb;
		        }
		        return this.registry[variant];
		    }
		}
		Layout.Union = Union;
		/**
		 * Represent a specific variant within a containing union.
		 *
		 * **NOTE** The {@link Layout#span|span} of the variant may include
		 * the span of the {@link Union#discriminator|discriminator} used to
		 * identify it, but values read and written using the variant strictly
		 * conform to the content of {@link VariantLayout#layout|layout}.
		 *
		 * **NOTE** User code should not invoke this constructor directly.  Use
		 * the union {@link Union#addVariant|addVariant} helper method.
		 *
		 * @param {Union} union - initializer for {@link
		 * VariantLayout#union|union}.
		 *
		 * @param {Number} variant - initializer for {@link
		 * VariantLayout#variant|variant}.
		 *
		 * @param {Layout} [layout] - initializer for {@link
		 * VariantLayout#layout|layout}.  If absent the variant carries no
		 * data.
		 *
		 * @param {String} [property] - initializer for {@link
		 * Layout#property|property}.  Unlike many other layouts, variant
		 * layouts normally include a property name so they can be identified
		 * within their containing {@link Union}.  The property identifier may
		 * be absent only if `layout` is is absent.
		 *
		 * @augments {Layout}
		 */
		class VariantLayout extends Layout$1 {
		    constructor(union, variant, layout, property) {
		        if (!(union instanceof Union)) {
		            throw new TypeError('union must be a Union');
		        }
		        if ((!Number.isInteger(variant)) || (0 > variant)) {
		            throw new TypeError('variant must be a (non-negative) integer');
		        }
		        if (('string' === typeof layout)
		            && (undefined === property)) {
		            property = layout;
		            layout = null;
		        }
		        if (layout) {
		            if (!(layout instanceof Layout$1)) {
		                throw new TypeError('layout must be a Layout');
		            }
		            if ((null !== union.defaultLayout)
		                && (0 <= layout.span)
		                && (layout.span > union.defaultLayout.span)) {
		                throw new Error('variant span exceeds span of containing union');
		            }
		            if ('string' !== typeof property) {
		                throw new TypeError('variant must have a String property');
		            }
		        }
		        let span = union.span;
		        if (0 > union.span) {
		            span = layout ? layout.span : 0;
		            if ((0 <= span) && union.usesPrefixDiscriminator) {
		                span += union.discriminator.layout.span;
		            }
		        }
		        super(span, property);
		        /** The {@link Union} to which this variant belongs. */
		        this.union = union;
		        /** The unsigned integral value identifying this variant within
		         * the {@link Union#discriminator|discriminator} of the containing
		         * union. */
		        this.variant = variant;
		        /** The {@link Layout} to be used when reading/writing the
		         * non-discriminator part of the {@link
		         * VariantLayout#union|union}.  If `null` the variant carries no
		         * data. */
		        this.layout = layout || null;
		    }
		    /** @override */
		    getSpan(b, offset = 0) {
		        if (0 <= this.span) {
		            /* Will be equal to the containing union span if that is not
		             * variable. */
		            return this.span;
		        }
		        let contentOffset = 0;
		        if (this.union.usesPrefixDiscriminator) {
		            contentOffset = this.union.discriminator.layout.span;
		        }
		        /* Span is defined solely by the variant (and prefix discriminator) */
		        let span = 0;
		        if (this.layout) {
		            span = this.layout.getSpan(b, offset + contentOffset);
		        }
		        return contentOffset + span;
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const dest = this.makeDestinationObject();
		        if (this !== this.union.getVariant(b, offset)) {
		            throw new Error('variant mismatch');
		        }
		        let contentOffset = 0;
		        if (this.union.usesPrefixDiscriminator) {
		            contentOffset = this.union.discriminator.layout.span;
		        }
		        if (this.layout) {
		            dest[this.property] = this.layout.decode(b, offset + contentOffset);
		        }
		        else if (this.property) {
		            dest[this.property] = true;
		        }
		        else if (this.union.usesPrefixDiscriminator) {
		            dest[this.union.discriminator.property] = this.variant;
		        }
		        return dest;
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        let contentOffset = 0;
		        if (this.union.usesPrefixDiscriminator) {
		            contentOffset = this.union.discriminator.layout.span;
		        }
		        if (this.layout
		            && (!Object.prototype.hasOwnProperty.call(src, this.property))) {
		            throw new TypeError('variant lacks property ' + this.property);
		        }
		        this.union.discriminator.encode(this.variant, b, offset);
		        let span = contentOffset;
		        if (this.layout) {
		            this.layout.encode(src[this.property], b, offset + contentOffset);
		            span += this.layout.getSpan(b, offset + contentOffset);
		            if ((0 <= this.union.span)
		                && (span > this.union.span)) {
		                throw new Error('encoded variant overruns containing union');
		            }
		        }
		        return span;
		    }
		    /** Delegate {@link Layout#fromArray|fromArray} to {@link
		     * VariantLayout#layout|layout}. */
		    fromArray(values) {
		        if (this.layout) {
		            return this.layout.fromArray(values);
		        }
		        return undefined;
		    }
		}
		Layout.VariantLayout = VariantLayout;
		/** JavaScript chose to define bitwise operations as operating on
		 * signed 32-bit values in 2's complement form, meaning any integer
		 * with bit 31 set is going to look negative.  For right shifts that's
		 * not a problem, because `>>>` is a logical shift, but for every
		 * other bitwise operator we have to compensate for possible negative
		 * results. */
		function fixBitwiseResult(v) {
		    if (0 > v) {
		        v += 0x100000000;
		    }
		    return v;
		}
		/**
		 * Contain a sequence of bit fields as an unsigned integer.
		 *
		 * *Factory*: {@link module:Layout.bits|bits}
		 *
		 * This is a container element; within it there are {@link BitField}
		 * instances that provide the extracted properties.  The container
		 * simply defines the aggregate representation and its bit ordering.
		 * The representation is an object containing properties with numeric
		 * or {@link Boolean} values.
		 *
		 * {@link BitField}s are added with the {@link
		 * BitStructure#addField|addField} and {@link
		 * BitStructure#addBoolean|addBoolean} methods.

		 * @param {Layout} word - initializer for {@link
		 * BitStructure#word|word}.  The parameter must be an instance of
		 * {@link UInt} (or {@link UIntBE}) that is no more than 4 bytes wide.
		 *
		 * @param {bool} [msb] - `true` if the bit numbering starts at the
		 * most significant bit of the containing word; `false` (default) if
		 * it starts at the least significant bit of the containing word.  If
		 * the parameter at this position is a string and `property` is
		 * `undefined` the value of this argument will instead be used as the
		 * value of `property`.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class BitStructure extends Layout$1 {
		    constructor(word, msb, property) {
		        if (!((word instanceof UInt)
		            || (word instanceof UIntBE))) {
		            throw new TypeError('word must be a UInt or UIntBE layout');
		        }
		        if (('string' === typeof msb)
		            && (undefined === property)) {
		            property = msb;
		            msb = false;
		        }
		        if (4 < word.span) {
		            throw new RangeError('word cannot exceed 32 bits');
		        }
		        super(word.span, property);
		        /** The layout used for the packed value.  {@link BitField}
		         * instances are packed sequentially depending on {@link
		         * BitStructure#msb|msb}. */
		        this.word = word;
		        /** Whether the bit sequences are packed starting at the most
		         * significant bit growing down (`true`), or the least significant
		         * bit growing up (`false`).
		         *
		         * **NOTE** Regardless of this value, the least significant bit of
		         * any {@link BitField} value is the least significant bit of the
		         * corresponding section of the packed value. */
		        this.msb = !!msb;
		        /** The sequence of {@link BitField} layouts that comprise the
		         * packed structure.
		         *
		         * **NOTE** The array remains mutable to allow fields to be {@link
		         * BitStructure#addField|added} after construction.  Users should
		         * not manipulate the content of this property.*/
		        this.fields = [];
		        /* Storage for the value.  Capture a variable instead of using an
		         * instance property because we don't want anything to change the
		         * value without going through the mutator. */
		        let value = 0;
		        this._packedSetValue = function (v) {
		            value = fixBitwiseResult(v);
		            return this;
		        };
		        this._packedGetValue = function () {
		            return value;
		        };
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const dest = this.makeDestinationObject();
		        const value = this.word.decode(b, offset);
		        this._packedSetValue(value);
		        for (const fd of this.fields) {
		            if (undefined !== fd.property) {
		                dest[fd.property] = fd.decode(b);
		            }
		        }
		        return dest;
		    }
		    /** Implement {@link Layout#encode|encode} for {@link BitStructure}.
		     *
		     * If `src` is missing a property for a member with a defined {@link
		     * Layout#property|property} the corresponding region of the packed
		     * value is left unmodified.  Unused bits are also left unmodified. */
		    encode(src, b, offset = 0) {
		        const value = this.word.decode(b, offset);
		        this._packedSetValue(value);
		        for (const fd of this.fields) {
		            if (undefined !== fd.property) {
		                const fv = src[fd.property];
		                if (undefined !== fv) {
		                    fd.encode(fv);
		                }
		            }
		        }
		        return this.word.encode(this._packedGetValue(), b, offset);
		    }
		    /** Register a new bitfield with a containing bit structure.  The
		     * resulting bitfield is returned.
		     *
		     * @param {Number} bits - initializer for {@link BitField#bits|bits}.
		     *
		     * @param {string} property - initializer for {@link
		     * Layout#property|property}.
		     *
		     * @return {BitField} */
		    addField(bits, property) {
		        const bf = new BitField(this, bits, property);
		        this.fields.push(bf);
		        return bf;
		    }
		    /** As with {@link BitStructure#addField|addField} for single-bit
		     * fields with `boolean` value representation.
		     *
		     * @param {string} property - initializer for {@link
		     * Layout#property|property}.
		     *
		     * @return {Boolean} */
		    // `Boolean` conflicts with the native primitive type
		    // eslint-disable-next-line @typescript-eslint/ban-types
		    addBoolean(property) {
		        // This is my Boolean, not the Javascript one.
		        const bf = new Boolean(this, property);
		        this.fields.push(bf);
		        return bf;
		    }
		    /**
		     * Get access to the bit field for a given property.
		     *
		     * @param {String} property - the bit field of interest.
		     *
		     * @return {BitField} - the field associated with `property`, or
		     * undefined if there is no such property.
		     */
		    fieldFor(property) {
		        if ('string' !== typeof property) {
		            throw new TypeError('property must be string');
		        }
		        for (const fd of this.fields) {
		            if (fd.property === property) {
		                return fd;
		            }
		        }
		        return undefined;
		    }
		}
		Layout.BitStructure = BitStructure;
		/**
		 * Represent a sequence of bits within a {@link BitStructure}.
		 *
		 * All bit field values are represented as unsigned integers.
		 *
		 * **NOTE** User code should not invoke this constructor directly.
		 * Use the container {@link BitStructure#addField|addField} helper
		 * method.
		 *
		 * **NOTE** BitField instances are not instances of {@link Layout}
		 * since {@link Layout#span|span} measures 8-bit units.
		 *
		 * @param {BitStructure} container - initializer for {@link
		 * BitField#container|container}.
		 *
		 * @param {Number} bits - initializer for {@link BitField#bits|bits}.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 */
		class BitField {
		    constructor(container, bits, property) {
		        if (!(container instanceof BitStructure)) {
		            throw new TypeError('container must be a BitStructure');
		        }
		        if ((!Number.isInteger(bits)) || (0 >= bits)) {
		            throw new TypeError('bits must be positive integer');
		        }
		        const totalBits = 8 * container.span;
		        const usedBits = container.fields.reduce((sum, fd) => sum + fd.bits, 0);
		        if ((bits + usedBits) > totalBits) {
		            throw new Error('bits too long for span remainder ('
		                + (totalBits - usedBits) + ' of '
		                + totalBits + ' remain)');
		        }
		        /** The {@link BitStructure} instance to which this bit field
		         * belongs. */
		        this.container = container;
		        /** The span of this value in bits. */
		        this.bits = bits;
		        /** A mask of {@link BitField#bits|bits} bits isolating value bits
		         * that fit within the field.
		         *
		         * That is, it masks a value that has not yet been shifted into
		         * position within its containing packed integer. */
		        this.valueMask = (1 << bits) - 1;
		        if (32 === bits) { // shifted value out of range
		            this.valueMask = 0xFFFFFFFF;
		        }
		        /** The offset of the value within the containing packed unsigned
		         * integer.  The least significant bit of the packed value is at
		         * offset zero, regardless of bit ordering used. */
		        this.start = usedBits;
		        if (this.container.msb) {
		            this.start = totalBits - usedBits - bits;
		        }
		        /** A mask of {@link BitField#bits|bits} isolating the field value
		         * within the containing packed unsigned integer. */
		        this.wordMask = fixBitwiseResult(this.valueMask << this.start);
		        /** The property name used when this bitfield is represented in an
		         * Object.
		         *
		         * Intended to be functionally equivalent to {@link
		         * Layout#property}.
		         *
		         * If left undefined the corresponding span of bits will be
		         * treated as padding: it will not be mutated by {@link
		         * Layout#encode|encode} nor represented as a property in the
		         * decoded Object. */
		        this.property = property;
		    }
		    /** Store a value into the corresponding subsequence of the containing
		     * bit field. */
		    decode(b, offset) {
		        const word = this.container._packedGetValue();
		        const wordValue = fixBitwiseResult(word & this.wordMask);
		        const value = wordValue >>> this.start;
		        return value;
		    }
		    /** Store a value into the corresponding subsequence of the containing
		     * bit field.
		     *
		     * **NOTE** This is not a specialization of {@link
		     * Layout#encode|Layout.encode} and there is no return value. */
		    encode(value) {
		        if ('number' !== typeof value
		            || !Number.isInteger(value)
		            || (value !== fixBitwiseResult(value & this.valueMask))) {
		            throw new TypeError(nameWithProperty('BitField.encode', this)
		                + ' value must be integer not exceeding ' + this.valueMask);
		        }
		        const word = this.container._packedGetValue();
		        const wordValue = fixBitwiseResult(value << this.start);
		        this.container._packedSetValue(fixBitwiseResult(word & ~this.wordMask)
		            | wordValue);
		    }
		}
		Layout.BitField = BitField;
		/**
		 * Represent a single bit within a {@link BitStructure} as a
		 * JavaScript boolean.
		 *
		 * **NOTE** User code should not invoke this constructor directly.
		 * Use the container {@link BitStructure#addBoolean|addBoolean} helper
		 * method.
		 *
		 * @param {BitStructure} container - initializer for {@link
		 * BitField#container|container}.
		 *
		 * @param {string} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {BitField}
		 */
		/* eslint-disable no-extend-native */
		class Boolean extends BitField {
		    constructor(container, property) {
		        super(container, 1, property);
		    }
		    /** Override {@link BitField#decode|decode} for {@link Boolean|Boolean}.
		     *
		     * @returns {boolean} */
		    decode(b, offset) {
		        return !!super.decode(b, offset);
		    }
		    /** @override */
		    encode(value) {
		        if ('boolean' === typeof value) {
		            // BitField requires integer values
		            value = +value;
		        }
		        super.encode(value);
		    }
		}
		Layout.Boolean = Boolean;
		/* eslint-enable no-extend-native */
		/**
		 * Contain a fixed-length block of arbitrary data, represented as a
		 * Uint8Array.
		 *
		 * *Factory*: {@link module:Layout.blob|blob}
		 *
		 * @param {(Number|ExternalLayout)} length - initializes {@link
		 * Blob#length|length}.
		 *
		 * @param {String} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class Blob extends Layout$1 {
		    constructor(length, property) {
		        if (!(((length instanceof ExternalLayout) && length.isCount())
		            || (Number.isInteger(length) && (0 <= length)))) {
		            throw new TypeError('length must be positive integer '
		                + 'or an unsigned integer ExternalLayout');
		        }
		        let span = -1;
		        if (!(length instanceof ExternalLayout)) {
		            span = length;
		        }
		        super(span, property);
		        /** The number of bytes in the blob.
		         *
		         * This may be a non-negative integer, or an instance of {@link
		         * ExternalLayout} that satisfies {@link
		         * ExternalLayout#isCount|isCount()}. */
		        this.length = length;
		    }
		    /** @override */
		    getSpan(b, offset) {
		        let span = this.span;
		        if (0 > span) {
		            span = this.length.decode(b, offset);
		        }
		        return span;
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        let span = this.span;
		        if (0 > span) {
		            span = this.length.decode(b, offset);
		        }
		        return uint8ArrayToBuffer(b).slice(offset, offset + span);
		    }
		    /** Implement {@link Layout#encode|encode} for {@link Blob}.
		     *
		     * **NOTE** If {@link Layout#count|count} is an instance of {@link
		     * ExternalLayout} then the length of `src` will be encoded as the
		     * count after `src` is encoded. */
		    encode(src, b, offset) {
		        let span = this.length;
		        if (this.length instanceof ExternalLayout) {
		            span = src.length;
		        }
		        if (!(src instanceof Uint8Array && span === src.length)) {
		            throw new TypeError(nameWithProperty('Blob.encode', this)
		                + ' requires (length ' + span + ') Uint8Array as src');
		        }
		        if ((offset + span) > b.length) {
		            throw new RangeError('encoding overruns Uint8Array');
		        }
		        const srcBuffer = uint8ArrayToBuffer(src);
		        uint8ArrayToBuffer(b).write(srcBuffer.toString('hex'), offset, span, 'hex');
		        if (this.length instanceof ExternalLayout) {
		            this.length.encode(span, b, offset);
		        }
		        return span;
		    }
		}
		Layout.Blob = Blob;
		/**
		 * Contain a `NUL`-terminated UTF8 string.
		 *
		 * *Factory*: {@link module:Layout.cstr|cstr}
		 *
		 * **NOTE** Any UTF8 string that incorporates a zero-valued byte will
		 * not be correctly decoded by this layout.
		 *
		 * @param {String} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class CString extends Layout$1 {
		    constructor(property) {
		        super(-1, property);
		    }
		    /** @override */
		    getSpan(b, offset = 0) {
		        checkUint8Array(b);
		        let idx = offset;
		        while ((idx < b.length) && (0 !== b[idx])) {
		            idx += 1;
		        }
		        return 1 + idx - offset;
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const span = this.getSpan(b, offset);
		        return uint8ArrayToBuffer(b).slice(offset, offset + span - 1).toString('utf-8');
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        /* Must force this to a string, lest it be a number and the
		         * "utf8-encoding" below actually allocate a buffer of length
		         * src */
		        if ('string' !== typeof src) {
		            src = String(src);
		        }
		        const srcb = buffer_1.Buffer.from(src, 'utf8');
		        const span = srcb.length;
		        if ((offset + span) > b.length) {
		            throw new RangeError('encoding overruns Buffer');
		        }
		        const buffer = uint8ArrayToBuffer(b);
		        srcb.copy(buffer, offset);
		        buffer[offset + span] = 0;
		        return span + 1;
		    }
		}
		Layout.CString = CString;
		/**
		 * Contain a UTF8 string with implicit length.
		 *
		 * *Factory*: {@link module:Layout.utf8|utf8}
		 *
		 * **NOTE** Because the length is implicit in the size of the buffer
		 * this layout should be used only in isolation, or in a situation
		 * where the length can be expressed by operating on a slice of the
		 * containing buffer.
		 *
		 * @param {Number} [maxSpan] - the maximum length allowed for encoded
		 * string content.  If not provided there is no bound on the allowed
		 * content.
		 *
		 * @param {String} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class UTF8 extends Layout$1 {
		    constructor(maxSpan, property) {
		        if (('string' === typeof maxSpan) && (undefined === property)) {
		            property = maxSpan;
		            maxSpan = undefined;
		        }
		        if (undefined === maxSpan) {
		            maxSpan = -1;
		        }
		        else if (!Number.isInteger(maxSpan)) {
		            throw new TypeError('maxSpan must be an integer');
		        }
		        super(-1, property);
		        /** The maximum span of the layout in bytes.
		         *
		         * Positive values are generally expected.  Zero is abnormal.
		         * Attempts to encode or decode a value that exceeds this length
		         * will throw a `RangeError`.
		         *
		         * A negative value indicates that there is no bound on the length
		         * of the content. */
		        this.maxSpan = maxSpan;
		    }
		    /** @override */
		    getSpan(b, offset = 0) {
		        checkUint8Array(b);
		        return b.length - offset;
		    }
		    /** @override */
		    decode(b, offset = 0) {
		        const span = this.getSpan(b, offset);
		        if ((0 <= this.maxSpan)
		            && (this.maxSpan < span)) {
		            throw new RangeError('text length exceeds maxSpan');
		        }
		        return uint8ArrayToBuffer(b).slice(offset, offset + span).toString('utf-8');
		    }
		    /** @override */
		    encode(src, b, offset = 0) {
		        /* Must force this to a string, lest it be a number and the
		         * "utf8-encoding" below actually allocate a buffer of length
		         * src */
		        if ('string' !== typeof src) {
		            src = String(src);
		        }
		        const srcb = buffer_1.Buffer.from(src, 'utf8');
		        const span = srcb.length;
		        if ((0 <= this.maxSpan)
		            && (this.maxSpan < span)) {
		            throw new RangeError('text length exceeds maxSpan');
		        }
		        if ((offset + span) > b.length) {
		            throw new RangeError('encoding overruns Buffer');
		        }
		        srcb.copy(uint8ArrayToBuffer(b), offset);
		        return span;
		    }
		}
		Layout.UTF8 = UTF8;
		/**
		 * Contain a constant value.
		 *
		 * This layout may be used in cases where a JavaScript value can be
		 * inferred without an expression in the binary encoding.  An example
		 * would be a {@link VariantLayout|variant layout} where the content
		 * is implied by the union {@link Union#discriminator|discriminator}.
		 *
		 * @param {Object|Number|String} value - initializer for {@link
		 * Constant#value|value}.  If the value is an object (or array) and
		 * the application intends the object to remain unchanged regardless
		 * of what is done to values decoded by this layout, the value should
		 * be frozen prior passing it to this constructor.
		 *
		 * @param {String} [property] - initializer for {@link
		 * Layout#property|property}.
		 *
		 * @augments {Layout}
		 */
		class Constant extends Layout$1 {
		    constructor(value, property) {
		        super(0, property);
		        /** The value produced by this constant when the layout is {@link
		         * Constant#decode|decoded}.
		         *
		         * Any JavaScript value including `null` and `undefined` is
		         * permitted.
		         *
		         * **WARNING** If `value` passed in the constructor was not
		         * frozen, it is possible for users of decoded values to change
		         * the content of the value. */
		        this.value = value;
		    }
		    /** @override */
		    decode(b, offset) {
		        return this.value;
		    }
		    /** @override */
		    encode(src, b, offset) {
		        /* Constants take no space */
		        return 0;
		    }
		}
		Layout.Constant = Constant;
		/** Factory for {@link GreedyCount}. */
		Layout.greedy = ((elementSpan, property) => new GreedyCount(elementSpan, property));
		/** Factory for {@link OffsetLayout}. */
		Layout.offset = ((layout, offset, property) => new OffsetLayout(layout, offset, property));
		/** Factory for {@link UInt|unsigned int layouts} spanning one
		 * byte. */
		Layout.u8 = ((property) => new UInt(1, property));
		/** Factory for {@link UInt|little-endian unsigned int layouts}
		 * spanning two bytes. */
		Layout.u16 = ((property) => new UInt(2, property));
		/** Factory for {@link UInt|little-endian unsigned int layouts}
		 * spanning three bytes. */
		Layout.u24 = ((property) => new UInt(3, property));
		/** Factory for {@link UInt|little-endian unsigned int layouts}
		 * spanning four bytes. */
		Layout.u32 = ((property) => new UInt(4, property));
		/** Factory for {@link UInt|little-endian unsigned int layouts}
		 * spanning five bytes. */
		Layout.u40 = ((property) => new UInt(5, property));
		/** Factory for {@link UInt|little-endian unsigned int layouts}
		 * spanning six bytes. */
		Layout.u48 = ((property) => new UInt(6, property));
		/** Factory for {@link NearUInt64|little-endian unsigned int
		 * layouts} interpreted as Numbers. */
		Layout.nu64 = ((property) => new NearUInt64(property));
		/** Factory for {@link UInt|big-endian unsigned int layouts}
		 * spanning two bytes. */
		Layout.u16be = ((property) => new UIntBE(2, property));
		/** Factory for {@link UInt|big-endian unsigned int layouts}
		 * spanning three bytes. */
		Layout.u24be = ((property) => new UIntBE(3, property));
		/** Factory for {@link UInt|big-endian unsigned int layouts}
		 * spanning four bytes. */
		Layout.u32be = ((property) => new UIntBE(4, property));
		/** Factory for {@link UInt|big-endian unsigned int layouts}
		 * spanning five bytes. */
		Layout.u40be = ((property) => new UIntBE(5, property));
		/** Factory for {@link UInt|big-endian unsigned int layouts}
		 * spanning six bytes. */
		Layout.u48be = ((property) => new UIntBE(6, property));
		/** Factory for {@link NearUInt64BE|big-endian unsigned int
		 * layouts} interpreted as Numbers. */
		Layout.nu64be = ((property) => new NearUInt64BE(property));
		/** Factory for {@link Int|signed int layouts} spanning one
		 * byte. */
		Layout.s8 = ((property) => new Int(1, property));
		/** Factory for {@link Int|little-endian signed int layouts}
		 * spanning two bytes. */
		Layout.s16 = ((property) => new Int(2, property));
		/** Factory for {@link Int|little-endian signed int layouts}
		 * spanning three bytes. */
		Layout.s24 = ((property) => new Int(3, property));
		/** Factory for {@link Int|little-endian signed int layouts}
		 * spanning four bytes. */
		Layout.s32 = ((property) => new Int(4, property));
		/** Factory for {@link Int|little-endian signed int layouts}
		 * spanning five bytes. */
		Layout.s40 = ((property) => new Int(5, property));
		/** Factory for {@link Int|little-endian signed int layouts}
		 * spanning six bytes. */
		Layout.s48 = ((property) => new Int(6, property));
		/** Factory for {@link NearInt64|little-endian signed int layouts}
		 * interpreted as Numbers. */
		Layout.ns64 = ((property) => new NearInt64(property));
		/** Factory for {@link Int|big-endian signed int layouts}
		 * spanning two bytes. */
		Layout.s16be = ((property) => new IntBE(2, property));
		/** Factory for {@link Int|big-endian signed int layouts}
		 * spanning three bytes. */
		Layout.s24be = ((property) => new IntBE(3, property));
		/** Factory for {@link Int|big-endian signed int layouts}
		 * spanning four bytes. */
		Layout.s32be = ((property) => new IntBE(4, property));
		/** Factory for {@link Int|big-endian signed int layouts}
		 * spanning five bytes. */
		Layout.s40be = ((property) => new IntBE(5, property));
		/** Factory for {@link Int|big-endian signed int layouts}
		 * spanning six bytes. */
		Layout.s48be = ((property) => new IntBE(6, property));
		/** Factory for {@link NearInt64BE|big-endian signed int layouts}
		 * interpreted as Numbers. */
		Layout.ns64be = ((property) => new NearInt64BE(property));
		/** Factory for {@link Float|little-endian 32-bit floating point} values. */
		Layout.f32 = ((property) => new Float(property));
		/** Factory for {@link FloatBE|big-endian 32-bit floating point} values. */
		Layout.f32be = ((property) => new FloatBE(property));
		/** Factory for {@link Double|little-endian 64-bit floating point} values. */
		Layout.f64 = ((property) => new Double(property));
		/** Factory for {@link DoubleBE|big-endian 64-bit floating point} values. */
		Layout.f64be = ((property) => new DoubleBE(property));
		/** Factory for {@link Structure} values. */
		Layout.struct = ((fields, property, decodePrefixes) => new Structure(fields, property, decodePrefixes));
		/** Factory for {@link BitStructure} values. */
		Layout.bits = ((word, msb, property) => new BitStructure(word, msb, property));
		/** Factory for {@link Sequence} values. */
		Layout.seq = ((elementLayout, count, property) => new Sequence(elementLayout, count, property));
		/** Factory for {@link Union} values. */
		Layout.union = ((discr, defaultLayout, property) => new Union(discr, defaultLayout, property));
		/** Factory for {@link UnionLayoutDiscriminator} values. */
		Layout.unionLayoutDiscriminator = ((layout, property) => new UnionLayoutDiscriminator(layout, property));
		/** Factory for {@link Blob} values. */
		Layout.blob = ((length, property) => new Blob(length, property));
		/** Factory for {@link CString} values. */
		Layout.cstr = ((property) => new CString(property));
		/** Factory for {@link UTF8} values. */
		Layout.utf8 = ((maxSpan, property) => new UTF8(maxSpan, property));
		/** Factory for {@link Constant} values. */
		Layout.constant = ((value, property) => new Constant(value, property));
		
		return Layout;
	}

	var LayoutExports = /*@__PURE__*/ requireLayout();

	/**
	 * Maximum over-the-wire size of a Transaction
	 *
	 * 1280 is IPv6 minimum MTU
	 * 40 bytes is the size of the IPv6 header
	 * 8 bytes is the size of the fragment header
	 */
	const PACKET_DATA_SIZE = 1280 - 40 - 8;
	const VERSION_PREFIX_MASK = 0x7f;
	const SIGNATURE_LENGTH_IN_BYTES = 64;

	class TransactionExpiredBlockheightExceededError extends Error {
	  constructor(signature) {
	    super(`Signature ${signature} has expired: block height exceeded.`);
	    this.signature = void 0;
	    this.signature = signature;
	  }
	}
	Object.defineProperty(TransactionExpiredBlockheightExceededError.prototype, 'name', {
	  value: 'TransactionExpiredBlockheightExceededError'
	});
	class TransactionExpiredTimeoutError extends Error {
	  constructor(signature, timeoutSeconds) {
	    super(`Transaction was not confirmed in ${timeoutSeconds.toFixed(2)} seconds. It is ` + 'unknown if it succeeded or failed. Check signature ' + `${signature} using the Solana Explorer or CLI tools.`);
	    this.signature = void 0;
	    this.signature = signature;
	  }
	}
	Object.defineProperty(TransactionExpiredTimeoutError.prototype, 'name', {
	  value: 'TransactionExpiredTimeoutError'
	});
	class TransactionExpiredNonceInvalidError extends Error {
	  constructor(signature) {
	    super(`Signature ${signature} has expired: the nonce is no longer valid.`);
	    this.signature = void 0;
	    this.signature = signature;
	  }
	}
	Object.defineProperty(TransactionExpiredNonceInvalidError.prototype, 'name', {
	  value: 'TransactionExpiredNonceInvalidError'
	});

	class MessageAccountKeys {
	  constructor(staticAccountKeys, accountKeysFromLookups) {
	    this.staticAccountKeys = void 0;
	    this.accountKeysFromLookups = void 0;
	    this.staticAccountKeys = staticAccountKeys;
	    this.accountKeysFromLookups = accountKeysFromLookups;
	  }
	  keySegments() {
	    const keySegments = [this.staticAccountKeys];
	    if (this.accountKeysFromLookups) {
	      keySegments.push(this.accountKeysFromLookups.writable);
	      keySegments.push(this.accountKeysFromLookups.readonly);
	    }
	    return keySegments;
	  }
	  get(index) {
	    for (const keySegment of this.keySegments()) {
	      if (index < keySegment.length) {
	        return keySegment[index];
	      } else {
	        index -= keySegment.length;
	      }
	    }
	    return;
	  }
	  get length() {
	    return this.keySegments().flat().length;
	  }
	  compileInstructions(instructions) {
	    // Bail early if any account indexes would overflow a u8
	    const U8_MAX = 255;
	    if (this.length > U8_MAX + 1) {
	      throw new Error('Account index overflow encountered during compilation');
	    }
	    const keyIndexMap = new Map();
	    this.keySegments().flat().forEach((key, index) => {
	      keyIndexMap.set(key.toBase58(), index);
	    });
	    const findKeyIndex = key => {
	      const keyIndex = keyIndexMap.get(key.toBase58());
	      if (keyIndex === undefined) throw new Error('Encountered an unknown instruction account key during compilation');
	      return keyIndex;
	    };
	    return instructions.map(instruction => {
	      return {
	        programIdIndex: findKeyIndex(instruction.programId),
	        accountKeyIndexes: instruction.keys.map(meta => findKeyIndex(meta.pubkey)),
	        data: instruction.data
	      };
	    });
	  }
	}

	/**
	 * Layout for a public key
	 */
	const publicKey = (property = 'publicKey') => {
	  return LayoutExports.blob(32, property);
	};

	/**
	 * Layout for a signature
	 */
	const signature = (property = 'signature') => {
	  return LayoutExports.blob(64, property);
	};
	/**
	 * Layout for a Rust String type
	 */
	const rustString = (property = 'string') => {
	  const rsl = LayoutExports.struct([LayoutExports.u32('length'), LayoutExports.u32('lengthPadding'), LayoutExports.blob(LayoutExports.offset(LayoutExports.u32(), -8), 'chars')], property);
	  const _decode = rsl.decode.bind(rsl);
	  const _encode = rsl.encode.bind(rsl);
	  const rslShim = rsl;
	  rslShim.decode = (b, offset) => {
	    const data = _decode(b, offset);
	    return data['chars'].toString();
	  };
	  rslShim.encode = (str, b, offset) => {
	    const data = {
	      chars: bufferExports.Buffer.from(str, 'utf8')
	    };
	    return _encode(data, b, offset);
	  };
	  rslShim.alloc = str => {
	    return LayoutExports.u32().span + LayoutExports.u32().span + bufferExports.Buffer.from(str, 'utf8').length;
	  };
	  return rslShim;
	};

	/**
	 * Layout for an Authorized object
	 */
	const authorized = (property = 'authorized') => {
	  return LayoutExports.struct([publicKey('staker'), publicKey('withdrawer')], property);
	};

	/**
	 * Layout for a Lockup object
	 */
	const lockup = (property = 'lockup') => {
	  return LayoutExports.struct([LayoutExports.ns64('unixTimestamp'), LayoutExports.ns64('epoch'), publicKey('custodian')], property);
	};

	/**
	 *  Layout for a VoteInit object
	 */
	const voteInit = (property = 'voteInit') => {
	  return LayoutExports.struct([publicKey('nodePubkey'), publicKey('authorizedVoter'), publicKey('authorizedWithdrawer'), LayoutExports.u8('commission')], property);
	};

	/**
	 *  Layout for a VoteAuthorizeWithSeedArgs object
	 */
	const voteAuthorizeWithSeedArgs = (property = 'voteAuthorizeWithSeedArgs') => {
	  return LayoutExports.struct([LayoutExports.u32('voteAuthorizationType'), publicKey('currentAuthorityDerivedKeyOwnerPubkey'), rustString('currentAuthorityDerivedKeySeed'), publicKey('newAuthorized')], property);
	};
	function getAlloc(type, fields) {
	  const getItemAlloc = item => {
	    if (item.span >= 0) {
	      return item.span;
	    } else if (typeof item.alloc === 'function') {
	      return item.alloc(fields[item.property]);
	    } else if ('count' in item && 'elementLayout' in item) {
	      const field = fields[item.property];
	      if (Array.isArray(field)) {
	        return field.length * getItemAlloc(item.elementLayout);
	      }
	    } else if ('fields' in item) {
	      // This is a `Structure` whose size needs to be recursively measured.
	      return getAlloc({
	        layout: item
	      }, fields[item.property]);
	    }
	    // Couldn't determine allocated size of layout
	    return 0;
	  };
	  let alloc = 0;
	  type.layout.fields.forEach(item => {
	    alloc += getItemAlloc(item);
	  });
	  return alloc;
	}

	function decodeLength(bytes) {
	  let len = 0;
	  let size = 0;
	  for (;;) {
	    let elem = bytes.shift();
	    len |= (elem & 0x7f) << size * 7;
	    size += 1;
	    if ((elem & 0x80) === 0) {
	      break;
	    }
	  }
	  return len;
	}
	function encodeLength(bytes, len) {
	  let rem_len = len;
	  for (;;) {
	    let elem = rem_len & 0x7f;
	    rem_len >>= 7;
	    if (rem_len == 0) {
	      bytes.push(elem);
	      break;
	    } else {
	      elem |= 0x80;
	      bytes.push(elem);
	    }
	  }
	}

	function assert$1 (condition, message) {
	  if (!condition) {
	    throw new Error(message || 'Assertion failed');
	  }
	}

	class CompiledKeys {
	  constructor(payer, keyMetaMap) {
	    this.payer = void 0;
	    this.keyMetaMap = void 0;
	    this.payer = payer;
	    this.keyMetaMap = keyMetaMap;
	  }
	  static compile(instructions, payer) {
	    const keyMetaMap = new Map();
	    const getOrInsertDefault = pubkey => {
	      const address = pubkey.toBase58();
	      let keyMeta = keyMetaMap.get(address);
	      if (keyMeta === undefined) {
	        keyMeta = {
	          isSigner: false,
	          isWritable: false,
	          isInvoked: false
	        };
	        keyMetaMap.set(address, keyMeta);
	      }
	      return keyMeta;
	    };
	    const payerKeyMeta = getOrInsertDefault(payer);
	    payerKeyMeta.isSigner = true;
	    payerKeyMeta.isWritable = true;
	    for (const ix of instructions) {
	      getOrInsertDefault(ix.programId).isInvoked = true;
	      for (const accountMeta of ix.keys) {
	        const keyMeta = getOrInsertDefault(accountMeta.pubkey);
	        keyMeta.isSigner ||= accountMeta.isSigner;
	        keyMeta.isWritable ||= accountMeta.isWritable;
	      }
	    }
	    return new CompiledKeys(payer, keyMetaMap);
	  }
	  getMessageComponents() {
	    const mapEntries = [...this.keyMetaMap.entries()];
	    assert$1(mapEntries.length <= 256, 'Max static account keys length exceeded');
	    const writableSigners = mapEntries.filter(([, meta]) => meta.isSigner && meta.isWritable);
	    const readonlySigners = mapEntries.filter(([, meta]) => meta.isSigner && !meta.isWritable);
	    const writableNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && meta.isWritable);
	    const readonlyNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && !meta.isWritable);
	    const header = {
	      numRequiredSignatures: writableSigners.length + readonlySigners.length,
	      numReadonlySignedAccounts: readonlySigners.length,
	      numReadonlyUnsignedAccounts: readonlyNonSigners.length
	    };

	    // sanity checks
	    {
	      assert$1(writableSigners.length > 0, 'Expected at least one writable signer key');
	      const [payerAddress] = writableSigners[0];
	      assert$1(payerAddress === this.payer.toBase58(), 'Expected first writable signer key to be the fee payer');
	    }
	    const staticAccountKeys = [...writableSigners.map(([address]) => new PublicKey(address)), ...readonlySigners.map(([address]) => new PublicKey(address)), ...writableNonSigners.map(([address]) => new PublicKey(address)), ...readonlyNonSigners.map(([address]) => new PublicKey(address))];
	    return [header, staticAccountKeys];
	  }
	  extractTableLookup(lookupTable) {
	    const [writableIndexes, drainedWritableKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, keyMeta => !keyMeta.isSigner && !keyMeta.isInvoked && keyMeta.isWritable);
	    const [readonlyIndexes, drainedReadonlyKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, keyMeta => !keyMeta.isSigner && !keyMeta.isInvoked && !keyMeta.isWritable);

	    // Don't extract lookup if no keys were found
	    if (writableIndexes.length === 0 && readonlyIndexes.length === 0) {
	      return;
	    }
	    return [{
	      accountKey: lookupTable.key,
	      writableIndexes,
	      readonlyIndexes
	    }, {
	      writable: drainedWritableKeys,
	      readonly: drainedReadonlyKeys
	    }];
	  }

	  /** @internal */
	  drainKeysFoundInLookupTable(lookupTableEntries, keyMetaFilter) {
	    const lookupTableIndexes = new Array();
	    const drainedKeys = new Array();
	    for (const [address, keyMeta] of this.keyMetaMap.entries()) {
	      if (keyMetaFilter(keyMeta)) {
	        const key = new PublicKey(address);
	        const lookupTableIndex = lookupTableEntries.findIndex(entry => entry.equals(key));
	        if (lookupTableIndex >= 0) {
	          assert$1(lookupTableIndex < 256, 'Max lookup table index exceeded');
	          lookupTableIndexes.push(lookupTableIndex);
	          drainedKeys.push(key);
	          this.keyMetaMap.delete(address);
	        }
	      }
	    }
	    return [lookupTableIndexes, drainedKeys];
	  }
	}

	const END_OF_BUFFER_ERROR_MESSAGE = 'Reached end of buffer unexpectedly';

	/**
	 * Delegates to `Array#shift`, but throws if the array is zero-length.
	 */
	function guardedShift(byteArray) {
	  if (byteArray.length === 0) {
	    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
	  }
	  return byteArray.shift();
	}

	/**
	 * Delegates to `Array#splice`, but throws if the section being spliced out extends past the end of
	 * the array.
	 */
	function guardedSplice(byteArray, ...args) {
	  const [start] = args;
	  if (args.length === 2 // Implies that `deleteCount` was supplied
	  ? start + (args[1] ?? 0) > byteArray.length : start >= byteArray.length) {
	    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
	  }
	  return byteArray.splice(...args);
	}

	/**
	 * An instruction to execute by a program
	 *
	 * @property {number} programIdIndex
	 * @property {number[]} accounts
	 * @property {string} data
	 */

	/**
	 * Message constructor arguments
	 */

	/**
	 * List of instructions to be processed atomically
	 */
	class Message {
	  constructor(args) {
	    this.header = void 0;
	    this.accountKeys = void 0;
	    this.recentBlockhash = void 0;
	    this.instructions = void 0;
	    this.indexToProgramIds = new Map();
	    this.header = args.header;
	    this.accountKeys = args.accountKeys.map(account => new PublicKey(account));
	    this.recentBlockhash = args.recentBlockhash;
	    this.instructions = args.instructions;
	    this.instructions.forEach(ix => this.indexToProgramIds.set(ix.programIdIndex, this.accountKeys[ix.programIdIndex]));
	  }
	  get version() {
	    return 'legacy';
	  }
	  get staticAccountKeys() {
	    return this.accountKeys;
	  }
	  get compiledInstructions() {
	    return this.instructions.map(ix => ({
	      programIdIndex: ix.programIdIndex,
	      accountKeyIndexes: ix.accounts,
	      data: bs58.decode(ix.data)
	    }));
	  }
	  get addressTableLookups() {
	    return [];
	  }
	  getAccountKeys() {
	    return new MessageAccountKeys(this.staticAccountKeys);
	  }
	  static compile(args) {
	    const compiledKeys = CompiledKeys.compile(args.instructions, args.payerKey);
	    const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
	    const accountKeys = new MessageAccountKeys(staticAccountKeys);
	    const instructions = accountKeys.compileInstructions(args.instructions).map(ix => ({
	      programIdIndex: ix.programIdIndex,
	      accounts: ix.accountKeyIndexes,
	      data: bs58.encode(ix.data)
	    }));
	    return new Message({
	      header,
	      accountKeys: staticAccountKeys,
	      recentBlockhash: args.recentBlockhash,
	      instructions
	    });
	  }
	  isAccountSigner(index) {
	    return index < this.header.numRequiredSignatures;
	  }
	  isAccountWritable(index) {
	    const numSignedAccounts = this.header.numRequiredSignatures;
	    if (index >= this.header.numRequiredSignatures) {
	      const unsignedAccountIndex = index - numSignedAccounts;
	      const numUnsignedAccounts = this.accountKeys.length - numSignedAccounts;
	      const numWritableUnsignedAccounts = numUnsignedAccounts - this.header.numReadonlyUnsignedAccounts;
	      return unsignedAccountIndex < numWritableUnsignedAccounts;
	    } else {
	      const numWritableSignedAccounts = numSignedAccounts - this.header.numReadonlySignedAccounts;
	      return index < numWritableSignedAccounts;
	    }
	  }
	  isProgramId(index) {
	    return this.indexToProgramIds.has(index);
	  }
	  programIds() {
	    return [...this.indexToProgramIds.values()];
	  }
	  nonProgramIds() {
	    return this.accountKeys.filter((_, index) => !this.isProgramId(index));
	  }
	  serialize() {
	    const numKeys = this.accountKeys.length;
	    let keyCount = [];
	    encodeLength(keyCount, numKeys);
	    const instructions = this.instructions.map(instruction => {
	      const {
	        accounts,
	        programIdIndex
	      } = instruction;
	      const data = Array.from(bs58.decode(instruction.data));
	      let keyIndicesCount = [];
	      encodeLength(keyIndicesCount, accounts.length);
	      let dataCount = [];
	      encodeLength(dataCount, data.length);
	      return {
	        programIdIndex,
	        keyIndicesCount: bufferExports.Buffer.from(keyIndicesCount),
	        keyIndices: accounts,
	        dataLength: bufferExports.Buffer.from(dataCount),
	        data
	      };
	    });
	    let instructionCount = [];
	    encodeLength(instructionCount, instructions.length);
	    let instructionBuffer = bufferExports.Buffer.alloc(PACKET_DATA_SIZE);
	    bufferExports.Buffer.from(instructionCount).copy(instructionBuffer);
	    let instructionBufferLength = instructionCount.length;
	    instructions.forEach(instruction => {
	      const instructionLayout = LayoutExports.struct([LayoutExports.u8('programIdIndex'), LayoutExports.blob(instruction.keyIndicesCount.length, 'keyIndicesCount'), LayoutExports.seq(LayoutExports.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'), LayoutExports.blob(instruction.dataLength.length, 'dataLength'), LayoutExports.seq(LayoutExports.u8('userdatum'), instruction.data.length, 'data')]);
	      const length = instructionLayout.encode(instruction, instructionBuffer, instructionBufferLength);
	      instructionBufferLength += length;
	    });
	    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
	    const signDataLayout = LayoutExports.struct([LayoutExports.blob(1, 'numRequiredSignatures'), LayoutExports.blob(1, 'numReadonlySignedAccounts'), LayoutExports.blob(1, 'numReadonlyUnsignedAccounts'), LayoutExports.blob(keyCount.length, 'keyCount'), LayoutExports.seq(publicKey('key'), numKeys, 'keys'), publicKey('recentBlockhash')]);
	    const transaction = {
	      numRequiredSignatures: bufferExports.Buffer.from([this.header.numRequiredSignatures]),
	      numReadonlySignedAccounts: bufferExports.Buffer.from([this.header.numReadonlySignedAccounts]),
	      numReadonlyUnsignedAccounts: bufferExports.Buffer.from([this.header.numReadonlyUnsignedAccounts]),
	      keyCount: bufferExports.Buffer.from(keyCount),
	      keys: this.accountKeys.map(key => toBuffer(key.toBytes())),
	      recentBlockhash: bs58.decode(this.recentBlockhash)
	    };
	    let signData = bufferExports.Buffer.alloc(2048);
	    const length = signDataLayout.encode(transaction, signData);
	    instructionBuffer.copy(signData, length);
	    return signData.slice(0, length + instructionBuffer.length);
	  }

	  /**
	   * Decode a compiled message into a Message object.
	   */
	  static from(buffer) {
	    // Slice up wire data
	    let byteArray = [...buffer];
	    const numRequiredSignatures = guardedShift(byteArray);
	    if (numRequiredSignatures !== (numRequiredSignatures & VERSION_PREFIX_MASK)) {
	      throw new Error('Versioned messages must be deserialized with VersionedMessage.deserialize()');
	    }
	    const numReadonlySignedAccounts = guardedShift(byteArray);
	    const numReadonlyUnsignedAccounts = guardedShift(byteArray);
	    const accountCount = decodeLength(byteArray);
	    let accountKeys = [];
	    for (let i = 0; i < accountCount; i++) {
	      const account = guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH);
	      accountKeys.push(new PublicKey(bufferExports.Buffer.from(account)));
	    }
	    const recentBlockhash = guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH);
	    const instructionCount = decodeLength(byteArray);
	    let instructions = [];
	    for (let i = 0; i < instructionCount; i++) {
	      const programIdIndex = guardedShift(byteArray);
	      const accountCount = decodeLength(byteArray);
	      const accounts = guardedSplice(byteArray, 0, accountCount);
	      const dataLength = decodeLength(byteArray);
	      const dataSlice = guardedSplice(byteArray, 0, dataLength);
	      const data = bs58.encode(bufferExports.Buffer.from(dataSlice));
	      instructions.push({
	        programIdIndex,
	        accounts,
	        data
	      });
	    }
	    const messageArgs = {
	      header: {
	        numRequiredSignatures,
	        numReadonlySignedAccounts,
	        numReadonlyUnsignedAccounts
	      },
	      recentBlockhash: bs58.encode(bufferExports.Buffer.from(recentBlockhash)),
	      accountKeys,
	      instructions
	    };
	    return new Message(messageArgs);
	  }
	}

	/**
	 * Message constructor arguments
	 */

	class MessageV0 {
	  constructor(args) {
	    this.header = void 0;
	    this.staticAccountKeys = void 0;
	    this.recentBlockhash = void 0;
	    this.compiledInstructions = void 0;
	    this.addressTableLookups = void 0;
	    this.header = args.header;
	    this.staticAccountKeys = args.staticAccountKeys;
	    this.recentBlockhash = args.recentBlockhash;
	    this.compiledInstructions = args.compiledInstructions;
	    this.addressTableLookups = args.addressTableLookups;
	  }
	  get version() {
	    return 0;
	  }
	  get numAccountKeysFromLookups() {
	    let count = 0;
	    for (const lookup of this.addressTableLookups) {
	      count += lookup.readonlyIndexes.length + lookup.writableIndexes.length;
	    }
	    return count;
	  }
	  getAccountKeys(args) {
	    let accountKeysFromLookups;
	    if (args && 'accountKeysFromLookups' in args && args.accountKeysFromLookups) {
	      if (this.numAccountKeysFromLookups != args.accountKeysFromLookups.writable.length + args.accountKeysFromLookups.readonly.length) {
	        throw new Error('Failed to get account keys because of a mismatch in the number of account keys from lookups');
	      }
	      accountKeysFromLookups = args.accountKeysFromLookups;
	    } else if (args && 'addressLookupTableAccounts' in args && args.addressLookupTableAccounts) {
	      accountKeysFromLookups = this.resolveAddressTableLookups(args.addressLookupTableAccounts);
	    } else if (this.addressTableLookups.length > 0) {
	      throw new Error('Failed to get account keys because address table lookups were not resolved');
	    }
	    return new MessageAccountKeys(this.staticAccountKeys, accountKeysFromLookups);
	  }
	  isAccountSigner(index) {
	    return index < this.header.numRequiredSignatures;
	  }
	  isAccountWritable(index) {
	    const numSignedAccounts = this.header.numRequiredSignatures;
	    const numStaticAccountKeys = this.staticAccountKeys.length;
	    if (index >= numStaticAccountKeys) {
	      const lookupAccountKeysIndex = index - numStaticAccountKeys;
	      const numWritableLookupAccountKeys = this.addressTableLookups.reduce((count, lookup) => count + lookup.writableIndexes.length, 0);
	      return lookupAccountKeysIndex < numWritableLookupAccountKeys;
	    } else if (index >= this.header.numRequiredSignatures) {
	      const unsignedAccountIndex = index - numSignedAccounts;
	      const numUnsignedAccounts = numStaticAccountKeys - numSignedAccounts;
	      const numWritableUnsignedAccounts = numUnsignedAccounts - this.header.numReadonlyUnsignedAccounts;
	      return unsignedAccountIndex < numWritableUnsignedAccounts;
	    } else {
	      const numWritableSignedAccounts = numSignedAccounts - this.header.numReadonlySignedAccounts;
	      return index < numWritableSignedAccounts;
	    }
	  }
	  resolveAddressTableLookups(addressLookupTableAccounts) {
	    const accountKeysFromLookups = {
	      writable: [],
	      readonly: []
	    };
	    for (const tableLookup of this.addressTableLookups) {
	      const tableAccount = addressLookupTableAccounts.find(account => account.key.equals(tableLookup.accountKey));
	      if (!tableAccount) {
	        throw new Error(`Failed to find address lookup table account for table key ${tableLookup.accountKey.toBase58()}`);
	      }
	      for (const index of tableLookup.writableIndexes) {
	        if (index < tableAccount.state.addresses.length) {
	          accountKeysFromLookups.writable.push(tableAccount.state.addresses[index]);
	        } else {
	          throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
	        }
	      }
	      for (const index of tableLookup.readonlyIndexes) {
	        if (index < tableAccount.state.addresses.length) {
	          accountKeysFromLookups.readonly.push(tableAccount.state.addresses[index]);
	        } else {
	          throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
	        }
	      }
	    }
	    return accountKeysFromLookups;
	  }
	  static compile(args) {
	    const compiledKeys = CompiledKeys.compile(args.instructions, args.payerKey);
	    const addressTableLookups = new Array();
	    const accountKeysFromLookups = {
	      writable: new Array(),
	      readonly: new Array()
	    };
	    const lookupTableAccounts = args.addressLookupTableAccounts || [];
	    for (const lookupTable of lookupTableAccounts) {
	      const extractResult = compiledKeys.extractTableLookup(lookupTable);
	      if (extractResult !== undefined) {
	        const [addressTableLookup, {
	          writable,
	          readonly
	        }] = extractResult;
	        addressTableLookups.push(addressTableLookup);
	        accountKeysFromLookups.writable.push(...writable);
	        accountKeysFromLookups.readonly.push(...readonly);
	      }
	    }
	    const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
	    const accountKeys = new MessageAccountKeys(staticAccountKeys, accountKeysFromLookups);
	    const compiledInstructions = accountKeys.compileInstructions(args.instructions);
	    return new MessageV0({
	      header,
	      staticAccountKeys,
	      recentBlockhash: args.recentBlockhash,
	      compiledInstructions,
	      addressTableLookups
	    });
	  }
	  serialize() {
	    const encodedStaticAccountKeysLength = Array();
	    encodeLength(encodedStaticAccountKeysLength, this.staticAccountKeys.length);
	    const serializedInstructions = this.serializeInstructions();
	    const encodedInstructionsLength = Array();
	    encodeLength(encodedInstructionsLength, this.compiledInstructions.length);
	    const serializedAddressTableLookups = this.serializeAddressTableLookups();
	    const encodedAddressTableLookupsLength = Array();
	    encodeLength(encodedAddressTableLookupsLength, this.addressTableLookups.length);
	    const messageLayout = LayoutExports.struct([LayoutExports.u8('prefix'), LayoutExports.struct([LayoutExports.u8('numRequiredSignatures'), LayoutExports.u8('numReadonlySignedAccounts'), LayoutExports.u8('numReadonlyUnsignedAccounts')], 'header'), LayoutExports.blob(encodedStaticAccountKeysLength.length, 'staticAccountKeysLength'), LayoutExports.seq(publicKey(), this.staticAccountKeys.length, 'staticAccountKeys'), publicKey('recentBlockhash'), LayoutExports.blob(encodedInstructionsLength.length, 'instructionsLength'), LayoutExports.blob(serializedInstructions.length, 'serializedInstructions'), LayoutExports.blob(encodedAddressTableLookupsLength.length, 'addressTableLookupsLength'), LayoutExports.blob(serializedAddressTableLookups.length, 'serializedAddressTableLookups')]);
	    const serializedMessage = new Uint8Array(PACKET_DATA_SIZE);
	    const MESSAGE_VERSION_0_PREFIX = 1 << 7;
	    const serializedMessageLength = messageLayout.encode({
	      prefix: MESSAGE_VERSION_0_PREFIX,
	      header: this.header,
	      staticAccountKeysLength: new Uint8Array(encodedStaticAccountKeysLength),
	      staticAccountKeys: this.staticAccountKeys.map(key => key.toBytes()),
	      recentBlockhash: bs58.decode(this.recentBlockhash),
	      instructionsLength: new Uint8Array(encodedInstructionsLength),
	      serializedInstructions,
	      addressTableLookupsLength: new Uint8Array(encodedAddressTableLookupsLength),
	      serializedAddressTableLookups
	    }, serializedMessage);
	    return serializedMessage.slice(0, serializedMessageLength);
	  }
	  serializeInstructions() {
	    let serializedLength = 0;
	    const serializedInstructions = new Uint8Array(PACKET_DATA_SIZE);
	    for (const instruction of this.compiledInstructions) {
	      const encodedAccountKeyIndexesLength = Array();
	      encodeLength(encodedAccountKeyIndexesLength, instruction.accountKeyIndexes.length);
	      const encodedDataLength = Array();
	      encodeLength(encodedDataLength, instruction.data.length);
	      const instructionLayout = LayoutExports.struct([LayoutExports.u8('programIdIndex'), LayoutExports.blob(encodedAccountKeyIndexesLength.length, 'encodedAccountKeyIndexesLength'), LayoutExports.seq(LayoutExports.u8(), instruction.accountKeyIndexes.length, 'accountKeyIndexes'), LayoutExports.blob(encodedDataLength.length, 'encodedDataLength'), LayoutExports.blob(instruction.data.length, 'data')]);
	      serializedLength += instructionLayout.encode({
	        programIdIndex: instruction.programIdIndex,
	        encodedAccountKeyIndexesLength: new Uint8Array(encodedAccountKeyIndexesLength),
	        accountKeyIndexes: instruction.accountKeyIndexes,
	        encodedDataLength: new Uint8Array(encodedDataLength),
	        data: instruction.data
	      }, serializedInstructions, serializedLength);
	    }
	    return serializedInstructions.slice(0, serializedLength);
	  }
	  serializeAddressTableLookups() {
	    let serializedLength = 0;
	    const serializedAddressTableLookups = new Uint8Array(PACKET_DATA_SIZE);
	    for (const lookup of this.addressTableLookups) {
	      const encodedWritableIndexesLength = Array();
	      encodeLength(encodedWritableIndexesLength, lookup.writableIndexes.length);
	      const encodedReadonlyIndexesLength = Array();
	      encodeLength(encodedReadonlyIndexesLength, lookup.readonlyIndexes.length);
	      const addressTableLookupLayout = LayoutExports.struct([publicKey('accountKey'), LayoutExports.blob(encodedWritableIndexesLength.length, 'encodedWritableIndexesLength'), LayoutExports.seq(LayoutExports.u8(), lookup.writableIndexes.length, 'writableIndexes'), LayoutExports.blob(encodedReadonlyIndexesLength.length, 'encodedReadonlyIndexesLength'), LayoutExports.seq(LayoutExports.u8(), lookup.readonlyIndexes.length, 'readonlyIndexes')]);
	      serializedLength += addressTableLookupLayout.encode({
	        accountKey: lookup.accountKey.toBytes(),
	        encodedWritableIndexesLength: new Uint8Array(encodedWritableIndexesLength),
	        writableIndexes: lookup.writableIndexes,
	        encodedReadonlyIndexesLength: new Uint8Array(encodedReadonlyIndexesLength),
	        readonlyIndexes: lookup.readonlyIndexes
	      }, serializedAddressTableLookups, serializedLength);
	    }
	    return serializedAddressTableLookups.slice(0, serializedLength);
	  }
	  static deserialize(serializedMessage) {
	    let byteArray = [...serializedMessage];
	    const prefix = guardedShift(byteArray);
	    const maskedPrefix = prefix & VERSION_PREFIX_MASK;
	    assert$1(prefix !== maskedPrefix, `Expected versioned message but received legacy message`);
	    const version = maskedPrefix;
	    assert$1(version === 0, `Expected versioned message with version 0 but found version ${version}`);
	    const header = {
	      numRequiredSignatures: guardedShift(byteArray),
	      numReadonlySignedAccounts: guardedShift(byteArray),
	      numReadonlyUnsignedAccounts: guardedShift(byteArray)
	    };
	    const staticAccountKeys = [];
	    const staticAccountKeysLength = decodeLength(byteArray);
	    for (let i = 0; i < staticAccountKeysLength; i++) {
	      staticAccountKeys.push(new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH)));
	    }
	    const recentBlockhash = bs58.encode(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
	    const instructionCount = decodeLength(byteArray);
	    const compiledInstructions = [];
	    for (let i = 0; i < instructionCount; i++) {
	      const programIdIndex = guardedShift(byteArray);
	      const accountKeyIndexesLength = decodeLength(byteArray);
	      const accountKeyIndexes = guardedSplice(byteArray, 0, accountKeyIndexesLength);
	      const dataLength = decodeLength(byteArray);
	      const data = new Uint8Array(guardedSplice(byteArray, 0, dataLength));
	      compiledInstructions.push({
	        programIdIndex,
	        accountKeyIndexes,
	        data
	      });
	    }
	    const addressTableLookupsCount = decodeLength(byteArray);
	    const addressTableLookups = [];
	    for (let i = 0; i < addressTableLookupsCount; i++) {
	      const accountKey = new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
	      const writableIndexesLength = decodeLength(byteArray);
	      const writableIndexes = guardedSplice(byteArray, 0, writableIndexesLength);
	      const readonlyIndexesLength = decodeLength(byteArray);
	      const readonlyIndexes = guardedSplice(byteArray, 0, readonlyIndexesLength);
	      addressTableLookups.push({
	        accountKey,
	        writableIndexes,
	        readonlyIndexes
	      });
	    }
	    return new MessageV0({
	      header,
	      staticAccountKeys,
	      recentBlockhash,
	      compiledInstructions,
	      addressTableLookups
	    });
	  }
	}

	// eslint-disable-next-line no-redeclare
	const VersionedMessage = {
	  deserializeMessageVersion(serializedMessage) {
	    const prefix = serializedMessage[0];
	    const maskedPrefix = prefix & VERSION_PREFIX_MASK;

	    // if the highest bit of the prefix is not set, the message is not versioned
	    if (maskedPrefix === prefix) {
	      return 'legacy';
	    }

	    // the lower 7 bits of the prefix indicate the message version
	    return maskedPrefix;
	  },
	  deserialize: serializedMessage => {
	    const version = VersionedMessage.deserializeMessageVersion(serializedMessage);
	    if (version === 'legacy') {
	      return Message.from(serializedMessage);
	    }
	    if (version === 0) {
	      return MessageV0.deserialize(serializedMessage);
	    } else {
	      throw new Error(`Transaction message version ${version} deserialization is not supported`);
	    }
	  }
	};

	/** @internal */

	/**
	 * Transaction signature as base-58 encoded string
	 */

	let TransactionStatus = /*#__PURE__*/function (TransactionStatus) {
	  TransactionStatus[TransactionStatus["BLOCKHEIGHT_EXCEEDED"] = 0] = "BLOCKHEIGHT_EXCEEDED";
	  TransactionStatus[TransactionStatus["PROCESSED"] = 1] = "PROCESSED";
	  TransactionStatus[TransactionStatus["TIMED_OUT"] = 2] = "TIMED_OUT";
	  TransactionStatus[TransactionStatus["NONCE_INVALID"] = 3] = "NONCE_INVALID";
	  return TransactionStatus;
	}({});

	/**
	 * Default (empty) signature
	 */
	const DEFAULT_SIGNATURE = bufferExports.Buffer.alloc(SIGNATURE_LENGTH_IN_BYTES).fill(0);

	/**
	 * Account metadata used to define instructions
	 */

	/**
	 * List of TransactionInstruction object fields that may be initialized at construction
	 */

	/**
	 * Configuration object for Transaction.serialize()
	 */

	/**
	 * @internal
	 */

	/**
	 * Transaction Instruction class
	 */
	class TransactionInstruction {
	  constructor(opts) {
	    /**
	     * Public keys to include in this transaction
	     * Boolean represents whether this pubkey needs to sign the transaction
	     */
	    this.keys = void 0;
	    /**
	     * Program Id to execute
	     */
	    this.programId = void 0;
	    /**
	     * Program input
	     */
	    this.data = bufferExports.Buffer.alloc(0);
	    this.programId = opts.programId;
	    this.keys = opts.keys;
	    if (opts.data) {
	      this.data = opts.data;
	    }
	  }

	  /**
	   * @internal
	   */
	  toJSON() {
	    return {
	      keys: this.keys.map(({
	        pubkey,
	        isSigner,
	        isWritable
	      }) => ({
	        pubkey: pubkey.toJSON(),
	        isSigner,
	        isWritable
	      })),
	      programId: this.programId.toJSON(),
	      data: [...this.data]
	    };
	  }
	}

	/**
	 * Pair of signature and corresponding public key
	 */

	/**
	 * List of Transaction object fields that may be initialized at construction
	 */

	// For backward compatibility; an unfortunate consequence of being
	// forced to over-export types by the documentation generator.
	// See https://github.com/solana-labs/solana/pull/25820

	/**
	 * Blockhash-based transactions have a lifetime that are defined by
	 * the blockhash they include. Any transaction whose blockhash is
	 * too old will be rejected.
	 */

	/**
	 * Use these options to construct a durable nonce transaction.
	 */

	/**
	 * Nonce information to be used to build an offline Transaction.
	 */

	/**
	 * @internal
	 */

	/**
	 * Transaction class
	 */
	class Transaction {
	  /**
	   * The first (payer) Transaction signature
	   *
	   * @returns {Buffer | null} Buffer of payer's signature
	   */
	  get signature() {
	    if (this.signatures.length > 0) {
	      return this.signatures[0].signature;
	    }
	    return null;
	  }

	  /**
	   * The transaction fee payer
	   */

	  // Construct a transaction with a blockhash and lastValidBlockHeight

	  // Construct a transaction using a durable nonce

	  /**
	   * @deprecated `TransactionCtorFields` has been deprecated and will be removed in a future version.
	   * Please supply a `TransactionBlockhashCtor` instead.
	   */

	  /**
	   * Construct an empty Transaction
	   */
	  constructor(opts) {
	    /**
	     * Signatures for the transaction.  Typically created by invoking the
	     * `sign()` method
	     */
	    this.signatures = [];
	    this.feePayer = void 0;
	    /**
	     * The instructions to atomically execute
	     */
	    this.instructions = [];
	    /**
	     * A recent transaction id. Must be populated by the caller
	     */
	    this.recentBlockhash = void 0;
	    /**
	     * the last block chain can advance to before tx is declared expired
	     * */
	    this.lastValidBlockHeight = void 0;
	    /**
	     * Optional Nonce information. If populated, transaction will use a durable
	     * Nonce hash instead of a recentBlockhash. Must be populated by the caller
	     */
	    this.nonceInfo = void 0;
	    /**
	     * If this is a nonce transaction this represents the minimum slot from which
	     * to evaluate if the nonce has advanced when attempting to confirm the
	     * transaction. This protects against a case where the transaction confirmation
	     * logic loads the nonce account from an old slot and assumes the mismatch in
	     * nonce value implies that the nonce has been advanced.
	     */
	    this.minNonceContextSlot = void 0;
	    /**
	     * @internal
	     */
	    this._message = void 0;
	    /**
	     * @internal
	     */
	    this._json = void 0;
	    if (!opts) {
	      return;
	    }
	    if (opts.feePayer) {
	      this.feePayer = opts.feePayer;
	    }
	    if (opts.signatures) {
	      this.signatures = opts.signatures;
	    }
	    if (Object.prototype.hasOwnProperty.call(opts, 'nonceInfo')) {
	      const {
	        minContextSlot,
	        nonceInfo
	      } = opts;
	      this.minNonceContextSlot = minContextSlot;
	      this.nonceInfo = nonceInfo;
	    } else if (Object.prototype.hasOwnProperty.call(opts, 'lastValidBlockHeight')) {
	      const {
	        blockhash,
	        lastValidBlockHeight
	      } = opts;
	      this.recentBlockhash = blockhash;
	      this.lastValidBlockHeight = lastValidBlockHeight;
	    } else {
	      const {
	        recentBlockhash,
	        nonceInfo
	      } = opts;
	      if (nonceInfo) {
	        this.nonceInfo = nonceInfo;
	      }
	      this.recentBlockhash = recentBlockhash;
	    }
	  }

	  /**
	   * @internal
	   */
	  toJSON() {
	    return {
	      recentBlockhash: this.recentBlockhash || null,
	      feePayer: this.feePayer ? this.feePayer.toJSON() : null,
	      nonceInfo: this.nonceInfo ? {
	        nonce: this.nonceInfo.nonce,
	        nonceInstruction: this.nonceInfo.nonceInstruction.toJSON()
	      } : null,
	      instructions: this.instructions.map(instruction => instruction.toJSON()),
	      signers: this.signatures.map(({
	        publicKey
	      }) => {
	        return publicKey.toJSON();
	      })
	    };
	  }

	  /**
	   * Add one or more instructions to this Transaction
	   *
	   * @param {Array< Transaction | TransactionInstruction | TransactionInstructionCtorFields >} items - Instructions to add to the Transaction
	   */
	  add(...items) {
	    if (items.length === 0) {
	      throw new Error('No instructions');
	    }
	    items.forEach(item => {
	      if ('instructions' in item) {
	        this.instructions = this.instructions.concat(item.instructions);
	      } else if ('data' in item && 'programId' in item && 'keys' in item) {
	        this.instructions.push(item);
	      } else {
	        this.instructions.push(new TransactionInstruction(item));
	      }
	    });
	    return this;
	  }

	  /**
	   * Compile transaction data
	   */
	  compileMessage() {
	    if (this._message && JSON.stringify(this.toJSON()) === JSON.stringify(this._json)) {
	      return this._message;
	    }
	    let recentBlockhash;
	    let instructions;
	    if (this.nonceInfo) {
	      recentBlockhash = this.nonceInfo.nonce;
	      if (this.instructions[0] != this.nonceInfo.nonceInstruction) {
	        instructions = [this.nonceInfo.nonceInstruction, ...this.instructions];
	      } else {
	        instructions = this.instructions;
	      }
	    } else {
	      recentBlockhash = this.recentBlockhash;
	      instructions = this.instructions;
	    }
	    if (!recentBlockhash) {
	      throw new Error('Transaction recentBlockhash required');
	    }
	    if (instructions.length < 1) {
	      console.warn('No instructions provided');
	    }
	    let feePayer;
	    if (this.feePayer) {
	      feePayer = this.feePayer;
	    } else if (this.signatures.length > 0 && this.signatures[0].publicKey) {
	      // Use implicit fee payer
	      feePayer = this.signatures[0].publicKey;
	    } else {
	      throw new Error('Transaction fee payer required');
	    }
	    for (let i = 0; i < instructions.length; i++) {
	      if (instructions[i].programId === undefined) {
	        throw new Error(`Transaction instruction index ${i} has undefined program id`);
	      }
	    }
	    const programIds = [];
	    const accountMetas = [];
	    instructions.forEach(instruction => {
	      instruction.keys.forEach(accountMeta => {
	        accountMetas.push({
	          ...accountMeta
	        });
	      });
	      const programId = instruction.programId.toString();
	      if (!programIds.includes(programId)) {
	        programIds.push(programId);
	      }
	    });

	    // Append programID account metas
	    programIds.forEach(programId => {
	      accountMetas.push({
	        pubkey: new PublicKey(programId),
	        isSigner: false,
	        isWritable: false
	      });
	    });

	    // Cull duplicate account metas
	    const uniqueMetas = [];
	    accountMetas.forEach(accountMeta => {
	      const pubkeyString = accountMeta.pubkey.toString();
	      const uniqueIndex = uniqueMetas.findIndex(x => {
	        return x.pubkey.toString() === pubkeyString;
	      });
	      if (uniqueIndex > -1) {
	        uniqueMetas[uniqueIndex].isWritable = uniqueMetas[uniqueIndex].isWritable || accountMeta.isWritable;
	        uniqueMetas[uniqueIndex].isSigner = uniqueMetas[uniqueIndex].isSigner || accountMeta.isSigner;
	      } else {
	        uniqueMetas.push(accountMeta);
	      }
	    });

	    // Sort. Prioritizing first by signer, then by writable
	    uniqueMetas.sort(function (x, y) {
	      if (x.isSigner !== y.isSigner) {
	        // Signers always come before non-signers
	        return x.isSigner ? -1 : 1;
	      }
	      if (x.isWritable !== y.isWritable) {
	        // Writable accounts always come before read-only accounts
	        return x.isWritable ? -1 : 1;
	      }
	      // Otherwise, sort by pubkey, stringwise.
	      const options = {
	        localeMatcher: 'best fit',
	        usage: 'sort',
	        sensitivity: 'variant',
	        ignorePunctuation: false,
	        numeric: false,
	        caseFirst: 'lower'
	      };
	      return x.pubkey.toBase58().localeCompare(y.pubkey.toBase58(), 'en', options);
	    });

	    // Move fee payer to the front
	    const feePayerIndex = uniqueMetas.findIndex(x => {
	      return x.pubkey.equals(feePayer);
	    });
	    if (feePayerIndex > -1) {
	      const [payerMeta] = uniqueMetas.splice(feePayerIndex, 1);
	      payerMeta.isSigner = true;
	      payerMeta.isWritable = true;
	      uniqueMetas.unshift(payerMeta);
	    } else {
	      uniqueMetas.unshift({
	        pubkey: feePayer,
	        isSigner: true,
	        isWritable: true
	      });
	    }

	    // Disallow unknown signers
	    for (const signature of this.signatures) {
	      const uniqueIndex = uniqueMetas.findIndex(x => {
	        return x.pubkey.equals(signature.publicKey);
	      });
	      if (uniqueIndex > -1) {
	        if (!uniqueMetas[uniqueIndex].isSigner) {
	          uniqueMetas[uniqueIndex].isSigner = true;
	          console.warn('Transaction references a signature that is unnecessary, ' + 'only the fee payer and instruction signer accounts should sign a transaction. ' + 'This behavior is deprecated and will throw an error in the next major version release.');
	        }
	      } else {
	        throw new Error(`unknown signer: ${signature.publicKey.toString()}`);
	      }
	    }
	    let numRequiredSignatures = 0;
	    let numReadonlySignedAccounts = 0;
	    let numReadonlyUnsignedAccounts = 0;

	    // Split out signing from non-signing keys and count header values
	    const signedKeys = [];
	    const unsignedKeys = [];
	    uniqueMetas.forEach(({
	      pubkey,
	      isSigner,
	      isWritable
	    }) => {
	      if (isSigner) {
	        signedKeys.push(pubkey.toString());
	        numRequiredSignatures += 1;
	        if (!isWritable) {
	          numReadonlySignedAccounts += 1;
	        }
	      } else {
	        unsignedKeys.push(pubkey.toString());
	        if (!isWritable) {
	          numReadonlyUnsignedAccounts += 1;
	        }
	      }
	    });
	    const accountKeys = signedKeys.concat(unsignedKeys);
	    const compiledInstructions = instructions.map(instruction => {
	      const {
	        data,
	        programId
	      } = instruction;
	      return {
	        programIdIndex: accountKeys.indexOf(programId.toString()),
	        accounts: instruction.keys.map(meta => accountKeys.indexOf(meta.pubkey.toString())),
	        data: bs58.encode(data)
	      };
	    });
	    compiledInstructions.forEach(instruction => {
	      assert$1(instruction.programIdIndex >= 0);
	      instruction.accounts.forEach(keyIndex => assert$1(keyIndex >= 0));
	    });
	    return new Message({
	      header: {
	        numRequiredSignatures,
	        numReadonlySignedAccounts,
	        numReadonlyUnsignedAccounts
	      },
	      accountKeys,
	      recentBlockhash,
	      instructions: compiledInstructions
	    });
	  }

	  /**
	   * @internal
	   */
	  _compile() {
	    const message = this.compileMessage();
	    const signedKeys = message.accountKeys.slice(0, message.header.numRequiredSignatures);
	    if (this.signatures.length === signedKeys.length) {
	      const valid = this.signatures.every((pair, index) => {
	        return signedKeys[index].equals(pair.publicKey);
	      });
	      if (valid) return message;
	    }
	    this.signatures = signedKeys.map(publicKey => ({
	      signature: null,
	      publicKey
	    }));
	    return message;
	  }

	  /**
	   * Get a buffer of the Transaction data that need to be covered by signatures
	   */
	  serializeMessage() {
	    return this._compile().serialize();
	  }

	  /**
	   * Get the estimated fee associated with a transaction
	   *
	   * @param {Connection} connection Connection to RPC Endpoint.
	   *
	   * @returns {Promise<number | null>} The estimated fee for the transaction
	   */
	  async getEstimatedFee(connection) {
	    return (await connection.getFeeForMessage(this.compileMessage())).value;
	  }

	  /**
	   * Specify the public keys which will be used to sign the Transaction.
	   * The first signer will be used as the transaction fee payer account.
	   *
	   * Signatures can be added with either `partialSign` or `addSignature`
	   *
	   * @deprecated Deprecated since v0.84.0. Only the fee payer needs to be
	   * specified and it can be set in the Transaction constructor or with the
	   * `feePayer` property.
	   */
	  setSigners(...signers) {
	    if (signers.length === 0) {
	      throw new Error('No signers');
	    }
	    const seen = new Set();
	    this.signatures = signers.filter(publicKey => {
	      const key = publicKey.toString();
	      if (seen.has(key)) {
	        return false;
	      } else {
	        seen.add(key);
	        return true;
	      }
	    }).map(publicKey => ({
	      signature: null,
	      publicKey
	    }));
	  }

	  /**
	   * Sign the Transaction with the specified signers. Multiple signatures may
	   * be applied to a Transaction. The first signature is considered "primary"
	   * and is used identify and confirm transactions.
	   *
	   * If the Transaction `feePayer` is not set, the first signer will be used
	   * as the transaction fee payer account.
	   *
	   * Transaction fields should not be modified after the first call to `sign`,
	   * as doing so may invalidate the signature and cause the Transaction to be
	   * rejected.
	   *
	   * The Transaction must be assigned a valid `recentBlockhash` before invoking this method
	   *
	   * @param {Array<Signer>} signers Array of signers that will sign the transaction
	   */
	  sign(...signers) {
	    if (signers.length === 0) {
	      throw new Error('No signers');
	    }

	    // Dedupe signers
	    const seen = new Set();
	    const uniqueSigners = [];
	    for (const signer of signers) {
	      const key = signer.publicKey.toString();
	      if (seen.has(key)) {
	        continue;
	      } else {
	        seen.add(key);
	        uniqueSigners.push(signer);
	      }
	    }
	    this.signatures = uniqueSigners.map(signer => ({
	      signature: null,
	      publicKey: signer.publicKey
	    }));
	    const message = this._compile();
	    this._partialSign(message, ...uniqueSigners);
	  }

	  /**
	   * Partially sign a transaction with the specified accounts. All accounts must
	   * correspond to either the fee payer or a signer account in the transaction
	   * instructions.
	   *
	   * All the caveats from the `sign` method apply to `partialSign`
	   *
	   * @param {Array<Signer>} signers Array of signers that will sign the transaction
	   */
	  partialSign(...signers) {
	    if (signers.length === 0) {
	      throw new Error('No signers');
	    }

	    // Dedupe signers
	    const seen = new Set();
	    const uniqueSigners = [];
	    for (const signer of signers) {
	      const key = signer.publicKey.toString();
	      if (seen.has(key)) {
	        continue;
	      } else {
	        seen.add(key);
	        uniqueSigners.push(signer);
	      }
	    }
	    const message = this._compile();
	    this._partialSign(message, ...uniqueSigners);
	  }

	  /**
	   * @internal
	   */
	  _partialSign(message, ...signers) {
	    const signData = message.serialize();
	    signers.forEach(signer => {
	      const signature = sign(signData, signer.secretKey);
	      this._addSignature(signer.publicKey, toBuffer(signature));
	    });
	  }

	  /**
	   * Add an externally created signature to a transaction. The public key
	   * must correspond to either the fee payer or a signer account in the transaction
	   * instructions.
	   *
	   * @param {PublicKey} pubkey Public key that will be added to the transaction.
	   * @param {Buffer} signature An externally created signature to add to the transaction.
	   */
	  addSignature(pubkey, signature) {
	    this._compile(); // Ensure signatures array is populated
	    this._addSignature(pubkey, signature);
	  }

	  /**
	   * @internal
	   */
	  _addSignature(pubkey, signature) {
	    assert$1(signature.length === 64);
	    const index = this.signatures.findIndex(sigpair => pubkey.equals(sigpair.publicKey));
	    if (index < 0) {
	      throw new Error(`unknown signer: ${pubkey.toString()}`);
	    }
	    this.signatures[index].signature = bufferExports.Buffer.from(signature);
	  }

	  /**
	   * Verify signatures of a Transaction
	   * Optional parameter specifies if we're expecting a fully signed Transaction or a partially signed one.
	   * If no boolean is provided, we expect a fully signed Transaction by default.
	   *
	   * @param {boolean} [requireAllSignatures=true] Require a fully signed Transaction
	   */
	  verifySignatures(requireAllSignatures = true) {
	    const signatureErrors = this._getMessageSignednessErrors(this.serializeMessage(), requireAllSignatures);
	    return !signatureErrors;
	  }

	  /**
	   * @internal
	   */
	  _getMessageSignednessErrors(message, requireAllSignatures) {
	    const errors = {};
	    for (const {
	      signature,
	      publicKey
	    } of this.signatures) {
	      if (signature === null) {
	        if (requireAllSignatures) {
	          (errors.missing ||= []).push(publicKey);
	        }
	      } else {
	        if (!verify(signature, message, publicKey.toBytes())) {
	          (errors.invalid ||= []).push(publicKey);
	        }
	      }
	    }
	    return errors.invalid || errors.missing ? errors : undefined;
	  }

	  /**
	   * Serialize the Transaction in the wire format.
	   *
	   * @param {Buffer} [config] Config of transaction.
	   *
	   * @returns {Buffer} Signature of transaction in wire format.
	   */
	  serialize(config) {
	    const {
	      requireAllSignatures,
	      verifySignatures
	    } = Object.assign({
	      requireAllSignatures: true,
	      verifySignatures: true
	    }, config);
	    const signData = this.serializeMessage();
	    if (verifySignatures) {
	      const sigErrors = this._getMessageSignednessErrors(signData, requireAllSignatures);
	      if (sigErrors) {
	        let errorMessage = 'Signature verification failed.';
	        if (sigErrors.invalid) {
	          errorMessage += `\nInvalid signature for public key${sigErrors.invalid.length === 1 ? '' : '(s)'} [\`${sigErrors.invalid.map(p => p.toBase58()).join('`, `')}\`].`;
	        }
	        if (sigErrors.missing) {
	          errorMessage += `\nMissing signature for public key${sigErrors.missing.length === 1 ? '' : '(s)'} [\`${sigErrors.missing.map(p => p.toBase58()).join('`, `')}\`].`;
	        }
	        throw new Error(errorMessage);
	      }
	    }
	    return this._serialize(signData);
	  }

	  /**
	   * @internal
	   */
	  _serialize(signData) {
	    const {
	      signatures
	    } = this;
	    const signatureCount = [];
	    encodeLength(signatureCount, signatures.length);
	    const transactionLength = signatureCount.length + signatures.length * 64 + signData.length;
	    const wireTransaction = bufferExports.Buffer.alloc(transactionLength);
	    assert$1(signatures.length < 256);
	    bufferExports.Buffer.from(signatureCount).copy(wireTransaction, 0);
	    signatures.forEach(({
	      signature
	    }, index) => {
	      if (signature !== null) {
	        assert$1(signature.length === 64, `signature has invalid length`);
	        bufferExports.Buffer.from(signature).copy(wireTransaction, signatureCount.length + index * 64);
	      }
	    });
	    signData.copy(wireTransaction, signatureCount.length + signatures.length * 64);
	    assert$1(wireTransaction.length <= PACKET_DATA_SIZE, `Transaction too large: ${wireTransaction.length} > ${PACKET_DATA_SIZE}`);
	    return wireTransaction;
	  }

	  /**
	   * Deprecated method
	   * @internal
	   */
	  get keys() {
	    assert$1(this.instructions.length === 1);
	    return this.instructions[0].keys.map(keyObj => keyObj.pubkey);
	  }

	  /**
	   * Deprecated method
	   * @internal
	   */
	  get programId() {
	    assert$1(this.instructions.length === 1);
	    return this.instructions[0].programId;
	  }

	  /**
	   * Deprecated method
	   * @internal
	   */
	  get data() {
	    assert$1(this.instructions.length === 1);
	    return this.instructions[0].data;
	  }

	  /**
	   * Parse a wire transaction into a Transaction object.
	   *
	   * @param {Buffer | Uint8Array | Array<number>} buffer Signature of wire Transaction
	   *
	   * @returns {Transaction} Transaction associated with the signature
	   */
	  static from(buffer) {
	    // Slice up wire data
	    let byteArray = [...buffer];
	    const signatureCount = decodeLength(byteArray);
	    let signatures = [];
	    for (let i = 0; i < signatureCount; i++) {
	      const signature = guardedSplice(byteArray, 0, SIGNATURE_LENGTH_IN_BYTES);
	      signatures.push(bs58.encode(bufferExports.Buffer.from(signature)));
	    }
	    return Transaction.populate(Message.from(byteArray), signatures);
	  }

	  /**
	   * Populate Transaction object from message and signatures
	   *
	   * @param {Message} message Message of transaction
	   * @param {Array<string>} signatures List of signatures to assign to the transaction
	   *
	   * @returns {Transaction} The populated Transaction
	   */
	  static populate(message, signatures = []) {
	    const transaction = new Transaction();
	    transaction.recentBlockhash = message.recentBlockhash;
	    if (message.header.numRequiredSignatures > 0) {
	      transaction.feePayer = message.accountKeys[0];
	    }
	    signatures.forEach((signature, index) => {
	      const sigPubkeyPair = {
	        signature: signature == bs58.encode(DEFAULT_SIGNATURE) ? null : bs58.decode(signature),
	        publicKey: message.accountKeys[index]
	      };
	      transaction.signatures.push(sigPubkeyPair);
	    });
	    message.instructions.forEach(instruction => {
	      const keys = instruction.accounts.map(account => {
	        const pubkey = message.accountKeys[account];
	        return {
	          pubkey,
	          isSigner: transaction.signatures.some(keyObj => keyObj.publicKey.toString() === pubkey.toString()) || message.isAccountSigner(account),
	          isWritable: message.isAccountWritable(account)
	        };
	      });
	      transaction.instructions.push(new TransactionInstruction({
	        keys,
	        programId: message.accountKeys[instruction.programIdIndex],
	        data: bs58.decode(instruction.data)
	      }));
	    });
	    transaction._message = message;
	    transaction._json = transaction.toJSON();
	    return transaction;
	  }
	}

	class TransactionMessage {
	  constructor(args) {
	    this.payerKey = void 0;
	    this.instructions = void 0;
	    this.recentBlockhash = void 0;
	    this.payerKey = args.payerKey;
	    this.instructions = args.instructions;
	    this.recentBlockhash = args.recentBlockhash;
	  }
	  static decompile(message, args) {
	    const {
	      header,
	      compiledInstructions,
	      recentBlockhash
	    } = message;
	    const {
	      numRequiredSignatures,
	      numReadonlySignedAccounts,
	      numReadonlyUnsignedAccounts
	    } = header;
	    const numWritableSignedAccounts = numRequiredSignatures - numReadonlySignedAccounts;
	    assert$1(numWritableSignedAccounts > 0, 'Message header is invalid');
	    const numWritableUnsignedAccounts = message.staticAccountKeys.length - numRequiredSignatures - numReadonlyUnsignedAccounts;
	    assert$1(numWritableUnsignedAccounts >= 0, 'Message header is invalid');
	    const accountKeys = message.getAccountKeys(args);
	    const payerKey = accountKeys.get(0);
	    if (payerKey === undefined) {
	      throw new Error('Failed to decompile message because no account keys were found');
	    }
	    const instructions = [];
	    for (const compiledIx of compiledInstructions) {
	      const keys = [];
	      for (const keyIndex of compiledIx.accountKeyIndexes) {
	        const pubkey = accountKeys.get(keyIndex);
	        if (pubkey === undefined) {
	          throw new Error(`Failed to find key for account key index ${keyIndex}`);
	        }
	        const isSigner = keyIndex < numRequiredSignatures;
	        let isWritable;
	        if (isSigner) {
	          isWritable = keyIndex < numWritableSignedAccounts;
	        } else if (keyIndex < accountKeys.staticAccountKeys.length) {
	          isWritable = keyIndex - numRequiredSignatures < numWritableUnsignedAccounts;
	        } else {
	          isWritable = keyIndex - accountKeys.staticAccountKeys.length <
	          // accountKeysFromLookups cannot be undefined because we already found a pubkey for this index above
	          accountKeys.accountKeysFromLookups.writable.length;
	        }
	        keys.push({
	          pubkey,
	          isSigner: keyIndex < header.numRequiredSignatures,
	          isWritable
	        });
	      }
	      const programId = accountKeys.get(compiledIx.programIdIndex);
	      if (programId === undefined) {
	        throw new Error(`Failed to find program id for program id index ${compiledIx.programIdIndex}`);
	      }
	      instructions.push(new TransactionInstruction({
	        programId,
	        data: toBuffer(compiledIx.data),
	        keys
	      }));
	    }
	    return new TransactionMessage({
	      payerKey,
	      instructions,
	      recentBlockhash
	    });
	  }
	  compileToLegacyMessage() {
	    return Message.compile({
	      payerKey: this.payerKey,
	      recentBlockhash: this.recentBlockhash,
	      instructions: this.instructions
	    });
	  }
	  compileToV0Message(addressLookupTableAccounts) {
	    return MessageV0.compile({
	      payerKey: this.payerKey,
	      recentBlockhash: this.recentBlockhash,
	      instructions: this.instructions,
	      addressLookupTableAccounts
	    });
	  }
	}

	/**
	 * Versioned transaction class
	 */
	class VersionedTransaction {
	  get version() {
	    return this.message.version;
	  }
	  constructor(message, signatures) {
	    this.signatures = void 0;
	    this.message = void 0;
	    if (signatures !== undefined) {
	      assert$1(signatures.length === message.header.numRequiredSignatures, 'Expected signatures length to be equal to the number of required signatures');
	      this.signatures = signatures;
	    } else {
	      const defaultSignatures = [];
	      for (let i = 0; i < message.header.numRequiredSignatures; i++) {
	        defaultSignatures.push(new Uint8Array(SIGNATURE_LENGTH_IN_BYTES));
	      }
	      this.signatures = defaultSignatures;
	    }
	    this.message = message;
	  }
	  serialize() {
	    const serializedMessage = this.message.serialize();
	    const encodedSignaturesLength = Array();
	    encodeLength(encodedSignaturesLength, this.signatures.length);
	    const transactionLayout = LayoutExports.struct([LayoutExports.blob(encodedSignaturesLength.length, 'encodedSignaturesLength'), LayoutExports.seq(signature(), this.signatures.length, 'signatures'), LayoutExports.blob(serializedMessage.length, 'serializedMessage')]);
	    const serializedTransaction = new Uint8Array(2048);
	    const serializedTransactionLength = transactionLayout.encode({
	      encodedSignaturesLength: new Uint8Array(encodedSignaturesLength),
	      signatures: this.signatures,
	      serializedMessage
	    }, serializedTransaction);
	    return serializedTransaction.slice(0, serializedTransactionLength);
	  }
	  static deserialize(serializedTransaction) {
	    let byteArray = [...serializedTransaction];
	    const signatures = [];
	    const signaturesLength = decodeLength(byteArray);
	    for (let i = 0; i < signaturesLength; i++) {
	      signatures.push(new Uint8Array(guardedSplice(byteArray, 0, SIGNATURE_LENGTH_IN_BYTES)));
	    }
	    const message = VersionedMessage.deserialize(new Uint8Array(byteArray));
	    return new VersionedTransaction(message, signatures);
	  }
	  sign(signers) {
	    const messageData = this.message.serialize();
	    const signerPubkeys = this.message.staticAccountKeys.slice(0, this.message.header.numRequiredSignatures);
	    for (const signer of signers) {
	      const signerIndex = signerPubkeys.findIndex(pubkey => pubkey.equals(signer.publicKey));
	      assert$1(signerIndex >= 0, `Cannot sign with non signer key ${signer.publicKey.toBase58()}`);
	      this.signatures[signerIndex] = sign(messageData, signer.secretKey);
	    }
	  }
	  addSignature(publicKey, signature) {
	    assert$1(signature.byteLength === 64, 'Signature must be 64 bytes long');
	    const signerPubkeys = this.message.staticAccountKeys.slice(0, this.message.header.numRequiredSignatures);
	    const signerIndex = signerPubkeys.findIndex(pubkey => pubkey.equals(publicKey));
	    assert$1(signerIndex >= 0, `Can not add signature; \`${publicKey.toBase58()}\` is not required to sign this transaction`);
	    this.signatures[signerIndex] = signature;
	  }
	}

	// TODO: These constants should be removed in favor of reading them out of a
	// Syscall account

	/**
	 * @internal
	 */
	const NUM_TICKS_PER_SECOND = 160;

	/**
	 * @internal
	 */
	const DEFAULT_TICKS_PER_SLOT = 64;

	/**
	 * @internal
	 */
	const NUM_SLOTS_PER_SECOND = NUM_TICKS_PER_SECOND / DEFAULT_TICKS_PER_SLOT;

	/**
	 * @internal
	 */
	const MS_PER_SLOT = 1000 / NUM_SLOTS_PER_SECOND;

	const SYSVAR_CLOCK_PUBKEY = new PublicKey('SysvarC1ock11111111111111111111111111111111');
	const SYSVAR_EPOCH_SCHEDULE_PUBKEY = new PublicKey('SysvarEpochSchedu1e111111111111111111111111');
	const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey('Sysvar1nstructions1111111111111111111111111');
	const SYSVAR_RECENT_BLOCKHASHES_PUBKEY = new PublicKey('SysvarRecentB1ockHashes11111111111111111111');
	const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
	const SYSVAR_REWARDS_PUBKEY = new PublicKey('SysvarRewards111111111111111111111111111111');
	const SYSVAR_SLOT_HASHES_PUBKEY = new PublicKey('SysvarS1otHashes111111111111111111111111111');
	const SYSVAR_SLOT_HISTORY_PUBKEY = new PublicKey('SysvarS1otHistory11111111111111111111111111');
	const SYSVAR_STAKE_HISTORY_PUBKEY = new PublicKey('SysvarStakeHistory1111111111111111111111111');

	class SendTransactionError extends Error {
	  constructor({
	    action,
	    signature,
	    transactionMessage,
	    logs
	  }) {
	    const maybeLogsOutput = logs ? `Logs: \n${JSON.stringify(logs.slice(-10), null, 2)}. ` : '';
	    const guideText = '\nCatch the `SendTransactionError` and call `getLogs()` on it for full details.';
	    let message;
	    switch (action) {
	      case 'send':
	        message = `Transaction ${signature} resulted in an error. \n` + `${transactionMessage}. ` + maybeLogsOutput + guideText;
	        break;
	      case 'simulate':
	        message = `Simulation failed. \nMessage: ${transactionMessage}. \n` + maybeLogsOutput + guideText;
	        break;
	      default:
	        {
	          message = `Unknown action '${(a => a)(action)}'`;
	        }
	    }
	    super(message);
	    this.signature = void 0;
	    this.transactionMessage = void 0;
	    this.transactionLogs = void 0;
	    this.signature = signature;
	    this.transactionMessage = transactionMessage;
	    this.transactionLogs = logs ? logs : undefined;
	  }
	  get transactionError() {
	    return {
	      message: this.transactionMessage,
	      logs: Array.isArray(this.transactionLogs) ? this.transactionLogs : undefined
	    };
	  }

	  /* @deprecated Use `await getLogs()` instead */
	  get logs() {
	    const cachedLogs = this.transactionLogs;
	    if (cachedLogs != null && typeof cachedLogs === 'object' && 'then' in cachedLogs) {
	      return undefined;
	    }
	    return cachedLogs;
	  }
	  async getLogs(connection) {
	    if (!Array.isArray(this.transactionLogs)) {
	      this.transactionLogs = new Promise((resolve, reject) => {
	        connection.getTransaction(this.signature).then(tx => {
	          if (tx && tx.meta && tx.meta.logMessages) {
	            const logs = tx.meta.logMessages;
	            this.transactionLogs = logs;
	            resolve(logs);
	          } else {
	            reject(new Error('Log messages not found'));
	          }
	        }).catch(reject);
	      });
	    }
	    return await this.transactionLogs;
	  }
	}

	// Keep in sync with client/src/rpc_custom_errors.rs
	// Typescript `enums` thwart tree-shaking. See https://bargsten.org/jsts/enums/
	const SolanaJSONRPCErrorCode = {
	  JSON_RPC_SERVER_ERROR_BLOCK_CLEANED_UP: -32001,
	  JSON_RPC_SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE: -32002,
	  JSON_RPC_SERVER_ERROR_TRANSACTION_SIGNATURE_VERIFICATION_FAILURE: -32003,
	  JSON_RPC_SERVER_ERROR_BLOCK_NOT_AVAILABLE: -32004,
	  JSON_RPC_SERVER_ERROR_NODE_UNHEALTHY: -32005,
	  JSON_RPC_SERVER_ERROR_TRANSACTION_PRECOMPILE_VERIFICATION_FAILURE: -32006,
	  JSON_RPC_SERVER_ERROR_SLOT_SKIPPED: -32007,
	  JSON_RPC_SERVER_ERROR_NO_SNAPSHOT: -32008,
	  JSON_RPC_SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED: -32009,
	  JSON_RPC_SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX: -32010,
	  JSON_RPC_SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE: -32011,
	  JSON_RPC_SCAN_ERROR: -32012,
	  JSON_RPC_SERVER_ERROR_TRANSACTION_SIGNATURE_LEN_MISMATCH: -32013,
	  JSON_RPC_SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET: -32014,
	  JSON_RPC_SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION: -32015,
	  JSON_RPC_SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED: -32016
	};
	class SolanaJSONRPCError extends Error {
	  constructor({
	    code,
	    message,
	    data
	  }, customMessage) {
	    super(customMessage != null ? `${customMessage}: ${message}` : message);
	    this.code = void 0;
	    this.data = void 0;
	    this.code = code;
	    this.data = data;
	    this.name = 'SolanaJSONRPCError';
	  }
	}

	/**
	 * Sign, send and confirm a transaction.
	 *
	 * If `commitment` option is not specified, defaults to 'max' commitment.
	 *
	 * @param {Connection} connection
	 * @param {Transaction} transaction
	 * @param {Array<Signer>} signers
	 * @param {ConfirmOptions} [options]
	 * @returns {Promise<TransactionSignature>}
	 */
	async function sendAndConfirmTransaction(connection, transaction, signers, options) {
	  const sendOptions = options && {
	    skipPreflight: options.skipPreflight,
	    preflightCommitment: options.preflightCommitment || options.commitment,
	    maxRetries: options.maxRetries,
	    minContextSlot: options.minContextSlot
	  };
	  const signature = await connection.sendTransaction(transaction, signers, sendOptions);
	  let status;
	  if (transaction.recentBlockhash != null && transaction.lastValidBlockHeight != null) {
	    status = (await connection.confirmTransaction({
	      abortSignal: options?.abortSignal,
	      signature: signature,
	      blockhash: transaction.recentBlockhash,
	      lastValidBlockHeight: transaction.lastValidBlockHeight
	    }, options && options.commitment)).value;
	  } else if (transaction.minNonceContextSlot != null && transaction.nonceInfo != null) {
	    const {
	      nonceInstruction
	    } = transaction.nonceInfo;
	    const nonceAccountPubkey = nonceInstruction.keys[0].pubkey;
	    status = (await connection.confirmTransaction({
	      abortSignal: options?.abortSignal,
	      minContextSlot: transaction.minNonceContextSlot,
	      nonceAccountPubkey,
	      nonceValue: transaction.nonceInfo.nonce,
	      signature
	    }, options && options.commitment)).value;
	  } else {
	    if (options?.abortSignal != null) {
	      console.warn('sendAndConfirmTransaction(): A transaction with a deprecated confirmation strategy was ' + 'supplied along with an `abortSignal`. Only transactions having `lastValidBlockHeight` ' + 'or a combination of `nonceInfo` and `minNonceContextSlot` are abortable.');
	    }
	    status = (await connection.confirmTransaction(signature, options && options.commitment)).value;
	  }
	  if (status.err) {
	    if (signature != null) {
	      throw new SendTransactionError({
	        action: 'send',
	        signature: signature,
	        transactionMessage: `Status: (${JSON.stringify(status)})`
	      });
	    }
	    throw new Error(`Transaction ${signature} failed (${JSON.stringify(status)})`);
	  }
	  return signature;
	}

	// zzz
	function sleep(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * @internal
	 */

	/**
	 * Populate a buffer of instruction data using an InstructionType
	 * @internal
	 */
	function encodeData(type, fields) {
	  const allocLength = type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
	  const data = bufferExports.Buffer.alloc(allocLength);
	  const layoutFields = Object.assign({
	    instruction: type.index
	  }, fields);
	  type.layout.encode(layoutFields, data);
	  return data;
	}

	/**
	 * Decode instruction data buffer using an InstructionType
	 * @internal
	 */
	function decodeData$1(type, buffer) {
	  let data;
	  try {
	    data = type.layout.decode(buffer);
	  } catch (err) {
	    throw new Error('invalid instruction; ' + err);
	  }
	  if (data.instruction !== type.index) {
	    throw new Error(`invalid instruction; instruction index mismatch ${data.instruction} != ${type.index}`);
	  }
	  return data;
	}

	/**
	 * https://github.com/solana-labs/solana/blob/90bedd7e067b5b8f3ddbb45da00a4e9cabb22c62/sdk/src/fee_calculator.rs#L7-L11
	 *
	 * @internal
	 */
	const FeeCalculatorLayout = LayoutExports.nu64('lamportsPerSignature');

	/**
	 * Calculator for transaction fees.
	 *
	 * @deprecated Deprecated since Solana v1.8.0.
	 */

	/**
	 * See https://github.com/solana-labs/solana/blob/0ea2843ec9cdc517572b8e62c959f41b55cf4453/sdk/src/nonce_state.rs#L29-L32
	 *
	 * @internal
	 */
	const NonceAccountLayout = LayoutExports.struct([LayoutExports.u32('version'), LayoutExports.u32('state'), publicKey('authorizedPubkey'), publicKey('nonce'), LayoutExports.struct([FeeCalculatorLayout], 'feeCalculator')]);
	const NONCE_ACCOUNT_LENGTH = NonceAccountLayout.span;

	/**
	 * A durable nonce is a 32 byte value encoded as a base58 string.
	 */

	/**
	 * NonceAccount class
	 */
	class NonceAccount {
	  /**
	   * @internal
	   */
	  constructor(args) {
	    this.authorizedPubkey = void 0;
	    this.nonce = void 0;
	    this.feeCalculator = void 0;
	    this.authorizedPubkey = args.authorizedPubkey;
	    this.nonce = args.nonce;
	    this.feeCalculator = args.feeCalculator;
	  }

	  /**
	   * Deserialize NonceAccount from the account data.
	   *
	   * @param buffer account data
	   * @return NonceAccount
	   */
	  static fromAccountData(buffer) {
	    const nonceAccount = NonceAccountLayout.decode(toBuffer(buffer), 0);
	    return new NonceAccount({
	      authorizedPubkey: new PublicKey(nonceAccount.authorizedPubkey),
	      nonce: new PublicKey(nonceAccount.nonce).toString(),
	      feeCalculator: nonceAccount.feeCalculator
	    });
	  }
	}

	// src/codes.ts
	var SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY = 8078e3;
	var SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH = 8078001;
	var SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH = 8078004;
	var SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH = 8078005;
	var SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH = 8078006;
	var SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE = 8078011;

	// src/context.ts
	function encodeValue(value) {
	  if (Array.isArray(value)) {
	    const commaSeparatedValues = value.map(encodeValue).join(
	      "%2C%20"
	      /* ", " */
	    );
	    return "%5B" + commaSeparatedValues + /* "]" */
	    "%5D";
	  } else if (typeof value === "bigint") {
	    return `${value}n`;
	  } else {
	    return encodeURIComponent(
	      String(
	        value != null && Object.getPrototypeOf(value) === null ? (
	          // Plain objects with no prototype don't have a `toString` method.
	          // Convert them before stringifying them.
	          { ...value }
	        ) : value
	      )
	    );
	  }
	}
	function encodeObjectContextEntry([key, value]) {
	  return `${key}=${encodeValue(value)}`;
	}
	function encodeContextObject(context) {
	  const searchParamsString = Object.entries(context).map(encodeObjectContextEntry).join("&");
	  return btoa(searchParamsString);
	}
	function getErrorMessage(code, context = {}) {
	  {
	    let decodingAdviceMessage = `Solana error #${code}; Decode this error by running \`npx @solana/errors decode -- ${code}`;
	    if (Object.keys(context).length) {
	      decodingAdviceMessage += ` '${encodeContextObject(context)}'`;
	    }
	    return `${decodingAdviceMessage}\``;
	  }
	}
	var SolanaError = class extends Error {
	  /**
	   * Indicates the root cause of this {@link SolanaError}, if any.
	   *
	   * For example, a transaction error might have an instruction error as its root cause. In this
	   * case, you will be able to access the instruction error on the transaction error as `cause`.
	   */
	  cause = this.cause;
	  /**
	   * Contains context that can assist in understanding or recovering from a {@link SolanaError}.
	   */
	  context;
	  constructor(...[code, contextAndErrorOptions]) {
	    let context;
	    let errorOptions;
	    if (contextAndErrorOptions) {
	      const { cause, ...contextRest } = contextAndErrorOptions;
	      if (cause) {
	        errorOptions = { cause };
	      }
	      if (Object.keys(contextRest).length > 0) {
	        context = contextRest;
	      }
	    }
	    const message = getErrorMessage(code, context);
	    super(message, errorOptions);
	    this.context = {
	      __code: code,
	      ...context
	    };
	    this.name = "SolanaError";
	  }
	};

	function getEncodedSize(value, encoder) {
	  return "fixedSize" in encoder ? encoder.fixedSize : encoder.getSizeFromValue(value);
	}
	function createEncoder(encoder) {
	  return Object.freeze({
	    ...encoder,
	    encode: (value) => {
	      const bytes = new Uint8Array(getEncodedSize(value, encoder));
	      encoder.write(value, bytes, 0);
	      return bytes;
	    }
	  });
	}
	function createDecoder(decoder) {
	  return Object.freeze({
	    ...decoder,
	    decode: (bytes, offset = 0) => decoder.read(bytes, offset)[0]
	  });
	}
	function isFixedSize(codec) {
	  return "fixedSize" in codec && typeof codec.fixedSize === "number";
	}
	function combineCodec(encoder, decoder) {
	  if (isFixedSize(encoder) !== isFixedSize(decoder)) {
	    throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH);
	  }
	  if (isFixedSize(encoder) && isFixedSize(decoder) && encoder.fixedSize !== decoder.fixedSize) {
	    throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH, {
	      decoderFixedSize: decoder.fixedSize,
	      encoderFixedSize: encoder.fixedSize
	    });
	  }
	  if (!isFixedSize(encoder) && !isFixedSize(decoder) && encoder.maxSize !== decoder.maxSize) {
	    throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH, {
	      decoderMaxSize: decoder.maxSize,
	      encoderMaxSize: encoder.maxSize
	    });
	  }
	  return {
	    ...decoder,
	    ...encoder,
	    decode: decoder.decode,
	    encode: encoder.encode,
	    read: decoder.read,
	    write: encoder.write
	  };
	}
	function assertByteArrayIsNotEmptyForCodec(codecDescription, bytes, offset = 0) {
	  if (bytes.length - offset <= 0) {
	    throw new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, {
	      codecDescription
	    });
	  }
	}
	function assertByteArrayHasEnoughBytesForCodec(codecDescription, expected, bytes, offset = 0) {
	  const bytesLength = bytes.length - offset;
	  if (bytesLength < expected) {
	    throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
	      bytesLength,
	      codecDescription,
	      expected
	    });
	  }
	}

	// src/assertions.ts
	function assertNumberIsBetweenForCodec(codecDescription, min, max, value) {
	  if (value < min || value > max) {
	    throw new SolanaError(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, {
	      codecDescription,
	      max,
	      min,
	      value
	    });
	  }
	}
	function isLittleEndian(config) {
	  return config?.endian === 1 /* Big */ ? false : true;
	}
	function numberEncoderFactory(input) {
	  return createEncoder({
	    fixedSize: input.size,
	    write(value, bytes, offset) {
	      if (input.range) {
	        assertNumberIsBetweenForCodec(input.name, input.range[0], input.range[1], value);
	      }
	      const arrayBuffer = new ArrayBuffer(input.size);
	      input.set(new DataView(arrayBuffer), value, isLittleEndian(input.config));
	      bytes.set(new Uint8Array(arrayBuffer), offset);
	      return offset + input.size;
	    }
	  });
	}
	function numberDecoderFactory(input) {
	  return createDecoder({
	    fixedSize: input.size,
	    read(bytes, offset = 0) {
	      assertByteArrayIsNotEmptyForCodec(input.name, bytes, offset);
	      assertByteArrayHasEnoughBytesForCodec(input.name, input.size, bytes, offset);
	      const view = new DataView(toArrayBuffer(bytes, offset, input.size));
	      return [input.get(view, isLittleEndian(input.config)), offset + input.size];
	    }
	  });
	}
	function toArrayBuffer(bytes, offset, length) {
	  const bytesOffset = bytes.byteOffset + (offset ?? 0);
	  const bytesLength = length ?? bytes.byteLength;
	  return bytes.buffer.slice(bytesOffset, bytesOffset + bytesLength);
	}
	var getU64Encoder = (config = {}) => numberEncoderFactory({
	  config,
	  name: "u64",
	  range: [0n, BigInt("0xffffffffffffffff")],
	  set: (view, value, le) => view.setBigUint64(0, BigInt(value), le),
	  size: 8
	});
	var getU64Decoder = (config = {}) => numberDecoderFactory({
	  config,
	  get: (view, le) => view.getBigUint64(0, le),
	  name: "u64",
	  size: 8
	});
	var getU64Codec = (config = {}) => combineCodec(getU64Encoder(config), getU64Decoder(config));

	function u64(property) {
	  const layout = LayoutExports.blob(8 /* bytes */, property);
	  const decode = layout.decode.bind(layout);
	  const encode = layout.encode.bind(layout);
	  const bigIntLayout = layout;
	  const codec = getU64Codec();
	  bigIntLayout.decode = (buffer, offset) => {
	    const src = decode(buffer, offset);
	    return codec.decode(src);
	  };
	  bigIntLayout.encode = (bigInt, buffer, offset) => {
	    const src = codec.encode(bigInt);
	    return encode(src, buffer, offset);
	  };
	  return bigIntLayout;
	}

	/**
	 * Create account system transaction params
	 */

	/**
	 * Transfer system transaction params
	 */

	/**
	 * Assign system transaction params
	 */

	/**
	 * Create account with seed system transaction params
	 */

	/**
	 * Create nonce account system transaction params
	 */

	/**
	 * Create nonce account with seed system transaction params
	 */

	/**
	 * Initialize nonce account system instruction params
	 */

	/**
	 * Advance nonce account system instruction params
	 */

	/**
	 * Withdraw nonce account system transaction params
	 */

	/**
	 * Authorize nonce account system transaction params
	 */

	/**
	 * Allocate account system transaction params
	 */

	/**
	 * Allocate account with seed system transaction params
	 */

	/**
	 * Assign account with seed system transaction params
	 */

	/**
	 * Transfer with seed system transaction params
	 */

	/** Decoded transfer system transaction instruction */

	/** Decoded transferWithSeed system transaction instruction */

	/**
	 * System Instruction class
	 */
	class SystemInstruction {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Decode a system instruction and retrieve the instruction type.
	   */
	  static decodeInstructionType(instruction) {
	    this.checkProgramId(instruction.programId);
	    const instructionTypeLayout = LayoutExports.u32('instruction');
	    const typeIndex = instructionTypeLayout.decode(instruction.data);
	    let type;
	    for (const [ixType, layout] of Object.entries(SYSTEM_INSTRUCTION_LAYOUTS)) {
	      if (layout.index == typeIndex) {
	        type = ixType;
	        break;
	      }
	    }
	    if (!type) {
	      throw new Error('Instruction type incorrect; not a SystemInstruction');
	    }
	    return type;
	  }

	  /**
	   * Decode a create account system instruction and retrieve the instruction params.
	   */
	  static decodeCreateAccount(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 2);
	    const {
	      lamports,
	      space,
	      programId
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Create, instruction.data);
	    return {
	      fromPubkey: instruction.keys[0].pubkey,
	      newAccountPubkey: instruction.keys[1].pubkey,
	      lamports,
	      space,
	      programId: new PublicKey(programId)
	    };
	  }

	  /**
	   * Decode a transfer system instruction and retrieve the instruction params.
	   */
	  static decodeTransfer(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 2);
	    const {
	      lamports
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Transfer, instruction.data);
	    return {
	      fromPubkey: instruction.keys[0].pubkey,
	      toPubkey: instruction.keys[1].pubkey,
	      lamports
	    };
	  }

	  /**
	   * Decode a transfer with seed system instruction and retrieve the instruction params.
	   */
	  static decodeTransferWithSeed(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    const {
	      lamports,
	      seed,
	      programId
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.TransferWithSeed, instruction.data);
	    return {
	      fromPubkey: instruction.keys[0].pubkey,
	      basePubkey: instruction.keys[1].pubkey,
	      toPubkey: instruction.keys[2].pubkey,
	      lamports,
	      seed,
	      programId: new PublicKey(programId)
	    };
	  }

	  /**
	   * Decode an allocate system instruction and retrieve the instruction params.
	   */
	  static decodeAllocate(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 1);
	    const {
	      space
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Allocate, instruction.data);
	    return {
	      accountPubkey: instruction.keys[0].pubkey,
	      space
	    };
	  }

	  /**
	   * Decode an allocate with seed system instruction and retrieve the instruction params.
	   */
	  static decodeAllocateWithSeed(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 1);
	    const {
	      base,
	      seed,
	      space,
	      programId
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AllocateWithSeed, instruction.data);
	    return {
	      accountPubkey: instruction.keys[0].pubkey,
	      basePubkey: new PublicKey(base),
	      seed,
	      space,
	      programId: new PublicKey(programId)
	    };
	  }

	  /**
	   * Decode an assign system instruction and retrieve the instruction params.
	   */
	  static decodeAssign(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 1);
	    const {
	      programId
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.Assign, instruction.data);
	    return {
	      accountPubkey: instruction.keys[0].pubkey,
	      programId: new PublicKey(programId)
	    };
	  }

	  /**
	   * Decode an assign with seed system instruction and retrieve the instruction params.
	   */
	  static decodeAssignWithSeed(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 1);
	    const {
	      base,
	      seed,
	      programId
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AssignWithSeed, instruction.data);
	    return {
	      accountPubkey: instruction.keys[0].pubkey,
	      basePubkey: new PublicKey(base),
	      seed,
	      programId: new PublicKey(programId)
	    };
	  }

	  /**
	   * Decode a create account with seed system instruction and retrieve the instruction params.
	   */
	  static decodeCreateWithSeed(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 2);
	    const {
	      base,
	      seed,
	      lamports,
	      space,
	      programId
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.CreateWithSeed, instruction.data);
	    return {
	      fromPubkey: instruction.keys[0].pubkey,
	      newAccountPubkey: instruction.keys[1].pubkey,
	      basePubkey: new PublicKey(base),
	      seed,
	      lamports,
	      space,
	      programId: new PublicKey(programId)
	    };
	  }

	  /**
	   * Decode a nonce initialize system instruction and retrieve the instruction params.
	   */
	  static decodeNonceInitialize(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    const {
	      authorized
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.InitializeNonceAccount, instruction.data);
	    return {
	      noncePubkey: instruction.keys[0].pubkey,
	      authorizedPubkey: new PublicKey(authorized)
	    };
	  }

	  /**
	   * Decode a nonce advance system instruction and retrieve the instruction params.
	   */
	  static decodeNonceAdvance(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AdvanceNonceAccount, instruction.data);
	    return {
	      noncePubkey: instruction.keys[0].pubkey,
	      authorizedPubkey: instruction.keys[2].pubkey
	    };
	  }

	  /**
	   * Decode a nonce withdraw system instruction and retrieve the instruction params.
	   */
	  static decodeNonceWithdraw(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 5);
	    const {
	      lamports
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.WithdrawNonceAccount, instruction.data);
	    return {
	      noncePubkey: instruction.keys[0].pubkey,
	      toPubkey: instruction.keys[1].pubkey,
	      authorizedPubkey: instruction.keys[4].pubkey,
	      lamports
	    };
	  }

	  /**
	   * Decode a nonce authorize system instruction and retrieve the instruction params.
	   */
	  static decodeNonceAuthorize(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 2);
	    const {
	      authorized
	    } = decodeData$1(SYSTEM_INSTRUCTION_LAYOUTS.AuthorizeNonceAccount, instruction.data);
	    return {
	      noncePubkey: instruction.keys[0].pubkey,
	      authorizedPubkey: instruction.keys[1].pubkey,
	      newAuthorizedPubkey: new PublicKey(authorized)
	    };
	  }

	  /**
	   * @internal
	   */
	  static checkProgramId(programId) {
	    if (!programId.equals(SystemProgram.programId)) {
	      throw new Error('invalid instruction; programId is not SystemProgram');
	    }
	  }

	  /**
	   * @internal
	   */
	  static checkKeyLength(keys, expectedLength) {
	    if (keys.length < expectedLength) {
	      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
	    }
	  }
	}

	/**
	 * An enumeration of valid SystemInstructionType's
	 */

	/**
	 * An enumeration of valid system InstructionType's
	 * @internal
	 */
	const SYSTEM_INSTRUCTION_LAYOUTS = Object.freeze({
	  Create: {
	    index: 0,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), LayoutExports.ns64('lamports'), LayoutExports.ns64('space'), publicKey('programId')])
	  },
	  Assign: {
	    index: 1,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('programId')])
	  },
	  Transfer: {
	    index: 2,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), u64('lamports')])
	  },
	  CreateWithSeed: {
	    index: 3,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('base'), rustString('seed'), LayoutExports.ns64('lamports'), LayoutExports.ns64('space'), publicKey('programId')])
	  },
	  AdvanceNonceAccount: {
	    index: 4,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  },
	  WithdrawNonceAccount: {
	    index: 5,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), LayoutExports.ns64('lamports')])
	  },
	  InitializeNonceAccount: {
	    index: 6,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('authorized')])
	  },
	  AuthorizeNonceAccount: {
	    index: 7,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('authorized')])
	  },
	  Allocate: {
	    index: 8,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), LayoutExports.ns64('space')])
	  },
	  AllocateWithSeed: {
	    index: 9,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('base'), rustString('seed'), LayoutExports.ns64('space'), publicKey('programId')])
	  },
	  AssignWithSeed: {
	    index: 10,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('base'), rustString('seed'), publicKey('programId')])
	  },
	  TransferWithSeed: {
	    index: 11,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), u64('lamports'), rustString('seed'), publicKey('programId')])
	  },
	  UpgradeNonceAccount: {
	    index: 12,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  }
	});

	/**
	 * Factory class for transactions to interact with the System program
	 */
	class SystemProgram {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Public key that identifies the System program
	   */

	  /**
	   * Generate a transaction instruction that creates a new account
	   */
	  static createAccount(params) {
	    const type = SYSTEM_INSTRUCTION_LAYOUTS.Create;
	    const data = encodeData(type, {
	      lamports: params.lamports,
	      space: params.space,
	      programId: toBuffer(params.programId.toBuffer())
	    });
	    return new TransactionInstruction({
	      keys: [{
	        pubkey: params.fromPubkey,
	        isSigner: true,
	        isWritable: true
	      }, {
	        pubkey: params.newAccountPubkey,
	        isSigner: true,
	        isWritable: true
	      }],
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction instruction that transfers lamports from one account to another
	   */
	  static transfer(params) {
	    let data;
	    let keys;
	    if ('basePubkey' in params) {
	      const type = SYSTEM_INSTRUCTION_LAYOUTS.TransferWithSeed;
	      data = encodeData(type, {
	        lamports: BigInt(params.lamports),
	        seed: params.seed,
	        programId: toBuffer(params.programId.toBuffer())
	      });
	      keys = [{
	        pubkey: params.fromPubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: params.basePubkey,
	        isSigner: true,
	        isWritable: false
	      }, {
	        pubkey: params.toPubkey,
	        isSigner: false,
	        isWritable: true
	      }];
	    } else {
	      const type = SYSTEM_INSTRUCTION_LAYOUTS.Transfer;
	      data = encodeData(type, {
	        lamports: BigInt(params.lamports)
	      });
	      keys = [{
	        pubkey: params.fromPubkey,
	        isSigner: true,
	        isWritable: true
	      }, {
	        pubkey: params.toPubkey,
	        isSigner: false,
	        isWritable: true
	      }];
	    }
	    return new TransactionInstruction({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction instruction that assigns an account to a program
	   */
	  static assign(params) {
	    let data;
	    let keys;
	    if ('basePubkey' in params) {
	      const type = SYSTEM_INSTRUCTION_LAYOUTS.AssignWithSeed;
	      data = encodeData(type, {
	        base: toBuffer(params.basePubkey.toBuffer()),
	        seed: params.seed,
	        programId: toBuffer(params.programId.toBuffer())
	      });
	      keys = [{
	        pubkey: params.accountPubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: params.basePubkey,
	        isSigner: true,
	        isWritable: false
	      }];
	    } else {
	      const type = SYSTEM_INSTRUCTION_LAYOUTS.Assign;
	      data = encodeData(type, {
	        programId: toBuffer(params.programId.toBuffer())
	      });
	      keys = [{
	        pubkey: params.accountPubkey,
	        isSigner: true,
	        isWritable: true
	      }];
	    }
	    return new TransactionInstruction({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction instruction that creates a new account at
	   *   an address generated with `from`, a seed, and programId
	   */
	  static createAccountWithSeed(params) {
	    const type = SYSTEM_INSTRUCTION_LAYOUTS.CreateWithSeed;
	    const data = encodeData(type, {
	      base: toBuffer(params.basePubkey.toBuffer()),
	      seed: params.seed,
	      lamports: params.lamports,
	      space: params.space,
	      programId: toBuffer(params.programId.toBuffer())
	    });
	    let keys = [{
	      pubkey: params.fromPubkey,
	      isSigner: true,
	      isWritable: true
	    }, {
	      pubkey: params.newAccountPubkey,
	      isSigner: false,
	      isWritable: true
	    }];
	    if (!params.basePubkey.equals(params.fromPubkey)) {
	      keys.push({
	        pubkey: params.basePubkey,
	        isSigner: true,
	        isWritable: false
	      });
	    }
	    return new TransactionInstruction({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction that creates a new Nonce account
	   */
	  static createNonceAccount(params) {
	    const transaction = new Transaction();
	    if ('basePubkey' in params && 'seed' in params) {
	      transaction.add(SystemProgram.createAccountWithSeed({
	        fromPubkey: params.fromPubkey,
	        newAccountPubkey: params.noncePubkey,
	        basePubkey: params.basePubkey,
	        seed: params.seed,
	        lamports: params.lamports,
	        space: NONCE_ACCOUNT_LENGTH,
	        programId: this.programId
	      }));
	    } else {
	      transaction.add(SystemProgram.createAccount({
	        fromPubkey: params.fromPubkey,
	        newAccountPubkey: params.noncePubkey,
	        lamports: params.lamports,
	        space: NONCE_ACCOUNT_LENGTH,
	        programId: this.programId
	      }));
	    }
	    const initParams = {
	      noncePubkey: params.noncePubkey,
	      authorizedPubkey: params.authorizedPubkey
	    };
	    transaction.add(this.nonceInitialize(initParams));
	    return transaction;
	  }

	  /**
	   * Generate an instruction to initialize a Nonce account
	   */
	  static nonceInitialize(params) {
	    const type = SYSTEM_INSTRUCTION_LAYOUTS.InitializeNonceAccount;
	    const data = encodeData(type, {
	      authorized: toBuffer(params.authorizedPubkey.toBuffer())
	    });
	    const instructionData = {
	      keys: [{
	        pubkey: params.noncePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: SYSVAR_RENT_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    };
	    return new TransactionInstruction(instructionData);
	  }

	  /**
	   * Generate an instruction to advance the nonce in a Nonce account
	   */
	  static nonceAdvance(params) {
	    const type = SYSTEM_INSTRUCTION_LAYOUTS.AdvanceNonceAccount;
	    const data = encodeData(type);
	    const instructionData = {
	      keys: [{
	        pubkey: params.noncePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: params.authorizedPubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    };
	    return new TransactionInstruction(instructionData);
	  }

	  /**
	   * Generate a transaction instruction that withdraws lamports from a Nonce account
	   */
	  static nonceWithdraw(params) {
	    const type = SYSTEM_INSTRUCTION_LAYOUTS.WithdrawNonceAccount;
	    const data = encodeData(type, {
	      lamports: params.lamports
	    });
	    return new TransactionInstruction({
	      keys: [{
	        pubkey: params.noncePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: params.toPubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: SYSVAR_RENT_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: params.authorizedPubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction instruction that authorizes a new PublicKey as the authority
	   * on a Nonce account.
	   */
	  static nonceAuthorize(params) {
	    const type = SYSTEM_INSTRUCTION_LAYOUTS.AuthorizeNonceAccount;
	    const data = encodeData(type, {
	      authorized: toBuffer(params.newAuthorizedPubkey.toBuffer())
	    });
	    return new TransactionInstruction({
	      keys: [{
	        pubkey: params.noncePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: params.authorizedPubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction instruction that allocates space in an account without funding
	   */
	  static allocate(params) {
	    let data;
	    let keys;
	    if ('basePubkey' in params) {
	      const type = SYSTEM_INSTRUCTION_LAYOUTS.AllocateWithSeed;
	      data = encodeData(type, {
	        base: toBuffer(params.basePubkey.toBuffer()),
	        seed: params.seed,
	        space: params.space,
	        programId: toBuffer(params.programId.toBuffer())
	      });
	      keys = [{
	        pubkey: params.accountPubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: params.basePubkey,
	        isSigner: true,
	        isWritable: false
	      }];
	    } else {
	      const type = SYSTEM_INSTRUCTION_LAYOUTS.Allocate;
	      data = encodeData(type, {
	        space: params.space
	      });
	      keys = [{
	        pubkey: params.accountPubkey,
	        isSigner: true,
	        isWritable: true
	      }];
	    }
	    return new TransactionInstruction({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }
	}
	SystemProgram.programId = new PublicKey('11111111111111111111111111111111');

	// Keep program chunks under PACKET_DATA_SIZE, leaving enough room for the
	// rest of the Transaction fields
	//
	// TODO: replace 300 with a proper constant for the size of the other
	// Transaction fields
	const CHUNK_SIZE = PACKET_DATA_SIZE - 300;

	/**
	 * Program loader interface
	 */
	class Loader {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Amount of program data placed in each load Transaction
	   */

	  /**
	   * Minimum number of signatures required to load a program not including
	   * retries
	   *
	   * Can be used to calculate transaction fees
	   */
	  static getMinNumSignatures(dataLength) {
	    return 2 * (
	    // Every transaction requires two signatures (payer + program)
	    Math.ceil(dataLength / Loader.chunkSize) + 1 +
	    // Add one for Create transaction
	    1) // Add one for Finalize transaction
	    ;
	  }

	  /**
	   * Loads a generic program
	   *
	   * @param connection The connection to use
	   * @param payer System account that pays to load the program
	   * @param program Account to load the program into
	   * @param programId Public key that identifies the loader
	   * @param data Program octets
	   * @return true if program was loaded successfully, false if program was already loaded
	   */
	  static async load(connection, payer, program, programId, data) {
	    {
	      const balanceNeeded = await connection.getMinimumBalanceForRentExemption(data.length);

	      // Fetch program account info to check if it has already been created
	      const programInfo = await connection.getAccountInfo(program.publicKey, 'confirmed');
	      let transaction = null;
	      if (programInfo !== null) {
	        if (programInfo.executable) {
	          console.error('Program load failed, account is already executable');
	          return false;
	        }
	        if (programInfo.data.length !== data.length) {
	          transaction = transaction || new Transaction();
	          transaction.add(SystemProgram.allocate({
	            accountPubkey: program.publicKey,
	            space: data.length
	          }));
	        }
	        if (!programInfo.owner.equals(programId)) {
	          transaction = transaction || new Transaction();
	          transaction.add(SystemProgram.assign({
	            accountPubkey: program.publicKey,
	            programId
	          }));
	        }
	        if (programInfo.lamports < balanceNeeded) {
	          transaction = transaction || new Transaction();
	          transaction.add(SystemProgram.transfer({
	            fromPubkey: payer.publicKey,
	            toPubkey: program.publicKey,
	            lamports: balanceNeeded - programInfo.lamports
	          }));
	        }
	      } else {
	        transaction = new Transaction().add(SystemProgram.createAccount({
	          fromPubkey: payer.publicKey,
	          newAccountPubkey: program.publicKey,
	          lamports: balanceNeeded > 0 ? balanceNeeded : 1,
	          space: data.length,
	          programId
	        }));
	      }

	      // If the account is already created correctly, skip this step
	      // and proceed directly to loading instructions
	      if (transaction !== null) {
	        await sendAndConfirmTransaction(connection, transaction, [payer, program], {
	          commitment: 'confirmed'
	        });
	      }
	    }
	    const dataLayout = LayoutExports.struct([LayoutExports.u32('instruction'), LayoutExports.u32('offset'), LayoutExports.u32('bytesLength'), LayoutExports.u32('bytesLengthPadding'), LayoutExports.seq(LayoutExports.u8('byte'), LayoutExports.offset(LayoutExports.u32(), -8), 'bytes')]);
	    const chunkSize = Loader.chunkSize;
	    let offset = 0;
	    let array = data;
	    let transactions = [];
	    while (array.length > 0) {
	      const bytes = array.slice(0, chunkSize);
	      const data = bufferExports.Buffer.alloc(chunkSize + 16);
	      dataLayout.encode({
	        instruction: 0,
	        // Load instruction
	        offset,
	        bytes: bytes,
	        bytesLength: 0,
	        bytesLengthPadding: 0
	      }, data);
	      const transaction = new Transaction().add({
	        keys: [{
	          pubkey: program.publicKey,
	          isSigner: true,
	          isWritable: true
	        }],
	        programId,
	        data
	      });
	      transactions.push(sendAndConfirmTransaction(connection, transaction, [payer, program], {
	        commitment: 'confirmed'
	      }));

	      // Delay between sends in an attempt to reduce rate limit errors
	      if (connection._rpcEndpoint.includes('solana.com')) {
	        const REQUESTS_PER_SECOND = 4;
	        await sleep(1000 / REQUESTS_PER_SECOND);
	      }
	      offset += chunkSize;
	      array = array.slice(chunkSize);
	    }
	    await Promise.all(transactions);

	    // Finalize the account loaded with program data for execution
	    {
	      const dataLayout = LayoutExports.struct([LayoutExports.u32('instruction')]);
	      const data = bufferExports.Buffer.alloc(dataLayout.span);
	      dataLayout.encode({
	        instruction: 1 // Finalize instruction
	      }, data);
	      const transaction = new Transaction().add({
	        keys: [{
	          pubkey: program.publicKey,
	          isSigner: true,
	          isWritable: true
	        }, {
	          pubkey: SYSVAR_RENT_PUBKEY,
	          isSigner: false,
	          isWritable: false
	        }],
	        programId,
	        data
	      });
	      const deployCommitment = 'processed';
	      const finalizeSignature = await connection.sendTransaction(transaction, [payer, program], {
	        preflightCommitment: deployCommitment
	      });
	      const {
	        context,
	        value
	      } = await connection.confirmTransaction({
	        signature: finalizeSignature,
	        lastValidBlockHeight: transaction.lastValidBlockHeight,
	        blockhash: transaction.recentBlockhash
	      }, deployCommitment);
	      if (value.err) {
	        throw new Error(`Transaction ${finalizeSignature} failed (${JSON.stringify(value)})`);
	      }
	      // We prevent programs from being usable until the slot after their deployment.
	      // See https://github.com/solana-labs/solana/pull/29654
	      while (true // eslint-disable-line no-constant-condition
	      ) {
	        try {
	          const currentSlot = await connection.getSlot({
	            commitment: deployCommitment
	          });
	          if (currentSlot > context.slot) {
	            break;
	          }
	        } catch {
	          /* empty */
	        }
	        await new Promise(resolve => setTimeout(resolve, Math.round(MS_PER_SLOT / 2)));
	      }
	    }

	    // success
	    return true;
	  }
	}
	Loader.chunkSize = CHUNK_SIZE;

	/**
	 * @deprecated Deprecated since Solana v1.17.20.
	 */
	const BPF_LOADER_PROGRAM_ID = new PublicKey('BPFLoader2111111111111111111111111111111111');

	/**
	 * Factory class for transactions to interact with a program loader
	 *
	 * @deprecated Deprecated since Solana v1.17.20.
	 */
	class BpfLoader {
	  /**
	   * Minimum number of signatures required to load a program not including
	   * retries
	   *
	   * Can be used to calculate transaction fees
	   */
	  static getMinNumSignatures(dataLength) {
	    return Loader.getMinNumSignatures(dataLength);
	  }

	  /**
	   * Load a SBF program
	   *
	   * @param connection The connection to use
	   * @param payer Account that will pay program loading fees
	   * @param program Account to load the program into
	   * @param elf The entire ELF containing the SBF program
	   * @param loaderProgramId The program id of the BPF loader to use
	   * @return true if program was loaded successfully, false if program was already loaded
	   */
	  static load(connection, payer, program, elf, loaderProgramId) {
	    return Loader.load(connection, payer, program, loaderProgramId, elf);
	  }
	}

	var fastStableStringify$1;
	var hasRequiredFastStableStringify;

	function requireFastStableStringify () {
		if (hasRequiredFastStableStringify) return fastStableStringify$1;
		hasRequiredFastStableStringify = 1;
		var objToString = Object.prototype.toString;
		var objKeys = Object.keys || function(obj) {
				var keys = [];
				for (var name in obj) {
					keys.push(name);
				}
				return keys;
			};

		function stringify(val, isArrayProp) {
			var i, max, str, keys, key, propVal, toStr;
			if (val === true) {
				return "true";
			}
			if (val === false) {
				return "false";
			}
			switch (typeof val) {
				case "object":
					if (val === null) {
						return null;
					} else if (val.toJSON && typeof val.toJSON === "function") {
						return stringify(val.toJSON(), isArrayProp);
					} else {
						toStr = objToString.call(val);
						if (toStr === "[object Array]") {
							str = '[';
							max = val.length - 1;
							for(i = 0; i < max; i++) {
								str += stringify(val[i], true) + ',';
							}
							if (max > -1) {
								str += stringify(val[i], true);
							}
							return str + ']';
						} else if (toStr === "[object Object]") {
							// only object is left
							keys = objKeys(val).sort();
							max = keys.length;
							str = "";
							i = 0;
							while (i < max) {
								key = keys[i];
								propVal = stringify(val[key], false);
								if (propVal !== undefined) {
									if (str) {
										str += ',';
									}
									str += JSON.stringify(key) + ':' + propVal;
								}
								i++;
							}
							return '{' + str + '}';
						} else {
							return JSON.stringify(val);
						}
					}
				case "function":
				case "undefined":
					return isArrayProp ? null : undefined;
				case "string":
					return JSON.stringify(val);
				default:
					return isFinite(val) ? val : null;
			}
		}

		fastStableStringify$1 = function(val) {
			var returnVal = stringify(val, false);
			if (returnVal !== undefined) {
				return ''+ returnVal;
			}
		};
		return fastStableStringify$1;
	}

	var fastStableStringifyExports = /*@__PURE__*/ requireFastStableStringify();
	var fastStableStringify = /*@__PURE__*/getDefaultExportFromCjs(fastStableStringifyExports);

	/**
	 * A `StructFailure` represents a single specific failure in validation.
	 */
	/**
	 * `StructError` objects are thrown (or returned) when validation fails.
	 *
	 * Validation logic is design to exit early for maximum performance. The error
	 * represents the first error encountered during validation. For more detail,
	 * the `error.failures` property is a generator function that can be run to
	 * continue validation and receive all the failures in the data.
	 */
	class StructError extends TypeError {
	    constructor(failure, failures) {
	        let cached;
	        const { message, explanation, ...rest } = failure;
	        const { path } = failure;
	        const msg = path.length === 0 ? message : `At path: ${path.join('.')} -- ${message}`;
	        super(explanation ?? msg);
	        if (explanation != null)
	            this.cause = msg;
	        Object.assign(this, rest);
	        this.name = this.constructor.name;
	        this.failures = () => {
	            return (cached ?? (cached = [failure, ...failures()]));
	        };
	    }
	}

	/**
	 * Check if a value is an iterator.
	 */
	function isIterable(x) {
	    return isObject(x) && typeof x[Symbol.iterator] === 'function';
	}
	/**
	 * Check if a value is a plain object.
	 */
	function isObject(x) {
	    return typeof x === 'object' && x != null;
	}
	/**
	 * Check if a value is a non-array object.
	 */
	function isNonArrayObject(x) {
	    return isObject(x) && !Array.isArray(x);
	}
	/**
	 * Return a value as a printable string.
	 */
	function print(value) {
	    if (typeof value === 'symbol') {
	        return value.toString();
	    }
	    return typeof value === 'string' ? JSON.stringify(value) : `${value}`;
	}
	/**
	 * Shifts (removes and returns) the first value from the `input` iterator.
	 * Like `Array.prototype.shift()` but for an `Iterator`.
	 */
	function shiftIterator(input) {
	    const { done, value } = input.next();
	    return done ? undefined : value;
	}
	/**
	 * Convert a single validation result to a failure.
	 */
	function toFailure(result, context, struct, value) {
	    if (result === true) {
	        return;
	    }
	    else if (result === false) {
	        result = {};
	    }
	    else if (typeof result === 'string') {
	        result = { message: result };
	    }
	    const { path, branch } = context;
	    const { type } = struct;
	    const { refinement, message = `Expected a value of type \`${type}\`${refinement ? ` with refinement \`${refinement}\`` : ''}, but received: \`${print(value)}\``, } = result;
	    return {
	        value,
	        type,
	        refinement,
	        key: path[path.length - 1],
	        path,
	        branch,
	        ...result,
	        message,
	    };
	}
	/**
	 * Convert a validation result to an iterable of failures.
	 */
	function* toFailures(result, context, struct, value) {
	    if (!isIterable(result)) {
	        result = [result];
	    }
	    for (const r of result) {
	        const failure = toFailure(r, context, struct, value);
	        if (failure) {
	            yield failure;
	        }
	    }
	}
	/**
	 * Check a value against a struct, traversing deeply into nested values, and
	 * returning an iterator of failures or success.
	 */
	function* run(value, struct, options = {}) {
	    const { path = [], branch = [value], coerce = false, mask = false } = options;
	    const ctx = { path, branch, mask };
	    if (coerce) {
	        value = struct.coercer(value, ctx);
	    }
	    let status = 'valid';
	    for (const failure of struct.validator(value, ctx)) {
	        failure.explanation = options.message;
	        status = 'not_valid';
	        yield [failure, undefined];
	    }
	    for (let [k, v, s] of struct.entries(value, ctx)) {
	        const ts = run(v, s, {
	            path: k === undefined ? path : [...path, k],
	            branch: k === undefined ? branch : [...branch, v],
	            coerce,
	            mask,
	            message: options.message,
	        });
	        for (const t of ts) {
	            if (t[0]) {
	                status = t[0].refinement != null ? 'not_refined' : 'not_valid';
	                yield [t[0], undefined];
	            }
	            else if (coerce) {
	                v = t[1];
	                if (k === undefined) {
	                    value = v;
	                }
	                else if (value instanceof Map) {
	                    value.set(k, v);
	                }
	                else if (value instanceof Set) {
	                    value.add(v);
	                }
	                else if (isObject(value)) {
	                    if (v !== undefined || k in value)
	                        value[k] = v;
	                }
	            }
	        }
	    }
	    if (status !== 'not_valid') {
	        for (const failure of struct.refiner(value, ctx)) {
	            failure.explanation = options.message;
	            status = 'not_refined';
	            yield [failure, undefined];
	        }
	    }
	    if (status === 'valid') {
	        yield [undefined, value];
	    }
	}

	/**
	 * `Struct` objects encapsulate the validation logic for a specific type of
	 * values. Once constructed, you use the `assert`, `is` or `validate` helpers to
	 * validate unknown input data against the struct.
	 */
	class Struct {
	    constructor(props) {
	        const { type, schema, validator, refiner, coercer = (value) => value, entries = function* () { }, } = props;
	        this.type = type;
	        this.schema = schema;
	        this.entries = entries;
	        this.coercer = coercer;
	        if (validator) {
	            this.validator = (value, context) => {
	                const result = validator(value, context);
	                return toFailures(result, context, this, value);
	            };
	        }
	        else {
	            this.validator = () => [];
	        }
	        if (refiner) {
	            this.refiner = (value, context) => {
	                const result = refiner(value, context);
	                return toFailures(result, context, this, value);
	            };
	        }
	        else {
	            this.refiner = () => [];
	        }
	    }
	    /**
	     * Assert that a value passes the struct's validation, throwing if it doesn't.
	     */
	    assert(value, message) {
	        return assert(value, this, message);
	    }
	    /**
	     * Create a value with the struct's coercion logic, then validate it.
	     */
	    create(value, message) {
	        return create(value, this, message);
	    }
	    /**
	     * Check if a value passes the struct's validation.
	     */
	    is(value) {
	        return is(value, this);
	    }
	    /**
	     * Mask a value, coercing and validating it, but returning only the subset of
	     * properties defined by the struct's schema. Masking applies recursively to
	     * props of `object` structs only.
	     */
	    mask(value, message) {
	        return mask(value, this, message);
	    }
	    /**
	     * Validate a value with the struct's validation logic, returning a tuple
	     * representing the result.
	     *
	     * You may optionally pass `true` for the `coerce` argument to coerce
	     * the value before attempting to validate it. If you do, the result will
	     * contain the coerced result when successful. Also, `mask` will turn on
	     * masking of the unknown `object` props recursively if passed.
	     */
	    validate(value, options = {}) {
	        return validate$1(value, this, options);
	    }
	}
	/**
	 * Assert that a value passes a struct, throwing if it doesn't.
	 */
	function assert(value, struct, message) {
	    const result = validate$1(value, struct, { message });
	    if (result[0]) {
	        throw result[0];
	    }
	}
	/**
	 * Create a value with the coercion logic of struct and validate it.
	 */
	function create(value, struct, message) {
	    const result = validate$1(value, struct, { coerce: true, message });
	    if (result[0]) {
	        throw result[0];
	    }
	    else {
	        return result[1];
	    }
	}
	/**
	 * Mask a value, returning only the subset of properties defined by a struct.
	 */
	function mask(value, struct, message) {
	    const result = validate$1(value, struct, { coerce: true, mask: true, message });
	    if (result[0]) {
	        throw result[0];
	    }
	    else {
	        return result[1];
	    }
	}
	/**
	 * Check if a value passes a struct.
	 */
	function is(value, struct) {
	    const result = validate$1(value, struct);
	    return !result[0];
	}
	/**
	 * Validate a value against a struct, returning an error if invalid, or the
	 * value (with potential coercion) if valid.
	 */
	function validate$1(value, struct, options = {}) {
	    const tuples = run(value, struct, options);
	    const tuple = shiftIterator(tuples);
	    if (tuple[0]) {
	        const error = new StructError(tuple[0], function* () {
	            for (const t of tuples) {
	                if (t[0]) {
	                    yield t[0];
	                }
	            }
	        });
	        return [error, undefined];
	    }
	    else {
	        const v = tuple[1];
	        return [undefined, v];
	    }
	}
	/**
	 * Define a new struct type with a custom validation function.
	 */
	function define(name, validator) {
	    return new Struct({ type: name, schema: null, validator });
	}

	/**
	 * Ensure that any value passes validation.
	 */
	function any() {
	    return define('any', () => true);
	}
	function array(Element) {
	    return new Struct({
	        type: 'array',
	        schema: Element,
	        *entries(value) {
	            if (Element && Array.isArray(value)) {
	                for (const [i, v] of value.entries()) {
	                    yield [i, v, Element];
	                }
	            }
	        },
	        coercer(value) {
	            return Array.isArray(value) ? value.slice() : value;
	        },
	        validator(value) {
	            return (Array.isArray(value) ||
	                `Expected an array value, but received: ${print(value)}`);
	        },
	    });
	}
	/**
	 * Ensure that a value is a boolean.
	 */
	function boolean() {
	    return define('boolean', (value) => {
	        return typeof value === 'boolean';
	    });
	}
	/**
	 * Ensure that a value is an instance of a specific class.
	 */
	function instance(Class) {
	    return define('instance', (value) => {
	        return (value instanceof Class ||
	            `Expected a \`${Class.name}\` instance, but received: ${print(value)}`);
	    });
	}
	function literal(constant) {
	    const description = print(constant);
	    const t = typeof constant;
	    return new Struct({
	        type: 'literal',
	        schema: t === 'string' || t === 'number' || t === 'boolean' ? constant : null,
	        validator(value) {
	            return (value === constant ||
	                `Expected the literal \`${description}\`, but received: ${print(value)}`);
	        },
	    });
	}
	/**
	 * Ensure that no value ever passes validation.
	 */
	function never() {
	    return define('never', () => false);
	}
	/**
	 * Augment an existing struct to allow `null` values.
	 */
	function nullable(struct) {
	    return new Struct({
	        ...struct,
	        validator: (value, ctx) => value === null || struct.validator(value, ctx),
	        refiner: (value, ctx) => value === null || struct.refiner(value, ctx),
	    });
	}
	/**
	 * Ensure that a value is a number.
	 */
	function number() {
	    return define('number', (value) => {
	        return ((typeof value === 'number' && !isNaN(value)) ||
	            `Expected a number, but received: ${print(value)}`);
	    });
	}
	/**
	 * Augment a struct to allow `undefined` values.
	 */
	function optional(struct) {
	    return new Struct({
	        ...struct,
	        validator: (value, ctx) => value === undefined || struct.validator(value, ctx),
	        refiner: (value, ctx) => value === undefined || struct.refiner(value, ctx),
	    });
	}
	/**
	 * Ensure that a value is an object with keys and values of specific types, but
	 * without ensuring any specific shape of properties.
	 *
	 * Like TypeScript's `Record` utility.
	 */
	function record(Key, Value) {
	    return new Struct({
	        type: 'record',
	        schema: null,
	        *entries(value) {
	            if (isObject(value)) {
	                for (const k in value) {
	                    const v = value[k];
	                    yield [k, k, Key];
	                    yield [k, v, Value];
	                }
	            }
	        },
	        validator(value) {
	            return (isNonArrayObject(value) ||
	                `Expected an object, but received: ${print(value)}`);
	        },
	        coercer(value) {
	            return isNonArrayObject(value) ? { ...value } : value;
	        },
	    });
	}
	/**
	 * Ensure that a value is a string.
	 */
	function string() {
	    return define('string', (value) => {
	        return (typeof value === 'string' ||
	            `Expected a string, but received: ${print(value)}`);
	    });
	}
	/**
	 * Ensure that a value is a tuple of a specific length, and that each of its
	 * elements is of a specific type.
	 */
	function tuple(Structs) {
	    const Never = never();
	    return new Struct({
	        type: 'tuple',
	        schema: null,
	        *entries(value) {
	            if (Array.isArray(value)) {
	                const length = Math.max(Structs.length, value.length);
	                for (let i = 0; i < length; i++) {
	                    yield [i, value[i], Structs[i] || Never];
	                }
	            }
	        },
	        validator(value) {
	            return (Array.isArray(value) ||
	                `Expected an array, but received: ${print(value)}`);
	        },
	        coercer(value) {
	            return Array.isArray(value) ? value.slice() : value;
	        },
	    });
	}
	/**
	 * Ensure that a value has a set of known properties of specific types.
	 *
	 * Note: Unrecognized properties are allowed and untouched. This is similar to
	 * how TypeScript's structural typing works.
	 */
	function type(schema) {
	    const keys = Object.keys(schema);
	    return new Struct({
	        type: 'type',
	        schema,
	        *entries(value) {
	            if (isObject(value)) {
	                for (const k of keys) {
	                    yield [k, value[k], schema[k]];
	                }
	            }
	        },
	        validator(value) {
	            return (isNonArrayObject(value) ||
	                `Expected an object, but received: ${print(value)}`);
	        },
	        coercer(value) {
	            return isNonArrayObject(value) ? { ...value } : value;
	        },
	    });
	}
	/**
	 * Ensure that a value matches one of a set of types.
	 */
	function union(Structs) {
	    const description = Structs.map((s) => s.type).join(' | ');
	    return new Struct({
	        type: 'union',
	        schema: null,
	        coercer(value, ctx) {
	            for (const S of Structs) {
	                const [error, coerced] = S.validate(value, {
	                    coerce: true,
	                    mask: ctx.mask,
	                });
	                if (!error) {
	                    return coerced;
	                }
	            }
	            return value;
	        },
	        validator(value, ctx) {
	            const failures = [];
	            for (const S of Structs) {
	                const [...tuples] = run(value, S, ctx);
	                const [first] = tuples;
	                if (!first[0]) {
	                    return [];
	                }
	                else {
	                    for (const [failure] of tuples) {
	                        if (failure) {
	                            failures.push(failure);
	                        }
	                    }
	                }
	            }
	            return [
	                `Expected the value to satisfy a union of \`${description}\`, but received: ${print(value)}`,
	                ...failures,
	            ];
	        },
	    });
	}
	/**
	 * Ensure that any value passes validation, without widening its type to `any`.
	 */
	function unknown() {
	    return define('unknown', () => true);
	}

	/**
	 * Augment a `Struct` to add an additional coercion step to its input.
	 *
	 * This allows you to transform input data before validating it, to increase the
	 * likelihood that it passes validation—for example for default values, parsing
	 * different formats, etc.
	 *
	 * Note: You must use `create(value, Struct)` on the value to have the coercion
	 * take effect! Using simply `assert()` or `is()` will not use coercion.
	 */
	function coerce(struct, condition, coercer) {
	    return new Struct({
	        ...struct,
	        coercer: (value, ctx) => {
	            return is(value, condition)
	                ? struct.coercer(coercer(value, ctx), ctx)
	                : struct.coercer(value, ctx);
	        },
	    });
	}

	// Unique ID creation requires a high quality random # generator. In the browser we therefore
	// require the crypto API and do not support built-in fallback to lower quality random number
	// generators (like Math.random()).
	var getRandomValues;
	var rnds8 = new Uint8Array(16);
	function rng() {
	  // lazy load so that environments that need to polyfill have a chance to do so
	  if (!getRandomValues) {
	    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
	    // find the complete implementation of crypto (msCrypto) on IE11.
	    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

	    if (!getRandomValues) {
	      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
	    }
	  }

	  return getRandomValues(rnds8);
	}

	var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

	function validate(uuid) {
	  return typeof uuid === 'string' && REGEX.test(uuid);
	}

	/**
	 * Convert array of 16 byte values to UUID string format of the form:
	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 */

	var byteToHex = [];

	for (var i = 0; i < 256; ++i) {
	  byteToHex.push((i + 0x100).toString(16).substr(1));
	}

	function stringify(arr) {
	  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	  // Note: Be careful editing this code!  It's been tuned for performance
	  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
	  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
	  // of the following:
	  // - One or more input array values don't map to a hex octet (leading to
	  // "undefined" in the uuid)
	  // - Invalid input values for the RFC `version` or `variant` fields

	  if (!validate(uuid)) {
	    throw TypeError('Stringified UUID is invalid');
	  }

	  return uuid;
	}

	//
	// Inspired by https://github.com/LiosK/UUID.js
	// and http://docs.python.org/library/uuid.html

	var _nodeId;

	var _clockseq; // Previous uuid creation time


	var _lastMSecs = 0;
	var _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

	function v1(options, buf, offset) {
	  var i = buf && offset || 0;
	  var b = buf || new Array(16);
	  options = options || {};
	  var node = options.node || _nodeId;
	  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
	  // specified.  We do this lazily to minimize issues related to insufficient
	  // system entropy.  See #189

	  if (node == null || clockseq == null) {
	    var seedBytes = options.random || (options.rng || rng)();

	    if (node == null) {
	      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
	      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
	    }

	    if (clockseq == null) {
	      // Per 4.2.2, randomize (14 bit) clockseq
	      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
	    }
	  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
	  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
	  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
	  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


	  var msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
	  // cycle to simulate higher resolution clock

	  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

	  var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

	  if (dt < 0 && options.clockseq === undefined) {
	    clockseq = clockseq + 1 & 0x3fff;
	  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
	  // time interval


	  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
	    nsecs = 0;
	  } // Per 4.2.1.2 Throw error if too many uuids are requested


	  if (nsecs >= 10000) {
	    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
	  }

	  _lastMSecs = msecs;
	  _lastNSecs = nsecs;
	  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

	  msecs += 12219292800000; // `time_low`

	  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
	  b[i++] = tl >>> 24 & 0xff;
	  b[i++] = tl >>> 16 & 0xff;
	  b[i++] = tl >>> 8 & 0xff;
	  b[i++] = tl & 0xff; // `time_mid`

	  var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
	  b[i++] = tmh >>> 8 & 0xff;
	  b[i++] = tmh & 0xff; // `time_high_and_version`

	  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

	  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

	  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

	  b[i++] = clockseq & 0xff; // `node`

	  for (var n = 0; n < 6; ++n) {
	    b[i + n] = node[n];
	  }

	  return buf || stringify(b);
	}

	function parse(uuid) {
	  if (!validate(uuid)) {
	    throw TypeError('Invalid UUID');
	  }

	  var v;
	  var arr = new Uint8Array(16); // Parse ########-....-....-....-............

	  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
	  arr[1] = v >>> 16 & 0xff;
	  arr[2] = v >>> 8 & 0xff;
	  arr[3] = v & 0xff; // Parse ........-####-....-....-............

	  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
	  arr[5] = v & 0xff; // Parse ........-....-####-....-............

	  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
	  arr[7] = v & 0xff; // Parse ........-....-....-####-............

	  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
	  arr[9] = v & 0xff; // Parse ........-....-....-....-############
	  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

	  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
	  arr[11] = v / 0x100000000 & 0xff;
	  arr[12] = v >>> 24 & 0xff;
	  arr[13] = v >>> 16 & 0xff;
	  arr[14] = v >>> 8 & 0xff;
	  arr[15] = v & 0xff;
	  return arr;
	}

	function stringToBytes(str) {
	  str = unescape(encodeURIComponent(str)); // UTF8 escape

	  var bytes = [];

	  for (var i = 0; i < str.length; ++i) {
	    bytes.push(str.charCodeAt(i));
	  }

	  return bytes;
	}

	var DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
	var URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
	function v35 (name, version, hashfunc) {
	  function generateUUID(value, namespace, buf, offset) {
	    if (typeof value === 'string') {
	      value = stringToBytes(value);
	    }

	    if (typeof namespace === 'string') {
	      namespace = parse(namespace);
	    }

	    if (namespace.length !== 16) {
	      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
	    } // Compute hash of namespace and value, Per 4.3
	    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
	    // hashfunc([...namespace, ... value])`


	    var bytes = new Uint8Array(16 + value.length);
	    bytes.set(namespace);
	    bytes.set(value, namespace.length);
	    bytes = hashfunc(bytes);
	    bytes[6] = bytes[6] & 0x0f | version;
	    bytes[8] = bytes[8] & 0x3f | 0x80;

	    if (buf) {
	      offset = offset || 0;

	      for (var i = 0; i < 16; ++i) {
	        buf[offset + i] = bytes[i];
	      }

	      return buf;
	    }

	    return stringify(bytes);
	  } // Function#name is not settable on some platforms (#270)


	  try {
	    generateUUID.name = name; // eslint-disable-next-line no-empty
	  } catch (err) {} // For CommonJS default export support


	  generateUUID.DNS = DNS;
	  generateUUID.URL = URL;
	  return generateUUID;
	}

	/*
	 * Browser-compatible JavaScript MD5
	 *
	 * Modification of JavaScript MD5
	 * https://github.com/blueimp/JavaScript-MD5
	 *
	 * Copyright 2011, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Licensed under the MIT license:
	 * https://opensource.org/licenses/MIT
	 *
	 * Based on
	 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
	 * Digest Algorithm, as defined in RFC 1321.
	 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for more info.
	 */
	function md5(bytes) {
	  if (typeof bytes === 'string') {
	    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

	    bytes = new Uint8Array(msg.length);

	    for (var i = 0; i < msg.length; ++i) {
	      bytes[i] = msg.charCodeAt(i);
	    }
	  }

	  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
	}
	/*
	 * Convert an array of little-endian words to an array of bytes
	 */


	function md5ToHexEncodedArray(input) {
	  var output = [];
	  var length32 = input.length * 32;
	  var hexTab = '0123456789abcdef';

	  for (var i = 0; i < length32; i += 8) {
	    var x = input[i >> 5] >>> i % 32 & 0xff;
	    var hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
	    output.push(hex);
	  }

	  return output;
	}
	/**
	 * Calculate output length with padding and bit length
	 */


	function getOutputLength(inputLength8) {
	  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
	}
	/*
	 * Calculate the MD5 of an array of little-endian words, and a bit length.
	 */


	function wordsToMd5(x, len) {
	  /* append padding */
	  x[len >> 5] |= 0x80 << len % 32;
	  x[getOutputLength(len) - 1] = len;
	  var a = 1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d = 271733878;

	  for (var i = 0; i < x.length; i += 16) {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;
	    a = md5ff(a, b, c, d, x[i], 7, -680876936);
	    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
	    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
	    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
	    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
	    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
	    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
	    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
	    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
	    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
	    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
	    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
	    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
	    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
	    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
	    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
	    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
	    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
	    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
	    b = md5gg(b, c, d, a, x[i], 20, -373897302);
	    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
	    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
	    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
	    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
	    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
	    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
	    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
	    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
	    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
	    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
	    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
	    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
	    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
	    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
	    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
	    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
	    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
	    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
	    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
	    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
	    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
	    d = md5hh(d, a, b, c, x[i], 11, -358537222);
	    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
	    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
	    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
	    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
	    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
	    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
	    a = md5ii(a, b, c, d, x[i], 6, -198630844);
	    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
	    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
	    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
	    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
	    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
	    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
	    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
	    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
	    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
	    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
	    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
	    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
	    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
	    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
	    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
	    a = safeAdd(a, olda);
	    b = safeAdd(b, oldb);
	    c = safeAdd(c, oldc);
	    d = safeAdd(d, oldd);
	  }

	  return [a, b, c, d];
	}
	/*
	 * Convert an array bytes to an array of little-endian words
	 * Characters >255 have their high-byte silently ignored.
	 */


	function bytesToWords(input) {
	  if (input.length === 0) {
	    return [];
	  }

	  var length8 = input.length * 8;
	  var output = new Uint32Array(getOutputLength(length8));

	  for (var i = 0; i < length8; i += 8) {
	    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
	  }

	  return output;
	}
	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 */


	function safeAdd(x, y) {
	  var lsw = (x & 0xffff) + (y & 0xffff);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return msw << 16 | lsw & 0xffff;
	}
	/*
	 * Bitwise rotate a 32-bit number to the left.
	 */


	function bitRotateLeft(num, cnt) {
	  return num << cnt | num >>> 32 - cnt;
	}
	/*
	 * These functions implement the four basic operations the algorithm uses.
	 */


	function md5cmn(q, a, b, x, s, t) {
	  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
	}

	function md5ff(a, b, c, d, x, s, t) {
	  return md5cmn(b & c | ~b & d, a, b, x, s, t);
	}

	function md5gg(a, b, c, d, x, s, t) {
	  return md5cmn(b & d | c & ~d, a, b, x, s, t);
	}

	function md5hh(a, b, c, d, x, s, t) {
	  return md5cmn(b ^ c ^ d, a, b, x, s, t);
	}

	function md5ii(a, b, c, d, x, s, t) {
	  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
	}

	var v3 = v35('v3', 0x30, md5);

	function v4(options, buf, offset) {
	  options = options || {};
	  var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

	  rnds[6] = rnds[6] & 0x0f | 0x40;
	  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

	  if (buf) {
	    offset = offset || 0;

	    for (var i = 0; i < 16; ++i) {
	      buf[offset + i] = rnds[i];
	    }

	    return buf;
	  }

	  return stringify(rnds);
	}

	// Adapted from Chris Veness' SHA1 code at
	// http://www.movable-type.co.uk/scripts/sha1.html
	function f(s, x, y, z) {
	  switch (s) {
	    case 0:
	      return x & y ^ ~x & z;

	    case 1:
	      return x ^ y ^ z;

	    case 2:
	      return x & y ^ x & z ^ y & z;

	    case 3:
	      return x ^ y ^ z;
	  }
	}

	function ROTL(x, n) {
	  return x << n | x >>> 32 - n;
	}

	function sha1(bytes) {
	  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
	  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

	  if (typeof bytes === 'string') {
	    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

	    bytes = [];

	    for (var i = 0; i < msg.length; ++i) {
	      bytes.push(msg.charCodeAt(i));
	    }
	  } else if (!Array.isArray(bytes)) {
	    // Convert Array-like to Array
	    bytes = Array.prototype.slice.call(bytes);
	  }

	  bytes.push(0x80);
	  var l = bytes.length / 4 + 2;
	  var N = Math.ceil(l / 16);
	  var M = new Array(N);

	  for (var _i = 0; _i < N; ++_i) {
	    var arr = new Uint32Array(16);

	    for (var j = 0; j < 16; ++j) {
	      arr[j] = bytes[_i * 64 + j * 4] << 24 | bytes[_i * 64 + j * 4 + 1] << 16 | bytes[_i * 64 + j * 4 + 2] << 8 | bytes[_i * 64 + j * 4 + 3];
	    }

	    M[_i] = arr;
	  }

	  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
	  M[N - 1][14] = Math.floor(M[N - 1][14]);
	  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

	  for (var _i2 = 0; _i2 < N; ++_i2) {
	    var W = new Uint32Array(80);

	    for (var t = 0; t < 16; ++t) {
	      W[t] = M[_i2][t];
	    }

	    for (var _t = 16; _t < 80; ++_t) {
	      W[_t] = ROTL(W[_t - 3] ^ W[_t - 8] ^ W[_t - 14] ^ W[_t - 16], 1);
	    }

	    var a = H[0];
	    var b = H[1];
	    var c = H[2];
	    var d = H[3];
	    var e = H[4];

	    for (var _t2 = 0; _t2 < 80; ++_t2) {
	      var s = Math.floor(_t2 / 20);
	      var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[_t2] >>> 0;
	      e = d;
	      d = c;
	      c = ROTL(b, 30) >>> 0;
	      b = a;
	      a = T;
	    }

	    H[0] = H[0] + a >>> 0;
	    H[1] = H[1] + b >>> 0;
	    H[2] = H[2] + c >>> 0;
	    H[3] = H[3] + d >>> 0;
	    H[4] = H[4] + e >>> 0;
	  }

	  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
	}

	var v5 = v35('v5', 0x50, sha1);

	var nil = '00000000-0000-0000-0000-000000000000';

	function version(uuid) {
	  if (!validate(uuid)) {
	    throw TypeError('Invalid UUID');
	  }

	  return parseInt(uuid.substr(14, 1), 16);
	}

	var esmBrowser = /*#__PURE__*/Object.freeze({
		__proto__: null,
		NIL: nil,
		parse: parse,
		stringify: stringify,
		v1: v1,
		v3: v3,
		v4: v4,
		v5: v5,
		validate: validate,
		version: version
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(esmBrowser);

	var generateRequest_1;
	var hasRequiredGenerateRequest;

	function requireGenerateRequest () {
		if (hasRequiredGenerateRequest) return generateRequest_1;
		hasRequiredGenerateRequest = 1;

		const uuid = require$$0.v4;

		/**
		 *  Generates a JSON-RPC 1.0 or 2.0 request
		 *  @param {String} method Name of method to call
		 *  @param {Array|Object} params Array of parameters passed to the method as specified, or an object of parameter names and corresponding value
		 *  @param {String|Number|null} [id] Request ID can be a string, number, null for explicit notification or left out for automatic generation
		 *  @param {Object} [options]
		 *  @param {Number} [options.version=2] JSON-RPC version to use (1 or 2)
		 *  @param {Boolean} [options.notificationIdNull=false] When true, version 2 requests will set id to null instead of omitting it
		 *  @param {Function} [options.generator] Passed the request, and the options object and is expected to return a request ID
		 *  @throws {TypeError} If any of the parameters are invalid
		 *  @return {Object} A JSON-RPC 1.0 or 2.0 request
		 *  @memberOf Utils
		 */
		const generateRequest = function(method, params, id, options) {
		  if(typeof method !== 'string') {
		    throw new TypeError(method + ' must be a string');
		  }

		  options = options || {};

		  // check valid version provided
		  const version = typeof options.version === 'number' ? options.version : 2;
		  if (version !== 1 && version !== 2) {
		    throw new TypeError(version + ' must be 1 or 2');
		  }

		  const request = {
		    method: method
		  };

		  if(version === 2) {
		    request.jsonrpc = '2.0';
		  }

		  if(params) {
		    // params given, but invalid?
		    if(typeof params !== 'object' && !Array.isArray(params)) {
		      throw new TypeError(params + ' must be an object, array or omitted');
		    }
		    request.params = params;
		  }

		  // if id was left out, generate one (null means explicit notification)
		  if(typeof(id) === 'undefined') {
		    const generator = typeof options.generator === 'function' ? options.generator : function() { return uuid(); };
		    request.id = generator(request, options);
		  } else if (version === 2 && id === null) {
		    // we have a version 2 notification
		    if (options.notificationIdNull) {
		      request.id = null; // id will not be set at all unless option provided
		    }
		  } else {
		    request.id = id;
		  }

		  return request;
		};

		generateRequest_1 = generateRequest;
		return generateRequest_1;
	}

	var browser;
	var hasRequiredBrowser;

	function requireBrowser () {
		if (hasRequiredBrowser) return browser;
		hasRequiredBrowser = 1;

		const uuid = require$$0.v4;
		const generateRequest = /*@__PURE__*/ requireGenerateRequest();

		/**
		 * Constructor for a Jayson Browser Client that does not depend any node.js core libraries
		 * @class ClientBrowser
		 * @param {Function} callServer Method that calls the server, receives the stringified request and a regular node-style callback
		 * @param {Object} [options]
		 * @param {Function} [options.reviver] Reviver function for JSON
		 * @param {Function} [options.replacer] Replacer function for JSON
		 * @param {Number} [options.version=2] JSON-RPC version to use (1|2)
		 * @param {Function} [options.generator] Function to use for generating request IDs
		 *  @param {Boolean} [options.notificationIdNull=false] When true, version 2 requests will set id to null instead of omitting it
		 * @return {ClientBrowser}
		 */
		const ClientBrowser = function(callServer, options) {
		  if(!(this instanceof ClientBrowser)) {
		    return new ClientBrowser(callServer, options);
		  }

		  if (!options) {
		    options = {};
		  }

		  this.options = {
		    reviver: typeof options.reviver !== 'undefined' ? options.reviver : null,
		    replacer: typeof options.replacer !== 'undefined' ? options.replacer : null,
		    generator: typeof options.generator !== 'undefined' ? options.generator : function() { return uuid(); },
		    version: typeof options.version !== 'undefined' ? options.version : 2,
		    notificationIdNull: typeof options.notificationIdNull === 'boolean' ? options.notificationIdNull : false,
		  };

		  this.callServer = callServer;
		};

		browser = ClientBrowser;

		/**
		 *  Creates a request and dispatches it if given a callback.
		 *  @param {String|Array} method A batch request if passed an Array, or a method name if passed a String
		 *  @param {Array|Object} [params] Parameters for the method
		 *  @param {String|Number} [id] Optional id. If undefined an id will be generated. If null it creates a notification request
		 *  @param {Function} [callback] Request callback. If specified, executes the request rather than only returning it.
		 *  @throws {TypeError} Invalid parameters
		 *  @return {Object} JSON-RPC 1.0 or 2.0 compatible request
		 */
		ClientBrowser.prototype.request = function(method, params, id, callback) {
		  const self = this;
		  let request = null;

		  // is this a batch request?
		  const isBatch = Array.isArray(method) && typeof params === 'function';

		  if (this.options.version === 1 && isBatch) {
		    throw new TypeError('JSON-RPC 1.0 does not support batching');
		  }

		  // is this a raw request?
		  const isRaw = !isBatch && method && typeof method === 'object' && typeof params === 'function';

		  if(isBatch || isRaw) {
		    callback = params;
		    request = method;
		  } else {
		    if(typeof id === 'function') {
		      callback = id;
		      // specifically undefined because "null" is a notification request
		      id = undefined;
		    }

		    const hasCallback = typeof callback === 'function';

		    try {
		      request = generateRequest(method, params, id, {
		        generator: this.options.generator,
		        version: this.options.version,
		        notificationIdNull: this.options.notificationIdNull,
		      });
		    } catch(err) {
		      if(hasCallback) {
		        return callback(err);
		      }
		      throw err;
		    }

		    // no callback means we should just return a raw request
		    if(!hasCallback) {
		      return request;
		    }

		  }

		  let message;
		  try {
		    message = JSON.stringify(request, this.options.replacer);
		  } catch(err) {
		    return callback(err);
		  }

		  this.callServer(message, function(err, response) {
		    self._parseResponse(err, response, callback);
		  });

		  // always return the raw request
		  return request;
		};

		/**
		 * Parses a response from a server
		 * @param {Object} err Error to pass on that is unrelated to the actual response
		 * @param {String} responseText JSON-RPC 1.0 or 2.0 response
		 * @param {Function} callback Callback that will receive different arguments depending on the amount of parameters
		 * @private
		 */
		ClientBrowser.prototype._parseResponse = function(err, responseText, callback) {
		  if(err) {
		    callback(err);
		    return;
		  }

		  if(!responseText) {
		    // empty response text, assume that is correct because it could be a
		    // notification which jayson does not give any body for
		    return callback();
		  }

		  let response;
		  try {
		    response = JSON.parse(responseText, this.options.reviver);
		  } catch(err) {
		    return callback(err);
		  }

		  if(callback.length === 3) {
		    // if callback length is 3, we split callback arguments on error and response

		    // is batch response?
		    if(Array.isArray(response)) {

		      // neccesary to split strictly on validity according to spec here
		      const isError = function(res) {
		        return typeof res.error !== 'undefined';
		      };

		      const isNotError = function (res) {
		        return !isError(res);
		      };

		      return callback(null, response.filter(isError), response.filter(isNotError));
		    
		    } else {

		      // split regardless of validity
		      return callback(null, response.error, response.result);
		    
		    }
		  
		  }

		  callback(null, response);
		};
		return browser;
	}

	var browserExports = /*@__PURE__*/ requireBrowser();
	var RpcClient = /*@__PURE__*/getDefaultExportFromCjs(browserExports);

	const MINIMUM_SLOT_PER_EPOCH = 32;

	// Returns the number of trailing zeros in the binary representation of self.
	function trailingZeros(n) {
	  let trailingZeros = 0;
	  while (n > 1) {
	    n /= 2;
	    trailingZeros++;
	  }
	  return trailingZeros;
	}

	// Returns the smallest power of two greater than or equal to n
	function nextPowerOfTwo(n) {
	  if (n === 0) return 1;
	  n--;
	  n |= n >> 1;
	  n |= n >> 2;
	  n |= n >> 4;
	  n |= n >> 8;
	  n |= n >> 16;
	  n |= n >> 32;
	  return n + 1;
	}

	/**
	 * Epoch schedule
	 * (see https://docs.solana.com/terminology#epoch)
	 * Can be retrieved with the {@link Connection.getEpochSchedule} method
	 */
	class EpochSchedule {
	  constructor(slotsPerEpoch, leaderScheduleSlotOffset, warmup, firstNormalEpoch, firstNormalSlot) {
	    /** The maximum number of slots in each epoch */
	    this.slotsPerEpoch = void 0;
	    /** The number of slots before beginning of an epoch to calculate a leader schedule for that epoch */
	    this.leaderScheduleSlotOffset = void 0;
	    /** Indicates whether epochs start short and grow */
	    this.warmup = void 0;
	    /** The first epoch with `slotsPerEpoch` slots */
	    this.firstNormalEpoch = void 0;
	    /** The first slot of `firstNormalEpoch` */
	    this.firstNormalSlot = void 0;
	    this.slotsPerEpoch = slotsPerEpoch;
	    this.leaderScheduleSlotOffset = leaderScheduleSlotOffset;
	    this.warmup = warmup;
	    this.firstNormalEpoch = firstNormalEpoch;
	    this.firstNormalSlot = firstNormalSlot;
	  }
	  getEpoch(slot) {
	    return this.getEpochAndSlotIndex(slot)[0];
	  }
	  getEpochAndSlotIndex(slot) {
	    if (slot < this.firstNormalSlot) {
	      const epoch = trailingZeros(nextPowerOfTwo(slot + MINIMUM_SLOT_PER_EPOCH + 1)) - trailingZeros(MINIMUM_SLOT_PER_EPOCH) - 1;
	      const epochLen = this.getSlotsInEpoch(epoch);
	      const slotIndex = slot - (epochLen - MINIMUM_SLOT_PER_EPOCH);
	      return [epoch, slotIndex];
	    } else {
	      const normalSlotIndex = slot - this.firstNormalSlot;
	      const normalEpochIndex = Math.floor(normalSlotIndex / this.slotsPerEpoch);
	      const epoch = this.firstNormalEpoch + normalEpochIndex;
	      const slotIndex = normalSlotIndex % this.slotsPerEpoch;
	      return [epoch, slotIndex];
	    }
	  }
	  getFirstSlotInEpoch(epoch) {
	    if (epoch <= this.firstNormalEpoch) {
	      return (Math.pow(2, epoch) - 1) * MINIMUM_SLOT_PER_EPOCH;
	    } else {
	      return (epoch - this.firstNormalEpoch) * this.slotsPerEpoch + this.firstNormalSlot;
	    }
	  }
	  getLastSlotInEpoch(epoch) {
	    return this.getFirstSlotInEpoch(epoch) + this.getSlotsInEpoch(epoch) - 1;
	  }
	  getSlotsInEpoch(epoch) {
	    if (epoch < this.firstNormalEpoch) {
	      return Math.pow(2, epoch + trailingZeros(MINIMUM_SLOT_PER_EPOCH));
	    } else {
	      return this.slotsPerEpoch;
	    }
	  }
	}

	var fetchImpl = globalThis.fetch;

	var eventemitter3 = {exports: {}};

	var hasRequiredEventemitter3;

	function requireEventemitter3 () {
		if (hasRequiredEventemitter3) return eventemitter3.exports;
		hasRequiredEventemitter3 = 1;
		(function (module) {

			var has = Object.prototype.hasOwnProperty
			  , prefix = '~';

			/**
			 * Constructor to create a storage for our `EE` objects.
			 * An `Events` instance is a plain object whose properties are event names.
			 *
			 * @constructor
			 * @private
			 */
			function Events() {}

			//
			// We try to not inherit from `Object.prototype`. In some engines creating an
			// instance in this way is faster than calling `Object.create(null)` directly.
			// If `Object.create(null)` is not supported we prefix the event names with a
			// character to make sure that the built-in object properties are not
			// overridden or used as an attack vector.
			//
			if (Object.create) {
			  Events.prototype = Object.create(null);

			  //
			  // This hack is needed because the `__proto__` property is still inherited in
			  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
			  //
			  if (!new Events().__proto__) prefix = false;
			}

			/**
			 * Representation of a single event listener.
			 *
			 * @param {Function} fn The listener function.
			 * @param {*} context The context to invoke the listener with.
			 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
			 * @constructor
			 * @private
			 */
			function EE(fn, context, once) {
			  this.fn = fn;
			  this.context = context;
			  this.once = once || false;
			}

			/**
			 * Add a listener for a given event.
			 *
			 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn The listener function.
			 * @param {*} context The context to invoke the listener with.
			 * @param {Boolean} once Specify if the listener is a one-time listener.
			 * @returns {EventEmitter}
			 * @private
			 */
			function addListener(emitter, event, fn, context, once) {
			  if (typeof fn !== 'function') {
			    throw new TypeError('The listener must be a function');
			  }

			  var listener = new EE(fn, context || emitter, once)
			    , evt = prefix ? prefix + event : event;

			  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
			  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
			  else emitter._events[evt] = [emitter._events[evt], listener];

			  return emitter;
			}

			/**
			 * Clear event by name.
			 *
			 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
			 * @param {(String|Symbol)} evt The Event name.
			 * @private
			 */
			function clearEvent(emitter, evt) {
			  if (--emitter._eventsCount === 0) emitter._events = new Events();
			  else delete emitter._events[evt];
			}

			/**
			 * Minimal `EventEmitter` interface that is molded against the Node.js
			 * `EventEmitter` interface.
			 *
			 * @constructor
			 * @public
			 */
			function EventEmitter() {
			  this._events = new Events();
			  this._eventsCount = 0;
			}

			/**
			 * Return an array listing the events for which the emitter has registered
			 * listeners.
			 *
			 * @returns {Array}
			 * @public
			 */
			EventEmitter.prototype.eventNames = function eventNames() {
			  var names = []
			    , events
			    , name;

			  if (this._eventsCount === 0) return names;

			  for (name in (events = this._events)) {
			    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
			  }

			  if (Object.getOwnPropertySymbols) {
			    return names.concat(Object.getOwnPropertySymbols(events));
			  }

			  return names;
			};

			/**
			 * Return the listeners registered for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @returns {Array} The registered listeners.
			 * @public
			 */
			EventEmitter.prototype.listeners = function listeners(event) {
			  var evt = prefix ? prefix + event : event
			    , handlers = this._events[evt];

			  if (!handlers) return [];
			  if (handlers.fn) return [handlers.fn];

			  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
			    ee[i] = handlers[i].fn;
			  }

			  return ee;
			};

			/**
			 * Return the number of listeners listening to a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @returns {Number} The number of listeners.
			 * @public
			 */
			EventEmitter.prototype.listenerCount = function listenerCount(event) {
			  var evt = prefix ? prefix + event : event
			    , listeners = this._events[evt];

			  if (!listeners) return 0;
			  if (listeners.fn) return 1;
			  return listeners.length;
			};

			/**
			 * Calls each of the listeners registered for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @returns {Boolean} `true` if the event had listeners, else `false`.
			 * @public
			 */
			EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
			  var evt = prefix ? prefix + event : event;

			  if (!this._events[evt]) return false;

			  var listeners = this._events[evt]
			    , len = arguments.length
			    , args
			    , i;

			  if (listeners.fn) {
			    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

			    switch (len) {
			      case 1: return listeners.fn.call(listeners.context), true;
			      case 2: return listeners.fn.call(listeners.context, a1), true;
			      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
			      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
			      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
			      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
			    }

			    for (i = 1, args = new Array(len -1); i < len; i++) {
			      args[i - 1] = arguments[i];
			    }

			    listeners.fn.apply(listeners.context, args);
			  } else {
			    var length = listeners.length
			      , j;

			    for (i = 0; i < length; i++) {
			      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

			      switch (len) {
			        case 1: listeners[i].fn.call(listeners[i].context); break;
			        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
			        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
			        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
			        default:
			          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
			            args[j - 1] = arguments[j];
			          }

			          listeners[i].fn.apply(listeners[i].context, args);
			      }
			    }
			  }

			  return true;
			};

			/**
			 * Add a listener for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn The listener function.
			 * @param {*} [context=this] The context to invoke the listener with.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.on = function on(event, fn, context) {
			  return addListener(this, event, fn, context, false);
			};

			/**
			 * Add a one-time listener for a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn The listener function.
			 * @param {*} [context=this] The context to invoke the listener with.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.once = function once(event, fn, context) {
			  return addListener(this, event, fn, context, true);
			};

			/**
			 * Remove the listeners of a given event.
			 *
			 * @param {(String|Symbol)} event The event name.
			 * @param {Function} fn Only remove the listeners that match this function.
			 * @param {*} context Only remove the listeners that have this context.
			 * @param {Boolean} once Only remove one-time listeners.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
			  var evt = prefix ? prefix + event : event;

			  if (!this._events[evt]) return this;
			  if (!fn) {
			    clearEvent(this, evt);
			    return this;
			  }

			  var listeners = this._events[evt];

			  if (listeners.fn) {
			    if (
			      listeners.fn === fn &&
			      (!once || listeners.once) &&
			      (!context || listeners.context === context)
			    ) {
			      clearEvent(this, evt);
			    }
			  } else {
			    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
			      if (
			        listeners[i].fn !== fn ||
			        (once && !listeners[i].once) ||
			        (context && listeners[i].context !== context)
			      ) {
			        events.push(listeners[i]);
			      }
			    }

			    //
			    // Reset the array, or remove it completely if we have no more listeners.
			    //
			    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
			    else clearEvent(this, evt);
			  }

			  return this;
			};

			/**
			 * Remove all listeners, or those of the specified event.
			 *
			 * @param {(String|Symbol)} [event] The event name.
			 * @returns {EventEmitter} `this`.
			 * @public
			 */
			EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
			  var evt;

			  if (event) {
			    evt = prefix ? prefix + event : event;
			    if (this._events[evt]) clearEvent(this, evt);
			  } else {
			    this._events = new Events();
			    this._eventsCount = 0;
			  }

			  return this;
			};

			//
			// Alias methods names because people roll like that.
			//
			EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
			EventEmitter.prototype.addListener = EventEmitter.prototype.on;

			//
			// Expose the prefix.
			//
			EventEmitter.prefixed = prefix;

			//
			// Allow `EventEmitter` to be imported as module namespace.
			//
			EventEmitter.EventEmitter = EventEmitter;

			//
			// Expose the module.
			//
			{
			  module.exports = EventEmitter;
			} 
		} (eventemitter3));
		return eventemitter3.exports;
	}

	var eventemitter3Exports = /*@__PURE__*/ requireEventemitter3();
	var EventEmitter = /*@__PURE__*/getDefaultExportFromCjs(eventemitter3Exports);

	// node_modules/esbuild-plugin-polyfill-node/polyfills/buffer.js
	var WebSocketBrowserImpl = class extends EventEmitter {
	  socket;
	  /** Instantiate a WebSocket class
	  * @constructor
	  * @param {String} address - url to a websocket server
	  * @param {(Object)} options - websocket options
	  * @param {(String|Array)} protocols - a list of protocols
	  * @return {WebSocketBrowserImpl} - returns a WebSocket instance
	  */
	  constructor(address, options, protocols) {
	    super();
	    this.socket = new window.WebSocket(address, protocols);
	    this.socket.onopen = () => this.emit("open");
	    this.socket.onmessage = (event) => this.emit("message", event.data);
	    this.socket.onerror = (error) => this.emit("error", error);
	    this.socket.onclose = (event) => {
	      this.emit("close", event.code, event.reason);
	    };
	  }
	  /**
	  * Sends data through a websocket connection
	  * @method
	  * @param {(String|Object)} data - data to be sent via websocket
	  * @param {Object} optionsOrCallback - ws options
	  * @param {Function} callback - a callback called once the data is sent
	  * @return {Undefined}
	  */
	  send(data, optionsOrCallback, callback) {
	    const cb = callback || optionsOrCallback;
	    try {
	      this.socket.send(data);
	      cb();
	    } catch (error) {
	      cb(error);
	    }
	  }
	  /**
	  * Closes an underlying socket
	  * @method
	  * @param {Number} code - status code explaining why the connection is being closed
	  * @param {String} reason - a description why the connection is closing
	  * @return {Undefined}
	  * @throws {Error}
	  */
	  close(code, reason) {
	    this.socket.close(code, reason);
	  }
	  addEventListener(type, listener, options) {
	    this.socket.addEventListener(type, listener, options);
	  }
	};
	function WebSocket(address, options) {
	  return new WebSocketBrowserImpl(address, options);
	}

	// src/lib/utils.ts
	var DefaultDataPack = class {
	  encode(value) {
	    return JSON.stringify(value);
	  }
	  decode(value) {
	    return JSON.parse(value);
	  }
	};

	// src/lib/client.ts
	var CommonClient = class extends EventEmitter {
	  address;
	  rpc_id;
	  queue;
	  options;
	  autoconnect;
	  ready;
	  reconnect;
	  reconnect_timer_id;
	  reconnect_interval;
	  max_reconnects;
	  rest_options;
	  current_reconnects;
	  generate_request_id;
	  socket;
	  webSocketFactory;
	  dataPack;
	  /**
	  * Instantiate a Client class.
	  * @constructor
	  * @param {webSocketFactory} webSocketFactory - factory method for WebSocket
	  * @param {String} address - url to a websocket server
	  * @param {Object} options - ws options object with reconnect parameters
	  * @param {Function} generate_request_id - custom generation request Id
	  * @param {DataPack} dataPack - data pack contains encoder and decoder
	  * @return {CommonClient}
	  */
	  constructor(webSocketFactory, address = "ws://localhost:8080", {
	    autoconnect = true,
	    reconnect = true,
	    reconnect_interval = 1e3,
	    max_reconnects = 5,
	    ...rest_options
	  } = {}, generate_request_id, dataPack) {
	    super();
	    this.webSocketFactory = webSocketFactory;
	    this.queue = {};
	    this.rpc_id = 0;
	    this.address = address;
	    this.autoconnect = autoconnect;
	    this.ready = false;
	    this.reconnect = reconnect;
	    this.reconnect_timer_id = void 0;
	    this.reconnect_interval = reconnect_interval;
	    this.max_reconnects = max_reconnects;
	    this.rest_options = rest_options;
	    this.current_reconnects = 0;
	    this.generate_request_id = generate_request_id || (() => ++this.rpc_id);
	    if (!dataPack) this.dataPack = new DefaultDataPack();
	    else this.dataPack = dataPack;
	    if (this.autoconnect)
	      this._connect(this.address, {
	        autoconnect: this.autoconnect,
	        reconnect: this.reconnect,
	        reconnect_interval: this.reconnect_interval,
	        max_reconnects: this.max_reconnects,
	        ...this.rest_options
	      });
	  }
	  /**
	  * Connects to a defined server if not connected already.
	  * @method
	  * @return {Undefined}
	  */
	  connect() {
	    if (this.socket) return;
	    this._connect(this.address, {
	      autoconnect: this.autoconnect,
	      reconnect: this.reconnect,
	      reconnect_interval: this.reconnect_interval,
	      max_reconnects: this.max_reconnects,
	      ...this.rest_options
	    });
	  }
	  /**
	  * Calls a registered RPC method on server.
	  * @method
	  * @param {String} method - RPC method name
	  * @param {Object|Array} params - optional method parameters
	  * @param {Number} timeout - RPC reply timeout value
	  * @param {Object} ws_opts - options passed to ws
	  * @return {Promise}
	  */
	  call(method, params, timeout, ws_opts) {
	    if (!ws_opts && "object" === typeof timeout) {
	      ws_opts = timeout;
	      timeout = null;
	    }
	    return new Promise((resolve, reject) => {
	      if (!this.ready) return reject(new Error("socket not ready"));
	      const rpc_id = this.generate_request_id(method, params);
	      const message = {
	        jsonrpc: "2.0",
	        method,
	        params: params || void 0,
	        id: rpc_id
	      };
	      this.socket.send(this.dataPack.encode(message), ws_opts, (error) => {
	        if (error) return reject(error);
	        this.queue[rpc_id] = { promise: [resolve, reject] };
	        if (timeout) {
	          this.queue[rpc_id].timeout = setTimeout(() => {
	            delete this.queue[rpc_id];
	            reject(new Error("reply timeout"));
	          }, timeout);
	        }
	      });
	    });
	  }
	  /**
	  * Logins with the other side of the connection.
	  * @method
	  * @param {Object} params - Login credentials object
	  * @return {Promise}
	  */
	  async login(params) {
	    const resp = await this.call("rpc.login", params);
	    if (!resp) throw new Error("authentication failed");
	    return resp;
	  }
	  /**
	  * Fetches a list of client's methods registered on server.
	  * @method
	  * @return {Array}
	  */
	  async listMethods() {
	    return await this.call("__listMethods");
	  }
	  /**
	  * Sends a JSON-RPC 2.0 notification to server.
	  * @method
	  * @param {String} method - RPC method name
	  * @param {Object} params - optional method parameters
	  * @return {Promise}
	  */
	  notify(method, params) {
	    return new Promise((resolve, reject) => {
	      if (!this.ready) return reject(new Error("socket not ready"));
	      const message = {
	        jsonrpc: "2.0",
	        method,
	        params
	      };
	      this.socket.send(this.dataPack.encode(message), (error) => {
	        if (error) return reject(error);
	        resolve();
	      });
	    });
	  }
	  /**
	  * Subscribes for a defined event.
	  * @method
	  * @param {String|Array} event - event name
	  * @return {Undefined}
	  * @throws {Error}
	  */
	  async subscribe(event) {
	    if (typeof event === "string") event = [event];
	    const result = await this.call("rpc.on", event);
	    if (typeof event === "string" && result[event] !== "ok")
	      throw new Error(
	        "Failed subscribing to an event '" + event + "' with: " + result[event]
	      );
	    return result;
	  }
	  /**
	  * Unsubscribes from a defined event.
	  * @method
	  * @param {String|Array} event - event name
	  * @return {Undefined}
	  * @throws {Error}
	  */
	  async unsubscribe(event) {
	    if (typeof event === "string") event = [event];
	    const result = await this.call("rpc.off", event);
	    if (typeof event === "string" && result[event] !== "ok")
	      throw new Error("Failed unsubscribing from an event with: " + result);
	    return result;
	  }
	  /**
	  * Closes a WebSocket connection gracefully.
	  * @method
	  * @param {Number} code - socket close code
	  * @param {String} data - optional data to be sent before closing
	  * @return {Undefined}
	  */
	  close(code, data) {
	    this.socket.close(code || 1e3, data);
	  }
	  /**
	  * Enable / disable automatic reconnection.
	  * @method
	  * @param {Boolean} reconnect - enable / disable reconnection
	  * @return {Undefined}
	  */
	  setAutoReconnect(reconnect) {
	    this.reconnect = reconnect;
	  }
	  /**
	  * Set the interval between reconnection attempts.
	  * @method
	  * @param {Number} interval - reconnection interval in milliseconds
	  * @return {Undefined}
	  */
	  setReconnectInterval(interval) {
	    this.reconnect_interval = interval;
	  }
	  /**
	  * Set the maximum number of reconnection attempts.
	  * @method
	  * @param {Number} max_reconnects - maximum reconnection attempts
	  * @return {Undefined}
	  */
	  setMaxReconnects(max_reconnects) {
	    this.max_reconnects = max_reconnects;
	  }
	  /**
	  * Connection/Message handler.
	  * @method
	  * @private
	  * @param {String} address - WebSocket API address
	  * @param {Object} options - ws options object
	  * @return {Undefined}
	  */
	  _connect(address, options) {
	    clearTimeout(this.reconnect_timer_id);
	    this.socket = this.webSocketFactory(address, options);
	    this.socket.addEventListener("open", () => {
	      this.ready = true;
	      this.emit("open");
	      this.current_reconnects = 0;
	    });
	    this.socket.addEventListener("message", ({ data: message }) => {
	      if (message instanceof ArrayBuffer)
	        message = bufferExports.Buffer.from(message).toString();
	      try {
	        message = this.dataPack.decode(message);
	      } catch (error) {
	        return;
	      }
	      if (message.notification && this.listeners(message.notification).length) {
	        if (!Object.keys(message.params).length)
	          return this.emit(message.notification);
	        const args = [message.notification];
	        if (message.params.constructor === Object) args.push(message.params);
	        else
	          for (let i = 0; i < message.params.length; i++)
	            args.push(message.params[i]);
	        return Promise.resolve().then(() => {
	          this.emit.apply(this, args);
	        });
	      }
	      if (!this.queue[message.id]) {
	        if (message.method) {
	          return Promise.resolve().then(() => {
	            this.emit(message.method, message?.params);
	          });
	        }
	        return;
	      }
	      if ("error" in message === "result" in message)
	        this.queue[message.id].promise[1](
	          new Error(
	            'Server response malformed. Response must include either "result" or "error", but not both.'
	          )
	        );
	      if (this.queue[message.id].timeout)
	        clearTimeout(this.queue[message.id].timeout);
	      if (message.error) this.queue[message.id].promise[1](message.error);
	      else this.queue[message.id].promise[0](message.result);
	      delete this.queue[message.id];
	    });
	    this.socket.addEventListener("error", (error) => this.emit("error", error));
	    this.socket.addEventListener("close", ({ code, reason }) => {
	      if (this.ready)
	        setTimeout(() => this.emit("close", code, reason), 0);
	      this.ready = false;
	      this.socket = void 0;
	      if (code === 1e3) return;
	      this.current_reconnects++;
	      if (this.reconnect && (this.max_reconnects > this.current_reconnects || this.max_reconnects === 0))
	        this.reconnect_timer_id = setTimeout(
	          () => this._connect(address, options),
	          this.reconnect_interval
	        );
	    });
	  }
	};

	class RpcWebSocketClient extends CommonClient {
	  constructor(address, options, generate_request_id) {
	    const webSocketFactory = url => {
	      const rpc = WebSocket(url, {
	        autoconnect: true,
	        max_reconnects: 5,
	        reconnect: true,
	        reconnect_interval: 1000,
	        ...options
	      });
	      if ('socket' in rpc) {
	        this.underlyingSocket = rpc.socket;
	      } else {
	        this.underlyingSocket = rpc;
	      }
	      return rpc;
	    };
	    super(webSocketFactory, address, options, generate_request_id);
	    this.underlyingSocket = void 0;
	  }
	  call(...args) {
	    const readyState = this.underlyingSocket?.readyState;
	    if (readyState === 1 /* WebSocket.OPEN */) {
	      return super.call(...args);
	    }
	    return Promise.reject(new Error('Tried to call a JSON-RPC method `' + args[0] + '` but the socket was not `CONNECTING` or `OPEN` (`readyState` was ' + readyState + ')'));
	  }
	  notify(...args) {
	    const readyState = this.underlyingSocket?.readyState;
	    if (readyState === 1 /* WebSocket.OPEN */) {
	      return super.notify(...args);
	    }
	    return Promise.reject(new Error('Tried to send a JSON-RPC notification `' + args[0] + '` but the socket was not `CONNECTING` or `OPEN` (`readyState` was ' + readyState + ')'));
	  }
	}

	/**
	 * @internal
	 */

	/**
	 * Decode account data buffer using an AccountType
	 * @internal
	 */
	function decodeData(type, data) {
	  let decoded;
	  try {
	    decoded = type.layout.decode(data);
	  } catch (err) {
	    throw new Error('invalid instruction; ' + err);
	  }
	  if (decoded.typeIndex !== type.index) {
	    throw new Error(`invalid account data; account type mismatch ${decoded.typeIndex} != ${type.index}`);
	  }
	  return decoded;
	}

	/// The serialized size of lookup table metadata
	const LOOKUP_TABLE_META_SIZE = 56;
	class AddressLookupTableAccount {
	  constructor(args) {
	    this.key = void 0;
	    this.state = void 0;
	    this.key = args.key;
	    this.state = args.state;
	  }
	  isActive() {
	    const U64_MAX = BigInt('0xffffffffffffffff');
	    return this.state.deactivationSlot === U64_MAX;
	  }
	  static deserialize(accountData) {
	    const meta = decodeData(LookupTableMetaLayout, accountData);
	    const serializedAddressesLen = accountData.length - LOOKUP_TABLE_META_SIZE;
	    assert$1(serializedAddressesLen >= 0, 'lookup table is invalid');
	    assert$1(serializedAddressesLen % 32 === 0, 'lookup table is invalid');
	    const numSerializedAddresses = serializedAddressesLen / 32;
	    const {
	      addresses
	    } = LayoutExports.struct([LayoutExports.seq(publicKey(), numSerializedAddresses, 'addresses')]).decode(accountData.slice(LOOKUP_TABLE_META_SIZE));
	    return {
	      deactivationSlot: meta.deactivationSlot,
	      lastExtendedSlot: meta.lastExtendedSlot,
	      lastExtendedSlotStartIndex: meta.lastExtendedStartIndex,
	      authority: meta.authority.length !== 0 ? new PublicKey(meta.authority[0]) : undefined,
	      addresses: addresses.map(address => new PublicKey(address))
	    };
	  }
	}
	const LookupTableMetaLayout = {
	  index: 1,
	  layout: LayoutExports.struct([LayoutExports.u32('typeIndex'), u64('deactivationSlot'), LayoutExports.nu64('lastExtendedSlot'), LayoutExports.u8('lastExtendedStartIndex'), LayoutExports.u8(),
	  // option
	  LayoutExports.seq(publicKey(), LayoutExports.offset(LayoutExports.u8(), -1), 'authority')])
	};

	const URL_RE = /^[^:]+:\/\/([^:[]+|\[[^\]]+\])(:\d+)?(.*)/i;
	function makeWebsocketUrl(endpoint) {
	  const matches = endpoint.match(URL_RE);
	  if (matches == null) {
	    throw TypeError(`Failed to validate endpoint URL \`${endpoint}\``);
	  }
	  const [_,
	  // eslint-disable-line @typescript-eslint/no-unused-vars
	  hostish, portWithColon, rest] = matches;
	  const protocol = endpoint.startsWith('https:') ? 'wss:' : 'ws:';
	  const startPort = portWithColon == null ? null : parseInt(portWithColon.slice(1), 10);
	  const websocketPort =
	  // Only shift the port by +1 as a convention for ws(s) only if given endpoint
	  // is explicitly specifying the endpoint port (HTTP-based RPC), assuming
	  // we're directly trying to connect to agave-validator's ws listening port.
	  // When the endpoint omits the port, we're connecting to the protocol
	  // default ports: http(80) or https(443) and it's assumed we're behind a reverse
	  // proxy which manages WebSocket upgrade and backend port redirection.
	  startPort == null ? '' : `:${startPort + 1}`;
	  return `${protocol}//${hostish}${websocketPort}${rest}`;
	}

	const PublicKeyFromString = coerce(instance(PublicKey), string(), value => new PublicKey(value));
	const RawAccountDataResult = tuple([string(), literal('base64')]);
	const BufferFromRawAccountData = coerce(instance(bufferExports.Buffer), RawAccountDataResult, value => bufferExports.Buffer.from(value[0], 'base64'));

	/**
	 * Attempt to use a recent blockhash for up to 30 seconds
	 * @internal
	 */
	const BLOCKHASH_CACHE_TIMEOUT_MS = 30 * 1000;

	/**
	 * HACK.
	 * Copied from rpc-websockets/dist/lib/client.
	 * Otherwise, `yarn build` fails with:
	 * https://gist.github.com/steveluscher/c057eca81d479ef705cdb53162f9971d
	 */

	/** @internal */
	/** @internal */
	/** @internal */
	/** @internal */

	/** @internal */
	/**
	 * @internal
	 * Every subscription contains the args used to open the subscription with
	 * the server, and a list of callers interested in notifications.
	 */

	/**
	 * @internal
	 * A subscription may be in various states of connectedness. Only when it is
	 * fully connected will it have a server subscription id associated with it.
	 * This id can be returned to the server to unsubscribe the client entirely.
	 */

	/**
	 * A type that encapsulates a subscription's RPC method
	 * names and notification (callback) signature.
	 */

	/**
	 * @internal
	 * Utility type that keeps tagged unions intact while omitting properties.
	 */

	/**
	 * @internal
	 * This type represents a single subscribable 'topic.' It's made up of:
	 *
	 * - The args used to open the subscription with the server,
	 * - The state of the subscription, in terms of its connectedness, and
	 * - The set of callbacks to call when the server publishes notifications
	 *
	 * This record gets indexed by `SubscriptionConfigHash` and is used to
	 * set up subscriptions, fan out notifications, and track subscription state.
	 */

	/**
	 * @internal
	 */

	/**
	 * Extra contextual information for RPC responses
	 */

	/**
	 * Options for sending transactions
	 */

	/**
	 * Options for confirming transactions
	 */

	/**
	 * Options for getConfirmedSignaturesForAddress2
	 */

	/**
	 * Options for getSignaturesForAddress
	 */

	/**
	 * RPC Response with extra contextual information
	 */

	/**
	 * A strategy for confirming transactions that uses the last valid
	 * block height for a given blockhash to check for transaction expiration.
	 */

	/**
	 * A strategy for confirming durable nonce transactions.
	 */

	/**
	 * Properties shared by all transaction confirmation strategies
	 */

	/**
	 * This type represents all transaction confirmation strategies
	 */

	/* @internal */
	function assertEndpointUrl(putativeUrl) {
	  if (/^https?:/.test(putativeUrl) === false) {
	    throw new TypeError('Endpoint URL must start with `http:` or `https:`.');
	  }
	  return putativeUrl;
	}

	/** @internal */
	function extractCommitmentFromConfig(commitmentOrConfig) {
	  let commitment;
	  let config;
	  if (typeof commitmentOrConfig === 'string') {
	    commitment = commitmentOrConfig;
	  } else if (commitmentOrConfig) {
	    const {
	      commitment: specifiedCommitment,
	      ...specifiedConfig
	    } = commitmentOrConfig;
	    commitment = specifiedCommitment;
	    config = specifiedConfig;
	  }
	  return {
	    commitment,
	    config
	  };
	}

	/**
	 * @internal
	 */
	function applyDefaultMemcmpEncodingToFilters(filters) {
	  return filters.map(filter => 'memcmp' in filter ? {
	    ...filter,
	    memcmp: {
	      ...filter.memcmp,
	      encoding: filter.memcmp.encoding ?? 'base58'
	    }
	  } : filter);
	}

	/**
	 * @internal
	 */
	function createRpcResult(result) {
	  return union([type({
	    jsonrpc: literal('2.0'),
	    id: string(),
	    result
	  }), type({
	    jsonrpc: literal('2.0'),
	    id: string(),
	    error: type({
	      code: unknown(),
	      message: string(),
	      data: optional(any())
	    })
	  })]);
	}
	const UnknownRpcResult = createRpcResult(unknown());

	/**
	 * @internal
	 */
	function jsonRpcResult(schema) {
	  return coerce(createRpcResult(schema), UnknownRpcResult, value => {
	    if ('error' in value) {
	      return value;
	    } else {
	      return {
	        ...value,
	        result: create(value.result, schema)
	      };
	    }
	  });
	}

	/**
	 * @internal
	 */
	function jsonRpcResultAndContext(value) {
	  return jsonRpcResult(type({
	    context: type({
	      slot: number()
	    }),
	    value
	  }));
	}

	/**
	 * @internal
	 */
	function notificationResultAndContext(value) {
	  return type({
	    context: type({
	      slot: number()
	    }),
	    value
	  });
	}

	/**
	 * @internal
	 */
	function versionedMessageFromResponse(version, response) {
	  if (version === 0) {
	    return new MessageV0({
	      header: response.header,
	      staticAccountKeys: response.accountKeys.map(accountKey => new PublicKey(accountKey)),
	      recentBlockhash: response.recentBlockhash,
	      compiledInstructions: response.instructions.map(ix => ({
	        programIdIndex: ix.programIdIndex,
	        accountKeyIndexes: ix.accounts,
	        data: bs58.decode(ix.data)
	      })),
	      addressTableLookups: response.addressTableLookups
	    });
	  } else {
	    return new Message(response);
	  }
	}

	/**
	 * The level of commitment desired when querying state
	 * <pre>
	 *   'processed': Query the most recent block which has reached 1 confirmation by the connected node
	 *   'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
	 *   'finalized': Query the most recent block which has been finalized by the cluster
	 * </pre>
	 */

	// Deprecated as of v1.5.5

	/**
	 * A subset of Commitment levels, which are at least optimistically confirmed
	 * <pre>
	 *   'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
	 *   'finalized': Query the most recent block which has been finalized by the cluster
	 * </pre>
	 */

	/**
	 * Filter for largest accounts query
	 * <pre>
	 *   'circulating':    Return the largest accounts that are part of the circulating supply
	 *   'nonCirculating': Return the largest accounts that are not part of the circulating supply
	 * </pre>
	 */

	/**
	 * Configuration object for changing `getAccountInfo` query behavior
	 */

	/**
	 * Configuration object for changing `getBalance` query behavior
	 */

	/**
	 * Configuration object for changing `getBlock` query behavior
	 */

	/**
	 * Configuration object for changing `getBlock` query behavior
	 */

	/**
	 * Configuration object for changing `getStakeMinimumDelegation` query behavior
	 */

	/**
	 * Configuration object for changing `getBlockHeight` query behavior
	 */

	/**
	 * Configuration object for changing `getEpochInfo` query behavior
	 */

	/**
	 * Configuration object for changing `getInflationReward` query behavior
	 */

	/**
	 * Configuration object for changing `getLatestBlockhash` query behavior
	 */

	/**
	 * Configuration object for changing `isBlockhashValid` query behavior
	 */

	/**
	 * Configuration object for changing `getSlot` query behavior
	 */

	/**
	 * Configuration object for changing `getSlotLeader` query behavior
	 */

	/**
	 * Configuration object for changing `getTransaction` query behavior
	 */

	/**
	 * Configuration object for changing `getTransaction` query behavior
	 */

	/**
	 * Configuration object for changing `getLargestAccounts` query behavior
	 */

	/**
	 * Configuration object for changing `getSupply` request behavior
	 */

	/**
	 * Configuration object for changing query behavior
	 */

	/**
	 * Information describing a cluster node
	 */

	/**
	 * Information describing a vote account
	 */

	/**
	 * A collection of cluster vote accounts
	 */

	/**
	 * Network Inflation
	 * (see https://docs.solana.com/implemented-proposals/ed_overview)
	 */

	const GetInflationGovernorResult = type({
	  foundation: number(),
	  foundationTerm: number(),
	  initial: number(),
	  taper: number(),
	  terminal: number()
	});

	/**
	 * The inflation reward for an epoch
	 */

	/**
	 * Expected JSON RPC response for the "getInflationReward" message
	 */
	const GetInflationRewardResult = jsonRpcResult(array(nullable(type({
	  epoch: number(),
	  effectiveSlot: number(),
	  amount: number(),
	  postBalance: number(),
	  commission: optional(nullable(number()))
	}))));

	/**
	 * Configuration object for changing `getRecentPrioritizationFees` query behavior
	 */

	/**
	 * Expected JSON RPC response for the "getRecentPrioritizationFees" message
	 */
	const GetRecentPrioritizationFeesResult = array(type({
	  slot: number(),
	  prioritizationFee: number()
	}));
	/**
	 * Expected JSON RPC response for the "getInflationRate" message
	 */
	const GetInflationRateResult = type({
	  total: number(),
	  validator: number(),
	  foundation: number(),
	  epoch: number()
	});

	/**
	 * Information about the current epoch
	 */

	const GetEpochInfoResult = type({
	  epoch: number(),
	  slotIndex: number(),
	  slotsInEpoch: number(),
	  absoluteSlot: number(),
	  blockHeight: optional(number()),
	  transactionCount: optional(number())
	});
	const GetEpochScheduleResult = type({
	  slotsPerEpoch: number(),
	  leaderScheduleSlotOffset: number(),
	  warmup: boolean(),
	  firstNormalEpoch: number(),
	  firstNormalSlot: number()
	});

	/**
	 * Leader schedule
	 * (see https://docs.solana.com/terminology#leader-schedule)
	 */

	const GetLeaderScheduleResult = record(string(), array(number()));

	/**
	 * Transaction error or null
	 */
	const TransactionErrorResult = nullable(union([type({}), string()]));

	/**
	 * Signature status for a transaction
	 */
	const SignatureStatusResult = type({
	  err: TransactionErrorResult
	});

	/**
	 * Transaction signature received notification
	 */
	const SignatureReceivedResult = literal('receivedSignature');

	/**
	 * Version info for a node
	 */

	const VersionResult = type({
	  'solana-core': string(),
	  'feature-set': optional(number())
	});
	const ParsedInstructionStruct = type({
	  program: string(),
	  programId: PublicKeyFromString,
	  parsed: unknown()
	});
	const PartiallyDecodedInstructionStruct = type({
	  programId: PublicKeyFromString,
	  accounts: array(PublicKeyFromString),
	  data: string()
	});
	const SimulatedTransactionResponseStruct = jsonRpcResultAndContext(type({
	  err: nullable(union([type({}), string()])),
	  logs: nullable(array(string())),
	  accounts: optional(nullable(array(nullable(type({
	    executable: boolean(),
	    owner: string(),
	    lamports: number(),
	    data: array(string()),
	    rentEpoch: optional(number())
	  }))))),
	  unitsConsumed: optional(number()),
	  returnData: optional(nullable(type({
	    programId: string(),
	    data: tuple([string(), literal('base64')])
	  }))),
	  innerInstructions: optional(nullable(array(type({
	    index: number(),
	    instructions: array(union([ParsedInstructionStruct, PartiallyDecodedInstructionStruct]))
	  }))))
	}));

	/**
	 * Metadata for a parsed confirmed transaction on the ledger
	 *
	 * @deprecated Deprecated since RPC v1.8.0. Please use {@link ParsedTransactionMeta} instead.
	 */

	/**
	 * Collection of addresses loaded by a transaction using address table lookups
	 */

	/**
	 * Metadata for a parsed transaction on the ledger
	 */

	/**
	 * Metadata for a confirmed transaction on the ledger
	 */

	/**
	 * A processed transaction from the RPC API
	 */

	/**
	 * A processed transaction from the RPC API
	 */

	/**
	 * A processed transaction message from the RPC API
	 */

	/**
	 * A confirmed transaction on the ledger
	 *
	 * @deprecated Deprecated since RPC v1.8.0.
	 */

	/**
	 * A partially decoded transaction instruction
	 */

	/**
	 * A parsed transaction message account
	 */

	/**
	 * A parsed transaction instruction
	 */

	/**
	 * A parsed address table lookup
	 */

	/**
	 * A parsed transaction message
	 */

	/**
	 * A parsed transaction
	 */

	/**
	 * A parsed and confirmed transaction on the ledger
	 *
	 * @deprecated Deprecated since RPC v1.8.0. Please use {@link ParsedTransactionWithMeta} instead.
	 */

	/**
	 * A parsed transaction on the ledger with meta
	 */

	/**
	 * A processed block fetched from the RPC API
	 */

	/**
	 * A processed block fetched from the RPC API where the `transactionDetails` mode is `accounts`
	 */

	/**
	 * A processed block fetched from the RPC API where the `transactionDetails` mode is `none`
	 */

	/**
	 * A block with parsed transactions
	 */

	/**
	 * A block with parsed transactions where the `transactionDetails` mode is `accounts`
	 */

	/**
	 * A block with parsed transactions where the `transactionDetails` mode is `none`
	 */

	/**
	 * A processed block fetched from the RPC API
	 */

	/**
	 * A processed block fetched from the RPC API where the `transactionDetails` mode is `accounts`
	 */

	/**
	 * A processed block fetched from the RPC API where the `transactionDetails` mode is `none`
	 */

	/**
	 * A confirmed block on the ledger
	 *
	 * @deprecated Deprecated since RPC v1.8.0.
	 */

	/**
	 * A Block on the ledger with signatures only
	 */

	/**
	 * recent block production information
	 */

	/**
	 * Expected JSON RPC response for the "getBlockProduction" message
	 */
	const BlockProductionResponseStruct = jsonRpcResultAndContext(type({
	  byIdentity: record(string(), array(number())),
	  range: type({
	    firstSlot: number(),
	    lastSlot: number()
	  })
	}));

	/**
	 * A performance sample
	 */

	function createRpcClient(url, httpHeaders, customFetch, fetchMiddleware, disableRetryOnRateLimit, httpAgent) {
	  const fetch = customFetch ? customFetch : fetchImpl;
	  let agent;
	  {
	    if (httpAgent != null) {
	      console.warn('You have supplied an `httpAgent` when creating a `Connection` in a browser environment.' + 'It has been ignored; `httpAgent` is only used in Node environments.');
	    }
	  }
	  let fetchWithMiddleware;
	  if (fetchMiddleware) {
	    fetchWithMiddleware = async (info, init) => {
	      const modifiedFetchArgs = await new Promise((resolve, reject) => {
	        try {
	          fetchMiddleware(info, init, (modifiedInfo, modifiedInit) => resolve([modifiedInfo, modifiedInit]));
	        } catch (error) {
	          reject(error);
	        }
	      });
	      return await fetch(...modifiedFetchArgs);
	    };
	  }
	  const clientBrowser = new RpcClient(async (request, callback) => {
	    const options = {
	      method: 'POST',
	      body: request,
	      agent,
	      headers: Object.assign({
	        'Content-Type': 'application/json'
	      }, httpHeaders || {}, COMMON_HTTP_HEADERS)
	    };
	    try {
	      let too_many_requests_retries = 5;
	      let res;
	      let waitTime = 500;
	      for (;;) {
	        if (fetchWithMiddleware) {
	          res = await fetchWithMiddleware(url, options);
	        } else {
	          res = await fetch(url, options);
	        }
	        if (res.status !== 429 /* Too many requests */) {
	          break;
	        }
	        if (disableRetryOnRateLimit === true) {
	          break;
	        }
	        too_many_requests_retries -= 1;
	        if (too_many_requests_retries === 0) {
	          break;
	        }
	        console.error(`Server responded with ${res.status} ${res.statusText}.  Retrying after ${waitTime}ms delay...`);
	        await sleep(waitTime);
	        waitTime *= 2;
	      }
	      const text = await res.text();
	      if (res.ok) {
	        callback(null, text);
	      } else {
	        callback(new Error(`${res.status} ${res.statusText}: ${text}`));
	      }
	    } catch (err) {
	      if (err instanceof Error) callback(err);
	    }
	  }, {});
	  return clientBrowser;
	}
	function createRpcRequest(client) {
	  return (method, args) => {
	    return new Promise((resolve, reject) => {
	      client.request(method, args, (err, response) => {
	        if (err) {
	          reject(err);
	          return;
	        }
	        resolve(response);
	      });
	    });
	  };
	}
	function createRpcBatchRequest(client) {
	  return requests => {
	    return new Promise((resolve, reject) => {
	      // Do nothing if requests is empty
	      if (requests.length === 0) resolve([]);
	      const batch = requests.map(params => {
	        return client.request(params.methodName, params.args);
	      });
	      client.request(batch, (err, response) => {
	        if (err) {
	          reject(err);
	          return;
	        }
	        resolve(response);
	      });
	    });
	  };
	}

	/**
	 * Expected JSON RPC response for the "getInflationGovernor" message
	 */
	const GetInflationGovernorRpcResult = jsonRpcResult(GetInflationGovernorResult);

	/**
	 * Expected JSON RPC response for the "getInflationRate" message
	 */
	const GetInflationRateRpcResult = jsonRpcResult(GetInflationRateResult);

	/**
	 * Expected JSON RPC response for the "getRecentPrioritizationFees" message
	 */
	const GetRecentPrioritizationFeesRpcResult = jsonRpcResult(GetRecentPrioritizationFeesResult);

	/**
	 * Expected JSON RPC response for the "getEpochInfo" message
	 */
	const GetEpochInfoRpcResult = jsonRpcResult(GetEpochInfoResult);

	/**
	 * Expected JSON RPC response for the "getEpochSchedule" message
	 */
	const GetEpochScheduleRpcResult = jsonRpcResult(GetEpochScheduleResult);

	/**
	 * Expected JSON RPC response for the "getLeaderSchedule" message
	 */
	const GetLeaderScheduleRpcResult = jsonRpcResult(GetLeaderScheduleResult);

	/**
	 * Expected JSON RPC response for the "minimumLedgerSlot" and "getFirstAvailableBlock" messages
	 */
	const SlotRpcResult = jsonRpcResult(number());

	/**
	 * Supply
	 */

	/**
	 * Expected JSON RPC response for the "getSupply" message
	 */
	const GetSupplyRpcResult = jsonRpcResultAndContext(type({
	  total: number(),
	  circulating: number(),
	  nonCirculating: number(),
	  nonCirculatingAccounts: array(PublicKeyFromString)
	}));

	/**
	 * Token amount object which returns a token amount in different formats
	 * for various client use cases.
	 */

	/**
	 * Expected JSON RPC structure for token amounts
	 */
	const TokenAmountResult = type({
	  amount: string(),
	  uiAmount: nullable(number()),
	  decimals: number(),
	  uiAmountString: optional(string())
	});

	/**
	 * Token address and balance.
	 */

	/**
	 * Expected JSON RPC response for the "getTokenLargestAccounts" message
	 */
	const GetTokenLargestAccountsResult = jsonRpcResultAndContext(array(type({
	  address: PublicKeyFromString,
	  amount: string(),
	  uiAmount: nullable(number()),
	  decimals: number(),
	  uiAmountString: optional(string())
	})));

	/**
	 * Expected JSON RPC response for the "getTokenAccountsByOwner" message
	 */
	const GetTokenAccountsByOwner = jsonRpcResultAndContext(array(type({
	  pubkey: PublicKeyFromString,
	  account: type({
	    executable: boolean(),
	    owner: PublicKeyFromString,
	    lamports: number(),
	    data: BufferFromRawAccountData,
	    rentEpoch: number()
	  })
	})));
	const ParsedAccountDataResult = type({
	  program: string(),
	  parsed: unknown(),
	  space: number()
	});

	/**
	 * Expected JSON RPC response for the "getTokenAccountsByOwner" message with parsed data
	 */
	const GetParsedTokenAccountsByOwner = jsonRpcResultAndContext(array(type({
	  pubkey: PublicKeyFromString,
	  account: type({
	    executable: boolean(),
	    owner: PublicKeyFromString,
	    lamports: number(),
	    data: ParsedAccountDataResult,
	    rentEpoch: number()
	  })
	})));

	/**
	 * Pair of an account address and its balance
	 */

	/**
	 * Expected JSON RPC response for the "getLargestAccounts" message
	 */
	const GetLargestAccountsRpcResult = jsonRpcResultAndContext(array(type({
	  lamports: number(),
	  address: PublicKeyFromString
	})));

	/**
	 * @internal
	 */
	const AccountInfoResult = type({
	  executable: boolean(),
	  owner: PublicKeyFromString,
	  lamports: number(),
	  data: BufferFromRawAccountData,
	  rentEpoch: number()
	});

	/**
	 * @internal
	 */
	const KeyedAccountInfoResult = type({
	  pubkey: PublicKeyFromString,
	  account: AccountInfoResult
	});
	const ParsedOrRawAccountData = coerce(union([instance(bufferExports.Buffer), ParsedAccountDataResult]), union([RawAccountDataResult, ParsedAccountDataResult]), value => {
	  if (Array.isArray(value)) {
	    return create(value, BufferFromRawAccountData);
	  } else {
	    return value;
	  }
	});

	/**
	 * @internal
	 */
	const ParsedAccountInfoResult = type({
	  executable: boolean(),
	  owner: PublicKeyFromString,
	  lamports: number(),
	  data: ParsedOrRawAccountData,
	  rentEpoch: number()
	});
	const KeyedParsedAccountInfoResult = type({
	  pubkey: PublicKeyFromString,
	  account: ParsedAccountInfoResult
	});

	/**
	 * @internal
	 */
	const StakeActivationResult = type({
	  state: union([literal('active'), literal('inactive'), literal('activating'), literal('deactivating')]),
	  active: number(),
	  inactive: number()
	});

	/**
	 * Expected JSON RPC response for the "getConfirmedSignaturesForAddress2" message
	 */

	const GetConfirmedSignaturesForAddress2RpcResult = jsonRpcResult(array(type({
	  signature: string(),
	  slot: number(),
	  err: TransactionErrorResult,
	  memo: nullable(string()),
	  blockTime: optional(nullable(number()))
	})));

	/**
	 * Expected JSON RPC response for the "getSignaturesForAddress" message
	 */
	const GetSignaturesForAddressRpcResult = jsonRpcResult(array(type({
	  signature: string(),
	  slot: number(),
	  err: TransactionErrorResult,
	  memo: nullable(string()),
	  blockTime: optional(nullable(number()))
	})));

	/***
	 * Expected JSON RPC response for the "accountNotification" message
	 */
	const AccountNotificationResult = type({
	  subscription: number(),
	  result: notificationResultAndContext(AccountInfoResult)
	});

	/**
	 * @internal
	 */
	const ProgramAccountInfoResult = type({
	  pubkey: PublicKeyFromString,
	  account: AccountInfoResult
	});

	/***
	 * Expected JSON RPC response for the "programNotification" message
	 */
	const ProgramAccountNotificationResult = type({
	  subscription: number(),
	  result: notificationResultAndContext(ProgramAccountInfoResult)
	});

	/**
	 * @internal
	 */
	const SlotInfoResult = type({
	  parent: number(),
	  slot: number(),
	  root: number()
	});

	/**
	 * Expected JSON RPC response for the "slotNotification" message
	 */
	const SlotNotificationResult = type({
	  subscription: number(),
	  result: SlotInfoResult
	});

	/**
	 * Slot updates which can be used for tracking the live progress of a cluster.
	 * - `"firstShredReceived"`: connected node received the first shred of a block.
	 * Indicates that a new block that is being produced.
	 * - `"completed"`: connected node has received all shreds of a block. Indicates
	 * a block was recently produced.
	 * - `"optimisticConfirmation"`: block was optimistically confirmed by the
	 * cluster. It is not guaranteed that an optimistic confirmation notification
	 * will be sent for every finalized blocks.
	 * - `"root"`: the connected node rooted this block.
	 * - `"createdBank"`: the connected node has started validating this block.
	 * - `"frozen"`: the connected node has validated this block.
	 * - `"dead"`: the connected node failed to validate this block.
	 */

	/**
	 * @internal
	 */
	const SlotUpdateResult = union([type({
	  type: union([literal('firstShredReceived'), literal('completed'), literal('optimisticConfirmation'), literal('root')]),
	  slot: number(),
	  timestamp: number()
	}), type({
	  type: literal('createdBank'),
	  parent: number(),
	  slot: number(),
	  timestamp: number()
	}), type({
	  type: literal('frozen'),
	  slot: number(),
	  timestamp: number(),
	  stats: type({
	    numTransactionEntries: number(),
	    numSuccessfulTransactions: number(),
	    numFailedTransactions: number(),
	    maxTransactionsPerEntry: number()
	  })
	}), type({
	  type: literal('dead'),
	  slot: number(),
	  timestamp: number(),
	  err: string()
	})]);

	/**
	 * Expected JSON RPC response for the "slotsUpdatesNotification" message
	 */
	const SlotUpdateNotificationResult = type({
	  subscription: number(),
	  result: SlotUpdateResult
	});

	/**
	 * Expected JSON RPC response for the "signatureNotification" message
	 */
	const SignatureNotificationResult = type({
	  subscription: number(),
	  result: notificationResultAndContext(union([SignatureStatusResult, SignatureReceivedResult]))
	});

	/**
	 * Expected JSON RPC response for the "rootNotification" message
	 */
	const RootNotificationResult = type({
	  subscription: number(),
	  result: number()
	});
	const ContactInfoResult = type({
	  pubkey: string(),
	  gossip: nullable(string()),
	  tpu: nullable(string()),
	  rpc: nullable(string()),
	  version: nullable(string())
	});
	const VoteAccountInfoResult = type({
	  votePubkey: string(),
	  nodePubkey: string(),
	  activatedStake: number(),
	  epochVoteAccount: boolean(),
	  epochCredits: array(tuple([number(), number(), number()])),
	  commission: number(),
	  lastVote: number(),
	  rootSlot: nullable(number())
	});

	/**
	 * Expected JSON RPC response for the "getVoteAccounts" message
	 */
	const GetVoteAccounts = jsonRpcResult(type({
	  current: array(VoteAccountInfoResult),
	  delinquent: array(VoteAccountInfoResult)
	}));
	const ConfirmationStatus = union([literal('processed'), literal('confirmed'), literal('finalized')]);
	const SignatureStatusResponse = type({
	  slot: number(),
	  confirmations: nullable(number()),
	  err: TransactionErrorResult,
	  confirmationStatus: optional(ConfirmationStatus)
	});

	/**
	 * Expected JSON RPC response for the "getSignatureStatuses" message
	 */
	const GetSignatureStatusesRpcResult = jsonRpcResultAndContext(array(nullable(SignatureStatusResponse)));

	/**
	 * Expected JSON RPC response for the "getMinimumBalanceForRentExemption" message
	 */
	const GetMinimumBalanceForRentExemptionRpcResult = jsonRpcResult(number());
	const AddressTableLookupStruct = type({
	  accountKey: PublicKeyFromString,
	  writableIndexes: array(number()),
	  readonlyIndexes: array(number())
	});
	const ConfirmedTransactionResult = type({
	  signatures: array(string()),
	  message: type({
	    accountKeys: array(string()),
	    header: type({
	      numRequiredSignatures: number(),
	      numReadonlySignedAccounts: number(),
	      numReadonlyUnsignedAccounts: number()
	    }),
	    instructions: array(type({
	      accounts: array(number()),
	      data: string(),
	      programIdIndex: number()
	    })),
	    recentBlockhash: string(),
	    addressTableLookups: optional(array(AddressTableLookupStruct))
	  })
	});
	const AnnotatedAccountKey = type({
	  pubkey: PublicKeyFromString,
	  signer: boolean(),
	  writable: boolean(),
	  source: optional(union([literal('transaction'), literal('lookupTable')]))
	});
	const ConfirmedTransactionAccountsModeResult = type({
	  accountKeys: array(AnnotatedAccountKey),
	  signatures: array(string())
	});
	const ParsedInstructionResult = type({
	  parsed: unknown(),
	  program: string(),
	  programId: PublicKeyFromString
	});
	const RawInstructionResult = type({
	  accounts: array(PublicKeyFromString),
	  data: string(),
	  programId: PublicKeyFromString
	});
	const InstructionResult = union([RawInstructionResult, ParsedInstructionResult]);
	const UnknownInstructionResult = union([type({
	  parsed: unknown(),
	  program: string(),
	  programId: string()
	}), type({
	  accounts: array(string()),
	  data: string(),
	  programId: string()
	})]);
	const ParsedOrRawInstruction = coerce(InstructionResult, UnknownInstructionResult, value => {
	  if ('accounts' in value) {
	    return create(value, RawInstructionResult);
	  } else {
	    return create(value, ParsedInstructionResult);
	  }
	});

	/**
	 * @internal
	 */
	const ParsedConfirmedTransactionResult = type({
	  signatures: array(string()),
	  message: type({
	    accountKeys: array(AnnotatedAccountKey),
	    instructions: array(ParsedOrRawInstruction),
	    recentBlockhash: string(),
	    addressTableLookups: optional(nullable(array(AddressTableLookupStruct)))
	  })
	});
	const TokenBalanceResult = type({
	  accountIndex: number(),
	  mint: string(),
	  owner: optional(string()),
	  programId: optional(string()),
	  uiTokenAmount: TokenAmountResult
	});
	const LoadedAddressesResult = type({
	  writable: array(PublicKeyFromString),
	  readonly: array(PublicKeyFromString)
	});

	/**
	 * @internal
	 */
	const ConfirmedTransactionMetaResult = type({
	  err: TransactionErrorResult,
	  fee: number(),
	  innerInstructions: optional(nullable(array(type({
	    index: number(),
	    instructions: array(type({
	      accounts: array(number()),
	      data: string(),
	      programIdIndex: number()
	    }))
	  })))),
	  preBalances: array(number()),
	  postBalances: array(number()),
	  logMessages: optional(nullable(array(string()))),
	  preTokenBalances: optional(nullable(array(TokenBalanceResult))),
	  postTokenBalances: optional(nullable(array(TokenBalanceResult))),
	  loadedAddresses: optional(LoadedAddressesResult),
	  computeUnitsConsumed: optional(number()),
	  costUnits: optional(number())
	});

	/**
	 * @internal
	 */
	const ParsedConfirmedTransactionMetaResult = type({
	  err: TransactionErrorResult,
	  fee: number(),
	  innerInstructions: optional(nullable(array(type({
	    index: number(),
	    instructions: array(ParsedOrRawInstruction)
	  })))),
	  preBalances: array(number()),
	  postBalances: array(number()),
	  logMessages: optional(nullable(array(string()))),
	  preTokenBalances: optional(nullable(array(TokenBalanceResult))),
	  postTokenBalances: optional(nullable(array(TokenBalanceResult))),
	  loadedAddresses: optional(LoadedAddressesResult),
	  computeUnitsConsumed: optional(number()),
	  costUnits: optional(number())
	});
	const TransactionVersionStruct = union([literal(0), literal('legacy')]);

	/** @internal */
	const RewardsResult = type({
	  pubkey: string(),
	  lamports: number(),
	  postBalance: nullable(number()),
	  rewardType: nullable(string()),
	  commission: optional(nullable(number()))
	});

	/**
	 * Expected JSON RPC response for the "getBlock" message
	 */
	const GetBlockRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  transactions: array(type({
	    transaction: ConfirmedTransactionResult,
	    meta: nullable(ConfirmedTransactionMetaResult),
	    version: optional(TransactionVersionStruct)
	  })),
	  rewards: optional(array(RewardsResult)),
	  blockTime: nullable(number()),
	  blockHeight: nullable(number())
	})));

	/**
	 * Expected JSON RPC response for the "getBlock" message when `transactionDetails` is `none`
	 */
	const GetNoneModeBlockRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  rewards: optional(array(RewardsResult)),
	  blockTime: nullable(number()),
	  blockHeight: nullable(number())
	})));

	/**
	 * Expected JSON RPC response for the "getBlock" message when `transactionDetails` is `accounts`
	 */
	const GetAccountsModeBlockRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  transactions: array(type({
	    transaction: ConfirmedTransactionAccountsModeResult,
	    meta: nullable(ConfirmedTransactionMetaResult),
	    version: optional(TransactionVersionStruct)
	  })),
	  rewards: optional(array(RewardsResult)),
	  blockTime: nullable(number()),
	  blockHeight: nullable(number())
	})));

	/**
	 * Expected parsed JSON RPC response for the "getBlock" message
	 */
	const GetParsedBlockRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  transactions: array(type({
	    transaction: ParsedConfirmedTransactionResult,
	    meta: nullable(ParsedConfirmedTransactionMetaResult),
	    version: optional(TransactionVersionStruct)
	  })),
	  rewards: optional(array(RewardsResult)),
	  blockTime: nullable(number()),
	  blockHeight: nullable(number())
	})));

	/**
	 * Expected parsed JSON RPC response for the "getBlock" message  when `transactionDetails` is `accounts`
	 */
	const GetParsedAccountsModeBlockRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  transactions: array(type({
	    transaction: ConfirmedTransactionAccountsModeResult,
	    meta: nullable(ParsedConfirmedTransactionMetaResult),
	    version: optional(TransactionVersionStruct)
	  })),
	  rewards: optional(array(RewardsResult)),
	  blockTime: nullable(number()),
	  blockHeight: nullable(number())
	})));

	/**
	 * Expected parsed JSON RPC response for the "getBlock" message  when `transactionDetails` is `none`
	 */
	const GetParsedNoneModeBlockRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  rewards: optional(array(RewardsResult)),
	  blockTime: nullable(number()),
	  blockHeight: nullable(number())
	})));

	/**
	 * Expected JSON RPC response for the "getConfirmedBlock" message
	 *
	 * @deprecated Deprecated since RPC v1.8.0. Please use {@link GetBlockRpcResult} instead.
	 */
	const GetConfirmedBlockRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  transactions: array(type({
	    transaction: ConfirmedTransactionResult,
	    meta: nullable(ConfirmedTransactionMetaResult)
	  })),
	  rewards: optional(array(RewardsResult)),
	  blockTime: nullable(number())
	})));

	/**
	 * Expected JSON RPC response for the "getBlock" message
	 */
	const GetBlockSignaturesRpcResult = jsonRpcResult(nullable(type({
	  blockhash: string(),
	  previousBlockhash: string(),
	  parentSlot: number(),
	  signatures: array(string()),
	  blockTime: nullable(number())
	})));

	/**
	 * Expected JSON RPC response for the "getTransaction" message
	 */
	const GetTransactionRpcResult = jsonRpcResult(nullable(type({
	  slot: number(),
	  meta: nullable(ConfirmedTransactionMetaResult),
	  blockTime: optional(nullable(number())),
	  transaction: ConfirmedTransactionResult,
	  version: optional(TransactionVersionStruct)
	})));

	/**
	 * Expected parsed JSON RPC response for the "getTransaction" message
	 */
	const GetParsedTransactionRpcResult = jsonRpcResult(nullable(type({
	  slot: number(),
	  transaction: ParsedConfirmedTransactionResult,
	  meta: nullable(ParsedConfirmedTransactionMetaResult),
	  blockTime: optional(nullable(number())),
	  version: optional(TransactionVersionStruct)
	})));

	/**
	 * Expected JSON RPC response for the "getLatestBlockhash" message
	 */
	const GetLatestBlockhashRpcResult = jsonRpcResultAndContext(type({
	  blockhash: string(),
	  lastValidBlockHeight: number()
	}));

	/**
	 * Expected JSON RPC response for the "isBlockhashValid" message
	 */
	const IsBlockhashValidRpcResult = jsonRpcResultAndContext(boolean());
	const PerfSampleResult = type({
	  slot: number(),
	  numTransactions: number(),
	  numSlots: number(),
	  samplePeriodSecs: number()
	});

	/*
	 * Expected JSON RPC response for "getRecentPerformanceSamples" message
	 */
	const GetRecentPerformanceSamplesRpcResult = jsonRpcResult(array(PerfSampleResult));

	/**
	 * Expected JSON RPC response for the "getFeeCalculatorForBlockhash" message
	 */
	const GetFeeCalculatorRpcResult = jsonRpcResultAndContext(nullable(type({
	  feeCalculator: type({
	    lamportsPerSignature: number()
	  })
	})));

	/**
	 * Expected JSON RPC response for the "requestAirdrop" message
	 */
	const RequestAirdropRpcResult = jsonRpcResult(string());

	/**
	 * Expected JSON RPC response for the "sendTransaction" message
	 */
	const SendTransactionRpcResult = jsonRpcResult(string());

	/**
	 * Information about the latest slot being processed by a node
	 */

	/**
	 * Parsed account data
	 */

	/**
	 * Stake Activation data
	 */

	/**
	 * Data slice argument for getProgramAccounts
	 */

	/**
	 * Memory comparison filter for getProgramAccounts
	 */

	/**
	 * Data size comparison filter for getProgramAccounts
	 */

	/**
	 * A filter object for getProgramAccounts
	 */

	/**
	 * Configuration object for getProgramAccounts requests
	 */

	/**
	 * Configuration object for getParsedProgramAccounts
	 */

	/**
	 * Configuration object for getMultipleAccounts
	 */

	/**
	 * Configuration object for `getStakeActivation`
	 */

	/**
	 * Configuration object for `getStakeActivation`
	 */

	/**
	 * Configuration object for `getStakeActivation`
	 */

	/**
	 * Configuration object for `getNonce`
	 */

	/**
	 * Configuration object for `getNonceAndContext`
	 */

	/**
	 * Information describing an account
	 */

	/**
	 * Account information identified by pubkey
	 */

	/**
	 * Callback function for account change notifications
	 */

	/**
	 * Callback function for program account change notifications
	 */

	/**
	 * Callback function for slot change notifications
	 */

	/**
	 * Callback function for slot update notifications
	 */

	/**
	 * Callback function for signature status notifications
	 */

	/**
	 * Signature status notification with transaction result
	 */

	/**
	 * Signature received notification
	 */

	/**
	 * Callback function for signature notifications
	 */

	/**
	 * Signature subscription options
	 */

	/**
	 * Callback function for root change notifications
	 */

	/**
	 * @internal
	 */
	const LogsResult = type({
	  err: TransactionErrorResult,
	  logs: array(string()),
	  signature: string()
	});

	/**
	 * Logs result.
	 */

	/**
	 * Expected JSON RPC response for the "logsNotification" message.
	 */
	const LogsNotificationResult = type({
	  result: notificationResultAndContext(LogsResult),
	  subscription: number()
	});

	/**
	 * Filter for log subscriptions.
	 */

	/**
	 * Callback function for log notifications.
	 */

	/**
	 * Signature result
	 */

	/**
	 * Transaction error
	 */

	/**
	 * Transaction confirmation status
	 * <pre>
	 *   'processed': Transaction landed in a block which has reached 1 confirmation by the connected node
	 *   'confirmed': Transaction landed in a block which has reached 1 confirmation by the cluster
	 *   'finalized': Transaction landed in a block which has been finalized by the cluster
	 * </pre>
	 */

	/**
	 * Signature status
	 */

	/**
	 * A confirmed signature with its status
	 */

	/**
	 * An object defining headers to be passed to the RPC server
	 */

	/**
	 * The type of the JavaScript `fetch()` API
	 */

	/**
	 * A callback used to augment the outgoing HTTP request
	 */

	/**
	 * Configuration for instantiating a Connection
	 */

	/** @internal */
	const COMMON_HTTP_HEADERS = {
	  'solana-client': `js/${"1.0.0-maintenance"}`
	};

	/**
	 * A connection to a fullnode JSON RPC endpoint
	 */
	class Connection {
	  /**
	   * Establish a JSON RPC connection
	   *
	   * @param endpoint URL to the fullnode JSON RPC endpoint
	   * @param commitmentOrConfig optional default commitment level or optional ConnectionConfig configuration object
	   */
	  constructor(endpoint, _commitmentOrConfig) {
	    /** @internal */
	    this._commitment = void 0;
	    /** @internal */
	    this._confirmTransactionInitialTimeout = void 0;
	    /** @internal */
	    this._rpcEndpoint = void 0;
	    /** @internal */
	    this._rpcWsEndpoint = void 0;
	    /** @internal */
	    this._rpcClient = void 0;
	    /** @internal */
	    this._rpcRequest = void 0;
	    /** @internal */
	    this._rpcBatchRequest = void 0;
	    /** @internal */
	    this._rpcWebSocket = void 0;
	    /** @internal */
	    this._rpcWebSocketConnected = false;
	    /** @internal */
	    this._rpcWebSocketHeartbeat = null;
	    /** @internal */
	    this._rpcWebSocketIdleTimeout = null;
	    /** @internal
	     * A number that we increment every time an active connection closes.
	     * Used to determine whether the same socket connection that was open
	     * when an async operation started is the same one that's active when
	     * its continuation fires.
	     *
	     */
	    this._rpcWebSocketGeneration = 0;
	    /** @internal */
	    this._disableBlockhashCaching = false;
	    /** @internal */
	    this._pollingBlockhash = false;
	    /** @internal */
	    this._blockhashInfo = {
	      latestBlockhash: null,
	      lastFetch: 0,
	      transactionSignatures: [],
	      simulatedSignatures: []
	    };
	    /** @internal */
	    this._nextClientSubscriptionId = 0;
	    /** @internal */
	    this._subscriptionDisposeFunctionsByClientSubscriptionId = {};
	    /** @internal */
	    this._subscriptionHashByClientSubscriptionId = {};
	    /** @internal */
	    this._subscriptionStateChangeCallbacksByHash = {};
	    /** @internal */
	    this._subscriptionCallbacksByServerSubscriptionId = {};
	    /** @internal */
	    this._subscriptionsByHash = {};
	    /**
	     * Special case.
	     * After a signature is processed, RPCs automatically dispose of the
	     * subscription on the server side. We need to track which of these
	     * subscriptions have been disposed in such a way, so that we know
	     * whether the client is dealing with a not-yet-processed signature
	     * (in which case we must tear down the server subscription) or an
	     * already-processed signature (in which case the client can simply
	     * clear out the subscription locally without telling the server).
	     *
	     * NOTE: There is a proposal to eliminate this special case, here:
	     * https://github.com/solana-labs/solana/issues/18892
	     */
	    /** @internal */
	    this._subscriptionsAutoDisposedByRpc = new Set();
	    /*
	     * Returns the current block height of the node
	     */
	    this.getBlockHeight = (() => {
	      const requestPromises = {};
	      return async commitmentOrConfig => {
	        const {
	          commitment,
	          config
	        } = extractCommitmentFromConfig(commitmentOrConfig);
	        const args = this._buildArgs([], commitment, undefined /* encoding */, config);
	        const requestHash = fastStableStringify(args);
	        requestPromises[requestHash] = requestPromises[requestHash] ?? (async () => {
	          try {
	            const unsafeRes = await this._rpcRequest('getBlockHeight', args);
	            const res = create(unsafeRes, jsonRpcResult(number()));
	            if ('error' in res) {
	              throw new SolanaJSONRPCError(res.error, 'failed to get block height information');
	            }
	            return res.result;
	          } finally {
	            delete requestPromises[requestHash];
	          }
	        })();
	        return await requestPromises[requestHash];
	      };
	    })();
	    let wsEndpoint;
	    let httpHeaders;
	    let fetch;
	    let fetchMiddleware;
	    let disableRetryOnRateLimit;
	    let httpAgent;
	    if (_commitmentOrConfig && typeof _commitmentOrConfig === 'string') {
	      this._commitment = _commitmentOrConfig;
	    } else if (_commitmentOrConfig) {
	      this._commitment = _commitmentOrConfig.commitment;
	      this._confirmTransactionInitialTimeout = _commitmentOrConfig.confirmTransactionInitialTimeout;
	      wsEndpoint = _commitmentOrConfig.wsEndpoint;
	      httpHeaders = _commitmentOrConfig.httpHeaders;
	      fetch = _commitmentOrConfig.fetch;
	      fetchMiddleware = _commitmentOrConfig.fetchMiddleware;
	      disableRetryOnRateLimit = _commitmentOrConfig.disableRetryOnRateLimit;
	      httpAgent = _commitmentOrConfig.httpAgent;
	    }
	    this._rpcEndpoint = assertEndpointUrl(endpoint);
	    this._rpcWsEndpoint = wsEndpoint || makeWebsocketUrl(endpoint);
	    this._rpcClient = createRpcClient(endpoint, httpHeaders, fetch, fetchMiddleware, disableRetryOnRateLimit, httpAgent);
	    this._rpcRequest = createRpcRequest(this._rpcClient);
	    this._rpcBatchRequest = createRpcBatchRequest(this._rpcClient);
	    this._rpcWebSocket = new RpcWebSocketClient(this._rpcWsEndpoint, {
	      autoconnect: false,
	      max_reconnects: Infinity
	    });
	    this._rpcWebSocket.on('open', this._wsOnOpen.bind(this));
	    this._rpcWebSocket.on('error', this._wsOnError.bind(this));
	    this._rpcWebSocket.on('close', this._wsOnClose.bind(this));
	    this._rpcWebSocket.on('accountNotification', this._wsOnAccountNotification.bind(this));
	    this._rpcWebSocket.on('programNotification', this._wsOnProgramAccountNotification.bind(this));
	    this._rpcWebSocket.on('slotNotification', this._wsOnSlotNotification.bind(this));
	    this._rpcWebSocket.on('slotsUpdatesNotification', this._wsOnSlotUpdatesNotification.bind(this));
	    this._rpcWebSocket.on('signatureNotification', this._wsOnSignatureNotification.bind(this));
	    this._rpcWebSocket.on('rootNotification', this._wsOnRootNotification.bind(this));
	    this._rpcWebSocket.on('logsNotification', this._wsOnLogsNotification.bind(this));
	  }

	  /**
	   * The default commitment used for requests
	   */
	  get commitment() {
	    return this._commitment;
	  }

	  /**
	   * The RPC endpoint
	   */
	  get rpcEndpoint() {
	    return this._rpcEndpoint;
	  }

	  /**
	   * Fetch the balance for the specified public key, return with context
	   */
	  async getBalanceAndContext(publicKey, commitmentOrConfig) {
	    /** @internal */
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([publicKey.toBase58()], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getBalance', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(number()));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get balance for ${publicKey.toBase58()}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the balance for the specified public key
	   */
	  async getBalance(publicKey, commitmentOrConfig) {
	    return await this.getBalanceAndContext(publicKey, commitmentOrConfig).then(x => x.value).catch(e => {
	      throw new Error('failed to get balance of account ' + publicKey.toBase58() + ': ' + e);
	    });
	  }

	  /**
	   * Fetch the estimated production time of a block
	   */
	  async getBlockTime(slot) {
	    const unsafeRes = await this._rpcRequest('getBlockTime', [slot]);
	    const res = create(unsafeRes, jsonRpcResult(nullable(number())));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get block time for slot ${slot}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the lowest slot that the node has information about in its ledger.
	   * This value may increase over time if the node is configured to purge older ledger data
	   */
	  async getMinimumLedgerSlot() {
	    const unsafeRes = await this._rpcRequest('minimumLedgerSlot', []);
	    const res = create(unsafeRes, jsonRpcResult(number()));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get minimum ledger slot');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the slot of the lowest confirmed block that has not been purged from the ledger
	   */
	  async getFirstAvailableBlock() {
	    const unsafeRes = await this._rpcRequest('getFirstAvailableBlock', []);
	    const res = create(unsafeRes, SlotRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get first available block');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch information about the current supply
	   */
	  async getSupply(config) {
	    let configArg = {};
	    if (typeof config === 'string') {
	      configArg = {
	        commitment: config
	      };
	    } else if (config) {
	      configArg = {
	        ...config,
	        commitment: config && config.commitment || this.commitment
	      };
	    } else {
	      configArg = {
	        commitment: this.commitment
	      };
	    }
	    const unsafeRes = await this._rpcRequest('getSupply', [configArg]);
	    const res = create(unsafeRes, GetSupplyRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get supply');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the current supply of a token mint
	   */
	  async getTokenSupply(tokenMintAddress, commitment) {
	    const args = this._buildArgs([tokenMintAddress.toBase58()], commitment);
	    const unsafeRes = await this._rpcRequest('getTokenSupply', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(TokenAmountResult));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get token supply');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the current balance of a token account
	   */
	  async getTokenAccountBalance(tokenAddress, commitment) {
	    const args = this._buildArgs([tokenAddress.toBase58()], commitment);
	    const unsafeRes = await this._rpcRequest('getTokenAccountBalance', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(TokenAmountResult));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get token account balance');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch all the token accounts owned by the specified account
	   *
	   * @return {Promise<RpcResponseAndContext<GetProgramAccountsResponse>}
	   */
	  async getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    let _args = [ownerAddress.toBase58()];
	    if ('mint' in filter) {
	      _args.push({
	        mint: filter.mint.toBase58()
	      });
	    } else {
	      _args.push({
	        programId: filter.programId.toBase58()
	      });
	    }
	    const args = this._buildArgs(_args, commitment, 'base64', config);
	    const unsafeRes = await this._rpcRequest('getTokenAccountsByOwner', args);
	    const res = create(unsafeRes, GetTokenAccountsByOwner);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch parsed token accounts owned by the specified account
	   *
	   * @return {Promise<RpcResponseAndContext<Array<{pubkey: PublicKey, account: AccountInfo<ParsedAccountData>}>>>}
	   */
	  async getParsedTokenAccountsByOwner(ownerAddress, filter, commitment) {
	    let _args = [ownerAddress.toBase58()];
	    if ('mint' in filter) {
	      _args.push({
	        mint: filter.mint.toBase58()
	      });
	    } else {
	      _args.push({
	        programId: filter.programId.toBase58()
	      });
	    }
	    const args = this._buildArgs(_args, commitment, 'jsonParsed');
	    const unsafeRes = await this._rpcRequest('getTokenAccountsByOwner', args);
	    const res = create(unsafeRes, GetParsedTokenAccountsByOwner);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the 20 largest accounts with their current balances
	   */
	  async getLargestAccounts(config) {
	    const arg = {
	      ...config,
	      commitment: config && config.commitment || this.commitment
	    };
	    const args = arg.filter || arg.commitment ? [arg] : [];
	    const unsafeRes = await this._rpcRequest('getLargestAccounts', args);
	    const res = create(unsafeRes, GetLargestAccountsRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get largest accounts');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the 20 largest token accounts with their current balances
	   * for a given mint.
	   */
	  async getTokenLargestAccounts(mintAddress, commitment) {
	    const args = this._buildArgs([mintAddress.toBase58()], commitment);
	    const unsafeRes = await this._rpcRequest('getTokenLargestAccounts', args);
	    const res = create(unsafeRes, GetTokenLargestAccountsResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get token largest accounts');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch all the account info for the specified public key, return with context
	   */
	  async getAccountInfoAndContext(publicKey, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([publicKey.toBase58()], commitment, 'base64', config);
	    const unsafeRes = await this._rpcRequest('getAccountInfo', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(nullable(AccountInfoResult)));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey.toBase58()}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch parsed account info for the specified public key
	   */
	  async getParsedAccountInfo(publicKey, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([publicKey.toBase58()], commitment, 'jsonParsed', config);
	    const unsafeRes = await this._rpcRequest('getAccountInfo', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(nullable(ParsedAccountInfoResult)));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey.toBase58()}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch all the account info for the specified public key
	   */
	  async getAccountInfo(publicKey, commitmentOrConfig) {
	    try {
	      const res = await this.getAccountInfoAndContext(publicKey, commitmentOrConfig);
	      return res.value;
	    } catch (e) {
	      throw new Error('failed to get info about account ' + publicKey.toBase58() + ': ' + e);
	    }
	  }

	  /**
	   * Fetch all the account info for multiple accounts specified by an array of public keys, return with context
	   */
	  async getMultipleParsedAccounts(publicKeys, rawConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(rawConfig);
	    const keys = publicKeys.map(key => key.toBase58());
	    const args = this._buildArgs([keys], commitment, 'jsonParsed', config);
	    const unsafeRes = await this._rpcRequest('getMultipleAccounts', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(array(nullable(ParsedAccountInfoResult))));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch all the account info for multiple accounts specified by an array of public keys, return with context
	   */
	  async getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const keys = publicKeys.map(key => key.toBase58());
	    const args = this._buildArgs([keys], commitment, 'base64', config);
	    const unsafeRes = await this._rpcRequest('getMultipleAccounts', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(array(nullable(AccountInfoResult))));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch all the account info for multiple accounts specified by an array of public keys
	   */
	  async getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
	    const res = await this.getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig);
	    return res.value;
	  }

	  /**
	   * Returns epoch activation information for a stake account that has been delegated
	   *
	   * @deprecated Deprecated since RPC v1.18; will be removed in a future version.
	   */
	  async getStakeActivation(publicKey, commitmentOrConfig, epoch) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([publicKey.toBase58()], commitment, undefined /* encoding */, {
	      ...config,
	      epoch: epoch != null ? epoch : config?.epoch
	    });
	    const unsafeRes = await this._rpcRequest('getStakeActivation', args);
	    const res = create(unsafeRes, jsonRpcResult(StakeActivationResult));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get Stake Activation ${publicKey.toBase58()}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch all the accounts owned by the specified program id
	   *
	   * @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>>}
	   */

	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members
	  async getProgramAccounts(programId, configOrCommitment) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(configOrCommitment);
	    const {
	      encoding,
	      ...configWithoutEncoding
	    } = config || {};
	    const args = this._buildArgs([programId.toBase58()], commitment, encoding || 'base64', {
	      ...configWithoutEncoding,
	      ...(configWithoutEncoding.filters ? {
	        filters: applyDefaultMemcmpEncodingToFilters(configWithoutEncoding.filters)
	      } : null)
	    });
	    const unsafeRes = await this._rpcRequest('getProgramAccounts', args);
	    const baseSchema = array(KeyedAccountInfoResult);
	    const res = configWithoutEncoding.withContext === true ? create(unsafeRes, jsonRpcResultAndContext(baseSchema)) : create(unsafeRes, jsonRpcResult(baseSchema));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
	    }
	    return res.result;
	  }

	  /**
	   * Fetch and parse all the accounts owned by the specified program id
	   *
	   * @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer | ParsedAccountData>}>>}
	   */
	  async getParsedProgramAccounts(programId, configOrCommitment) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(configOrCommitment);
	    const args = this._buildArgs([programId.toBase58()], commitment, 'jsonParsed', config);
	    const unsafeRes = await this._rpcRequest('getProgramAccounts', args);
	    const res = create(unsafeRes, jsonRpcResult(array(KeyedParsedAccountInfoResult)));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
	    }
	    return res.result;
	  }

	  /** @deprecated Instead, call `confirmTransaction` and pass in {@link TransactionConfirmationStrategy} */
	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members
	  async confirmTransaction(strategy, commitment) {
	    let rawSignature;
	    if (typeof strategy == 'string') {
	      rawSignature = strategy;
	    } else {
	      const config = strategy;
	      if (config.abortSignal?.aborted) {
	        return Promise.reject(config.abortSignal.reason);
	      }
	      rawSignature = config.signature;
	    }
	    let decodedSignature;
	    try {
	      decodedSignature = bs58.decode(rawSignature);
	    } catch (err) {
	      throw new Error('signature must be base58 encoded: ' + rawSignature);
	    }
	    assert$1(decodedSignature.length === 64, 'signature has invalid length');
	    if (typeof strategy === 'string') {
	      return await this.confirmTransactionUsingLegacyTimeoutStrategy({
	        commitment: commitment || this.commitment,
	        signature: rawSignature
	      });
	    } else if ('lastValidBlockHeight' in strategy) {
	      return await this.confirmTransactionUsingBlockHeightExceedanceStrategy({
	        commitment: commitment || this.commitment,
	        strategy
	      });
	    } else {
	      return await this.confirmTransactionUsingDurableNonceStrategy({
	        commitment: commitment || this.commitment,
	        strategy
	      });
	    }
	  }
	  getCancellationPromise(signal) {
	    return new Promise((_, reject) => {
	      if (signal == null) {
	        return;
	      }
	      if (signal.aborted) {
	        reject(signal.reason);
	      } else {
	        signal.addEventListener('abort', () => {
	          reject(signal.reason);
	        });
	      }
	    });
	  }
	  getTransactionConfirmationPromise({
	    commitment,
	    signature
	  }) {
	    let signatureSubscriptionId;
	    let disposeSignatureSubscriptionStateChangeObserver;
	    let done = false;
	    const confirmationPromise = new Promise((resolve, reject) => {
	      try {
	        signatureSubscriptionId = this.onSignature(signature, (result, context) => {
	          signatureSubscriptionId = undefined;
	          const response = {
	            context,
	            value: result
	          };
	          resolve({
	            __type: TransactionStatus.PROCESSED,
	            response
	          });
	        }, commitment);
	        const subscriptionSetupPromise = new Promise(resolveSubscriptionSetup => {
	          if (signatureSubscriptionId == null) {
	            resolveSubscriptionSetup();
	          } else {
	            disposeSignatureSubscriptionStateChangeObserver = this._onSubscriptionStateChange(signatureSubscriptionId, nextState => {
	              if (nextState === 'subscribed') {
	                resolveSubscriptionSetup();
	              }
	            });
	          }
	        });
	        (async () => {
	          await subscriptionSetupPromise;
	          if (done) return;
	          const response = await this.getSignatureStatus(signature);
	          if (done) return;
	          if (response == null) {
	            return;
	          }
	          const {
	            context,
	            value
	          } = response;
	          if (value == null) {
	            return;
	          }
	          if (value?.err) {
	            reject(value.err);
	          } else {
	            switch (commitment) {
	              case 'confirmed':
	              case 'single':
	              case 'singleGossip':
	                {
	                  if (value.confirmationStatus === 'processed') {
	                    return;
	                  }
	                  break;
	                }
	              case 'finalized':
	              case 'max':
	              case 'root':
	                {
	                  if (value.confirmationStatus === 'processed' || value.confirmationStatus === 'confirmed') {
	                    return;
	                  }
	                  break;
	                }
	              // exhaust enums to ensure full coverage
	              case 'processed':
	              case 'recent':
	            }
	            done = true;
	            resolve({
	              __type: TransactionStatus.PROCESSED,
	              response: {
	                context,
	                value
	              }
	            });
	          }
	        })();
	      } catch (err) {
	        reject(err);
	      }
	    });
	    const abortConfirmation = () => {
	      if (disposeSignatureSubscriptionStateChangeObserver) {
	        disposeSignatureSubscriptionStateChangeObserver();
	        disposeSignatureSubscriptionStateChangeObserver = undefined;
	      }
	      if (signatureSubscriptionId != null) {
	        this.removeSignatureListener(signatureSubscriptionId);
	        signatureSubscriptionId = undefined;
	      }
	    };
	    return {
	      abortConfirmation,
	      confirmationPromise
	    };
	  }
	  async confirmTransactionUsingBlockHeightExceedanceStrategy({
	    commitment,
	    strategy: {
	      abortSignal,
	      lastValidBlockHeight,
	      signature
	    }
	  }) {
	    let done = false;
	    const expiryPromise = new Promise(resolve => {
	      const checkBlockHeight = async () => {
	        try {
	          const blockHeight = await this.getBlockHeight(commitment);
	          return blockHeight;
	        } catch (_e) {
	          return -1;
	        }
	      };
	      (async () => {
	        let currentBlockHeight = await checkBlockHeight();
	        if (done) return;
	        while (currentBlockHeight <= lastValidBlockHeight) {
	          await sleep(1000);
	          if (done) return;
	          currentBlockHeight = await checkBlockHeight();
	          if (done) return;
	        }
	        resolve({
	          __type: TransactionStatus.BLOCKHEIGHT_EXCEEDED
	        });
	      })();
	    });
	    const {
	      abortConfirmation,
	      confirmationPromise
	    } = this.getTransactionConfirmationPromise({
	      commitment,
	      signature
	    });
	    const cancellationPromise = this.getCancellationPromise(abortSignal);
	    let result;
	    try {
	      const outcome = await Promise.race([cancellationPromise, confirmationPromise, expiryPromise]);
	      if (outcome.__type === TransactionStatus.PROCESSED) {
	        result = outcome.response;
	      } else {
	        throw new TransactionExpiredBlockheightExceededError(signature);
	      }
	    } finally {
	      done = true;
	      abortConfirmation();
	    }
	    return result;
	  }
	  async confirmTransactionUsingDurableNonceStrategy({
	    commitment,
	    strategy: {
	      abortSignal,
	      minContextSlot,
	      nonceAccountPubkey,
	      nonceValue,
	      signature
	    }
	  }) {
	    let done = false;
	    const expiryPromise = new Promise(resolve => {
	      let currentNonceValue = nonceValue;
	      let lastCheckedSlot = null;
	      const getCurrentNonceValue = async () => {
	        try {
	          const {
	            context,
	            value: nonceAccount
	          } = await this.getNonceAndContext(nonceAccountPubkey, {
	            commitment,
	            minContextSlot
	          });
	          lastCheckedSlot = context.slot;
	          return nonceAccount?.nonce;
	        } catch (e) {
	          // If for whatever reason we can't reach/read the nonce
	          // account, just keep using the last-known value.
	          return currentNonceValue;
	        }
	      };
	      (async () => {
	        currentNonceValue = await getCurrentNonceValue();
	        if (done) return;
	        while (true // eslint-disable-line no-constant-condition
	        ) {
	          if (nonceValue !== currentNonceValue) {
	            resolve({
	              __type: TransactionStatus.NONCE_INVALID,
	              slotInWhichNonceDidAdvance: lastCheckedSlot
	            });
	            return;
	          }
	          await sleep(2000);
	          if (done) return;
	          currentNonceValue = await getCurrentNonceValue();
	          if (done) return;
	        }
	      })();
	    });
	    const {
	      abortConfirmation,
	      confirmationPromise
	    } = this.getTransactionConfirmationPromise({
	      commitment,
	      signature
	    });
	    const cancellationPromise = this.getCancellationPromise(abortSignal);
	    let result;
	    try {
	      const outcome = await Promise.race([cancellationPromise, confirmationPromise, expiryPromise]);
	      if (outcome.__type === TransactionStatus.PROCESSED) {
	        result = outcome.response;
	      } else {
	        // Double check that the transaction is indeed unconfirmed.
	        let signatureStatus;
	        while (true // eslint-disable-line no-constant-condition
	        ) {
	          const status = await this.getSignatureStatus(signature);
	          if (status == null) {
	            break;
	          }
	          if (status.context.slot < (outcome.slotInWhichNonceDidAdvance ?? minContextSlot)) {
	            await sleep(400);
	            continue;
	          }
	          signatureStatus = status;
	          break;
	        }
	        if (signatureStatus?.value) {
	          const commitmentForStatus = commitment || 'finalized';
	          const {
	            confirmationStatus
	          } = signatureStatus.value;
	          switch (commitmentForStatus) {
	            case 'processed':
	            case 'recent':
	              if (confirmationStatus !== 'processed' && confirmationStatus !== 'confirmed' && confirmationStatus !== 'finalized') {
	                throw new TransactionExpiredNonceInvalidError(signature);
	              }
	              break;
	            case 'confirmed':
	            case 'single':
	            case 'singleGossip':
	              if (confirmationStatus !== 'confirmed' && confirmationStatus !== 'finalized') {
	                throw new TransactionExpiredNonceInvalidError(signature);
	              }
	              break;
	            case 'finalized':
	            case 'max':
	            case 'root':
	              if (confirmationStatus !== 'finalized') {
	                throw new TransactionExpiredNonceInvalidError(signature);
	              }
	              break;
	            default:
	              // Exhaustive switch.
	              // eslint-disable-next-line @typescript-eslint/no-unused-vars
	              (_ => {})(commitmentForStatus);
	          }
	          result = {
	            context: signatureStatus.context,
	            value: {
	              err: signatureStatus.value.err
	            }
	          };
	        } else {
	          throw new TransactionExpiredNonceInvalidError(signature);
	        }
	      }
	    } finally {
	      done = true;
	      abortConfirmation();
	    }
	    return result;
	  }
	  async confirmTransactionUsingLegacyTimeoutStrategy({
	    commitment,
	    signature
	  }) {
	    let timeoutId;
	    const expiryPromise = new Promise(resolve => {
	      let timeoutMs = this._confirmTransactionInitialTimeout || 60 * 1000;
	      switch (commitment) {
	        case 'processed':
	        case 'recent':
	        case 'single':
	        case 'confirmed':
	        case 'singleGossip':
	          {
	            timeoutMs = this._confirmTransactionInitialTimeout || 30 * 1000;
	            break;
	          }
	      }
	      timeoutId = setTimeout(() => resolve({
	        __type: TransactionStatus.TIMED_OUT,
	        timeoutMs
	      }), timeoutMs);
	    });
	    const {
	      abortConfirmation,
	      confirmationPromise
	    } = this.getTransactionConfirmationPromise({
	      commitment,
	      signature
	    });
	    let result;
	    try {
	      const outcome = await Promise.race([confirmationPromise, expiryPromise]);
	      if (outcome.__type === TransactionStatus.PROCESSED) {
	        result = outcome.response;
	      } else {
	        throw new TransactionExpiredTimeoutError(signature, outcome.timeoutMs / 1000);
	      }
	    } finally {
	      clearTimeout(timeoutId);
	      abortConfirmation();
	    }
	    return result;
	  }

	  /**
	   * Return the list of nodes that are currently participating in the cluster
	   */
	  async getClusterNodes() {
	    const unsafeRes = await this._rpcRequest('getClusterNodes', []);
	    const res = create(unsafeRes, jsonRpcResult(array(ContactInfoResult)));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get cluster nodes');
	    }
	    return res.result;
	  }

	  /**
	   * Return the list of nodes that are currently participating in the cluster
	   */
	  async getVoteAccounts(commitment) {
	    const args = this._buildArgs([], commitment);
	    const unsafeRes = await this._rpcRequest('getVoteAccounts', args);
	    const res = create(unsafeRes, GetVoteAccounts);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get vote accounts');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the current slot that the node is processing
	   */
	  async getSlot(commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getSlot', args);
	    const res = create(unsafeRes, jsonRpcResult(number()));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get slot');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the current slot leader of the cluster
	   */
	  async getSlotLeader(commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getSlotLeader', args);
	    const res = create(unsafeRes, jsonRpcResult(string()));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get slot leader');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch `limit` number of slot leaders starting from `startSlot`
	   *
	   * @param startSlot fetch slot leaders starting from this slot
	   * @param limit number of slot leaders to return
	   */
	  async getSlotLeaders(startSlot, limit) {
	    const args = [startSlot, limit];
	    const unsafeRes = await this._rpcRequest('getSlotLeaders', args);
	    const res = create(unsafeRes, jsonRpcResult(array(PublicKeyFromString)));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get slot leaders');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the current status of a signature
	   */
	  async getSignatureStatus(signature, config) {
	    const {
	      context,
	      value: values
	    } = await this.getSignatureStatuses([signature], config);
	    assert$1(values.length === 1);
	    const value = values[0];
	    return {
	      context,
	      value
	    };
	  }

	  /**
	   * Fetch the current statuses of a batch of signatures
	   */
	  async getSignatureStatuses(signatures, config) {
	    const params = [signatures];
	    if (config) {
	      params.push(config);
	    }
	    const unsafeRes = await this._rpcRequest('getSignatureStatuses', params);
	    const res = create(unsafeRes, GetSignatureStatusesRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get signature status');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the current transaction count of the cluster
	   */
	  async getTransactionCount(commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getTransactionCount', args);
	    const res = create(unsafeRes, jsonRpcResult(number()));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get transaction count');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the current total currency supply of the cluster in lamports
	   *
	   * @deprecated Deprecated since RPC v1.2.8. Please use {@link getSupply} instead.
	   */
	  async getTotalSupply(commitment) {
	    const result = await this.getSupply({
	      commitment,
	      excludeNonCirculatingAccountsList: true
	    });
	    return result.value.total;
	  }

	  /**
	   * Fetch the cluster InflationGovernor parameters
	   */
	  async getInflationGovernor(commitment) {
	    const args = this._buildArgs([], commitment);
	    const unsafeRes = await this._rpcRequest('getInflationGovernor', args);
	    const res = create(unsafeRes, GetInflationGovernorRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get inflation');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the inflation reward for a list of addresses for an epoch
	   */
	  async getInflationReward(addresses, epoch, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([addresses.map(pubkey => pubkey.toBase58())], commitment, undefined /* encoding */, {
	      ...config,
	      epoch: epoch != null ? epoch : config?.epoch
	    });
	    const unsafeRes = await this._rpcRequest('getInflationReward', args);
	    const res = create(unsafeRes, GetInflationRewardResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get inflation reward');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the specific inflation values for the current epoch
	   */
	  async getInflationRate() {
	    const unsafeRes = await this._rpcRequest('getInflationRate', []);
	    const res = create(unsafeRes, GetInflationRateRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get inflation rate');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the Epoch Info parameters
	   */
	  async getEpochInfo(commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getEpochInfo', args);
	    const res = create(unsafeRes, GetEpochInfoRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get epoch info');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the Epoch Schedule parameters
	   */
	  async getEpochSchedule() {
	    const unsafeRes = await this._rpcRequest('getEpochSchedule', []);
	    const res = create(unsafeRes, GetEpochScheduleRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get epoch schedule');
	    }
	    const epochSchedule = res.result;
	    return new EpochSchedule(epochSchedule.slotsPerEpoch, epochSchedule.leaderScheduleSlotOffset, epochSchedule.warmup, epochSchedule.firstNormalEpoch, epochSchedule.firstNormalSlot);
	  }

	  /**
	   * Fetch the leader schedule for the current epoch
	   * @return {Promise<RpcResponseAndContext<LeaderSchedule>>}
	   */
	  async getLeaderSchedule() {
	    const unsafeRes = await this._rpcRequest('getLeaderSchedule', []);
	    const res = create(unsafeRes, GetLeaderScheduleRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get leader schedule');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the minimum balance needed to exempt an account of `dataLength`
	   * size from rent
	   */
	  async getMinimumBalanceForRentExemption(dataLength, commitment) {
	    const args = this._buildArgs([dataLength], commitment);
	    const unsafeRes = await this._rpcRequest('getMinimumBalanceForRentExemption', args);
	    const res = create(unsafeRes, GetMinimumBalanceForRentExemptionRpcResult);
	    if ('error' in res) {
	      console.warn('Unable to fetch minimum balance for rent exemption');
	      return 0;
	    }
	    return res.result;
	  }

	  /**
	   * Fetch a recent blockhash from the cluster, return with context
	   * @return {Promise<RpcResponseAndContext<{blockhash: Blockhash, feeCalculator: FeeCalculator}>>}
	   *
	   * @deprecated Deprecated since RPC v1.9.0. Please use {@link getLatestBlockhash} instead.
	   */
	  async getRecentBlockhashAndContext(commitment) {
	    const {
	      context,
	      value: {
	        blockhash
	      }
	    } = await this.getLatestBlockhashAndContext(commitment);
	    const feeCalculator = {
	      get lamportsPerSignature() {
	        throw new Error('The capability to fetch `lamportsPerSignature` using the `getRecentBlockhash` API is ' + 'no longer offered by the network. Use the `getFeeForMessage` API to obtain the fee ' + 'for a given message.');
	      },
	      toJSON() {
	        return {};
	      }
	    };
	    return {
	      context,
	      value: {
	        blockhash,
	        feeCalculator
	      }
	    };
	  }

	  /**
	   * Fetch recent performance samples
	   * @return {Promise<Array<PerfSample>>}
	   */
	  async getRecentPerformanceSamples(limit) {
	    const unsafeRes = await this._rpcRequest('getRecentPerformanceSamples', limit ? [limit] : []);
	    const res = create(unsafeRes, GetRecentPerformanceSamplesRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get recent performance samples');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the fee calculator for a recent blockhash from the cluster, return with context
	   *
	   * @deprecated Deprecated since RPC v1.9.0. Please use {@link getFeeForMessage} instead.
	   */
	  async getFeeCalculatorForBlockhash(blockhash, commitment) {
	    const args = this._buildArgs([blockhash], commitment);
	    const unsafeRes = await this._rpcRequest('getFeeCalculatorForBlockhash', args);
	    const res = create(unsafeRes, GetFeeCalculatorRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get fee calculator');
	    }
	    const {
	      context,
	      value
	    } = res.result;
	    return {
	      context,
	      value: value !== null ? value.feeCalculator : null
	    };
	  }

	  /**
	   * Fetch the fee for a message from the cluster, return with context
	   */
	  async getFeeForMessage(message, commitment) {
	    const wireMessage = toBuffer(message.serialize()).toString('base64');
	    const args = this._buildArgs([wireMessage], commitment);
	    const unsafeRes = await this._rpcRequest('getFeeForMessage', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(nullable(number())));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get fee for message');
	    }
	    if (res.result === null) {
	      throw new Error('invalid blockhash');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch a list of prioritization fees from recent blocks.
	   */
	  async getRecentPrioritizationFees(config) {
	    const accounts = config?.lockedWritableAccounts?.map(key => key.toBase58());
	    const args = accounts?.length ? [accounts] : [];
	    const unsafeRes = await this._rpcRequest('getRecentPrioritizationFees', args);
	    const res = create(unsafeRes, GetRecentPrioritizationFeesRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get recent prioritization fees');
	    }
	    return res.result;
	  }
	  /**
	   * Fetch a recent blockhash from the cluster
	   * @return {Promise<{blockhash: Blockhash, feeCalculator: FeeCalculator}>}
	   *
	   * @deprecated Deprecated since RPC v1.8.0. Please use {@link getLatestBlockhash} instead.
	   */
	  async getRecentBlockhash(commitment) {
	    try {
	      const res = await this.getRecentBlockhashAndContext(commitment);
	      return res.value;
	    } catch (e) {
	      throw new Error('failed to get recent blockhash: ' + e);
	    }
	  }

	  /**
	   * Fetch the latest blockhash from the cluster
	   * @return {Promise<BlockhashWithExpiryBlockHeight>}
	   */
	  async getLatestBlockhash(commitmentOrConfig) {
	    try {
	      const res = await this.getLatestBlockhashAndContext(commitmentOrConfig);
	      return res.value;
	    } catch (e) {
	      throw new Error('failed to get recent blockhash: ' + e);
	    }
	  }

	  /**
	   * Fetch the latest blockhash from the cluster
	   * @return {Promise<BlockhashWithExpiryBlockHeight>}
	   */
	  async getLatestBlockhashAndContext(commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getLatestBlockhash', args);
	    const res = create(unsafeRes, GetLatestBlockhashRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get latest blockhash');
	    }
	    return res.result;
	  }

	  /**
	   * Returns whether a blockhash is still valid or not
	   */
	  async isBlockhashValid(blockhash, rawConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(rawConfig);
	    const args = this._buildArgs([blockhash], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('isBlockhashValid', args);
	    const res = create(unsafeRes, IsBlockhashValidRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to determine if the blockhash `' + blockhash + '`is valid');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the node version
	   */
	  async getVersion() {
	    const unsafeRes = await this._rpcRequest('getVersion', []);
	    const res = create(unsafeRes, jsonRpcResult(VersionResult));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get version');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch the genesis hash
	   */
	  async getGenesisHash() {
	    const unsafeRes = await this._rpcRequest('getGenesisHash', []);
	    const res = create(unsafeRes, jsonRpcResult(string()));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get genesis hash');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch a processed block from the cluster.
	   *
	   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
	   * setting the `maxSupportedTransactionVersion` property.
	   */

	  /**
	   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
	   * setting the `maxSupportedTransactionVersion` property.
	   */
	  // eslint-disable-next-line no-dupe-class-members

	  /**
	   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
	   * setting the `maxSupportedTransactionVersion` property.
	   */
	  // eslint-disable-next-line no-dupe-class-members

	  /**
	   * Fetch a processed block from the cluster.
	   */
	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members

	  /**
	   * Fetch a processed block from the cluster.
	   */
	  // eslint-disable-next-line no-dupe-class-members
	  async getBlock(slot, rawConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(rawConfig);
	    const args = this._buildArgsAtLeastConfirmed([slot], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getBlock', args);
	    try {
	      switch (config?.transactionDetails) {
	        case 'accounts':
	          {
	            const res = create(unsafeRes, GetAccountsModeBlockRpcResult);
	            if ('error' in res) {
	              throw res.error;
	            }
	            return res.result;
	          }
	        case 'none':
	          {
	            const res = create(unsafeRes, GetNoneModeBlockRpcResult);
	            if ('error' in res) {
	              throw res.error;
	            }
	            return res.result;
	          }
	        default:
	          {
	            const res = create(unsafeRes, GetBlockRpcResult);
	            if ('error' in res) {
	              throw res.error;
	            }
	            const {
	              result
	            } = res;
	            return result ? {
	              ...result,
	              transactions: result.transactions.map(({
	                transaction,
	                meta,
	                version
	              }) => ({
	                meta,
	                transaction: {
	                  ...transaction,
	                  message: versionedMessageFromResponse(version, transaction.message)
	                },
	                version
	              }))
	            } : null;
	          }
	      }
	    } catch (e) {
	      throw new SolanaJSONRPCError(e, 'failed to get confirmed block');
	    }
	  }

	  /**
	   * Fetch parsed transaction details for a confirmed or finalized block
	   */

	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members
	  async getParsedBlock(slot, rawConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(rawConfig);
	    const args = this._buildArgsAtLeastConfirmed([slot], commitment, 'jsonParsed', config);
	    const unsafeRes = await this._rpcRequest('getBlock', args);
	    try {
	      switch (config?.transactionDetails) {
	        case 'accounts':
	          {
	            const res = create(unsafeRes, GetParsedAccountsModeBlockRpcResult);
	            if ('error' in res) {
	              throw res.error;
	            }
	            return res.result;
	          }
	        case 'none':
	          {
	            const res = create(unsafeRes, GetParsedNoneModeBlockRpcResult);
	            if ('error' in res) {
	              throw res.error;
	            }
	            return res.result;
	          }
	        default:
	          {
	            const res = create(unsafeRes, GetParsedBlockRpcResult);
	            if ('error' in res) {
	              throw res.error;
	            }
	            return res.result;
	          }
	      }
	    } catch (e) {
	      throw new SolanaJSONRPCError(e, 'failed to get block');
	    }
	  }
	  /*
	   * Returns recent block production information from the current or previous epoch
	   */
	  async getBlockProduction(configOrCommitment) {
	    let extra;
	    let commitment;
	    if (typeof configOrCommitment === 'string') {
	      commitment = configOrCommitment;
	    } else if (configOrCommitment) {
	      const {
	        commitment: c,
	        ...rest
	      } = configOrCommitment;
	      commitment = c;
	      extra = rest;
	    }
	    const args = this._buildArgs([], commitment, 'base64', extra);
	    const unsafeRes = await this._rpcRequest('getBlockProduction', args);
	    const res = create(unsafeRes, BlockProductionResponseStruct);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get block production information');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch a confirmed or finalized transaction from the cluster.
	   *
	   * @deprecated Instead, call `getTransaction` using a
	   * `GetVersionedTransactionConfig` by setting the
	   * `maxSupportedTransactionVersion` property.
	   */

	  /**
	   * Fetch a confirmed or finalized transaction from the cluster.
	   */
	  // eslint-disable-next-line no-dupe-class-members

	  /**
	   * Fetch a confirmed or finalized transaction from the cluster.
	   */
	  // eslint-disable-next-line no-dupe-class-members
	  async getTransaction(signature, rawConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(rawConfig);
	    const args = this._buildArgsAtLeastConfirmed([signature], commitment, undefined /* encoding */, config);
	    const unsafeRes = await this._rpcRequest('getTransaction', args);
	    const res = create(unsafeRes, GetTransactionRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get transaction');
	    }
	    const result = res.result;
	    if (!result) return result;
	    return {
	      ...result,
	      transaction: {
	        ...result.transaction,
	        message: versionedMessageFromResponse(result.version, result.transaction.message)
	      }
	    };
	  }

	  /**
	   * Fetch parsed transaction details for a confirmed or finalized transaction
	   */
	  async getParsedTransaction(signature, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed', config);
	    const unsafeRes = await this._rpcRequest('getTransaction', args);
	    const res = create(unsafeRes, GetParsedTransactionRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get transaction');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch parsed transaction details for a batch of confirmed transactions
	   */
	  async getParsedTransactions(signatures, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const batch = signatures.map(signature => {
	      const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed', config);
	      return {
	        methodName: 'getTransaction',
	        args
	      };
	    });
	    const unsafeRes = await this._rpcBatchRequest(batch);
	    const res = unsafeRes.map(unsafeRes => {
	      const res = create(unsafeRes, GetParsedTransactionRpcResult);
	      if ('error' in res) {
	        throw new SolanaJSONRPCError(res.error, 'failed to get transactions');
	      }
	      return res.result;
	    });
	    return res;
	  }

	  /**
	   * Fetch transaction details for a batch of confirmed transactions.
	   * Similar to {@link getParsedTransactions} but returns a {@link TransactionResponse}.
	   *
	   * @deprecated Instead, call `getTransactions` using a
	   * `GetVersionedTransactionConfig` by setting the
	   * `maxSupportedTransactionVersion` property.
	   */

	  /**
	   * Fetch transaction details for a batch of confirmed transactions.
	   * Similar to {@link getParsedTransactions} but returns a {@link
	   * VersionedTransactionResponse}.
	   */
	  // eslint-disable-next-line no-dupe-class-members

	  /**
	   * Fetch transaction details for a batch of confirmed transactions.
	   * Similar to {@link getParsedTransactions} but returns a {@link
	   * VersionedTransactionResponse}.
	   */
	  // eslint-disable-next-line no-dupe-class-members
	  async getTransactions(signatures, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const batch = signatures.map(signature => {
	      const args = this._buildArgsAtLeastConfirmed([signature], commitment, undefined /* encoding */, config);
	      return {
	        methodName: 'getTransaction',
	        args
	      };
	    });
	    const unsafeRes = await this._rpcBatchRequest(batch);
	    const res = unsafeRes.map(unsafeRes => {
	      const res = create(unsafeRes, GetTransactionRpcResult);
	      if ('error' in res) {
	        throw new SolanaJSONRPCError(res.error, 'failed to get transactions');
	      }
	      const result = res.result;
	      if (!result) return result;
	      return {
	        ...result,
	        transaction: {
	          ...result.transaction,
	          message: versionedMessageFromResponse(result.version, result.transaction.message)
	        }
	      };
	    });
	    return res;
	  }

	  /**
	   * Fetch a list of Transactions and transaction statuses from the cluster
	   * for a confirmed block.
	   *
	   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlock} instead.
	   */
	  async getConfirmedBlock(slot, commitment) {
	    const args = this._buildArgsAtLeastConfirmed([slot], commitment);
	    const unsafeRes = await this._rpcRequest('getBlock', args);
	    const res = create(unsafeRes, GetConfirmedBlockRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed block');
	    }
	    const result = res.result;
	    if (!result) {
	      throw new Error('Confirmed block ' + slot + ' not found');
	    }
	    const block = {
	      ...result,
	      transactions: result.transactions.map(({
	        transaction,
	        meta
	      }) => {
	        const message = new Message(transaction.message);
	        return {
	          meta,
	          transaction: {
	            ...transaction,
	            message
	          }
	        };
	      })
	    };
	    return {
	      ...block,
	      transactions: block.transactions.map(({
	        transaction,
	        meta
	      }) => {
	        return {
	          meta,
	          transaction: Transaction.populate(transaction.message, transaction.signatures)
	        };
	      })
	    };
	  }

	  /**
	   * Fetch confirmed blocks between two slots
	   */
	  async getBlocks(startSlot, endSlot, commitment) {
	    const args = this._buildArgsAtLeastConfirmed(endSlot !== undefined ? [startSlot, endSlot] : [startSlot], commitment);
	    const unsafeRes = await this._rpcRequest('getBlocks', args);
	    const res = create(unsafeRes, jsonRpcResult(array(number())));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get blocks');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch a list of Signatures from the cluster for a block, excluding rewards
	   */
	  async getBlockSignatures(slot, commitment) {
	    const args = this._buildArgsAtLeastConfirmed([slot], commitment, undefined, {
	      transactionDetails: 'signatures',
	      rewards: false
	    });
	    const unsafeRes = await this._rpcRequest('getBlock', args);
	    const res = create(unsafeRes, GetBlockSignaturesRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get block');
	    }
	    const result = res.result;
	    if (!result) {
	      throw new Error('Block ' + slot + ' not found');
	    }
	    return result;
	  }

	  /**
	   * Fetch a list of Signatures from the cluster for a confirmed block, excluding rewards
	   *
	   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlockSignatures} instead.
	   */
	  async getConfirmedBlockSignatures(slot, commitment) {
	    const args = this._buildArgsAtLeastConfirmed([slot], commitment, undefined, {
	      transactionDetails: 'signatures',
	      rewards: false
	    });
	    const unsafeRes = await this._rpcRequest('getBlock', args);
	    const res = create(unsafeRes, GetBlockSignaturesRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed block');
	    }
	    const result = res.result;
	    if (!result) {
	      throw new Error('Confirmed block ' + slot + ' not found');
	    }
	    return result;
	  }

	  /**
	   * Fetch a transaction details for a confirmed transaction
	   *
	   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getTransaction} instead.
	   */
	  async getConfirmedTransaction(signature, commitment) {
	    const args = this._buildArgsAtLeastConfirmed([signature], commitment);
	    const unsafeRes = await this._rpcRequest('getTransaction', args);
	    const res = create(unsafeRes, GetTransactionRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get transaction');
	    }
	    const result = res.result;
	    if (!result) return result;
	    const message = new Message(result.transaction.message);
	    const signatures = result.transaction.signatures;
	    return {
	      ...result,
	      transaction: Transaction.populate(message, signatures)
	    };
	  }

	  /**
	   * Fetch parsed transaction details for a confirmed transaction
	   *
	   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransaction} instead.
	   */
	  async getParsedConfirmedTransaction(signature, commitment) {
	    const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed');
	    const unsafeRes = await this._rpcRequest('getTransaction', args);
	    const res = create(unsafeRes, GetParsedTransactionRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed transaction');
	    }
	    return res.result;
	  }

	  /**
	   * Fetch parsed transaction details for a batch of confirmed transactions
	   *
	   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransactions} instead.
	   */
	  async getParsedConfirmedTransactions(signatures, commitment) {
	    const batch = signatures.map(signature => {
	      const args = this._buildArgsAtLeastConfirmed([signature], commitment, 'jsonParsed');
	      return {
	        methodName: 'getTransaction',
	        args
	      };
	    });
	    const unsafeRes = await this._rpcBatchRequest(batch);
	    const res = unsafeRes.map(unsafeRes => {
	      const res = create(unsafeRes, GetParsedTransactionRpcResult);
	      if ('error' in res) {
	        throw new SolanaJSONRPCError(res.error, 'failed to get confirmed transactions');
	      }
	      return res.result;
	    });
	    return res;
	  }

	  /**
	   * Fetch a list of all the confirmed signatures for transactions involving an address
	   * within a specified slot range. Max range allowed is 10,000 slots.
	   *
	   * @deprecated Deprecated since RPC v1.3. Please use {@link getConfirmedSignaturesForAddress2} instead.
	   *
	   * @param address queried address
	   * @param startSlot start slot, inclusive
	   * @param endSlot end slot, inclusive
	   */
	  async getConfirmedSignaturesForAddress(address, startSlot, endSlot) {
	    let options = {};
	    let firstAvailableBlock = await this.getFirstAvailableBlock();
	    while (!('until' in options)) {
	      startSlot--;
	      if (startSlot <= 0 || startSlot < firstAvailableBlock) {
	        break;
	      }
	      try {
	        const block = await this.getConfirmedBlockSignatures(startSlot, 'finalized');
	        if (block.signatures.length > 0) {
	          options.until = block.signatures[block.signatures.length - 1].toString();
	        }
	      } catch (err) {
	        if (err instanceof Error && err.message.includes('skipped')) {
	          continue;
	        } else {
	          throw err;
	        }
	      }
	    }
	    let highestConfirmedRoot = await this.getSlot('finalized');
	    while (!('before' in options)) {
	      endSlot++;
	      if (endSlot > highestConfirmedRoot) {
	        break;
	      }
	      try {
	        const block = await this.getConfirmedBlockSignatures(endSlot);
	        if (block.signatures.length > 0) {
	          options.before = block.signatures[block.signatures.length - 1].toString();
	        }
	      } catch (err) {
	        if (err instanceof Error && err.message.includes('skipped')) {
	          continue;
	        } else {
	          throw err;
	        }
	      }
	    }
	    const confirmedSignatureInfo = await this.getConfirmedSignaturesForAddress2(address, options);
	    return confirmedSignatureInfo.map(info => info.signature);
	  }

	  /**
	   * Returns confirmed signatures for transactions involving an
	   * address backwards in time from the provided signature or most recent confirmed block
	   *
	   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getSignaturesForAddress} instead.
	   */
	  async getConfirmedSignaturesForAddress2(address, options, commitment) {
	    const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, undefined, options);
	    const unsafeRes = await this._rpcRequest('getConfirmedSignaturesForAddress2', args);
	    const res = create(unsafeRes, GetConfirmedSignaturesForAddress2RpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get confirmed signatures for address');
	    }
	    return res.result;
	  }

	  /**
	   * Returns confirmed signatures for transactions involving an
	   * address backwards in time from the provided signature or most recent confirmed block
	   *
	   *
	   * @param address queried address
	   * @param options
	   */
	  async getSignaturesForAddress(address, options, commitment) {
	    const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, undefined, options);
	    const unsafeRes = await this._rpcRequest('getSignaturesForAddress', args);
	    const res = create(unsafeRes, GetSignaturesForAddressRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, 'failed to get signatures for address');
	    }
	    return res.result;
	  }
	  async getAddressLookupTable(accountKey, config) {
	    const {
	      context,
	      value: accountInfo
	    } = await this.getAccountInfoAndContext(accountKey, config);
	    let value = null;
	    if (accountInfo !== null) {
	      value = new AddressLookupTableAccount({
	        key: accountKey,
	        state: AddressLookupTableAccount.deserialize(accountInfo.data)
	      });
	    }
	    return {
	      context,
	      value
	    };
	  }

	  /**
	   * Fetch the contents of a Nonce account from the cluster, return with context
	   */
	  async getNonceAndContext(nonceAccount, commitmentOrConfig) {
	    const {
	      context,
	      value: accountInfo
	    } = await this.getAccountInfoAndContext(nonceAccount, commitmentOrConfig);
	    let value = null;
	    if (accountInfo !== null) {
	      value = NonceAccount.fromAccountData(accountInfo.data);
	    }
	    return {
	      context,
	      value
	    };
	  }

	  /**
	   * Fetch the contents of a Nonce account from the cluster
	   */
	  async getNonce(nonceAccount, commitmentOrConfig) {
	    return await this.getNonceAndContext(nonceAccount, commitmentOrConfig).then(x => x.value).catch(e => {
	      throw new Error('failed to get nonce for account ' + nonceAccount.toBase58() + ': ' + e);
	    });
	  }

	  /**
	   * Request an allocation of lamports to the specified address
	   *
	   * ```typescript
	   * import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
	   *
	   * (async () => {
	   *   const connection = new Connection("https://api.testnet.solana.com", "confirmed");
	   *   const myAddress = new PublicKey("2nr1bHFT86W9tGnyvmYW4vcHKsQB3sVQfnddasz4kExM");
	   *   const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL);
	   *   await connection.confirmTransaction(signature);
	   * })();
	   * ```
	   */
	  async requestAirdrop(to, lamports) {
	    const unsafeRes = await this._rpcRequest('requestAirdrop', [to.toBase58(), lamports]);
	    const res = create(unsafeRes, RequestAirdropRpcResult);
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `airdrop to ${to.toBase58()} failed`);
	    }
	    return res.result;
	  }

	  /**
	   * @internal
	   */
	  async _blockhashWithExpiryBlockHeight(disableCache) {
	    if (!disableCache) {
	      // Wait for polling to finish
	      while (this._pollingBlockhash) {
	        await sleep(100);
	      }
	      const timeSinceFetch = Date.now() - this._blockhashInfo.lastFetch;
	      const expired = timeSinceFetch >= BLOCKHASH_CACHE_TIMEOUT_MS;
	      if (this._blockhashInfo.latestBlockhash !== null && !expired) {
	        return this._blockhashInfo.latestBlockhash;
	      }
	    }
	    return await this._pollNewBlockhash();
	  }

	  /**
	   * @internal
	   */
	  async _pollNewBlockhash() {
	    this._pollingBlockhash = true;
	    try {
	      const startTime = Date.now();
	      const cachedLatestBlockhash = this._blockhashInfo.latestBlockhash;
	      const cachedBlockhash = cachedLatestBlockhash ? cachedLatestBlockhash.blockhash : null;
	      for (let i = 0; i < 50; i++) {
	        const latestBlockhash = await this.getLatestBlockhash('finalized');
	        if (cachedBlockhash !== latestBlockhash.blockhash) {
	          this._blockhashInfo = {
	            latestBlockhash,
	            lastFetch: Date.now(),
	            transactionSignatures: [],
	            simulatedSignatures: []
	          };
	          return latestBlockhash;
	        }

	        // Sleep for approximately half a slot
	        await sleep(MS_PER_SLOT / 2);
	      }
	      throw new Error(`Unable to obtain a new blockhash after ${Date.now() - startTime}ms`);
	    } finally {
	      this._pollingBlockhash = false;
	    }
	  }

	  /**
	   * get the stake minimum delegation
	   */
	  async getStakeMinimumDelegation(config) {
	    const {
	      commitment,
	      config: configArg
	    } = extractCommitmentFromConfig(config);
	    const args = this._buildArgs([], commitment, 'base64', configArg);
	    const unsafeRes = await this._rpcRequest('getStakeMinimumDelegation', args);
	    const res = create(unsafeRes, jsonRpcResultAndContext(number()));
	    if ('error' in res) {
	      throw new SolanaJSONRPCError(res.error, `failed to get stake minimum delegation`);
	    }
	    return res.result;
	  }

	  /**
	   * Simulate a transaction
	   *
	   * @deprecated Instead, call {@link simulateTransaction} with {@link
	   * VersionedTransaction} and {@link SimulateTransactionConfig} parameters
	   */

	  /**
	   * Simulate a transaction
	   */
	  // eslint-disable-next-line no-dupe-class-members

	  /**
	   * Simulate a transaction
	   */
	  // eslint-disable-next-line no-dupe-class-members
	  async simulateTransaction(transactionOrMessage, configOrSigners, includeAccounts) {
	    if ('message' in transactionOrMessage) {
	      const versionedTx = transactionOrMessage;
	      const wireTransaction = versionedTx.serialize();
	      const encodedTransaction = bufferExports.Buffer.from(wireTransaction).toString('base64');
	      if (Array.isArray(configOrSigners) || includeAccounts !== undefined) {
	        throw new Error('Invalid arguments');
	      }
	      const config = configOrSigners || {};
	      config.encoding = 'base64';
	      if (!('commitment' in config)) {
	        config.commitment = this.commitment;
	      }
	      if (configOrSigners && typeof configOrSigners === 'object' && 'innerInstructions' in configOrSigners) {
	        config.innerInstructions = configOrSigners.innerInstructions;
	      }
	      const args = [encodedTransaction, config];
	      const unsafeRes = await this._rpcRequest('simulateTransaction', args);
	      const res = create(unsafeRes, SimulatedTransactionResponseStruct);
	      if ('error' in res) {
	        throw new Error('failed to simulate transaction: ' + res.error.message);
	      }
	      return res.result;
	    }
	    let transaction;
	    if (transactionOrMessage instanceof Transaction) {
	      let originalTx = transactionOrMessage;
	      transaction = new Transaction();
	      transaction.feePayer = originalTx.feePayer;
	      transaction.instructions = transactionOrMessage.instructions;
	      transaction.nonceInfo = originalTx.nonceInfo;
	      transaction.signatures = originalTx.signatures;
	    } else {
	      transaction = Transaction.populate(transactionOrMessage);
	      // HACK: this function relies on mutating the populated transaction
	      transaction._message = transaction._json = undefined;
	    }
	    if (configOrSigners !== undefined && !Array.isArray(configOrSigners)) {
	      throw new Error('Invalid arguments');
	    }
	    const signers = configOrSigners;
	    if (transaction.nonceInfo && signers) {
	      transaction.sign(...signers);
	    } else {
	      let disableCache = this._disableBlockhashCaching;
	      for (;;) {
	        const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
	        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
	        transaction.recentBlockhash = latestBlockhash.blockhash;
	        if (!signers) break;
	        transaction.sign(...signers);
	        if (!transaction.signature) {
	          throw new Error('!signature'); // should never happen
	        }
	        const signature = transaction.signature.toString('base64');
	        if (!this._blockhashInfo.simulatedSignatures.includes(signature) && !this._blockhashInfo.transactionSignatures.includes(signature)) {
	          // The signature of this transaction has not been seen before with the
	          // current recentBlockhash, all done. Let's break
	          this._blockhashInfo.simulatedSignatures.push(signature);
	          break;
	        } else {
	          // This transaction would be treated as duplicate (its derived signature
	          // matched to one of already recorded signatures).
	          // So, we must fetch a new blockhash for a different signature by disabling
	          // our cache not to wait for the cache expiration (BLOCKHASH_CACHE_TIMEOUT_MS).
	          disableCache = true;
	        }
	      }
	    }
	    const message = transaction._compile();
	    const signData = message.serialize();
	    const wireTransaction = transaction._serialize(signData);
	    const encodedTransaction = wireTransaction.toString('base64');
	    const config = {
	      encoding: 'base64',
	      commitment: this.commitment
	    };
	    if (includeAccounts) {
	      const addresses = (Array.isArray(includeAccounts) ? includeAccounts : message.nonProgramIds()).map(key => key.toBase58());
	      config['accounts'] = {
	        encoding: 'base64',
	        addresses
	      };
	    }
	    if (signers) {
	      config.sigVerify = true;
	    }
	    if (configOrSigners && typeof configOrSigners === 'object' && 'innerInstructions' in configOrSigners) {
	      config.innerInstructions = configOrSigners.innerInstructions;
	    }
	    const args = [encodedTransaction, config];
	    const unsafeRes = await this._rpcRequest('simulateTransaction', args);
	    const res = create(unsafeRes, SimulatedTransactionResponseStruct);
	    if ('error' in res) {
	      let logs;
	      if ('data' in res.error) {
	        logs = res.error.data.logs;
	        if (logs && Array.isArray(logs)) {
	          const traceIndent = '\n    ';
	          const logTrace = traceIndent + logs.join(traceIndent);
	          console.error(res.error.message, logTrace);
	        }
	      }
	      throw new SendTransactionError({
	        action: 'simulate',
	        signature: '',
	        transactionMessage: res.error.message,
	        logs: logs
	      });
	    }
	    return res.result;
	  }

	  /**
	   * Sign and send a transaction
	   *
	   * @deprecated Instead, call {@link sendTransaction} with a {@link
	   * VersionedTransaction}
	   */

	  /**
	   * Send a signed transaction
	   */
	  // eslint-disable-next-line no-dupe-class-members

	  /**
	   * Sign and send a transaction
	   */
	  // eslint-disable-next-line no-dupe-class-members
	  async sendTransaction(transaction, signersOrOptions, options) {
	    if ('version' in transaction) {
	      if (signersOrOptions && Array.isArray(signersOrOptions)) {
	        throw new Error('Invalid arguments');
	      }
	      const wireTransaction = transaction.serialize();
	      return await this.sendRawTransaction(wireTransaction, signersOrOptions);
	    }
	    if (signersOrOptions === undefined || !Array.isArray(signersOrOptions)) {
	      throw new Error('Invalid arguments');
	    }
	    const signers = signersOrOptions;
	    if (transaction.nonceInfo) {
	      transaction.sign(...signers);
	    } else {
	      let disableCache = this._disableBlockhashCaching;
	      for (;;) {
	        const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
	        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
	        transaction.recentBlockhash = latestBlockhash.blockhash;
	        transaction.sign(...signers);
	        if (!transaction.signature) {
	          throw new Error('!signature'); // should never happen
	        }
	        const signature = transaction.signature.toString('base64');
	        if (!this._blockhashInfo.transactionSignatures.includes(signature)) {
	          // The signature of this transaction has not been seen before with the
	          // current recentBlockhash, all done. Let's break
	          this._blockhashInfo.transactionSignatures.push(signature);
	          break;
	        } else {
	          // This transaction would be treated as duplicate (its derived signature
	          // matched to one of already recorded signatures).
	          // So, we must fetch a new blockhash for a different signature by disabling
	          // our cache not to wait for the cache expiration (BLOCKHASH_CACHE_TIMEOUT_MS).
	          disableCache = true;
	        }
	      }
	    }
	    const wireTransaction = transaction.serialize();
	    return await this.sendRawTransaction(wireTransaction, options);
	  }

	  /**
	   * Send a transaction that has already been signed and serialized into the
	   * wire format
	   */
	  async sendRawTransaction(rawTransaction, options) {
	    const encodedTransaction = toBuffer(rawTransaction).toString('base64');
	    const result = await this.sendEncodedTransaction(encodedTransaction, options);
	    return result;
	  }

	  /**
	   * Send a transaction that has already been signed, serialized into the
	   * wire format, and encoded as a base64 string
	   */
	  async sendEncodedTransaction(encodedTransaction, options) {
	    const config = {
	      encoding: 'base64'
	    };
	    const skipPreflight = options && options.skipPreflight;
	    const preflightCommitment = skipPreflight === true ? 'processed' // FIXME Remove when https://github.com/anza-xyz/agave/pull/483 is deployed.
	    : options && options.preflightCommitment || this.commitment;
	    if (options && options.maxRetries != null) {
	      config.maxRetries = options.maxRetries;
	    }
	    if (options && options.minContextSlot != null) {
	      config.minContextSlot = options.minContextSlot;
	    }
	    if (skipPreflight) {
	      config.skipPreflight = skipPreflight;
	    }
	    if (preflightCommitment) {
	      config.preflightCommitment = preflightCommitment;
	    }
	    const args = [encodedTransaction, config];
	    const unsafeRes = await this._rpcRequest('sendTransaction', args);
	    const res = create(unsafeRes, SendTransactionRpcResult);
	    if ('error' in res) {
	      let logs = undefined;
	      if ('data' in res.error) {
	        logs = res.error.data.logs;
	      }
	      throw new SendTransactionError({
	        action: skipPreflight ? 'send' : 'simulate',
	        signature: '',
	        transactionMessage: res.error.message,
	        logs: logs
	      });
	    }
	    return res.result;
	  }

	  /**
	   * @internal
	   */
	  _wsOnOpen() {
	    this._rpcWebSocketConnected = true;
	    this._rpcWebSocketHeartbeat = setInterval(() => {
	      // Ping server every 5s to prevent idle timeouts
	      (async () => {
	        try {
	          await this._rpcWebSocket.notify('ping');
	          // eslint-disable-next-line no-empty
	        } catch {}
	      })();
	    }, 5000);
	    this._updateSubscriptions();
	  }

	  /**
	   * @internal
	   */
	  _wsOnError(err) {
	    this._rpcWebSocketConnected = false;
	    console.error('ws error:', err.message);
	  }

	  /**
	   * @internal
	   */
	  _wsOnClose(code) {
	    this._rpcWebSocketConnected = false;
	    this._rpcWebSocketGeneration = (this._rpcWebSocketGeneration + 1) % Number.MAX_SAFE_INTEGER;
	    if (this._rpcWebSocketIdleTimeout) {
	      clearTimeout(this._rpcWebSocketIdleTimeout);
	      this._rpcWebSocketIdleTimeout = null;
	    }
	    if (this._rpcWebSocketHeartbeat) {
	      clearInterval(this._rpcWebSocketHeartbeat);
	      this._rpcWebSocketHeartbeat = null;
	    }
	    if (code === 1000) {
	      // explicit close, check if any subscriptions have been made since close
	      this._updateSubscriptions();
	      return;
	    }

	    // implicit close, prepare subscriptions for auto-reconnect
	    this._subscriptionCallbacksByServerSubscriptionId = {};
	    Object.entries(this._subscriptionsByHash).forEach(([hash, subscription]) => {
	      this._setSubscription(hash, {
	        ...subscription,
	        state: 'pending'
	      });
	    });
	  }

	  /**
	   * @internal
	   */
	  _setSubscription(hash, nextSubscription) {
	    const prevState = this._subscriptionsByHash[hash]?.state;
	    this._subscriptionsByHash[hash] = nextSubscription;
	    if (prevState !== nextSubscription.state) {
	      const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash];
	      if (stateChangeCallbacks) {
	        stateChangeCallbacks.forEach(cb => {
	          try {
	            cb(nextSubscription.state);
	            // eslint-disable-next-line no-empty
	          } catch {}
	        });
	      }
	    }
	  }

	  /**
	   * @internal
	   */
	  _onSubscriptionStateChange(clientSubscriptionId, callback) {
	    const hash = this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
	    if (hash == null) {
	      return () => {};
	    }
	    const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash] ||= new Set();
	    stateChangeCallbacks.add(callback);
	    return () => {
	      stateChangeCallbacks.delete(callback);
	      if (stateChangeCallbacks.size === 0) {
	        delete this._subscriptionStateChangeCallbacksByHash[hash];
	      }
	    };
	  }

	  /**
	   * @internal
	   */
	  async _updateSubscriptions() {
	    if (Object.keys(this._subscriptionsByHash).length === 0) {
	      if (this._rpcWebSocketConnected) {
	        this._rpcWebSocketConnected = false;
	        this._rpcWebSocketIdleTimeout = setTimeout(() => {
	          this._rpcWebSocketIdleTimeout = null;
	          try {
	            this._rpcWebSocket.close();
	          } catch (err) {
	            // swallow error if socket has already been closed.
	            if (err instanceof Error) {
	              console.log(`Error when closing socket connection: ${err.message}`);
	            }
	          }
	        }, 500);
	      }
	      return;
	    }
	    if (this._rpcWebSocketIdleTimeout !== null) {
	      clearTimeout(this._rpcWebSocketIdleTimeout);
	      this._rpcWebSocketIdleTimeout = null;
	      this._rpcWebSocketConnected = true;
	    }
	    if (!this._rpcWebSocketConnected) {
	      this._rpcWebSocket.connect();
	      return;
	    }
	    const activeWebSocketGeneration = this._rpcWebSocketGeneration;
	    const isCurrentConnectionStillActive = () => {
	      return activeWebSocketGeneration === this._rpcWebSocketGeneration;
	    };
	    await Promise.all(
	    // Don't be tempted to change this to `Object.entries`. We call
	    // `_updateSubscriptions` recursively when processing the state,
	    // so it's important that we look up the *current* version of
	    // each subscription, every time we process a hash.
	    Object.keys(this._subscriptionsByHash).map(async hash => {
	      const subscription = this._subscriptionsByHash[hash];
	      if (subscription === undefined) {
	        // This entry has since been deleted. Skip.
	        return;
	      }
	      switch (subscription.state) {
	        case 'pending':
	        case 'unsubscribed':
	          if (subscription.callbacks.size === 0) {
	            /**
	             * You can end up here when:
	             *
	             * - a subscription has recently unsubscribed
	             *   without having new callbacks added to it
	             *   while the unsubscribe was in flight, or
	             * - when a pending subscription has its
	             *   listeners removed before a request was
	             *   sent to the server.
	             *
	             * Being that nobody is interested in this
	             * subscription any longer, delete it.
	             */
	            delete this._subscriptionsByHash[hash];
	            if (subscription.state === 'unsubscribed') {
	              delete this._subscriptionCallbacksByServerSubscriptionId[subscription.serverSubscriptionId];
	            }
	            await this._updateSubscriptions();
	            return;
	          }
	          await (async () => {
	            const {
	              args,
	              method
	            } = subscription;
	            try {
	              this._setSubscription(hash, {
	                ...subscription,
	                state: 'subscribing'
	              });
	              const serverSubscriptionId = await this._rpcWebSocket.call(method, args);
	              this._setSubscription(hash, {
	                ...subscription,
	                serverSubscriptionId,
	                state: 'subscribed'
	              });
	              this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId] = subscription.callbacks;
	              await this._updateSubscriptions();
	            } catch (e) {
	              console.error(`Received ${e instanceof Error ? '' : 'JSON-RPC '}error calling \`${method}\``, {
	                args,
	                error: e
	              });
	              if (!isCurrentConnectionStillActive()) {
	                return;
	              }
	              // TODO: Maybe add an 'errored' state or a retry limit?
	              this._setSubscription(hash, {
	                ...subscription,
	                state: 'pending'
	              });
	              await this._updateSubscriptions();
	            }
	          })();
	          break;
	        case 'subscribed':
	          if (subscription.callbacks.size === 0) {
	            // By the time we successfully set up a subscription
	            // with the server, the client stopped caring about it.
	            // Tear it down now.
	            await (async () => {
	              const {
	                serverSubscriptionId,
	                unsubscribeMethod
	              } = subscription;
	              if (this._subscriptionsAutoDisposedByRpc.has(serverSubscriptionId)) {
	                /**
	                 * Special case.
	                 * If we're dealing with a subscription that has been auto-
	                 * disposed by the RPC, then we can skip the RPC call to
	                 * tear down the subscription here.
	                 *
	                 * NOTE: There is a proposal to eliminate this special case, here:
	                 * https://github.com/solana-labs/solana/issues/18892
	                 */
	                this._subscriptionsAutoDisposedByRpc.delete(serverSubscriptionId);
	              } else {
	                this._setSubscription(hash, {
	                  ...subscription,
	                  state: 'unsubscribing'
	                });
	                this._setSubscription(hash, {
	                  ...subscription,
	                  state: 'unsubscribing'
	                });
	                try {
	                  await this._rpcWebSocket.call(unsubscribeMethod, [serverSubscriptionId]);
	                } catch (e) {
	                  if (e instanceof Error) {
	                    console.error(`${unsubscribeMethod} error:`, e.message);
	                  }
	                  if (!isCurrentConnectionStillActive()) {
	                    return;
	                  }
	                  // TODO: Maybe add an 'errored' state or a retry limit?
	                  this._setSubscription(hash, {
	                    ...subscription,
	                    state: 'subscribed'
	                  });
	                  await this._updateSubscriptions();
	                  return;
	                }
	              }
	              this._setSubscription(hash, {
	                ...subscription,
	                state: 'unsubscribed'
	              });
	              await this._updateSubscriptions();
	            })();
	          }
	          break;
	      }
	    }));
	  }

	  /**
	   * @internal
	   */
	  _handleServerNotification(serverSubscriptionId, callbackArgs) {
	    const callbacks = this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId];
	    if (callbacks === undefined) {
	      return;
	    }
	    callbacks.forEach(cb => {
	      try {
	        cb(
	        // I failed to find a way to convince TypeScript that `cb` is of type
	        // `TCallback` which is certainly compatible with `Parameters<TCallback>`.
	        // See https://github.com/microsoft/TypeScript/issues/47615
	        // @ts-ignore
	        ...callbackArgs);
	      } catch (e) {
	        console.error(e);
	      }
	    });
	  }

	  /**
	   * @internal
	   */
	  _wsOnAccountNotification(notification) {
	    const {
	      result,
	      subscription
	    } = create(notification, AccountNotificationResult);
	    this._handleServerNotification(subscription, [result.value, result.context]);
	  }

	  /**
	   * @internal
	   */
	  _makeSubscription(subscriptionConfig,
	  /**
	   * When preparing `args` for a call to `_makeSubscription`, be sure
	   * to carefully apply a default `commitment` property, if necessary.
	   *
	   * - If the user supplied a `commitment` use that.
	   * - Otherwise, if the `Connection::commitment` is set, use that.
	   * - Otherwise, set it to the RPC server default: `finalized`.
	   *
	   * This is extremely important to ensure that these two fundamentally
	   * identical subscriptions produce the same identifying hash:
	   *
	   * - A subscription made without specifying a commitment.
	   * - A subscription made where the commitment specified is the same
	   *   as the default applied to the subscription above.
	   *
	   * Example; these two subscriptions must produce the same hash:
	   *
	   * - An `accountSubscribe` subscription for `'PUBKEY'`
	   * - An `accountSubscribe` subscription for `'PUBKEY'` with commitment
	   *   `'finalized'`.
	   *
	   * See the 'making a subscription with defaulted params omitted' test
	   * in `connection-subscriptions.ts` for more.
	   */
	  args) {
	    const clientSubscriptionId = this._nextClientSubscriptionId++;
	    const hash = fastStableStringify([subscriptionConfig.method, args]);
	    const existingSubscription = this._subscriptionsByHash[hash];
	    if (existingSubscription === undefined) {
	      this._subscriptionsByHash[hash] = {
	        ...subscriptionConfig,
	        args,
	        callbacks: new Set([subscriptionConfig.callback]),
	        state: 'pending'
	      };
	    } else {
	      existingSubscription.callbacks.add(subscriptionConfig.callback);
	    }
	    this._subscriptionHashByClientSubscriptionId[clientSubscriptionId] = hash;
	    this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId] = async () => {
	      delete this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
	      delete this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
	      const subscription = this._subscriptionsByHash[hash];
	      assert$1(subscription !== undefined, `Could not find a \`Subscription\` when tearing down client subscription #${clientSubscriptionId}`);
	      subscription.callbacks.delete(subscriptionConfig.callback);
	      await this._updateSubscriptions();
	    };
	    this._updateSubscriptions();
	    return clientSubscriptionId;
	  }

	  /**
	   * Register a callback to be invoked whenever the specified account changes
	   *
	   * @param publicKey Public key of the account to monitor
	   * @param callback Function to invoke whenever the account is changed
	   * @param config
	   * @return subscription id
	   */

	  /** @deprecated Instead, pass in an {@link AccountSubscriptionConfig} */
	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members
	  onAccountChange(publicKey, callback, commitmentOrConfig) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([publicKey.toBase58()], commitment || this._commitment || 'finalized',
	    // Apply connection/server default.
	    'base64', config);
	    return this._makeSubscription({
	      callback,
	      method: 'accountSubscribe',
	      unsubscribeMethod: 'accountUnsubscribe'
	    }, args);
	  }

	  /**
	   * Deregister an account notification callback
	   *
	   * @param clientSubscriptionId client subscription id to deregister
	   */
	  async removeAccountChangeListener(clientSubscriptionId) {
	    await this._unsubscribeClientSubscription(clientSubscriptionId, 'account change');
	  }

	  /**
	   * @internal
	   */
	  _wsOnProgramAccountNotification(notification) {
	    const {
	      result,
	      subscription
	    } = create(notification, ProgramAccountNotificationResult);
	    this._handleServerNotification(subscription, [{
	      accountId: result.value.pubkey,
	      accountInfo: result.value.account
	    }, result.context]);
	  }

	  /**
	   * Register a callback to be invoked whenever accounts owned by the
	   * specified program change
	   *
	   * @param programId Public key of the program to monitor
	   * @param callback Function to invoke whenever the account is changed
	   * @param config
	   * @return subscription id
	   */

	  /** @deprecated Instead, pass in a {@link ProgramAccountSubscriptionConfig} */
	  // eslint-disable-next-line no-dupe-class-members

	  // eslint-disable-next-line no-dupe-class-members
	  onProgramAccountChange(programId, callback, commitmentOrConfig, maybeFilters) {
	    const {
	      commitment,
	      config
	    } = extractCommitmentFromConfig(commitmentOrConfig);
	    const args = this._buildArgs([programId.toBase58()], commitment || this._commitment || 'finalized',
	    // Apply connection/server default.
	    'base64' /* encoding */, config ? config : maybeFilters ? {
	      filters: applyDefaultMemcmpEncodingToFilters(maybeFilters)
	    } : undefined /* extra */);
	    return this._makeSubscription({
	      callback,
	      method: 'programSubscribe',
	      unsubscribeMethod: 'programUnsubscribe'
	    }, args);
	  }

	  /**
	   * Deregister an account notification callback
	   *
	   * @param clientSubscriptionId client subscription id to deregister
	   */
	  async removeProgramAccountChangeListener(clientSubscriptionId) {
	    await this._unsubscribeClientSubscription(clientSubscriptionId, 'program account change');
	  }

	  /**
	   * Registers a callback to be invoked whenever logs are emitted.
	   */
	  onLogs(filter, callback, commitment) {
	    const args = this._buildArgs([typeof filter === 'object' ? {
	      mentions: [filter.toString()]
	    } : filter], commitment || this._commitment || 'finalized' // Apply connection/server default.
	    );
	    return this._makeSubscription({
	      callback,
	      method: 'logsSubscribe',
	      unsubscribeMethod: 'logsUnsubscribe'
	    }, args);
	  }

	  /**
	   * Deregister a logs callback.
	   *
	   * @param clientSubscriptionId client subscription id to deregister.
	   */
	  async removeOnLogsListener(clientSubscriptionId) {
	    await this._unsubscribeClientSubscription(clientSubscriptionId, 'logs');
	  }

	  /**
	   * @internal
	   */
	  _wsOnLogsNotification(notification) {
	    const {
	      result,
	      subscription
	    } = create(notification, LogsNotificationResult);
	    this._handleServerNotification(subscription, [result.value, result.context]);
	  }

	  /**
	   * @internal
	   */
	  _wsOnSlotNotification(notification) {
	    const {
	      result,
	      subscription
	    } = create(notification, SlotNotificationResult);
	    this._handleServerNotification(subscription, [result]);
	  }

	  /**
	   * Register a callback to be invoked upon slot changes
	   *
	   * @param callback Function to invoke whenever the slot changes
	   * @return subscription id
	   */
	  onSlotChange(callback) {
	    return this._makeSubscription({
	      callback,
	      method: 'slotSubscribe',
	      unsubscribeMethod: 'slotUnsubscribe'
	    }, [] /* args */);
	  }

	  /**
	   * Deregister a slot notification callback
	   *
	   * @param clientSubscriptionId client subscription id to deregister
	   */
	  async removeSlotChangeListener(clientSubscriptionId) {
	    await this._unsubscribeClientSubscription(clientSubscriptionId, 'slot change');
	  }

	  /**
	   * @internal
	   */
	  _wsOnSlotUpdatesNotification(notification) {
	    const {
	      result,
	      subscription
	    } = create(notification, SlotUpdateNotificationResult);
	    this._handleServerNotification(subscription, [result]);
	  }

	  /**
	   * Register a callback to be invoked upon slot updates. {@link SlotUpdate}'s
	   * may be useful to track live progress of a cluster.
	   *
	   * @param callback Function to invoke whenever the slot updates
	   * @return subscription id
	   */
	  onSlotUpdate(callback) {
	    return this._makeSubscription({
	      callback,
	      method: 'slotsUpdatesSubscribe',
	      unsubscribeMethod: 'slotsUpdatesUnsubscribe'
	    }, [] /* args */);
	  }

	  /**
	   * Deregister a slot update notification callback
	   *
	   * @param clientSubscriptionId client subscription id to deregister
	   */
	  async removeSlotUpdateListener(clientSubscriptionId) {
	    await this._unsubscribeClientSubscription(clientSubscriptionId, 'slot update');
	  }

	  /**
	   * @internal
	   */

	  async _unsubscribeClientSubscription(clientSubscriptionId, subscriptionName) {
	    const dispose = this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
	    if (dispose) {
	      await dispose();
	    } else {
	      console.warn('Ignored unsubscribe request because an active subscription with id ' + `\`${clientSubscriptionId}\` for '${subscriptionName}' events ` + 'could not be found.');
	    }
	  }
	  _buildArgs(args, override, encoding, extra) {
	    const commitment = override || this._commitment;
	    if (commitment || encoding || extra) {
	      let options = {};
	      if (encoding) {
	        options.encoding = encoding;
	      }
	      if (commitment) {
	        options.commitment = commitment;
	      }
	      if (extra) {
	        options = Object.assign(options, extra);
	      }
	      args.push(options);
	    }
	    return args;
	  }

	  /**
	   * @internal
	   */
	  _buildArgsAtLeastConfirmed(args, override, encoding, extra) {
	    const commitment = override || this._commitment;
	    if (commitment && !['confirmed', 'finalized'].includes(commitment)) {
	      throw new Error('Using Connection with default commitment: `' + this._commitment + '`, but method requires at least `confirmed`');
	    }
	    return this._buildArgs(args, override, encoding, extra);
	  }

	  /**
	   * @internal
	   */
	  _wsOnSignatureNotification(notification) {
	    const {
	      result,
	      subscription
	    } = create(notification, SignatureNotificationResult);
	    if (result.value !== 'receivedSignature') {
	      /**
	       * Special case.
	       * After a signature is processed, RPCs automatically dispose of the
	       * subscription on the server side. We need to track which of these
	       * subscriptions have been disposed in such a way, so that we know
	       * whether the client is dealing with a not-yet-processed signature
	       * (in which case we must tear down the server subscription) or an
	       * already-processed signature (in which case the client can simply
	       * clear out the subscription locally without telling the server).
	       *
	       * NOTE: There is a proposal to eliminate this special case, here:
	       * https://github.com/solana-labs/solana/issues/18892
	       */
	      this._subscriptionsAutoDisposedByRpc.add(subscription);
	    }
	    this._handleServerNotification(subscription, result.value === 'receivedSignature' ? [{
	      type: 'received'
	    }, result.context] : [{
	      type: 'status',
	      result: result.value
	    }, result.context]);
	  }

	  /**
	   * Register a callback to be invoked upon signature updates
	   *
	   * @param signature Transaction signature string in base 58
	   * @param callback Function to invoke on signature notifications
	   * @param commitment Specify the commitment level signature must reach before notification
	   * @return subscription id
	   */
	  onSignature(signature, callback, commitment) {
	    const args = this._buildArgs([signature], commitment || this._commitment || 'finalized' // Apply connection/server default.
	    );
	    const clientSubscriptionId = this._makeSubscription({
	      callback: (notification, context) => {
	        if (notification.type === 'status') {
	          callback(notification.result, context);
	          // Signatures subscriptions are auto-removed by the RPC service
	          // so no need to explicitly send an unsubscribe message.
	          try {
	            this.removeSignatureListener(clientSubscriptionId);
	            // eslint-disable-next-line no-empty
	          } catch (_err) {
	            // Already removed.
	          }
	        }
	      },
	      method: 'signatureSubscribe',
	      unsubscribeMethod: 'signatureUnsubscribe'
	    }, args);
	    return clientSubscriptionId;
	  }

	  /**
	   * Register a callback to be invoked when a transaction is
	   * received and/or processed.
	   *
	   * @param signature Transaction signature string in base 58
	   * @param callback Function to invoke on signature notifications
	   * @param options Enable received notifications and set the commitment
	   *   level that signature must reach before notification
	   * @return subscription id
	   */
	  onSignatureWithOptions(signature, callback, options) {
	    const {
	      commitment,
	      ...extra
	    } = {
	      ...options,
	      commitment: options && options.commitment || this._commitment || 'finalized' // Apply connection/server default.
	    };
	    const args = this._buildArgs([signature], commitment, undefined /* encoding */, extra);
	    const clientSubscriptionId = this._makeSubscription({
	      callback: (notification, context) => {
	        callback(notification, context);
	        // Signatures subscriptions are auto-removed by the RPC service
	        // so no need to explicitly send an unsubscribe message.
	        try {
	          this.removeSignatureListener(clientSubscriptionId);
	          // eslint-disable-next-line no-empty
	        } catch (_err) {
	          // Already removed.
	        }
	      },
	      method: 'signatureSubscribe',
	      unsubscribeMethod: 'signatureUnsubscribe'
	    }, args);
	    return clientSubscriptionId;
	  }

	  /**
	   * Deregister a signature notification callback
	   *
	   * @param clientSubscriptionId client subscription id to deregister
	   */
	  async removeSignatureListener(clientSubscriptionId) {
	    await this._unsubscribeClientSubscription(clientSubscriptionId, 'signature result');
	  }

	  /**
	   * @internal
	   */
	  _wsOnRootNotification(notification) {
	    const {
	      result,
	      subscription
	    } = create(notification, RootNotificationResult);
	    this._handleServerNotification(subscription, [result]);
	  }

	  /**
	   * Register a callback to be invoked upon root changes
	   *
	   * @param callback Function to invoke whenever the root changes
	   * @return subscription id
	   */
	  onRootChange(callback) {
	    return this._makeSubscription({
	      callback,
	      method: 'rootSubscribe',
	      unsubscribeMethod: 'rootUnsubscribe'
	    }, [] /* args */);
	  }

	  /**
	   * Deregister a root notification callback
	   *
	   * @param clientSubscriptionId client subscription id to deregister
	   */
	  async removeRootChangeListener(clientSubscriptionId) {
	    await this._unsubscribeClientSubscription(clientSubscriptionId, 'root change');
	  }
	}

	/**
	 * Keypair signer interface
	 */

	/**
	 * An account keypair used for signing transactions.
	 */
	class Keypair {
	  /**
	   * Create a new keypair instance.
	   * Generate random keypair if no {@link Ed25519Keypair} is provided.
	   *
	   * @param {Ed25519Keypair} keypair ed25519 keypair
	   */
	  constructor(keypair) {
	    this._keypair = void 0;
	    this._keypair = keypair ?? generateKeypair();
	  }

	  /**
	   * Generate a new random keypair
	   *
	   * @returns {Keypair} Keypair
	   */
	  static generate() {
	    return new Keypair(generateKeypair());
	  }

	  /**
	   * Create a keypair from a raw secret key byte array.
	   *
	   * This method should only be used to recreate a keypair from a previously
	   * generated secret key. Generating keypairs from a random seed should be done
	   * with the {@link Keypair.fromSeed} method.
	   *
	   * @throws error if the provided secret key is invalid and validation is not skipped.
	   *
	   * @param secretKey secret key byte array
	   * @param options skip secret key validation
	   *
	   * @returns {Keypair} Keypair
	   */
	  static fromSecretKey(secretKey, options) {
	    if (secretKey.byteLength !== 64) {
	      throw new Error('bad secret key size');
	    }
	    const publicKey = secretKey.slice(32, 64);
	    if (!options || !options.skipValidation) {
	      const privateScalar = secretKey.slice(0, 32);
	      const computedPublicKey = getPublicKey(privateScalar);
	      for (let ii = 0; ii < 32; ii++) {
	        if (publicKey[ii] !== computedPublicKey[ii]) {
	          throw new Error('provided secretKey is invalid');
	        }
	      }
	    }
	    return new Keypair({
	      publicKey,
	      secretKey
	    });
	  }

	  /**
	   * Generate a keypair from a 32 byte seed.
	   *
	   * @param seed seed byte array
	   *
	   * @returns {Keypair} Keypair
	   */
	  static fromSeed(seed) {
	    const publicKey = getPublicKey(seed);
	    const secretKey = new Uint8Array(64);
	    secretKey.set(seed);
	    secretKey.set(publicKey, 32);
	    return new Keypair({
	      publicKey,
	      secretKey
	    });
	  }

	  /**
	   * The public key for this keypair
	   *
	   * @returns {PublicKey} PublicKey
	   */
	  get publicKey() {
	    return new PublicKey(this._keypair.publicKey);
	  }

	  /**
	   * The raw secret key for this keypair
	   * @returns {Uint8Array} Secret key in an array of Uint8 bytes
	   */
	  get secretKey() {
	    return new Uint8Array(this._keypair.secretKey);
	  }
	}

	/**
	 * An enumeration of valid LookupTableInstructionType's
	 */

	/**
	 * An enumeration of valid address lookup table InstructionType's
	 * @internal
	 */
	const LOOKUP_TABLE_INSTRUCTION_LAYOUTS = Object.freeze({
	  CreateLookupTable: {
	    index: 0,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), u64('recentSlot'), LayoutExports.u8('bumpSeed')])
	  },
	  FreezeLookupTable: {
	    index: 1,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  },
	  ExtendLookupTable: {
	    index: 2,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), u64(), LayoutExports.seq(publicKey(), LayoutExports.offset(LayoutExports.u32(), -8), 'addresses')])
	  },
	  DeactivateLookupTable: {
	    index: 3,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  },
	  CloseLookupTable: {
	    index: 4,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  }
	});
	class AddressLookupTableInstruction {
	  /**
	   * @internal
	   */
	  constructor() {}
	  static decodeInstructionType(instruction) {
	    this.checkProgramId(instruction.programId);
	    const instructionTypeLayout = LayoutExports.u32('instruction');
	    const index = instructionTypeLayout.decode(instruction.data);
	    let type;
	    for (const [layoutType, layout] of Object.entries(LOOKUP_TABLE_INSTRUCTION_LAYOUTS)) {
	      if (layout.index == index) {
	        type = layoutType;
	        break;
	      }
	    }
	    if (!type) {
	      throw new Error('Invalid Instruction. Should be a LookupTable Instruction');
	    }
	    return type;
	  }
	  static decodeCreateLookupTable(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeysLength(instruction.keys, 4);
	    const {
	      recentSlot
	    } = decodeData$1(LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CreateLookupTable, instruction.data);
	    return {
	      authority: instruction.keys[1].pubkey,
	      payer: instruction.keys[2].pubkey,
	      recentSlot: Number(recentSlot)
	    };
	  }
	  static decodeExtendLookupTable(instruction) {
	    this.checkProgramId(instruction.programId);
	    if (instruction.keys.length < 2) {
	      throw new Error(`invalid instruction; found ${instruction.keys.length} keys, expected at least 2`);
	    }
	    const {
	      addresses
	    } = decodeData$1(LOOKUP_TABLE_INSTRUCTION_LAYOUTS.ExtendLookupTable, instruction.data);
	    return {
	      lookupTable: instruction.keys[0].pubkey,
	      authority: instruction.keys[1].pubkey,
	      payer: instruction.keys.length > 2 ? instruction.keys[2].pubkey : undefined,
	      addresses: addresses.map(buffer => new PublicKey(buffer))
	    };
	  }
	  static decodeCloseLookupTable(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeysLength(instruction.keys, 3);
	    return {
	      lookupTable: instruction.keys[0].pubkey,
	      authority: instruction.keys[1].pubkey,
	      recipient: instruction.keys[2].pubkey
	    };
	  }
	  static decodeFreezeLookupTable(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeysLength(instruction.keys, 2);
	    return {
	      lookupTable: instruction.keys[0].pubkey,
	      authority: instruction.keys[1].pubkey
	    };
	  }
	  static decodeDeactivateLookupTable(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeysLength(instruction.keys, 2);
	    return {
	      lookupTable: instruction.keys[0].pubkey,
	      authority: instruction.keys[1].pubkey
	    };
	  }

	  /**
	   * @internal
	   */
	  static checkProgramId(programId) {
	    if (!programId.equals(AddressLookupTableProgram.programId)) {
	      throw new Error('invalid instruction; programId is not AddressLookupTable Program');
	    }
	  }
	  /**
	   * @internal
	   */
	  static checkKeysLength(keys, expectedLength) {
	    if (keys.length < expectedLength) {
	      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
	    }
	  }
	}
	class AddressLookupTableProgram {
	  /**
	   * @internal
	   */
	  constructor() {}
	  static createLookupTable(params) {
	    const [lookupTableAddress, bumpSeed] = PublicKey.findProgramAddressSync([params.authority.toBuffer(), getU64Encoder().encode(params.recentSlot)], this.programId);
	    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CreateLookupTable;
	    const data = encodeData(type, {
	      recentSlot: BigInt(params.recentSlot),
	      bumpSeed: bumpSeed
	    });
	    const keys = [{
	      pubkey: lookupTableAddress,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: params.authority,
	      isSigner: true,
	      isWritable: false
	    }, {
	      pubkey: params.payer,
	      isSigner: true,
	      isWritable: true
	    }, {
	      pubkey: SystemProgram.programId,
	      isSigner: false,
	      isWritable: false
	    }];
	    return [new TransactionInstruction({
	      programId: this.programId,
	      keys: keys,
	      data: data
	    }), lookupTableAddress];
	  }
	  static freezeLookupTable(params) {
	    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.FreezeLookupTable;
	    const data = encodeData(type);
	    const keys = [{
	      pubkey: params.lookupTable,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: params.authority,
	      isSigner: true,
	      isWritable: false
	    }];
	    return new TransactionInstruction({
	      programId: this.programId,
	      keys: keys,
	      data: data
	    });
	  }
	  static extendLookupTable(params) {
	    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.ExtendLookupTable;
	    const data = encodeData(type, {
	      addresses: params.addresses.map(addr => addr.toBytes())
	    });
	    const keys = [{
	      pubkey: params.lookupTable,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: params.authority,
	      isSigner: true,
	      isWritable: false
	    }];
	    if (params.payer) {
	      keys.push({
	        pubkey: params.payer,
	        isSigner: true,
	        isWritable: true
	      }, {
	        pubkey: SystemProgram.programId,
	        isSigner: false,
	        isWritable: false
	      });
	    }
	    return new TransactionInstruction({
	      programId: this.programId,
	      keys: keys,
	      data: data
	    });
	  }
	  static deactivateLookupTable(params) {
	    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.DeactivateLookupTable;
	    const data = encodeData(type);
	    const keys = [{
	      pubkey: params.lookupTable,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: params.authority,
	      isSigner: true,
	      isWritable: false
	    }];
	    return new TransactionInstruction({
	      programId: this.programId,
	      keys: keys,
	      data: data
	    });
	  }
	  static closeLookupTable(params) {
	    const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CloseLookupTable;
	    const data = encodeData(type);
	    const keys = [{
	      pubkey: params.lookupTable,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: params.authority,
	      isSigner: true,
	      isWritable: false
	    }, {
	      pubkey: params.recipient,
	      isSigner: false,
	      isWritable: true
	    }];
	    return new TransactionInstruction({
	      programId: this.programId,
	      keys: keys,
	      data: data
	    });
	  }
	}
	AddressLookupTableProgram.programId = new PublicKey('AddressLookupTab1e1111111111111111111111111');

	/**
	 * Compute Budget Instruction class
	 */
	class ComputeBudgetInstruction {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Decode a compute budget instruction and retrieve the instruction type.
	   */
	  static decodeInstructionType(instruction) {
	    this.checkProgramId(instruction.programId);
	    const instructionTypeLayout = LayoutExports.u8('instruction');
	    const typeIndex = instructionTypeLayout.decode(instruction.data);
	    let type;
	    for (const [ixType, layout] of Object.entries(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS)) {
	      if (layout.index == typeIndex) {
	        type = ixType;
	        break;
	      }
	    }
	    if (!type) {
	      throw new Error('Instruction type incorrect; not a ComputeBudgetInstruction');
	    }
	    return type;
	  }

	  /**
	   * Decode request units compute budget instruction and retrieve the instruction params.
	   */
	  static decodeRequestUnits(instruction) {
	    this.checkProgramId(instruction.programId);
	    const {
	      units,
	      additionalFee
	    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestUnits, instruction.data);
	    return {
	      units,
	      additionalFee
	    };
	  }

	  /**
	   * Decode request heap frame compute budget instruction and retrieve the instruction params.
	   */
	  static decodeRequestHeapFrame(instruction) {
	    this.checkProgramId(instruction.programId);
	    const {
	      bytes
	    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestHeapFrame, instruction.data);
	    return {
	      bytes
	    };
	  }

	  /**
	   * Decode set compute unit limit compute budget instruction and retrieve the instruction params.
	   */
	  static decodeSetComputeUnitLimit(instruction) {
	    this.checkProgramId(instruction.programId);
	    const {
	      units
	    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitLimit, instruction.data);
	    return {
	      units
	    };
	  }

	  /**
	   * Decode set compute unit price compute budget instruction and retrieve the instruction params.
	   */
	  static decodeSetComputeUnitPrice(instruction) {
	    this.checkProgramId(instruction.programId);
	    const {
	      microLamports
	    } = decodeData$1(COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitPrice, instruction.data);
	    return {
	      microLamports
	    };
	  }

	  /**
	   * @internal
	   */
	  static checkProgramId(programId) {
	    if (!programId.equals(ComputeBudgetProgram.programId)) {
	      throw new Error('invalid instruction; programId is not ComputeBudgetProgram');
	    }
	  }
	}

	/**
	 * An enumeration of valid ComputeBudgetInstructionType's
	 */

	/**
	 * Request units instruction params
	 */

	/**
	 * Request heap frame instruction params
	 */

	/**
	 * Set compute unit limit instruction params
	 */

	/**
	 * Set compute unit price instruction params
	 */

	/**
	 * An enumeration of valid ComputeBudget InstructionType's
	 * @internal
	 */
	const COMPUTE_BUDGET_INSTRUCTION_LAYOUTS = Object.freeze({
	  RequestUnits: {
	    index: 0,
	    layout: LayoutExports.struct([LayoutExports.u8('instruction'), LayoutExports.u32('units'), LayoutExports.u32('additionalFee')])
	  },
	  RequestHeapFrame: {
	    index: 1,
	    layout: LayoutExports.struct([LayoutExports.u8('instruction'), LayoutExports.u32('bytes')])
	  },
	  SetComputeUnitLimit: {
	    index: 2,
	    layout: LayoutExports.struct([LayoutExports.u8('instruction'), LayoutExports.u32('units')])
	  },
	  SetComputeUnitPrice: {
	    index: 3,
	    layout: LayoutExports.struct([LayoutExports.u8('instruction'), u64('microLamports')])
	  }
	});

	/**
	 * Factory class for transaction instructions to interact with the Compute Budget program
	 */
	class ComputeBudgetProgram {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Public key that identifies the Compute Budget program
	   */

	  /**
	   * @deprecated Instead, call {@link setComputeUnitLimit} and/or {@link setComputeUnitPrice}
	   */
	  static requestUnits(params) {
	    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestUnits;
	    const data = encodeData(type, params);
	    return new TransactionInstruction({
	      keys: [],
	      programId: this.programId,
	      data
	    });
	  }
	  static requestHeapFrame(params) {
	    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestHeapFrame;
	    const data = encodeData(type, params);
	    return new TransactionInstruction({
	      keys: [],
	      programId: this.programId,
	      data
	    });
	  }
	  static setComputeUnitLimit(params) {
	    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitLimit;
	    const data = encodeData(type, params);
	    return new TransactionInstruction({
	      keys: [],
	      programId: this.programId,
	      data
	    });
	  }
	  static setComputeUnitPrice(params) {
	    const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitPrice;
	    const data = encodeData(type, {
	      microLamports: BigInt(params.microLamports)
	    });
	    return new TransactionInstruction({
	      keys: [],
	      programId: this.programId,
	      data
	    });
	  }
	}
	ComputeBudgetProgram.programId = new PublicKey('ComputeBudget111111111111111111111111111111');

	const PRIVATE_KEY_BYTES$1 = 64;
	const PUBLIC_KEY_BYTES$1 = 32;
	const SIGNATURE_BYTES = 64;

	/**
	 * Params for creating an ed25519 instruction using a public key
	 */

	/**
	 * Params for creating an ed25519 instruction using a private key
	 */

	const ED25519_INSTRUCTION_LAYOUT = LayoutExports.struct([LayoutExports.u8('numSignatures'), LayoutExports.u8('padding'), LayoutExports.u16('signatureOffset'), LayoutExports.u16('signatureInstructionIndex'), LayoutExports.u16('publicKeyOffset'), LayoutExports.u16('publicKeyInstructionIndex'), LayoutExports.u16('messageDataOffset'), LayoutExports.u16('messageDataSize'), LayoutExports.u16('messageInstructionIndex')]);
	class Ed25519Program {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Public key that identifies the ed25519 program
	   */

	  /**
	   * Create an ed25519 instruction with a public key and signature. The
	   * public key must be a buffer that is 32 bytes long, and the signature
	   * must be a buffer of 64 bytes.
	   */
	  static createInstructionWithPublicKey(params) {
	    const {
	      publicKey,
	      message,
	      signature,
	      instructionIndex
	    } = params;
	    assert$1(publicKey.length === PUBLIC_KEY_BYTES$1, `Public Key must be ${PUBLIC_KEY_BYTES$1} bytes but received ${publicKey.length} bytes`);
	    assert$1(signature.length === SIGNATURE_BYTES, `Signature must be ${SIGNATURE_BYTES} bytes but received ${signature.length} bytes`);
	    const publicKeyOffset = ED25519_INSTRUCTION_LAYOUT.span;
	    const signatureOffset = publicKeyOffset + publicKey.length;
	    const messageDataOffset = signatureOffset + signature.length;
	    const numSignatures = 1;
	    const instructionData = bufferExports.Buffer.alloc(messageDataOffset + message.length);
	    const index = instructionIndex == null ? 0xffff // An index of `u16::MAX` makes it default to the current instruction.
	    : instructionIndex;
	    ED25519_INSTRUCTION_LAYOUT.encode({
	      numSignatures,
	      padding: 0,
	      signatureOffset,
	      signatureInstructionIndex: index,
	      publicKeyOffset,
	      publicKeyInstructionIndex: index,
	      messageDataOffset,
	      messageDataSize: message.length,
	      messageInstructionIndex: index
	    }, instructionData);
	    instructionData.fill(publicKey, publicKeyOffset);
	    instructionData.fill(signature, signatureOffset);
	    instructionData.fill(message, messageDataOffset);
	    return new TransactionInstruction({
	      keys: [],
	      programId: Ed25519Program.programId,
	      data: instructionData
	    });
	  }

	  /**
	   * Create an ed25519 instruction with a private key. The private key
	   * must be a buffer that is 64 bytes long.
	   */
	  static createInstructionWithPrivateKey(params) {
	    const {
	      privateKey,
	      message,
	      instructionIndex
	    } = params;
	    assert$1(privateKey.length === PRIVATE_KEY_BYTES$1, `Private key must be ${PRIVATE_KEY_BYTES$1} bytes but received ${privateKey.length} bytes`);
	    try {
	      const keypair = Keypair.fromSecretKey(privateKey);
	      const publicKey = keypair.publicKey.toBytes();
	      const signature = sign(message, keypair.secretKey);
	      return this.createInstructionWithPublicKey({
	        publicKey,
	        message,
	        signature,
	        instructionIndex
	      });
	    } catch (error) {
	      throw new Error(`Error creating instruction; ${error}`);
	    }
	  }
	}
	Ed25519Program.programId = new PublicKey('Ed25519SigVerify111111111111111111111111111');

	const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
	const _32n = /* @__PURE__ */ BigInt(32);
	// BigUint64Array is too slow as per 2024, so we implement it using Uint32Array.
	// TODO: re-check https://issues.chromium.org/issues/42212588
	function fromBig(n, le = false) {
	    if (le)
	        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
	    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
	}
	function split(lst, le = false) {
	    let Ah = new Uint32Array(lst.length);
	    let Al = new Uint32Array(lst.length);
	    for (let i = 0; i < lst.length; i++) {
	        const { h, l } = fromBig(lst[i], le);
	        [Ah[i], Al[i]] = [h, l];
	    }
	    return [Ah, Al];
	}
	// Left rotate for Shift in [1, 32)
	const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
	const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
	// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
	const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
	const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));

	// SHA3 (keccak) is based on a new design: basically, the internal state is bigger than output size.
	// It's called a sponge function.
	// Various per round constants calculations
	const SHA3_PI = [];
	const SHA3_ROTL = [];
	const _SHA3_IOTA = [];
	const _0n$1 = /* @__PURE__ */ BigInt(0);
	const _1n$2 = /* @__PURE__ */ BigInt(1);
	const _2n$1 = /* @__PURE__ */ BigInt(2);
	const _7n = /* @__PURE__ */ BigInt(7);
	const _256n = /* @__PURE__ */ BigInt(256);
	const _0x71n = /* @__PURE__ */ BigInt(0x71);
	for (let round = 0, R = _1n$2, x = 1, y = 0; round < 24; round++) {
	    // Pi
	    [x, y] = [y, (2 * x + 3 * y) % 5];
	    SHA3_PI.push(2 * (5 * y + x));
	    // Rotational
	    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
	    // Iota
	    let t = _0n$1;
	    for (let j = 0; j < 7; j++) {
	        R = ((R << _1n$2) ^ ((R >> _7n) * _0x71n)) % _256n;
	        if (R & _2n$1)
	            t ^= _1n$2 << ((_1n$2 << /* @__PURE__ */ BigInt(j)) - _1n$2);
	    }
	    _SHA3_IOTA.push(t);
	}
	const [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ split(_SHA3_IOTA, true);
	// Left rotation (without 0, 32, 64)
	const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
	const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
	// Same as keccakf1600, but allows to skip some rounds
	function keccakP(s, rounds = 24) {
	    const B = new Uint32Array(5 * 2);
	    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
	    for (let round = 24 - rounds; round < 24; round++) {
	        // Theta θ
	        for (let x = 0; x < 10; x++)
	            B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
	        for (let x = 0; x < 10; x += 2) {
	            const idx1 = (x + 8) % 10;
	            const idx0 = (x + 2) % 10;
	            const B0 = B[idx0];
	            const B1 = B[idx0 + 1];
	            const Th = rotlH(B0, B1, 1) ^ B[idx1];
	            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
	            for (let y = 0; y < 50; y += 10) {
	                s[x + y] ^= Th;
	                s[x + y + 1] ^= Tl;
	            }
	        }
	        // Rho (ρ) and Pi (π)
	        let curH = s[2];
	        let curL = s[3];
	        for (let t = 0; t < 24; t++) {
	            const shift = SHA3_ROTL[t];
	            const Th = rotlH(curH, curL, shift);
	            const Tl = rotlL(curH, curL, shift);
	            const PI = SHA3_PI[t];
	            curH = s[PI];
	            curL = s[PI + 1];
	            s[PI] = Th;
	            s[PI + 1] = Tl;
	        }
	        // Chi (χ)
	        for (let y = 0; y < 50; y += 10) {
	            for (let x = 0; x < 10; x++)
	                B[x] = s[y + x];
	            for (let x = 0; x < 10; x++)
	                s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
	        }
	        // Iota (ι)
	        s[0] ^= SHA3_IOTA_H[round];
	        s[1] ^= SHA3_IOTA_L[round];
	    }
	    B.fill(0);
	}
	class Keccak extends Hash {
	    // NOTE: we accept arguments in bytes instead of bits here.
	    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
	        super();
	        this.blockLen = blockLen;
	        this.suffix = suffix;
	        this.outputLen = outputLen;
	        this.enableXOF = enableXOF;
	        this.rounds = rounds;
	        this.pos = 0;
	        this.posOut = 0;
	        this.finished = false;
	        this.destroyed = false;
	        // Can be passed from user as dkLen
	        anumber(outputLen);
	        // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
	        if (0 >= this.blockLen || this.blockLen >= 200)
	            throw new Error('Sha3 supports only keccak-f1600 function');
	        this.state = new Uint8Array(200);
	        this.state32 = u32(this.state);
	    }
	    keccak() {
	        if (!isLE)
	            byteSwap32(this.state32);
	        keccakP(this.state32, this.rounds);
	        if (!isLE)
	            byteSwap32(this.state32);
	        this.posOut = 0;
	        this.pos = 0;
	    }
	    update(data) {
	        aexists(this);
	        const { blockLen, state } = this;
	        data = toBytes(data);
	        const len = data.length;
	        for (let pos = 0; pos < len;) {
	            const take = Math.min(blockLen - this.pos, len - pos);
	            for (let i = 0; i < take; i++)
	                state[this.pos++] ^= data[pos++];
	            if (this.pos === blockLen)
	                this.keccak();
	        }
	        return this;
	    }
	    finish() {
	        if (this.finished)
	            return;
	        this.finished = true;
	        const { state, suffix, pos, blockLen } = this;
	        // Do the padding
	        state[pos] ^= suffix;
	        if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
	            this.keccak();
	        state[blockLen - 1] ^= 0x80;
	        this.keccak();
	    }
	    writeInto(out) {
	        aexists(this, false);
	        abytes(out);
	        this.finish();
	        const bufferOut = this.state;
	        const { blockLen } = this;
	        for (let pos = 0, len = out.length; pos < len;) {
	            if (this.posOut >= blockLen)
	                this.keccak();
	            const take = Math.min(blockLen - this.posOut, len - pos);
	            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
	            this.posOut += take;
	            pos += take;
	        }
	        return out;
	    }
	    xofInto(out) {
	        // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
	        if (!this.enableXOF)
	            throw new Error('XOF is not possible for this instance');
	        return this.writeInto(out);
	    }
	    xof(bytes) {
	        anumber(bytes);
	        return this.xofInto(new Uint8Array(bytes));
	    }
	    digestInto(out) {
	        aoutput(out, this);
	        if (this.finished)
	            throw new Error('digest() was already called');
	        this.writeInto(out);
	        this.destroy();
	        return out;
	    }
	    digest() {
	        return this.digestInto(new Uint8Array(this.outputLen));
	    }
	    destroy() {
	        this.destroyed = true;
	        this.state.fill(0);
	    }
	    _cloneInto(to) {
	        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
	        to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
	        to.state32.set(this.state32);
	        to.pos = this.pos;
	        to.posOut = this.posOut;
	        to.finished = this.finished;
	        to.rounds = rounds;
	        // Suffix can change in cSHAKE
	        to.suffix = suffix;
	        to.outputLen = outputLen;
	        to.enableXOF = enableXOF;
	        to.destroyed = this.destroyed;
	        return to;
	    }
	}
	const gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
	/**
	 * keccak-256 hash function. Different from SHA3-256.
	 * @param message - that would be hashed
	 */
	const keccak_256 = /* @__PURE__ */ gen(0x01, 136, 256 / 8);

	// SHA2-256 need to try 2^128 hashes to execute birthday attack.
	// BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per late 2024.
	// Round constants:
	// first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
	// prettier-ignore
	const SHA256_K = /* @__PURE__ */ new Uint32Array([
	    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
	]);
	// Initial state:
	// first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19
	// prettier-ignore
	const SHA256_IV = /* @__PURE__ */ new Uint32Array([
	    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
	]);
	// Temporary buffer, not used to store anything between runs
	// Named this way because it matches specification.
	const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
	class SHA256 extends HashMD$1 {
	    constructor() {
	        super(64, 32, 8, false);
	        // We cannot use array here since array allows indexing by variable
	        // which means optimizer/compiler cannot use registers.
	        this.A = SHA256_IV[0] | 0;
	        this.B = SHA256_IV[1] | 0;
	        this.C = SHA256_IV[2] | 0;
	        this.D = SHA256_IV[3] | 0;
	        this.E = SHA256_IV[4] | 0;
	        this.F = SHA256_IV[5] | 0;
	        this.G = SHA256_IV[6] | 0;
	        this.H = SHA256_IV[7] | 0;
	    }
	    get() {
	        const { A, B, C, D, E, F, G, H } = this;
	        return [A, B, C, D, E, F, G, H];
	    }
	    // prettier-ignore
	    set(A, B, C, D, E, F, G, H) {
	        this.A = A | 0;
	        this.B = B | 0;
	        this.C = C | 0;
	        this.D = D | 0;
	        this.E = E | 0;
	        this.F = F | 0;
	        this.G = G | 0;
	        this.H = H | 0;
	    }
	    process(view, offset) {
	        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
	        for (let i = 0; i < 16; i++, offset += 4)
	            SHA256_W[i] = view.getUint32(offset, false);
	        for (let i = 16; i < 64; i++) {
	            const W15 = SHA256_W[i - 15];
	            const W2 = SHA256_W[i - 2];
	            const s0 = rotr$1(W15, 7) ^ rotr$1(W15, 18) ^ (W15 >>> 3);
	            const s1 = rotr$1(W2, 17) ^ rotr$1(W2, 19) ^ (W2 >>> 10);
	            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
	        }
	        // Compression function main loop, 64 rounds
	        let { A, B, C, D, E, F, G, H } = this;
	        for (let i = 0; i < 64; i++) {
	            const sigma1 = rotr$1(E, 6) ^ rotr$1(E, 11) ^ rotr$1(E, 25);
	            const T1 = (H + sigma1 + Chi$1(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
	            const sigma0 = rotr$1(A, 2) ^ rotr$1(A, 13) ^ rotr$1(A, 22);
	            const T2 = (sigma0 + Maj$1(A, B, C)) | 0;
	            H = G;
	            G = F;
	            F = E;
	            E = (D + T1) | 0;
	            D = C;
	            C = B;
	            B = A;
	            A = (T1 + T2) | 0;
	        }
	        // Add the compressed chunk to the current hash value
	        A = (A + this.A) | 0;
	        B = (B + this.B) | 0;
	        C = (C + this.C) | 0;
	        D = (D + this.D) | 0;
	        E = (E + this.E) | 0;
	        F = (F + this.F) | 0;
	        G = (G + this.G) | 0;
	        H = (H + this.H) | 0;
	        this.set(A, B, C, D, E, F, G, H);
	    }
	    roundClean() {
	        SHA256_W.fill(0);
	    }
	    destroy() {
	        this.set(0, 0, 0, 0, 0, 0, 0, 0);
	        this.buffer.fill(0);
	    }
	}
	/**
	 * SHA2-256 hash function
	 * @param message - data that would be hashed
	 */
	const sha256 = /* @__PURE__ */ wrapConstructor$1(() => new SHA256());

	// HMAC (RFC 2104)
	class HMAC extends Hash$1 {
	    constructor(hash, _key) {
	        super();
	        this.finished = false;
	        this.destroyed = false;
	        ahash(hash);
	        const key = toBytes$1(_key);
	        this.iHash = hash.create();
	        if (typeof this.iHash.update !== 'function')
	            throw new Error('Expected instance of class which extends utils.Hash');
	        this.blockLen = this.iHash.blockLen;
	        this.outputLen = this.iHash.outputLen;
	        const blockLen = this.blockLen;
	        const pad = new Uint8Array(blockLen);
	        // blockLen can be bigger than outputLen
	        pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
	        for (let i = 0; i < pad.length; i++)
	            pad[i] ^= 0x36;
	        this.iHash.update(pad);
	        // By doing update (processing of first block) of outer hash here we can re-use it between multiple calls via clone
	        this.oHash = hash.create();
	        // Undo internal XOR && apply outer XOR
	        for (let i = 0; i < pad.length; i++)
	            pad[i] ^= 0x36 ^ 0x5c;
	        this.oHash.update(pad);
	        pad.fill(0);
	    }
	    update(buf) {
	        aexists$1(this);
	        this.iHash.update(buf);
	        return this;
	    }
	    digestInto(out) {
	        aexists$1(this);
	        abytes$2(out, this.outputLen);
	        this.finished = true;
	        this.iHash.digestInto(out);
	        this.oHash.update(out);
	        this.oHash.digestInto(out);
	        this.destroy();
	    }
	    digest() {
	        const out = new Uint8Array(this.oHash.outputLen);
	        this.digestInto(out);
	        return out;
	    }
	    _cloneInto(to) {
	        // Create new instance without calling constructor since key already in state and we don't know it.
	        to || (to = Object.create(Object.getPrototypeOf(this), {}));
	        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
	        to = to;
	        to.finished = finished;
	        to.destroyed = destroyed;
	        to.blockLen = blockLen;
	        to.outputLen = outputLen;
	        to.oHash = oHash._cloneInto(to.oHash);
	        to.iHash = iHash._cloneInto(to.iHash);
	        return to;
	    }
	    destroy() {
	        this.destroyed = true;
	        this.oHash.destroy();
	        this.iHash.destroy();
	    }
	}
	/**
	 * HMAC: RFC2104 message authentication code.
	 * @param hash - function that would be used e.g. sha256
	 * @param key - message key
	 * @param message - message data
	 * @example
	 * import { hmac } from '@noble/hashes/hmac';
	 * import { sha256 } from '@noble/hashes/sha2';
	 * const mac1 = hmac(sha256, 'key', 'message');
	 */
	const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
	hmac.create = (hash, key) => new HMAC(hash, key);

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// Short Weierstrass curve. The formula is: y² = x³ + ax + b
	function validateSigVerOpts(opts) {
	    if (opts.lowS !== undefined)
	        abool('lowS', opts.lowS);
	    if (opts.prehash !== undefined)
	        abool('prehash', opts.prehash);
	}
	function validatePointOpts(curve) {
	    const opts = validateBasic(curve);
	    validateObject(opts, {
	        a: 'field',
	        b: 'field',
	    }, {
	        allowedPrivateKeyLengths: 'array',
	        wrapPrivateKey: 'boolean',
	        isTorsionFree: 'function',
	        clearCofactor: 'function',
	        allowInfinityPoint: 'boolean',
	        fromBytes: 'function',
	        toBytes: 'function',
	    });
	    const { endo, Fp, a } = opts;
	    if (endo) {
	        if (!Fp.eql(a, Fp.ZERO)) {
	            throw new Error('invalid endomorphism, can only be defined for Koblitz curves that have a=0');
	        }
	        if (typeof endo !== 'object' ||
	            typeof endo.beta !== 'bigint' ||
	            typeof endo.splitScalar !== 'function') {
	            throw new Error('invalid endomorphism, expected beta: bigint and splitScalar: function');
	        }
	    }
	    return Object.freeze({ ...opts });
	}
	const { bytesToNumberBE: b2n, hexToBytes: h2b } = ut;
	/**
	 * ASN.1 DER encoding utilities. ASN is very complex & fragile. Format:
	 *
	 *     [0x30 (SEQUENCE), bytelength, 0x02 (INTEGER), intLength, R, 0x02 (INTEGER), intLength, S]
	 *
	 * Docs: https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/, https://luca.ntop.org/Teaching/Appunti/asn1.html
	 */
	const DER = {
	    // asn.1 DER encoding utils
	    Err: class DERErr extends Error {
	        constructor(m = '') {
	            super(m);
	        }
	    },
	    // Basic building block is TLV (Tag-Length-Value)
	    _tlv: {
	        encode: (tag, data) => {
	            const { Err: E } = DER;
	            if (tag < 0 || tag > 256)
	                throw new E('tlv.encode: wrong tag');
	            if (data.length & 1)
	                throw new E('tlv.encode: unpadded data');
	            const dataLen = data.length / 2;
	            const len = numberToHexUnpadded(dataLen);
	            if ((len.length / 2) & 128)
	                throw new E('tlv.encode: long form length too big');
	            // length of length with long form flag
	            const lenLen = dataLen > 127 ? numberToHexUnpadded((len.length / 2) | 128) : '';
	            const t = numberToHexUnpadded(tag);
	            return t + lenLen + len + data;
	        },
	        // v - value, l - left bytes (unparsed)
	        decode(tag, data) {
	            const { Err: E } = DER;
	            let pos = 0;
	            if (tag < 0 || tag > 256)
	                throw new E('tlv.encode: wrong tag');
	            if (data.length < 2 || data[pos++] !== tag)
	                throw new E('tlv.decode: wrong tlv');
	            const first = data[pos++];
	            const isLong = !!(first & 128); // First bit of first length byte is flag for short/long form
	            let length = 0;
	            if (!isLong)
	                length = first;
	            else {
	                // Long form: [longFlag(1bit), lengthLength(7bit), length (BE)]
	                const lenLen = first & 127;
	                if (!lenLen)
	                    throw new E('tlv.decode(long): indefinite length not supported');
	                if (lenLen > 4)
	                    throw new E('tlv.decode(long): byte length is too big'); // this will overflow u32 in js
	                const lengthBytes = data.subarray(pos, pos + lenLen);
	                if (lengthBytes.length !== lenLen)
	                    throw new E('tlv.decode: length bytes not complete');
	                if (lengthBytes[0] === 0)
	                    throw new E('tlv.decode(long): zero leftmost byte');
	                for (const b of lengthBytes)
	                    length = (length << 8) | b;
	                pos += lenLen;
	                if (length < 128)
	                    throw new E('tlv.decode(long): not minimal encoding');
	            }
	            const v = data.subarray(pos, pos + length);
	            if (v.length !== length)
	                throw new E('tlv.decode: wrong value length');
	            return { v, l: data.subarray(pos + length) };
	        },
	    },
	    // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
	    // since we always use positive integers here. It must always be empty:
	    // - add zero byte if exists
	    // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
	    _int: {
	        encode(num) {
	            const { Err: E } = DER;
	            if (num < _0n)
	                throw new E('integer: negative integers are not allowed');
	            let hex = numberToHexUnpadded(num);
	            // Pad with zero byte if negative flag is present
	            if (Number.parseInt(hex[0], 16) & 0b1000)
	                hex = '00' + hex;
	            if (hex.length & 1)
	                throw new E('unexpected DER parsing assertion: unpadded hex');
	            return hex;
	        },
	        decode(data) {
	            const { Err: E } = DER;
	            if (data[0] & 128)
	                throw new E('invalid signature integer: negative');
	            if (data[0] === 0x00 && !(data[1] & 128))
	                throw new E('invalid signature integer: unnecessary leading zero');
	            return b2n(data);
	        },
	    },
	    toSig(hex) {
	        // parse DER signature
	        const { Err: E, _int: int, _tlv: tlv } = DER;
	        const data = typeof hex === 'string' ? h2b(hex) : hex;
	        abytes$1(data);
	        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(0x30, data);
	        if (seqLeftBytes.length)
	            throw new E('invalid signature: left bytes after parsing');
	        const { v: rBytes, l: rLeftBytes } = tlv.decode(0x02, seqBytes);
	        const { v: sBytes, l: sLeftBytes } = tlv.decode(0x02, rLeftBytes);
	        if (sLeftBytes.length)
	            throw new E('invalid signature: left bytes after parsing');
	        return { r: int.decode(rBytes), s: int.decode(sBytes) };
	    },
	    hexFromSig(sig) {
	        const { _tlv: tlv, _int: int } = DER;
	        const rs = tlv.encode(0x02, int.encode(sig.r));
	        const ss = tlv.encode(0x02, int.encode(sig.s));
	        const seq = rs + ss;
	        return tlv.encode(0x30, seq);
	    },
	};
	// Be friendly to bad ECMAScript parsers by not using bigint literals
	// prettier-ignore
	const _0n = BigInt(0), _1n$1 = BigInt(1); BigInt(2); const _3n = BigInt(3); BigInt(4);
	function weierstrassPoints(opts) {
	    const CURVE = validatePointOpts(opts);
	    const { Fp } = CURVE; // All curves has same field / group length as for now, but they can differ
	    const Fn = Field(CURVE.n, CURVE.nBitLength);
	    const toBytes = CURVE.toBytes ||
	        ((_c, point, _isCompressed) => {
	            const a = point.toAffine();
	            return concatBytes(Uint8Array.from([0x04]), Fp.toBytes(a.x), Fp.toBytes(a.y));
	        });
	    const fromBytes = CURVE.fromBytes ||
	        ((bytes) => {
	            // const head = bytes[0];
	            const tail = bytes.subarray(1);
	            // if (head !== 0x04) throw new Error('Only non-compressed encoding is supported');
	            const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
	            const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
	            return { x, y };
	        });
	    /**
	     * y² = x³ + ax + b: Short weierstrass curve formula
	     * @returns y²
	     */
	    function weierstrassEquation(x) {
	        const { a, b } = CURVE;
	        const x2 = Fp.sqr(x); // x * x
	        const x3 = Fp.mul(x2, x); // x2 * x
	        return Fp.add(Fp.add(x3, Fp.mul(x, a)), b); // x3 + a * x + b
	    }
	    // Validate whether the passed curve params are valid.
	    // We check if curve equation works for generator point.
	    // `assertValidity()` won't work: `isTorsionFree()` is not available at this point in bls12-381.
	    // ProjectivePoint class has not been initialized yet.
	    if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx)))
	        throw new Error('bad generator point: equation left != right');
	    // Valid group elements reside in range 1..n-1
	    function isWithinCurveOrder(num) {
	        return inRange(num, _1n$1, CURVE.n);
	    }
	    // Validates if priv key is valid and converts it to bigint.
	    // Supports options allowedPrivateKeyLengths and wrapPrivateKey.
	    function normPrivateKeyToScalar(key) {
	        const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
	        if (lengths && typeof key !== 'bigint') {
	            if (isBytes$1(key))
	                key = bytesToHex(key);
	            // Normalize to hex string, pad. E.g. P521 would norm 130-132 char hex to 132-char bytes
	            if (typeof key !== 'string' || !lengths.includes(key.length))
	                throw new Error('invalid private key');
	            key = key.padStart(nByteLength * 2, '0');
	        }
	        let num;
	        try {
	            num =
	                typeof key === 'bigint'
	                    ? key
	                    : bytesToNumberBE(ensureBytes('private key', key, nByteLength));
	        }
	        catch (error) {
	            throw new Error('invalid private key, expected hex or ' + nByteLength + ' bytes, got ' + typeof key);
	        }
	        if (wrapPrivateKey)
	            num = mod(num, N); // disabled by default, enabled for BLS
	        aInRange('private key', num, _1n$1, N); // num in range [1..N-1]
	        return num;
	    }
	    function assertPrjPoint(other) {
	        if (!(other instanceof Point))
	            throw new Error('ProjectivePoint expected');
	    }
	    // Memoized toAffine / validity check. They are heavy. Points are immutable.
	    // Converts Projective point to affine (x, y) coordinates.
	    // Can accept precomputed Z^-1 - for example, from invertBatch.
	    // (x, y, z) ∋ (x=x/z, y=y/z)
	    const toAffineMemo = memoized((p, iz) => {
	        const { px: x, py: y, pz: z } = p;
	        // Fast-path for normalized points
	        if (Fp.eql(z, Fp.ONE))
	            return { x, y };
	        const is0 = p.is0();
	        // If invZ was 0, we return zero point. However we still want to execute
	        // all operations, so we replace invZ with a random number, 1.
	        if (iz == null)
	            iz = is0 ? Fp.ONE : Fp.inv(z);
	        const ax = Fp.mul(x, iz);
	        const ay = Fp.mul(y, iz);
	        const zz = Fp.mul(z, iz);
	        if (is0)
	            return { x: Fp.ZERO, y: Fp.ZERO };
	        if (!Fp.eql(zz, Fp.ONE))
	            throw new Error('invZ was invalid');
	        return { x: ax, y: ay };
	    });
	    // NOTE: on exception this will crash 'cached' and no value will be set.
	    // Otherwise true will be return
	    const assertValidMemo = memoized((p) => {
	        if (p.is0()) {
	            // (0, 1, 0) aka ZERO is invalid in most contexts.
	            // In BLS, ZERO can be serialized, so we allow it.
	            // (0, 0, 0) is invalid representation of ZERO.
	            if (CURVE.allowInfinityPoint && !Fp.is0(p.py))
	                return;
	            throw new Error('bad point: ZERO');
	        }
	        // Some 3rd-party test vectors require different wording between here & `fromCompressedHex`
	        const { x, y } = p.toAffine();
	        // Check if x, y are valid field elements
	        if (!Fp.isValid(x) || !Fp.isValid(y))
	            throw new Error('bad point: x or y not FE');
	        const left = Fp.sqr(y); // y²
	        const right = weierstrassEquation(x); // x³ + ax + b
	        if (!Fp.eql(left, right))
	            throw new Error('bad point: equation left != right');
	        if (!p.isTorsionFree())
	            throw new Error('bad point: not in prime-order subgroup');
	        return true;
	    });
	    /**
	     * Projective Point works in 3d / projective (homogeneous) coordinates: (x, y, z) ∋ (x=x/z, y=y/z)
	     * Default Point works in 2d / affine coordinates: (x, y)
	     * We're doing calculations in projective, because its operations don't require costly inversion.
	     */
	    class Point {
	        constructor(px, py, pz) {
	            this.px = px;
	            this.py = py;
	            this.pz = pz;
	            if (px == null || !Fp.isValid(px))
	                throw new Error('x required');
	            if (py == null || !Fp.isValid(py))
	                throw new Error('y required');
	            if (pz == null || !Fp.isValid(pz))
	                throw new Error('z required');
	            Object.freeze(this);
	        }
	        // Does not validate if the point is on-curve.
	        // Use fromHex instead, or call assertValidity() later.
	        static fromAffine(p) {
	            const { x, y } = p || {};
	            if (!p || !Fp.isValid(x) || !Fp.isValid(y))
	                throw new Error('invalid affine point');
	            if (p instanceof Point)
	                throw new Error('projective point not allowed');
	            const is0 = (i) => Fp.eql(i, Fp.ZERO);
	            // fromAffine(x:0, y:0) would produce (x:0, y:0, z:1), but we need (x:0, y:1, z:0)
	            if (is0(x) && is0(y))
	                return Point.ZERO;
	            return new Point(x, y, Fp.ONE);
	        }
	        get x() {
	            return this.toAffine().x;
	        }
	        get y() {
	            return this.toAffine().y;
	        }
	        /**
	         * Takes a bunch of Projective Points but executes only one
	         * inversion on all of them. Inversion is very slow operation,
	         * so this improves performance massively.
	         * Optimization: converts a list of projective points to a list of identical points with Z=1.
	         */
	        static normalizeZ(points) {
	            const toInv = Fp.invertBatch(points.map((p) => p.pz));
	            return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
	        }
	        /**
	         * Converts hash string or Uint8Array to Point.
	         * @param hex short/long ECDSA hex
	         */
	        static fromHex(hex) {
	            const P = Point.fromAffine(fromBytes(ensureBytes('pointHex', hex)));
	            P.assertValidity();
	            return P;
	        }
	        // Multiplies generator point by privateKey.
	        static fromPrivateKey(privateKey) {
	            return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
	        }
	        // Multiscalar Multiplication
	        static msm(points, scalars) {
	            return pippenger(Point, Fn, points, scalars);
	        }
	        // "Private method", don't use it directly
	        _setWindowSize(windowSize) {
	            wnaf.setWindowSize(this, windowSize);
	        }
	        // A point on curve is valid if it conforms to equation.
	        assertValidity() {
	            assertValidMemo(this);
	        }
	        hasEvenY() {
	            const { y } = this.toAffine();
	            if (Fp.isOdd)
	                return !Fp.isOdd(y);
	            throw new Error("Field doesn't support isOdd");
	        }
	        /**
	         * Compare one point to another.
	         */
	        equals(other) {
	            assertPrjPoint(other);
	            const { px: X1, py: Y1, pz: Z1 } = this;
	            const { px: X2, py: Y2, pz: Z2 } = other;
	            const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
	            const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
	            return U1 && U2;
	        }
	        /**
	         * Flips point to one corresponding to (x, -y) in Affine coordinates.
	         */
	        negate() {
	            return new Point(this.px, Fp.neg(this.py), this.pz);
	        }
	        // Renes-Costello-Batina exception-free doubling formula.
	        // There is 30% faster Jacobian formula, but it is not complete.
	        // https://eprint.iacr.org/2015/1060, algorithm 3
	        // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
	        double() {
	            const { a, b } = CURVE;
	            const b3 = Fp.mul(b, _3n);
	            const { px: X1, py: Y1, pz: Z1 } = this;
	            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
	            let t0 = Fp.mul(X1, X1); // step 1
	            let t1 = Fp.mul(Y1, Y1);
	            let t2 = Fp.mul(Z1, Z1);
	            let t3 = Fp.mul(X1, Y1);
	            t3 = Fp.add(t3, t3); // step 5
	            Z3 = Fp.mul(X1, Z1);
	            Z3 = Fp.add(Z3, Z3);
	            X3 = Fp.mul(a, Z3);
	            Y3 = Fp.mul(b3, t2);
	            Y3 = Fp.add(X3, Y3); // step 10
	            X3 = Fp.sub(t1, Y3);
	            Y3 = Fp.add(t1, Y3);
	            Y3 = Fp.mul(X3, Y3);
	            X3 = Fp.mul(t3, X3);
	            Z3 = Fp.mul(b3, Z3); // step 15
	            t2 = Fp.mul(a, t2);
	            t3 = Fp.sub(t0, t2);
	            t3 = Fp.mul(a, t3);
	            t3 = Fp.add(t3, Z3);
	            Z3 = Fp.add(t0, t0); // step 20
	            t0 = Fp.add(Z3, t0);
	            t0 = Fp.add(t0, t2);
	            t0 = Fp.mul(t0, t3);
	            Y3 = Fp.add(Y3, t0);
	            t2 = Fp.mul(Y1, Z1); // step 25
	            t2 = Fp.add(t2, t2);
	            t0 = Fp.mul(t2, t3);
	            X3 = Fp.sub(X3, t0);
	            Z3 = Fp.mul(t2, t1);
	            Z3 = Fp.add(Z3, Z3); // step 30
	            Z3 = Fp.add(Z3, Z3);
	            return new Point(X3, Y3, Z3);
	        }
	        // Renes-Costello-Batina exception-free addition formula.
	        // There is 30% faster Jacobian formula, but it is not complete.
	        // https://eprint.iacr.org/2015/1060, algorithm 1
	        // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
	        add(other) {
	            assertPrjPoint(other);
	            const { px: X1, py: Y1, pz: Z1 } = this;
	            const { px: X2, py: Y2, pz: Z2 } = other;
	            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
	            const a = CURVE.a;
	            const b3 = Fp.mul(CURVE.b, _3n);
	            let t0 = Fp.mul(X1, X2); // step 1
	            let t1 = Fp.mul(Y1, Y2);
	            let t2 = Fp.mul(Z1, Z2);
	            let t3 = Fp.add(X1, Y1);
	            let t4 = Fp.add(X2, Y2); // step 5
	            t3 = Fp.mul(t3, t4);
	            t4 = Fp.add(t0, t1);
	            t3 = Fp.sub(t3, t4);
	            t4 = Fp.add(X1, Z1);
	            let t5 = Fp.add(X2, Z2); // step 10
	            t4 = Fp.mul(t4, t5);
	            t5 = Fp.add(t0, t2);
	            t4 = Fp.sub(t4, t5);
	            t5 = Fp.add(Y1, Z1);
	            X3 = Fp.add(Y2, Z2); // step 15
	            t5 = Fp.mul(t5, X3);
	            X3 = Fp.add(t1, t2);
	            t5 = Fp.sub(t5, X3);
	            Z3 = Fp.mul(a, t4);
	            X3 = Fp.mul(b3, t2); // step 20
	            Z3 = Fp.add(X3, Z3);
	            X3 = Fp.sub(t1, Z3);
	            Z3 = Fp.add(t1, Z3);
	            Y3 = Fp.mul(X3, Z3);
	            t1 = Fp.add(t0, t0); // step 25
	            t1 = Fp.add(t1, t0);
	            t2 = Fp.mul(a, t2);
	            t4 = Fp.mul(b3, t4);
	            t1 = Fp.add(t1, t2);
	            t2 = Fp.sub(t0, t2); // step 30
	            t2 = Fp.mul(a, t2);
	            t4 = Fp.add(t4, t2);
	            t0 = Fp.mul(t1, t4);
	            Y3 = Fp.add(Y3, t0);
	            t0 = Fp.mul(t5, t4); // step 35
	            X3 = Fp.mul(t3, X3);
	            X3 = Fp.sub(X3, t0);
	            t0 = Fp.mul(t3, t1);
	            Z3 = Fp.mul(t5, Z3);
	            Z3 = Fp.add(Z3, t0); // step 40
	            return new Point(X3, Y3, Z3);
	        }
	        subtract(other) {
	            return this.add(other.negate());
	        }
	        is0() {
	            return this.equals(Point.ZERO);
	        }
	        wNAF(n) {
	            return wnaf.wNAFCached(this, n, Point.normalizeZ);
	        }
	        /**
	         * Non-constant-time multiplication. Uses double-and-add algorithm.
	         * It's faster, but should only be used when you don't care about
	         * an exposed private key e.g. sig verification, which works over *public* keys.
	         */
	        multiplyUnsafe(sc) {
	            const { endo, n: N } = CURVE;
	            aInRange('scalar', sc, _0n, N);
	            const I = Point.ZERO;
	            if (sc === _0n)
	                return I;
	            if (this.is0() || sc === _1n$1)
	                return this;
	            // Case a: no endomorphism. Case b: has precomputes.
	            if (!endo || wnaf.hasPrecomputes(this))
	                return wnaf.wNAFCachedUnsafe(this, sc, Point.normalizeZ);
	            // Case c: endomorphism
	            let { k1neg, k1, k2neg, k2 } = endo.splitScalar(sc);
	            let k1p = I;
	            let k2p = I;
	            let d = this;
	            while (k1 > _0n || k2 > _0n) {
	                if (k1 & _1n$1)
	                    k1p = k1p.add(d);
	                if (k2 & _1n$1)
	                    k2p = k2p.add(d);
	                d = d.double();
	                k1 >>= _1n$1;
	                k2 >>= _1n$1;
	            }
	            if (k1neg)
	                k1p = k1p.negate();
	            if (k2neg)
	                k2p = k2p.negate();
	            k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
	            return k1p.add(k2p);
	        }
	        /**
	         * Constant time multiplication.
	         * Uses wNAF method. Windowed method may be 10% faster,
	         * but takes 2x longer to generate and consumes 2x memory.
	         * Uses precomputes when available.
	         * Uses endomorphism for Koblitz curves.
	         * @param scalar by which the point would be multiplied
	         * @returns New point
	         */
	        multiply(scalar) {
	            const { endo, n: N } = CURVE;
	            aInRange('scalar', scalar, _1n$1, N);
	            let point, fake; // Fake point is used to const-time mult
	            if (endo) {
	                const { k1neg, k1, k2neg, k2 } = endo.splitScalar(scalar);
	                let { p: k1p, f: f1p } = this.wNAF(k1);
	                let { p: k2p, f: f2p } = this.wNAF(k2);
	                k1p = wnaf.constTimeNegate(k1neg, k1p);
	                k2p = wnaf.constTimeNegate(k2neg, k2p);
	                k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
	                point = k1p.add(k2p);
	                fake = f1p.add(f2p);
	            }
	            else {
	                const { p, f } = this.wNAF(scalar);
	                point = p;
	                fake = f;
	            }
	            // Normalize `z` for both points, but return only real one
	            return Point.normalizeZ([point, fake])[0];
	        }
	        /**
	         * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
	         * Not using Strauss-Shamir trick: precomputation tables are faster.
	         * The trick could be useful if both P and Q are not G (not in our case).
	         * @returns non-zero affine point
	         */
	        multiplyAndAddUnsafe(Q, a, b) {
	            const G = Point.BASE; // No Strauss-Shamir trick: we have 10% faster G precomputes
	            const mul = (P, a // Select faster multiply() method
	            ) => (a === _0n || a === _1n$1 || !P.equals(G) ? P.multiplyUnsafe(a) : P.multiply(a));
	            const sum = mul(this, a).add(mul(Q, b));
	            return sum.is0() ? undefined : sum;
	        }
	        // Converts Projective point to affine (x, y) coordinates.
	        // Can accept precomputed Z^-1 - for example, from invertBatch.
	        // (x, y, z) ∋ (x=x/z, y=y/z)
	        toAffine(iz) {
	            return toAffineMemo(this, iz);
	        }
	        isTorsionFree() {
	            const { h: cofactor, isTorsionFree } = CURVE;
	            if (cofactor === _1n$1)
	                return true; // No subgroups, always torsion-free
	            if (isTorsionFree)
	                return isTorsionFree(Point, this);
	            throw new Error('isTorsionFree() has not been declared for the elliptic curve');
	        }
	        clearCofactor() {
	            const { h: cofactor, clearCofactor } = CURVE;
	            if (cofactor === _1n$1)
	                return this; // Fast-path
	            if (clearCofactor)
	                return clearCofactor(Point, this);
	            return this.multiplyUnsafe(CURVE.h);
	        }
	        toRawBytes(isCompressed = true) {
	            abool('isCompressed', isCompressed);
	            this.assertValidity();
	            return toBytes(Point, this, isCompressed);
	        }
	        toHex(isCompressed = true) {
	            abool('isCompressed', isCompressed);
	            return bytesToHex(this.toRawBytes(isCompressed));
	        }
	    }
	    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
	    Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
	    const _bits = CURVE.nBitLength;
	    const wnaf = wNAF(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
	    // Validate if generator point is on curve
	    return {
	        CURVE,
	        ProjectivePoint: Point,
	        normPrivateKeyToScalar,
	        weierstrassEquation,
	        isWithinCurveOrder,
	    };
	}
	function validateOpts(curve) {
	    const opts = validateBasic(curve);
	    validateObject(opts, {
	        hash: 'hash',
	        hmac: 'function',
	        randomBytes: 'function',
	    }, {
	        bits2int: 'function',
	        bits2int_modN: 'function',
	        lowS: 'boolean',
	    });
	    return Object.freeze({ lowS: true, ...opts });
	}
	/**
	 * Creates short weierstrass curve and ECDSA signature methods for it.
	 * @example
	 * import { Field } from '@noble/curves/abstract/modular';
	 * // Before that, define BigInt-s: a, b, p, n, Gx, Gy
	 * const curve = weierstrass({ a, b, Fp: Field(p), n, Gx, Gy, h: 1n })
	 */
	function weierstrass(curveDef) {
	    const CURVE = validateOpts(curveDef);
	    const { Fp, n: CURVE_ORDER } = CURVE;
	    const compressedLen = Fp.BYTES + 1; // e.g. 33 for 32
	    const uncompressedLen = 2 * Fp.BYTES + 1; // e.g. 65 for 32
	    function modN(a) {
	        return mod(a, CURVE_ORDER);
	    }
	    function invN(a) {
	        return invert(a, CURVE_ORDER);
	    }
	    const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder, } = weierstrassPoints({
	        ...CURVE,
	        toBytes(_c, point, isCompressed) {
	            const a = point.toAffine();
	            const x = Fp.toBytes(a.x);
	            const cat = concatBytes;
	            abool('isCompressed', isCompressed);
	            if (isCompressed) {
	                return cat(Uint8Array.from([point.hasEvenY() ? 0x02 : 0x03]), x);
	            }
	            else {
	                return cat(Uint8Array.from([0x04]), x, Fp.toBytes(a.y));
	            }
	        },
	        fromBytes(bytes) {
	            const len = bytes.length;
	            const head = bytes[0];
	            const tail = bytes.subarray(1);
	            // this.assertValidity() is done inside of fromHex
	            if (len === compressedLen && (head === 0x02 || head === 0x03)) {
	                const x = bytesToNumberBE(tail);
	                if (!inRange(x, _1n$1, Fp.ORDER))
	                    throw new Error('Point is not on curve');
	                const y2 = weierstrassEquation(x); // y² = x³ + ax + b
	                let y;
	                try {
	                    y = Fp.sqrt(y2); // y = y² ^ (p+1)/4
	                }
	                catch (sqrtError) {
	                    const suffix = sqrtError instanceof Error ? ': ' + sqrtError.message : '';
	                    throw new Error('Point is not on curve' + suffix);
	                }
	                const isYOdd = (y & _1n$1) === _1n$1;
	                // ECDSA
	                const isHeadOdd = (head & 1) === 1;
	                if (isHeadOdd !== isYOdd)
	                    y = Fp.neg(y);
	                return { x, y };
	            }
	            else if (len === uncompressedLen && head === 0x04) {
	                const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
	                const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
	                return { x, y };
	            }
	            else {
	                const cl = compressedLen;
	                const ul = uncompressedLen;
	                throw new Error('invalid Point, expected length of ' + cl + ', or uncompressed ' + ul + ', got ' + len);
	            }
	        },
	    });
	    const numToNByteStr = (num) => bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
	    function isBiggerThanHalfOrder(number) {
	        const HALF = CURVE_ORDER >> _1n$1;
	        return number > HALF;
	    }
	    function normalizeS(s) {
	        return isBiggerThanHalfOrder(s) ? modN(-s) : s;
	    }
	    // slice bytes num
	    const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));
	    /**
	     * ECDSA signature with its (r, s) properties. Supports DER & compact representations.
	     */
	    class Signature {
	        constructor(r, s, recovery) {
	            this.r = r;
	            this.s = s;
	            this.recovery = recovery;
	            this.assertValidity();
	        }
	        // pair (bytes of r, bytes of s)
	        static fromCompact(hex) {
	            const l = CURVE.nByteLength;
	            hex = ensureBytes('compactSignature', hex, l * 2);
	            return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
	        }
	        // DER encoded ECDSA signature
	        // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
	        static fromDER(hex) {
	            const { r, s } = DER.toSig(ensureBytes('DER', hex));
	            return new Signature(r, s);
	        }
	        assertValidity() {
	            aInRange('r', this.r, _1n$1, CURVE_ORDER); // r in [1..N]
	            aInRange('s', this.s, _1n$1, CURVE_ORDER); // s in [1..N]
	        }
	        addRecoveryBit(recovery) {
	            return new Signature(this.r, this.s, recovery);
	        }
	        recoverPublicKey(msgHash) {
	            const { r, s, recovery: rec } = this;
	            const h = bits2int_modN(ensureBytes('msgHash', msgHash)); // Truncate hash
	            if (rec == null || ![0, 1, 2, 3].includes(rec))
	                throw new Error('recovery id invalid');
	            const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
	            if (radj >= Fp.ORDER)
	                throw new Error('recovery id 2 or 3 invalid');
	            const prefix = (rec & 1) === 0 ? '02' : '03';
	            const R = Point.fromHex(prefix + numToNByteStr(radj));
	            const ir = invN(radj); // r^-1
	            const u1 = modN(-h * ir); // -hr^-1
	            const u2 = modN(s * ir); // sr^-1
	            const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2); // (sr^-1)R-(hr^-1)G = -(hr^-1)G + (sr^-1)
	            if (!Q)
	                throw new Error('point at infinify'); // unsafe is fine: no priv data leaked
	            Q.assertValidity();
	            return Q;
	        }
	        // Signatures should be low-s, to prevent malleability.
	        hasHighS() {
	            return isBiggerThanHalfOrder(this.s);
	        }
	        normalizeS() {
	            return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
	        }
	        // DER-encoded
	        toDERRawBytes() {
	            return hexToBytes(this.toDERHex());
	        }
	        toDERHex() {
	            return DER.hexFromSig({ r: this.r, s: this.s });
	        }
	        // padded bytes of r, then padded bytes of s
	        toCompactRawBytes() {
	            return hexToBytes(this.toCompactHex());
	        }
	        toCompactHex() {
	            return numToNByteStr(this.r) + numToNByteStr(this.s);
	        }
	    }
	    const utils = {
	        isValidPrivateKey(privateKey) {
	            try {
	                normPrivateKeyToScalar(privateKey);
	                return true;
	            }
	            catch (error) {
	                return false;
	            }
	        },
	        normPrivateKeyToScalar: normPrivateKeyToScalar,
	        /**
	         * Produces cryptographically secure private key from random of size
	         * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
	         */
	        randomPrivateKey: () => {
	            const length = getMinHashLength(CURVE.n);
	            return mapHashToField(CURVE.randomBytes(length), CURVE.n);
	        },
	        /**
	         * Creates precompute table for an arbitrary EC point. Makes point "cached".
	         * Allows to massively speed-up `point.multiply(scalar)`.
	         * @returns cached point
	         * @example
	         * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
	         * fast.multiply(privKey); // much faster ECDH now
	         */
	        precompute(windowSize = 8, point = Point.BASE) {
	            point._setWindowSize(windowSize);
	            point.multiply(BigInt(3)); // 3 is arbitrary, just need any number here
	            return point;
	        },
	    };
	    /**
	     * Computes public key for a private key. Checks for validity of the private key.
	     * @param privateKey private key
	     * @param isCompressed whether to return compact (default), or full key
	     * @returns Public key, full when isCompressed=false; short when isCompressed=true
	     */
	    function getPublicKey(privateKey, isCompressed = true) {
	        return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
	    }
	    /**
	     * Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
	     */
	    function isProbPub(item) {
	        const arr = isBytes$1(item);
	        const str = typeof item === 'string';
	        const len = (arr || str) && item.length;
	        if (arr)
	            return len === compressedLen || len === uncompressedLen;
	        if (str)
	            return len === 2 * compressedLen || len === 2 * uncompressedLen;
	        if (item instanceof Point)
	            return true;
	        return false;
	    }
	    /**
	     * ECDH (Elliptic Curve Diffie Hellman).
	     * Computes shared public key from private key and public key.
	     * Checks: 1) private key validity 2) shared key is on-curve.
	     * Does NOT hash the result.
	     * @param privateA private key
	     * @param publicB different public key
	     * @param isCompressed whether to return compact (default), or full key
	     * @returns shared public key
	     */
	    function getSharedSecret(privateA, publicB, isCompressed = true) {
	        if (isProbPub(privateA))
	            throw new Error('first arg must be private key');
	        if (!isProbPub(publicB))
	            throw new Error('second arg must be public key');
	        const b = Point.fromHex(publicB); // check for being on-curve
	        return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
	    }
	    // RFC6979: ensure ECDSA msg is X bytes and < N. RFC suggests optional truncating via bits2octets.
	    // FIPS 186-4 4.6 suggests the leftmost min(nBitLen, outLen) bits, which matches bits2int.
	    // bits2int can produce res>N, we can do mod(res, N) since the bitLen is the same.
	    // int2octets can't be used; pads small msgs with 0: unacceptatble for trunc as per RFC vectors
	    const bits2int = CURVE.bits2int ||
	        function (bytes) {
	            // Our custom check "just in case"
	            if (bytes.length > 8192)
	                throw new Error('input is too large');
	            // For curves with nBitLength % 8 !== 0: bits2octets(bits2octets(m)) !== bits2octets(m)
	            // for some cases, since bytes.length * 8 is not actual bitLength.
	            const num = bytesToNumberBE(bytes); // check for == u8 done here
	            const delta = bytes.length * 8 - CURVE.nBitLength; // truncate to nBitLength leftmost bits
	            return delta > 0 ? num >> BigInt(delta) : num;
	        };
	    const bits2int_modN = CURVE.bits2int_modN ||
	        function (bytes) {
	            return modN(bits2int(bytes)); // can't use bytesToNumberBE here
	        };
	    // NOTE: pads output with zero as per spec
	    const ORDER_MASK = bitMask(CURVE.nBitLength);
	    /**
	     * Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`.
	     */
	    function int2octets(num) {
	        aInRange('num < 2^' + CURVE.nBitLength, num, _0n, ORDER_MASK);
	        // works with order, can have different size than numToField!
	        return numberToBytesBE(num, CURVE.nByteLength);
	    }
	    // Steps A, D of RFC6979 3.2
	    // Creates RFC6979 seed; converts msg/privKey to numbers.
	    // Used only in sign, not in verify.
	    // NOTE: we cannot assume here that msgHash has same amount of bytes as curve order,
	    // this will be invalid at least for P521. Also it can be bigger for P224 + SHA256
	    function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
	        if (['recovered', 'canonical'].some((k) => k in opts))
	            throw new Error('sign() legacy options not supported');
	        const { hash, randomBytes } = CURVE;
	        let { lowS, prehash, extraEntropy: ent } = opts; // generates low-s sigs by default
	        if (lowS == null)
	            lowS = true; // RFC6979 3.2: we skip step A, because we already provide hash
	        msgHash = ensureBytes('msgHash', msgHash);
	        validateSigVerOpts(opts);
	        if (prehash)
	            msgHash = ensureBytes('prehashed msgHash', hash(msgHash));
	        // We can't later call bits2octets, since nested bits2int is broken for curves
	        // with nBitLength % 8 !== 0. Because of that, we unwrap it here as int2octets call.
	        // const bits2octets = (bits) => int2octets(bits2int_modN(bits))
	        const h1int = bits2int_modN(msgHash);
	        const d = normPrivateKeyToScalar(privateKey); // validate private key, convert to bigint
	        const seedArgs = [int2octets(d), int2octets(h1int)];
	        // extraEntropy. RFC6979 3.6: additional k' (optional).
	        if (ent != null && ent !== false) {
	            // K = HMAC_K(V || 0x00 || int2octets(x) || bits2octets(h1) || k')
	            const e = ent === true ? randomBytes(Fp.BYTES) : ent; // generate random bytes OR pass as-is
	            seedArgs.push(ensureBytes('extraEntropy', e)); // check for being bytes
	        }
	        const seed = concatBytes(...seedArgs); // Step D of RFC6979 3.2
	        const m = h1int; // NOTE: no need to call bits2int second time here, it is inside truncateHash!
	        // Converts signature params into point w r/s, checks result for validity.
	        function k2sig(kBytes) {
	            // RFC 6979 Section 3.2, step 3: k = bits2int(T)
	            const k = bits2int(kBytes); // Cannot use fields methods, since it is group element
	            if (!isWithinCurveOrder(k))
	                return; // Important: all mod() calls here must be done over N
	            const ik = invN(k); // k^-1 mod n
	            const q = Point.BASE.multiply(k).toAffine(); // q = Gk
	            const r = modN(q.x); // r = q.x mod n
	            if (r === _0n)
	                return;
	            // Can use scalar blinding b^-1(bm + bdr) where b ∈ [1,q−1] according to
	            // https://tches.iacr.org/index.php/TCHES/article/view/7337/6509. We've decided against it:
	            // a) dependency on CSPRNG b) 15% slowdown c) doesn't really help since bigints are not CT
	            const s = modN(ik * modN(m + r * d)); // Not using blinding here
	            if (s === _0n)
	                return;
	            let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n$1); // recovery bit (2 or 3, when q.x > n)
	            let normS = s;
	            if (lowS && isBiggerThanHalfOrder(s)) {
	                normS = normalizeS(s); // if lowS was passed, ensure s is always
	                recovery ^= 1; // // in the bottom half of N
	            }
	            return new Signature(r, normS, recovery); // use normS, not s
	        }
	        return { seed, k2sig };
	    }
	    const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
	    const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
	    /**
	     * Signs message hash with a private key.
	     * ```
	     * sign(m, d, k) where
	     *   (x, y) = G × k
	     *   r = x mod n
	     *   s = (m + dr)/k mod n
	     * ```
	     * @param msgHash NOT message. msg needs to be hashed to `msgHash`, or use `prehash`.
	     * @param privKey private key
	     * @param opts lowS for non-malleable sigs. extraEntropy for mixing randomness into k. prehash will hash first arg.
	     * @returns signature with recovery param
	     */
	    function sign(msgHash, privKey, opts = defaultSigOpts) {
	        const { seed, k2sig } = prepSig(msgHash, privKey, opts); // Steps A, D of RFC6979 3.2.
	        const C = CURVE;
	        const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
	        return drbg(seed, k2sig); // Steps B, C, D, E, F, G
	    }
	    // Enable precomputes. Slows down first publicKey computation by 20ms.
	    Point.BASE._setWindowSize(8);
	    // utils.precompute(8, ProjectivePoint.BASE)
	    /**
	     * Verifies a signature against message hash and public key.
	     * Rejects lowS signatures by default: to override,
	     * specify option `{lowS: false}`. Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
	     *
	     * ```
	     * verify(r, s, h, P) where
	     *   U1 = hs^-1 mod n
	     *   U2 = rs^-1 mod n
	     *   R = U1⋅G - U2⋅P
	     *   mod(R.x, n) == r
	     * ```
	     */
	    function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
	        const sg = signature;
	        msgHash = ensureBytes('msgHash', msgHash);
	        publicKey = ensureBytes('publicKey', publicKey);
	        const { lowS, prehash, format } = opts;
	        // Verify opts, deduce signature format
	        validateSigVerOpts(opts);
	        if ('strict' in opts)
	            throw new Error('options.strict was renamed to lowS');
	        if (format !== undefined && format !== 'compact' && format !== 'der')
	            throw new Error('format must be compact or der');
	        const isHex = typeof sg === 'string' || isBytes$1(sg);
	        const isObj = !isHex &&
	            !format &&
	            typeof sg === 'object' &&
	            sg !== null &&
	            typeof sg.r === 'bigint' &&
	            typeof sg.s === 'bigint';
	        if (!isHex && !isObj)
	            throw new Error('invalid signature, expected Uint8Array, hex string or Signature instance');
	        let _sig = undefined;
	        let P;
	        try {
	            if (isObj)
	                _sig = new Signature(sg.r, sg.s);
	            if (isHex) {
	                // Signature can be represented in 2 ways: compact (2*nByteLength) & DER (variable-length).
	                // Since DER can also be 2*nByteLength bytes, we check for it first.
	                try {
	                    if (format !== 'compact')
	                        _sig = Signature.fromDER(sg);
	                }
	                catch (derError) {
	                    if (!(derError instanceof DER.Err))
	                        throw derError;
	                }
	                if (!_sig && format !== 'der')
	                    _sig = Signature.fromCompact(sg);
	            }
	            P = Point.fromHex(publicKey);
	        }
	        catch (error) {
	            return false;
	        }
	        if (!_sig)
	            return false;
	        if (lowS && _sig.hasHighS())
	            return false;
	        if (prehash)
	            msgHash = CURVE.hash(msgHash);
	        const { r, s } = _sig;
	        const h = bits2int_modN(msgHash); // Cannot use fields methods, since it is group element
	        const is = invN(s); // s^-1
	        const u1 = modN(h * is); // u1 = hs^-1 mod n
	        const u2 = modN(r * is); // u2 = rs^-1 mod n
	        const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine(); // R = u1⋅G + u2⋅P
	        if (!R)
	            return false;
	        const v = modN(R.x);
	        return v === r;
	    }
	    return {
	        CURVE,
	        getPublicKey,
	        getSharedSecret,
	        sign,
	        verify,
	        ProjectivePoint: Point,
	        Signature,
	        utils,
	    };
	}

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	// connects noble-curves to noble-hashes
	function getHash(hash) {
	    return {
	        hash,
	        hmac: (key, ...msgs) => hmac(hash, key, concatBytes$1(...msgs)),
	        randomBytes,
	    };
	}
	function createCurve(curveDef, defHash) {
	    const create = (hash) => weierstrass({ ...curveDef, ...getHash(hash) });
	    return Object.freeze({ ...create(defHash), create });
	}

	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const secp256k1P = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
	const secp256k1N = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
	const _1n = BigInt(1);
	const _2n = BigInt(2);
	const divNearest = (a, b) => (a + b / _2n) / b;
	/**
	 * √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
	 * (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
	 */
	function sqrtMod(y) {
	    const P = secp256k1P;
	    // prettier-ignore
	    const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
	    // prettier-ignore
	    const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
	    const b2 = (y * y * y) % P; // x^3, 11
	    const b3 = (b2 * b2 * y) % P; // x^7
	    const b6 = (pow2(b3, _3n, P) * b3) % P;
	    const b9 = (pow2(b6, _3n, P) * b3) % P;
	    const b11 = (pow2(b9, _2n, P) * b2) % P;
	    const b22 = (pow2(b11, _11n, P) * b11) % P;
	    const b44 = (pow2(b22, _22n, P) * b22) % P;
	    const b88 = (pow2(b44, _44n, P) * b44) % P;
	    const b176 = (pow2(b88, _88n, P) * b88) % P;
	    const b220 = (pow2(b176, _44n, P) * b44) % P;
	    const b223 = (pow2(b220, _3n, P) * b3) % P;
	    const t1 = (pow2(b223, _23n, P) * b22) % P;
	    const t2 = (pow2(t1, _6n, P) * b2) % P;
	    const root = pow2(t2, _2n, P);
	    if (!Fpk1.eql(Fpk1.sqr(root), y))
	        throw new Error('Cannot find square root');
	    return root;
	}
	const Fpk1 = Field(secp256k1P, undefined, undefined, { sqrt: sqrtMod });
	/**
	 * secp256k1 short weierstrass curve and ECDSA signatures over it.
	 */
	const secp256k1 = createCurve({
	    a: BigInt(0), // equation params: a, b
	    b: BigInt(7), // Seem to be rigid: bitcointalk.org/index.php?topic=289795.msg3183975#msg3183975
	    Fp: Fpk1, // Field's prime: 2n**256n - 2n**32n - 2n**9n - 2n**8n - 2n**7n - 2n**6n - 2n**4n - 1n
	    n: secp256k1N, // Curve order, total count of valid points in the field
	    // Base point (x, y) aka generator point
	    Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
	    Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
	    h: BigInt(1), // Cofactor
	    lowS: true, // Allow only low-S signatures by default in sign() and verify()
	    /**
	     * secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
	     * Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
	     * For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
	     * Explanation: https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
	     */
	    endo: {
	        beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
	        splitScalar: (k) => {
	            const n = secp256k1N;
	            const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
	            const b1 = -_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
	            const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
	            const b2 = a1;
	            const POW_2_128 = BigInt('0x100000000000000000000000000000000'); // (2n**128n).toString(16)
	            const c1 = divNearest(b2 * k, n);
	            const c2 = divNearest(-b1 * k, n);
	            let k1 = mod(k - c1 * a1 - c2 * a2, n);
	            let k2 = mod(-c1 * b1 - c2 * b2, n);
	            const k1neg = k1 > POW_2_128;
	            const k2neg = k2 > POW_2_128;
	            if (k1neg)
	                k1 = n - k1;
	            if (k2neg)
	                k2 = n - k2;
	            if (k1 > POW_2_128 || k2 > POW_2_128) {
	                throw new Error('splitScalar: Endomorphism failed, k=' + k);
	            }
	            return { k1neg, k1, k2neg, k2 };
	        },
	    },
	}, sha256);
	// Schnorr signatures are superior to ECDSA from above. Below is Schnorr-specific BIP0340 code.
	// https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
	BigInt(0);
	secp256k1.ProjectivePoint;

	const ecdsaSign = (msgHash, privKey) => {
	  const signature = secp256k1.sign(msgHash, privKey);
	  return [signature.toCompactRawBytes(), signature.recovery];
	};
	secp256k1.utils.isValidPrivateKey;
	const publicKeyCreate = secp256k1.getPublicKey;

	const PRIVATE_KEY_BYTES = 32;
	const ETHEREUM_ADDRESS_BYTES = 20;
	const PUBLIC_KEY_BYTES = 64;
	const SIGNATURE_OFFSETS_SERIALIZED_SIZE = 11;

	/**
	 * Params for creating an secp256k1 instruction using a public key
	 */

	/**
	 * Params for creating an secp256k1 instruction using an Ethereum address
	 */

	/**
	 * Params for creating an secp256k1 instruction using a private key
	 */

	const SECP256K1_INSTRUCTION_LAYOUT = LayoutExports.struct([LayoutExports.u8('numSignatures'), LayoutExports.u16('signatureOffset'), LayoutExports.u8('signatureInstructionIndex'), LayoutExports.u16('ethAddressOffset'), LayoutExports.u8('ethAddressInstructionIndex'), LayoutExports.u16('messageDataOffset'), LayoutExports.u16('messageDataSize'), LayoutExports.u8('messageInstructionIndex'), LayoutExports.blob(20, 'ethAddress'), LayoutExports.blob(64, 'signature'), LayoutExports.u8('recoveryId')]);
	class Secp256k1Program {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Public key that identifies the secp256k1 program
	   */

	  /**
	   * Construct an Ethereum address from a secp256k1 public key buffer.
	   * @param {Buffer} publicKey a 64 byte secp256k1 public key buffer
	   */
	  static publicKeyToEthAddress(publicKey) {
	    assert$1(publicKey.length === PUBLIC_KEY_BYTES, `Public key must be ${PUBLIC_KEY_BYTES} bytes but received ${publicKey.length} bytes`);
	    try {
	      return bufferExports.Buffer.from(keccak_256(toBuffer(publicKey))).slice(-ETHEREUM_ADDRESS_BYTES);
	    } catch (error) {
	      throw new Error(`Error constructing Ethereum address: ${error}`);
	    }
	  }

	  /**
	   * Create an secp256k1 instruction with a public key. The public key
	   * must be a buffer that is 64 bytes long.
	   */
	  static createInstructionWithPublicKey(params) {
	    const {
	      publicKey,
	      message,
	      signature,
	      recoveryId,
	      instructionIndex
	    } = params;
	    return Secp256k1Program.createInstructionWithEthAddress({
	      ethAddress: Secp256k1Program.publicKeyToEthAddress(publicKey),
	      message,
	      signature,
	      recoveryId,
	      instructionIndex
	    });
	  }

	  /**
	   * Create an secp256k1 instruction with an Ethereum address. The address
	   * must be a hex string or a buffer that is 20 bytes long.
	   */
	  static createInstructionWithEthAddress(params) {
	    const {
	      ethAddress: rawAddress,
	      message,
	      signature,
	      recoveryId,
	      instructionIndex = 0
	    } = params;
	    let ethAddress;
	    if (typeof rawAddress === 'string') {
	      if (rawAddress.startsWith('0x')) {
	        ethAddress = bufferExports.Buffer.from(rawAddress.substr(2), 'hex');
	      } else {
	        ethAddress = bufferExports.Buffer.from(rawAddress, 'hex');
	      }
	    } else {
	      ethAddress = rawAddress;
	    }
	    assert$1(ethAddress.length === ETHEREUM_ADDRESS_BYTES, `Address must be ${ETHEREUM_ADDRESS_BYTES} bytes but received ${ethAddress.length} bytes`);
	    const dataStart = 1 + SIGNATURE_OFFSETS_SERIALIZED_SIZE;
	    const ethAddressOffset = dataStart;
	    const signatureOffset = dataStart + ethAddress.length;
	    const messageDataOffset = signatureOffset + signature.length + 1;
	    const numSignatures = 1;
	    const instructionData = bufferExports.Buffer.alloc(SECP256K1_INSTRUCTION_LAYOUT.span + message.length);
	    SECP256K1_INSTRUCTION_LAYOUT.encode({
	      numSignatures,
	      signatureOffset,
	      signatureInstructionIndex: instructionIndex,
	      ethAddressOffset,
	      ethAddressInstructionIndex: instructionIndex,
	      messageDataOffset,
	      messageDataSize: message.length,
	      messageInstructionIndex: instructionIndex,
	      signature: toBuffer(signature),
	      ethAddress: toBuffer(ethAddress),
	      recoveryId
	    }, instructionData);
	    instructionData.fill(toBuffer(message), SECP256K1_INSTRUCTION_LAYOUT.span);
	    return new TransactionInstruction({
	      keys: [],
	      programId: Secp256k1Program.programId,
	      data: instructionData
	    });
	  }

	  /**
	   * Create an secp256k1 instruction with a private key. The private key
	   * must be a buffer that is 32 bytes long.
	   */
	  static createInstructionWithPrivateKey(params) {
	    const {
	      privateKey: pkey,
	      message,
	      instructionIndex
	    } = params;
	    assert$1(pkey.length === PRIVATE_KEY_BYTES, `Private key must be ${PRIVATE_KEY_BYTES} bytes but received ${pkey.length} bytes`);
	    try {
	      const privateKey = toBuffer(pkey);
	      const publicKey = publicKeyCreate(privateKey, false /* isCompressed */).slice(1); // throw away leading byte
	      const messageHash = bufferExports.Buffer.from(keccak_256(toBuffer(message)));
	      const [signature, recoveryId] = ecdsaSign(messageHash, privateKey);
	      return this.createInstructionWithPublicKey({
	        publicKey,
	        message,
	        signature,
	        recoveryId,
	        instructionIndex
	      });
	    } catch (error) {
	      throw new Error(`Error creating instruction; ${error}`);
	    }
	  }
	}
	Secp256k1Program.programId = new PublicKey('KeccakSecp256k11111111111111111111111111111');

	var _Lockup;

	/**
	 * Address of the stake config account which configures the rate
	 * of stake warmup and cooldown as well as the slashing penalty.
	 */
	const STAKE_CONFIG_ID = new PublicKey('StakeConfig11111111111111111111111111111111');

	/**
	 * Stake account authority info
	 */
	class Authorized {
	  /**
	   * Create a new Authorized object
	   * @param staker the stake authority
	   * @param withdrawer the withdraw authority
	   */
	  constructor(staker, withdrawer) {
	    /** stake authority */
	    this.staker = void 0;
	    /** withdraw authority */
	    this.withdrawer = void 0;
	    this.staker = staker;
	    this.withdrawer = withdrawer;
	  }
	}
	/**
	 * Stake account lockup info
	 */
	class Lockup {
	  /**
	   * Create a new Lockup object
	   */
	  constructor(unixTimestamp, epoch, custodian) {
	    /** Unix timestamp of lockup expiration */
	    this.unixTimestamp = void 0;
	    /** Epoch of lockup expiration */
	    this.epoch = void 0;
	    /** Lockup custodian authority */
	    this.custodian = void 0;
	    this.unixTimestamp = unixTimestamp;
	    this.epoch = epoch;
	    this.custodian = custodian;
	  }

	  /**
	   * Default, inactive Lockup value
	   */
	}
	_Lockup = Lockup;
	Lockup.default = new _Lockup(0, 0, PublicKey.default);
	/**
	 * Create stake account transaction params
	 */
	/**
	 * Create stake account with seed transaction params
	 */
	/**
	 * Initialize stake instruction params
	 */
	/**
	 * Delegate stake instruction params
	 */
	/**
	 * Authorize stake instruction params
	 */
	/**
	 * Authorize stake instruction params using a derived key
	 */
	/**
	 * Split stake instruction params
	 */
	/**
	 * Split with seed transaction params
	 */
	/**
	 * Withdraw stake instruction params
	 */
	/**
	 * Deactivate stake instruction params
	 */
	/**
	 * Merge stake instruction params
	 */
	/**
	 * Stake Instruction class
	 */
	class StakeInstruction {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Decode a stake instruction and retrieve the instruction type.
	   */
	  static decodeInstructionType(instruction) {
	    this.checkProgramId(instruction.programId);
	    const instructionTypeLayout = LayoutExports.u32('instruction');
	    const typeIndex = instructionTypeLayout.decode(instruction.data);
	    let type;
	    for (const [ixType, layout] of Object.entries(STAKE_INSTRUCTION_LAYOUTS)) {
	      if (layout.index == typeIndex) {
	        type = ixType;
	        break;
	      }
	    }
	    if (!type) {
	      throw new Error('Instruction type incorrect; not a StakeInstruction');
	    }
	    return type;
	  }

	  /**
	   * Decode a initialize stake instruction and retrieve the instruction params.
	   */
	  static decodeInitialize(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 2);
	    const {
	      authorized,
	      lockup
	    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Initialize, instruction.data);
	    return {
	      stakePubkey: instruction.keys[0].pubkey,
	      authorized: new Authorized(new PublicKey(authorized.staker), new PublicKey(authorized.withdrawer)),
	      lockup: new Lockup(lockup.unixTimestamp, lockup.epoch, new PublicKey(lockup.custodian))
	    };
	  }

	  /**
	   * Decode a delegate stake instruction and retrieve the instruction params.
	   */
	  static decodeDelegate(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 6);
	    decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Delegate, instruction.data);
	    return {
	      stakePubkey: instruction.keys[0].pubkey,
	      votePubkey: instruction.keys[1].pubkey,
	      authorizedPubkey: instruction.keys[5].pubkey
	    };
	  }

	  /**
	   * Decode an authorize stake instruction and retrieve the instruction params.
	   */
	  static decodeAuthorize(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    const {
	      newAuthorized,
	      stakeAuthorizationType
	    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Authorize, instruction.data);
	    const o = {
	      stakePubkey: instruction.keys[0].pubkey,
	      authorizedPubkey: instruction.keys[2].pubkey,
	      newAuthorizedPubkey: new PublicKey(newAuthorized),
	      stakeAuthorizationType: {
	        index: stakeAuthorizationType
	      }
	    };
	    if (instruction.keys.length > 3) {
	      o.custodianPubkey = instruction.keys[3].pubkey;
	    }
	    return o;
	  }

	  /**
	   * Decode an authorize-with-seed stake instruction and retrieve the instruction params.
	   */
	  static decodeAuthorizeWithSeed(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 2);
	    const {
	      newAuthorized,
	      stakeAuthorizationType,
	      authoritySeed,
	      authorityOwner
	    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed, instruction.data);
	    const o = {
	      stakePubkey: instruction.keys[0].pubkey,
	      authorityBase: instruction.keys[1].pubkey,
	      authoritySeed: authoritySeed,
	      authorityOwner: new PublicKey(authorityOwner),
	      newAuthorizedPubkey: new PublicKey(newAuthorized),
	      stakeAuthorizationType: {
	        index: stakeAuthorizationType
	      }
	    };
	    if (instruction.keys.length > 3) {
	      o.custodianPubkey = instruction.keys[3].pubkey;
	    }
	    return o;
	  }

	  /**
	   * Decode a split stake instruction and retrieve the instruction params.
	   */
	  static decodeSplit(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    const {
	      lamports
	    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Split, instruction.data);
	    return {
	      stakePubkey: instruction.keys[0].pubkey,
	      splitStakePubkey: instruction.keys[1].pubkey,
	      authorizedPubkey: instruction.keys[2].pubkey,
	      lamports
	    };
	  }

	  /**
	   * Decode a merge stake instruction and retrieve the instruction params.
	   */
	  static decodeMerge(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Merge, instruction.data);
	    return {
	      stakePubkey: instruction.keys[0].pubkey,
	      sourceStakePubKey: instruction.keys[1].pubkey,
	      authorizedPubkey: instruction.keys[4].pubkey
	    };
	  }

	  /**
	   * Decode a withdraw stake instruction and retrieve the instruction params.
	   */
	  static decodeWithdraw(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 5);
	    const {
	      lamports
	    } = decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Withdraw, instruction.data);
	    const o = {
	      stakePubkey: instruction.keys[0].pubkey,
	      toPubkey: instruction.keys[1].pubkey,
	      authorizedPubkey: instruction.keys[4].pubkey,
	      lamports
	    };
	    if (instruction.keys.length > 5) {
	      o.custodianPubkey = instruction.keys[5].pubkey;
	    }
	    return o;
	  }

	  /**
	   * Decode a deactivate stake instruction and retrieve the instruction params.
	   */
	  static decodeDeactivate(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    decodeData$1(STAKE_INSTRUCTION_LAYOUTS.Deactivate, instruction.data);
	    return {
	      stakePubkey: instruction.keys[0].pubkey,
	      authorizedPubkey: instruction.keys[2].pubkey
	    };
	  }

	  /**
	   * @internal
	   */
	  static checkProgramId(programId) {
	    if (!programId.equals(StakeProgram.programId)) {
	      throw new Error('invalid instruction; programId is not StakeProgram');
	    }
	  }

	  /**
	   * @internal
	   */
	  static checkKeyLength(keys, expectedLength) {
	    if (keys.length < expectedLength) {
	      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
	    }
	  }
	}

	/**
	 * An enumeration of valid StakeInstructionType's
	 */

	/**
	 * An enumeration of valid stake InstructionType's
	 * @internal
	 */
	const STAKE_INSTRUCTION_LAYOUTS = Object.freeze({
	  Initialize: {
	    index: 0,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), authorized(), lockup()])
	  },
	  Authorize: {
	    index: 1,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('newAuthorized'), LayoutExports.u32('stakeAuthorizationType')])
	  },
	  Delegate: {
	    index: 2,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  },
	  Split: {
	    index: 3,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), LayoutExports.ns64('lamports')])
	  },
	  Withdraw: {
	    index: 4,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), LayoutExports.ns64('lamports')])
	  },
	  Deactivate: {
	    index: 5,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  },
	  Merge: {
	    index: 7,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  },
	  AuthorizeWithSeed: {
	    index: 8,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('newAuthorized'), LayoutExports.u32('stakeAuthorizationType'), rustString('authoritySeed'), publicKey('authorityOwner')])
	  }
	});

	/**
	 * Stake authorization type
	 */

	/**
	 * An enumeration of valid StakeAuthorizationLayout's
	 */
	const StakeAuthorizationLayout = Object.freeze({
	  Staker: {
	    index: 0
	  },
	  Withdrawer: {
	    index: 1
	  }
	});

	/**
	 * Factory class for transactions to interact with the Stake program
	 */
	class StakeProgram {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Public key that identifies the Stake program
	   */

	  /**
	   * Generate an Initialize instruction to add to a Stake Create transaction
	   */
	  static initialize(params) {
	    const {
	      stakePubkey,
	      authorized,
	      lockup: maybeLockup
	    } = params;
	    const lockup = maybeLockup || Lockup.default;
	    const type = STAKE_INSTRUCTION_LAYOUTS.Initialize;
	    const data = encodeData(type, {
	      authorized: {
	        staker: toBuffer(authorized.staker.toBuffer()),
	        withdrawer: toBuffer(authorized.withdrawer.toBuffer())
	      },
	      lockup: {
	        unixTimestamp: lockup.unixTimestamp,
	        epoch: lockup.epoch,
	        custodian: toBuffer(lockup.custodian.toBuffer())
	      }
	    });
	    const instructionData = {
	      keys: [{
	        pubkey: stakePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: SYSVAR_RENT_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    };
	    return new TransactionInstruction(instructionData);
	  }

	  /**
	   * Generate a Transaction that creates a new Stake account at
	   *   an address generated with `from`, a seed, and the Stake programId
	   */
	  static createAccountWithSeed(params) {
	    const transaction = new Transaction();
	    transaction.add(SystemProgram.createAccountWithSeed({
	      fromPubkey: params.fromPubkey,
	      newAccountPubkey: params.stakePubkey,
	      basePubkey: params.basePubkey,
	      seed: params.seed,
	      lamports: params.lamports,
	      space: this.space,
	      programId: this.programId
	    }));
	    const {
	      stakePubkey,
	      authorized,
	      lockup
	    } = params;
	    return transaction.add(this.initialize({
	      stakePubkey,
	      authorized,
	      lockup
	    }));
	  }

	  /**
	   * Generate a Transaction that creates a new Stake account
	   */
	  static createAccount(params) {
	    const transaction = new Transaction();
	    transaction.add(SystemProgram.createAccount({
	      fromPubkey: params.fromPubkey,
	      newAccountPubkey: params.stakePubkey,
	      lamports: params.lamports,
	      space: this.space,
	      programId: this.programId
	    }));
	    const {
	      stakePubkey,
	      authorized,
	      lockup
	    } = params;
	    return transaction.add(this.initialize({
	      stakePubkey,
	      authorized,
	      lockup
	    }));
	  }

	  /**
	   * Generate a Transaction that delegates Stake tokens to a validator
	   * Vote PublicKey. This transaction can also be used to redelegate Stake
	   * to a new validator Vote PublicKey.
	   */
	  static delegate(params) {
	    const {
	      stakePubkey,
	      authorizedPubkey,
	      votePubkey
	    } = params;
	    const type = STAKE_INSTRUCTION_LAYOUTS.Delegate;
	    const data = encodeData(type);
	    return new Transaction().add({
	      keys: [{
	        pubkey: stakePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: votePubkey,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: SYSVAR_CLOCK_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: STAKE_CONFIG_ID,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: authorizedPubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a Transaction that authorizes a new PublicKey as Staker
	   * or Withdrawer on the Stake account.
	   */
	  static authorize(params) {
	    const {
	      stakePubkey,
	      authorizedPubkey,
	      newAuthorizedPubkey,
	      stakeAuthorizationType,
	      custodianPubkey
	    } = params;
	    const type = STAKE_INSTRUCTION_LAYOUTS.Authorize;
	    const data = encodeData(type, {
	      newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
	      stakeAuthorizationType: stakeAuthorizationType.index
	    });
	    const keys = [{
	      pubkey: stakePubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: SYSVAR_CLOCK_PUBKEY,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: authorizedPubkey,
	      isSigner: true,
	      isWritable: false
	    }];
	    if (custodianPubkey) {
	      keys.push({
	        pubkey: custodianPubkey,
	        isSigner: true,
	        isWritable: false
	      });
	    }
	    return new Transaction().add({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a Transaction that authorizes a new PublicKey as Staker
	   * or Withdrawer on the Stake account.
	   */
	  static authorizeWithSeed(params) {
	    const {
	      stakePubkey,
	      authorityBase,
	      authoritySeed,
	      authorityOwner,
	      newAuthorizedPubkey,
	      stakeAuthorizationType,
	      custodianPubkey
	    } = params;
	    const type = STAKE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed;
	    const data = encodeData(type, {
	      newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
	      stakeAuthorizationType: stakeAuthorizationType.index,
	      authoritySeed: authoritySeed,
	      authorityOwner: toBuffer(authorityOwner.toBuffer())
	    });
	    const keys = [{
	      pubkey: stakePubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: authorityBase,
	      isSigner: true,
	      isWritable: false
	    }, {
	      pubkey: SYSVAR_CLOCK_PUBKEY,
	      isSigner: false,
	      isWritable: false
	    }];
	    if (custodianPubkey) {
	      keys.push({
	        pubkey: custodianPubkey,
	        isSigner: true,
	        isWritable: false
	      });
	    }
	    return new Transaction().add({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * @internal
	   */
	  static splitInstruction(params) {
	    const {
	      stakePubkey,
	      authorizedPubkey,
	      splitStakePubkey,
	      lamports
	    } = params;
	    const type = STAKE_INSTRUCTION_LAYOUTS.Split;
	    const data = encodeData(type, {
	      lamports
	    });
	    return new TransactionInstruction({
	      keys: [{
	        pubkey: stakePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: splitStakePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: authorizedPubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a Transaction that splits Stake tokens into another stake account
	   */
	  static split(params,
	  // Compute the cost of allocating the new stake account in lamports
	  rentExemptReserve) {
	    const transaction = new Transaction();
	    transaction.add(SystemProgram.createAccount({
	      fromPubkey: params.authorizedPubkey,
	      newAccountPubkey: params.splitStakePubkey,
	      lamports: rentExemptReserve,
	      space: this.space,
	      programId: this.programId
	    }));
	    return transaction.add(this.splitInstruction(params));
	  }

	  /**
	   * Generate a Transaction that splits Stake tokens into another account
	   * derived from a base public key and seed
	   */
	  static splitWithSeed(params,
	  // If this stake account is new, compute the cost of allocating it in lamports
	  rentExemptReserve) {
	    const {
	      stakePubkey,
	      authorizedPubkey,
	      splitStakePubkey,
	      basePubkey,
	      seed,
	      lamports
	    } = params;
	    const transaction = new Transaction();
	    transaction.add(SystemProgram.allocate({
	      accountPubkey: splitStakePubkey,
	      basePubkey,
	      seed,
	      space: this.space,
	      programId: this.programId
	    }));
	    if (rentExemptReserve && rentExemptReserve > 0) {
	      transaction.add(SystemProgram.transfer({
	        fromPubkey: params.authorizedPubkey,
	        toPubkey: splitStakePubkey,
	        lamports: rentExemptReserve
	      }));
	    }
	    return transaction.add(this.splitInstruction({
	      stakePubkey,
	      authorizedPubkey,
	      splitStakePubkey,
	      lamports
	    }));
	  }

	  /**
	   * Generate a Transaction that merges Stake accounts.
	   */
	  static merge(params) {
	    const {
	      stakePubkey,
	      sourceStakePubKey,
	      authorizedPubkey
	    } = params;
	    const type = STAKE_INSTRUCTION_LAYOUTS.Merge;
	    const data = encodeData(type);
	    return new Transaction().add({
	      keys: [{
	        pubkey: stakePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: sourceStakePubKey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: SYSVAR_CLOCK_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: authorizedPubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a Transaction that withdraws deactivated Stake tokens.
	   */
	  static withdraw(params) {
	    const {
	      stakePubkey,
	      authorizedPubkey,
	      toPubkey,
	      lamports,
	      custodianPubkey
	    } = params;
	    const type = STAKE_INSTRUCTION_LAYOUTS.Withdraw;
	    const data = encodeData(type, {
	      lamports
	    });
	    const keys = [{
	      pubkey: stakePubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: toPubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: SYSVAR_CLOCK_PUBKEY,
	      isSigner: false,
	      isWritable: false
	    }, {
	      pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
	      isSigner: false,
	      isWritable: false
	    }, {
	      pubkey: authorizedPubkey,
	      isSigner: true,
	      isWritable: false
	    }];
	    if (custodianPubkey) {
	      keys.push({
	        pubkey: custodianPubkey,
	        isSigner: true,
	        isWritable: false
	      });
	    }
	    return new Transaction().add({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a Transaction that deactivates Stake tokens.
	   */
	  static deactivate(params) {
	    const {
	      stakePubkey,
	      authorizedPubkey
	    } = params;
	    const type = STAKE_INSTRUCTION_LAYOUTS.Deactivate;
	    const data = encodeData(type);
	    return new Transaction().add({
	      keys: [{
	        pubkey: stakePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: SYSVAR_CLOCK_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: authorizedPubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    });
	  }
	}
	StakeProgram.programId = new PublicKey('Stake11111111111111111111111111111111111111');
	/**
	 * Max space of a Stake account
	 *
	 * This is generated from the solana-stake-program StakeState struct as
	 * `StakeStateV2::size_of()`:
	 * https://docs.rs/solana-stake-program/latest/solana_stake_program/stake_state/enum.StakeStateV2.html
	 */
	StakeProgram.space = 200;

	/**
	 * Vote account info
	 */
	class VoteInit {
	  /** [0, 100] */

	  constructor(nodePubkey, authorizedVoter, authorizedWithdrawer, commission) {
	    this.nodePubkey = void 0;
	    this.authorizedVoter = void 0;
	    this.authorizedWithdrawer = void 0;
	    this.commission = void 0;
	    this.nodePubkey = nodePubkey;
	    this.authorizedVoter = authorizedVoter;
	    this.authorizedWithdrawer = authorizedWithdrawer;
	    this.commission = commission;
	  }
	}

	/**
	 * Create vote account transaction params
	 */

	/**
	 * InitializeAccount instruction params
	 */

	/**
	 * Authorize instruction params
	 */

	/**
	 * AuthorizeWithSeed instruction params
	 */

	/**
	 * Withdraw from vote account transaction params
	 */

	/**
	 * Update validator identity (node pubkey) vote account instruction params.
	 */

	/**
	 * Vote Instruction class
	 */
	class VoteInstruction {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Decode a vote instruction and retrieve the instruction type.
	   */
	  static decodeInstructionType(instruction) {
	    this.checkProgramId(instruction.programId);
	    const instructionTypeLayout = LayoutExports.u32('instruction');
	    const typeIndex = instructionTypeLayout.decode(instruction.data);
	    let type;
	    for (const [ixType, layout] of Object.entries(VOTE_INSTRUCTION_LAYOUTS)) {
	      if (layout.index == typeIndex) {
	        type = ixType;
	        break;
	      }
	    }
	    if (!type) {
	      throw new Error('Instruction type incorrect; not a VoteInstruction');
	    }
	    return type;
	  }

	  /**
	   * Decode an initialize vote instruction and retrieve the instruction params.
	   */
	  static decodeInitializeAccount(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 4);
	    const {
	      voteInit
	    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.InitializeAccount, instruction.data);
	    return {
	      votePubkey: instruction.keys[0].pubkey,
	      nodePubkey: instruction.keys[3].pubkey,
	      voteInit: new VoteInit(new PublicKey(voteInit.nodePubkey), new PublicKey(voteInit.authorizedVoter), new PublicKey(voteInit.authorizedWithdrawer), voteInit.commission)
	    };
	  }

	  /**
	   * Decode an authorize instruction and retrieve the instruction params.
	   */
	  static decodeAuthorize(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    const {
	      newAuthorized,
	      voteAuthorizationType
	    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.Authorize, instruction.data);
	    return {
	      votePubkey: instruction.keys[0].pubkey,
	      authorizedPubkey: instruction.keys[2].pubkey,
	      newAuthorizedPubkey: new PublicKey(newAuthorized),
	      voteAuthorizationType: {
	        index: voteAuthorizationType
	      }
	    };
	  }

	  /**
	   * Decode an authorize instruction and retrieve the instruction params.
	   */
	  static decodeAuthorizeWithSeed(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    const {
	      voteAuthorizeWithSeedArgs: {
	        currentAuthorityDerivedKeyOwnerPubkey,
	        currentAuthorityDerivedKeySeed,
	        newAuthorized,
	        voteAuthorizationType
	      }
	    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed, instruction.data);
	    return {
	      currentAuthorityDerivedKeyBasePubkey: instruction.keys[2].pubkey,
	      currentAuthorityDerivedKeyOwnerPubkey: new PublicKey(currentAuthorityDerivedKeyOwnerPubkey),
	      currentAuthorityDerivedKeySeed: currentAuthorityDerivedKeySeed,
	      newAuthorizedPubkey: new PublicKey(newAuthorized),
	      voteAuthorizationType: {
	        index: voteAuthorizationType
	      },
	      votePubkey: instruction.keys[0].pubkey
	    };
	  }

	  /**
	   * Decode a withdraw instruction and retrieve the instruction params.
	   */
	  static decodeWithdraw(instruction) {
	    this.checkProgramId(instruction.programId);
	    this.checkKeyLength(instruction.keys, 3);
	    const {
	      lamports
	    } = decodeData$1(VOTE_INSTRUCTION_LAYOUTS.Withdraw, instruction.data);
	    return {
	      votePubkey: instruction.keys[0].pubkey,
	      authorizedWithdrawerPubkey: instruction.keys[2].pubkey,
	      lamports,
	      toPubkey: instruction.keys[1].pubkey
	    };
	  }

	  /**
	   * @internal
	   */
	  static checkProgramId(programId) {
	    if (!programId.equals(VoteProgram.programId)) {
	      throw new Error('invalid instruction; programId is not VoteProgram');
	    }
	  }

	  /**
	   * @internal
	   */
	  static checkKeyLength(keys, expectedLength) {
	    if (keys.length < expectedLength) {
	      throw new Error(`invalid instruction; found ${keys.length} keys, expected at least ${expectedLength}`);
	    }
	  }
	}

	/**
	 * An enumeration of valid VoteInstructionType's
	 */

	/** @internal */

	const VOTE_INSTRUCTION_LAYOUTS = Object.freeze({
	  InitializeAccount: {
	    index: 0,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), voteInit()])
	  },
	  Authorize: {
	    index: 1,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), publicKey('newAuthorized'), LayoutExports.u32('voteAuthorizationType')])
	  },
	  Withdraw: {
	    index: 3,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), LayoutExports.ns64('lamports')])
	  },
	  UpdateValidatorIdentity: {
	    index: 4,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction')])
	  },
	  AuthorizeWithSeed: {
	    index: 10,
	    layout: LayoutExports.struct([LayoutExports.u32('instruction'), voteAuthorizeWithSeedArgs()])
	  }
	});

	/**
	 * VoteAuthorize type
	 */

	/**
	 * An enumeration of valid VoteAuthorization layouts.
	 */
	const VoteAuthorizationLayout = Object.freeze({
	  Voter: {
	    index: 0
	  },
	  Withdrawer: {
	    index: 1
	  }
	});

	/**
	 * Factory class for transactions to interact with the Vote program
	 */
	class VoteProgram {
	  /**
	   * @internal
	   */
	  constructor() {}

	  /**
	   * Public key that identifies the Vote program
	   */

	  /**
	   * Generate an Initialize instruction.
	   */
	  static initializeAccount(params) {
	    const {
	      votePubkey,
	      nodePubkey,
	      voteInit
	    } = params;
	    const type = VOTE_INSTRUCTION_LAYOUTS.InitializeAccount;
	    const data = encodeData(type, {
	      voteInit: {
	        nodePubkey: toBuffer(voteInit.nodePubkey.toBuffer()),
	        authorizedVoter: toBuffer(voteInit.authorizedVoter.toBuffer()),
	        authorizedWithdrawer: toBuffer(voteInit.authorizedWithdrawer.toBuffer()),
	        commission: voteInit.commission
	      }
	    });
	    const instructionData = {
	      keys: [{
	        pubkey: votePubkey,
	        isSigner: false,
	        isWritable: true
	      }, {
	        pubkey: SYSVAR_RENT_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: SYSVAR_CLOCK_PUBKEY,
	        isSigner: false,
	        isWritable: false
	      }, {
	        pubkey: nodePubkey,
	        isSigner: true,
	        isWritable: false
	      }],
	      programId: this.programId,
	      data
	    };
	    return new TransactionInstruction(instructionData);
	  }

	  /**
	   * Generate a transaction that creates a new Vote account.
	   */
	  static createAccount(params) {
	    const transaction = new Transaction();
	    transaction.add(SystemProgram.createAccount({
	      fromPubkey: params.fromPubkey,
	      newAccountPubkey: params.votePubkey,
	      lamports: params.lamports,
	      space: this.space,
	      programId: this.programId
	    }));
	    return transaction.add(this.initializeAccount({
	      votePubkey: params.votePubkey,
	      nodePubkey: params.voteInit.nodePubkey,
	      voteInit: params.voteInit
	    }));
	  }

	  /**
	   * Generate a transaction that authorizes a new Voter or Withdrawer on the Vote account.
	   */
	  static authorize(params) {
	    const {
	      votePubkey,
	      authorizedPubkey,
	      newAuthorizedPubkey,
	      voteAuthorizationType
	    } = params;
	    const type = VOTE_INSTRUCTION_LAYOUTS.Authorize;
	    const data = encodeData(type, {
	      newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
	      voteAuthorizationType: voteAuthorizationType.index
	    });
	    const keys = [{
	      pubkey: votePubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: SYSVAR_CLOCK_PUBKEY,
	      isSigner: false,
	      isWritable: false
	    }, {
	      pubkey: authorizedPubkey,
	      isSigner: true,
	      isWritable: false
	    }];
	    return new Transaction().add({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction that authorizes a new Voter or Withdrawer on the Vote account
	   * where the current Voter or Withdrawer authority is a derived key.
	   */
	  static authorizeWithSeed(params) {
	    const {
	      currentAuthorityDerivedKeyBasePubkey,
	      currentAuthorityDerivedKeyOwnerPubkey,
	      currentAuthorityDerivedKeySeed,
	      newAuthorizedPubkey,
	      voteAuthorizationType,
	      votePubkey
	    } = params;
	    const type = VOTE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed;
	    const data = encodeData(type, {
	      voteAuthorizeWithSeedArgs: {
	        currentAuthorityDerivedKeyOwnerPubkey: toBuffer(currentAuthorityDerivedKeyOwnerPubkey.toBuffer()),
	        currentAuthorityDerivedKeySeed: currentAuthorityDerivedKeySeed,
	        newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
	        voteAuthorizationType: voteAuthorizationType.index
	      }
	    });
	    const keys = [{
	      pubkey: votePubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: SYSVAR_CLOCK_PUBKEY,
	      isSigner: false,
	      isWritable: false
	    }, {
	      pubkey: currentAuthorityDerivedKeyBasePubkey,
	      isSigner: true,
	      isWritable: false
	    }];
	    return new Transaction().add({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction to withdraw from a Vote account.
	   */
	  static withdraw(params) {
	    const {
	      votePubkey,
	      authorizedWithdrawerPubkey,
	      lamports,
	      toPubkey
	    } = params;
	    const type = VOTE_INSTRUCTION_LAYOUTS.Withdraw;
	    const data = encodeData(type, {
	      lamports
	    });
	    const keys = [{
	      pubkey: votePubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: toPubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: authorizedWithdrawerPubkey,
	      isSigner: true,
	      isWritable: false
	    }];
	    return new Transaction().add({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }

	  /**
	   * Generate a transaction to withdraw safely from a Vote account.
	   *
	   * This function was created as a safeguard for vote accounts running validators, `safeWithdraw`
	   * checks that the withdraw amount will not exceed the specified balance while leaving enough left
	   * to cover rent. If you wish to close the vote account by withdrawing the full amount, call the
	   * `withdraw` method directly.
	   */
	  static safeWithdraw(params, currentVoteAccountBalance, rentExemptMinimum) {
	    if (params.lamports > currentVoteAccountBalance - rentExemptMinimum) {
	      throw new Error('Withdraw will leave vote account with insufficient funds.');
	    }
	    return VoteProgram.withdraw(params);
	  }

	  /**
	   * Generate a transaction to update the validator identity (node pubkey) of a Vote account.
	   */
	  static updateValidatorIdentity(params) {
	    const {
	      votePubkey,
	      authorizedWithdrawerPubkey,
	      nodePubkey
	    } = params;
	    const type = VOTE_INSTRUCTION_LAYOUTS.UpdateValidatorIdentity;
	    const data = encodeData(type);
	    const keys = [{
	      pubkey: votePubkey,
	      isSigner: false,
	      isWritable: true
	    }, {
	      pubkey: nodePubkey,
	      isSigner: true,
	      isWritable: false
	    }, {
	      pubkey: authorizedWithdrawerPubkey,
	      isSigner: true,
	      isWritable: false
	    }];
	    return new Transaction().add({
	      keys,
	      programId: this.programId,
	      data
	    });
	  }
	}
	VoteProgram.programId = new PublicKey('Vote111111111111111111111111111111111111111');
	/**
	 * Max space of a Vote account
	 *
	 * This is generated from the solana-vote-program VoteState struct as
	 * `VoteState::size_of()`:
	 * https://docs.rs/solana-vote-program/1.9.5/solana_vote_program/vote_state/struct.VoteState.html#method.size_of
	 *
	 * KEEP IN SYNC WITH `VoteState::size_of()` in https://github.com/solana-labs/solana/blob/a474cb24b9238f5edcc982f65c0b37d4a1046f7e/sdk/program/src/vote/state/mod.rs#L340-L342
	 */
	VoteProgram.space = 3762;

	const VALIDATOR_INFO_KEY = new PublicKey('Va1idator1nfo111111111111111111111111111111');

	/**
	 * @internal
	 */

	/**
	 * Info used to identity validators.
	 */

	const InfoString = type({
	  name: string(),
	  website: optional(string()),
	  details: optional(string()),
	  iconUrl: optional(string()),
	  keybaseUsername: optional(string())
	});

	/**
	 * ValidatorInfo class
	 */
	class ValidatorInfo {
	  /**
	   * Construct a valid ValidatorInfo
	   *
	   * @param key validator public key
	   * @param info validator information
	   */
	  constructor(key, info) {
	    /**
	     * validator public key
	     */
	    this.key = void 0;
	    /**
	     * validator information
	     */
	    this.info = void 0;
	    this.key = key;
	    this.info = info;
	  }

	  /**
	   * Deserialize ValidatorInfo from the config account data. Exactly two config
	   * keys are required in the data.
	   *
	   * @param buffer config account data
	   * @return null if info was not found
	   */
	  static fromConfigData(buffer) {
	    let byteArray = [...buffer];
	    const configKeyCount = decodeLength(byteArray);
	    if (configKeyCount !== 2) return null;
	    const configKeys = [];
	    for (let i = 0; i < 2; i++) {
	      const publicKey = new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
	      const isSigner = guardedShift(byteArray) === 1;
	      configKeys.push({
	        publicKey,
	        isSigner
	      });
	    }
	    if (configKeys[0].publicKey.equals(VALIDATOR_INFO_KEY)) {
	      if (configKeys[1].isSigner) {
	        const rawInfo = rustString().decode(bufferExports.Buffer.from(byteArray));
	        const info = JSON.parse(rawInfo);
	        assert(info, InfoString);
	        return new ValidatorInfo(configKeys[1].publicKey, info);
	      }
	    }
	    return null;
	  }
	}

	const VOTE_PROGRAM_ID = new PublicKey('Vote111111111111111111111111111111111111111');

	/**
	 * History of how many credits earned by the end of each epoch
	 */

	/**
	 * See https://github.com/solana-labs/solana/blob/8a12ed029cfa38d4a45400916c2463fb82bbec8c/programs/vote_api/src/vote_state.rs#L68-L88
	 *
	 * @internal
	 */
	const VoteAccountLayout = LayoutExports.struct([publicKey('nodePubkey'), publicKey('authorizedWithdrawer'), LayoutExports.u8('commission'), LayoutExports.nu64(),
	// votes.length
	LayoutExports.seq(LayoutExports.struct([LayoutExports.nu64('slot'), LayoutExports.u32('confirmationCount')]), LayoutExports.offset(LayoutExports.u32(), -8), 'votes'), LayoutExports.u8('rootSlotValid'), LayoutExports.nu64('rootSlot'), LayoutExports.nu64(),
	// authorizedVoters.length
	LayoutExports.seq(LayoutExports.struct([LayoutExports.nu64('epoch'), publicKey('authorizedVoter')]), LayoutExports.offset(LayoutExports.u32(), -8), 'authorizedVoters'), LayoutExports.struct([LayoutExports.seq(LayoutExports.struct([publicKey('authorizedPubkey'), LayoutExports.nu64('epochOfLastAuthorizedSwitch'), LayoutExports.nu64('targetEpoch')]), 32, 'buf'), LayoutExports.nu64('idx'), LayoutExports.u8('isEmpty')], 'priorVoters'), LayoutExports.nu64(),
	// epochCredits.length
	LayoutExports.seq(LayoutExports.struct([LayoutExports.nu64('epoch'), LayoutExports.nu64('credits'), LayoutExports.nu64('prevCredits')]), LayoutExports.offset(LayoutExports.u32(), -8), 'epochCredits'), LayoutExports.struct([LayoutExports.nu64('slot'), LayoutExports.nu64('timestamp')], 'lastTimestamp')]);
	/**
	 * VoteAccount class
	 */
	class VoteAccount {
	  /**
	   * @internal
	   */
	  constructor(args) {
	    this.nodePubkey = void 0;
	    this.authorizedWithdrawer = void 0;
	    this.commission = void 0;
	    this.rootSlot = void 0;
	    this.votes = void 0;
	    this.authorizedVoters = void 0;
	    this.priorVoters = void 0;
	    this.epochCredits = void 0;
	    this.lastTimestamp = void 0;
	    this.nodePubkey = args.nodePubkey;
	    this.authorizedWithdrawer = args.authorizedWithdrawer;
	    this.commission = args.commission;
	    this.rootSlot = args.rootSlot;
	    this.votes = args.votes;
	    this.authorizedVoters = args.authorizedVoters;
	    this.priorVoters = args.priorVoters;
	    this.epochCredits = args.epochCredits;
	    this.lastTimestamp = args.lastTimestamp;
	  }

	  /**
	   * Deserialize VoteAccount from the account data.
	   *
	   * @param buffer account data
	   * @return VoteAccount
	   */
	  static fromAccountData(buffer) {
	    const versionOffset = 4;
	    const va = VoteAccountLayout.decode(toBuffer(buffer), versionOffset);
	    let rootSlot = va.rootSlot;
	    if (!va.rootSlotValid) {
	      rootSlot = null;
	    }
	    return new VoteAccount({
	      nodePubkey: new PublicKey(va.nodePubkey),
	      authorizedWithdrawer: new PublicKey(va.authorizedWithdrawer),
	      commission: va.commission,
	      votes: va.votes,
	      rootSlot,
	      authorizedVoters: va.authorizedVoters.map(parseAuthorizedVoter),
	      priorVoters: getPriorVoters(va.priorVoters),
	      epochCredits: va.epochCredits,
	      lastTimestamp: va.lastTimestamp
	    });
	  }
	}
	function parseAuthorizedVoter({
	  authorizedVoter,
	  epoch
	}) {
	  return {
	    epoch,
	    authorizedVoter: new PublicKey(authorizedVoter)
	  };
	}
	function parsePriorVoters({
	  authorizedPubkey,
	  epochOfLastAuthorizedSwitch,
	  targetEpoch
	}) {
	  return {
	    authorizedPubkey: new PublicKey(authorizedPubkey),
	    epochOfLastAuthorizedSwitch,
	    targetEpoch
	  };
	}
	function getPriorVoters({
	  buf,
	  idx,
	  isEmpty
	}) {
	  if (isEmpty) {
	    return [];
	  }
	  return [...buf.slice(idx + 1).map(parsePriorVoters), ...buf.slice(0, idx).map(parsePriorVoters)];
	}

	const endpoint = {
	  http: {
	    devnet: 'http://api.devnet.solana.com',
	    testnet: 'http://api.testnet.solana.com',
	    'mainnet-beta': 'http://api.mainnet-beta.solana.com/'
	  },
	  https: {
	    devnet: 'https://api.devnet.solana.com',
	    testnet: 'https://api.testnet.solana.com',
	    'mainnet-beta': 'https://api.mainnet-beta.solana.com/'
	  }
	};
	/**
	 * Retrieves the RPC API URL for the specified cluster
	 * @param {Cluster} [cluster="devnet"] - The cluster name of the RPC API URL to use. Possible options: 'devnet' | 'testnet' | 'mainnet-beta'
	 * @param {boolean} [tls="http"] - Use TLS when connecting to cluster.
	 *
	 * @returns {string} URL string of the RPC endpoint
	 */
	function clusterApiUrl(cluster, tls) {
	  const key = tls === false ? 'http' : 'https';
	  if (!cluster) {
	    return endpoint[key]['devnet'];
	  }
	  const url = endpoint[key][cluster];
	  if (!url) {
	    throw new Error(`Unknown ${key} cluster: ${cluster}`);
	  }
	  return url;
	}

	/**
	 * Send and confirm a raw transaction
	 *
	 * If `commitment` option is not specified, defaults to 'max' commitment.
	 *
	 * @param {Connection} connection
	 * @param {Buffer} rawTransaction
	 * @param {TransactionConfirmationStrategy} confirmationStrategy
	 * @param {ConfirmOptions} [options]
	 * @returns {Promise<TransactionSignature>}
	 */

	/**
	 * @deprecated Calling `sendAndConfirmRawTransaction()` without a `confirmationStrategy`
	 * is no longer supported and will be removed in a future version.
	 */
	// eslint-disable-next-line no-redeclare

	// eslint-disable-next-line no-redeclare
	async function sendAndConfirmRawTransaction(connection, rawTransaction, confirmationStrategyOrConfirmOptions, maybeConfirmOptions) {
	  let confirmationStrategy;
	  let options;
	  if (confirmationStrategyOrConfirmOptions && Object.prototype.hasOwnProperty.call(confirmationStrategyOrConfirmOptions, 'lastValidBlockHeight')) {
	    confirmationStrategy = confirmationStrategyOrConfirmOptions;
	    options = maybeConfirmOptions;
	  } else if (confirmationStrategyOrConfirmOptions && Object.prototype.hasOwnProperty.call(confirmationStrategyOrConfirmOptions, 'nonceValue')) {
	    confirmationStrategy = confirmationStrategyOrConfirmOptions;
	    options = maybeConfirmOptions;
	  } else {
	    options = confirmationStrategyOrConfirmOptions;
	  }
	  const sendOptions = options && {
	    skipPreflight: options.skipPreflight,
	    preflightCommitment: options.preflightCommitment || options.commitment,
	    minContextSlot: options.minContextSlot
	  };
	  const signature = await connection.sendRawTransaction(rawTransaction, sendOptions);
	  const commitment = options && options.commitment;
	  const confirmationPromise = confirmationStrategy ? connection.confirmTransaction(confirmationStrategy, commitment) : connection.confirmTransaction(signature, commitment);
	  const status = (await confirmationPromise).value;
	  if (status.err) {
	    if (signature != null) {
	      throw new SendTransactionError({
	        action: sendOptions?.skipPreflight ? 'send' : 'simulate',
	        signature: signature,
	        transactionMessage: `Status: (${JSON.stringify(status)})`
	      });
	    }
	    throw new Error(`Raw transaction ${signature} failed (${JSON.stringify(status)})`);
	  }
	  return signature;
	}

	/**
	 * There are 1-billion lamports in one SOL
	 */
	const LAMPORTS_PER_SOL = 1000000000;

	exports.Account = Account;
	exports.AddressLookupTableAccount = AddressLookupTableAccount;
	exports.AddressLookupTableInstruction = AddressLookupTableInstruction;
	exports.AddressLookupTableProgram = AddressLookupTableProgram;
	exports.Authorized = Authorized;
	exports.BLOCKHASH_CACHE_TIMEOUT_MS = BLOCKHASH_CACHE_TIMEOUT_MS;
	exports.BPF_LOADER_DEPRECATED_PROGRAM_ID = BPF_LOADER_DEPRECATED_PROGRAM_ID;
	exports.BPF_LOADER_PROGRAM_ID = BPF_LOADER_PROGRAM_ID;
	exports.BpfLoader = BpfLoader;
	exports.COMPUTE_BUDGET_INSTRUCTION_LAYOUTS = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS;
	exports.ComputeBudgetInstruction = ComputeBudgetInstruction;
	exports.ComputeBudgetProgram = ComputeBudgetProgram;
	exports.Connection = Connection;
	exports.Ed25519Program = Ed25519Program;
	exports.Enum = Enum;
	exports.EpochSchedule = EpochSchedule;
	exports.FeeCalculatorLayout = FeeCalculatorLayout;
	exports.Keypair = Keypair;
	exports.LAMPORTS_PER_SOL = LAMPORTS_PER_SOL;
	exports.LOOKUP_TABLE_INSTRUCTION_LAYOUTS = LOOKUP_TABLE_INSTRUCTION_LAYOUTS;
	exports.Loader = Loader;
	exports.Lockup = Lockup;
	exports.MAX_SEED_LENGTH = MAX_SEED_LENGTH;
	exports.Message = Message;
	exports.MessageAccountKeys = MessageAccountKeys;
	exports.MessageV0 = MessageV0;
	exports.NONCE_ACCOUNT_LENGTH = NONCE_ACCOUNT_LENGTH;
	exports.NonceAccount = NonceAccount;
	exports.PACKET_DATA_SIZE = PACKET_DATA_SIZE;
	exports.PUBLIC_KEY_LENGTH = PUBLIC_KEY_LENGTH;
	exports.PublicKey = PublicKey;
	exports.SIGNATURE_LENGTH_IN_BYTES = SIGNATURE_LENGTH_IN_BYTES;
	exports.SOLANA_SCHEMA = SOLANA_SCHEMA;
	exports.STAKE_CONFIG_ID = STAKE_CONFIG_ID;
	exports.STAKE_INSTRUCTION_LAYOUTS = STAKE_INSTRUCTION_LAYOUTS;
	exports.SYSTEM_INSTRUCTION_LAYOUTS = SYSTEM_INSTRUCTION_LAYOUTS;
	exports.SYSVAR_CLOCK_PUBKEY = SYSVAR_CLOCK_PUBKEY;
	exports.SYSVAR_EPOCH_SCHEDULE_PUBKEY = SYSVAR_EPOCH_SCHEDULE_PUBKEY;
	exports.SYSVAR_INSTRUCTIONS_PUBKEY = SYSVAR_INSTRUCTIONS_PUBKEY;
	exports.SYSVAR_RECENT_BLOCKHASHES_PUBKEY = SYSVAR_RECENT_BLOCKHASHES_PUBKEY;
	exports.SYSVAR_RENT_PUBKEY = SYSVAR_RENT_PUBKEY;
	exports.SYSVAR_REWARDS_PUBKEY = SYSVAR_REWARDS_PUBKEY;
	exports.SYSVAR_SLOT_HASHES_PUBKEY = SYSVAR_SLOT_HASHES_PUBKEY;
	exports.SYSVAR_SLOT_HISTORY_PUBKEY = SYSVAR_SLOT_HISTORY_PUBKEY;
	exports.SYSVAR_STAKE_HISTORY_PUBKEY = SYSVAR_STAKE_HISTORY_PUBKEY;
	exports.Secp256k1Program = Secp256k1Program;
	exports.SendTransactionError = SendTransactionError;
	exports.SolanaJSONRPCError = SolanaJSONRPCError;
	exports.SolanaJSONRPCErrorCode = SolanaJSONRPCErrorCode;
	exports.StakeAuthorizationLayout = StakeAuthorizationLayout;
	exports.StakeInstruction = StakeInstruction;
	exports.StakeProgram = StakeProgram;
	exports.Struct = Struct$1;
	exports.SystemInstruction = SystemInstruction;
	exports.SystemProgram = SystemProgram;
	exports.Transaction = Transaction;
	exports.TransactionExpiredBlockheightExceededError = TransactionExpiredBlockheightExceededError;
	exports.TransactionExpiredNonceInvalidError = TransactionExpiredNonceInvalidError;
	exports.TransactionExpiredTimeoutError = TransactionExpiredTimeoutError;
	exports.TransactionInstruction = TransactionInstruction;
	exports.TransactionMessage = TransactionMessage;
	exports.TransactionStatus = TransactionStatus;
	exports.VALIDATOR_INFO_KEY = VALIDATOR_INFO_KEY;
	exports.VERSION_PREFIX_MASK = VERSION_PREFIX_MASK;
	exports.VOTE_PROGRAM_ID = VOTE_PROGRAM_ID;
	exports.ValidatorInfo = ValidatorInfo;
	exports.VersionedMessage = VersionedMessage;
	exports.VersionedTransaction = VersionedTransaction;
	exports.VoteAccount = VoteAccount;
	exports.VoteAuthorizationLayout = VoteAuthorizationLayout;
	exports.VoteInit = VoteInit;
	exports.VoteInstruction = VoteInstruction;
	exports.VoteProgram = VoteProgram;
	exports.clusterApiUrl = clusterApiUrl;
	exports.sendAndConfirmRawTransaction = sendAndConfirmRawTransaction;
	exports.sendAndConfirmTransaction = sendAndConfirmTransaction;

	return exports;

})({});
//# sourceMappingURL=index.iife.js.map
