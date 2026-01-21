"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.thawAccountInstructionData = void 0;
exports.createThawAccountInstruction = createThawAccountInstruction;
exports.decodeThawAccountInstruction = decodeThawAccountInstruction;
exports.decodeThawAccountInstructionUnchecked = decodeThawAccountInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const internal_js_1 = require("./internal.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.thawAccountInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction')]);
/**
 * Construct a ThawAccount instruction
 *
 * @param account      Account to thaw
 * @param mint         Mint account
 * @param authority    Mint freeze authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createThawAccountInstruction(account, mint, authority, multiSigners = [], programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = (0, internal_js_1.addSigners)([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
    ], authority, multiSigners);
    const data = Buffer.alloc(exports.thawAccountInstructionData.span);
    exports.thawAccountInstructionData.encode({ instruction: types_js_1.TokenInstruction.ThawAccount }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a ThawAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeThawAccountInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.thawAccountInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, mint, authority, multiSigners }, data, } = decodeThawAccountInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.ThawAccount)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !mint || !authority)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            authority,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a ThawAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeThawAccountInstructionUnchecked({ programId, keys: [account, mint, authority, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            authority,
            multiSigners,
        },
        data: exports.thawAccountInstructionData.decode(data),
    };
}
//# sourceMappingURL=thawAccount.js.map