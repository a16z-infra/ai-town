"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimal = exports.WAD = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const base_1 = require("./base");
const bigint_1 = require("./bigint");
exports.WAD = new bignumber_js_1.default('1e+18');
const decimal = (property) => {
    const layout = (0, bigint_1.u128)(property);
    const { encode, decode } = (0, base_1.encodeDecode)(layout);
    const decimalLayout = layout;
    decimalLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset).toString();
        return new bignumber_js_1.default(src).div(exports.WAD);
    };
    decimalLayout.encode = (decimal, buffer, offset) => {
        const src = BigInt(decimal.times(exports.WAD).integerValue().toString());
        return encode(src, buffer, offset);
    };
    return decimalLayout;
};
exports.decimal = decimal;
//# sourceMappingURL=decimal.js.map