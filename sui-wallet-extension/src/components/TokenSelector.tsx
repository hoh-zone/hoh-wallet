import { useState, useRef, useEffect } from 'react';
import { TOKENS } from '../lib/tokens';
import { ArrowDown, Search, X } from 'lucide-react';

interface TokenSelectorProps {
  selectedToken: string;
  onTokenChange: (token: string) => void;
}

export const TokenSelector = ({ selectedToken, onTokenChange }: TokenSelectorProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tokens = Object.keys(TOKENS);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      setSearchQuery('');
    }
  }, [showDropdown]);

  const filteredTokens = tokens.filter(token => {
    const tokenInfo = TOKENS[token];
    const searchLower = searchQuery.toLowerCase();

    return (
      token.toLowerCase().includes(searchLower) ||
      tokenInfo.name.toLowerCase().includes(searchLower) ||
      tokenInfo.address.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-black px-3 py-1.5 rounded-full font-bold border border-gray-700 hover:border-white transition-colors w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-5 h-5 ${TOKENS[selectedToken].color} rounded-full`}></div>
          <span>{selectedToken}</span>
        </div>
        <ArrowDown size={16} />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-hoh-card rounded-lg shadow-lg border border-gray-700 min-w-64 max-h-96 overflow-hidden z-10">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full bg-hoh-hover text-white pl-9 pr-8 py-2 rounded-lg border border-gray-700 focus:border-hoh-green focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Token List */}
          <div className="max-h-72 overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No tokens found
              </div>
            ) : (
              filteredTokens.map(token => (
                <button
                  key={token}
                  onClick={() => {
                    onTokenChange(token);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    token === selectedToken ? 'bg-hoh-green/20 text-hoh-green' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 ${TOKENS[token].color} rounded-full`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{token}</div>
                      <div className="text-xs text-gray-400">{TOKENS[token].name}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};