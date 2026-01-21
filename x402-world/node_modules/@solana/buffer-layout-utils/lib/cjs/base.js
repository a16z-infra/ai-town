"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeDecode = void 0;
const encodeDecode = (layout) => {
    const decode = layout.decode.bind(layout);
    const encode = layout.encode.bind(layout);
    return { decode, encode };
};
exports.encodeDecode = encodeDecode;
//# sourceMappingURL=base.js.map