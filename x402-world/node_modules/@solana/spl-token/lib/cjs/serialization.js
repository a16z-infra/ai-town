"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COptionPublicKeyLayout = void 0;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
class COptionPublicKeyLayout extends buffer_layout_1.Layout {
    constructor(property) {
        super(-1, property);
        this.publicKeyLayout = (0, buffer_layout_utils_1.publicKey)();
    }
    decode(buffer, offset = 0) {
        const option = buffer[offset];
        if (option === 0) {
            return null;
        }
        return this.publicKeyLayout.decode(buffer, offset + 1);
    }
    encode(src, buffer, offset = 0) {
        if (src === null) {
            buffer[offset] = 0;
            return 1;
        }
        else {
            buffer[offset] = 1;
            this.publicKeyLayout.encode(src, buffer, offset + 1);
            return 33;
        }
    }
    getSpan(buffer, offset = 0) {
        if (buffer) {
            const option = buffer[offset];
            return option === 0 ? 1 : 1 + this.publicKeyLayout.span;
        }
        throw new RangeError('Buffer must be provided');
    }
}
exports.COptionPublicKeyLayout = COptionPublicKeyLayout;
//# sourceMappingURL=serialization.js.map