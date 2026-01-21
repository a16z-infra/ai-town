import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';
export var CpiGuardInstruction;
(function (CpiGuardInstruction) {
    CpiGuardInstruction[CpiGuardInstruction["Enable"] = 0] = "Enable";
    CpiGuardInstruction[CpiGuardInstruction["Disable"] = 1] = "Disable";
})(CpiGuardInstruction || (CpiGuardInstruction = {}));
/** TODO: docs */
export const cpiGuardInstructionData = struct([u8('instruction'), u8('cpiGuardInstruction')]);
/**
 * Construct an EnableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createEnableCpiGuardInstruction(account, authority, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    return createCpiGuardInstruction(CpiGuardInstruction.Enable, account, authority, multiSigners, programId);
}
/**
 * Construct a DisableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createDisableCpiGuardInstruction(account, authority, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    return createCpiGuardInstruction(CpiGuardInstruction.Disable, account, authority, multiSigners, programId);
}
function createCpiGuardInstruction(cpiGuardInstruction, account, authority, multiSigners, programId) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: account, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(cpiGuardInstructionData.span);
    cpiGuardInstructionData.encode({
        instruction: TokenInstruction.CpiGuardExtension,
        cpiGuardInstruction,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map