import { struct, u8, f64 } from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';
import { TokenInstruction } from '../../instructions/types.js';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
export var ScaledUiAmountInstruction;
(function (ScaledUiAmountInstruction) {
    ScaledUiAmountInstruction[ScaledUiAmountInstruction["Initialize"] = 0] = "Initialize";
    ScaledUiAmountInstruction[ScaledUiAmountInstruction["UpdateMultiplier"] = 1] = "UpdateMultiplier";
})(ScaledUiAmountInstruction || (ScaledUiAmountInstruction = {}));
export const initializeScaledUiAmountConfigInstructionData = struct([
    u8('instruction'),
    u8('scaledUiAmountInstruction'),
    publicKey('authority'),
    f64('multiplier'),
]);
/**
 * Construct an InitializeScaledUiAmountConfig instruction
 *
 * @param mint         Token mint account
 * @param authority    Optional authority that can update the multipliers
 * @param signers      The signer account(s)
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeScaledUiAmountConfigInstruction(mint, authority, multiplier, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(initializeScaledUiAmountConfigInstructionData.span);
    initializeScaledUiAmountConfigInstructionData.encode({
        instruction: TokenInstruction.ScaledUiAmountExtension,
        scaledUiAmountInstruction: ScaledUiAmountInstruction.Initialize,
        authority: authority ?? PublicKey.default,
        multiplier: multiplier,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
export const updateMultiplierData = struct([
    u8('instruction'),
    u8('scaledUiAmountInstruction'),
    f64('multiplier'),
    u64('effectiveTimestamp'),
]);
/**
 * Construct an UpdateMultiplierData instruction
 *
 * @param mint                  Token mint account
 * @param authority             Optional authority that can update the multipliers
 * @param multiplier            New multiplier
 * @param effectiveTimestamp    Effective time stamp for the new multiplier
 * @param multiSigners          Signing accounts if `owner` is a multisig
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createUpdateMultiplierDataInstruction(mint, authority, multiplier, effectiveTimestamp, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(updateMultiplierData.span);
    updateMultiplierData.encode({
        instruction: TokenInstruction.ScaledUiAmountExtension,
        scaledUiAmountInstruction: ScaledUiAmountInstruction.UpdateMultiplier,
        multiplier,
        effectiveTimestamp,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map