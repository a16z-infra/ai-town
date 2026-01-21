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
exports.unpackPubkeyData = unpackPubkeyData;
const web3_js_1 = require("@solana/web3.js");
const errors_js_1 = require("../../errors.js");
function unpackPubkeyData(keyDataConfig, previousMetas, instructionData, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const [discriminator, ...rest] = keyDataConfig;
        const remaining = new Uint8Array(rest);
        switch (discriminator) {
            case 1:
                return unpackPubkeyDataFromInstructionData(remaining, instructionData);
            case 2:
                return unpackPubkeyDataFromAccountData(remaining, previousMetas, connection);
            default:
                throw new errors_js_1.TokenTransferHookInvalidPubkeyData();
        }
    });
}
function unpackPubkeyDataFromInstructionData(remaining, instructionData) {
    if (remaining.length < 1) {
        throw new errors_js_1.TokenTransferHookInvalidPubkeyData();
    }
    const dataIndex = remaining[0];
    if (instructionData.length < dataIndex + web3_js_1.PUBLIC_KEY_LENGTH) {
        throw new errors_js_1.TokenTransferHookPubkeyDataTooSmall();
    }
    return new web3_js_1.PublicKey(instructionData.subarray(dataIndex, dataIndex + web3_js_1.PUBLIC_KEY_LENGTH));
}
function unpackPubkeyDataFromAccountData(remaining, previousMetas, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        if (remaining.length < 2) {
            throw new errors_js_1.TokenTransferHookInvalidPubkeyData();
        }
        const [accountIndex, dataIndex] = remaining;
        if (previousMetas.length <= accountIndex) {
            throw new errors_js_1.TokenTransferHookAccountDataNotFound();
        }
        const accountInfo = yield connection.getAccountInfo(previousMetas[accountIndex].pubkey);
        if (accountInfo == null) {
            throw new errors_js_1.TokenTransferHookAccountNotFound();
        }
        if (accountInfo.data.length < dataIndex + web3_js_1.PUBLIC_KEY_LENGTH) {
            throw new errors_js_1.TokenTransferHookPubkeyDataTooSmall();
        }
        return new web3_js_1.PublicKey(accountInfo.data.subarray(dataIndex, dataIndex + web3_js_1.PUBLIC_KEY_LENGTH));
    });
}
//# sourceMappingURL=pubkeyData.js.map