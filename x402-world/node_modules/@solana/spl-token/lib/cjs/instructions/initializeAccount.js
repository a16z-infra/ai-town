"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAccountInstructionData = void 0;
exports.createInitializeAccountInstruction = createInitializeAccountInstruction;
exports.decodeInitializeAccountInstruction = decodeInitializeAccountInstruction;
exports.decodeInitializeAccountInstructionUnchecked = decodeInitializeAccountInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.initializeAccountInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction')]);
/**
 * Construct an InitializeAccount instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     Owner of the new account
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeAccountInstruction(account, mint, owner, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(exports.initializeAccountInstructionData.span);
    exports.initializeAccountInstructionData.encode({ instruction: types_js_1.TokenInstruction.InitializeAccount }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeAccountInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeAccountInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, mint, owner, rent }, data, } = decodeInitializeAccountInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeAccount)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !mint || !owner || !rent)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            rent,
        },
        data,
    };
}
/**
 * Decode an InitializeAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeAccountInstructionUnchecked({ programId, keys: [account, mint, owner, rent], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            rent,
        },
        data: exports.initializeAccountInstructionData.decode(data),
    };
}
//# sourceMappingURL=initializeAccount.js.map