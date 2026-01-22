import * as jayson from '../../../..';

type PromiseClientBrowserCallServerFunction = (request:string) => Promise<string>;

declare class PromiseClientBrowser {
  constructor(callServer:PromiseClientBrowserCallServerFunction, options?:jayson.ClientOptions);
  request(method:string, params:jayson.RequestParamsLike, id:jayson.JSONRPCIDLike | undefined, shouldCall:false): jayson.JSONRPCRequest;
  request(method:string, params:jayson.RequestParamsLike, id?:jayson.JSONRPCIDLike): Promise<jayson.JSONRPCResultLike>;
  request(method: Array<jayson.JSONRPCRequestLike>): Promise<jayson.JSONRPCResultLike>;
}

export = PromiseClientBrowser;
