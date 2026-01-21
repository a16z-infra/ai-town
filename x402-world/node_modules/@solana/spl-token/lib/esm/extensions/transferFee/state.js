import { struct, u16 } from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from '../extensionType.js';
export const MAX_FEE_BASIS_POINTS = 10000;
export const ONE_IN_BASIS_POINTS = BigInt(MAX_FEE_BASIS_POINTS);
/** Buffer layout for de/serializing a transfer fee */
export function transferFeeLayout(property) {
    return struct([u64('epoch'), u64('maximumFee'), u16('transferFeeBasisPoints')], property);
}
/** Calculate the transfer fee */
export function calculateFee(transferFee, preFeeAmount) {
    const transferFeeBasisPoints = transferFee.transferFeeBasisPoints;
    if (transferFeeBasisPoints === 0 || preFeeAmount === BigInt(0)) {
        return BigInt(0);
    }
    else {
        const numerator = preFeeAmount * BigInt(transferFeeBasisPoints);
        const rawFee = (numerator + ONE_IN_BASIS_POINTS - BigInt(1)) / ONE_IN_BASIS_POINTS;
        const fee = rawFee > transferFee.maximumFee ? transferFee.maximumFee : rawFee;
        return BigInt(fee);
    }
}
/** Buffer layout for de/serializing a transfer fee config extension */
export const TransferFeeConfigLayout = struct([
    publicKey('transferFeeConfigAuthority'),
    publicKey('withdrawWithheldAuthority'),
    u64('withheldAmount'),
    transferFeeLayout('olderTransferFee'),
    transferFeeLayout('newerTransferFee'),
]);
export const TRANSFER_FEE_CONFIG_SIZE = TransferFeeConfigLayout.span;
/** Get the fee for given epoch */
export function getEpochFee(transferFeeConfig, epoch) {
    if (epoch >= transferFeeConfig.newerTransferFee.epoch) {
        return transferFeeConfig.newerTransferFee;
    }
    else {
        return transferFeeConfig.olderTransferFee;
    }
}
/** Calculate the fee for the given epoch and input amount */
export function calculateEpochFee(transferFeeConfig, epoch, preFeeAmount) {
    const transferFee = getEpochFee(transferFeeConfig, epoch);
    return calculateFee(transferFee, preFeeAmount);
}
/** Buffer layout for de/serializing */
export const TransferFeeAmountLayout = struct([u64('withheldAmount')]);
export const TRANSFER_FEE_AMOUNT_SIZE = TransferFeeAmountLayout.span;
export function getTransferFeeConfig(mint) {
    const extensionData = getExtensionData(ExtensionType.TransferFeeConfig, mint.tlvData);
    if (extensionData !== null) {
        return TransferFeeConfigLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
export function getTransferFeeAmount(account) {
    const extensionData = getExtensionData(ExtensionType.TransferFeeAmount, account.tlvData);
    if (extensionData !== null) {
        return TransferFeeAmountLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map