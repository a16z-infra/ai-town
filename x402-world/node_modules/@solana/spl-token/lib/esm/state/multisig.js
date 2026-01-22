import { struct, u8 } from '@solana/buffer-layout';
import { bool, publicKey } from '@solana/buffer-layout-utils';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenAccountNotFoundError, TokenInvalidAccountOwnerError, TokenInvalidAccountSizeError } from '../errors.js';
/** Buffer layout for de/serializing a multisig */
export const MultisigLayout = struct([
    u8('m'),
    u8('n'),
    bool('isInitialized'),
    publicKey('signer1'),
    publicKey('signer2'),
    publicKey('signer3'),
    publicKey('signer4'),
    publicKey('signer5'),
    publicKey('signer6'),
    publicKey('signer7'),
    publicKey('signer8'),
    publicKey('signer9'),
    publicKey('signer10'),
    publicKey('signer11'),
]);
/** Byte length of a multisig */
export const MULTISIG_SIZE = MultisigLayout.span;
/**
 * Retrieve information about a multisig
 *
 * @param connection Connection to use
 * @param address    Multisig account
 * @param commitment Desired level of commitment for querying the state
 * @param programId  SPL Token program account
 *
 * @return Multisig information
 */
export async function getMultisig(connection, address, commitment, programId = TOKEN_PROGRAM_ID) {
    const info = await connection.getAccountInfo(address, commitment);
    return unpackMultisig(address, info, programId);
}
/**
 * Unpack a multisig
 *
 * @param address   Multisig account
 * @param info      Multisig account data
 * @param programId SPL Token program account
 *
 * @return Unpacked multisig
 */
export function unpackMultisig(address, info, programId = TOKEN_PROGRAM_ID) {
    if (!info)
        throw new TokenAccountNotFoundError();
    if (!info.owner.equals(programId))
        throw new TokenInvalidAccountOwnerError();
    if (info.data.length != MULTISIG_SIZE)
        throw new TokenInvalidAccountSizeError();
    const multisig = MultisigLayout.decode(info.data);
    return { address, ...multisig };
}
/** Get the minimum lamport balance for a multisig to be rent exempt
 *
 * @param connection Connection to use
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Amount of lamports required
 */
export async function getMinimumBalanceForRentExemptMultisig(connection, commitment) {
    return await connection.getMinimumBalanceForRentExemption(MULTISIG_SIZE, commitment);
}
//# sourceMappingURL=multisig.js.map