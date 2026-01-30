import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface SecuritySettings {
  requirePasswordForSend: boolean;
  requirePasswordForSwap: boolean;
  requirePasswordForApprove: boolean;
  trustedAddresses: string[];
  phishingProtectionEnabled: boolean;

  setRequirePasswordForSend: (value: boolean) => void;
  setRequirePasswordForSwap: (value: boolean) => void;
  setRequirePasswordForApprove: (value: boolean) => void;
  setTrustedAddresses: (addresses: string[]) => void;
  addTrustedAddress: (address: string) => void;
  removeTrustedAddress: (address: string) => void;
  setPhishingProtectionEnabled: (value: boolean) => void;
  isAddressTrusted: (address: string) => boolean;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const useSecurityStore = create<SecuritySettings>()(
  subscribeWithSelector((set, get) => ({
    // Load initial values from localStorage
    requirePasswordForSend: loadFromStorage('hoh_require_pwd_send', true),
    requirePasswordForSwap: loadFromStorage('hoh_require_pwd_swap', true),
    requirePasswordForApprove: loadFromStorage('hoh_require_pwd_approve', true),
    trustedAddresses: loadFromStorage<string[]>('hoh_trusted_addresses', []),
    phishingProtectionEnabled: loadFromStorage('hoh_phishing_protection', true),

    setRequirePasswordForSend: (value) => {
      localStorage.setItem('hoh_require_pwd_send', JSON.stringify(value));
      set({ requirePasswordForSend: value });
    },

    setRequirePasswordForSwap: (value) => {
      localStorage.setItem('hoh_require_pwd_swap', JSON.stringify(value));
      set({ requirePasswordForSwap: value });
    },

    setRequirePasswordForApprove: (value) => {
      localStorage.setItem('hoh_require_pwd_approve', JSON.stringify(value));
      set({ requirePasswordForApprove: value });
    },

    setTrustedAddresses: (addresses) => {
      localStorage.setItem('hoh_trusted_addresses', JSON.stringify(addresses));
      set({ trustedAddresses: addresses });
    },

    addTrustedAddress: (address) => {
      const current = get().trustedAddresses;
      if (!current.includes(address)) {
        const updated = [...current, address];
        localStorage.setItem('hoh_trusted_addresses', JSON.stringify(updated));
        set({ trustedAddresses: updated });
      }
    },

    removeTrustedAddress: (address) => {
      const current = get().trustedAddresses;
      const updated = current.filter(a => a !== address);
      localStorage.setItem('hoh_trusted_addresses', JSON.stringify(updated));
      set({ trustedAddresses: updated });
    },

    setPhishingProtectionEnabled: (value) => {
      localStorage.setItem('hoh_phishing_protection', JSON.stringify(value));
      set({ phishingProtectionEnabled: value });
    },

    isAddressTrusted: (address) => {
      return get().trustedAddresses.includes(address);
    },
  }))
);

// Helper function to verify password
export const verifySecurityPassword = async (action: string, onVerify: (password: string) => Promise<boolean>): Promise<boolean> => {
  const state = useSecurityStore.getState();

  let requirePassword = false;
  switch (action) {
    case 'send':
      requirePassword = state.requirePasswordForSend;
      break;
    case 'swap':
      requirePassword = state.requirePasswordForSwap;
      break;
    case 'approve':
      requirePassword = state.requirePasswordForApprove;
      break;
  }

  if (!requirePassword) {
    return true;
  }

  const password = prompt('Please enter your password to confirm this action:');
  if (!password) {
    return false;
  }

  try {
    return await onVerify(password);
  } catch {
    return false;
  }
};