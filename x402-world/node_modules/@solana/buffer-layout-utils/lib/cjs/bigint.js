"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.u256be = exports.u256 = exports.u192be = exports.u192 = exports.u128be = exports.u128 = exports.u64be = exports.u64 = exports.bigIntBE = exports.bigInt = void 0;
const buffer_layout_1 = require("@solana/buffer-layout");
const bigint_buffer_1 = require("bigint-buffer");
const base_1 = require("./base");
const bigInt = (length) => (property) => {
    const layout = (0, buffer_layout_1.blob)(length, property);
    const { encode, decode } = (0, base_1.encodeDecode)(layout);
    const bigIntLayout = layout;
    bigIntLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return (0, bigint_buffer_1.toBigIntLE)(Buffer.from(src));
    };
    bigIntLayout.encode = (bigInt, buffer, offset) => {
        const src = (0, bigint_buffer_1.toBufferLE)(bigInt, length);
        return encode(src, buffer, offset);
    };
    return bigIntLayout;
};
exports.bigInt = bigInt;
const bigIntBE = (length) => (property) => {
    const layout = (0, buffer_layout_1.blob)(length, property);
    const { encode, decode } = (0, base_1.encodeDecode)(layout);
    const bigIntLayout = layout;
    bigIntLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return (0, bigint_buffer_1.toBigIntBE)(Buffer.from(src));
    };
    bigIntLayout.encode = (bigInt, buffer, offset) => {
        const src = (0, bigint_buffer_1.toBufferBE)(bigInt, length);
        return encode(src, buffer, offset);
    };
    return bigIntLayout;
};
exports.bigIntBE = bigIntBE;
exports.u64 = (0, exports.bigInt)(8);
exports.u64be = (0, exports.bigIntBE)(8);
exports.u128 = (0, exports.bigInt)(16);
exports.u128be = (0, exports.bigIntBE)(16);
exports.u192 = (0, exports.bigInt)(24);
exports.u192be = (0, exports.bigIntBE)(24);
exports.u256 = (0, exports.bigInt)(32);
exports.u256be = (0, exports.bigIntBE)(32);
//# sourceMappingURL=bigint.js.map