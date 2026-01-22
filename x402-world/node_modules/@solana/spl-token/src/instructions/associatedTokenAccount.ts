import type { PublicKey } from '@solana/web3.js';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../constants.js';
import { getAssociatedTokenAddressSync } from '../state/mint.js';

/**
 * Construct a CreateAssociatedTokenAccount instruction
 *
 * @param payer                    Payer of the initialization fees
 * @param associatedToken          New associated token account
 * @param owner                    Owner of the new account
 * @param mint                     Token mint account
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): TransactionInstruction {
    return buildAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint,
        Buffer.alloc(0),
        programId,
        associatedTokenProgramId,
    );
}

/**
 * Construct a CreateAssociatedTokenAccountIdempotent instruction
 *
 * @param payer                    Payer of the initialization fees
 * @param associatedToken          New associated token account
 * @param owner                    Owner of the new account
 * @param mint                     Token mint account
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createAssociatedTokenAccountIdempotentInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): TransactionInstruction {
    return buildAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint,
        Buffer.from([1]),
        programId,
        associatedTokenProgramId,
    );
}

/**
 * Derive the associated token account and construct a CreateAssociatedTokenAccountIdempotent instruction
 *
 * @param payer                    Payer of the initialization fees
 * @param owner                    Owner of the new account
 * @param mint                     Token mint account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createAssociatedTokenAccountIdempotentInstructionWithDerivation(
    payer: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    allowOwnerOffCurve = true,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
) {
    const associatedToken = getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve);

    return createAssociatedTokenAccountIdempotentInstruction(
        payer,
        associatedToken,
        owner,
        mint,
        programId,
        associatedTokenProgramId,
    );
}

function buildAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    instructionData: Buffer,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedToken, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
        keys,
        programId: associatedTokenProgramId,
        data: instructionData,
    });
}

/**
 * Construct a RecoverNested instruction
 *
 * @param nestedAssociatedToken             Nested associated token account (must be owned by `ownerAssociatedToken`)
 * @param nestedMint                        Token mint for the nested associated token account
 * @param destinationAssociatedToken        Wallet's associated token account
 * @param ownerAssociatedToken              Owner associated token account address (must be owned by `owner`)
 * @param ownerMint                         Token mint for the owner associated token account
 * @param owner                             Wallet address for the owner associated token account
 * @param programId                         SPL Token program account
 * @param associatedTokenProgramId          SPL Associated Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createRecoverNestedInstruction(
    nestedAssociatedToken: PublicKey,
    nestedMint: PublicKey,
    destinationAssociatedToken: PublicKey,
    ownerAssociatedToken: PublicKey,
    ownerMint: PublicKey,
    owner: PublicKey,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = [
        { pubkey: nestedAssociatedToken, isSigner: false, isWritable: true },
        { pubkey: nestedMint, isSigner: false, isWritable: false },
        { pubkey: destinationAssociatedToken, isSigner: false, isWritable: true },
        { pubkey: ownerAssociatedToken, isSigner: false, isWritable: true },
        { pubkey: ownerMint, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: programId, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
        keys,
        programId: associatedTokenProgramId,
        data: Buffer.from([2]),
    });
}
