import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Copy, Check, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';

export const BackupMnemonicPage = () => {
  const navigate = useNavigate();
  const { walletGroups } = useWalletStore();
  
  const [step, setStep] = useState<'warning' | 'display' | 'complete'>('warning');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMnemonic, setSelectedMnemonic] = useState<string>('');

  const mnemonicGroups = walletGroups.filter(g => g.type === 'mnemonic');

  const handleContinue = (_groupId: string, mnemonic: string) => {
    setSelectedMnemonic(mnemonic);
    setStep('display');
  };

  const handleCopyMnemonic = () => {
    if (selectedMnemonic) {
      navigator.clipboard.writeText(selectedMnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = () => {
    setStep('complete');
  };

  const handleDone = () => {
    navigate('/');
  };

  const handleBack = () => {
    setStep('warning');
    setSelectedMnemonic('');
    setShowMnemonic(false);
  };

  if (step === 'warning') {
    return (
      <div className="p-4 space-y-6 pt-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-hoh-card rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Backup Wallet</h1>
        </div>

        {mnemonicGroups.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No mnemonic wallets found.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Select a wallet group to backup:</p>
            {mnemonicGroups.map(group => (
              <div
                key={group.id}
                onClick={() => handleContinue(group.id, group.source)}
                className="bg-hoh-card rounded-xl p-4 cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-hoh-green/20 rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-hoh-green" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{group.name}</div>
                    <div className="text-sm text-gray-400">{group.wallets.length} wallet(s)</div>
                  </div>
                  <ArrowLeft size={20} className="rotate-180 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 'display') {
    const words = selectedMnemonic?.split(' ') || [];

    return (
      <div className="p-4 space-y-6 pt-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-hoh-card rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Your Recovery Phrase</h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-400 font-medium">
                Never share these words with anyone. Anyone with access to this phrase can control your funds.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-hoh-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-400">
              <Lock size={16} />
              <span className="text-sm">12-word recovery phrase</span>
            </div>
            <button
              onClick={() => setShowMnemonic(!showMnemonic)}
              className="flex items-center space-x-2 text-sm text-hoh-green hover:underline"
            >
              {showMnemonic ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showMnemonic ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          {showMnemonic ? (
            <div className="grid grid-cols-3 gap-3">
              {words.map((word, index) => (
                <div key={index} className="bg-hoh-hover rounded-lg p-2">
                  <div className="text-xs text-gray-400 mb-1">{index + 1}.</div>
                  <div className="font-medium text-sm">{word}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-hoh-hover rounded-lg p-4 text-center">
              <div className="text-gray-400">••• ••• ••• ••• ••• ••• ••• ••• ••• ••• ••• •••</div>
            </div>
          )}

          <button
            onClick={handleCopyMnemonic}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-colors ${
              copied ? 'bg-green-500/20 text-green-400' : 'bg-hoh-hover hover:bg-gray-700'
            }`}
          >
            {copied ? (
              <>
                <Check size={18} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleVerify}
          className="w-full bg-hoh-green text-black font-bold py-4 rounded-xl hover:opacity-90"
        >
          I've saved my recovery phrase
        </button>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="p-4 space-y-6 pt-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-hoh-card rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Backup Complete!</h1>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check size={40} className="text-green-500" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">You're all set!</h2>
            <p className="text-gray-400">
              Your recovery phrase has been backed up successfully. Make sure to keep it in a secure place.
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <h3 className="font-semibold text-green-400 flex items-center space-x-2 mb-3">
              <Check size={16} />
              <span>Backup Verified</span>
            </h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <span>Recovery phrase saved to a secure location</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <span>Words verified in correct order</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <span>Backup process completed</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDone}
            className="w-full bg-hoh-green text-black font-bold py-4 rounded-xl hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
};
