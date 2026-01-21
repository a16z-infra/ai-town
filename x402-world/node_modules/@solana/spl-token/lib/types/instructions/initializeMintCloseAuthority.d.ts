import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface InitializeMintCloseAuthorityInstructionData {
    instruction: TokenInstruction.InitializeMintCloseAuthority;
    closeAuthority: PublicKey | null;
}
/** TODO: docs */
export declare const initializeMintCloseAuthorityInstructionData: import("@solana/buffer-layout").Structure<InitializeMintCloseAuthorityInstructionData>;
/**
 * Construct an InitializeMintCloseAuthority instruction
 *
 * @param mint            Token mint account
 * @param closeAuthority  Optional authority that can close the mint
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeMintCloseAuthorityInstruction(mint: PublicKey, closeAuthority: PublicKey | null, programId: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeMintCloseAuthority instruction */
export interface DecodedInitializeMintCloseAuthorityInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeMintCloseAuthority;
        closeAuthority: PublicKey | null;
    };
}
/**
 * Decode an InitializeMintCloseAuthority instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeMintCloseAuthorityInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedInitializeMintCloseAuthorityInstruction;
/** A decoded, non-validated InitializeMintCloseAuthority instruction */
export interface DecodedInitializeMintCloseAuthorityInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        closeAuthority: PublicKey | null;
    };
}
/**
 * Decode an InitializeMintCloseAuthority instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeMintCloseAuthorityInstructionUnchecked({ programId, keys: [mint], data, }: TransactionInstruction): DecodedInitializeMintCloseAuthorityInstructionUnchecked;
//# sourceMappingURL=initializeMintCloseAuthority.d.ts.map