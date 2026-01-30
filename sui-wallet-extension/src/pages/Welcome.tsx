
import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { Eye, EyeOff, Shield } from 'lucide-react';

export const Welcome = () => {
  const { createWallet, importMnemonicWallet, isLoading } = useWalletStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [showMnemonicBackup, setShowMnemonicBackup] = useState(false);
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showImportPassword, setShowImportPassword] = useState(false);

  const handleCreateWallet = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');

    // Generate mnemonic first to show to user
    const { generateMnemonic } = await import('bip39');
    const newMnemonic = generateMnemonic();
    setGeneratedMnemonic(newMnemonic);
    setShowMnemonicBackup(true);
  };

  const handleConfirmBackup = async () => {
    // Now actually create the wallet with the generated mnemonic
    await createWallet(password, generatedMnemonic);
    // Wallet creation will redirect to main app
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(generatedMnemonic);
  };

  // Show mnemonic backup screen if we just generated a mnemonic
  if (showMnemonicBackup) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4">
          <Shield size={40} className="text-yellow-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Backup Your Seed Phrase</h1>
          <p className="text-gray-400 text-sm max-w-md">
            Write down these 12 words in order and keep them safe. This is the only way to recover your wallet if you lose access.
          </p>
        </div>

        {/* Mnemonic Display */}
        <div className="bg-hoh-card rounded-xl p-6 w-full max-w-md">
          <div className="grid grid-cols-3 gap-3 text-sm">
            {generatedMnemonic.split(' ').map((word, index) => (
              <div key={index} className="bg-hoh-hover rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{index + 1}</div>
                <div className="font-medium">{word}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Warnings */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-w-md">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-red-400 mt-0.5" />
            <div className="text-left">
              <h3 className="font-semibold text-red-400 text-sm mb-1">Important Security Notes</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Never share your seed phrase with anyone</li>
                <li>• Store it offline in a secure location</li>
                <li>• Make multiple backups</li>
                <li>• This phrase controls all your funds</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-3">
          <button
            onClick={handleCopyMnemonic}
            className="w-full bg-hoh-card text-white font-medium py-3 rounded-xl hover:bg-hoh-hover"
          >
            Copy to Clipboard
          </button>

          <button
            onClick={handleConfirmBackup}
            disabled={isLoading}
            className="w-full bg-hoh-green text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Creating Wallet...' : 'I Have Backed Up My Seed Phrase'}
          </button>
        </div>
      </div>
    );
  }

  const handleImportWallet = async () => {
    if (!mnemonic.trim()) {
      setError('Please enter your mnemonic phrase');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    const success = await importMnemonicWallet(mnemonic.trim(), password, 'My Wallet');
    if (!success) {
      setError('Invalid mnemonic phrase');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 pt-20">
      <div className="w-20 h-20 bg-hoh-card rounded-2xl flex items-center justify-center mb-4">
        <Shield size={40} className="text-white" />
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">HOH Wallet (Sui)</h1>
        <p className="text-gray-400 text-sm">
          Your portal to the Sui ecosystem. Secure, fast, and easy to use.
        </p>
      </div>

      <div className="w-full space-y-4 mt-8">
        {!isImporting ? (
          <>
            <button
              onClick={() => setIsImporting(false)}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Create New Wallet
            </button>

            <button
              onClick={() => setIsImporting(true)}
              className="w-full bg-hoh-card text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Import Existing Wallet
            </button>
          </>
        ) : (
          <>
            <textarea
              placeholder="Enter your 12 or 24 word mnemonic phrase"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              rows={3}
              className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-white focus:outline-none resize-none"
            />

            <div className="relative">
              <input
                type={showImportPassword ? "text" : "password"}
                placeholder="Set password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-hoh-card text-white px-4 py-3 pr-12 rounded-xl border border-gray-700 focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowImportPassword(!showImportPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showImportPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-hoh-card text-white px-4 py-3 pr-12 rounded-xl border border-gray-700 focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleImportWallet}
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Importing...' : 'Import Wallet'}
            </button>

            <button
              onClick={() => {
                setIsImporting(false);
                setMnemonic('');
                setPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className="w-full bg-gray-600 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          </>
        )}

        {!isImporting && (
          <>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Set password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-hoh-card text-white px-4 py-3 pr-12 rounded-xl border border-gray-700 focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-hoh-card text-white px-4 py-3 pr-12 rounded-xl border border-gray-700 focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleCreateWallet}
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Wallet'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
