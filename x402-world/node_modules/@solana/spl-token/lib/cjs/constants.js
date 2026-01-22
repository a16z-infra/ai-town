"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NATIVE_MINT_2022 = exports.NATIVE_MINT = exports.ASSOCIATED_TOKEN_PROGRAM_ID = exports.TOKEN_2022_PROGRAM_ID = exports.TOKEN_PROGRAM_ID = void 0;
exports.programSupportsExtensions = programSupportsExtensions;
const web3_js_1 = require("@solana/web3.js");
/** Address of the SPL Token program */
exports.TOKEN_PROGRAM_ID = new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
/** Address of the SPL Token 2022 program */
exports.TOKEN_2022_PROGRAM_ID = new web3_js_1.PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
/** Address of the SPL Associated Token Account program */
exports.ASSOCIATED_TOKEN_PROGRAM_ID = new web3_js_1.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
/** Address of the special mint for wrapped native SOL in spl-token */
exports.NATIVE_MINT = new web3_js_1.PublicKey('So11111111111111111111111111111111111111112');
/** Address of the special mint for wrapped native SOL in spl-token-2022 */
exports.NATIVE_MINT_2022 = new web3_js_1.PublicKey('9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP');
/** Check that the token program provided is not `Tokenkeg...`, useful when using extensions */
function programSupportsExtensions(programId) {
    if (programId.equals(exports.TOKEN_PROGRAM_ID)) {
        return false;
    }
    else {
        return true;
    }
}
//# sourceMappingURL=constants.js.map