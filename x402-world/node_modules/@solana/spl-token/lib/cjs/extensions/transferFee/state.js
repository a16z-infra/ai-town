"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSFER_FEE_AMOUNT_SIZE = exports.TransferFeeAmountLayout = exports.TRANSFER_FEE_CONFIG_SIZE = exports.TransferFeeConfigLayout = exports.ONE_IN_BASIS_POINTS = exports.MAX_FEE_BASIS_POINTS = void 0;
exports.transferFeeLayout = transferFeeLayout;
exports.calculateFee = calculateFee;
exports.getEpochFee = getEpochFee;
exports.calculateEpochFee = calculateEpochFee;
exports.getTransferFeeConfig = getTransferFeeConfig;
exports.getTransferFeeAmount = getTransferFeeAmount;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("../extensionType.js");
exports.MAX_FEE_BASIS_POINTS = 10000;
exports.ONE_IN_BASIS_POINTS = BigInt(exports.MAX_FEE_BASIS_POINTS);
/** Buffer layout for de/serializing a transfer fee */
function transferFeeLayout(property) {
    return (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.u64)('epoch'), (0, buffer_layout_utils_1.u64)('maximumFee'), (0, buffer_layout_1.u16)('transferFeeBasisPoints')], property);
}
/** Calculate the transfer fee */
function calculateFee(transferFee, preFeeAmount) {
    const transferFeeBasisPoints = transferFee.transferFeeBasisPoints;
    if (transferFeeBasisPoints === 0 || preFeeAmount === BigInt(0)) {
        return BigInt(0);
    }
    else {
        const numerator = preFeeAmount * BigInt(transferFeeBasisPoints);
        const rawFee = (numerator + exports.ONE_IN_BASIS_POINTS - BigInt(1)) / exports.ONE_IN_BASIS_POINTS;
        const fee = rawFee > transferFee.maximumFee ? transferFee.maximumFee : rawFee;
        return BigInt(fee);
    }
}
/** Buffer layout for de/serializing a transfer fee config extension */
exports.TransferFeeConfigLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.publicKey)('transferFeeConfigAuthority'),
    (0, buffer_layout_utils_1.publicKey)('withdrawWithheldAuthority'),
    (0, buffer_layout_utils_1.u64)('withheldAmount'),
    transferFeeLayout('olderTransferFee'),
    transferFeeLayout('newerTransferFee'),
]);
exports.TRANSFER_FEE_CONFIG_SIZE = exports.TransferFeeConfigLayout.span;
/** Get the fee for given epoch */
function getEpochFee(transferFeeConfig, epoch) {
    if (epoch >= transferFeeConfig.newerTransferFee.epoch) {
        return transferFeeConfig.newerTransferFee;
    }
    else {
        return transferFeeConfig.olderTransferFee;
    }
}
/** Calculate the fee for the given epoch and input amount */
function calculateEpochFee(transferFeeConfig, epoch, preFeeAmount) {
    const transferFee = getEpochFee(transferFeeConfig, epoch);
    return calculateFee(transferFee, preFeeAmount);
}
/** Buffer layout for de/serializing */
exports.TransferFeeAmountLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.u64)('withheldAmount')]);
exports.TRANSFER_FEE_AMOUNT_SIZE = exports.TransferFeeAmountLayout.span;
function getTransferFeeConfig(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TransferFeeConfig, mint.tlvData);
    if (extensionData !== null) {
        return exports.TransferFeeConfigLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
function getTransferFeeAmount(account) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TransferFeeAmount, account.tlvData);
    if (extensionData !== null) {
        return exports.TransferFeeAmountLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map