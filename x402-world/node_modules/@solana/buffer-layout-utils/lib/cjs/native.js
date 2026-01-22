"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bool = void 0;
const buffer_layout_1 = require("@solana/buffer-layout");
const base_1 = require("./base");
const bool = (property) => {
    const layout = (0, buffer_layout_1.u8)(property);
    const { encode, decode } = (0, base_1.encodeDecode)(layout);
    const boolLayout = layout;
    boolLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return !!src;
    };
    boolLayout.encode = (bool, buffer, offset) => {
        const src = Number(bool);
        return encode(src, buffer, offset);
    };
    return boolLayout;
};
exports.bool = bool;
//# sourceMappingURL=native.js.map