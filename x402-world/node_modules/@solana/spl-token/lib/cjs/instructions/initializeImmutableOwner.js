"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeImmutableOwnerInstructionData = void 0;
exports.createInitializeImmutableOwnerInstruction = createInitializeImmutableOwnerInstruction;
exports.decodeInitializeImmutableOwnerInstruction = decodeInitializeImmutableOwnerInstruction;
exports.decodeInitializeImmutableOwnerInstructionUnchecked = decodeInitializeImmutableOwnerInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** The struct that represents the instruction data as it is read by the program */
exports.initializeImmutableOwnerInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
]);
/**
 * Construct an InitializeImmutableOwner instruction
 *
 * @param account           Immutable Owner Account
 * @param programId         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeImmutableOwnerInstruction(account, programId) {
    const keys = [{ pubkey: account, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializeImmutableOwnerInstructionData.span);
    exports.initializeImmutableOwnerInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InitializeImmutableOwner,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeImmutableOwner instruction and validate it
 *
 * @param instruction InitializeImmutableOwner instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeImmutableOwnerInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeImmutableOwnerInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account }, data, } = decodeInitializeImmutableOwnerInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeImmutableOwner)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            account,
        },
        data,
    };
}
/**
 * Decode an InitializeImmutableOwner instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeImmutableOwnerInstructionUnchecked({ programId, keys: [account], data, }) {
    const { instruction } = exports.initializeImmutableOwnerInstructionData.decode(data);
    return {
        programId,
        keys: {
            account: account,
        },
        data: {
            instruction,
        },
    };
}
//# sourceMappingURL=initializeImmutableOwner.js.map