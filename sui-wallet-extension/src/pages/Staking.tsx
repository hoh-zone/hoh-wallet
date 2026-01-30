import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { TrendingUp, Lock, Unlock, RefreshCw, AlertCircle, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stakingService, StakingPosition } from '../lib/stakingService';
import { TOKENS } from '../lib/tokens';

export const StakingPage = () => {
  const navigate = useNavigate();
  const { currentWalletId, getAllWallets, tokenBalances, refreshBalance, balance } = useWalletStore();
  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);
 
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [availablePools, setAvailablePools] = useState<StakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'staked' | 'available'>('staked');
  const [totalStaked, setTotalStaked] = useState<string>('0');
  const [totalRewards, setTotalRewards] = useState<string>('0');
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);

  useEffect(() => {
    if (currentWallet) {
      loadStakingData();
    }
  }, [currentWallet]);

  const loadStakingData = async () => {
    if (!currentWallet) return;

    setIsLoading(true);
    try {
      const positions = await stakingService.getStakingPositions(currentWallet.address);
      const pools = await stakingService.getAvailableStakingPools(currentWallet.address, tokenBalances);

      setStakingPositions(positions);
      setAvailablePools(pools);

      // Calculate totals
      const totalStakedAmount = positions.reduce((sum, pos) => sum + parseFloat(pos.stakedAmount), 0);
      const totalRewardAmount = positions.reduce((sum, pos) => sum + parseFloat(pos.rewards), 0);

      setTotalStaked(totalStakedAmount.toFixed(2));
      setTotalRewards(totalRewardAmount.toFixed(2));
    } catch (error) {
      console.error('Failed to load staking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStakingData();
    refreshBalance();
  };

  const handleCopyAddress = async (address: string | undefined) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleStakeClick = (pool: StakingPosition) => {
    if (!pool.validatorAddress) return;
    setSelectedValidator(pool.validatorAddress);
    setShowStakeModal(true);
    setStakeAmount('');
  };

  const handleStake = async () => {
    if (!currentWallet || !selectedValidator || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > parseFloat(balance)) {
      alert('Insufficient balance');
      return;
    }

    try {
      const txId = await stakingService.stake(
        '0x2::sui::SUI',
        amount,
        selectedValidator,
        currentWallet.keypair
      );
      alert(`Staking initiated! Transaction: ${txId}`);
      setShowStakeModal(false);
      await loadStakingData();
      await refreshBalance();
    } catch (error: any) {
      alert(`Staking failed: ${error.message}`);
    }
  };

  const handleUnstake = async (position: StakingPosition) => {
    if (!currentWallet) return;
    
    if (!confirm(`Are you sure you want to unstake ${position.stakedAmount} SUI?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      const txId = await stakingService.unstake(
        position.id,
        parseFloat(position.stakedAmount),
        currentWallet.keypair
      );
      alert(`Unstaking initiated! Transaction: ${txId}\n\nNote: It will take ~1 epoch (24 hours) to complete.`);
      await loadStakingData();
    } catch (error: any) {
      alert(`Unstaking failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async (position: StakingPosition) => {
    if (!currentWallet || !position.validatorAddress) return;
    
    if (!confirm(`Are you sure you want to claim rewards from ${position.stakedAmount} SUI?\n\nNote: This will unstake and restake your position.`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      const txId = await stakingService.claimRewards(
        position.id,
        currentWallet.keypair,
        position.validatorAddress
      );
      alert(`Rewards claimed! Transaction: ${txId}`);
      await loadStakingData();
    } catch (error: any) {
      alert(`Claiming rewards failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatValidatorAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="p-4 space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-hoh-card rounded-full"
        >
          <Lock size={20} className="rotate-180" />
        </button>
        <h1 className="text-xl font-bold">Staking</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-hoh-card rounded-full disabled:opacity-50"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-hoh-card rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total Staked</div>
          <div className="text-2xl font-bold flex items-center space-x-2">
            <span>{totalStaked}</span>
            <span className="text-lg text-gray-400">SUI</span>
          </div>
        </div>
        <div className="bg-hoh-card rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Est. Rewards</div>
          <div className="text-2xl font-bold flex items-center space-x-2">
            <TrendingUp size={20} className="text-green-400" />
            <span>{totalRewards}</span>
            <span className="text-lg text-gray-400">SUI</span>
          </div>
        </div>
      </div>

      {/* Stake Modal */}
      {showStakeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-hoh-card rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Stake SUI</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (SUI)</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-hoh-green focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">Available: {balance} SUI</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Validator:</span>
                <span className="text-hoh-green">
                  {(availablePools.find((v: any) => v.id === selectedValidator) as any)?.name || 'Unknown'}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowStakeModal(false)}
                  className="flex-1 bg-gray-700 text-white font-medium py-3 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStake}
                  disabled={isLoading || !stakeAmount}
                  className="flex-1 bg-hoh-green text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Staking...' : 'Stake'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-hoh-card rounded-xl p-1 flex">
        <button
          onClick={() => setActiveTab('staked')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'staked' ? 'bg-hoh-green text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          My Stakes
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'available' ? 'bg-hoh-green text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          Available Pools
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw size={32} className="mx-auto mb-3 animate-spin text-gray-400" />
            <p className="text-gray-400">Loading staking data...</p>
          </div>
        ) : activeTab === 'staked' ? (
          <>
            {stakingPositions.length === 0 ? (
              <div className="bg-hoh-card rounded-xl p-8 text-center">
                <Lock size={48} className="mx-auto mb-3 text-gray-400" />
                <h3 className="text-lg font-bold mb-2">No Stakes Yet</h3>
                <p className="text-gray-400 mb-4">Start staking your SUI to earn rewards</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="bg-hoh-green text-black font-bold py-3 px-6 rounded-xl hover:opacity-90"
                >
                  View Available Pools
                </button>
              </div>
            ) : (
              stakingPositions.map((position) => (
                <div key={position.id} className="bg-hoh-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${TOKENS[position.symbol]?.color || 'bg-blue-500'}`}>
                        {position.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold">{position.symbol} Staking</div>
                        <div className="text-sm text-gray-400">
                          Validator: <span className="text-white">{position.validatorName || 'Unknown'}</span>
                        </div>
                        {position.status && (
                          <div className="text-xs text-gray-500">Status: {position.status}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleClaimRewards(position)}
                      disabled={isLoading || !position.validatorAddress}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-full text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Claim Rewards (will unstake and restake)"
                    >
                      <TrendingUp size={16} />
                    </button>
                  </div>
 
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-400">Staked Amount</div>
                      <div className="font-bold text-lg">{position.stakedAmount} {position.symbol}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Est. Rewards</div>
                      <div className="font-bold text-lg text-green-400">{position.rewards} {position.symbol}</div>
                    </div>
                  </div>

                  {position.validatorAddress && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-500">
                        Validator: {formatValidatorAddress(position.validatorAddress)}
                      </div>
                      <button
                        onClick={() => handleCopyAddress(position.validatorAddress)}
                        className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                        title="Copy validator address"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
 
                  <button
                    onClick={() => handleUnstake(position)}
                    disabled={isLoading}
                    className="w-full mt-3 flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Unlock size={16} />
                    <span className="font-medium">{isLoading ? 'Unstaking...' : 'Unstake'}</span>
                  </button>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {availablePools.map((pool) => {
              const hasStaked = stakingPositions.some(p => p.coinType === pool.coinType);
              
              return (
                <div key={pool.id} className="bg-hoh-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${TOKENS[pool.symbol]?.color || 'bg-blue-500'}`}>
                        {pool.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold">{pool.validatorName || 'Unknown'}</div>
                        <div className="text-sm text-gray-400">
                          APY: <span className="text-green-400 font-medium">{pool.apy}%</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Stake: {pool.stakedAmount} SUI
                        </div>
                      </div>
                    </div>
                    {pool.validatorAddress && (
                      <button
                        onClick={() => handleCopyAddress(pool.validatorAddress)}
                        className="p-1.5 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0 ml-2"
                        title="Copy validator address"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
 
                  {hasStaked && (
                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-400">
                          You already have a staked position. You can stake more or unstake your current position.
                        </div>
                      </div>
                    </div>
                  )}
 
                  <button
                    onClick={() => handleStakeClick(pool)}
                    disabled={isLoading || !pool.validatorAddress}
                    className="w-full mt-3 flex items-center justify-center space-x-2 bg-hoh-green text-black font-bold py-3 rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock size={16} />
                    <span>{isLoading ? 'Processing...' : 'Stake SUI'}</span>
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
