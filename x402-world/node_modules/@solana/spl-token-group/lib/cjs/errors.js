"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberAccountIsGroupAccountError = exports.IncorrectUpdateAuthorityError = exports.IncorrectMintAuthorityError = exports.ImmutableGroupError = exports.SizeExceedsMaxSizeError = exports.SizeExceedsNewMaxSizeError = exports.TokenGroupError = void 0;
class TokenGroupError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.TokenGroupError = TokenGroupError;
/** Thrown if size is greater than proposed max size */
class SizeExceedsNewMaxSizeError extends TokenGroupError {
    constructor() {
        super(...arguments);
        this.name = 'SizeExceedsNewMaxSizeError';
    }
}
exports.SizeExceedsNewMaxSizeError = SizeExceedsNewMaxSizeError;
/** Thrown if size is greater than max size */
class SizeExceedsMaxSizeError extends TokenGroupError {
    constructor() {
        super(...arguments);
        this.name = 'SizeExceedsMaxSizeError';
    }
}
exports.SizeExceedsMaxSizeError = SizeExceedsMaxSizeError;
/** Thrown if group is immutable */
class ImmutableGroupError extends TokenGroupError {
    constructor() {
        super(...arguments);
        this.name = 'ImmutableGroupError';
    }
}
exports.ImmutableGroupError = ImmutableGroupError;
/** Thrown if incorrect mint authority has signed the instruction */
class IncorrectMintAuthorityError extends TokenGroupError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectMintAuthorityError';
    }
}
exports.IncorrectMintAuthorityError = IncorrectMintAuthorityError;
/** Thrown if incorrect update authority has signed the instruction */
class IncorrectUpdateAuthorityError extends TokenGroupError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectUpdateAuthorityError';
    }
}
exports.IncorrectUpdateAuthorityError = IncorrectUpdateAuthorityError;
/** Thrown if member account is the same as the group account */
class MemberAccountIsGroupAccountError extends TokenGroupError {
    constructor() {
        super(...arguments);
        this.name = 'MemberAccountIsGroupAccountError';
    }
}
exports.MemberAccountIsGroupAccountError = MemberAccountIsGroupAccountError;
//# sourceMappingURL=errors.js.map