"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicKey = void 0;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const base_1 = require("./base");
const publicKey = (property) => {
    const layout = (0, buffer_layout_1.blob)(32, property);
    const { encode, decode } = (0, base_1.encodeDecode)(layout);
    const publicKeyLayout = layout;
    publicKeyLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return new web3_js_1.PublicKey(src);
    };
    publicKeyLayout.encode = (publicKey, buffer, offset) => {
        const src = publicKey.toBuffer();
        return encode(src, buffer, offset);
    };
    return publicKeyLayout;
};
exports.publicKey = publicKey;
//# sourceMappingURL=web3.js.map