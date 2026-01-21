import * as nodeFetch from 'node-fetch';

export default (typeof globalThis.fetch === 'function'
  ? // The Fetch API is supported experimentally in Node 17.5+ and natively in Node 18+.
    globalThis.fetch
  : // Otherwise use the polyfill.
    async function (
      input: nodeFetch.RequestInfo,
      init?: nodeFetch.RequestInit,
    ): Promise<nodeFetch.Response> {
      const processedInput =
        typeof input === 'string' && input.slice(0, 2) === '//'
          ? 'https:' + input
          : input;
      return await nodeFetch.default(processedInput, init);
    }) as typeof globalThis.fetch;
