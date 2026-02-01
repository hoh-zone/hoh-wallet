import { useState, useRef, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { Plus, Trash2, Edit2, Check, X, ArrowLeft, Key, Eye, EyeOff, Copy, MoreVertical, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { getShortAddress } from '../lib/utils';

export const WalletManagement = () => {
  const navigate = useNavigate();
  const { walletGroups, currentWalletId, addWalletToGroup, removeWallet, renameWallet, renameGroup, isLoading, importMnemonicWallet, importPrivateKeyWallet, exportWalletsToCSV } = useWalletStore();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(walletGroups[0]?.id || null);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupValue, setEditGroupValue] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey' | null>(null);
  const [importInput, setImportInput] = useState('');
  const [importGroupName, setImportGroupName] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [importError, setImportError] = useState('');
  
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const activeGroup = walletGroups.find(g => g.id === activeGroupId);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(null);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  const handleAddWallet = async () => {
    if (activeGroupId) {
      await addWalletToGroup(activeGroupId);
    }
  };

  const handleStartEditWallet = (walletId: string, currentAlias: string) => {
    setEditingWalletId(walletId);
    setEditValue(currentAlias);
    setShowMoreMenu(null);
  };

  const handleSaveEditWallet = () => {
    if (editingWalletId && editValue.trim()) {
      renameWallet(editingWalletId, editValue.trim());
    }
    setEditingWalletId(null);
    setEditValue('');
  };

  const handleCancelEditWallet = () => {
    setEditingWalletId(null);
    setEditValue('');
  };

  const handleStartEditGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditGroupValue(currentName);
    setShowMoreMenu(null);
  };

  const handleSaveEditGroup = () => {
    if (editingGroupId && editGroupValue.trim()) {
      renameGroup(editingGroupId, editGroupValue.trim());
    }
    setEditingGroupId(null);
    setEditGroupValue('');
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditGroupValue('');
  };

  const handleRemoveWallet = (walletId: string) => {
    const allWallets = walletGroups.flatMap(g => g.wallets);
    if (allWallets.length > 1) {
      removeWallet(walletId);
      setShowMoreMenu(null);
    }
  };

  const handleExportPrivateKey = async (walletId: string) => {
    try {
      const allWallets = walletGroups.flatMap(g => g.wallets);
      const wallet = allWallets.find(w => w.id === walletId);
      if (!wallet) throw new Error('Wallet not found');

      const secretKey = wallet.keypair.getSecretKey();
      await navigator.clipboard.writeText(secretKey);
      alert('Private key copied to clipboard!\n\n⚠️ Keep this secure - never share it!');
      setShowMoreMenu(null);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export private key');
    }
  };

  const handleExportToCSV = () => {
    const csvContent = exportWalletsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wallets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const handleImport = async () => {
    setImportError('');
    const password = importPassword;
    if (!password) {
      setImportError('Please enter password');
      return;
    }
    if (password.length < 8) {
      setImportError('Password must be at least 8 characters');
      return;
    }

    if (importType === 'mnemonic') {
      if (!importInput.trim()) {
        setImportError('Please enter mnemonic phrase');
        return;
      }
      const success = await importMnemonicWallet(importInput.trim(), password, importGroupName.trim() || undefined);
      if (!success) {
        setImportError('Invalid mnemonic phrase');
      } else {
        setShowImportSheet(false);
        resetImportForm();
      }
    } else if (importType === 'privateKey') {
      if (!importInput.trim()) {
        setImportError('Please enter private key');
        return;
      }
      const success = await importPrivateKeyWallet(importInput.trim(), password, importGroupName.trim() || undefined);
      if (!success) {
        setImportError('Invalid private key');
      } else {
        setShowImportSheet(false);
        resetImportForm();
      }
    }
  };

  const resetImportForm = () => {
    setImportType(null);
    setImportInput('');
    setImportGroupName('');
    setImportError('');
    setShowImportPassword(false);
  };

  return (
    <div className="p-4 space-y-4 pt-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-hoh-card rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-xl font-bold">Wallets</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportSheet(true)}
            className="flex items-center gap-2 bg-hoh-green text-black px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">Import</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 hover:bg-hoh-card rounded-lg transition-colors"
            title="Export to CSV"
          >
            <Download size={18} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {walletGroups.length === 0 ? (
        <div className="bg-hoh-card rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">👛</div>
          <p className="text-gray-400 mb-4">No wallets found</p>
          <button
            onClick={() => setShowImportSheet(true)}
            className="inline-flex items-center gap-2 bg-hoh-green text-black px-6 py-3 rounded-xl font-bold hover:opacity-90"
          >
            <Plus size={18} />
            <span>Import Wallet</span>
          </button>
        </div>
      ) : (
        <>
          {/* Compact Group Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {walletGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeGroupId === group.id
                    ? 'bg-hoh-green text-black'
                    : 'bg-hoh-card text-gray-400 hover:text-white'
                }`}
              >
                {editingGroupId === group.id ? (
                  <input
                    type="text"
                    value={editGroupValue}
                    onChange={(e) => setEditGroupValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-black outline-none w-20 font-medium"
                    autoFocus
                  />
                ) : (
                  <>{group.name}</>
                )}
                {editingGroupId === group.id ? (
                  <div className="flex items-center gap-1">
                    <Check
                      size={14}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEditGroup();
                      }}
                      className="hover:bg-white/20 rounded"
                    />
                    <X
                      size={14}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEditGroup();
                      }}
                      className="hover:bg-white/20 rounded"
                    />
                  </div>
                ) : (
                  <Edit2
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditGroup(group.id, group.name);
                    }}
                    className="hover:bg-white/20 rounded"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Action Bar */}
          {activeGroup && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddWallet}
                disabled={isLoading || activeGroup.type === 'privateKey'}
                className="flex items-center gap-2 flex-1 bg-hoh-card text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                <span className="text-sm">{isLoading ? 'Adding...' : 'Add Wallet'}</span>
              </button>
            </div>
          )}

          {/* Wallet Cards */}
          <div className="space-y-2">
            {activeGroup && activeGroup.wallets.map(wallet => {
              const isCurrentWallet = wallet.id === currentWalletId;
              return (
                <div key={wallet.id} className="bg-hoh-card rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {editingWalletId === wallet.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-transparent text-white outline-none flex-1 font-medium"
                            autoFocus
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleSaveEditWallet}
                              className="p-1 text-hoh-green hover:bg-hoh-green/20 rounded"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEditWallet}
                              className="p-1 text-gray-400 hover:text-white rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate flex items-center gap-2">
                              {wallet.alias}
                              {isCurrentWallet && (
                                <span className="text-xs bg-hoh-green text-black px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                              {getShortAddress(wallet.address)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditWallet(wallet.id, wallet.alias)}
                              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Rename"
                            >
                              <Edit2 size={14} className="text-gray-400" />
                            </button>
                            <button
                              onClick={() => navigator.clipboard.writeText(wallet.address)}
                              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Copy address"
                            >
                              <Copy size={14} className="text-gray-400" />
                            </button>
                          </div>
                        </>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setShowMoreMenu(showMoreMenu === wallet.id ? null : wallet.id)}
                          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MoreVertical size={14} className="text-gray-400" />
                        </button>

                        {/* More Menu */}
                        {showMoreMenu === wallet.id && (
                          <div
                            ref={moreMenuRef}
                            className="absolute right-0 top-full mt-1 bg-hoh-card rounded-lg shadow-xl border border-gray-700 min-w-48 z-50"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleExportPrivateKey(wallet.id)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
                              >
                                <Key size={14} className="text-blue-400" />
                                <span>Export Private Key</span>
                              </button>
                              <button
                                onClick={() => handleRemoveWallet(wallet.id)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                              >
                                <Trash2 size={14} />
                                <span>Remove Wallet</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Import Sheet */}
      <BottomSheet
        isOpen={showImportSheet}
        onClose={() => {
          setShowImportSheet(false);
          resetImportForm();
        }}
        title="Import Wallet"
      >
        <div className="p-4 space-y-3">
          {!importType ? (
            <div className="space-y-2">
              <button
                onClick={() => setImportType('mnemonic')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-hoh-card rounded-xl hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-hoh-green/20 rounded-full flex items-center justify-center">
                  <Key size={20} className="text-hoh-green" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Mnemonic</div>
                  <div className="text-xs text-gray-500">Import using 12 or 24 words</div>
                </div>
              </button>
              <button
                onClick={() => setImportType('privateKey')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-hoh-card rounded-xl hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Key size={20} className="text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Private Key</div>
                  <div className="text-xs text-gray-500">Import using your private key</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setImportType(null)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">Group Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., My Wallet"
                  value={importGroupName}
                  onChange={(e) => setImportGroupName(e.target.value)}
                  className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-hoh-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {importType === 'mnemonic' ? 'Mnemonic Phrase' : 'Private Key'}
                </label>
                <textarea
                  placeholder={importType === 'mnemonic' 
                    ? 'Enter your 12 or 24 word mnemonic phrase' 
                    : 'Enter your private key'
                  }
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  rows={3}
                  className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-hoh-green focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password (min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showImportPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    className="w-full bg-hoh-card text-white px-4 py-3 pr-12 rounded-xl border border-gray-700 focus:border-hoh-green focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportPassword(!showImportPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showImportPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {importError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-sm text-red-400">
                  {importError}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={isLoading}
                className="w-full bg-hoh-green text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Importing...' : 'Import Wallet'}
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-hoh-card rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Export Wallets</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-gray-400">
                  This will export all wallets to a CSV file containing wallet names and addresses.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3 bg-hoh-card rounded-xl font-medium hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportToCSV}
                  className="flex-1 py-3 bg-hoh-green text-black rounded-xl font-bold hover:opacity-90"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
