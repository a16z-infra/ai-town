import { sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import { createInitializeGroupInstruction, createUpdateGroupMaxSizeInstruction, createUpdateGroupAuthorityInstruction, createInitializeMemberInstruction, TOKEN_GROUP_SIZE, TOKEN_GROUP_MEMBER_SIZE, } from '@solana/spl-token-group';
import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { getSigners } from '../../actions/internal.js';
/**
 * Initialize a new `Group`
 *
 * Assumes one has already initialized a mint for the group.
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param mintAuthority    Group mint authority
 * @param updateAuthority  Group update authority
 * @param maxSize          Maximum number of members in the group
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function tokenGroupInitializeGroup(connection, payer, mint, mintAuthority, updateAuthority, maxSize, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [mintAuthorityPublicKey, signers] = getSigners(mintAuthority, multiSigners);
    const transaction = new Transaction().add(createInitializeGroupInstruction({
        programId,
        group: mint,
        mint,
        mintAuthority: mintAuthorityPublicKey,
        updateAuthority,
        maxSize,
    }));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Initialize a new `Group` with rent transfer.
 *
 * Assumes one has already initialized a mint for the group.
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param mintAuthority    Group mint authority
 * @param updateAuthority  Group update authority
 * @param maxSize          Maximum number of members in the group
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function tokenGroupInitializeGroupWithRentTransfer(connection, payer, mint, mintAuthority, updateAuthority, maxSize, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [mintAuthorityPublicKey, signers] = getSigners(mintAuthority, multiSigners);
    const lamports = await connection.getMinimumBalanceForRentExemption(TOKEN_GROUP_SIZE);
    const transaction = new Transaction().add(SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: mint,
        lamports,
    }), createInitializeGroupInstruction({
        programId,
        group: mint,
        mint,
        mintAuthority: mintAuthorityPublicKey,
        updateAuthority,
        maxSize,
    }));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Update the max size of a `Group`
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param updateAuthority  Group update authority
 * @param maxSize          Maximum number of members in the group
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function tokenGroupUpdateGroupMaxSize(connection, payer, mint, updateAuthority, maxSize, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [updateAuthorityPublicKey, signers] = getSigners(updateAuthority, multiSigners);
    const transaction = new Transaction().add(createUpdateGroupMaxSizeInstruction({
        programId,
        group: mint,
        updateAuthority: updateAuthorityPublicKey,
        maxSize,
    }));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Update the authority of a `Group`
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param updateAuthority  Group update authority
 * @param newAuthority     New authority for the token group, or unset
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function tokenGroupUpdateGroupAuthority(connection, payer, mint, updateAuthority, newAuthority, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [updateAuthorityPublicKey, signers] = getSigners(updateAuthority, multiSigners);
    const transaction = new Transaction().add(createUpdateGroupAuthorityInstruction({
        programId,
        group: mint,
        currentAuthority: updateAuthorityPublicKey,
        newAuthority,
    }));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Initialize a new `Member` of a `Group`
 *
 * Assumes the `Group` has already been initialized,
 * as well as the mint for the member.
 *
 * @param connection             Connection to use
 * @param payer                  Payer of the transaction fee
 * @param mint                   Member mint
 * @param mintAuthority          Member mint authority
 * @param group                  Group mint
 * @param groupUpdateAuthority   Group update authority
 * @param multiSigners           Signing accounts if `authority` is a multisig
 * @param confirmOptions         Options for confirming the transaction
 * @param programId              SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function tokenGroupMemberInitialize(connection, payer, mint, mintAuthority, group, groupUpdateAuthority, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [mintAuthorityPublicKey, signers] = getSigners(mintAuthority, multiSigners);
    const transaction = new Transaction().add(createInitializeMemberInstruction({
        programId,
        member: mint,
        memberMint: mint,
        memberMintAuthority: mintAuthorityPublicKey,
        group,
        groupUpdateAuthority,
    }));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Initialize a new `Member` of a `Group` with rent transfer.
 *
 * Assumes the `Group` has already been initialized,
 * as well as the mint for the member.
 *
 * @param connection             Connection to use
 * @param payer                  Payer of the transaction fee
 * @param mint                   Member mint
 * @param mintAuthority          Member mint authority
 * @param group                  Group mint
 * @param groupUpdateAuthority   Group update authority
 * @param multiSigners           Signing accounts if `authority` is a multisig
 * @param confirmOptions         Options for confirming the transaction
 * @param programId              SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function tokenGroupMemberInitializeWithRentTransfer(connection, payer, mint, mintAuthority, group, groupUpdateAuthority, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [mintAuthorityPublicKey, signers] = getSigners(mintAuthority, multiSigners);
    const lamports = await connection.getMinimumBalanceForRentExemption(TOKEN_GROUP_MEMBER_SIZE);
    const transaction = new Transaction().add(SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: mint,
        lamports,
    }), createInitializeMemberInstruction({
        programId,
        member: mint,
        memberMint: mint,
        memberMintAuthority: mintAuthorityPublicKey,
        group,
        groupUpdateAuthority,
    }));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=actions.js.map