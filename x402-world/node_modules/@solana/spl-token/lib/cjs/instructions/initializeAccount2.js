"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAccount2InstructionData = void 0;
exports.createInitializeAccount2Instruction = createInitializeAccount2Instruction;
exports.decodeInitializeAccount2Instruction = decodeInitializeAccount2Instruction;
exports.decodeInitializeAccount2InstructionUnchecked = decodeInitializeAccount2InstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
exports.initializeAccount2InstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_utils_1.publicKey)('owner'),
]);
/**
 * Construct an InitializeAccount2 instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     New account's owner/multisignature
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeAccount2Instruction(account, mint, owner, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(exports.initializeAccount2InstructionData.span);
    exports.initializeAccount2InstructionData.encode({ instruction: types_js_1.TokenInstruction.InitializeAccount2, owner }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeAccount2 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeAccount2Instruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeAccount2InstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, mint, rent }, data, } = decodeInitializeAccount2InstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeAccount2)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !mint || !rent)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            rent,
        },
        data,
    };
}
/**
 * Decode an InitializeAccount2 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeAccount2InstructionUnchecked({ programId, keys: [account, mint, rent], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            rent,
        },
        data: exports.initializeAccount2InstructionData.decode(data),
    };
}
//# sourceMappingURL=initializeAccount2.js.map