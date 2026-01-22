"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNativeMintInstructionData = void 0;
exports.createCreateNativeMintInstruction = createCreateNativeMintInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.createNativeMintInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction')]);
/**
 * Construct a CreateNativeMint instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     Owner of the new account
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createCreateNativeMintInstruction(payer, nativeMintId = constants_js_1.NATIVE_MINT_2022, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: nativeMintId, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(exports.createNativeMintInstructionData.span);
    exports.createNativeMintInstructionData.encode({ instruction: types_js_1.TokenInstruction.CreateNativeMint }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=createNativeMint.js.map