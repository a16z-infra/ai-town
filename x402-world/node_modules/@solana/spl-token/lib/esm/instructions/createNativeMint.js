import { struct, u8 } from '@solana/buffer-layout';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { NATIVE_MINT_2022, programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../constants.js';
import { TokenUnsupportedInstructionError } from '../errors.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const createNativeMintInstructionData = struct([u8('instruction')]);
/**
 * Construct a CreateNativeMint instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     Owner of the new account
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createCreateNativeMintInstruction(payer, nativeMintId = NATIVE_MINT_2022, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: nativeMintId, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(createNativeMintInstructionData.span);
    createNativeMintInstructionData.encode({ instruction: TokenInstruction.CreateNativeMint }, data);
    return new TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=createNativeMint.js.map