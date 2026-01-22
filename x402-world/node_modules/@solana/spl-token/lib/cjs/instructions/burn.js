"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.burnInstructionData = void 0;
exports.createBurnInstruction = createBurnInstruction;
exports.decodeBurnInstruction = decodeBurnInstruction;
exports.decodeBurnInstructionUnchecked = decodeBurnInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const internal_js_1 = require("./internal.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.burnInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_utils_1.u64)('amount')]);
/**
 * Construct a Burn instruction
 *
 * @param account      Account to burn tokens from
 * @param mint         Mint for the account
 * @param owner        Owner of the account
 * @param amount       Number of tokens to burn
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createBurnInstruction(account, mint, owner, amount, multiSigners = [], programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = (0, internal_js_1.addSigners)([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: true },
    ], owner, multiSigners);
    const data = Buffer.alloc(exports.burnInstructionData.span);
    exports.burnInstructionData.encode({
        instruction: types_js_1.TokenInstruction.Burn,
        amount: BigInt(amount),
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a Burn instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeBurnInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.burnInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, mint, owner, multiSigners }, data, } = decodeBurnInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.Burn)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !mint || !owner)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a Burn instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeBurnInstructionUnchecked({ programId, keys: [account, mint, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            multiSigners,
        },
        data: exports.burnInstructionData.decode(data),
    };
}
//# sourceMappingURL=burn.js.map