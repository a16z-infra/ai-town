import {Connection} from './connection';
import {TransactionSignature} from './transaction';

export class SendTransactionError extends Error {
  private signature: TransactionSignature;
  private transactionMessage: string;
  private transactionLogs: string[] | Promise<string[]> | undefined;

  constructor({
    action,
    signature,
    transactionMessage,
    logs,
  }: {
    action: 'send' | 'simulate';
    signature: TransactionSignature;
    transactionMessage: string;
    logs?: string[];
  }) {
    const maybeLogsOutput = logs
      ? `Logs: \n${JSON.stringify(logs.slice(-10), null, 2)}. `
      : '';
    const guideText =
      '\nCatch the `SendTransactionError` and call `getLogs()` on it for full details.';
    let message: string;
    switch (action) {
      case 'send':
        message =
          `Transaction ${signature} resulted in an error. \n` +
          `${transactionMessage}. ` +
          maybeLogsOutput +
          guideText;
        break;
      case 'simulate':
        message =
          `Simulation failed. \nMessage: ${transactionMessage}. \n` +
          maybeLogsOutput +
          guideText;
        break;
      default: {
        message = `Unknown action '${((a: never) => a)(action)}'`;
      }
    }
    super(message);

    this.signature = signature;
    this.transactionMessage = transactionMessage;
    this.transactionLogs = logs ? logs : undefined;
  }

  get transactionError(): {message: string; logs?: string[]} {
    return {
      message: this.transactionMessage,
      logs: Array.isArray(this.transactionLogs)
        ? this.transactionLogs
        : undefined,
    };
  }

  /* @deprecated Use `await getLogs()` instead */
  get logs(): string[] | undefined {
    const cachedLogs = this.transactionLogs;
    if (
      cachedLogs != null &&
      typeof cachedLogs === 'object' &&
      'then' in cachedLogs
    ) {
      return undefined;
    }
    return cachedLogs;
  }

  async getLogs(connection: Connection): Promise<string[]> {
    if (!Array.isArray(this.transactionLogs)) {
      this.transactionLogs = new Promise((resolve, reject) => {
        connection
          .getTransaction(this.signature)
          .then(tx => {
            if (tx && tx.meta && tx.meta.logMessages) {
              const logs = tx.meta.logMessages;
              this.transactionLogs = logs;
              resolve(logs);
            } else {
              reject(new Error('Log messages not found'));
            }
          })
          .catch(reject);
      });
    }
    return await this.transactionLogs;
  }
}

// Keep in sync with client/src/rpc_custom_errors.rs
// Typescript `enums` thwart tree-shaking. See https://bargsten.org/jsts/enums/
export const SolanaJSONRPCErrorCode = {
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
  JSON_RPC_SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED: -32016,
} as const;
export type SolanaJSONRPCErrorCodeEnum =
  (typeof SolanaJSONRPCErrorCode)[keyof typeof SolanaJSONRPCErrorCode];

export class SolanaJSONRPCError extends Error {
  code: SolanaJSONRPCErrorCodeEnum | unknown;
  data?: any;
  constructor(
    {
      code,
      message,
      data,
    }: Readonly<{code: unknown; message: string; data?: any}>,
    customMessage?: string,
  ) {
    super(customMessage != null ? `${customMessage}: ${message}` : message);
    this.code = code;
    this.data = data;
    this.name = 'SolanaJSONRPCError';
  }
}
