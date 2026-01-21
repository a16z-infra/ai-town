"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTransferHookPubkeyDataTooSmall = exports.TokenTransferHookInvalidPubkeyData = exports.TokenTransferHookAccountDataNotFound = exports.TokenTransferHookInvalidSeed = exports.TokenTransferHookAccountNotFound = exports.TokenUnsupportedInstructionError = exports.TokenInvalidInstructionTypeError = exports.TokenInvalidInstructionDataError = exports.TokenInvalidInstructionKeysError = exports.TokenInvalidInstructionProgramError = exports.TokenOwnerOffCurveError = exports.TokenInvalidOwnerError = exports.TokenInvalidMintError = exports.TokenInvalidAccountSizeError = exports.TokenInvalidAccountOwnerError = exports.TokenInvalidAccountDataError = exports.TokenInvalidAccountError = exports.TokenAccountNotFoundError = exports.TokenError = void 0;
/** Base class for errors */
class TokenError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.TokenError = TokenError;
/** Thrown if an account is not found at the expected address */
class TokenAccountNotFoundError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenAccountNotFoundError';
    }
}
exports.TokenAccountNotFoundError = TokenAccountNotFoundError;
/** Thrown if a program state account is not a valid Account */
class TokenInvalidAccountError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidAccountError';
    }
}
exports.TokenInvalidAccountError = TokenInvalidAccountError;
/** Thrown if a program state account does not contain valid data */
class TokenInvalidAccountDataError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidAccountDataError';
    }
}
exports.TokenInvalidAccountDataError = TokenInvalidAccountDataError;
/** Thrown if a program state account is not owned by the expected token program */
class TokenInvalidAccountOwnerError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidAccountOwnerError';
    }
}
exports.TokenInvalidAccountOwnerError = TokenInvalidAccountOwnerError;
/** Thrown if the byte length of an program state account doesn't match the expected size */
class TokenInvalidAccountSizeError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidAccountSizeError';
    }
}
exports.TokenInvalidAccountSizeError = TokenInvalidAccountSizeError;
/** Thrown if the mint of a token account doesn't match the expected mint */
class TokenInvalidMintError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidMintError';
    }
}
exports.TokenInvalidMintError = TokenInvalidMintError;
/** Thrown if the owner of a token account doesn't match the expected owner */
class TokenInvalidOwnerError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidOwnerError';
    }
}
exports.TokenInvalidOwnerError = TokenInvalidOwnerError;
/** Thrown if the owner of a token account is a PDA (Program Derived Address) */
class TokenOwnerOffCurveError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenOwnerOffCurveError';
    }
}
exports.TokenOwnerOffCurveError = TokenOwnerOffCurveError;
/** Thrown if an instruction's program is invalid */
class TokenInvalidInstructionProgramError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidInstructionProgramError';
    }
}
exports.TokenInvalidInstructionProgramError = TokenInvalidInstructionProgramError;
/** Thrown if an instruction's keys are invalid */
class TokenInvalidInstructionKeysError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidInstructionKeysError';
    }
}
exports.TokenInvalidInstructionKeysError = TokenInvalidInstructionKeysError;
/** Thrown if an instruction's data is invalid */
class TokenInvalidInstructionDataError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidInstructionDataError';
    }
}
exports.TokenInvalidInstructionDataError = TokenInvalidInstructionDataError;
/** Thrown if an instruction's type is invalid */
class TokenInvalidInstructionTypeError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenInvalidInstructionTypeError';
    }
}
exports.TokenInvalidInstructionTypeError = TokenInvalidInstructionTypeError;
/** Thrown if the program does not support the desired instruction */
class TokenUnsupportedInstructionError extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenUnsupportedInstructionError';
    }
}
exports.TokenUnsupportedInstructionError = TokenUnsupportedInstructionError;
/** Thrown if the transfer hook extra accounts contains an invalid account index */
class TokenTransferHookAccountNotFound extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenTransferHookAccountNotFound';
    }
}
exports.TokenTransferHookAccountNotFound = TokenTransferHookAccountNotFound;
/** Thrown if the transfer hook extra accounts contains an invalid seed */
class TokenTransferHookInvalidSeed extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenTransferHookInvalidSeed';
    }
}
exports.TokenTransferHookInvalidSeed = TokenTransferHookInvalidSeed;
/** Thrown if account data required by an extra account meta seed config could not be fetched */
class TokenTransferHookAccountDataNotFound extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenTransferHookAccountDataNotFound';
    }
}
exports.TokenTransferHookAccountDataNotFound = TokenTransferHookAccountDataNotFound;
/** Thrown if pubkey data extra accounts config is invalid */
class TokenTransferHookInvalidPubkeyData extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenTransferHookInvalidPubkeyData';
    }
}
exports.TokenTransferHookInvalidPubkeyData = TokenTransferHookInvalidPubkeyData;
/** Thrown if pubkey data source is too small for a pubkey */
class TokenTransferHookPubkeyDataTooSmall extends TokenError {
    constructor() {
        super(...arguments);
        this.name = 'TokenTransferHookPubkeyDataTooSmall';
    }
}
exports.TokenTransferHookPubkeyDataTooSmall = TokenTransferHookPubkeyDataTooSmall;
//# sourceMappingURL=errors.js.map