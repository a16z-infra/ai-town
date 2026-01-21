"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpackSeeds = unpackSeeds;
const errors_js_1 = require("../../errors.js");
const DISCRIMINATOR_SPAN = 1;
const LITERAL_LENGTH_SPAN = 1;
const INSTRUCTION_ARG_OFFSET_SPAN = 1;
const INSTRUCTION_ARG_LENGTH_SPAN = 1;
const ACCOUNT_KEY_INDEX_SPAN = 1;
const ACCOUNT_DATA_ACCOUNT_INDEX_SPAN = 1;
const ACCOUNT_DATA_OFFSET_SPAN = 1;
const ACCOUNT_DATA_LENGTH_SPAN = 1;
function unpackSeedLiteral(seeds) {
    if (seeds.length < 1) {
        throw new errors_js_1.TokenTransferHookInvalidSeed();
    }
    const [length, ...rest] = seeds;
    if (rest.length < length) {
        throw new errors_js_1.TokenTransferHookInvalidSeed();
    }
    return {
        data: Buffer.from(rest.slice(0, length)),
        packedLength: DISCRIMINATOR_SPAN + LITERAL_LENGTH_SPAN + length,
    };
}
function unpackSeedInstructionArg(seeds, instructionData) {
    if (seeds.length < 2) {
        throw new errors_js_1.TokenTransferHookInvalidSeed();
    }
    const [index, length] = seeds;
    if (instructionData.length < length + index) {
        throw new errors_js_1.TokenTransferHookInvalidSeed();
    }
    return {
        data: instructionData.subarray(index, index + length),
        packedLength: DISCRIMINATOR_SPAN + INSTRUCTION_ARG_OFFSET_SPAN + INSTRUCTION_ARG_LENGTH_SPAN,
    };
}
function unpackSeedAccountKey(seeds, previousMetas) {
    if (seeds.length < 1) {
        throw new errors_js_1.TokenTransferHookInvalidSeed();
    }
    const [index] = seeds;
    if (previousMetas.length <= index) {
        throw new errors_js_1.TokenTransferHookInvalidSeed();
    }
    return {
        data: previousMetas[index].pubkey.toBuffer(),
        packedLength: DISCRIMINATOR_SPAN + ACCOUNT_KEY_INDEX_SPAN,
    };
}
function unpackSeedAccountData(seeds, previousMetas, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        if (seeds.length < 3) {
            throw new errors_js_1.TokenTransferHookInvalidSeed();
        }
        const [accountIndex, dataIndex, length] = seeds;
        if (previousMetas.length <= accountIndex) {
            throw new errors_js_1.TokenTransferHookInvalidSeed();
        }
        const accountInfo = yield connection.getAccountInfo(previousMetas[accountIndex].pubkey);
        if (accountInfo == null) {
            throw new errors_js_1.TokenTransferHookAccountDataNotFound();
        }
        if (accountInfo.data.length < dataIndex + length) {
            throw new errors_js_1.TokenTransferHookInvalidSeed();
        }
        return {
            data: accountInfo.data.subarray(dataIndex, dataIndex + length),
            packedLength: DISCRIMINATOR_SPAN + ACCOUNT_DATA_ACCOUNT_INDEX_SPAN + ACCOUNT_DATA_OFFSET_SPAN + ACCOUNT_DATA_LENGTH_SPAN,
        };
    });
}
function unpackFirstSeed(seeds, previousMetas, instructionData, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const [discriminator, ...rest] = seeds;
        const remaining = new Uint8Array(rest);
        switch (discriminator) {
            case 0:
                return null;
            case 1:
                return unpackSeedLiteral(remaining);
            case 2:
                return unpackSeedInstructionArg(remaining, instructionData);
            case 3:
                return unpackSeedAccountKey(remaining, previousMetas);
            case 4:
                return unpackSeedAccountData(remaining, previousMetas, connection);
            default:
                throw new errors_js_1.TokenTransferHookInvalidSeed();
        }
    });
}
function unpackSeeds(seeds, previousMetas, instructionData, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const unpackedSeeds = [];
        let i = 0;
        while (i < 32) {
            const seed = yield unpackFirstSeed(seeds.slice(i), previousMetas, instructionData, connection);
            if (seed == null) {
                break;
            }
            unpackedSeeds.push(seed.data);
            i += seed.packedLength;
        }
        return unpackedSeeds;
    });
}
//# sourceMappingURL=seeds.js.map