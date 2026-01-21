"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthorityInstructionData = exports.AuthorityType = void 0;
exports.createSetAuthorityInstruction = createSetAuthorityInstruction;
exports.decodeSetAuthorityInstruction = decodeSetAuthorityInstruction;
exports.decodeSetAuthorityInstructionUnchecked = decodeSetAuthorityInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const internal_js_1 = require("./internal.js");
const types_js_1 = require("./types.js");
const serialization_js_1 = require("../serialization.js");
/** Authority types defined by the program */
var AuthorityType;
(function (AuthorityType) {
    AuthorityType[AuthorityType["MintTokens"] = 0] = "MintTokens";
    AuthorityType[AuthorityType["FreezeAccount"] = 1] = "FreezeAccount";
    AuthorityType[AuthorityType["AccountOwner"] = 2] = "AccountOwner";
    AuthorityType[AuthorityType["CloseAccount"] = 3] = "CloseAccount";
    AuthorityType[AuthorityType["TransferFeeConfig"] = 4] = "TransferFeeConfig";
    AuthorityType[AuthorityType["WithheldWithdraw"] = 5] = "WithheldWithdraw";
    AuthorityType[AuthorityType["CloseMint"] = 6] = "CloseMint";
    AuthorityType[AuthorityType["InterestRate"] = 7] = "InterestRate";
    AuthorityType[AuthorityType["PermanentDelegate"] = 8] = "PermanentDelegate";
    AuthorityType[AuthorityType["ConfidentialTransferMint"] = 9] = "ConfidentialTransferMint";
    AuthorityType[AuthorityType["TransferHookProgramId"] = 10] = "TransferHookProgramId";
    AuthorityType[AuthorityType["ConfidentialTransferFeeConfig"] = 11] = "ConfidentialTransferFeeConfig";
    AuthorityType[AuthorityType["MetadataPointer"] = 12] = "MetadataPointer";
    AuthorityType[AuthorityType["GroupPointer"] = 13] = "GroupPointer";
    AuthorityType[AuthorityType["GroupMemberPointer"] = 14] = "GroupMemberPointer";
    AuthorityType[AuthorityType["ScaledUiAmountConfig"] = 15] = "ScaledUiAmountConfig";
    AuthorityType[AuthorityType["PausableConfig"] = 16] = "PausableConfig";
})(AuthorityType || (exports.AuthorityType = AuthorityType = {}));
/** TODO: docs */
exports.setAuthorityInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('authorityType'),
    new serialization_js_1.COptionPublicKeyLayout('newAuthority'),
]);
/**
 * Construct a SetAuthority instruction
 *
 * @param account          Address of the token account
 * @param currentAuthority Current authority of the specified type
 * @param authorityType    Type of authority to set
 * @param newAuthority     New authority of the account
 * @param multiSigners     Signing accounts if `currentAuthority` is a multisig
 * @param programId        SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createSetAuthorityInstruction(account, currentAuthority, authorityType, newAuthority, multiSigners = [], programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = (0, internal_js_1.addSigners)([{ pubkey: account, isSigner: false, isWritable: true }], currentAuthority, multiSigners);
    const data = Buffer.alloc(35); // worst-case
    exports.setAuthorityInstructionData.encode({
        instruction: types_js_1.TokenInstruction.SetAuthority,
        authorityType,
        newAuthority,
    }, data);
    return new web3_js_1.TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, exports.setAuthorityInstructionData.getSpan(data)),
    });
}
/**
 * Decode a SetAuthority instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeSetAuthorityInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.setAuthorityInstructionData.getSpan(instruction.data))
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account, currentAuthority, multiSigners }, data, } = decodeSetAuthorityInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.SetAuthority)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account || !currentAuthority)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            currentAuthority,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a SetAuthority instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeSetAuthorityInstructionUnchecked({ programId, keys: [account, currentAuthority, ...multiSigners], data, }) {
    const { instruction, authorityType, newAuthority } = exports.setAuthorityInstructionData.decode(data);
    return {
        programId,
        keys: {
            account,
            currentAuthority,
            multiSigners,
        },
        data: {
            instruction,
            authorityType,
            newAuthority,
        },
    };
}
//# sourceMappingURL=setAuthority.js.map