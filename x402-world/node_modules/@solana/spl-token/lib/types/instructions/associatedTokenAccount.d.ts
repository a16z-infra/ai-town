import type { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
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
export declare function createAssociatedTokenAccountInstruction(payer: PublicKey, associatedToken: PublicKey, owner: PublicKey, mint: PublicKey, programId?: PublicKey, associatedTokenProgramId?: PublicKey): TransactionInstruction;
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
export declare function createAssociatedTokenAccountIdempotentInstruction(payer: PublicKey, associatedToken: PublicKey, owner: PublicKey, mint: PublicKey, programId?: PublicKey, associatedTokenProgramId?: PublicKey): TransactionInstruction;
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
export declare function createAssociatedTokenAccountIdempotentInstructionWithDerivation(payer: PublicKey, owner: PublicKey, mint: PublicKey, allowOwnerOffCurve?: boolean, programId?: PublicKey, associatedTokenProgramId?: PublicKey): TransactionInstruction;
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
export declare function createRecoverNestedInstruction(nestedAssociatedToken: PublicKey, nestedMint: PublicKey, destinationAssociatedToken: PublicKey, ownerAssociatedToken: PublicKey, ownerMint: PublicKey, owner: PublicKey, programId?: PublicKey, associatedTokenProgramId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=associatedTokenAccount.d.ts.map