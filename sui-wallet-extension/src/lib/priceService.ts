interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: number;
}

class PriceService {
  private prices: Map<string, TokenPrice> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private staticPrices: Record<string, { price: number; change24h: number }> = {
    SUI: { price: 1.50, change24h: 2.5 },
    USDC: { price: 1.00, change24h: 0.0 },
    USDT: { price: 1.00, change24h: 0.0 },
    CETUS: { price: 0.08, change24h: -1.2 },
    WALRUS: { price: 0.25, change24h: 5.8 },
    DEEP: { price: 0.05, change24h: -3.4 },
    NS: { price: 0.02, change24h: 8.2 },
  };

  constructor() {
    this.loadPricesFromStorage();
    this.startPriceUpdates();
  }

  private loadPricesFromStorage() {
    try {
      const stored = localStorage.getItem('hoh_token_prices');
      if (stored) {
        const data = JSON.parse(stored) as Record<string, TokenPrice>;
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [symbol, price] of Object.entries(data)) {
          if (now - price.timestamp < maxAge) {
            this.prices.set(symbol, price);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load prices from storage:', error);
    }
  }

  private savePricesToStorage() {
    try {
      const data = Object.fromEntries(this.prices);
      localStorage.setItem('hoh_token_prices', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save prices to storage:', error);
    }
  }

  private startPriceUpdates() {
    this.updateInterval = setInterval(() => {
      this.updatePrices();
    }, 5 * 60 * 1000);

    this.updatePrices();
  }

  private async updatePrices() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true'
      );

      if (response.ok) {
        const data = await response.json();

        if (data.sui) {
          this.prices.set('SUI', {
            symbol: 'SUI',
            price: data.sui.usd,
            change24h: data.sui.usd_24h_change || 0,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch prices, using fallback:', error);

      for (const [symbol, priceData] of Object.entries(this.staticPrices)) {
        this.prices.set(symbol, {
          symbol,
          price: priceData.price,
          change24h: priceData.change24h,
          timestamp: Date.now(),
        });
      }
    }

    this.savePricesToStorage();
  }

  getPrice(symbol: string): TokenPrice | null {
    const price = this.prices.get(symbol);
    if (!price) {
      const fallback = this.staticPrices[symbol];
      if (fallback) {
        return {
          symbol,
          price: fallback.price,
          change24h: fallback.change24h,
          timestamp: Date.now(),
        };
      }
    }
    return price || null;
  }

  formatPrice(price: number): string {
    return price < 0.01
      ? price.toFixed(6)
      : price < 1
      ? price.toFixed(4)
      : price.toFixed(2);
  }

  formatChange(change24h: number): string {
    return `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
  }

  calculateTotalValue(balances: { symbol: string; formatted: string }[]): number {
    let total = 0;

    for (const balance of balances) {
      const price = this.getPrice(balance.symbol);
      if (price) {
        const amount = parseFloat(balance.formatted);
        total += amount * price.price;
      }
    }

    return total;
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const priceService = new PriceService();
