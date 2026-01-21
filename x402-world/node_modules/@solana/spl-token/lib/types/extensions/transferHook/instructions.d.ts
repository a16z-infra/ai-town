import type { Commitment, Connection, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum TransferHookInstruction {
    Initialize = 0,
    Update = 1
}
/** Deserialized instruction for the initiation of an transfer hook */
export interface InitializeTransferHookInstructionData {
    instruction: TokenInstruction.TransferHookExtension;
    transferHookInstruction: TransferHookInstruction.Initialize;
    authority: PublicKey;
    transferHookProgramId: PublicKey;
}
/** The struct that represents the instruction data as it is read by the program */
export declare const initializeTransferHookInstructionData: import("@solana/buffer-layout").Structure<InitializeTransferHookInstructionData>;
/**
 * Construct an InitializeTransferHook instruction
 *
 * @param mint                  Token mint account
 * @param authority             Transfer hook authority account
 * @param transferHookProgramId Transfer hook program account
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeTransferHookInstruction(mint: PublicKey, authority: PublicKey, transferHookProgramId: PublicKey, programId: PublicKey): TransactionInstruction;
/** Deserialized instruction for the initiation of an transfer hook */
export interface UpdateTransferHookInstructionData {
    instruction: TokenInstruction.TransferHookExtension;
    transferHookInstruction: TransferHookInstruction.Update;
    transferHookProgramId: PublicKey;
}
/** The struct that represents the instruction data as it is read by the program */
export declare const updateTransferHookInstructionData: import("@solana/buffer-layout").Structure<UpdateTransferHookInstructionData>;
/**
 * Construct an UpdateTransferHook instruction
 *
 * @param mint                  Mint to update
 * @param authority             The mint's transfer hook authority
 * @param transferHookProgramId The new transfer hook program account
 * @param signers               The signer account(s) for a multisig
 * @param tokenProgramId        SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createUpdateTransferHookInstruction(mint: PublicKey, authority: PublicKey, transferHookProgramId: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/**
 * Construct an `ExecuteInstruction` for a transfer hook program, without the
 * additional accounts
 *
 * @param programId             The program ID of the transfer hook program
 * @param source                The source account
 * @param mint                  The mint account
 * @param destination           The destination account
 * @param owner                 Owner of the source account
 * @param validateStatePubkey   The validate state pubkey
 * @param amount                The amount of tokens to transfer
 * @returns Instruction to add to a transaction
 */
export declare function createExecuteInstruction(programId: PublicKey, source: PublicKey, mint: PublicKey, destination: PublicKey, owner: PublicKey, validateStatePubkey: PublicKey, amount: bigint): TransactionInstruction;
/**
 * Adds all the extra accounts needed for a transfer hook to an instruction.
 *
 * Note this will modify the instruction passed in.
 *
 * @param connection            Connection to use
 * @param instruction           The instruction to add accounts to
 * @param programId             Transfer hook program ID
 * @param source                The source account
 * @param mint                  The mint account
 * @param destination           The destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param commitment            Commitment to use
 */
export declare function addExtraAccountMetasForExecute(connection: Connection, instruction: TransactionInstruction, programId: PublicKey, source: PublicKey, mint: PublicKey, destination: PublicKey, owner: PublicKey, amount: number | bigint, commitment?: Commitment): Promise<TransactionInstruction | undefined>;
/**
 * Construct an transferChecked instruction with extra accounts for transfer hook
 *
 * @param connection            Connection to use
 * @param source                Source account
 * @param mint                  Mint to update
 * @param destination           Destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param decimals              Number of decimals in transfer amount
 * @param multiSigners          The signer account(s) for a multisig
 * @param commitment            Commitment to use
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createTransferCheckedWithTransferHookInstruction(connection: Connection, source: PublicKey, mint: PublicKey, destination: PublicKey, owner: PublicKey, amount: bigint, decimals: number, multiSigners?: (Signer | PublicKey)[], commitment?: Commitment, programId?: PublicKey): Promise<TransactionInstruction>;
/**
 * Construct an transferChecked instruction with extra accounts for transfer hook
 *
 * @param connection            Connection to use
 * @param source                Source account
 * @param mint                  Mint to update
 * @param destination           Destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param decimals              Number of decimals in transfer amount
 * @param fee                   The calculated fee for the transfer fee extension
 * @param multiSigners          The signer account(s) for a multisig
 * @param commitment            Commitment to use
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createTransferCheckedWithFeeAndTransferHookInstruction(connection: Connection, source: PublicKey, mint: PublicKey, destination: PublicKey, owner: PublicKey, amount: bigint, decimals: number, fee: bigint, multiSigners?: (Signer | PublicKey)[], commitment?: Commitment, programId?: PublicKey): Promise<TransactionInstruction>;
//# sourceMappingURL=instructions.d.ts.map