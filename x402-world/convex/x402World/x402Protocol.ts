import { v } from 'convex/values';
import { internalAction, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { GameId } from './ids';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 PROTOCOL INTEGRATION
// HTTP 402 Payment Required for Agent-to-Agent Commerce on Solana
//
// This module bridges X402 World agents with:
// - X402 Protocol (HTTP-native micropayments)
// - Google ADK (Agent Development Kit for A2A communication)
// - Solana blockchain (SPL token transfers)
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const X402_CONFIG = {
  // Protocol version
  VERSION: 1,

  // Supported networks
  NETWORKS: {
    'solana-mainnet': {
      name: 'Solana Mainnet',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      explorerUrl: 'https://solscan.io',
    },
    'solana-devnet': {
      name: 'Solana Devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      explorerUrl: 'https://solscan.io/?cluster=devnet',
    },
  },

  // Supported tokens
  TOKENS: {
    USDC: {
      symbol: 'USDC',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
    },
    X402: {
      symbol: 'X402',
      mint: '2Hx4YEy3vDPAw3tiUZ9TBibzjWKGUDKLyEeRqHsDBAGS',
      decimals: 9,
    },
    SOL: {
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
    },
  },

  // Default timeout for payment requests
  DEFAULT_TIMEOUT_MS: 300000, // 5 minutes

  // Maximum retries for failed transactions
  MAX_RETRIES: 3,

  // Minimum amount thresholds (in smallest units)
  MIN_AMOUNT: {
    USDC: 1000, // 0.001 USDC
    X402: 1000000, // 0.001 X402
    SOL: 100000, // 0.0001 SOL
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE ADK AGENT-TO-AGENT PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export interface A2ARequest {
  // Google ADK A2A Message format
  id: string;
  jsonrpc: '2.0';
  method: string;
  params: {
    message: {
      role: 'user' | 'agent';
      parts: Array<{
        type: 'text' | 'data' | 'function_call' | 'function_response';
        content: any;
      }>;
    };
    context?: {
      agentId: string;
      capabilities: string[];
      x402?: {
        walletAddress: string;
        supportedTokens: string[];
        pricePerRequest: number;
      };
    };
  };
}

export interface A2AResponse {
  id: string;
  jsonrpc: '2.0';
  result?: {
    message: {
      role: 'agent';
      parts: Array<{
        type: 'text' | 'data' | 'function_call' | 'function_response';
        content: any;
      }>;
    };
    x402?: {
      paymentRequired: boolean;
      paymentRequirements?: PaymentRequirements;
      transactionId?: string;
    };
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// X402 PROTOCOL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

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
  extra?: {
    transactionId?: string;
    serviceId?: string;
    agentId?: string;
  };
}

export interface PaymentPayload {
  x402Version: number;
  scheme: 'exact' | 'upto' | 'any';
  network: string;
  payload: {
    serializedTransaction: string;
    signature?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT MIDDLEWARE (for X402 World agents)
// ═══════════════════════════════════════════════════════════════════════════════

export function createPaymentRequirements(
  amount: number,
  token: 'USDC' | 'X402' | 'SOL',
  recipientWallet: string,
  options: {
    description?: string;
    resource?: string;
    timeoutSeconds?: number;
    transactionId?: string;
    serviceId?: string;
    agentId?: string;
    scheme?: 'exact' | 'upto' | 'any';
  } = {}
): PaymentRequirements {
  const tokenConfig = X402_CONFIG.TOKENS[token];

  return {
    x402Version: X402_CONFIG.VERSION,
    accepts: [
      {
        scheme: options.scheme || 'exact',
        network: 'solana-mainnet',
        maxAmountRequired: amount.toString(),
        resource: options.resource || `x402://payment/${Date.now()}`,
        description: options.description || 'X402 World Payment',
        mimeType: 'application/json',
        payTo: recipientWallet,
        maxTimeoutSeconds: options.timeoutSeconds || 300,
        asset: tokenConfig.mint,
        extra: {
          transactionId: options.transactionId,
          serviceId: options.serviceId,
          agentId: options.agentId,
        },
      },
    ],
    error: null,
  };
}

export function parsePaymentHeader(header: string): PaymentPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
    if (decoded.x402Version !== X402_CONFIG.VERSION) {
      console.warn(`Unsupported X402 version: ${decoded.x402Version}`);
      return null;
    }
    return decoded as PaymentPayload;
  } catch (error) {
    console.error('Failed to parse X-PAYMENT header:', error);
    return null;
  }
}

export function encodePaymentHeader(payload: PaymentPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVEX ACTIONS FOR X402 PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const requestPayment = internalAction({
  args: {
    worldId: v.id('worlds'),
    transactionId: v.string(),
    senderId: v.string(),
    receiverId: v.string(),
    amount: v.number(),
    token: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Create payment requirements for the transaction
    // This is called when Agent B returns a 402 to Agent A

    const requirements = createPaymentRequirements(
      args.amount,
      args.token as 'USDC' | 'X402' | 'SOL',
      '', // Will be filled with receiver's wallet
      {
        description: args.description,
        transactionId: args.transactionId,
        agentId: args.receiverId,
      }
    );

    // Store the pending payment request
    await ctx.runMutation(internal.x402World.x402Protocol.storePendingPayment, {
      worldId: args.worldId,
      transactionId: args.transactionId,
      requirements: requirements,
    });

    return requirements;
  },
});

export const storePendingPayment = internalMutation({
  args: {
    worldId: v.id('worlds'),
    transactionId: v.string(),
    requirements: v.any(),
  },
  handler: async (ctx, args) => {
    // Store pending payment in world state
    // This would update the transaction status to 'pending'
    // Implementation depends on full database schema
  },
});

export const verifyPayment = internalAction({
  args: {
    worldId: v.id('worlds'),
    transactionId: v.string(),
    paymentHeader: v.string(),
  },
  handler: async (ctx, args) => {
    // Parse the X-PAYMENT header
    const payment = parsePaymentHeader(args.paymentHeader);
    if (!payment) {
      return { success: false, error: 'Invalid payment header' };
    }

    // Verify the Solana transaction
    // In production, this would:
    // 1. Deserialize the transaction
    // 2. Verify signatures
    // 3. Check recipient matches expected
    // 4. Verify amount matches or exceeds required
    // 5. Submit to Solana RPC
    // 6. Wait for confirmation

    // Simulated verification
    const verified = payment.payload.serializedTransaction.length > 100;

    if (verified) {
      // Update transaction status
      await ctx.runMutation(internal.x402World.x402Protocol.confirmPayment, {
        worldId: args.worldId,
        transactionId: args.transactionId,
        signature: payment.payload.signature || 'simulated-signature',
      });

      return { success: true, signature: payment.payload.signature };
    }

    return { success: false, error: 'Payment verification failed' };
  },
});

export const confirmPayment = internalMutation({
  args: {
    worldId: v.id('worlds'),
    transactionId: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    // Update transaction to confirmed status
    // Implementation depends on full database schema
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// A2A MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export const handleA2ARequest = internalAction({
  args: {
    worldId: v.id('worlds'),
    targetAgentId: v.string(),
    request: v.any(),
    paymentHeader: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = args.request as A2ARequest;

    // Check if this request requires payment
    // In production, this would check the agent's pricing configuration

    if (!args.paymentHeader) {
      // Return 402 Payment Required
      const requirements = createPaymentRequirements(
        1000, // 0.001 USDC
        'USDC',
        '', // Will be filled by agent wallet
        {
          description: `A2A Request: ${request.method}`,
          agentId: args.targetAgentId,
        }
      );

      const response: A2AResponse = {
        id: request.id,
        jsonrpc: '2.0',
        result: {
          message: {
            role: 'agent',
            parts: [{
              type: 'text',
              content: 'Payment required to process this request.',
            }],
          },
          x402: {
            paymentRequired: true,
            paymentRequirements: requirements,
          },
        },
      };

      return response;
    }

    // Verify payment
    const paymentResult = await ctx.runAction(
      internal.x402World.x402Protocol.verifyPayment,
      {
        worldId: args.worldId,
        transactionId: `a2a-${request.id}`,
        paymentHeader: args.paymentHeader,
      }
    );

    if (!paymentResult.success) {
      const response: A2AResponse = {
        id: request.id,
        jsonrpc: '2.0',
        error: {
          code: 402,
          message: 'Payment verification failed',
          data: paymentResult.error,
        },
      };
      return response;
    }

    // Process the A2A request
    // This is where the actual agent logic would run
    const response: A2AResponse = {
      id: request.id,
      jsonrpc: '2.0',
      result: {
        message: {
          role: 'agent',
          parts: [{
            type: 'text',
            content: `Request processed successfully. Method: ${request.method}`,
          }],
        },
        x402: {
          paymentRequired: false,
          transactionId: `a2a-${request.id}`,
        },
      },
    };

    return response;
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function formatAmount(amount: number, token: 'USDC' | 'X402' | 'SOL'): string {
  const decimals = X402_CONFIG.TOKENS[token].decimals;
  return (amount / Math.pow(10, decimals)).toFixed(decimals);
}

export function parseAmount(amount: string, token: 'USDC' | 'X402' | 'SOL'): number {
  const decimals = X402_CONFIG.TOKENS[token].decimals;
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
}

export function validateWalletAddress(address: string): boolean {
  // Basic Solana address validation
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function generateTransactionId(): string {
  return `tx:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
