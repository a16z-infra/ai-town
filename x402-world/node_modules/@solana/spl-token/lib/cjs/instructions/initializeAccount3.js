"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAccount3InstructionData = void 0;
exports.createInitializeAccount3Instruction = createInitializeAccount3Instruction;
exports.decodeInitializeAccount3Instruction = decodeInitializeAccount3Instruction;
exports.decodeInitializeAccount3InstructionUnchecked = decodeInitializeAccount3InstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
exports.initializeAccount3InstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_utils_1.publicKey)('owner'),
]);
/**
 * Construct an InitializeAccount3 instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     New account's owner/multisignature
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeAccount3Instruction(account, mint, owner, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(exports.initializeAccount3InstructionData.span);
    exports.initializeAccount3InstructionData.encode({ instruction: types_js_1.TokenInstruction.InitializeAccount3, owner }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeAccount3 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeAccount3Instruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeAccount3InstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, mint }, data, } = decodeInitializeAccount3InstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeAccount3)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !mint)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
        },
        data,
    };
}
/**
 * Decode an InitializeAccount3 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeAccount3InstructionUnchecked({ programId, keys: [account, mint], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
        },
        data: exports.initializeAccount3InstructionData.decode(data),
    };
}
//# sourceMappingURL=initializeAccount3.js.map