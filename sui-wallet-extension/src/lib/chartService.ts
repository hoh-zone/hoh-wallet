import { priceService } from './priceService';

export interface PriceDataPoint {
  timestamp: number;
  price: number;
}

export interface PriceChartData {
  symbol: string;
  change24h: number;
  change7d: number;
  change1y: number;
  chart24h: PriceDataPoint[];
  chart7d: PriceDataPoint[];
  chart1y: PriceDataPoint[];
}

export class ChartService {
  private static instance: ChartService;
  private cache: Map<string, PriceChartData> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  private constructor() {}

  static getInstance(): ChartService {
    if (!ChartService.instance) {
      ChartService.instance = new ChartService();
    }
    return ChartService.instance;
  }

  async getChartData(symbol: string): Promise<PriceChartData> {
    const cacheKey = `chart_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.chart24h[0]?.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Generate mock price history (replace with actual price API)
      const chartData = await this.generateChartData(symbol);
      
      this.cache.set(cacheKey, chartData);
      return chartData;
    } catch (error) {
      console.error('Failed to get chart data:', error);
      
      // Return fallback data
      return this.generateFallbackChartData(symbol);
    }
  }

  private async generateChartData(symbol: string): Promise<PriceChartData> {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Generate 24h data points
    const chart24h: PriceDataPoint[] = [];
    const chart7d: PriceDataPoint[] = [];
    const chart1y: PriceDataPoint[] = [];
    
    const priceInfo = priceService.getPrice(symbol);
    const basePrice = priceInfo ? parseFloat(String(priceInfo.price)) : 1.0;
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = now - (24 - i) * 60 * 60 * 1000;
      const variation = (Math.random() - 0.5) * 0.1; // 10% variation
      const price = basePrice * (1 + variation);
      
      chart24h.push({ timestamp, price });
    }
    
    for (let i = 7; i >= 0; i--) {
      const timestamp = now - (7 - i) * dayInMs;
      const variation = (Math.random() - 0.5) * 0.15; // 15% variation
      const price = basePrice * (1 + variation);
      
      chart7d.push({ timestamp, price });
    }
    
    for (let i = 12; i >= 0; i--) {
      const timestamp = now - i * dayInMs;
      const variation = (Math.random() - 0.5) * 0.2; // 20% variation
      const price = basePrice * (1 + variation);
      
      chart1y.push({ timestamp, price });
    }
    
    const change24h = chart24h[0]?.price ? ((chart24h[chart24h.length - 1]?.price / chart24h[0]?.price - 1) * 100) : 0;
    const change7d = chart7d[0]?.price ? ((chart7d[chart7d.length - 1]?.price / chart7d[0]?.price - 1) * 100) : 0;
    const change1y = chart1y[0]?.price ? ((chart1y[chart1y.length - 1]?.price / chart1y[0]?.price - 1) * 100) : 0;

    return {
      symbol,
      change24h,
      change7d,
      change1y,
      chart24h,
      chart7d,
      chart1y,
    };
  }

  private generateFallbackChartData(symbol: string): PriceChartData {
    return {
      symbol,
      change24h: 0,
      change7d: 0,
      change1y: 0,
      chart24h: Array(24).fill(0).map((_, i) => ({
        timestamp: Date.now() - (23 - i) * 60 * 60 * 1000,
        price: 1.0,
      })),
      chart7d: Array(7).fill(0).map((_, i) => ({
        timestamp: Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
        price: 1.0,
      })),
      chart1y: Array(12).fill(0).map((_, i) => ({
        timestamp: Date.now() - (11 - i) * 30 * 24 * 60 * 1000,
        price: 1.0,
      })),
    };
  }

  formatPriceChange(change: number): { percentage: string, isPositive: boolean } {
    const formatted = Math.abs(change).toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return {
      percentage: `${sign}${formatted}%`,
      isPositive: change >= 0,
    };
  }
}

export const chartService = ChartService.getInstance();
