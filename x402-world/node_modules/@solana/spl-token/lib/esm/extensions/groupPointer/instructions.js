import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, programSupportsExtensions } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { TokenInstruction } from '../../instructions/types.js';
import { addSigners } from '../../instructions/internal.js';
export var GroupPointerInstruction;
(function (GroupPointerInstruction) {
    GroupPointerInstruction[GroupPointerInstruction["Initialize"] = 0] = "Initialize";
    GroupPointerInstruction[GroupPointerInstruction["Update"] = 1] = "Update";
})(GroupPointerInstruction || (GroupPointerInstruction = {}));
export const initializeGroupPointerData = struct([
    // prettier-ignore
    u8('instruction'),
    u8('groupPointerInstruction'),
    publicKey('authority'),
    publicKey('groupAddress'),
]);
/**
 * Construct an Initialize GroupPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the group address
 * @param groupAddress    Optional Account address that holds the group
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeGroupPointerInstruction(mint, authority, groupAddress, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(initializeGroupPointerData.span);
    initializeGroupPointerData.encode({
        instruction: TokenInstruction.GroupPointerExtension,
        groupPointerInstruction: GroupPointerInstruction.Initialize,
        authority: authority ?? PublicKey.default,
        groupAddress: groupAddress ?? PublicKey.default,
    }, data);
    return new TransactionInstruction({ keys, programId, data: data });
}
export const updateGroupPointerData = struct([
    // prettier-ignore
    u8('instruction'),
    u8('groupPointerInstruction'),
    publicKey('groupAddress'),
]);
export function createUpdateGroupPointerInstruction(mint, authority, groupAddress, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(updateGroupPointerData.span);
    updateGroupPointerData.encode({
        instruction: TokenInstruction.GroupPointerExtension,
        groupPointerInstruction: GroupPointerInstruction.Update,
        groupAddress: groupAddress ?? PublicKey.default,
    }, data);
    return new TransactionInstruction({ keys, programId, data: data });
}
//# sourceMappingURL=instructions.js.map