import { PublicKey } from '@solana/web3.js';
/** @internal */
export function getSigners(signerOrMultisig, multiSigners) {
    return signerOrMultisig instanceof PublicKey
        ? [signerOrMultisig, multiSigners]
        : [signerOrMultisig.publicKey, [signerOrMultisig]];
}
//# sourceMappingURL=internal.js.map