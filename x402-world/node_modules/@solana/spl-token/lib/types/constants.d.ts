import { PublicKey } from '@solana/web3.js';
/** Address of the SPL Token program */
export declare const TOKEN_PROGRAM_ID: PublicKey;
/** Address of the SPL Token 2022 program */
export declare const TOKEN_2022_PROGRAM_ID: PublicKey;
/** Address of the SPL Associated Token Account program */
export declare const ASSOCIATED_TOKEN_PROGRAM_ID: PublicKey;
/** Address of the special mint for wrapped native SOL in spl-token */
export declare const NATIVE_MINT: PublicKey;
/** Address of the special mint for wrapped native SOL in spl-token-2022 */
export declare const NATIVE_MINT_2022: PublicKey;
/** Check that the token program provided is not `Tokenkeg...`, useful when using extensions */
export declare function programSupportsExtensions(programId: PublicKey): boolean;
//# sourceMappingURL=constants.d.ts.map