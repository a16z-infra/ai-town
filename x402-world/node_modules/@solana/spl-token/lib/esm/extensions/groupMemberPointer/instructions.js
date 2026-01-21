import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, programSupportsExtensions } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { TokenInstruction } from '../../instructions/types.js';
import { addSigners } from '../../instructions/internal.js';
export var GroupMemberPointerInstruction;
(function (GroupMemberPointerInstruction) {
    GroupMemberPointerInstruction[GroupMemberPointerInstruction["Initialize"] = 0] = "Initialize";
    GroupMemberPointerInstruction[GroupMemberPointerInstruction["Update"] = 1] = "Update";
})(GroupMemberPointerInstruction || (GroupMemberPointerInstruction = {}));
export const initializeGroupMemberPointerData = struct([
    // prettier-ignore
    u8('instruction'),
    u8('groupMemberPointerInstruction'),
    publicKey('authority'),
    publicKey('memberAddress'),
]);
/**
 * Construct an Initialize GroupMemberPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the member address
 * @param memberAddress   Optional Account address that holds the member
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeGroupMemberPointerInstruction(mint, authority, memberAddress, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(initializeGroupMemberPointerData.span);
    initializeGroupMemberPointerData.encode({
        instruction: TokenInstruction.GroupMemberPointerExtension,
        groupMemberPointerInstruction: GroupMemberPointerInstruction.Initialize,
        authority: authority ?? PublicKey.default,
        memberAddress: memberAddress ?? PublicKey.default,
    }, data);
    return new TransactionInstruction({ keys, programId, data: data });
}
export const updateGroupMemberPointerData = struct([
    // prettier-ignore
    u8('instruction'),
    u8('groupMemberPointerInstruction'),
    publicKey('memberAddress'),
]);
export function createUpdateGroupMemberPointerInstruction(mint, authority, memberAddress, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(updateGroupMemberPointerData.span);
    updateGroupMemberPointerData.encode({
        instruction: TokenInstruction.GroupMemberPointerExtension,
        groupMemberPointerInstruction: GroupMemberPointerInstruction.Update,
        memberAddress: memberAddress ?? PublicKey.default,
    }, data);
    return new TransactionInstruction({ keys, programId, data: data });
}
//# sourceMappingURL=instructions.js.map