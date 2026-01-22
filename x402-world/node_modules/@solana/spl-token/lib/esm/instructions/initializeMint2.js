import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { TokenInstruction } from './types.js';
import { COptionPublicKeyLayout } from '../serialization.js';
/** TODO: docs */
export const initializeMint2InstructionData = struct([
    u8('instruction'),
    u8('decimals'),
    publicKey('mintAuthority'),
    new COptionPublicKeyLayout('freezeAuthority'),
]);
/**
 * Construct an InitializeMint2 instruction
 *
 * @param mint            Token mint account
 * @param decimals        Number of decimals in token account amounts
 * @param mintAuthority   Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeMint2Instruction(mint, decimals, mintAuthority, freezeAuthority, programId = TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(67); // worst-case size
    initializeMint2InstructionData.encode({
        instruction: TokenInstruction.InitializeMint2,
        decimals,
        mintAuthority,
        freezeAuthority,
    }, data);
    return new TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, initializeMint2InstructionData.getSpan(data)),
    });
}
/**
 * Decode an InitializeMint2 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeMint2Instruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeMint2InstructionData.getSpan(instruction.data))
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeInitializeMint2InstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeMint2)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}
/**
 * Decode an InitializeMint2 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeMint2InstructionUnchecked({ programId, keys: [mint], data, }) {
    const { instruction, decimals, mintAuthority, freezeAuthority } = initializeMint2InstructionData.decode(data);
    return {
        programId,
        keys: {
            mint,
        },
        data: {
            instruction,
            decimals,
            mintAuthority,
            freezeAuthority,
        },
    };
}
//# sourceMappingURL=initializeMint2.js.map