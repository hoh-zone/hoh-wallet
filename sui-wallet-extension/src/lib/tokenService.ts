import { suiClientManager } from './sui';
import { TOKENS, TokenInfo } from './tokens';

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  formatted: string;
  info: TokenInfo;
}

export class TokenService {
  private cache: Map<string, TokenBalance> = new Map();
  private cacheTimeout: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getBalance(address: string, tokenSymbol: string): Promise<TokenBalance | null> {
    const token = TOKENS[tokenSymbol];
    if (!token) return null;

    // Check cache
    const cacheKey = `${address}_${tokenSymbol}`;
    const cached = this.cache.get(cacheKey);
    const cacheTime = this.cacheTimeout.get(cacheKey);
    
    if (cached && cacheTime && Date.now() < cacheTime) {
      return cached;
    }

    try {
      const client = suiClientManager.getClient();
      let balance: string;
 console.info("client ",client)
      if (token.isNative) {
        // Native SUI token
        const result = await client.getBalance({ owner: address });
        console.info("xxx ",address,result)
        balance = result.totalBalance;
      } else {
        // ERC20-like token - need to query coin object
        // This is a simplified version - in production you'd need proper token object queries
        const coins = await client.getCoins({
          owner: address,
          coinType: token.address,
        });
        
        balance = coins.data.reduce((acc, coin) => {
          return BigInt(acc) + BigInt(coin.balance);
        }, BigInt(0)).toString();
      }

      const tokenBalance: TokenBalance = {
        symbol: token.symbol,
        balance,
        decimals: token.decimals,
        formatted: this.formatBalance(balance, token.decimals),
        info: token,
      };

      // Update cache
      this.cache.set(cacheKey, tokenBalance);
      this.cacheTimeout.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return tokenBalance;
    } catch (error) {
      console.error(`Failed to fetch balance for ${tokenSymbol}:`, error);
      return null;
    }
  }

  async getAllBalances(address: string, tokens: string[] = Object.keys(TOKENS)): Promise<TokenBalance[]> {
    const balances = await Promise.all(
      tokens.map(token => this.getBalance(address, token))
    );

    return balances.filter((balance): balance is TokenBalance => balance !== null);
  }

  formatBalance(balance: string, decimals: number, maxDecimals: number = 6): string {
    console.log(`[formatBalance] Input balance: ${balance}, decimals: ${decimals}, maxDecimals: ${maxDecimals}`);
    
    const divisor = BigInt(10 ** decimals);
    const balanceBigInt = BigInt(balance);
    
    const value = balanceBigInt / divisor;
    const remainder = balanceBigInt % divisor;
    
    if (remainder === BigInt(0)) {
      const result = value.toString();
      console.log(`[formatBalance] No remainder, result: ${result}`);
      return result;
    }

    const remainderStr = remainder.toString().padStart(decimals, '0');
    
    // Remove trailing zeros after maxDecimals
    let formatted = remainderStr;
    const trailingZeros = formatted.length > maxDecimals ? formatted.length - maxDecimals : 0;
    if (trailingZeros > 0) {
      formatted = formatted.slice(0, -trailingZeros);
    }
    
    // Remove trailing zeros
    formatted = formatted.replace(/0+$/, '');
    
    if (formatted.length === 0) {
      const result = value.toString();
      console.log(`[formatBalance] Empty remainder, result: ${result}`);
      return result;
    }
    
    const result = `${value}.${formatted}`;
    console.log(`[formatBalance] Final result: ${result}`);
    return result;
  }

  async getTokenPrice(tokenSymbol: string): Promise<number> {
    // In production, you'd integrate with a price oracle like CoinGecko, CoinMarketCap, or Pyth
    // For now, return mock prices
    const mockPrices: Record<string, number> = {
      SUI: 1.5,
      USDC: 1.0,
      USDT: 1.0,
      WETH: 3500,
      WBTC: 98000,
      CETUS: 0.15,
      NAVI: 0.02,
      SCA: 0.01,
      TURBOS: 0.005,
      AFSUI: 0.001,
    };

    return mockPrices[tokenSymbol] || 0;
  }

  async getTokenValue(tokenBalance: TokenBalance): Promise<number> {
    const price = await this.getTokenPrice(tokenBalance.symbol);
    const amount = parseFloat(tokenBalance.formatted);
    return amount * price;
  }

  clearCache(address?: string): void {
    if (address) {
      // Clear cache for specific address
      for (const key of this.cache.keys()) {
        if (key.startsWith(address + '_')) {
          this.cache.delete(key);
          this.cacheTimeout.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
      this.cacheTimeout.clear();
    }
  }
}

export const tokenService = new TokenService();