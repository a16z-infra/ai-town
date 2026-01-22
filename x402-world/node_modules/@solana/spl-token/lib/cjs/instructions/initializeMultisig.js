"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMultisigInstructionData = void 0;
exports.createInitializeMultisigInstruction = createInitializeMultisigInstruction;
exports.decodeInitializeMultisigInstruction = decodeInitializeMultisigInstruction;
exports.decodeInitializeMultisigInstructionUnchecked = decodeInitializeMultisigInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.initializeMultisigInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('m'),
]);
/**
 * Construct an InitializeMultisig instruction
 *
 * @param account   Multisig account
 * @param signers   Full set of signers
 * @param m         Number of required signatures
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeMultisigInstruction(account, signers, m, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    for (const signer of signers) {
        keys.push({
            pubkey: signer instanceof web3_js_1.PublicKey ? signer : signer.publicKey,
            isSigner: false,
            isWritable: false,
        });
    }
    const data = Buffer.alloc(exports.initializeMultisigInstructionData.span);
    exports.initializeMultisigInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InitializeMultisig,
        m,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeMultisig instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeInitializeMultisigInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.initializeMultisigInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, rent, signers }, data, } = decodeInitializeMultisigInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.InitializeMultisig)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !rent || !signers.length)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            rent,
            signers,
        },
        data,
    };
}
/**
 * Decode an InitializeMultisig instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeInitializeMultisigInstructionUnchecked({ programId, keys: [account, rent, ...signers], data, }) {
    return {
        programId,
        keys: {
            account,
            rent,
            signers,
        },
        data: exports.initializeMultisigInstructionData.decode(data),
    };
}
//# sourceMappingURL=initializeMultisig.js.map