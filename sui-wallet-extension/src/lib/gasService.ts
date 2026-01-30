export interface GasPrice {
  slow: number;
  average: number;
  fast: number;
  current: number;
  timestamp: number;
}

export interface GasEstimate {
  minFee: number;
  maxFee: number;
  estimatedFee: number;
  estimatedTime: string;
}

export class GasService {
  private static instance: GasService;
  private gasCache: GasPrice | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): GasService {
    if (!GasService.instance) {
      GasService.instance = new GasService();
    }
    return GasService.instance;
  }

  async getGasPrices(): Promise<GasPrice> {
    const cached = this.gasCache;
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Fetch gas prices from Sui RPC or price oracle
      // Mock implementation - replace with actual API calls
      const mockGasPrice: GasPrice = {
        slow: 0.001,
        average: 0.002,
        fast: 0.005,
        current: 0.003,
        timestamp: Date.now(),
      };

      this.gasCache = mockGasPrice;
      return mockGasPrice;
    } catch (error) {
      console.error('Failed to get gas prices:', error);
      
      const fallbackPrice: GasPrice = {
        slow: 0.001,
        average: 0.002,
        fast: 0.005,
        current: 0.003,
        timestamp: Date.now(),
      };

      return fallbackPrice;
    }
  }

  async estimateTransactionFee(
    gasLimit: number,
    gasPrice: 'slow' | 'average' | 'fast' | 'current' = 'average'
  ): Promise<GasEstimate> {
    const gasPrices = await this.getGasPrices();
    const price = gasPrices[gasPrice];

    return {
      minFee: price * gasLimit * 0.9,
      maxFee: price * gasLimit * 1.1,
      estimatedFee: price * gasLimit,
      estimatedTime: this.getEstimatedTime(gasPrice),
    };
  }

  private getEstimatedTime(gasPrice: string): string {
    const times: { [key: string]: string } = {
      slow: '~60s',
      average: '~30s',
      fast: '~15s',
      current: '~30s',
    };

    return times[gasPrice] || '~30s';
  }

  formatGasFee(fee: number, symbol: string = 'SUI'): string {
    return `${fee.toFixed(6)} ${symbol}`;
  }

  getGasLevelColor(gasPrice: 'slow' | 'average' | 'fast'): string {
    const colors = {
      slow: 'text-green-400',
      average: 'text-yellow-400',
      fast: 'text-orange-400',
    };

    return colors[gasPrice] || 'text-yellow-400';
  }

  getGasLevelLabel(gasPrice: 'slow' | 'average' | 'fast'): string {
    const labels = {
      slow: 'Low',
      average: 'Medium',
      fast: 'High',
    };

    return labels[gasPrice] || 'Medium';
  }
}

export const gasService = GasService.getInstance();
