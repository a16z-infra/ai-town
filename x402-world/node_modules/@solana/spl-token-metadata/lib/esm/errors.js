// Errors match those in rust https://github.com/solana-labs/solana-program-library/blob/master/token-metadata/interface/src/error.rs
// Code follows: https://github.com/solana-labs/solana-program-library/blob/master/token/js/src/errors.tshttps://github.com/solana-labs/solana-program-library/blob/master/token/js/src/errors.ts
/** Base class for errors */
export class TokenMetadataError extends Error {
    constructor(message) {
        super(message);
    }
}
/** Thrown if incorrect account provided */
export class IncorrectAccountError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectAccountError';
    }
}
/** Thrown if Mint has no mint authority */
export class MintHasNoMintAuthorityError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'MintHasNoMintAuthorityError';
    }
}
/** Thrown if Incorrect mint authority has signed the instruction */
export class IncorrectMintAuthorityError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectMintAuthorityError';
    }
}
/** Thrown if Incorrect mint authority has signed the instruction */
export class IncorrectUpdateAuthorityError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'IncorrectUpdateAuthorityError';
    }
}
/** Thrown if Token metadata has no update authority */
export class ImmutableMetadataError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'ImmutableMetadataError';
    }
}
/** Thrown if Key not found in metadata account */
export class KeyNotFoundError extends TokenMetadataError {
    constructor() {
        super(...arguments);
        this.name = 'KeyNotFoundError';
    }
}
//# sourceMappingURL=errors.js.map