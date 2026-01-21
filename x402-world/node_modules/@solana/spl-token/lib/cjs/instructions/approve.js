"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveInstructionData = void 0;
exports.createApproveInstruction = createApproveInstruction;
exports.decodeApproveInstruction = decodeApproveInstruction;
exports.decodeApproveInstructionUnchecked = decodeApproveInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const internal_js_1 = require("./internal.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.approveInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_utils_1.u64)('amount')]);
/**
 * Construct an Approve instruction
 *
 * @param account      Account to set the delegate for
 * @param delegate     Account authorized to transfer tokens from the account
 * @param owner        Owner of the account
 * @param amount       Maximum number of tokens the delegate may transfer
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createApproveInstruction(account, delegate, owner, amount, multiSigners = [], programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = (0, internal_js_1.addSigners)([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: delegate, isSigner: false, isWritable: false },
    ], owner, multiSigners);
    const data = Buffer.alloc(exports.approveInstructionData.span);
    exports.approveInstructionData.encode({
        instruction: types_js_1.TokenInstruction.Approve,
        amount: BigInt(amount),
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an Approve instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeApproveInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.approveInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, delegate, owner, multiSigners }, data, } = decodeApproveInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.Approve)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !delegate || !owner)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            delegate,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode an Approve instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeApproveInstructionUnchecked({ programId, keys: [account, delegate, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            delegate,
            owner,
            multiSigners,
        },
        data: exports.approveInstructionData.decode(data),
    };
}
//# sourceMappingURL=approve.js.map