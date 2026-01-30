import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { Plus, Trash2, Edit2, Check, X, ArrowLeft, Key, AlertTriangle, Eye, EyeOff, Copy, Folder, Download, ChevronRight, Layers, FileSpreadsheet } from 'lucide-react';
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
  const [exportWalletId, setExportWalletId] = useState<string | null>(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [exportedPrivateKey, setExportedPrivateKey] = useState('');
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey' | null>(null);
  const [importInput, setImportInput] = useState('');
  const [importGroupName, setImportGroupName] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [batchCount, setBatchCount] = useState('10');
  const [batchError, setBatchError] = useState('');

  const activeGroup = walletGroups.find(g => g.id === activeGroupId);

  const handleAddWallet = async () => {
    if (activeGroupId) {
      await addWalletToGroup(activeGroupId);
    }
  };

  const handleBatchAddWallets = async () => {
    const count = parseInt(batchCount);
    if (isNaN(count) || count < 1) {
      setBatchError('Please enter a valid number');
      return;
    }
    if (count > 1000) {
      setBatchError('Cannot create more than 1000 wallets at once');
      return;
    }
    if (activeGroup && activeGroup.wallets.length + count > 1000) {
      setBatchError(`Cannot exceed 1000 wallets total. Current: ${activeGroup.wallets.length}, Max additional: ${1000 - activeGroup.wallets.length}`);
      return;
    }

    setBatchError('');
    try {
      await addWalletToGroup(activeGroupId!, count);
      setShowBatchAdd(false);
      setBatchCount('10');
    } catch (e: any) {
      setBatchError(e.message || 'Failed to create wallets');
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
  };

  const handleStartEditWallet = (walletId: string, currentAlias: string) => {
    setEditingWalletId(walletId);
    setEditValue(currentAlias);
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
    }
  };

  const handleExportPrivateKey = (walletId: string) => {
    setExportWalletId(walletId);
    setShowExportConfirm(true);
  };

  const handleConfirmExport = async () => {
    setShowExportConfirm(false);

    if (!exportWalletId) return;

    try {
      // Find wallet
      const allWallets = walletGroups.flatMap(g => g.wallets);
      const wallet = allWallets.find(w => w.id === exportWalletId);
      if (!wallet) throw new Error('Wallet not found');

      const secretKey = wallet.keypair.getSecretKey();
      setExportedPrivateKey(secretKey);
      setShowExportPassword(true);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export private key. Please try again.');
    }
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
    <div className="p-4 space-y-6 pt-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-hoh-card rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Wallet Management</h1>
      </div>

      <button
        onClick={() => setShowImportSheet(true)}
        className="w-full flex items-center justify-center space-x-2 bg-hoh-green text-black font-bold py-3 rounded-xl hover:opacity-90 transition-colors"
      >
        <Download size={20} />
        <span>Import Wallet</span>
      </button>

      {walletGroups.length > 0 && (
        <button
          onClick={handleExportToCSV}
          className="w-full flex items-center justify-center space-x-2 bg-hoh-card text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors"
        >
          <FileSpreadsheet size={20} />
          <span>Export to CSV</span>
        </button>
      )}

      {walletGroups.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No wallets found. Import or create your first wallet.
        </div>
      ) : (
        <>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {walletGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeGroupId === group.id
                    ? 'bg-hoh-green text-black'
                    : 'bg-hoh-card text-gray-400 hover:text-white'
                }`}
              >
                <Folder size={16} />
                <span>
                  {editingGroupId === group.id ? (
                    <input
                      type="text"
                      value={editGroupValue}
                      onChange={(e) => setEditGroupValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-black outline-none w-24"
                      autoFocus
                    />
                  ) : (
                    group.name
                  )}
                </span>
                {editingGroupId === group.id ? (
                  <div className="flex items-center space-x-1">
                    <Check
                      size={14}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEditGroup();
                      }}
                    />
                    <X
                      size={14}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEditGroup();
                      }}
                    />
                  </div>
                ) : (
                  <Edit2
                    size={12}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditGroup(group.id, group.name);
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {activeGroup && (
            <div className="space-y-3">
              <button
                onClick={() => setShowBatchAdd(true)}
                disabled={isLoading || activeGroup.type === 'privateKey'}
                className="w-full flex items-center justify-center space-x-2 bg-hoh-green text-black font-bold py-2 rounded-xl hover:opacity-90 transition-colors disabled:opacity-50"
              >
                <Layers size={18} />
                <span>Batch Generate Wallets</span>
              </button>

              <button
                onClick={handleAddWallet}
                disabled={isLoading || activeGroup.type === 'privateKey'}
                className="w-full flex items-center justify-center space-x-2 bg-hoh-card text-white font-medium py-2 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
                <span>{isLoading ? 'Adding...' : 'Add Wallet to Group'}</span>
              </button>

              {activeGroup.wallets.map(wallet => {
                const isCurrentWallet = wallet.id === currentWalletId;
                return (
                  <div key={wallet.id} className="bg-hoh-card rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingWalletId === wallet.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="bg-transparent border-b border-hoh-green text-white outline-none flex-1"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEditWallet}
                              className="p-1 text-hoh-green hover:bg-hoh-green/20 rounded"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEditWallet}
                              className="p-1 text-gray-400 hover:bg-gray-600 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{wallet.alias}</span>
                            {isCurrentWallet && (
                              <span className="text-xs bg-hoh-green text-black px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                            <button
                              onClick={() => handleStartEditWallet(wallet.id, wallet.alias)}
                              className="p-1 text-gray-400 hover:text-white rounded"
                              title="Rename wallet"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                        <div className="text-sm text-gray-400 font-mono mt-1">
                          {getShortAddress(wallet.address)}
                          <button
                            onClick={() => navigator.clipboard.writeText(wallet.address)}
                            className="text-xs text-gray-500 hover:text-white ml-2"
                            title="Copy address"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleExportPrivateKey(wallet.id)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full"
                          title="Export private key"
                        >
                          <Key size={16} />
                        </button>
                        {walletGroups.flatMap(g => g.wallets).length > 1 && (
                          <button
                            onClick={() => handleRemoveWallet(wallet.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full"
                            title="Remove wallet"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <BottomSheet
        isOpen={showImportSheet}
        onClose={() => {
          setShowImportSheet(false);
          resetImportForm();
        }}
        title="Import Wallet"
      >
        <div className="p-4 space-y-4">
          {!importType ? (
            <div className="space-y-3">
              <button
                onClick={() => setImportType('mnemonic')}
                className="w-full flex items-center justify-between p-4 bg-hoh-card rounded-xl hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-hoh-green/20 rounded-full flex items-center justify-center">
                    <Key size={24} className="text-hoh-green" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Import from Mnemonic</div>
                    <div className="text-sm text-gray-400">Import using 12 or 24 word phrase</div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>

              <button
                onClick={() => setImportType('privateKey')}
                className="w-full flex items-center justify-between p-4 bg-hoh-card rounded-xl hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Key size={24} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Import from Private Key</div>
                    <div className="text-sm text-gray-400">Import using your private key</div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setImportType(null)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                  <p className="text-sm text-yellow-500">
                    Security Warning: Only import from trusted sources. Never share your mnemonic or private key.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Group Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., My Wallet Group"
                  value={importGroupName}
                  onChange={(e) => setImportGroupName(e.target.value)}
                  className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
                />
              </div>

              {importType === 'mnemonic' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Mnemonic Phrase</label>
                  <textarea
                    placeholder="Enter your 12 or 24 word mnemonic phrase, separated by spaces"
                    value={importInput}
                    onChange={(e) => setImportInput(e.target.value)}
                    rows={3}
                    className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none resize-none"
                  />
                </div>
              )}

              {importType === 'privateKey' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Private Key</label>
                  <textarea
                    placeholder="Enter your private key (starting with suiprivkey1 or base58 encoded)"
                    value={importInput}
                    onChange={(e) => setImportInput(e.target.value)}
                    rows={3}
                    className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none resize-none font-mono text-xs"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium">Set Password (min 8 characters)</label>
                <div className="relative">
                  <input
                    type={showImportPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    className="w-full bg-hoh-card text-white px-4 py-3 pr-12 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportPassword(!showImportPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showImportPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {importError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
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

      <BottomSheet
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        title="⚠️ Security Warning"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-yellow-500 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-500 mb-2">Export Private Key</h3>
              <p className="text-sm text-hoh-text-secondary mb-3">
                Exporting your private key is dangerous. Anyone with access to this key can control your funds.
                Make sure you're in a secure environment and never share this key with anyone.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowExportConfirm(false)}
              className="flex-1 py-3 bg-hoh-card rounded-xl font-medium hover:bg-hoh-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmExport}
              className="flex-1 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:opacity-90"
            >
              I Understand, Continue
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={showExportPassword}
        onClose={() => {
          setShowExportPassword(false);
        }}
        title="Private Key"
      >
        <div className="p-4 space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="text-red-500" size={16} />
              <span className="text-red-500 font-semibold text-sm">Keep this private key secure!</span>
            </div>
            <p className="text-xs text-hoh-text-secondary">
              Never share this key. Anyone with this key can access your funds.
            </p>
          </div>

          <div className="bg-hoh-card rounded-lg p-3">
            <div className="text-xs text-hoh-text-secondary mb-1">Private Key</div>
            <div className="font-mono text-sm break-all bg-hoh-hover p-2 rounded">
              {exportedPrivateKey}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => navigator.clipboard.writeText(exportedPrivateKey)}
              className="flex-1 py-3 bg-hoh-card rounded-xl font-medium hover:bg-hoh-hover"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => setExportedPrivateKey('')}
              className="flex-1 py-3 bg-hoh-green text-black rounded-xl font-bold hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={showBatchAdd}
        onClose={() => {
          setShowBatchAdd(false);
          setBatchError('');
          setBatchCount('10');
        }}
        title="Batch Generate Wallets"
      >
        <div className="p-4 space-y-4">
          {activeGroup && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <Layers size={16} className="text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-400 font-medium mb-1">Group: {activeGroup.name}</p>
                  <p className="text-gray-400">
                    Current wallets: {activeGroup.wallets.length} / 1000
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">Number of Wallets to Generate</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
              placeholder="Enter number (1-1000)"
            />
            <p className="text-xs text-gray-400">
              You can generate up to {activeGroup ? 1000 - activeGroup.wallets.length : 1000} more wallets in this group
            </p>
          </div>

          {batchError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
              {batchError}
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-500">
                Generating a large number of wallets may take some time. Please wait for the process to complete.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowBatchAdd(false);
                setBatchError('');
                setBatchCount('10');
              }}
              disabled={isLoading}
              className="flex-1 py-3 bg-hoh-card rounded-xl font-medium hover:bg-hoh-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBatchAddWallets}
              disabled={isLoading || activeGroup?.type === 'privateKey'}
              className="flex-1 py-3 bg-hoh-green text-black rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : `Generate ${batchCount} Wallets`}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
