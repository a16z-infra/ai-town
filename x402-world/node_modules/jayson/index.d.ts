import net = require('net');
import tls = require('tls');
import https = require('https');
import http = require('http');
import events = require('events');
import Stream = require('stream');
import WebSocket = require('isomorphic-ws');
import * as connect from 'connect';

type ConstructorOf<Proto, CtorArgs extends any[]> = {
  (...args: CtorArgs): Proto;
  new(...args: CtorArgs): Proto;
  prototype: Proto;
}

export interface UtilsJSONParseOptions {
  reviver?: Function;
}

export interface UtilsJSONStringifyOptions {
  replacer?: Function;
}

export interface GenerateRequestOptions {
  version?: number;
  notificationIdNull?: boolean;
  generator?: IDGenerator;
}

export declare class Utils {

  static request(method: string, params: RequestParamsLike, options?: GenerateRequestOptions): JSONRPCRequest;
  static request(method: string, params: RequestParamsLike, id?: JSONRPCIDLike | null | undefined, options?: GenerateRequestOptions): JSONRPCRequest;

  static response(error: JSONRPCError | undefined | null, result: JSONRPCResultLike | undefined | null, id: JSONRPCIDLike | null | undefined, version?: number): JSONRPCVersionTwoResponse;
  static response(error: JSONRPCError | undefined | null, result: JSONRPCResultLike | undefined | null, id: JSONRPCIDLike | null | undefined, version:2): JSONRPCVersionTwoResponse;
  static response(error: JSONRPCError | undefined | null, result: JSONRPCResultLike | undefined | null, id: JSONRPCIDLike | null | undefined, version:1): JSONRPCVersionOneResponse;

  static generateId(): string;

  static merge(...objs: object[]): object;

  static parseStream(stream:Stream, options:UtilsJSONParseOptions, onRequest: (err?:Error, data?:any) => void): void;

  static parseBody(stream:Stream, options:UtilsJSONParseOptions, callback: (err?:Error, obj?:any) => void): void;

  static getHttpListener(self:http.Server, server:Server): Function;

  static isContentType(request:http.IncomingMessage, typ:string): boolean;

  static isMethod(request:http.IncomingMessage, method:string): boolean;

  static walk(obj:object, key:string, fn: (key:string, value:any) => any): object;

  static once<T extends (...args: any[]) => any>(fn: T): T;

  static isPlainObject(obj: any): boolean;

  static toArray(obj: any): Array<any>;

  static toPlainObject(obj: any): object;

  static pick(obj: object, keys: string[]): object;

  static JSON: UtilsJSON;

  static Request: UtilsRequest;

  static Response: UtilsResponse;

}

// lowercase Utils
export declare class utils extends Utils {
}

type UtilsJSON = {
  parse(str:string, options:UtilsJSONParseOptions | null | undefined, callback: (err?:Error, obj?:object) => void):void;
  stringify(obj:object, options:UtilsJSONStringifyOptions | null | undefined, callback: (err?:Error, str?:string) => void):void;
}

type UtilsRequest = {
  isBatch(request:any): boolean;
  isNotification(request:any): boolean;
  isValidVersionTwoRequest(request:any): boolean;
  isValidVersionOneRequest(request:any): boolean;
  isValidRequest(request:any, version?:number): boolean;
}

type UtilsResponse = {
  isValidError(error:any, version?:number): boolean;
  isValidResponse(response:any, version?:number): boolean;
}

export type RequestParamsLike = Array<any> | object | undefined;

export interface JSONRPCError {
  code: number;
  message: string;
  data?: object;
}

export type JSONRPCErrorLike = Error | JSONRPCError;

export interface JSONRPCVersionOneRequest {
  method: string;
  params: Array<any>;
  id: JSONRPCIDLike;
}

export interface JSONRPCVersionTwoRequest {
  jsonrpc: string;
  method: string;
  params: RequestParamsLike;
  id?: JSONRPCIDLike | null;
}

export type JSONRPCRequest = JSONRPCVersionOneRequest | JSONRPCVersionTwoRequest;

export interface JSONRPCVersionOneResponseWithResult {
  result: any;
  error: null;
  id: any;
}

export interface JSONRPCVersionOneResponseWithError {
  result: null;
  error: object;
  id: any;
}

export type JSONRPCVersionOneResponse = JSONRPCVersionOneResponseWithError | JSONRPCVersionOneResponseWithResult;

export interface JSONRPCVersionTwoResponseWithResult {
  jsonrpc: string;
  result: any;
  id: JSONRPCIDLike | null;
}

export interface JSONRPCVersionTwoResponseWithError {
  jsonrpc: string;
  error: JSONRPCError;
  id: JSONRPCIDLike | null;
}

export type JSONRPCVersionTwoResponse = JSONRPCVersionTwoResponseWithResult | JSONRPCVersionTwoResponseWithError;

export type JSONRPCResponseWithError = JSONRPCVersionOneResponseWithError | JSONRPCVersionTwoResponseWithError;
export type JSONRPCResponseWithResult = JSONRPCVersionOneResponseWithResult | JSONRPCVersionTwoResponseWithResult;
export type JSONRPCResponse = JSONRPCVersionOneResponse | JSONRPCVersionTwoResponse;

export type JSONRPCIDLike = number | string;

export type JSONRPCRequestLike = JSONRPCRequest | string;

export type JSONRPCResultLike = any;

export interface JSONRPCCallbackTypePlain {
  (err?: JSONRPCErrorLike | null, result?: JSONRPCResultLike): void
}

export interface JSONRPCCallbackTypeSugared {
  (err?: Error | null, error?: JSONRPCErrorLike, result?: JSONRPCResultLike): void
}

type JSONRPCCallbackType = JSONRPCCallbackTypePlain | JSONRPCCallbackTypeSugared;

export interface JSONRPCCallbackTypeBatchPlain {
  (err: JSONRPCErrorLike, results?: Array<JSONRPCResultLike>): void
}

export interface JSONRPCCallbackTypeBatchSugared {
  (err: Error, errors?: Array<JSONRPCErrorLike>, results?: Array<JSONRPCResultLike>): void
}

type JSONRPCCallbackTypeBatch = JSONRPCCallbackTypeBatchPlain | JSONRPCCallbackTypeBatchSugared;

export interface MethodHandler {
  (this:Server, args:RequestParamsLike, callback:JSONRPCCallbackTypePlain): void;
}

export interface MethodHandlerContext {
  (this:Server, args:RequestParamsLike, context:object, callback:JSONRPCCallbackTypePlain): void;
}

export type MethodHandlerType = MethodHandlerContext | MethodHandler;
export type MethodOptionsParamsLike = Array<any> | Object | object;

export interface MethodOptions {
  handler?: MethodHandlerType;
  useContext?: boolean;
  params?: MethodOptionsParamsLike;
}

export type MethodExecuteCallbackType = {
  (err?: Error | null, result?: JSONRPCResultLike): void
}

type MethodConstructor = ConstructorOf<Method, [options: MethodOptions] | [handler?: MethodHandlerType, options?: MethodOptions]>;

export interface Method {
  getHandler(): MethodHandlerType;
  setHandler(handler: MethodHandlerType): void;
  execute(server: Server, requestParams: RequestParamsLike, callback: MethodExecuteCallbackType): any | Promise<any>;
  execute(server: Server, requestParams: RequestParamsLike, context:object, callback: MethodExecuteCallbackType): any | Promise<any>;
}

export declare const Method: MethodConstructor;

// lowercase Method
export type method = Method;
export declare const method: MethodConstructor;

export type MethodLike = Function | Method | Client;

export type ServerRouterFunction = (this: Server, method: string, params: RequestParamsLike) => MethodLike;

export interface ServerOptions {
  useContext?: boolean;
  params?: MethodOptionsParamsLike;
  version?: number;
  reviver?: JSONParseReviver;
  replacer?: JSONStringifyReplacer;
  encoding?: string;
  router?: ServerRouterFunction;
  methodConstructor?: Function;
  maxBatchLength?: number;
}

export type ServerCallCallbackType = {
  (err?: JSONRPCResponseWithError | null, result?: JSONRPCResponseWithResult): void
}

export interface MethodMap { [methodName:string]: Method }

type ServerConstructor = ConstructorOf<Server, [methods?: {[methodName: string]: MethodLike}, options?: ServerOptions]> & {
  errors: {[errorName: string]: number};
  errorMessages: {[errorMessage: string]: string};
  interfaces: {[interfaces: string]: Function};
}

export interface Server extends events.EventEmitter {
  _methods: MethodMap;
  options: ServerOptions;
  errorMessages: {[errorMessage: string]: string};

  http(options?: HttpServerOptions): HttpServer;
  https(options?: HttpsServerOptions): HttpsServer;
  tcp(options?: TcpServerOptions): TcpServer;
  tls(options?: TlsServerOptions): TlsServer;
  websocket(options?: WebsocketServerOptions): WebsocketServer;
  middleware(options?: MiddlewareServerOptions): connect.HandleFunction;

  method(name: string, definition: MethodLike): void;
  methods(methods: {[methodName: string]: MethodLike}): void;
  hasMethod(name: string): boolean;
  removeMethod(name: string): void;
  getMethod(name: string): MethodLike;
  error(code?: number, message?: string, data?: object): JSONRPCError;
  call(request: JSONRPCRequestLike | Array<JSONRPCRequestLike>, originalCallback?: ServerCallCallbackType): void;
  call(request: JSONRPCRequestLike | Array<JSONRPCRequestLike>, context: object, originalCallback?: ServerCallCallbackType): void;
  callp(request: JSONRPCRequestLike | Array<JSONRPCRequestLike>, context?: object): Promise<JSONRPCResultLike>;
}

export declare const Server: ServerConstructor;

// lowercase Server
export type server = Server;
export declare const server: ServerConstructor;

export interface MiddlewareServerOptions extends ServerOptions {
  end?: boolean;
}

export interface HttpServerOptions extends ServerOptions {
}

declare class HttpServer extends http.Server {
  constructor(server: Server, options?: HttpServerOptions);
}

export interface HttpsServerOptions extends ServerOptions, https.ServerOptions {
}

declare class HttpsServer extends https.Server {
  constructor(server: Server, options?: HttpsServerOptions);
}

export interface TcpServerOptions extends ServerOptions {
}

declare class TcpServer extends net.Server {
  constructor(server: Server, options?: TcpServerOptions);
}

export interface TlsServerOptions extends tls.TlsOptions {
}

declare class TlsServer extends tls.Server {
  constructor(server: Server, options?: TlsServerOptions);
}

export interface WebsocketServerOptions extends ServerOptions, WebSocket.ServerOptions {
  wss?: WebSocket.Server;
}

declare class WebsocketServer {
  constructor(server: Server, options?: WebsocketServerOptions);
}

type JSONParseReviver = (key: string, value: any) => any;
type JSONStringifyReplacer = (key: string, value: any) => any;

type IDGenerator = () => JSONRPCIDLike;

export interface ClientOptions {
  version?: number;
  reviver?: JSONParseReviver;
  replacer?: JSONStringifyReplacer;
  generator?: IDGenerator;
  notificationIdNull?: boolean;
}

export interface HttpClientOptions extends ClientOptions, http.RequestOptions {
}

declare class HttpClient extends Client {
  constructor(options?: HttpClientOptions);
}

export interface TlsClientOptions extends ClientOptions, tls.ConnectionOptions {
}

declare class TlsClient extends Client {
  constructor(options?: TlsClientOptions);
}

export interface TcpClientOptions extends ClientOptions, net.TcpSocketConnectOpts {
}

declare class TcpClient extends Client {
  constructor(options?: TcpClientOptions);
}

export interface HttpsClientOptions extends ClientOptions, https.RequestOptions {
}

declare class HttpsClient extends Client {
  constructor(options?: HttpsClientOptions);
}

export interface WebsocketClientOptions extends ClientOptions {
  url?: string;
  ws?: WebSocket;
  timeout?: number;
}

declare class WebsocketClient extends Client {
  constructor(options?: WebsocketClientOptions);
}

export type BrowserClientCallServerCallback = (err?: Error | null, response?: string) => void;
export type BrowserClientCallServerFunction = (request: string, callback: BrowserClientCallServerCallback) => void;

declare class BrowserClient {
  constructor(callServer: BrowserClientCallServerFunction, options?: ClientOptions);
  request(method: string, params: RequestParamsLike, id?: JSONRPCIDLike | null, callback?: JSONRPCCallbackType): JSONRPCRequest;
  request(method: string, params: RequestParamsLike, callback?: JSONRPCCallbackType): JSONRPCRequest;
  request(method: Array<JSONRPCRequestLike>, callback: JSONRPCCallbackTypeBatch): Array<JSONRPCRequest>;
}

type ClientConstructor = ConstructorOf<Client, [options: ClientOptions] | [server: Server, options?: ClientOptions]> & {
  http(options?: HttpClientOptions): HttpClient;
  https(options?: HttpsClientOptions): HttpsClient;
  tcp(options?: TcpClientOptions): TcpClient;
  tls(options?: TlsClientOptions): TlsClient;
  websocket(options?: WebsocketClientOptions): WebsocketClient;
  browser(callServer: BrowserClientCallServerFunction, options?: ClientOptions): BrowserClient;
}

export interface Client extends events.EventEmitter {
  request(method: string, params: RequestParamsLike, id?: JSONRPCIDLike | null, callback?: JSONRPCCallbackType): JSONRPCRequest;
  request(method: string, params: RequestParamsLike, callback?: JSONRPCCallbackType): JSONRPCRequest;
  request(method: Array<JSONRPCRequestLike>, callback: JSONRPCCallbackTypeBatch): Array<JSONRPCRequest>;
}

export declare const Client: ClientConstructor;

// lowercase Client
export type client = Client;
export declare const client: ClientConstructor
