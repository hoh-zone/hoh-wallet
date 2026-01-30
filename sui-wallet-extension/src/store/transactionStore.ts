import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type TransactionType = 'send' | 'receive' | 'swap' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  txDigest?: string;
  blockNumber?: number;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransactionStatus: (txDigest: string, status: Transaction['status']) => void;
  loadTransactions: (address: string) => Promise<void>;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  subscribeWithSelector((set, get) => ({
    transactions: [],
    isLoading: false,

      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));

        // Save to localStorage
        const { transactions } = get();
        localStorage.setItem('sui_wallet_transactions', JSON.stringify(transactions));
      },

      updateTransactionStatus: (txDigest, status) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.txDigest === txDigest ? { ...tx, status } : tx
          ),
        }));
        const { transactions } = get();
        localStorage.setItem('sui_wallet_transactions', JSON.stringify(transactions));
      },

      loadTransactions: async () => {
    set({ isLoading: true });
    try {
      // Load from localStorage first
      const saved = localStorage.getItem('sui_wallet_transactions');
      let storedTransactions: Transaction[] = [];
      if (saved) {
        storedTransactions = JSON.parse(saved);
      }

      // Fetch transactions from Sui blockchain
      // Note: In production, implement proper event filtering
      // For now, just return stored transactions
      // await client.queryEvents({});

        // Process transactions from blockchain
        // Note: In production, you'd need to properly parse transaction data
        // This is a simplified version for the prototype

        set({ 
          transactions: storedTransactions,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to load transactions:', error);
        
        // Fallback to localStorage
        const saved = localStorage.getItem('sui_wallet_transactions');
        if (saved) {
          set({ 
            transactions: JSON.parse(saved),
            isLoading: false
          });
        } else {
          set({ isLoading: false });
        }
      }
    },

  clearTransactions: () => {
    set({ transactions: [] });
    localStorage.removeItem('sui_wallet_transactions');
  }
}))
);