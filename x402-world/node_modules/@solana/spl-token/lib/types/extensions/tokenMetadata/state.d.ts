import type { Commitment, Connection } from '@solana/web3.js';
import type { PublicKey } from '@solana/web3.js';
import type { TokenMetadata } from '@solana/spl-token-metadata';
import { Field } from '@solana/spl-token-metadata';
export declare function updateTokenMetadata(current: TokenMetadata, key: Field | string, value: string): TokenMetadata;
/**
 * Retrieve Token Metadata Information
 *
 * @param connection Connection to use
 * @param address    Mint account
 * @param commitment Desired level of commitment for querying the state
 * @param programId  SPL Token program account
 *
 * @return Token Metadata information
 */
export declare function getTokenMetadata(connection: Connection, address: PublicKey, commitment?: Commitment, programId?: PublicKey): Promise<TokenMetadata | null>;
//# sourceMappingURL=state.d.ts.map