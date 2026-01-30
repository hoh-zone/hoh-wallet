import { useNavigate, useParams } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { ArrowLeft, Send, ArrowRightLeft, Copy, QrCode } from 'lucide-react';
import { getShortAddress } from '../lib/utils';
import { getTokenByAddress } from '../lib/tokens';

export const CoinDetail = () => {
  const navigate = useNavigate();
  const { address } = useParams<{ address: string }>();
  const { getAllWallets, currentWalletId, tokenBalances } = useWalletStore();

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);
  const tokenInfo = getTokenByAddress(address || '');

  if (!tokenInfo) {
    return (
      <div className="p-4 text-center">
        <p>Token not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-hoh-green">Go Back</button>
      </div>
    );
  }

  const tokenBalance = tokenBalances.find(t => t.info.address === address);
  const balance = tokenBalance ? tokenBalance.formatted : '0.00';
  const shortAddress = currentWallet ? getShortAddress(currentWallet.address) : '';

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-hoh-card rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Coin Details</h1>
        </div>

        <div className="flex flex-col items-center py-8 space-y-4">
          <div className={`w-20 h-20 ${tokenInfo.color} rounded-full flex items-center justify-center text-4xl shadow-lg`}>
            {tokenInfo.icon}
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold">{balance} <span className="text-xl text-gray-400">{tokenInfo.symbol}</span></div>
            <div className="text-gray-400">{tokenInfo.name}</div>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <button
            onClick={() => navigate('/send', { state: { token: tokenInfo.address } })}
            className="w-full flex items-center justify-center space-x-3 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            <Send size={20} />
            <span>Send</span>
          </button>
          <button
            onClick={() => navigate('/receive', { state: { token: tokenInfo.address } })}
            className="w-full flex items-center justify-center space-x-3 bg-hoh-card text-white py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors"
          >
            <QrCode size={20} />
            <span>Receive</span>
          </button>
          <button
            onClick={() => navigate('/swap', { state: { fromToken: tokenInfo.symbol } })}
            className="w-full flex items-center justify-center space-x-3 bg-hoh-card text-white py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors"
          >
            <ArrowRightLeft size={20} />
            <span>Swap</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-hoh-card rounded-xl p-4 space-y-4">
          <h2 className="font-bold text-lg mb-2">Token Information</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Token Name</span>
                <span className="font-medium">{tokenInfo.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Symbol</span>
                <span className="font-medium">{tokenInfo.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Balance</span>
                <span className="font-medium">{balance} {tokenInfo.symbol}</span>
              </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Decimals</span>
              <span className="font-medium">{tokenInfo.decimals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Contract Address</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{getShortAddress(tokenInfo.address)}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(tokenInfo.address)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            {currentWallet && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Wallet Address</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{shortAddress}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(currentWallet.address)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};