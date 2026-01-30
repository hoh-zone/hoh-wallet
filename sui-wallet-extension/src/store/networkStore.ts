import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Network {
  id: string;
  name: string;
  chainId: string;
  rpcUrl: string;
  explorerUrl: string;
  isDefault: boolean;
  isCustom: boolean;
}

export interface NetworkState {
  networks: Network[];
  currentNetwork: string;
  switchNetwork: (networkId: string) => void;
  addCustomNetwork: (network: Omit<Network, 'id'>) => void;
  removeNetwork: (networkId: string) => void;
  updateNetwork: (networkId: string, updates: Partial<Network>) => void;
  exportNetworks: () => Network[];
}

const DEFAULT_NETWORKS: Network[] = [
  {
    id: 'mainnet',
    name: 'Sui Mainnet',
    chainId: 'sui:mainnet',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    explorerUrl: 'https://suiscan.xyz',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'testnet',
    name: 'Sui Testnet',
    chainId: 'sui:testnet',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    explorerUrl: 'https://suiscan.xyz/testnet',
    isDefault: false,
    isCustom: false,
  },
];

export const useNetworkStore = create<NetworkState>()(
  subscribeWithSelector((set, get) => ({
    networks: DEFAULT_NETWORKS,
    currentNetwork: localStorage.getItem('hoh_current_network') || 'mainnet',

    switchNetwork: (networkId) => {
      const { networks } = get();
      const network = networks.find(n => n.id === networkId);
      if (!network) throw new Error('Network not found');

      localStorage.setItem('hoh_current_network', networkId);
      
      // Reconnect wallet with new network
      // Implementation would go here
      
      set({ currentNetwork: networkId });
    },

    addCustomNetwork: (network) => {
      const { networks } = get();
      const newNetworks = [...networks, {
        ...network,
        id: `custom_${Date.now()}`,
        isDefault: false,
        isCustom: true,
      }];

      localStorage.setItem('hoh_custom_networks', JSON.stringify(newNetworks));
      set({ networks: newNetworks });
    },

    removeNetwork: (networkId) => {
      const { networks } = get();
      const newNetworks = networks.filter(n => n.id !== networkId);

      localStorage.setItem('hoh_custom_networks', JSON.stringify(newNetworks.filter(n => !n.isCustom)));
      set({ networks: newNetworks });

      // Switch to default if current is removed
      if (get().currentNetwork === networkId) {
        set({ currentNetwork: 'mainnet' });
      }
    },

    updateNetwork: (networkId, updates) => {
      const { networks } = get();
      const newNetworks = networks.map(n =>
        n.id === networkId ? { ...n, ...updates } : n
      );

      localStorage.setItem('hoh_custom_networks', JSON.stringify(newNetworks.filter(n => !n.isCustom)));
      set({ networks: newNetworks });
    },

    exportNetworks: () => {
      const { networks } = get();
      return networks;
    },
  }))
);
