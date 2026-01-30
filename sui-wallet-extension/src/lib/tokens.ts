export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  color: string;
  isNative: boolean;
  logoURI: string;
}

export const TOKENS: Record<string, TokenInfo> = {
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    address: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    decimals: 9,
    icon: 'SUI',
    color: 'bg-blue-600',
    isNative: true,
    logoURI:"",
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x5d4b302506645c37ff133b971b3f4534aa4d69321b836b6d52479b4747595c6b::wusdc::WUSDC',
    decimals: 6,
    icon: 'USDC',
    color: 'bg-blue-500',
    isNative: false,
    logoURI: 'https://firebasestorage.googleapis.com/v0/b/drife-dubai-prod.appspot.com/o/drife_logo_round.png?alt=media&token=cb96bd23-5a08-4015-b1d2-e89114434d4f',
  },
  CETUS: {
    symbol: 'CETUS',
    name: 'Cetus',
    address: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    decimals: 9,
    icon: 'CETUS',
    color: 'bg-cyan-500',
    isNative: false,
    logoURI: 'https://storage.googleapis.com/tokenimage.deloreanlabs.com/DMCTokenIcon.svg',
  },
  WALRUS: {
    symbol: 'WALRUS',
    name: 'WAL Token',
    address: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
    decimals: 9,
    icon: 'WALRUS',
    color: 'bg-cyan-600',
    isNative: false,
    logoURI: 'https://www.walrus.xyz/wal-icon.svg',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x5d4b302506645c37ff133b971b3f4534aa4d69321b836b6d52479b4747595c6b::wusdt::WUSDT',
    decimals: 6,
    icon: 'USDT',
    color: 'bg-green-500',
    isNative: false,
    logoURI: '',
  },
  DEEP: {
    symbol: 'DEEP',
    name: 'Deep',
    address: '0x3766e534b5dc6cdb7defd998debf19f72565f4a7b8224e36b050f690b71a8819::boom::BOOM',
    decimals: 6,
    icon: 'DEEP',
    color: 'bg-purple-600',
    isNative: false,
    logoURI: 'https://ipfs.io/ipfs/bafybeidcrjtdybxdkgxbi55ghmwpkcxkj2gwvzgchqx6ht2xxrqmatnfsi',
  },
  NS: {
    symbol: 'NS',
    name: 'aaa cat',
    address: '0xd976fda9a9786cda1a36dee360013d775a5e5f206f8e20f84fad3385e99eeb2d::aaa::AAA',
    decimals: 6,
    icon: 'NS',
    color: 'bg-green-600',
    isNative: false,
    logoURI: 'https://api.movepump.com/uploads/IMG_4995_cfd6177d03.jpeg',
  },
};

export const DEFAULT_TOKENS = ['SUI', 'USDC', 'USDT', 'WALRUS', 'DEEP', 'NS', 'CETUS'];

export const getSymbolByAddress = (address: string): string | null => {
  for (const [symbol, tokenInfo] of Object.entries(TOKENS)) {
    if (tokenInfo.address === address) {
      return symbol;
    }
  }
  return null;
};

export const getTokenByAddress = (address: string): TokenInfo | null => {
  for (const [_symbol, tokenInfo] of Object.entries(TOKENS)) {
    if (tokenInfo.address === address) {
      return tokenInfo;
    }
  }
  return null;
};