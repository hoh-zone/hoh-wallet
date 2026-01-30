import { Transaction } from '@mysten/sui/transactions';
import { suiClientManager } from './sui';

interface SendTokenParams {
  recipient: string;
  amount: number;
  tokenAddress: string;
  decimals: number;
  signer: any;
}

export class TokenTransferService {
  async sendToken(params: SendTokenParams): Promise<{ digest: string; status: string } | null> {
    try {
      const client = suiClientManager.getClient();
      const tx = new Transaction();

      const isSui = params.tokenAddress === '0x0000000000000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

      if (isSui) {
        const amountInMist = Math.floor(params.amount * 1000000000);
        const coin = tx.splitCoins(tx.gas, [amountInMist]);
        tx.transferObjects([coin], params.recipient);
      } else {
        const amountInBaseUnit = Math.floor(params.amount * Math.pow(10, params.decimals));

        const coins = await client.getCoins({
          owner: params.signer.toSuiAddress(),
          coinType: params.tokenAddress,
          limit: 100,
        });

        if (coins.data.length === 0) {
          throw new Error('No coins found for this token type');
        }

        let totalBalance = BigInt(0);
        const coinsToUse = [];

        for (const coin of coins.data) {
          const balance = BigInt(coin.balance);
          if (totalBalance >= BigInt(amountInBaseUnit)) {
            break;
          }

          if (totalBalance + balance <= BigInt(amountInBaseUnit)) {
            coinsToUse.push(coin);
            totalBalance += balance;
          } else {
            const coinObject = tx.object(coin.coinObjectId);
            const remaining = BigInt(amountInBaseUnit) - totalBalance;
            tx.splitCoins(coinObject, [remaining]);
            coinsToUse.push({ ...coin, balance: remaining.toString() });
            totalBalance = BigInt(amountInBaseUnit);
          }
        }

        if (totalBalance < BigInt(amountInBaseUnit)) {
          throw new Error('Insufficient balance');
        }

        if (coinsToUse.length > 1) {
          const mergedCoin = tx.object(coinsToUse[0].coinObjectId);
          for (let i = 1; i < coinsToUse.length; i++) {
            tx.mergeCoins(mergedCoin, [tx.object(coinsToUse[i].coinObjectId)]);
          }
          tx.transferObjects([mergedCoin], params.recipient);
        } else {
          tx.transferObjects([tx.object(coinsToUse[0].coinObjectId)], params.recipient);
        }
      }

      const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: params.signer,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error('Transaction failed');
      }

      return {
        digest: result.digest,
        status: 'success'
      };
    } catch (error) {
      console.error('Token transfer failed:', error);
      return null;
    }
  }

  async estimateGas(params: Omit<SendTokenParams, 'signer'>): Promise<number> {
    try {
      const client = suiClientManager.getClient();
      const tx = new Transaction();

      const isSui = params.tokenAddress === '0x0000000000000000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

      if (isSui) {
        const amountInMist = Math.floor(params.amount * 1000000000);
        const coin = tx.splitCoins(tx.gas, [amountInMist]);
        tx.transferObjects([coin], params.recipient);
      } else {
        const amountInBaseUnit = Math.floor(params.amount * Math.pow(10, params.decimals));
        const coins = await client.getCoins({
          owner: '0x0000000000000000000000000000000000000000000000000000000000000000000000000002',
          coinType: params.tokenAddress,
          limit: 100,
        });

        if (coins.data.length > 0) {
          const coinObject = tx.object(coins.data[0].coinObjectId);
          const amountBN = BigInt(amountInBaseUnit);
          const [splitCoin] = tx.splitCoins(coinObject, [amountBN]);
          tx.transferObjects([splitCoin], params.recipient);
        }
      }

      const builtTx = await tx.build({ client });
      const gasEstimate = await client.dryRunTransactionBlock({
        transactionBlock: builtTx,
      });

      const gasUsed = parseInt(gasEstimate.effects.gasUsed.computationCost);
      return gasUsed / 1000000000;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return 0.001;
    }
  }
}

export const tokenTransferService = new TokenTransferService();
