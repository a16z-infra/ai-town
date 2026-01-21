import { s16, struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';
export var InterestBearingMintInstruction;
(function (InterestBearingMintInstruction) {
    InterestBearingMintInstruction[InterestBearingMintInstruction["Initialize"] = 0] = "Initialize";
    InterestBearingMintInstruction[InterestBearingMintInstruction["UpdateRate"] = 1] = "UpdateRate";
})(InterestBearingMintInstruction || (InterestBearingMintInstruction = {}));
export const interestBearingMintInitializeInstructionData = struct([
    u8('instruction'),
    u8('interestBearingMintInstruction'),
    // TODO: Make this an optional public key
    publicKey('rateAuthority'),
    s16('rate'),
]);
export const interestBearingMintUpdateRateInstructionData = struct([
    u8('instruction'),
    u8('interestBearingMintInstruction'),
    s16('rate'),
]);
/**
 * Construct an InitializeInterestBearingMint instruction
 *
 * @param mint           Mint to initialize
 * @param rateAuthority  The public key for the account that can update the rate
 * @param rate           The initial interest rate
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeInterestBearingMintInstruction(mint, rateAuthority, rate, programId = TOKEN_2022_PROGRAM_ID) {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(interestBearingMintInitializeInstructionData.span);
    interestBearingMintInitializeInstructionData.encode({
        instruction: TokenInstruction.InterestBearingMintExtension,
        interestBearingMintInstruction: InterestBearingMintInstruction.Initialize,
        rateAuthority,
        rate,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Construct an UpdateRateInterestBearingMint instruction
 *
 * @param mint           Mint to initialize
 * @param rateAuthority  The public key for the account that can update the rate
 * @param rate           The updated interest rate
 * @param multiSigners   Signing accounts if `rateAuthority` is a multisig
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createUpdateRateInterestBearingMintInstruction(mint, rateAuthority, rate, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: rateAuthority, isSigner: !multiSigners.length, isWritable: false },
    ], rateAuthority, multiSigners);
    const data = Buffer.alloc(interestBearingMintUpdateRateInstructionData.span);
    interestBearingMintUpdateRateInstructionData.encode({
        instruction: TokenInstruction.InterestBearingMintExtension,
        interestBearingMintInstruction: InterestBearingMintInstruction.UpdateRate,
        rate,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map