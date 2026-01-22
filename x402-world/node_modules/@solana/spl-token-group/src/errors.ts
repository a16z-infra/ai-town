export class TokenGroupError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/** Thrown if size is greater than proposed max size */
export class SizeExceedsNewMaxSizeError extends TokenGroupError {
    name = 'SizeExceedsNewMaxSizeError';
}

/** Thrown if size is greater than max size */
export class SizeExceedsMaxSizeError extends TokenGroupError {
    name = 'SizeExceedsMaxSizeError';
}

/** Thrown if group is immutable */
export class ImmutableGroupError extends TokenGroupError {
    name = 'ImmutableGroupError';
}

/** Thrown if incorrect mint authority has signed the instruction */
export class IncorrectMintAuthorityError extends TokenGroupError {
    name = 'IncorrectMintAuthorityError';
}

/** Thrown if incorrect update authority has signed the instruction */
export class IncorrectUpdateAuthorityError extends TokenGroupError {
    name = 'IncorrectUpdateAuthorityError';
}

/** Thrown if member account is the same as the group account */
export class MemberAccountIsGroupAccountError extends TokenGroupError {
    name = 'MemberAccountIsGroupAccountError';
}
