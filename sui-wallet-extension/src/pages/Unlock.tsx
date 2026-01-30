import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { Lock, Eye, EyeOff } from 'lucide-react';

export const Unlock = () => {
  const { unlockWallet, isLoading, logout } = useWalletStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    const success = await unlockWallet(password);
    if (!success) {
      setError('Incorrect password');
    } else {
      setError('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8">
      <div className="w-20 h-20 bg-hoh-card rounded-2xl flex items-center justify-center mb-4">
        <Lock size={40} className="text-white" />
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">Unlock Wallet</h1>
        <p className="text-gray-400 text-sm">
          Enter your password to access your wallet
        </p>
      </div>

      <div className="w-full space-y-4 mt-8">
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-hoh-card text-white px-4 py-3 pr-12 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <button
          onClick={handleUnlock}
          disabled={isLoading || !password.trim()}
          className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
        </button>

        <button
          onClick={logout}
          className="w-full bg-red-600 text-white font-medium py-3 rounded-xl hover:bg-red-700 transition-colors"
        >
          Reset Wallet
        </button>
      </div>
    </div>
  );
};