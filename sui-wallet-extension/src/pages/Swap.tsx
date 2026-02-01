import { useState, useEffect } from 'react';
import { ArrowDown, Settings, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { useTransactionStore } from '../store/transactionStore';
import { swapService, SwapQuote } from '../lib/swapService';
import { BottomSheet } from '../components/BottomSheet';
import { TokenSelector } from '../components/TokenSelector';

export const Swap = () => {
  const location = useLocation();
  const { getAllWallets, currentWalletId, tokenBalances } = useWalletStore();
  const { addTransaction } = useTransactionStore();

  const [fromToken, setFromToken] = useState('SUI');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);

  // Handle token passed from CoinDetail page
  useEffect(() => {
    if (location.state?.fromToken) {
      setFromToken(location.state.fromToken);
    }
  }, [location.state]);

  // Get current balance for selected from token
  const fromTokenBalance = tokenBalances.find(t => t.symbol === fromToken);
  const currentBalance = fromTokenBalance ? parseFloat(fromTokenBalance.formatted) : 0;

  // Fetch quote when input changes
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0 && currentWallet) {
      fetchQuote();
    } else {
      setToAmount('');
      setQuote(null);
    }
  }, [fromAmount, fromToken, toToken, currentWallet]);

  const fetchQuote = async () => {
    if (!fromAmount || !currentWallet) return;

    setIsFetchingQuote(true);
    try {
      const result = await swapService.getQuote({
        fromToken,
        toToken,
        amount: fromAmount,
        slippage: 0.5,
        walletAddress: currentWallet.address,
      });

      if (result) {
        setQuote(result);
        setToAmount(result.outputAmount);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      setToAmount('');
      setQuote(null);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!currentWallet || !fromAmount || !quote) return;

    setIsLoading(true);
    try {
      const result = await swapService.executeSwap(
        {
          fromToken,
          toToken,
          amount: fromAmount,
          slippage: 0.5,
          walletAddress: currentWallet.address,
        },
        currentWallet.keypair
      );

      if (result) {
        // Add transaction to history
        addTransaction({
          type: 'swap',
          from: currentWallet.address,
          to: currentWallet.address,
          amount: fromAmount,
          symbol: fromToken,
          status: 'success' as const,
          txDigest: result.digest,
        });

        // Reset form
        setFromAmount('');
        setToAmount('');
        setQuote(null);

        alert(`Swap successful! Transaction: ${result.digest}`);
      } else {
        alert('Swap failed: No result returned');
      }
    } catch (error) {
      console.error('Swap failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Swap failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const handleMaxAmount = () => {
    // Leave some buffer for gas
    const maxAmount = Math.max(0, currentBalance - 0.01);
    setFromAmount(maxAmount.toFixed(6));
  };

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  return (
    <div className="p-4 space-y-4 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Swap</h2>
        <button className="p-2 hover:bg-hoh-card rounded-full"><Settings size={20} /></button>
      </div>

      {/* From Card */}
      <div className="bg-hoh-card rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Pay</span>
          <span>Balance: {fromTokenBalance ? fromTokenBalance.formatted : '0.00'} {fromToken}</span>
        </div>
        <div className="flex justify-between items-center">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0"
            className="bg-transparent text-2xl font-bold outline-none w-2/3"
          />
          <TokenSelector
            selectedToken={fromToken}
            onTokenChange={setFromToken}
          />
        </div>
        {currentBalance > 0 && (
          <button
            onClick={handleMaxAmount}
            className="text-xs text-hoh-green hover:underline"
          >
            Max
          </button>
        )}
      </div>

      {/* Swap Trigger */}
        <div className="flex justify-center -my-3 z-10 relative">
        <button
          onClick={handleSwitchTokens}
          className="bg-hoh-card border-4 border-black p-2 rounded-lg hover:text-hoh-green transition-all"
        >
          <ArrowDown size={20} />
        </button>
      </div>

      {/* To Card */}
      <div className="bg-hoh-card rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Receive</span>
          <span>Balance: 0.00 {toToken}</span>
        </div>
        <div className="flex justify-between items-center">
          <input
            type="number"
            value={toAmount}
            readOnly
            placeholder="0"
            className="bg-transparent text-2xl font-bold outline-none w-2/3 text-gray-400"
          />
          <TokenSelector
            selectedToken={toToken}
            onTokenChange={setToToken}
          />
        </div>
      </div>

      {/* Quote Info */}
      {quote && (
        <div className="bg-hoh-card/50 rounded-lg p-3 text-xs space-y-2 text-gray-400">
          <div className="flex justify-between">
            <span>Rate</span>
            <span>1 {fromToken} ≈ {quote.price} {toToken}</span>
          </div>
          <div className="flex justify-between">
            <span>Minimum Received</span>
            <span>{quote.minimumAmountReceived} {toToken}</span>
          </div>
          <div className="flex justify-between">
            <span>Price Impact</span>
            <span className={parseFloat(quote.priceImpact) > 1 ? 'text-red-400' : ''}>{quote.priceImpact}%</span>
          </div>
          <div className="flex justify-between">
            <span>Network Fee</span>
            <span>{quote.gasFee} SUI</span>
          </div>
          <div className="flex justify-between">
            <span>Trade Fee</span>
            <span>{quote.tradeFee} SUI</span>
          </div>
          <div className="flex justify-between text-hoh-green">
            <span>Route</span>
            <span>{quote.route}</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading || !fromAmount || !quote}
        className="w-full bg-hoh-green text-black font-bold py-2 px-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 mt-4"
      >
        {isFetchingQuote ? (
          <span className="flex items-center justify-center space-x-2">
            <RefreshCw size={20} className="animate-spin" />
            <span>Getting quote...</span>
          </span>
        ) : isLoading ? (
          'Swapping...'
        ) : 'Swap'}
      </button>

      {/* Confirmation Modal */}
      <BottomSheet
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Swap"
      >
        <div className="p-4 space-y-4">
          {quote && (
            <div className="bg-hoh-card rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">You pay</span>
                <span className="font-medium">{fromAmount} {fromToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">You receive</span>
                <span className="font-medium">{toAmount} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum received</span>
                <span className="font-medium">{quote.minimumAmountReceived} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price</span>
                <span className="font-medium">1 {fromToken} = {quote.price} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee</span>
                <span className="font-medium">{quote.gasFee} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price Impact</span>
                <span className={`font-medium ${parseFloat(quote.priceImpact) > 1 ? 'text-red-400' : ''}`}>{quote.priceImpact}%</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 px-4 bg-hoh-card text-white font-medium rounded-xl hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSwap}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-hoh-green text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Swapping...' : 'Confirm Swap'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
