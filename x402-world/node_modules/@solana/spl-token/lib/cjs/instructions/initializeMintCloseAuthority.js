"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMintCloseAuthorityInstructionData = void 0;
exports.createInitializeMintCloseAuthorityInstruction = createInitializeMintCloseAuthorityInstruction;
exports.decodeInitializeMintCloseAuthorityInstruction = decodeInitializeMintCloseAuthorityInstruction;
exports.decodeInitializeMintCloseAuthorityInstructionUnchecked = decodeInitializeMintCloseAuthorityInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
const serialization_js_1 = require("../serialization.js");
/** TODO: docs */
exports.initializeMintCloseAuthorityInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    new serialization_js_1.COptionPublicKeyLayout('closeAuthority'),
]);
/**
 * Construct an InitializeMintCloseAuthority instruction
 *
 * @param mint            Token mint account
 * @param closeAuthority  Optional authority that can close the mint
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeMintCloseAuthorityInstruction(mint, closeAuthority, programId) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(34); // worst-case size
    exports.initializeMintCloseAuthorityInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InitializeMintCloseAuthority,
        closeAuthority,
    }, data);
    return new web3_js_1.TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, exports.initializeMintCloseAuthorityInstructionData.getSpan(data)),
    });
}
/**
 * Decode an InitializeMintCloseAuthority instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeMintCloseAuthorityInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeMintCloseAuthorityInstructionData.getSpan(instruction.data))
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeInitializeMintCloseAuthorityInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeMintCloseAuthority)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!mint)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}
/**
 * Decode an InitializeMintCloseAuthority instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeMintCloseAuthorityInstructionUnchecked({ programId, keys: [mint], data, }) {
    const { instruction, closeAuthority } = exports.initializeMintCloseAuthorityInstructionData.decode(data);
    return {
        programId,
        keys: {
            mint,
        },
        data: {
            instruction,
            closeAuthority,
        },
    };
}
//# sourceMappingURL=initializeMintCloseAuthority.js.map