import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Download, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '../store/transactionStore';
import { useWalletStore } from '../store/walletStore';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const { transactions, isLoading, loadTransactions } = useTransactionStore();
  const { currentWalletId, getAllWallets } = useWalletStore();
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'swap'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);

  useEffect(() => {
    if (currentWallet) {
      loadTransactions(currentWallet.address);
    }
  }, [currentWallet, loadTransactions]);

  const handleRefresh = () => {
    if (currentWallet) {
      loadTransactions(currentWallet.address);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight size={20} className="text-red-400" />;
      case 'receive':
        return <ArrowDownLeft size={20} className="text-green-400" />;
      case 'swap':
        return <RefreshCw size={20} className="text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredTransactions = transactions.filter(tx => {
    const typeMatch = filter === 'all' || tx.type === filter;

    let dateMatch = true;
    if (dateFilter !== 'all') {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

      switch (dateFilter) {
        case 'week':
          dateMatch = diffDays <= 7;
          break;
        case 'month':
          dateMatch = diffDays <= 30;
          break;
        case 'year':
          dateMatch = diffDays <= 365;
          break;
      }
    }

    return typeMatch && dateMatch;
  });

  const handleExport = () => {
    const csvContent = [
      'Type,Symbol,Amount,Address,Timestamp,Status',
      ...filteredTransactions.map(tx =>
        `${tx.type},${tx.symbol},${tx.amount},${tx.type === 'receive' ? tx.from : tx.to},${new Date(tx.timestamp).toISOString()},${tx.status}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-hoh-card rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Transaction History</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterModal(true)}
              className="p-2 hover:bg-hoh-card rounded-full"
            >
              <Calendar size={20} />
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-hoh-card rounded-full"
              disabled={isLoading}
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-hoh-card rounded-full"
              title="Export Transactions"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'send' as const, label: 'Sent' },
            { id: 'receive' as const, label: 'Received' },
            { id: 'swap' as const, label: 'Swapped' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-hoh-green text-black'
                  : 'bg-hoh-card text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {isLoading ? (
          <div className="text-center text-gray-400 py-20">
            <RefreshCw size={32} className="mx-auto mb-3 animate-spin" />
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <div className="text-4xl mb-3">📭</div>
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-hoh-card rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Icon and Info */}
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-hoh-hover rounded-full flex items-center justify-center">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium capitalize">{tx.type}</span>
                        <span className={`text-xs ${getStatusColor(tx.status)}`}>
                          {getStatusText(tx.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {formatAddress(tx.type === 'receive' ? tx.from : tx.to)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(tx.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount and Link */}
                  <div className="text-right">
                    <div className={`font-bold ${tx.type === 'receive' ? 'text-green-400' : ''}`}>
                      {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
                    </div>
                    {tx.txDigest && (
                      <a
                        href={`https://suiscan.xyz/tx/${tx.txDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-hoh-green hover:underline flex items-center justify-end mt-1"
                      >
                        View <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
         )}
       </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-hoh-card rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Filter Transactions</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Time Period</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all' as const, label: 'All Time' },
                  { id: 'week' as const, label: 'Last 7 Days' },
                  { id: 'month' as const, label: 'Last 30 Days' },
                  { id: 'year' as const, label: 'Last 365 Days' },
                ].map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setDateFilter(period.id)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      dateFilter === period.id
                        ? 'bg-hoh-green text-black'
                        : 'bg-hoh-hover text-white hover:bg-gray-700'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowFilterModal(false)}
              className="w-full py-3 bg-hoh-green text-black rounded-xl font-bold hover:opacity-90"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
     </div>
   );
};