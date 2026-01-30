import { useState } from 'react';
import { Globe, Plus, Trash2, X, Check, AlertCircle, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNetworkStore } from '../store/networkStore';
import { useWalletStore } from '../store/walletStore';
import { BottomSheet } from '../components/BottomSheet';

export const NetworkSwitchPage = () => {
  const navigate = useNavigate();
  const { networks, currentNetwork, switchNetwork, addCustomNetwork, removeNetwork, updateNetwork } = useNetworkStore();
  const { refreshBalance } = useWalletStore();

  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null);
  const [editingFormData, setEditingFormData] = useState({
    name: '',
    rpcUrl: '',
    explorerUrl: '',
  });
  const [showTestRpc, setShowTestRpc] = useState(false);

  const currentNetworkObj = networks.find(n => n.id === currentNetwork);

  const handleAddCustomNetwork = () => {
    setShowAddNetwork(true);
  };

  const handleEditNetwork = (networkId: string) => {
    const network = networks.find(n => n.id === networkId);
    if (!network) return;

    setEditingNetworkId(networkId);
    setEditingFormData({
      name: network.name,
      rpcUrl: network.rpcUrl,
      explorerUrl: network.explorerUrl,
    });
  };

  const handleTestRpc = async () => {
    setShowTestRpc(true);
    try {
      // Test RPC connection
      const response = await fetch(editingFormData.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error('RPC connection failed');
      }

      alert('RPC connection successful!');
      setTimeout(() => setShowTestRpc(false), 2000);
    } catch (error: any) {
      alert(`RPC connection failed: ${error.message}`);
    }
  };

  const handleSaveNetwork = () => {
    if (!editingNetworkId) return;

    updateNetwork(editingNetworkId, {
      name: editingFormData.name,
      rpcUrl: editingFormData.rpcUrl,
      explorerUrl: editingFormData.explorerUrl,
    });

    setEditingNetworkId(null);
    setEditingFormData({
      name: '',
      rpcUrl: '',
      explorerUrl: '',
    });
  };

  const handleRemoveNetwork = (networkId: string) => {
    if (confirm(`Are you sure you want to remove this network?`)) {
      removeNetwork(networkId);
    }
  };

  const handleAddNetwork = async () => {
    const name = editingFormData.name.trim();
    const rpcUrl = editingFormData.rpcUrl.trim();
    const explorerUrl = editingFormData.explorerUrl.trim();

    if (!name || !rpcUrl) {
      alert('Name and RPC URL are required');
      return;
    }

    // Validate URL
    try {
      new URL(rpcUrl);
    } catch {
      alert('Invalid RPC URL');
      return;
    }

    addCustomNetwork({
      name,
      rpcUrl,
      explorerUrl,
      chainId: `custom_${Date.now()}`,
      isDefault: false,
      isCustom: true,
    });

    setShowAddNetwork(false);
    setEditingFormData({
      name: '',
      rpcUrl: '',
      explorerUrl: '',
    });

    alert('Network added successfully');
    refreshBalance();
  };

  const handleSetDefault = (networkId: string) => {
    switchNetwork(networkId);
    navigate('/');
  };

  return (
    <div className="p-4 space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-hoh-card rounded-full"
        >
          <X size={20} />
        </button>
        <h1 className="text-xl font-bold">Network Settings</h1>
      </div>

      {/* Current Network */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentNetworkObj && (
              <>
                <div className={`w-10 h-10 ${currentNetworkObj.id === 'mainnet' ? 'bg-green-400' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
                  {currentNetworkObj.id === 'testnet' ? <TestTube size={20} className="text-white" /> : <Globe size={20} className="text-white" />}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{currentNetworkObj.name}</div>
                  <div className="text-white/70 text-sm">
                    {currentNetworkObj.chainId}
                  </div>
                </div>
              </>
            )}
            {!currentNetworkObj && (
              <div className="text-white/70 text-sm">No network selected</div>
            )}
          </div>
          <button
            onClick={() => {
              if (currentNetworkObj && currentNetworkObj.id === 'testnet') {
                handleSetDefault('mainnet');
              }
            }}
            disabled={!currentNetworkObj || currentNetworkObj.isDefault}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-black font-medium"
          >
            Set as Default
          </button>
        </div>
      </div>

      {/* Networks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Networks</h2>
          <button
            onClick={handleAddCustomNetwork}
            className="bg-hoh-green text-black font-bold py-2 px-4 rounded-xl hover:opacity-90"
          >
            <Plus size={16} />
            <span>Add Network</span>
          </button>
        </div>

        {networks.map(network => {
          const isCurrent = network.id === currentNetwork;

          return (
            <div
              key={network.id}
              className="bg-hoh-card rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${network.id === 'mainnet' ? 'bg-green-400' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
                    {network.id === 'testnet' ? <TestTube size={18} className="text-white" /> : <Globe size={18} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-bold">{network.name}</div>
                    {network.isDefault && (
                      <span className="text-xs bg-hoh-green/20 text-black px-2 py-0.5 rounded-full ml-2">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                {network.isCustom && (
                  <button
                    onClick={() => handleEditNetwork(network.id)}
                    className="p-2 hover:bg-gray-700 rounded-full"
                  title="Edit network"
                  >
                    <Trash2 size={16} className="text-gray-400" />
                  </button>
                )}
                {network.id === currentNetwork && !network.isDefault && (
                  <button
                    onClick={() => handleSetDefault(network.id)}
                    className="p-2 hover:bg-gray-700 rounded-full"
                    title="Set as default"
                  >
                    <Check size={16} className="text-green-400" />
                  </button>
                )}
                {isCurrent ? (
                  <button
                    onClick={() => switchNetwork(network.id)}
                    className="p-2 bg-hoh-green rounded-full"
                  >
                    <Check size={16} className="text-black" />
                  </button>
                ) : (
                  <button
                    onClick={() => switchNetwork(network.id)}
                    className="p-2 hover:bg-gray-700 rounded-full"
                  >
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Network Input Modal */}
      <BottomSheet
        isOpen={showAddNetwork}
        onClose={() => {
          setShowAddNetwork(false);
          setEditingFormData({
            name: '',
            rpcUrl: '',
            explorerUrl: '',
          });
        }}
        title="Add Custom Network"
      >
        <div className="p-4 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-3">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-400">
                Custom networks allow you to connect to any Sui-compatible RPC node. Make sure you trust the RPC provider.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Network Name *</label>
              <input
                type="text"
                value={editingFormData.name}
                onChange={(e) => setEditingFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., My Custom Network"
                className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">RPC URL *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editingFormData.rpcUrl}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, rpcUrl: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none font-mono text-sm"
                />
                <button
                  onClick={handleTestRpc}
                  disabled={!editingFormData.rpcUrl}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 rounded-lg font-medium"
                >
                  Test
                </button>
              </div>
              {showTestRpc && (
                <div className="text-sm text-gray-400 mt-2">
                  Connection successful!
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Explorer URL (Optional)</label>
              <input
                type="text"
                value={editingFormData.explorerUrl}
                onChange={(e) => setEditingFormData(prev => ({ ...prev, explorerUrl: e.target.value }))}
                placeholder="https://suiscan.xyz"
                className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowAddNetwork(false);
                setEditingFormData({
                  name: '',
                  rpcUrl: '',
                  explorerUrl: '',
                });
              }}
              className="flex-1 py-3 bg-hoh-card rounded-xl font-medium hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNetwork}
              className="flex-1 py-3 bg-hoh-green text-black font-bold rounded-xl hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Add Network
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Network Modal */}
      {editingNetworkId && (
        <BottomSheet
          isOpen={!!editingNetworkId}
          onClose={() => {
            setEditingNetworkId(null);
            setEditingFormData({
              name: '',
              rpcUrl: '',
              explorerUrl: '',
            });
          }}
          title="Edit Network"
        >
          <div className="p-4 space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-3">
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-500">
                  You are about to edit network settings. This may affect all operations on this network.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Network Name</label>
                <input
                  type="text"
                  value={editingFormData.name}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">RPC URL</label>
                <input
                  type="text"
                  value={editingFormData.rpcUrl}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, rpcUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Explorer URL</label>
                <input
                  type="text"
                  value={editingFormData.explorerUrl}
                  onChange={(e) => setEditingFormData(prev => ({ ...prev, explorerUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEditingNetworkId(null);
                  setEditingFormData({
                    name: '',
                    rpcUrl: '',
                    explorerUrl: '',
                  });
                }}
                className="flex-1 py-3 bg-hoh-card rounded-xl font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNetwork}
                className="flex-1 py-3 bg-hoh-green text-black font-bold rounded-xl hover:opacity-90"
              >
                Save Changes
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-hoh-border">
              <button
                onClick={() => {
                  setEditingNetworkId(null);
                  handleRemoveNetwork(editingNetworkId);
                }}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600"
              >
                Remove Network
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
