import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useCustomTokenStore } from '../store/customTokenStore';

export const AddTokenPage = () => {
  const navigate = useNavigate();
  const { addCustomToken, customTokens } = useCustomTokenStore();

  const [formData, setFormData] = useState({
    address: '',
    name: '',
    symbol: '',
    decimals: '9',
    logoUrl: '',
    color: '#007bff',
  });
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateAddress = (address: string): boolean => {
    // Basic Sui address validation
    if (!address.startsWith('0x')) return false;
    if (address.length !== 66) return false;
    return true;
  };

  const validateToken = async () => {
    setError('');
    setIsValidating(true);

    try {
      if (!validateAddress(formData.address)) {
        throw new Error('Invalid Sui address format');
      }

      if (!formData.name.trim()) {
        throw new Error('Token name is required');
      }

      if (!formData.symbol.trim()) {
        throw new Error('Token symbol is required');
      }

      const decimals = parseInt(formData.decimals);
      if (isNaN(decimals) || decimals < 0 || decimals > 18) {
        throw new Error('Decimals must be between 0 and 18');
      }

      // Check if token already exists
      const exists = customTokens.some(
        t => t.address.toLowerCase() === formData.address.toLowerCase()
      );
      if (exists) {
        throw new Error('This token has already been added');
      }

      // Create custom token
      const customToken = {
        id: `custom_${Date.now()}`,
        address: formData.address,
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        decimals,
        logoUrl: formData.logoUrl || undefined,
        color: formData.color || '#007bff',
      };

      addCustomToken(customToken);
      navigate('/');

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-hoh-card rounded-full"
        >
          <X size={20} />
        </button>
        <h1 className="text-xl font-bold">Add Custom Token</h1>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-400">
            Only add tokens from trusted sources. Always verify the contract address and token details before adding.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Token Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Token Contract Address *</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="0x..."
            className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-400">
            The contract address of the token on Sui network
          </p>
        </div>

        {/* Token Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Token Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., My Custom Token"
            className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
          />
        </div>

        {/* Token Symbol */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Token Symbol *</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
            placeholder="e.g., MCT"
            maxLength={10}
            className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none font-mono uppercase"
          />
        </div>

        {/* Decimals */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Decimals *</label>
          <input
            type="number"
            value={formData.decimals}
            onChange={(e) => setFormData(prev => ({ ...prev, decimals: e.target.value }))}
            placeholder="e.g., 9"
            min="0"
            max="18"
            className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
          />
          <p className="text-xs text-gray-400">
            Number of decimal places for this token (0-18)
          </p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Token Logo (Optional)</label>
          <div className="flex items-center space-x-3">
            {formData.logoUrl ? (
              <div className="relative">
                <img
                  src={formData.logoUrl}
                  alt="Token logo"
                  className="w-16 h-16 rounded-full object-cover border-2 border-hoh-border"
                />
                <button
                  onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-hoh-card border-2 border-dashed border-gray-600 flex items-center justify-center">
                <label className="cursor-pointer hover:bg-gray-700 w-full h-full rounded-full flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <ImageIcon size={24} className="text-gray-400" />
                </label>
              </div>
            )}
            <button
              onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
              className="p-2 bg-hoh-card rounded-full hover:bg-gray-700 text-gray-400"
              title="Clear logo"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Recommended size: 128x128px. Max size: 5MB
          </p>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Token Color (Optional)</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-16 h-10 rounded-lg cursor-pointer border-0 p-0"
            />
            <div className="flex space-x-2">
              {['#007bff', '#28a745', '#17a2b8', '#dc3545', '#6610f2', '#e83e8c', '#ffc107'].map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-10 h-10 rounded-lg ${formData.color === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 bg-hoh-card rounded-xl font-medium hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={validateToken}
          disabled={isValidating}
          className="flex-1 py-3 bg-hoh-green text-black rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : 'Add Token'}
        </button>
      </div>

      {/* Success Info */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-400">
            After adding, the token will appear in your assets list with its current balance.
          </p>
        </div>
      </div>
    </div>
  );
};
