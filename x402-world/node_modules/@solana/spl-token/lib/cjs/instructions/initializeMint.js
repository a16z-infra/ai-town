"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMintInstructionData = void 0;
exports.createInitializeMintInstruction = createInitializeMintInstruction;
exports.decodeInitializeMintInstruction = decodeInitializeMintInstruction;
exports.decodeInitializeMintInstructionUnchecked = decodeInitializeMintInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
const serialization_js_1 = require("../serialization.js");
/** TODO: docs */
exports.initializeMintInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('decimals'),
    (0, buffer_layout_utils_1.publicKey)('mintAuthority'),
    new serialization_js_1.COptionPublicKeyLayout('freezeAuthority'),
]);
/**
 * Construct an InitializeMint instruction
 *
 * @param mint            Token mint account
 * @param decimals        Number of decimals in token account amounts
 * @param mintAuthority   Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeMintInstruction(mint, decimals, mintAuthority, freezeAuthority, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(67); // worst-case size
    exports.initializeMintInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InitializeMint,
        decimals,
        mintAuthority,
        freezeAuthority,
    }, data);
    return new web3_js_1.TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, exports.initializeMintInstructionData.getSpan(data)),
    });
}
/**
 * Decode an InitializeMint instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeMintInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeMintInstructionData.getSpan(instruction.data))
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { mint, rent }, data, } = decodeInitializeMintInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeMint)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!mint || !rent)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            mint,
            rent,
        },
        data,
    };
}
/**
 * Decode an InitializeMint instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeMintInstructionUnchecked({ programId, keys: [mint, rent], data, }) {
    const { instruction, decimals, mintAuthority, freezeAuthority } = exports.initializeMintInstructionData.decode(data);
    return {
        programId,
        keys: {
            mint,
            rent,
        },
        data: {
            instruction,
            decimals,
            mintAuthority,
            freezeAuthority,
        },
    };
}
//# sourceMappingURL=initializeMint.js.map