import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { TokenInstruction } from './types.js';
export const initializeAccount3InstructionData = struct([
    u8('instruction'),
    publicKey('owner'),
]);
/**
 * Construct an InitializeAccount3 instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     New account's owner/multisignature
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeAccount3Instruction(account, mint, owner, programId = TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(initializeAccount3InstructionData.span);
    initializeAccount3InstructionData.encode({ instruction: TokenInstruction.InitializeAccount3, owner }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeAccount3 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeAccount3Instruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeAccount3InstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, mint }, data, } = decodeInitializeAccount3InstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeAccount3)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !mint)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
        },
        data,
    };
}
/**
 * Decode an InitializeAccount3 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeAccount3InstructionUnchecked({ programId, keys: [account, mint], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
        },
        data: initializeAccount3InstructionData.decode(data),
    };
}
//# sourceMappingURL=initializeAccount3.js.map