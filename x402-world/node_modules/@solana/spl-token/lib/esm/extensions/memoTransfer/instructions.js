import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';
export var MemoTransferInstruction;
(function (MemoTransferInstruction) {
    MemoTransferInstruction[MemoTransferInstruction["Enable"] = 0] = "Enable";
    MemoTransferInstruction[MemoTransferInstruction["Disable"] = 1] = "Disable";
})(MemoTransferInstruction || (MemoTransferInstruction = {}));
/** TODO: docs */
export const memoTransferInstructionData = struct([
    u8('instruction'),
    u8('memoTransferInstruction'),
]);
/**
 * Construct an EnableRequiredMemoTransfers instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createEnableRequiredMemoTransfersInstruction(account, authority, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    return createMemoTransferInstruction(MemoTransferInstruction.Enable, account, authority, multiSigners, programId);
}
/**
 * Construct a DisableMemoTransfer instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createDisableRequiredMemoTransfersInstruction(account, authority, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    return createMemoTransferInstruction(MemoTransferInstruction.Disable, account, authority, multiSigners, programId);
}
function createMemoTransferInstruction(memoTransferInstruction, account, authority, multiSigners, programId) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: account, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(memoTransferInstructionData.span);
    memoTransferInstructionData.encode({
        instruction: TokenInstruction.MemoTransferExtension,
        memoTransferInstruction,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map