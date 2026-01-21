"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSigners = getSigners;
const web3_js_1 = require("@solana/web3.js");
/** @internal */
function getSigners(signerOrMultisig, multiSigners) {
    return signerOrMultisig instanceof web3_js_1.PublicKey
        ? [signerOrMultisig, multiSigners]
        : [signerOrMultisig.publicKey, [signerOrMultisig]];
}
//# sourceMappingURL=internal.js.map