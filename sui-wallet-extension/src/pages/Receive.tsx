import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Share2, Download, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import QRCode from 'qrcode';
import { getTokenByAddress } from '../lib/tokens';

export const ReceivePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAllWallets, currentWalletId } = useWalletStore();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const tokenAddress = location.state?.token;
  const tokenInfo = tokenAddress ? getTokenByAddress(tokenAddress) : null;

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);

  const generateQRCode = async (address: string) => {
    try {
      const url = await QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  useEffect(() => {
    if (currentWallet) {
      generateQRCode(currentWallet.address);
    }
  }, [currentWallet]);

  const handleCopyAddress = () => {
    if (currentWallet) {
      navigator.clipboard.writeText(currentWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `sui-wallet-qr-${currentWallet?.address.slice(-8)}.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const handleShare = async () => {
    if (currentWallet && navigator.share) {
      try {
        await navigator.share({
          title: 'My Sui Address',
          text: `Send SUI to: ${currentWallet.address}`,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }
  };

  if (!currentWallet) {
    return (
      <div className="p-4 text-center text-gray-400 py-20">
        No wallet selected
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-hoh-card rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Receive {tokenInfo ? tokenInfo.symbol : 'SUI'}</h1>
      </div>

      {/* QR Code Card */}
      <div className="bg-hoh-card rounded-xl p-6 space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 rounded flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            )}
          </div>
        </div>

        {/* Address Display */}
        <div className="space-y-2">
          <div className="text-sm text-gray-400 text-center">Your Address</div>
          <div className="bg-hoh-hover rounded-lg p-4">
            <div className="font-mono text-sm text-center break-all mb-2">
              {currentWallet.address}
            </div>
            <button
              onClick={handleCopyAddress}
              className="w-full flex items-center justify-center space-x-2 bg-hoh-green text-black font-bold py-2 px-4 rounded-xl hover:opacity-90 transition-all"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center space-x-2 bg-hoh-card text-white font-medium py-2 px-4 rounded-xl hover:bg-gray-700 transition-all"
          >
            <Download size={18} />
            <span>Save QR</span>
          </button>
          {typeof navigator.share === 'function' && (
            <button
              onClick={handleShare}
              className="flex items-center justify-center space-x-2 bg-hoh-card text-white font-medium py-2 px-4 rounded-xl hover:bg-gray-700 transition-all"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-400 mb-1">Important Notes</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Only send SUI tokens to this address</li>
              <li>• Sending other tokens may result in permanent loss</li>
              <li>• This address is unique to your wallet</li>
              <li>• Double-check the address before sending</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-yellow-500 mb-1">Security Warning</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Never share your private key or seed phrase</li>
              <li>• Scammers may try to trick you into revealing it</li>
              <li>• This wallet will never ask for your private key</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};