"use strict";
// Errors match those in rust https://github.com/solana-labs/solana-program-library/blob/master/token-metadata/interface/src/error.rs
// Code follows: https://github.com/solana-labs/solana-program-library/blob/master/token/js/src/errors.tshttps://github.com/solana-labs/solana-program-library/blob/master/token/js/src/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyNotFoundError = exports.ImmutableMetadataError = exports.IncorrectUpdateAuthorityError = exports.IncorrectMintAuthorityError = exports.MintHasNoMintAuthorityError = exports.IncorrectAccountError = exports.TokenMetadataError = void 0;
/** Base class for errors */
class TokenMetadataError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.TokenMetadataError = TokenMetadataError;
/** Thrown if incorrect account provided */
class IncorrectAccountError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectAccountError';
    }
}
exports.IncorrectAccountError = IncorrectAccountError;
/** Thrown if Mint has no mint authority */
class MintHasNoMintAuthorityError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'MintHasNoMintAuthorityError';
    }
}
exports.MintHasNoMintAuthorityError = MintHasNoMintAuthorityError;
/** Thrown if Incorrect mint authority has signed the instruction */
class IncorrectMintAuthorityError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectMintAuthorityError';
    }
}
exports.IncorrectMintAuthorityError = IncorrectMintAuthorityError;
/** Thrown if Incorrect mint authority has signed the instruction */
class IncorrectUpdateAuthorityError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectUpdateAuthorityError';
    }
}
exports.IncorrectUpdateAuthorityError = IncorrectUpdateAuthorityError;
/** Thrown if Token metadata has no update authority */
class ImmutableMetadataError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'ImmutableMetadataError';
    }
}
exports.ImmutableMetadataError = ImmutableMetadataError;
/** Thrown if Key not found in metadata account */
class KeyNotFoundError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'KeyNotFoundError';
    }
}
exports.KeyNotFoundError = KeyNotFoundError;
//# sourceMappingURL=errors.js.map