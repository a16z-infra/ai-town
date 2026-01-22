import {
  CommonClient,
  ICommonWebSocket,
  IWSClientAdditionalOptions,
  NodeWebSocketType,
  NodeWebSocketTypeOptions,
  WebSocket as createRpc,
} from 'rpc-websockets';

interface IHasReadyState {
  readyState: WebSocket['readyState'];
}

export default class RpcWebSocketClient extends CommonClient {
  private underlyingSocket: IHasReadyState | undefined;
  constructor(
    address?: string,
    options?: IWSClientAdditionalOptions & NodeWebSocketTypeOptions,
    generate_request_id?: (
      method: string,
      params: object | Array<any>,
    ) => number,
  ) {
    const webSocketFactory = (url: string) => {
      const rpc = createRpc(url, {
        autoconnect: true,
        max_reconnects: 5,
        reconnect: true,
        reconnect_interval: 1000,
        ...options,
      });
      if ('socket' in rpc) {
        this.underlyingSocket = rpc.socket as ReturnType<typeof createRpc>;
      } else {
        this.underlyingSocket = rpc as NodeWebSocketType;
      }
      return rpc as ICommonWebSocket;
    };
    super(webSocketFactory, address, options, generate_request_id);
  }
  call(
    ...args: Parameters<CommonClient['call']>
  ): ReturnType<CommonClient['call']> {
    const readyState = this.underlyingSocket?.readyState;
    if (readyState === 1 /* WebSocket.OPEN */) {
      return super.call(...args);
    }
    return Promise.reject(
      new Error(
        'Tried to call a JSON-RPC method `' +
          args[0] +
          '` but the socket was not `CONNECTING` or `OPEN` (`readyState` was ' +
          readyState +
          ')',
      ),
    );
  }
  notify(
    ...args: Parameters<CommonClient['notify']>
  ): ReturnType<CommonClient['notify']> {
    const readyState = this.underlyingSocket?.readyState;
    if (readyState === 1 /* WebSocket.OPEN */) {
      return super.notify(...args);
    }
    return Promise.reject(
      new Error(
        'Tried to send a JSON-RPC notification `' +
          args[0] +
          '` but the socket was not `CONNECTING` or `OPEN` (`readyState` was ' +
          readyState +
          ')',
      ),
    );
  }
}
