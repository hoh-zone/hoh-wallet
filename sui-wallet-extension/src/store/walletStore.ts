import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateMnemonic } from 'bip39';
import { suiClientManager } from '../lib/sui';
import { WalletCrypto } from '../lib/crypto';
import { tokenService, TokenBalance } from '../lib/tokenService';
import { DEFAULT_TOKENS } from '../lib/tokens';
import { NFT } from '../lib/nftService';

type WalletSource = 'mnemonic' | 'privateKey';

interface Wallet {
  id: string;
  groupId: string;
  address: string;
  alias: string;
  derivationPath: string | null;
  keypair: Ed25519Keypair;
}

interface WalletGroup {
  id: string;
  name: string;
  type: WalletSource;
  source: string;
  wallets: Wallet[];
}

interface WalletState {
  walletGroups: WalletGroup[];
  currentWalletId: string | null;
  balance: string;
  tokenBalances: TokenBalance[];
  nfts: NFT[];
  isLoading: boolean;
  isLocked: boolean;
  createWallet: (password: string, mnemonic?: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  importMnemonicWallet: (mnemonic: string, password: string, groupName?: string) => Promise<boolean>;
  importPrivateKeyWallet: (privateKey: string, password: string, groupName?: string) => Promise<boolean>;
  addWalletToGroup: (groupId: string, count?: number) => Promise<void>;
  removeWallet: (walletId: string) => void;
  renameWallet: (walletId: string, newAlias: string) => void;
  renameGroup: (groupId: string, newName: string) => void;
  exportWalletsToCSV: () => string;
  switchWallet: (walletId: string) => void;
  refreshBalance: () => Promise<void>;
  refreshTokenBalances: () => Promise<void>;
  refreshNFTs: () => Promise<void>;
  logout: () => void;
  deriveWallet: (mnemonic: string, derivationPath: string) => Promise<Wallet>;
  importPrivateKey: (privateKey: string) => Promise<Wallet>;
  getAllWallets: () => Wallet[];
  getCurrentWallet: () => Wallet | null;
}

export const useWalletStore = create<WalletState>()(
  subscribeWithSelector((set, get) => ({
  walletGroups: [],
  currentWalletId: null,
  balance: '0',
  tokenBalances: [],
  nfts: [],
  isLoading: false,
  isLocked: !!localStorage.getItem('sui_wallet_groups'),

  getAllWallets: () => {
    const { walletGroups } = get();
    const allWallets: Wallet[] = [];
    walletGroups.forEach(group => {
      allWallets.push(...group.wallets);
    });
    return allWallets;
  },

  getCurrentWallet: () => {
    const { currentWalletId } = get();
    const allWallets = get().getAllWallets();
    return allWallets.find(w => w.id === currentWalletId) || null;
  },

  createWallet: async (password: string, providedMnemonic?: string) => {
    set({ isLoading: true });
    try {
      const mnemonic = providedMnemonic || generateMnemonic();
      const groupId = `group_${Date.now()}`;

      // Encrypt and store each source separately
      const encryptedData = await WalletCrypto.encrypt(JSON.stringify({
        type: 'mnemonic',
        value: mnemonic
      }), password);
      localStorage.setItem(`wallet_source_${groupId}`, encryptedData);

      // Create first wallet (default derivation path)
      const wallet = await get().deriveWallet(mnemonic, "m/44'/784'/0'/0'/0'");
      wallet.groupId = groupId;
      wallet.alias = 'Wallet 1';

      const group: WalletGroup = {
        id: groupId,
        name: 'Wallet Group 1',
        type: 'mnemonic',
        source: mnemonic,
        wallets: [wallet]
      };

      set({
        walletGroups: [group],
        currentWalletId: wallet.id,
        isLocked: false,
        isLoading: false
      });

      await get().refreshBalance();
      await get().refreshTokenBalances();
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  unlockWallet: async (password: string) => {
    set({ isLoading: true });
    try {
      // Load wallet groups from localStorage
      const storedGroups = localStorage.getItem('sui_wallet_groups');
      let walletGroups: WalletGroup[] = [];

      if (storedGroups) {
        const groupData = JSON.parse(storedGroups);
        walletGroups = await Promise.all(groupData.map(async (group: any) => {
          // Decrypt source for each group
          const encryptedSource = localStorage.getItem(`wallet_source_${group.id}`);
          let source = '';

          if (encryptedSource) {
            const decrypted = await WalletCrypto.decrypt(encryptedSource, password);
            const parsed = JSON.parse(decrypted);
            source = parsed.value;
          }

          // Re-derive wallets
          const wallets = await Promise.all(group.wallets.map(async (w: any) => {
            let keypair: Ed25519Keypair;
            if (group.type === 'mnemonic' && w.derivationPath) {
              keypair = Ed25519Keypair.deriveKeypair(source, w.derivationPath);
            } else {
              keypair = Ed25519Keypair.fromSecretKey(source);
            }

            return {
              ...w,
              keypair,
              groupId: group.id
            };
          }));

          return {
            ...group,
            source,
            wallets
          };
        }));
      }

      set({
        walletGroups,
        currentWalletId: walletGroups[0]?.wallets[0]?.id || null,
        isLocked: false,
        isLoading: false
      });

      await get().refreshBalance();
      await get().refreshTokenBalances();
      await get().refreshNFTs();
      return true;
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
      return false;
    }
  },

  importMnemonicWallet: async (mnemonic: string, password: string, groupName?: string) => {
    set({ isLoading: true });
    try {
      // Validate mnemonic
      Ed25519Keypair.deriveKeypair(mnemonic, "m/44'/784'/0'/0'/0'");

      const groupId = `group_${Date.now()}`;

      // Encrypt and store the mnemonic
      const encryptedData = await WalletCrypto.encrypt(JSON.stringify({
        type: 'mnemonic',
        value: mnemonic
      }), password);
      localStorage.setItem(`wallet_source_${groupId}`, encryptedData);

      // Create default wallet
      const wallet = await get().deriveWallet(mnemonic, "m/44'/784'/0'/0'/0'");
      wallet.groupId = groupId;
      wallet.alias = 'Wallet 1';

      const group: WalletGroup = {
        id: groupId,
        name: groupName || `Wallet Group ${get().walletGroups.length + 1}`,
        type: 'mnemonic',
        source: mnemonic,
        wallets: [wallet]
      };

      set(state => ({
        walletGroups: [...state.walletGroups, group],
        currentWalletId: wallet.id,
        isLocked: false,
        isLoading: false
      }));

      await get().refreshBalance();
      return true;
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
      return false;
    }
  },

  importPrivateKeyWallet: async (privateKey: string, password: string, groupName?: string) => {
    set({ isLoading: true });
    try {
      // Validate private key
      Ed25519Keypair.fromSecretKey(privateKey);

      const groupId = `group_${Date.now()}`;

      // Encrypt and store the private key
      const encryptedData = await WalletCrypto.encrypt(JSON.stringify({
        type: 'privateKey',
        value: privateKey
      }), password);
      localStorage.setItem(`wallet_source_${groupId}`, encryptedData);

      // Create wallet from private key
      const wallet = await get().importPrivateKey(privateKey);
      wallet.groupId = groupId;
      wallet.alias = 'Wallet 1';

      const group: WalletGroup = {
        id: groupId,
        name: groupName || `Wallet Group ${get().walletGroups.length + 1}`,
        type: 'privateKey',
        source: privateKey,
        wallets: [wallet]
      };

      set(state => ({
        walletGroups: [...state.walletGroups, group],
        currentWalletId: wallet.id,
        isLocked: false,
        isLoading: false
      }));

      await get().refreshBalance();
      return true;
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
      return false;
    }
  },

  refreshBalance: async () => {
    const currentWallet = get().getCurrentWallet();
    if (!currentWallet) {
      console.log('[refreshBalance] No current wallet found');
      return;
    }

    try {
      console.log('[refreshBalance] Fetching balance for address:', currentWallet.address);
      const client = suiClientManager.getClient();
      const balance = await client.getBalance({ owner: currentWallet.address });

      console.log('[refreshBalance] Raw balance:', balance.totalBalance);

      // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
      const formattedSUI = tokenService.formatBalance(balance.totalBalance, 9, 6);
      console.log('[refreshBalance] Balance after formatting:', formattedSUI, 'type:', typeof formattedSUI);

      console.log('[refreshBalance] Formatted balance:', formattedSUI);

      set({
        balance: formattedSUI
      });
    } catch (e) {
      console.error("[refreshBalance] Failed to fetch balance:", e);
    }
  },

  deriveWallet: async (mnemonic: string, derivationPath: string): Promise<Wallet> => {
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic, derivationPath);
    const address = keypair.getPublicKey().toSuiAddress();

    return {
      id: `${address}_${Date.now()}`,
      groupId: '',
      address,
      alias: '',
      derivationPath,
      keypair
    };
  },

  importPrivateKey: async (privateKey: string): Promise<Wallet> => {
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const address = keypair.getPublicKey().toSuiAddress();

    return {
      id: `${address}_${Date.now()}`,
      groupId: '',
      address,
      alias: '',
      derivationPath: null,
      keypair
    };
  },

  addWalletToGroup: async (groupId: string, count = 1) => {
    const { walletGroups } = get();
    const group = walletGroups.find(g => g.id === groupId);
    if (!group) return;

    if (group.type !== 'mnemonic') {
      throw new Error('Cannot add wallet to private key group');
    }

    // Check total limit
    if (group.wallets.length + count > 1000) {
      throw new Error('Cannot create more than 1000 wallets in a single group');
    }

    set({ isLoading: true });
    try {
      const existingPaths = group.wallets.map(w => w.derivationPath).filter(Boolean);
      const newWallets: Wallet[] = [];

      for (let i = 0; i < count; i++) {
        // Find next available derivation path
        let index = 0;
        let path = `m/44'/784'/${index}'/0'/0'`;
        while (existingPaths.includes(path) || newWallets.some(w => w.derivationPath === path)) {
          index++;
          path = `m/44'/784'/${index}'/0'/0'`;
        }

        const newWallet = await get().deriveWallet(group.source, path);
        newWallet.groupId = groupId;
        newWallet.alias = `Wallet ${group.wallets.length + i + 1}`;
        newWallets.push(newWallet);
      }

      set(state => ({
        walletGroups: state.walletGroups.map(g =>
          g.id === groupId
            ? { ...g, wallets: [...g.wallets, ...newWallets] }
            : g
        ),
        isLoading: false
      }));
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
      throw e;
    }
  },

  removeWallet: (walletId: string) => {
    set(state => {
      let newCurrentId = state.currentWalletId;

      const updatedGroups = state.walletGroups.map(group => {
        const newWallets = group.wallets.filter(w => w.id !== walletId);

        if (state.currentWalletId === walletId) {
          // Find next available wallet
          const allWallets = state.walletGroups.flatMap(g => g.wallets).filter(w => w.id !== walletId);
          newCurrentId = allWallets[0]?.id || null;
        }

        return {
          ...group,
          wallets: newWallets
        };
      }).filter(g => g.wallets.length > 0);

      return {
        walletGroups: updatedGroups,
        currentWalletId: newCurrentId
      };
    });
  },

  renameWallet: (walletId: string, newAlias: string) => {
    set(state => ({
      walletGroups: state.walletGroups.map(group => ({
        ...group,
        wallets: group.wallets.map(wallet =>
          wallet.id === walletId ? { ...wallet, alias: newAlias } : wallet
        )
      }))
    }));
  },

  renameGroup: (groupId: string, newName: string) => {
    set(state => ({
      walletGroups: state.walletGroups.map(group =>
        group.id === groupId ? { ...group, name: newName } : group
      )
    }));
  },

  exportWalletsToCSV: () => {
    const { walletGroups } = get();

    const headers = ['Group Name', 'Wallet Name', 'Address', 'Derivation Path'];
    const rows = walletGroups.flatMap(group =>
      group.wallets.map(wallet => [
        group.name,
        wallet.alias,
        wallet.address,
        wallet.derivationPath || 'N/A'
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  switchWallet: (walletId: string) => {
    set({ currentWalletId: walletId });
  },

  logout: () => {
    localStorage.removeItem('sui_wallet_groups');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wallet_source_')) {
        localStorage.removeItem(key);
      }
    });
    set({
      walletGroups: [],
      currentWalletId: null,
      balance: '0',
      tokenBalances: [],
      nfts: [],
      isLocked: false
    });
  },

  refreshTokenBalances: async () => {
    const currentWallet = get().getCurrentWallet();
    if (!currentWallet) return;

    try {
      const balances = await tokenService.getAllBalances(currentWallet.address, DEFAULT_TOKENS);
      set({ tokenBalances: balances });
    } catch (e) {
      console.error('Failed to fetch token balances:', e);
    }
  },

  refreshNFTs: async () => {
    const currentWallet = get().getCurrentWallet();
    if (!currentWallet) return;

    try {
      const { nftService } = await import('../lib/nftService');
      const nfts = await nftService.getNFTs(currentWallet.address);
      set({ nfts });
    } catch (e) {
      console.error('Failed to fetch NFTs:', e);
    }
  }
}))
);

// Subscribe to wallet groups to save to localStorage
useWalletStore.subscribe(
  (state) => state.walletGroups,
  (walletGroups) => {
    if (walletGroups.length > 0) {
      const groupsToSave = walletGroups.map(group => ({
        ...group,
        source: '' // Don't store the source (mnemonic/private key)
      }));
      localStorage.setItem('sui_wallet_groups', JSON.stringify(groupsToSave));
    } else {
      localStorage.removeItem('sui_wallet_groups');
    }
  }
);
