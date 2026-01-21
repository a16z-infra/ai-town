import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
import { COptionPublicKeyLayout } from '../serialization.js';
/** Authority types defined by the program */
export var AuthorityType;
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
})(AuthorityType || (AuthorityType = {}));
/** TODO: docs */
export const setAuthorityInstructionData = struct([
    u8('instruction'),
    u8('authorityType'),
    new COptionPublicKeyLayout('newAuthority'),
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
export function createSetAuthorityInstruction(account, currentAuthority, authorityType, newAuthority, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([{ pubkey: account, isSigner: false, isWritable: true }], currentAuthority, multiSigners);
    const data = Buffer.alloc(35); // worst-case
    setAuthorityInstructionData.encode({
        instruction: TokenInstruction.SetAuthority,
        authorityType,
        newAuthority,
    }, data);
    return new TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, setAuthorityInstructionData.getSpan(data)),
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
export function decodeSetAuthorityInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== setAuthorityInstructionData.getSpan(instruction.data))
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, currentAuthority, multiSigners }, data, } = decodeSetAuthorityInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.SetAuthority)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !currentAuthority)
        throw new TokenInvalidInstructionKeysError();
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
export function decodeSetAuthorityInstructionUnchecked({ programId, keys: [account, currentAuthority, ...multiSigners], data, }) {
    const { instruction, authorityType, newAuthority } = setAuthorityInstructionData.decode(data);
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