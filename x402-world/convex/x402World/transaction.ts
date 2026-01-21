import { ObjectType, v } from 'convex/values';
import { GameId, parseGameId, transactionId, agentId } from './ids';
import { Game } from './game';
import { Agent } from './agent';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 PROTOCOL TRANSACTIONS
// Agent-to-Agent payments using HTTP 402 Payment Required semantics
//
// FLOW:
// 1. Agent A requests service from Agent B
// 2. Agent B returns 402 with PaymentRequirements
// 3. Agent A creates signed SPL transfer
// 4. Agent A retries request with X-PAYMENT header
// 5. Agent B verifies, settles, executes service
// ═══════════════════════════════════════════════════════════════════════════════

export type TransactionStatus =
  | 'pending'       // Created, awaiting payment
  | 'paid'          // Payment sent, awaiting confirmation
  | 'confirmed'     // On-chain confirmation received
  | 'executing'     // Service being executed
  | 'completed'     // Fully settled
  | 'failed'        // Transaction failed
  | 'refunded'      // Payment returned
  | 'disputed';     // Under dispute resolution

export type TransactionType =
  | 'payment'       // Simple transfer
  | 'service'       // Pay-for-service
  | 'data'          // Pay-for-data
  | 'delegation'    // Delegate authority
  | 'escrow'        // Held in escrow
  | 'caravan';      // Part of bundled transaction

export const serializedTransaction = {
  id: transactionId,
  type: v.union(
    v.literal('payment'),
    v.literal('service'),
    v.literal('data'),
    v.literal('delegation'),
    v.literal('escrow'),
    v.literal('caravan')
  ),
  status: v.union(
    v.literal('pending'),
    v.literal('paid'),
    v.literal('confirmed'),
    v.literal('executing'),
    v.literal('completed'),
    v.literal('failed'),
    v.literal('refunded'),
    v.literal('disputed')
  ),

  // Participants
  senderId: agentId,
  receiverId: agentId,
  initiator: v.union(v.literal('sender'), v.literal('receiver')),

  // Payment details (X402 Protocol)
  amount: v.number(),
  token: v.string(),
  tokenMint: v.string(),
  network: v.string(),
  scheme: v.union(v.literal('exact'), v.literal('upto'), v.literal('any')),

  // Service details (if type is 'service' or 'data')
  serviceId: v.optional(v.string()),
  endpoint: v.optional(v.string()),
  requestPayload: v.optional(v.any()),
  responsePayload: v.optional(v.any()),

  // Solana transaction details
  serializedTransaction: v.optional(v.string()),
  signature: v.optional(v.string()),
  blockhash: v.optional(v.string()),
  slot: v.optional(v.number()),

  // Caravan details (if part of bundle)
  caravanId: v.optional(v.string()),
  caravanIndex: v.optional(v.number()),

  // Timing
  created: v.number(),
  expires: v.number(),
  paidAt: v.optional(v.number()),
  confirmedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),

  // Metadata
  description: v.string(),
  memo: v.optional(v.string()),
  metadata: v.optional(v.any()),

  // Error handling
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  retryCount: v.number(),
  maxRetries: v.number(),
};

export type SerializedTransaction = ObjectType<typeof serializedTransaction>;

export class Transaction {
  id: GameId<'transactions'>;
  type: TransactionType;
  status: TransactionStatus;

  senderId: GameId<'agents'>;
  receiverId: GameId<'agents'>;
  initiator: 'sender' | 'receiver';

  amount: number;
  token: string;
  tokenMint: string;
  network: string;
  scheme: 'exact' | 'upto' | 'any';

  serviceId?: string;
  endpoint?: string;
  requestPayload?: any;
  responsePayload?: any;

  serializedTransaction?: string;
  signature?: string;
  blockhash?: string;
  slot?: number;

  caravanId?: string;
  caravanIndex?: number;

  created: number;
  expires: number;
  paidAt?: number;
  confirmedAt?: number;
  completedAt?: number;

  description: string;
  memo?: string;
  metadata?: any;

  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  constructor(serialized: SerializedTransaction) {
    this.id = parseGameId('transactions', serialized.id);
    this.type = serialized.type;
    this.status = serialized.status;

    this.senderId = parseGameId('agents', serialized.senderId);
    this.receiverId = parseGameId('agents', serialized.receiverId);
    this.initiator = serialized.initiator;

    this.amount = serialized.amount;
    this.token = serialized.token;
    this.tokenMint = serialized.tokenMint;
    this.network = serialized.network;
    this.scheme = serialized.scheme;

    this.serviceId = serialized.serviceId;
    this.endpoint = serialized.endpoint;
    this.requestPayload = serialized.requestPayload;
    this.responsePayload = serialized.responsePayload;

    this.serializedTransaction = serialized.serializedTransaction;
    this.signature = serialized.signature;
    this.blockhash = serialized.blockhash;
    this.slot = serialized.slot;

    this.caravanId = serialized.caravanId;
    this.caravanIndex = serialized.caravanIndex;

    this.created = serialized.created;
    this.expires = serialized.expires;
    this.paidAt = serialized.paidAt;
    this.confirmedAt = serialized.confirmedAt;
    this.completedAt = serialized.completedAt;

    this.description = serialized.description;
    this.memo = serialized.memo;
    this.metadata = serialized.metadata;

    this.errorCode = serialized.errorCode;
    this.errorMessage = serialized.errorMessage;
    this.retryCount = serialized.retryCount;
    this.maxRetries = serialized.maxRetries;
  }

  tick(game: Game, now: number) {
    // Check for expiration
    if (this.status === 'pending' && now > this.expires) {
      this.status = 'failed';
      this.errorCode = 'EXPIRED';
      this.errorMessage = 'Transaction expired before payment';
      return;
    }

    // State machine
    switch (this.status) {
      case 'paid':
        this.tickPaid(game, now);
        break;
      case 'confirmed':
        this.tickConfirmed(game, now);
        break;
      case 'executing':
        this.tickExecuting(game, now);
        break;
    }
  }

  private tickPaid(game: Game, now: number) {
    // Simulate on-chain confirmation
    // In production, this would poll Solana RPC
    if (this.paidAt && now - this.paidAt > 2000) {
      this.status = 'confirmed';
      this.confirmedAt = now;
      this.slot = Math.floor(now / 400); // Simulated slot
    }
  }

  private tickConfirmed(game: Game, now: number) {
    // Execute the service if applicable
    if (this.type === 'service' || this.type === 'data') {
      this.status = 'executing';
      game.scheduleOperation('executeService', {
        transactionId: this.id,
        serviceId: this.serviceId,
        endpoint: this.endpoint,
        payload: this.requestPayload,
      });
    } else {
      this.status = 'completed';
      this.completedAt = now;
    }
  }

  private tickExecuting(game: Game, now: number) {
    // Wait for service execution callback
    // This is handled by agentOperations
  }

  // X402 Protocol Methods

  // Generate PaymentRequirements for 402 response
  toPaymentRequirements(): PaymentRequirements {
    return {
      x402Version: 1,
      accepts: [{
        scheme: this.scheme,
        network: this.network,
        maxAmountRequired: this.amount.toString(),
        resource: this.endpoint || `x402://transaction/${this.id}`,
        description: this.description,
        mimeType: 'application/json',
        payTo: '', // Will be set by receiver agent
        maxTimeoutSeconds: Math.floor((this.expires - Date.now()) / 1000),
        asset: this.token,
        extra: {
          transactionId: this.id,
          serviceId: this.serviceId,
        },
      }],
      error: null,
    };
  }

  // Parse X-PAYMENT header
  static parsePaymentHeader(header: string): ParsedPayment | null {
    try {
      const decoded = JSON.parse(Buffer.from(header, 'base64').toString());
      return {
        x402Version: decoded.x402Version,
        scheme: decoded.scheme,
        network: decoded.network,
        payload: decoded.payload,
      };
    } catch {
      return null;
    }
  }

  // Create a new transaction request
  static create(
    game: Game,
    now: number,
    sender: Agent,
    receiver: Agent,
    options: CreateTransactionOptions
  ): Transaction {
    const txId = game.allocId('transactions');

    const transaction = new Transaction({
      id: txId,
      type: options.type,
      status: 'pending',
      senderId: sender.id,
      receiverId: receiver.id,
      initiator: options.initiator || 'sender',
      amount: options.amount,
      token: options.token || 'USDC',
      tokenMint: options.tokenMint || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      network: options.network || 'solana-mainnet',
      scheme: options.scheme || 'exact',
      serviceId: options.serviceId,
      endpoint: options.endpoint,
      requestPayload: options.requestPayload,
      created: now,
      expires: now + (options.timeoutMs || 300000), // 5 min default
      description: options.description,
      memo: options.memo,
      metadata: options.metadata,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
    });

    game.world.transactions.set(txId, transaction);
    return transaction;
  }

  // Submit payment
  submitPayment(serializedTx: string, signature?: string) {
    this.serializedTransaction = serializedTx;
    this.signature = signature;
    this.status = 'paid';
    this.paidAt = Date.now();
  }

  // Mark as completed
  complete(now: number, responsePayload?: any) {
    this.status = 'completed';
    this.completedAt = now;
    this.responsePayload = responsePayload;
  }

  // Mark as failed
  fail(errorCode: string, errorMessage: string) {
    this.status = 'failed';
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
  }

  // Request retry
  retry(): boolean {
    if (this.retryCount >= this.maxRetries) {
      return false;
    }
    this.retryCount++;
    this.status = 'pending';
    this.expires = Date.now() + 60000; // 1 min retry window
    return true;
  }

  serialize(): SerializedTransaction {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      senderId: this.senderId,
      receiverId: this.receiverId,
      initiator: this.initiator,
      amount: this.amount,
      token: this.token,
      tokenMint: this.tokenMint,
      network: this.network,
      scheme: this.scheme,
      serviceId: this.serviceId,
      endpoint: this.endpoint,
      requestPayload: this.requestPayload,
      responsePayload: this.responsePayload,
      serializedTransaction: this.serializedTransaction,
      signature: this.signature,
      blockhash: this.blockhash,
      slot: this.slot,
      caravanId: this.caravanId,
      caravanIndex: this.caravanIndex,
      created: this.created,
      expires: this.expires,
      paidAt: this.paidAt,
      confirmedAt: this.confirmedAt,
      completedAt: this.completedAt,
      description: this.description,
      memo: this.memo,
      metadata: this.metadata,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
    };
  }
}

// Types for X402 Protocol

export interface PaymentRequirements {
  x402Version: number;
  accepts: PaymentOption[];
  error: string | null;
}

export interface PaymentOption {
  scheme: 'exact' | 'upto' | 'any';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, any>;
}

export interface ParsedPayment {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    serializedTransaction: string;
    signature?: string;
  };
}

export interface CreateTransactionOptions {
  type: TransactionType;
  amount: number;
  token?: string;
  tokenMint?: string;
  network?: string;
  scheme?: 'exact' | 'upto' | 'any';
  initiator?: 'sender' | 'receiver';
  serviceId?: string;
  endpoint?: string;
  requestPayload?: any;
  description: string;
  memo?: string;
  metadata?: any;
  timeoutMs?: number;
  maxRetries?: number;
}
