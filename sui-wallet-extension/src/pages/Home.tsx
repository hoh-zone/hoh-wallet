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
  const [showPriceChart, setShowPriceChart] = useState(false);
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
  }, [currentWalletId]); // Only re-run when wallet changes

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

  const handleTogglePriceChart = () => {
    setShowPriceChart(!showPriceChart);
    if (!showPriceChart) {
      loadChartData('SUI');
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
    <div className="flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        {/* Header */}
        <div className="flex justify-between items-center mt-2 mb-6">
          <div className="relative" ref={selectorRef}>
            <div
              className={`flex items-center space-x-2 bg-hoh-card px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                showWalletSelector ? 'bg-gray-800 ring-2 ring-hoh-green/50' : 'hover:bg-gray-800'
              }`}
              onClick={() => setShowWalletSelector(!showWalletSelector)}
            >
              <Wallet size={14} className="text-hoh-green" />
              <span className="text-xs font-medium">{currentWallet?.alias || 'Select Wallet'}</span>
              <ChevronDown size={12} className={`transition-transform ${showWalletSelector ? 'rotate-180' : ''}`} />
            </div>

            {showWalletSelector && (
              <div ref={walletListRef} className="absolute top-full left-0 mt-1 bg-hoh-card rounded-lg shadow-xl border border-gray-700 min-w-56 z-50 max-h-96 overflow-y-auto">
                {wallets.map(wallet => (
                  <div
                    key={wallet.id}
                    ref={wallet.id === currentWalletId ? currentWalletRef : null}
                    className={`px-3 py-2 cursor-pointer transition-colors hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                      wallet.id === currentWalletId ? 'bg-hoh-green/20 text-hoh-green' : ''
                    }`}
                    onClick={() => handleSwitchWallet(wallet.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{wallet.alias}</div>
                        <div className="text-xs text-gray-400 truncate">{getShortAddress(wallet.address)}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAddress(wallet.address);
                        }}
                        className="p-1.5 hover:bg-gray-600 rounded-full transition-colors flex-shrink-0 ml-2"
                        title="Copy address"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {wallets.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-400 text-sm">
                    No wallets available
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-hoh-card rounded-full transition-colors"><QrCode size={18} /></button>
          </div>
        </div>

        {/* Balance */}
        <div className="flex flex-col items-center py-6 space-y-2 mb-6">
          {isLoading ? (
            <div className="text-4xl font-bold tracking-tight text-gray-400 animate-pulse">
              Loading...
            </div>
          ) : (
            <div className="text-4xl font-bold tracking-tight">
              {formattedBalance} <span className="text-xl text-gray-400">SUI</span>
            </div>
          )}
          {totalValue > 0 && (
            <div className="text-lg text-gray-300">${priceService.formatPrice(totalValue)}</div>
          )}
          {chartData && (
            <div className={`text-sm ${chartService.formatPriceChange(chartData.change24h).isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {chartService.formatPriceChange(chartData.change24h).percentage} (24h)
            </div>
          )}
          <div
            className={`flex items-center space-x-2 text-sm bg-hoh-card px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              showPriceChart ? 'bg-hoh-green text-black' : 'text-gray-400 hover:text-white'
            }`}
            onClick={handleTogglePriceChart}
          >
            <TrendingUp size={14} />
            <span>Chart</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <button
            onClick={() => navigate('/send')}
            disabled={isLoading || !currentWallet}
            className="flex flex-col items-center justify-center space-y-2 bg-white text-black py-3 px-2 rounded-xl font-bold hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            <span className="text-xs">Send</span>
          </button>
          <button
            onClick={() => navigate('/receive')}
            disabled={isLoading || !currentWallet}
            className="flex flex-col items-center justify-center space-y-2 bg-hoh-card text-white py-3 px-2 rounded-xl font-bold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <QrCode size={18} />
            <span className="text-xs">Receive</span>
          </button>
          <button
            onClick={() => navigate('/swap')}
            disabled={isLoading || !currentWallet}
            className="flex flex-col items-center justify-center space-y-2 bg-hoh-card text-white py-3 px-2 rounded-xl font-bold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft size={18} />
            <span className="text-xs">Swap</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            disabled={isLoading || !currentWallet}
            className="flex flex-col items-center justify-center space-y-2 bg-hoh-card text-white py-3 px-2 rounded-xl font-bold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <History size={18} />
            <span className="text-xs">History</span>
          </button>
          <MoreMenu />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Assets Tabs */}
        <div className="space-y-4 p-4 pb-6">
          <div className="flex justify-between items-center mb-4">
              <div className="sticky top-0 z-10 flex bg-hoh-card rounded-xl p-1 flex-1 mr-2">
                {[
                  { id: 'coin' as const, label: 'Coin', icon: '🪙' },
                  { id: 'defi' as const, label: 'DeFi', icon: '💰' },
                  { id: 'nft' as const, label: 'NFT', icon: '🎨' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
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
            </div>

          {/* Tab Content */}
          <div className="pb-4">
            {activeTab === 'coin' && (
              <div className="space-y-2">
                {tokenBalances.length === 0 ? (
                  <div className="bg-hoh-card rounded-xl p-8 text-center">
                    <div className="text-4xl mb-3">💰</div>
                    <p className="text-gray-400">No tokens yet</p>
                    <p className="text-xs text-gray-500 mt-2">Send or receive tokens to get started</p>
                  </div>
                ) : (
                  tokenBalances.map((token) => {
                    const priceData = priceService.getPrice(token.symbol);
                    return (
                      <div
                        key={token.symbol}
                        onClick={() => navigate(`/coin/${token.info.address}`)}
                        className="bg-hoh-card rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800 active:scale-98 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${token.info.color} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
                            {token.info.icon}
                          </div>
                          <div>
                            <div className="font-bold">{token.symbol}</div>
                            <div className="text-xs text-gray-400">{token.info.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{token.formatted}</div>
                          {priceData ? (
                            <div className="text-xs">
                              <span className="text-gray-400">${priceService.formatPrice(priceData.price)}</span>
                              {priceData.change24h !== 0 && (
                                <span className={`ml-2 ${priceData.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {priceService.formatChange(priceData.change24h)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">$ --</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'defi' && (
              <div className="space-y-3">
                <div className="bg-hoh-card rounded-xl p-4 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => navigate('/swap')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-2xl">
                        🔄
                      </div>
                      <div>
                        <div className="font-bold">Swap</div>
                        <div className="text-sm text-gray-400">Exchange tokens instantly</div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                </div>

                <div className="bg-hoh-card rounded-xl p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-2xl">
                        💧
                      </div>
                      <div>
                        <div className="font-bold">Liquidity</div>
                        <div className="text-sm text-gray-400">Add liquidity to earn</div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      Coming Soon
                    </div>
                  </div>
                </div>

                <div className="bg-hoh-card rounded-xl p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl">
                        🏆
                      </div>
                      <div>
                        <div className="font-bold">Staking</div>
                        <div className="text-sm text-gray-400">Stake tokens to earn rewards</div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      Coming Soon
                    </div>
                  </div>
                </div>

                <div className="bg-hoh-card rounded-xl p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                        📈
                      </div>
                      <div>
                        <div className="font-bold">Lending</div>
                        <div className="text-sm text-gray-400">Borrow or lend assets</div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'nft' && (
              <div>
                {nfts.length === 0 ? (
                  <div className="bg-hoh-card rounded-xl p-6 text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-gray-400">No NFTs yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {nfts.map((nft) => (
                      <div
                        key={nft.id}
                        onClick={() => navigate(`/nft/${nft.id}`)}
                        className="bg-hoh-card rounded-xl overflow-hidden cursor-pointer hover:bg-gray-800 transition-colors"
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
                          <div className="font-bold text-sm truncate">{nft.name}</div>
                          <div className="text-xs text-gray-400 truncate">{nft.collection}</div>
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
    </div>
  );
};