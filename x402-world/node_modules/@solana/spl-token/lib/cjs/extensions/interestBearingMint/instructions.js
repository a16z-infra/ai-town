"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interestBearingMintUpdateRateInstructionData = exports.interestBearingMintInitializeInstructionData = exports.InterestBearingMintInstruction = void 0;
exports.createInitializeInterestBearingMintInstruction = createInitializeInterestBearingMintInstruction;
exports.createUpdateRateInterestBearingMintInstruction = createUpdateRateInterestBearingMintInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const internal_js_1 = require("../../instructions/internal.js");
const types_js_1 = require("../../instructions/types.js");
var InterestBearingMintInstruction;
(function (InterestBearingMintInstruction) {
    InterestBearingMintInstruction[InterestBearingMintInstruction["Initialize"] = 0] = "Initialize";
    InterestBearingMintInstruction[InterestBearingMintInstruction["UpdateRate"] = 1] = "UpdateRate";
})(InterestBearingMintInstruction || (exports.InterestBearingMintInstruction = InterestBearingMintInstruction = {}));
exports.interestBearingMintInitializeInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('interestBearingMintInstruction'),
    // TODO: Make this an optional public key
    (0, buffer_layout_utils_1.publicKey)('rateAuthority'),
    (0, buffer_layout_1.s16)('rate'),
]);
exports.interestBearingMintUpdateRateInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('interestBearingMintInstruction'),
    (0, buffer_layout_1.s16)('rate'),
]);
/**
 * Construct an InitializeInterestBearingMint instruction
 *
 * @param mint           Mint to initialize
 * @param rateAuthority  The public key for the account that can update the rate
 * @param rate           The initial interest rate
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeInterestBearingMintInstruction(mint, rateAuthority, rate, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.interestBearingMintInitializeInstructionData.span);
    exports.interestBearingMintInitializeInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InterestBearingMintExtension,
        interestBearingMintInstruction: InterestBearingMintInstruction.Initialize,
        rateAuthority,
        rate,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Construct an UpdateRateInterestBearingMint instruction
 *
 * @param mint           Mint to initialize
 * @param rateAuthority  The public key for the account that can update the rate
 * @param rate           The updated interest rate
 * @param multiSigners   Signing accounts if `rateAuthority` is a multisig
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createUpdateRateInterestBearingMintInstruction(mint, rateAuthority, rate, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    const keys = (0, internal_js_1.addSigners)([
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: rateAuthority, isSigner: !multiSigners.length, isWritable: false },
    ], rateAuthority, multiSigners);
    const data = Buffer.alloc(exports.interestBearingMintUpdateRateInstructionData.span);
    exports.interestBearingMintUpdateRateInstructionData.encode({
        instruction: types_js_1.TokenInstruction.InterestBearingMintExtension,
        interestBearingMintInstruction: InterestBearingMintInstruction.UpdateRate,
        rate,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map