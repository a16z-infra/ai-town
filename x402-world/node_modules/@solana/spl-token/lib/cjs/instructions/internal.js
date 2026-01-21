"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSigners = addSigners;
const web3_js_1 = require("@solana/web3.js");
/** @internal */
function addSigners(keys, ownerOrAuthority, multiSigners) {
    if (multiSigners.length) {
        keys.push({ pubkey: ownerOrAuthority, isSigner: false, isWritable: false });
        for (const signer of multiSigners) {
            keys.push({
                pubkey: signer instanceof web3_js_1.PublicKey ? signer : signer.publicKey,
                isSigner: true,
                isWritable: false,
            });
        }
    }
    else {
        keys.push({ pubkey: ownerOrAuthority, isSigner: true, isWritable: false });
    }
    return keys;
}
//# sourceMappingURL=internal.js.map