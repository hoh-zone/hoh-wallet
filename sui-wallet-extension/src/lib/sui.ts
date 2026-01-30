import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

class SuiClientManager {
  private client: SuiClient;
  private currentNetwork: 'mainnet' | 'testnet' = 'mainnet';

  constructor() {
    // Load saved network preference or default to mainnet
    const saved = localStorage.getItem('sui_wallet_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      this.currentNetwork = settings.network || 'mainnet';
    }

    this.client = new SuiClient({
      url: getFullnodeUrl(this.currentNetwork),
    });

    // Listen for network change events
    window.addEventListener('networkChange', (event: any) => {
      this.switchNetwork(event.detail.network);
    });
  }

  getClient(): SuiClient {
    return this.client;
  }

  switchNetwork(network: 'mainnet' | 'testnet') {
    if (network !== this.currentNetwork) {
      this.currentNetwork = network;
      this.client = new SuiClient({
        url: getFullnodeUrl(network),
      });
    }
  }

  getCurrentNetwork(): 'mainnet' | 'testnet' {
    return this.currentNetwork;
  }
}

export const suiClientManager = new SuiClientManager();
export const suiClient = suiClientManager.getClient();

export const FAUCET_URL = 'https://faucet.testnet.sui.io/gas';
