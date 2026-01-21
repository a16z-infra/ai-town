import type { AccountMeta, Signer, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** Authority types defined by the program */
export declare enum AuthorityType {
    MintTokens = 0,
    FreezeAccount = 1,
    AccountOwner = 2,
    CloseAccount = 3,
    TransferFeeConfig = 4,
    WithheldWithdraw = 5,
    CloseMint = 6,
    InterestRate = 7,
    PermanentDelegate = 8,
    ConfidentialTransferMint = 9,
    TransferHookProgramId = 10,
    ConfidentialTransferFeeConfig = 11,
    MetadataPointer = 12,
    GroupPointer = 13,
    GroupMemberPointer = 14,
    ScaledUiAmountConfig = 15,
    PausableConfig = 16
}
/** TODO: docs */
export interface SetAuthorityInstructionData {
    instruction: TokenInstruction.SetAuthority;
    authorityType: AuthorityType;
    newAuthority: PublicKey | null;
}
/** TODO: docs */
export declare const setAuthorityInstructionData: import("@solana/buffer-layout").Structure<SetAuthorityInstructionData>;
/**
 * Construct a SetAuthority instruction
 *
 * @param account          Address of the token account
 * @param currentAuthority Current authority of the specified type
 * @param authorityType    Type of authority to set
 * @param newAuthority     New authority of the account
 * @param multiSigners     Signing accounts if `currentAuthority` is a multisig
 * @param programId        SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createSetAuthorityInstruction(account: PublicKey, currentAuthority: PublicKey, authorityType: AuthorityType, newAuthority: PublicKey | null, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid SetAuthority instruction */
export interface DecodedSetAuthorityInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        currentAuthority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.SetAuthority;
        authorityType: AuthorityType;
        newAuthority: PublicKey | null;
    };
}
/**
 * Decode a SetAuthority instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeSetAuthorityInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedSetAuthorityInstruction;
/** A decoded, non-validated SetAuthority instruction */
export interface DecodedSetAuthorityInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        currentAuthority: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
        authorityType: AuthorityType;
        newAuthority: PublicKey | null;
    };
}
/**
 * Decode a SetAuthority instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeSetAuthorityInstructionUnchecked({ programId, keys: [account, currentAuthority, ...multiSigners], data, }: TransactionInstruction): DecodedSetAuthorityInstructionUnchecked;
//# sourceMappingURL=setAuthority.d.ts.map