"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeNonTransferableMintInstructionData = void 0;
exports.createInitializeNonTransferableMintInstruction = createInitializeNonTransferableMintInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** The struct that represents the instruction data as it is read by the program */
exports.initializeNonTransferableMintInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
]);
/**
 * Construct an InitializeNonTransferableMint instruction
 *
 * @param mint           Mint Account to make non-transferable
 * @param programId         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeNonTransferableMintInstruction(mint, programId) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializeNonTransferableMintInstructionData.span);
    exports.initializeNonTransferableMintInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InitializeNonTransferableMint,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=initializeNonTransferableMint.js.map