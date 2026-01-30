// Simple internationalization utility
type Translations = {
  [key: string]: {
    en: string;
    zh: string;
  };
};

const translations: Translations = {
  // Common
  'settings': { en: 'Settings', zh: '设置' },
  'language': { en: 'Language', zh: '语言' },
  'network': { en: 'Network', zh: '网络' },
  'theme': { en: 'Theme', zh: '主题' },
  'wallets': { en: 'Wallets', zh: '钱包' },
  'home': { en: 'Home', zh: '首页' },
  'swap': { en: 'Swap', zh: '兑换' },
  'history': { en: 'History', zh: '历史' },

  // Network
  'mainnet': { en: 'Mainnet', zh: '主网' },
  'testnet': { en: 'Testnet', zh: '测试网' },
  'production_network': { en: 'Production network', zh: '生产网络' },
  'testing_network': { en: 'Testing network', zh: '测试网络' },

  // Theme
  'dark': { en: 'Dark', zh: '深色' },
  'light': { en: 'Light', zh: '浅色' },

  // Wallet Management
  'add_new_wallet': { en: 'Add New Wallet', zh: '添加新钱包' },
  'wallet_1': { en: 'Wallet 1', zh: '钱包 1' },
  'active': { en: 'Active', zh: '活跃' },
  'reset_wallet': { en: 'Reset Wallet', zh: '重置钱包' },

  // Welcome
  'create_wallet': { en: 'Create Wallet', zh: '创建钱包' },
  'import_wallet': { en: 'Import Wallet', zh: '导入钱包' },
  'unlock_wallet': { en: 'Unlock Wallet', zh: '解锁钱包' },
  'enter_password': { en: 'Enter password', zh: '输入密码' },

  // Common actions
  'cancel': { en: 'Cancel', zh: '取消' },
  'confirm': { en: 'Confirm', zh: '确认' },
  'save': { en: 'Save', zh: '保存' },
  'delete': { en: 'Delete', zh: '删除' },
};

export const t = (key: string): string => {
  const settings = localStorage.getItem('sui_wallet_settings');
  const language = settings ? JSON.parse(settings).language : 'en';
  const translation = translations[key];
  return translation ? translation[language as keyof typeof translation] || key : key;
};