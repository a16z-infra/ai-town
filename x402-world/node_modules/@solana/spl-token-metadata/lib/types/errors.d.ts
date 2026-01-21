/** Base class for errors */
export declare class TokenMetadataError extends Error {
    constructor(message?: string);
}
/** Thrown if incorrect account provided */
export declare class IncorrectAccountError extends TokenMetadataError {
    name: string;
}
/** Thrown if Mint has no mint authority */
export declare class MintHasNoMintAuthorityError extends TokenMetadataError {
    name: string;
}
/** Thrown if Incorrect mint authority has signed the instruction */
export declare class IncorrectMintAuthorityError extends TokenMetadataError {
    name: string;
}
/** Thrown if Incorrect mint authority has signed the instruction */
export declare class IncorrectUpdateAuthorityError extends TokenMetadataError {
    name: string;
}
/** Thrown if Token metadata has no update authority */
export declare class ImmutableMetadataError extends TokenMetadataError {
    name: string;
}
/** Thrown if Key not found in metadata account */
export declare class KeyNotFoundError extends TokenMetadataError {
    name: string;
}
//# sourceMappingURL=errors.d.ts.map