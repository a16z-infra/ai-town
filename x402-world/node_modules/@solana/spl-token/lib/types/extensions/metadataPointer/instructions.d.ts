import type { Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum MetadataPointerInstruction {
    Initialize = 0,
    Update = 1
}
export declare const initializeMetadataPointerData: import("@solana/buffer-layout").Structure<{
    instruction: TokenInstruction.MetadataPointerExtension;
    metadataPointerInstruction: number;
    authority: PublicKey;
    metadataAddress: PublicKey;
}>;
/**
 * Construct an Initialize MetadataPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the metadata address
 * @param metadataAddress Optional Account address that holds the metadata
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeMetadataPointerInstruction(mint: PublicKey, authority: PublicKey | null, metadataAddress: PublicKey | null, programId: PublicKey): TransactionInstruction;
export declare const updateMetadataPointerData: import("@solana/buffer-layout").Structure<{
    instruction: TokenInstruction.MetadataPointerExtension;
    metadataPointerInstruction: number;
    metadataAddress: PublicKey;
}>;
export declare function createUpdateMetadataPointerInstruction(mint: PublicKey, authority: PublicKey, metadataAddress: PublicKey | null, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map