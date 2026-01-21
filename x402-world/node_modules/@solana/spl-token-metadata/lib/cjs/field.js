"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldCodec = exports.Field = void 0;
exports.getFieldConfig = getFieldConfig;
const codecs_1 = require("@solana/codecs");
var Field;
(function (Field) {
    Field[Field["Name"] = 0] = "Name";
    Field[Field["Symbol"] = 1] = "Symbol";
    Field[Field["Uri"] = 2] = "Uri";
})(Field || (exports.Field = Field = {}));
const getFieldCodec = () => [
    ['Name', (0, codecs_1.getUnitCodec)()],
    ['Symbol', (0, codecs_1.getUnitCodec)()],
    ['Uri', (0, codecs_1.getUnitCodec)()],
    ['Key', (0, codecs_1.getStructCodec)([['value', (0, codecs_1.getTupleCodec)([(0, codecs_1.addCodecSizePrefix)((0, codecs_1.getUtf8Codec)(), (0, codecs_1.getU32Codec)())])]])],
];
exports.getFieldCodec = getFieldCodec;
function getFieldConfig(field) {
    if (field === Field.Name || field === 'Name' || field === 'name') {
        return { __kind: 'Name' };
    }
    else if (field === Field.Symbol || field === 'Symbol' || field === 'symbol') {
        return { __kind: 'Symbol' };
    }
    else if (field === Field.Uri || field === 'Uri' || field === 'uri') {
        return { __kind: 'Uri' };
    }
    else {
        return { __kind: 'Key', value: [field] };
    }
}
//# sourceMappingURL=field.js.map