export declare class TokenGroupError extends Error {
    constructor(message?: string);
}
/** Thrown if size is greater than proposed max size */
export declare class SizeExceedsNewMaxSizeError extends TokenGroupError {
    name: string;
}
/** Thrown if size is greater than max size */
export declare class SizeExceedsMaxSizeError extends TokenGroupError {
    name: string;
}
/** Thrown if group is immutable */
export declare class ImmutableGroupError extends TokenGroupError {
    name: string;
}
/** Thrown if incorrect mint authority has signed the instruction */
export declare class IncorrectMintAuthorityError extends TokenGroupError {
    name: string;
}
/** Thrown if incorrect update authority has signed the instruction */
export declare class IncorrectUpdateAuthorityError extends TokenGroupError {
    name: string;
}
/** Thrown if member account is the same as the group account */
export declare class MemberAccountIsGroupAccountError extends TokenGroupError {
    name: string;
}
//# sourceMappingURL=errors.d.ts.map