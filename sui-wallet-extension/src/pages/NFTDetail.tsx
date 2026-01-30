import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Copy, Send } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { getShortAddress } from '../lib/utils';

export const NFTDetail = () => {
  const navigate = useNavigate();
  const { nftId } = useParams<{ nftId: string }>();
  const { getAllWallets, currentWalletId, nfts } = useWalletStore();

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);
  const nft = nfts.find(n => n.id === nftId);

  const [showSendModal, setShowSendModal] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (currentWallet) {
      navigator.clipboard.writeText(currentWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendNFT = () => {
    // TODO: Implement NFT send
    alert('NFT transfer coming soon!');
    setShowSendModal(false);
  };

  const handleShare = async () => {
    if (nft && navigator.share) {
      try {
        await navigator.share({
          title: nft.name,
          text: `Check out this NFT: ${nft.name}`,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }
  };

  if (!nft) {
    return (
      <div className="p-4 text-center">
        <p>NFT not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-hoh-green">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-hoh-card rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">NFT Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-hoh-card rounded-xl overflow-hidden">
          {/* NFT Image */}
          {nft.imageUrl ? (
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-6xl">
              🎨
            </div>
          )}

          {/* NFT Info */}
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{nft.name}</h2>
              <p className="text-gray-400">{nft.collection}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Token ID</span>
                <span className="font-mono text-sm">{nft.id.slice(-12)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Owner</span>
                {currentWallet && (
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{getShortAddress(currentWallet.address)}</span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      {copied ? (
                        <span className="text-green-400 text-xs">Copied!</span>
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowSendModal(true)}
                className="w-full flex items-center justify-center space-x-2 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                <Send size={18} />
                <span>Send NFT</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center space-x-2 bg-hoh-card text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors"
              >
                <Share2 size={18} />
                <span>Share</span>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-hoh-card rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Send NFT</h2>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full bg-hoh-hover text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-hoh-green focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">NFT to Send</div>
              <div className="flex items-center space-x-3 bg-hoh-hover rounded-xl p-3">
                {nft.imageUrl ? (
                  <img src={nft.imageUrl} alt={nft.name} className="w-16 h-16 rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl">
                    🎨
                  </div>
                )}
                <div>
                  <div className="font-bold">{nft.name}</div>
                  <div className="text-sm text-gray-400">{nft.collection}</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 py-3 bg-hoh-hover rounded-xl font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNFT}
                className="flex-1 py-3 bg-hoh-green text-black rounded-xl font-bold hover:opacity-90"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};