import { u64 } from '@solana/buffer-layout-utils';
import { Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createUiAmountToAmountInstruction } from '../instructions/uiAmountToAmount.js';
/**
 * Amount as a string using mint-prescribed decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Mint for the account
 * @param amount         Ui Amount of tokens to be converted to Amount
 * @param programId      SPL Token program account
 *
 * @return Ui Amount generated
 */
export async function uiAmountToAmount(connection, payer, mint, amount, programId = TOKEN_PROGRAM_ID) {
    const transaction = new Transaction().add(createUiAmountToAmountInstruction(mint, amount, programId));
    const { returnData, err } = (await connection.simulateTransaction(transaction, [payer], false)).value;
    if (returnData) {
        const data = Buffer.from(returnData.data[0], returnData.data[1]);
        return u64().decode(data);
    }
    return err;
}
//# sourceMappingURL=uiAmountToAmount.js.map