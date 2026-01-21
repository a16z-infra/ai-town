import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { TokenInstruction } from './types.js';
/** The struct that represents the instruction data as it is read by the program */
export const initializeImmutableOwnerInstructionData = struct([
    u8('instruction'),
]);
/**
 * Construct an InitializeImmutableOwner instruction
 *
 * @param account           Immutable Owner Account
 * @param programId         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeImmutableOwnerInstruction(account, programId) {
    const keys = [{ pubkey: account, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(initializeImmutableOwnerInstructionData.span);
    initializeImmutableOwnerInstructionData.encode({
        instruction: TokenInstruction.InitializeImmutableOwner,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeImmutableOwner instruction and validate it
 *
 * @param instruction InitializeImmutableOwner instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeImmutableOwnerInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeImmutableOwnerInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account }, data, } = decodeInitializeImmutableOwnerInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeImmutableOwner)
        throw new TokenInvalidInstructionTypeError();
    if (!account)
        throw new TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            account,
        },
        data,
    };
}
/**
 * Decode an InitializeImmutableOwner instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeImmutableOwnerInstructionUnchecked({ programId, keys: [account], data, }) {
    const { instruction } = initializeImmutableOwnerInstructionData.decode(data);
    return {
        programId,
        keys: {
            account: account,
        },
        data: {
            instruction,
        },
    };
}
//# sourceMappingURL=initializeImmutableOwner.js.map