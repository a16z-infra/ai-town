"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMint2InstructionData = void 0;
exports.createInitializeMint2Instruction = createInitializeMint2Instruction;
exports.decodeInitializeMint2Instruction = decodeInitializeMint2Instruction;
exports.decodeInitializeMint2InstructionUnchecked = decodeInitializeMint2InstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
const serialization_js_1 = require("../serialization.js");
/** TODO: docs */
exports.initializeMint2InstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('decimals'),
    (0, buffer_layout_utils_1.publicKey)('mintAuthority'),
    new serialization_js_1.COptionPublicKeyLayout('freezeAuthority'),
]);
/**
 * Construct an InitializeMint2 instruction
 *
 * @param mint            Token mint account
 * @param decimals        Number of decimals in token account amounts
 * @param mintAuthority   Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeMint2Instruction(mint, decimals, mintAuthority, freezeAuthority, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(67); // worst-case size
    exports.initializeMint2InstructionData.encode({
        instruction: types_js_1.TokenInstruction.InitializeMint2,
        decimals,
        mintAuthority,
        freezeAuthority,
    }, data);
    return new web3_js_1.TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, exports.initializeMint2InstructionData.getSpan(data)),
    });
}
/**
 * Decode an InitializeMint2 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeMint2Instruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeMint2InstructionData.getSpan(instruction.data))
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeInitializeMint2InstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeMint2)
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
 * Decode an InitializeMint2 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeMint2InstructionUnchecked({ programId, keys: [mint], data, }) {
    const { instruction, decimals, mintAuthority, freezeAuthority } = exports.initializeMint2InstructionData.decode(data);
    return {
        programId,
        keys: {
            mint,
        },
        data: {
            instruction,
            decimals,
            mintAuthority,
            freezeAuthority,
        },
    };
}
//# sourceMappingURL=initializeMint2.js.map