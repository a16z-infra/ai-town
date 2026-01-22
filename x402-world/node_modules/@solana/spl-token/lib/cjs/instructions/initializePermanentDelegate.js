"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePermanentDelegateInstructionData = void 0;
exports.createInitializePermanentDelegateInstruction = createInitializePermanentDelegateInstruction;
exports.decodeInitializePermanentDelegateInstruction = decodeInitializePermanentDelegateInstruction;
exports.decodeInitializePermanentDelegateInstructionUnchecked = decodeInitializePermanentDelegateInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const web3_js_2 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.initializePermanentDelegateInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_utils_1.publicKey)('delegate'),
]);
/**
 * Construct an InitializePermanentDelegate instruction
 *
 * @param mint               Token mint account
 * @param permanentDelegate  Authority that may sign for `Transfer`s and `Burn`s on any account
 * @param programId          SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializePermanentDelegateInstruction(mint, permanentDelegate, programId) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializePermanentDelegateInstructionData.span);
    exports.initializePermanentDelegateInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InitializePermanentDelegate,
        delegate: permanentDelegate || new web3_js_1.PublicKey(0),
    }, data);
    return new web3_js_2.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializePermanentDelegate instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializePermanentDelegateInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializePermanentDelegateInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeInitializePermanentDelegateInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializePermanentDelegate)
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
 * Decode an InitializePermanentDelegate instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializePermanentDelegateInstructionUnchecked({ programId, keys: [mint], data, }) {
    const { instruction, delegate } = exports.initializePermanentDelegateInstructionData.decode(data);
    return {
        programId,
        keys: {
            mint,
        },
        data: {
            instruction,
            delegate,
        },
    };
}
//# sourceMappingURL=initializePermanentDelegate.js.map