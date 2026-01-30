import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface CustomToken {
  id: string;
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoUrl?: string;
  color?: string;
}

interface CustomTokenState {
  customTokens: CustomToken[];
  addCustomToken: (token: CustomToken) => void;
  removeCustomToken: (tokenId: string) => void;
  updateCustomToken: (tokenId: string, token: Partial<CustomToken>) => void;
}

export const useCustomTokenStore = create<CustomTokenState>()(
  subscribeWithSelector((set, get) => ({
    customTokens: JSON.parse(localStorage.getItem('hoh_custom_tokens') || '[]'),

    addCustomToken: (token) => {
      const { customTokens } = get();
      // Check if token already exists
      if (customTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
        throw new Error('Token already exists');
      }

      const newTokens = [...customTokens, token];
      localStorage.setItem('hoh_custom_tokens', JSON.stringify(newTokens));
      set({ customTokens: newTokens });
    },

    removeCustomToken: (tokenId) => {
      const { customTokens } = get();
      const newTokens = customTokens.filter(t => t.id !== tokenId);
      localStorage.setItem('hoh_custom_tokens', JSON.stringify(newTokens));
      set({ customTokens: newTokens });
    },

    updateCustomToken: (tokenId, updates) => {
      const { customTokens } = get();
      const newTokens = customTokens.map(t =>
        t.id === tokenId ? { ...t, ...updates } : t
      );
      localStorage.setItem('hoh_custom_tokens', JSON.stringify(newTokens));
      set({ customTokens: newTokens });
    },
  }))
);
