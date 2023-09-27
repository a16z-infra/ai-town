export function isSimpleObject(value: unknown) {
  const isObject = typeof value === 'object';
  const prototype = Object.getPrototypeOf(value);
  const isSimple =
    prototype === null ||
    prototype === Object.prototype ||
    // Objects generated from other contexts (e.g. across Node.js `vm` modules) will not satisfy the previous
    // conditions but are still simple objects.
    prototype?.constructor?.name === 'Object';
  return isObject && isSimple;
}
