import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const transferInstructionData = struct([u8('instruction'), u64('amount')]);
/**
 * Construct a Transfer instruction
 *
 * @param source       Source account
 * @param destination  Destination account
 * @param owner        Owner of the source account
 * @param amount       Number of tokens to transfer
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createTransferInstruction(source, destination, owner, amount, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], owner, multiSigners);
    const data = Buffer.alloc(transferInstructionData.span);
    transferInstructionData.encode({
        instruction: TokenInstruction.Transfer,
        amount: BigInt(amount),
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a Transfer instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeTransferInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== transferInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { source, destination, owner, multiSigners }, data, } = decodeTransferInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.Transfer)
        throw new TokenInvalidInstructionTypeError();
    if (!source || !destination || !owner)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            source,
            destination,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a Transfer instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeTransferInstructionUnchecked({ programId, keys: [source, destination, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            source,
            destination,
            owner,
            multiSigners,
        },
        data: transferInstructionData.decode(data),
    };
}
//# sourceMappingURL=transfer.js.map