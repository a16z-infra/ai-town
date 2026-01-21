import type { Mint } from '../../state/mint.js';
import type { AccountInfo, AccountMeta, Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import type { Account } from '../../state/account.js';
/** TransferHook as stored by the program */
export interface TransferHook {
    /** The transfer hook update authority */
    authority: PublicKey;
    /** The transfer hook program account */
    programId: PublicKey;
}
/** Buffer layout for de/serializing a transfer hook extension */
export declare const TransferHookLayout: import("@solana/buffer-layout").Structure<TransferHook>;
export declare const TRANSFER_HOOK_SIZE: number;
export declare function getTransferHook(mint: Mint): TransferHook | null;
/** TransferHookAccount as stored by the program */
export interface TransferHookAccount {
    /**
     * Whether or not this account is currently transferring tokens
     * True during the transfer hook cpi, otherwise false
     */
    transferring: boolean;
}
/** Buffer layout for de/serializing a transfer hook account extension */
export declare const TransferHookAccountLayout: import("@solana/buffer-layout").Structure<TransferHookAccount>;
export declare const TRANSFER_HOOK_ACCOUNT_SIZE: number;
export declare function getTransferHookAccount(account: Account): TransferHookAccount | null;
export declare function getExtraAccountMetaAddress(mint: PublicKey, programId: PublicKey): PublicKey;
/** ExtraAccountMeta as stored by the transfer hook program */
export interface ExtraAccountMeta {
    discriminator: number;
    addressConfig: Uint8Array;
    isSigner: boolean;
    isWritable: boolean;
}
/** Buffer layout for de/serializing an ExtraAccountMeta */
export declare const ExtraAccountMetaLayout: import("@solana/buffer-layout").Structure<ExtraAccountMeta>;
export interface ExtraAccountMetaList {
    count: number;
    extraAccounts: ExtraAccountMeta[];
}
/** Buffer layout for de/serializing a list of ExtraAccountMeta prefixed by a u32 length */
export declare const ExtraAccountMetaListLayout: import("@solana/buffer-layout").Structure<ExtraAccountMetaList>;
/** Buffer layout for de/serializing a list of ExtraAccountMetaAccountData prefixed by a u32 length */
export interface ExtraAccountMetaAccountData {
    instructionDiscriminator: bigint;
    length: number;
    extraAccountsList: ExtraAccountMetaList;
}
/** Buffer layout for de/serializing an ExtraAccountMetaAccountData */
export declare const ExtraAccountMetaAccountDataLayout: import("@solana/buffer-layout").Structure<ExtraAccountMetaAccountData>;
/** Unpack an extra account metas account and parse the data into a list of ExtraAccountMetas */
export declare function getExtraAccountMetas(account: AccountInfo<Buffer>): ExtraAccountMeta[];
/** Take an ExtraAccountMeta and construct that into an actual AccountMeta */
export declare function resolveExtraAccountMeta(connection: Connection, extraMeta: ExtraAccountMeta, previousMetas: AccountMeta[], instructionData: Buffer, transferHookProgramId: PublicKey): Promise<AccountMeta>;
//# sourceMappingURL=state.d.ts.map