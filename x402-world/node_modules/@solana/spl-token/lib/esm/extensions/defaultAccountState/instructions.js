import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';
export var DefaultAccountStateInstruction;
(function (DefaultAccountStateInstruction) {
    DefaultAccountStateInstruction[DefaultAccountStateInstruction["Initialize"] = 0] = "Initialize";
    DefaultAccountStateInstruction[DefaultAccountStateInstruction["Update"] = 1] = "Update";
})(DefaultAccountStateInstruction || (DefaultAccountStateInstruction = {}));
/** TODO: docs */
export const defaultAccountStateInstructionData = struct([
    u8('instruction'),
    u8('defaultAccountStateInstruction'),
    u8('accountState'),
]);
/**
 * Construct an InitializeDefaultAccountState instruction
 *
 * @param mint         Mint to initialize
 * @param accountState Default account state to set on all new accounts
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeDefaultAccountStateInstruction(mint, accountState, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(defaultAccountStateInstructionData.span);
    defaultAccountStateInstructionData.encode({
        instruction: TokenInstruction.DefaultAccountStateExtension,
        defaultAccountStateInstruction: DefaultAccountStateInstruction.Initialize,
        accountState,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Construct an UpdateDefaultAccountState instruction
 *
 * @param mint         Mint to update
 * @param accountState    Default account state to set on all accounts
 * @param freezeAuthority       The mint's freeze authority
 * @param signers         The signer account(s) for a multisig
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createUpdateDefaultAccountStateInstruction(mint, accountState, freezeAuthority, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], freezeAuthority, multiSigners);
    const data = Buffer.alloc(defaultAccountStateInstructionData.span);
    defaultAccountStateInstructionData.encode({
        instruction: TokenInstruction.DefaultAccountStateExtension,
        defaultAccountStateInstruction: DefaultAccountStateInstruction.Update,
        accountState,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map