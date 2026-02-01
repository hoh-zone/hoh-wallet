import { useEffect, useState, useRef } from 'react';
import { useWalletStore } from '../store/walletStore';
import { Send, QrCode, ChevronDown, Wallet, ArrowRightLeft, History, TrendingUp, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getShortAddress } from '../lib/utils';
import { priceService } from '../lib/priceService';
import { chartService, PriceChartData } from '../lib/chartService';
import { MoreMenu } from '../components/MoreMenu';

export const Home = () => {
  const navigate = useNavigate();
  const { getAllWallets, currentWalletId, balance, refreshBalance, switchWallet, tokenBalances, refreshTokenBalances, nfts, refreshNFTs, isLoading } = useWalletStore();
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'coin' | 'defi' | 'nft'>('coin');
  const [totalValue, setTotalValue] = useState<number>(0);
  const [chartData, setChartData] = useState<PriceChartData | null>(null);
  const currentWalletRef = useRef<HTMLDivElement>(null);
  const walletListRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);

  // Close wallet selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowWalletSelector(false);
      }
    };

    if (showWalletSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showWalletSelector]);

  // Auto-scroll to current wallet when selector opens
  useEffect(() => {
    if (showWalletSelector && currentWalletRef.current && walletListRef.current) {
      currentWalletRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [showWalletSelector]);

  useEffect(() => {
    if (!currentWallet) {
      console.log('[Home] No current wallet, skipping balance refresh');
      return;
    }

    console.log('[Home] Current wallet:', currentWallet.address);
    console.log('[Home] Initial balance:', balance);

    const loadBalances = async () => {
      console.log('[Home] Loading balances...');
      await refreshBalance();
      await refreshTokenBalances();
      await refreshNFTs();
      console.log('[Home] Balances loaded');
    };

    loadBalances();

    const interval = setInterval(() => {
      loadBalances();
    }, 10000);

    return () => clearInterval(interval);
  }, [currentWalletId]);

  const formattedBalance = balance;
  console.log('[Home] Displaying balance:', formattedBalance, 'type:', typeof formattedBalance);

  // Calculate total portfolio value
  useEffect(() => {
    const total = priceService.calculateTotalValue(tokenBalances.map(token => ({
      symbol: token.symbol,
      formatted: token.formatted,
    })));
    setTotalValue(total);

    // Load chart data for main token (SUI)
    loadChartData('SUI');
  }, [tokenBalances]);

  const loadChartData = async (symbol: string) => {
    try {
      const data = await chartService.getChartData(symbol);
      setChartData(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleSwitchWallet = (walletId: string) => {
    if (isLoading) return;
    switchWallet(walletId);
    setShowWalletSelector(false);
  };

  return (
    <div className="flex flex-col min-h-0">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-b from-hoh-card to-transparent">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative" ref={selectorRef}>
            <div
              className={`flex items-center gap-2 bg-hoh-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                showWalletSelector ? 'bg-hoh-card ring-1 ring-hoh-green' : 'hover:bg-hoh-card'
              }`}
              onClick={() => setShowWalletSelector(!showWalletSelector)}
            >
              <Wallet size={14} className="text-hoh-green" />
              <span className="text-xs font-medium">{currentWallet?.alias || 'Select'}</span>
              <ChevronDown size={12} className={`transition-transform ${showWalletSelector ? 'rotate-180' : ''}`} />
            </div>

            {showWalletSelector && (
              <div ref={walletListRef} className="absolute top-full left-0 mt-2 bg-hoh-card rounded-xl shadow-2xl border border-gray-700 min-w-48 z-50 max-h-80 overflow-y-auto">
                {wallets.map(wallet => (
                  <div
                    key={wallet.id}
                    ref={wallet.id === currentWalletId ? currentWalletRef : null}
                    className={`px-3 py-2.5 cursor-pointer transition-all first:rounded-t-lg last:rounded-b-lg border-b border-gray-800 last:border-b-0 hover:bg-gray-700 ${
                      wallet.id === currentWalletId ? 'bg-hoh-green/10 text-hoh-green' : ''
                    }`}
                    onClick={() => handleSwitchWallet(wallet.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{wallet.alias}</div>
                        <div className="text-xs text-gray-500 truncate">{getShortAddress(wallet.address)}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAddress(wallet.address);
                        }}
                        className="p-1 hover:bg-gray-600 rounded-md transition-colors flex-shrink-0 ml-2"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {wallets.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No wallets
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/receive')}
            className="p-2 hover:bg-hoh-card rounded-lg transition-colors"
          >
            <QrCode size={18} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Balance Display - Compact */}
        <div className="text-center mb-4">
          {isLoading ? (
            <div className="text-3xl font-bold tracking-tight text-gray-400 animate-pulse">
              Loading...
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold tracking-tight mb-1">
                {formattedBalance} <span className="text-xl text-gray-500 ml-1">SUI</span>
              </div>
              {totalValue > 0 && (
                <div className="text-base text-gray-400">${priceService.formatPrice(totalValue)}</div>
              )}
            </>
          )}
        </div>

        {/* Price Change Badge */}
        {chartData && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            chartService.formatPriceChange(chartData.change24h).isPositive 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            <TrendingUp size={14} />
            {chartService.formatPriceChange(chartData.change24h).percentage} (24h)
          </div>
        )}

        {/* Action Buttons - Compact Grid */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => navigate('/send')}
            disabled={isLoading || !currentWallet}
            className="flex flex-col items-center justify-center gap-1.5 bg-hoh-card text-white py-2.5 px-1 rounded-xl hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            <span className="text-xs font-medium">Send</span>
          </button>
          <button
            onClick={() => navigate('/swap')}
            disabled={isLoading || !currentWallet}
            className="flex flex-col items-center justify-center gap-1.5 bg-hoh-card text-white py-2.5 px-1 rounded-xl hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft size={18} />
            <span className="text-xs font-medium">Swap</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            disabled={isLoading || !currentWallet}
            className="flex flex-col items-center justify-center gap-1.5 bg-hoh-card text-white py-2.5 px-1 rounded-xl hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <History size={18} />
            <span className="text-xs font-medium">History</span>
          </button>
          <MoreMenu />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Compact Tabs */}
          <div className="bg-hoh-card rounded-xl p-1 mb-4 flex">
            {[
              { id: 'coin' as const, label: 'Coin', icon: '🪙' },
              { id: 'defi' as const, label: 'DeFi', icon: '💰' },
              { id: 'nft' as const, label: 'NFT', icon: '🎨' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-hoh-green text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'coin' && (
            <div className="space-y-2">
              {tokenBalances.length === 0 ? (
                <div className="bg-hoh-card rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <p className="text-gray-400 text-sm">No tokens yet</p>
                  <p className="text-xs text-gray-600 mt-1">Send or receive tokens to get started</p>
                </div>
              ) : (
                tokenBalances.map((token) => {
                  const priceData = priceService.getPrice(token.symbol);
                  return (
                    <div
                      key={token.symbol}
                      onClick={() => navigate(`/coin/${token.info.address}`)}
                      className="bg-hoh-card rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800 active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${token.info.color} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                          {token.info.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{token.symbol}</div>
                          <div className="text-xs text-gray-500 truncate">{token.info.name}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-sm">{token.formatted}</div>
                        {priceData ? (
                          <div className="text-xs">
                            <span className="text-gray-500">${priceService.formatPrice(priceData.price)}</span>
                            {priceData.change24h !== 0 && (
                              <span className={`ml-2 ${priceData.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {priceService.formatChange(priceData.change24h)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">$ --</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'defi' && (
            <div className="space-y-2">
              <div 
                className="bg-hoh-card rounded-xl p-4 cursor-pointer hover:bg-gray-800 transition-all" 
                onClick={() => navigate('/swap')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      🔄
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Swap</div>
                      <div className="text-xs text-gray-500">Exchange tokens instantly</div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">→</div>
                </div>
              </div>

              {['Liquidity', 'Staking', 'Lending'].map((item, idx) => (
                <div key={item} className="bg-hoh-card rounded-xl p-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${['bg-green-600', 'bg-blue-600', 'bg-yellow-600'][idx]} rounded-lg flex items-center justify-center`}>
                        {['💧', '🏆', '📈'][idx]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{item}</div>
                        <div className="text-xs text-gray-500">{['Add liquidity', 'Stake tokens', 'Borrow or lend'][idx]}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Soon</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'nft' && (
            <div>
              {nfts.length === 0 ? (
                <div className="bg-hoh-card rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <p className="text-gray-400 text-sm">No NFTs yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {nfts.map((nft) => (
                    <div
                      key={nft.id}
                      onClick={() => navigate(`/nft/${nft.id}`)}
                      className="bg-hoh-card rounded-xl overflow-hidden cursor-pointer hover:bg-gray-800 active:scale-[0.99] transition-all"
                    >
                      {nft.imageUrl ? (
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                          🎨
                        </div>
                      )}
                      <div className="p-3">
                        <div className="font-semibold text-sm truncate">{nft.name}</div>
                        <div className="text-xs text-gray-500 truncate">{nft.collection}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
