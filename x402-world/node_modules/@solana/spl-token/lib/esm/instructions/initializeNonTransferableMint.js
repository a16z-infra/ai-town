import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions } from '../constants.js';
import { TokenUnsupportedInstructionError } from '../errors.js';
import { TokenInstruction } from './types.js';
/** The struct that represents the instruction data as it is read by the program */
export const initializeNonTransferableMintInstructionData = struct([
    u8('instruction'),
]);
/**
 * Construct an InitializeNonTransferableMint instruction
 *
 * @param mint           Mint Account to make non-transferable
 * @param programId         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeNonTransferableMintInstruction(mint, programId) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(initializeNonTransferableMintInstructionData.span);
    initializeNonTransferableMintInstructionData.encode({
        instruction: TokenInstruction.InitializeNonTransferableMint,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=initializeNonTransferableMint.js.map