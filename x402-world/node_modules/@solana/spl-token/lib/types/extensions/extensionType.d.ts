import type { AccountInfo, PublicKey } from '@solana/web3.js';
import type { Mint } from '../state/mint.js';
export declare enum ExtensionType {
    Uninitialized = 0,
    TransferFeeConfig = 1,
    TransferFeeAmount = 2,
    MintCloseAuthority = 3,
    ConfidentialTransferMint = 4,
    ConfidentialTransferAccount = 5,
    DefaultAccountState = 6,
    ImmutableOwner = 7,
    MemoTransfer = 8,
    NonTransferable = 9,
    InterestBearingConfig = 10,
    CpiGuard = 11,
    PermanentDelegate = 12,
    NonTransferableAccount = 13,
    TransferHook = 14,
    TransferHookAccount = 15,
    MetadataPointer = 18,// Remove number once above extensions implemented
    TokenMetadata = 19,// Remove number once above extensions implemented
    GroupPointer = 20,
    TokenGroup = 21,
    GroupMemberPointer = 22,
    TokenGroupMember = 23,
    ScaledUiAmountConfig = 25,
    PausableConfig = 26,
    PausableAccount = 27
}
export declare const TYPE_SIZE = 2;
export declare const LENGTH_SIZE = 2;
export declare function getTypeLen(e: ExtensionType): number;
export declare function isMintExtension(e: ExtensionType): boolean;
export declare function isAccountExtension(e: ExtensionType): boolean;
export declare function getAccountTypeOfMintType(e: ExtensionType): ExtensionType;
export declare function getMintLen(extensionTypes: ExtensionType[], variableLengthExtensions?: {
    [E in ExtensionType]?: number;
}): number;
export declare function getAccountLen(extensionTypes: ExtensionType[]): number;
export declare function getExtensionData(extension: ExtensionType, tlvData: Buffer): Buffer | null;
export declare function getExtensionTypes(tlvData: Buffer): ExtensionType[];
export declare function getAccountLenForMint(mint: Mint): number;
export declare function getNewAccountLenForExtensionLen(info: AccountInfo<Buffer>, address: PublicKey, extensionType: ExtensionType, extensionLen: number, programId?: PublicKey): number;
//# sourceMappingURL=extensionType.d.ts.map