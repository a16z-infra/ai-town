"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReallocateInstruction = createReallocateInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const internal_js_1 = require("./internal.js");
const types_js_1 = require("./types.js");
/**
 * Construct a Reallocate instruction
 *
 * @param account        Address of the token account
 * @param payer          Address paying for the reallocation
 * @param extensionTypes Extensions to reallocate for
 * @param owner          Owner of the account
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createReallocateInstruction(account, payer, extensionTypes, owner, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const baseKeys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
    ];
    const keys = (0, internal_js_1.addSigners)(baseKeys, owner, multiSigners);
    const reallocateInstructionData = (0, buffer_layout_1.struct)([
        (0, buffer_layout_1.u8)('instruction'),
        (0, buffer_layout_1.seq)((0, buffer_layout_1.u16)(), extensionTypes.length, 'extensionTypes'),
    ]);
    const data = Buffer.alloc(reallocateInstructionData.span);
    reallocateInstructionData.encode({ instruction: types_js_1.TokenInstruction.Reallocate, extensionTypes }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=reallocate.js.map