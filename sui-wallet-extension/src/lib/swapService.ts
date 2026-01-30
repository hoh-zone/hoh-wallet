import { Transaction } from '@mysten/sui/transactions';
import { TransactionObjectArgument } from '@mysten/sui/transactions';
import { Signer } from '@mysten/sui/cryptography';
import { AggregatorClient, CoinUtils, RouterDataV3, type BuildRouterSwapParamsV3 } from '@cetusprotocol/aggregator-sdk';
import { suiClientManager } from './sui';
import { TOKENS } from './tokens';
import BN from 'bn.js';

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  price: string;
  priceImpact: string;
  route: string;
  gasFee: string;
  minimumAmountReceived: string;
  tradeFee: string;
  fromTokenPrice: string;
  toTokenPrice: string;
  routerData?: RouterDataV3;
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
  walletAddress: string;
}

export class SwapService {
  private aggregatorClient: AggregatorClient | null = null;

  constructor() {
    this.initAggregatorClient();
  }

  private initAggregatorClient() {
    try {
      const client = suiClientManager.getClient();
      if (client) {
        this.aggregatorClient = new AggregatorClient({
          client,
          endpoint: 'https://api-sui.cetus.zone/router_v3',
          env: 0,
        });
      }
    } catch (error) {
      console.error('Failed to initialize aggregator client:', error);
    }
  }

  async getQuote(params: SwapParams): Promise<SwapQuote | null> {
    if (!this.aggregatorClient) {
      throw new Error('Aggregator client not initialized');
    }

    try {
      const fromTokenInfo = TOKENS[params.fromToken];
      const toTokenInfo = TOKENS[params.toToken];

      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error('Invalid token');
      }

      const amount = parseFloat(params.amount);
      const amountIn = new BN(amount * Math.pow(10, fromTokenInfo.decimals));

      const routerData = await this.aggregatorClient.findRouters({
        from: fromTokenInfo.address,
        target: toTokenInfo.address,
        amount: amountIn,
        byAmountIn: true,
        providers: ['CETUS'],
      });

      if (!routerData || routerData.insufficientLiquidity) {
        throw new Error('Insufficient liquidity');
      }

      const outputAmount = parseFloat(routerData.amountOut.toString()) / Math.pow(10, toTokenInfo.decimals);
      const price = outputAmount / amount;
      const priceImpact = this.calculatePriceImpact(routerData);

      const gasFee = this.estimateGasFee();
      const minAmountReceived = outputAmount * (1 - params.slippage / 100);

      const fromTokenPrice = this.calculateTokenPrice(params.fromToken);
      const toTokenPrice = this.calculateTokenPrice(params.toToken);

      return {
        inputAmount: params.amount,
        outputAmount: outputAmount.toFixed(toTokenInfo.decimals),
        price: price.toFixed(6),
        priceImpact,
        route: this.getRouteDescription(routerData),
        gasFee,
        minimumAmountReceived: minAmountReceived.toFixed(toTokenInfo.decimals),
        tradeFee: '0',
        fromTokenPrice: fromTokenPrice,
        toTokenPrice: toTokenPrice,
        routerData,
      };
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      return null;
    }
  }

  async executeSwap(
    params: SwapParams,
    signer: Signer
  ): Promise<{ digest: string; status: string } | null> {
    if (!this.aggregatorClient) {
      throw new Error('Aggregator client not initialized');
    }

    console.log('Starting swap execution:', params);

    try {
      const quote = await this.getQuote(params);
      if (!quote || !quote.routerData) {
        throw new Error('Failed to get swap quote');
      }

      console.log('Quote obtained:', quote);

      const fromTokenInfo = TOKENS[params.fromToken];
      const client = suiClientManager.getClient();

      const amount = parseFloat(params.amount);
      const amountIn = new BN(amount * Math.pow(10, fromTokenInfo.decimals));

      console.log('Amount in:', amountIn.toString(), 'Decimals:', fromTokenInfo.decimals);

      const tx = new Transaction();

      let allCoins = await this.getAllCoins(params.walletAddress, fromTokenInfo.address);
      console.log('All coins found:', allCoins.length);

      if (allCoins.length === 0) {
        throw new Error('Insufficient balance');
      }

      const gasReserve = 1000000; // 0.001 SUI in mist (1,000,000 mist = 0.001 SUI)
      const isSuiToken = fromTokenInfo.address === '0x2::sui::SUI';

      let targetCoin: TransactionObjectArgument;
      let gasCoin: TransactionObjectArgument | null = null;

      if (isSuiToken) {
        const totalBalance = allCoins.reduce((sum, coin) => sum + coin.balance, BigInt(0));
        const amountInBN = new BN(amount * Math.pow(10, fromTokenInfo.decimals));
        const requestedAmount = BigInt(amountInBN.toString());

        console.log('Total SUI balance:', (totalBalance / 1_000_000_000n).toString(), 'SUI');
        console.log('Requested swap amount:', (requestedAmount / 1_000_000_000n).toString(), 'SUI');
        console.log('Gas reserve needed:', (BigInt(gasReserve) / 1_000_000_000n).toString(), 'SUI');

        if (totalBalance < requestedAmount + BigInt(gasReserve)) {
          const available = totalBalance - BigInt(gasReserve);
          const availableForSwap = available > 0 ? available : 0n;
          throw new Error(`Insufficient SUI balance. You want to swap ${(requestedAmount / 1_000_000_000n).toString()} SUI, but need ${(BigInt(gasReserve) / 1_000_000_000n).toString()} SUI for gas fees. Available for swap: ${(availableForSwap / 1_000_000_000n).toString()} SUI`);
        }

        if (allCoins.length === 1) {
          const coin = allCoins[0];
          console.log('Single SUI coin found, splitting for swap and gas');

          const coinObject = tx.object(coin.coinObjectId);

          const [swapCoin, splitGasCoin] = tx.splitCoins(
            coinObject,
            [BigInt(amountInBN.toString()), gasReserve]
          );

          targetCoin = swapCoin;
          gasCoin = splitGasCoin;

          console.log('Split swap coin and gas coin successfully');
        } else {
          let coinsForSwap: Array<{ coinObjectId: string; balance: bigint; coinAddress: string }> = allCoins;
          let accumulated = BigInt(0);

          for (const coin of allCoins) {
            if (accumulated >= requestedAmount) break;

            const coinBalance = BigInt(coin.balance);
            const remainingNeeded = requestedAmount - accumulated;

            if (coinBalance <= remainingNeeded) {
              accumulated += coinBalance;
            } else {
              const newCoins = coinsForSwap.filter(c => c.coinObjectId !== coin.coinObjectId);
              coinsForSwap = [...newCoins, { ...coin, balance: remainingNeeded }];
              accumulated = requestedAmount;
            }
          }

          allCoins = coinsForSwap;
          console.log('Coins for swap after gas reserve:', allCoins.length);

          const { targetCoin: builtCoin } = await this.buildInputCoin(
            tx,
            allCoins,
            amountIn
          );
          targetCoin = builtCoin;
        }
      } else {
        const { targetCoin: builtCoin } = await this.buildInputCoin(
          tx,
          allCoins,
          amountIn
        );
        targetCoin = builtCoin;
      }

      console.log('Input coin built');

      const swapParams: BuildRouterSwapParamsV3 = {
        router: quote.routerData,
        inputCoin: targetCoin,
        slippage: params.slippage / 100,
        txb: tx,
      };

      console.log('Swap params prepared');

      const outputCoin = await this.aggregatorClient.routerSwap(swapParams);

      console.log('Router swap completed');

      if (gasCoin) {
        tx.transferObjects([outputCoin, gasCoin], params.walletAddress);
      } else {
        tx.transferObjects([outputCoin], params.walletAddress);
      }

      console.log('Router swap completed');

      tx.transferObjects([outputCoin], params.walletAddress);

      console.log('Transfer objects added, signing transaction...');

      const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: signer,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      console.log('Transaction executed:', result);

      if (result.effects?.status?.status !== 'success') {
        throw new Error('Swap transaction failed');
      }

      return {
        digest: result.digest,
        status: 'success'
      };
    } catch (error) {
      console.error('Failed to execute swap:', error);
      throw error;
    }
  }

  private async getAllCoins(walletAddress: string, coinType: string): Promise<Array<{ coinObjectId: string; balance: bigint; coinAddress: string }>> {
    try {
      const client = suiClientManager.getClient();
      const coins = await client.getCoins({
        owner: walletAddress,
        coinType,
        limit: 100,
      });
      return coins.data.map(coin => ({
        coinObjectId: coin.coinObjectId,
        balance: BigInt(coin.balance),
        coinAddress: coinType,
      }));
    } catch (error) {
      console.error('Failed to get coins:', error);
      return [];
    }
  }

  private async buildInputCoin(
    txb: Transaction,
    allCoins: Array<{ coinObjectId: string; balance: bigint; coinAddress: string }>,
    amount: BN
  ): Promise<{ targetCoin: TransactionObjectArgument }> {
    const selectedCoins: Array<{ coinObjectId: string; balance: bigint; coinAddress: string }> = [];
    const sortedCoins = CoinUtils.sortByBalance(allCoins);
    let remainingAmount = amount;

    for (const coin of sortedCoins) {
      if (remainingAmount.lte(new BN(0))) break;

      const coinBalance = new BN(coin.balance.toString());
      if (coinBalance.lte(remainingAmount)) {
        selectedCoins.push(coin);
        remainingAmount = remainingAmount.sub(coinBalance);
      } else {
        const { objectArray } = CoinUtils.selectCoinObjectIdGreaterThanOrEqual(
          [coin],
          BigInt(remainingAmount.toString()),
          selectedCoins.map(c => c.coinObjectId)
        );
        if (objectArray.length > 0) {
          selectedCoins.push(...sortedCoins.filter(c => objectArray.includes(c.coinObjectId)));
        }
        remainingAmount = new BN(0);
      }
    }

    if (remainingAmount.gt(new BN(0))) {
      throw new Error('Insufficient balance');
    }

    if (selectedCoins.length === 1) {
      return { targetCoin: txb.object(selectedCoins[0].coinObjectId) };
    }

    const mergeCoin = txb.object(selectedCoins[0].coinObjectId);
    for (let i = 1; i < selectedCoins.length; i++) {
      txb.mergeCoins(mergeCoin, [txb.object(selectedCoins[i].coinObjectId)]);
    }

    return { targetCoin: mergeCoin };
  }

  private calculateTokenPrice(tokenSymbol: string): string {
    const tokenPrices: Record<string, string> = {
      SUI: '1.50',
      USDC: '1.00',
      USDT: '1.00',
      CETUS: '0.08',
      WALRUS: '0.25',
      DEEP: '0.05',
      NS: '0.02',
    };

    return tokenPrices[tokenSymbol] || '1.00';
  }

  private calculatePriceImpact(routerData: RouterDataV3): string {
    if (routerData.deviationRatio !== undefined) {
      return (routerData.deviationRatio * 100).toFixed(2);
    }
    return '0.1';
  }

  private estimateGasFee(): string {
    const baseGas = 1000;
    const randomGas = Math.floor(Math.random() * 500);
    const totalGas = baseGas + randomGas;
    return (totalGas / 1_000_000_000).toFixed(6);
  }

  private getRouteDescription(routerData: RouterDataV3): string {
    if (!routerData.paths || routerData.paths.length === 0) {
      return 'Cetus Aggregator';
    }

    const providers = [...new Set(routerData.paths.map(p => p.provider))];
    if (providers.length === 1) {
      return `Cetus (${providers[0]})`;
    }
    return `Cetus Aggregator (${providers.join(' + ')})`;
  }
}

export const swapService = new SwapService();