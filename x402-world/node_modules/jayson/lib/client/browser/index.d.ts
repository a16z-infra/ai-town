import * as jayson from '../../..';

type ClientBrowserCallServerFunctionCallback = (err?:Error | null, response?:string) => void;

type ClientBrowserCallServerFunction = (request:string, callback:ClientBrowserCallServerFunctionCallback) => void;

declare class ClientBrowser {
  constructor(callServer:ClientBrowserCallServerFunction, options?:jayson.ClientOptions);
  request(method: string, params: jayson.RequestParamsLike, id?: jayson.JSONRPCIDLike | null, callback?: jayson.JSONRPCCallbackType): jayson.JSONRPCRequest;
  request(method: string, params: jayson.RequestParamsLike, callback?: jayson.JSONRPCCallbackType): jayson.JSONRPCRequest;
  request(method: Array<jayson.JSONRPCRequestLike>, callback: jayson.JSONRPCCallbackTypeBatch): Array<jayson.JSONRPCRequest>;
}

export = ClientBrowser;
