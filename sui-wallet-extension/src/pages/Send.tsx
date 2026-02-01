import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { useContactsStore, Contact } from '../store/contactsStore';
import { ArrowLeft, AlertCircle, CheckCircle, Zap, Users, ChevronRight, Globe, X } from 'lucide-react';
import { getShortAddress } from '../lib/utils';
import { getSymbolByAddress, TOKENS } from '../lib/tokens';
import { tokenTransferService } from '../lib/tokenTransferService';
import { gasService, GasEstimate } from '../lib/gasService';
import { BottomSheet } from '../components/BottomSheet';
import { suiNS, SuiNSName } from '../lib/suins';

export const SendPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAllWallets, currentWalletId, balance, tokenBalances } = useWalletStore();
  const { contacts } = useContactsStore();

  const tokenAddress = location.state?.token || '0x0000000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
  const selectedToken = getSymbolByAddress(tokenAddress) || 'SUI';
  const tokenInfo = TOKENS[selectedToken] || { decimals: 9, address: tokenAddress };
  const tokenBalance = tokenBalances.find(t => t.info.address === tokenAddress || t.symbol === selectedToken);

  const [recipient, setRecipient] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<SuiNSName | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [amount, setAmount] = useState('');
  const [error] = useState('');
  const [estimatedGas, setEstimatedGas] = useState<string>('0');
  const [gasLevel, setGasLevel] = useState<'slow' | 'average' | 'fast'>('average');
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [txDigest] = useState<string>('');
  const resolveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);
  const currentBalance = selectedToken === 'SUI'
    ? parseFloat(balance)
    : (tokenBalance ? parseFloat(tokenBalance.formatted) : 0);

  console.log('[Send] Balance received:', balance, 'type:', typeof balance, 'parsed:', currentBalance, 'type:', typeof currentBalance);

  // Estimate gas when amount changes
  useEffect(() => {
    const estimateGas = async () => {
      const actualRecipient = resolvedAddress || recipient;
      if (!amount || !actualRecipient || !currentWallet) return;

      try {
        const estimate = await gasService.estimateTransactionFee(
          1000, // Default gas limit
          gasLevel
        );

        setGasEstimate(estimate);
        
        const gasEstimateDetail = await tokenTransferService.estimateGas({
          recipient: actualRecipient,
          amount: parseFloat(amount),
          tokenAddress,
          decimals: tokenInfo.decimals,
        });

        setEstimatedGas(gasEstimateDetail.toString());
      } catch (err) {
        console.error('Gas estimation failed:', err);
        setEstimatedGas('0.001'); // Default gas estimate
      }
    };

    estimateGas();
  }, [amount, resolvedAddress, recipient, gasLevel, currentWallet, tokenAddress, tokenInfo.decimals]);

  const handleMaxAmount = () => {
    const maxAmount = Math.max(0, currentBalance - 0.001);
    setAmount(maxAmount.toFixed(4));
  };

  // SuiNS 域名解析（支持正向解析和反向解析）
  const resolveSuiNSName = useCallback(async (input: string) => {
    if (!input.trim()) {
      setResolvedAddress(null);
      setResolvedName(null);
      return;
    }

    setIsResolving(true);
    try {
      // 检查是否是 SuiNS 域名格式（包括 @ 格式）
      if (suiNS.isSuiNSName(input)) {
        // 正向解析：域名 -> 地址
        const address = await suiNS.resolveName(input);
        if (address) {
          setResolvedAddress(address);
          // 使用规范化后的域名显示（将 @example 显示为 example.sui）
          setResolvedName({
            name: suiNS.normalizeName(input),
            address: address,
          });
        } else {
          setResolvedAddress(null);
          setResolvedName(null);
        }
      } else if (input.trim().startsWith('0x') && input.trim().length >= 42) {
        // 反向解析：地址 -> 域名（地址格式：0x... 且长度足够）
        const normalizedAddress = input.trim().toLowerCase();
        setResolvedAddress(normalizedAddress);
        
        // 尝试反向查找域名
        const nameResult = await suiNS.reverseLookup(normalizedAddress);
        if (nameResult) {
          setResolvedName(nameResult);
        } else {
          setResolvedName(null);
        }
      } else {
        // 既不是域名也不是有效地址，直接返回输入
        setResolvedAddress(input.trim());
        setResolvedName(null);
      }
    } catch (err) {
      console.error('Failed to resolve SuiNS:', err);
      // 出错时使用原始输入作为地址
      setResolvedAddress(input.trim());
      setResolvedName(null);
    } finally {
      setIsResolving(false);
    }
  }, []);

  // 延迟解析域名
  useEffect(() => {
    if (resolveTimeoutRef.current) {
      clearTimeout(resolveTimeoutRef.current);
    }

    if (recipient.trim()) {
      resolveTimeoutRef.current = setTimeout(() => {
        resolveSuiNSName(recipient);
      }, 500);
    } else {
      setResolvedAddress(null);
      setResolvedName(null);
    }

    return () => {
      if (resolveTimeoutRef.current) {
        clearTimeout(resolveTimeoutRef.current);
      }
    };
  }, [recipient, resolveSuiNSName]);

  // 处理地址输入
  const handleRecipientChange = (value: string) => {
    setRecipient(value);
  };

  if (false) {
    return (
      <div className="p-4 space-y-6 pt-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-hoh-card rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Transaction Sent</h1>
        </div>

        <div className="bg-hoh-card rounded-xl p-6 text-center space-y-4">
          <CheckCircle size={48} className="text-green-500 mx-auto" />
          <h2 className="text-lg font-bold">Success!</h2>
          <p className="text-hoh-text-secondary">Your transaction has been sent successfully</p>

          <div className="bg-hoh-hover rounded-lg p-3 text-left">
            <div className="text-sm text-hoh-text-secondary">Transaction Hash</div>
            <div className="font-mono text-xs break-all">{txDigest}</div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-hoh-green text-black font-bold py-3 rounded-xl hover:opacity-90"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSelectContact = (contact: Contact) => {
    setRecipient(contact.address);
    setShowContactSelector(false);
  };

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
        <h1 className="text-xl font-bold">Send {selectedToken}</h1>
      </div>

      {/* Balance Display */}
      <div className="bg-hoh-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-hoh-text-secondary">Available Balance</span>
          <span className="font-bold">{currentBalance.toFixed(4)} {selectedToken}</span>
        </div>
      </div>

      {/* Recipient Address */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Recipient Address or SuiNS Name</label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              placeholder="0x... or example.sui or @example"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              rows={3}
              className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none text-base leading-relaxed resize-none pr-10"
            />
            {recipient.trim() && (
              <button
                onClick={() => handleRecipientChange('')}
                className="absolute right-3 top-3 p-1 hover:bg-gray-600 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowContactSelector(true)}
            className="p-3 bg-hoh-card border border-hoh-border rounded-xl hover:bg-gray-700"
            title="Select from contacts"
          >
            <Users size={20} />
          </button>
        </div>

        {/* SuiNS 解析结果 */}
        {isResolving && (
          <div className="flex items-center gap-2 text-sm text-hoh-green">
            <div className="animate-spin w-4 h-4 border-2 border-hoh-green border-t-transparent rounded-full" />
            <span>Resolving SuiNS name...</span>
          </div>
        )}

        {resolvedName && !isResolving && (
          <div className="bg-hoh-green/10 border border-hoh-green/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-hoh-green" />
              <span className="text-sm font-medium text-hoh-green">{resolvedName.name}</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {getShortAddress(resolvedName.address)}
            </div>
          </div>
        )}

        {/* 只在输入是域名格式但解析失败时显示错误 */}
        {recipient.trim() && suiNS.isSuiNSName(recipient) && !resolvedAddress && !isResolving && (
          <div className="text-sm text-red-400">
            SuiNS name not found
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">Amount ({selectedToken})</label>
          <button
            onClick={handleMaxAmount}
            className="text-sm text-hoh-green hover:text-hoh-green/80"
          >
            Max
          </button>
        </div>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.000001"
          min="0"
          className="w-full bg-hoh-card text-white px-4 py-3 rounded-xl border border-hoh-border focus:border-hoh-green focus:outline-none"
        />
      </div>

      {/* Gas Settings */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Gas Level</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { level: 'slow' as const, label: 'Slow', desc: 'Lowest fee' },
            { level: 'average' as const, label: 'Average', desc: 'Normal fee' },
            { level: 'fast' as const, label: 'Fast', desc: 'Highest fee' }
          ].map(({ level, label, desc }) => (
            <button
              key={level}
              onClick={() => setGasLevel(level)}
              className={`p-3 rounded-lg text-center transition-colors ${
                gasLevel === level
                  ? 'bg-hoh-green text-black ring-2 ring-hoh-green/50'
                  : 'bg-hoh-card text-gray-400 hover:text-white'
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs">{desc}</div>
              {gasEstimate && (
                <div className="text-xs mt-1 font-mono">
                  ~{gasService.formatGasFee(
                    gasLevel === 'slow' ? gasEstimate.minFee :
                    gasLevel === 'fast' ? gasEstimate.maxFee :
                    gasEstimate.estimatedFee,
                    selectedToken
                  )} SUI
                </div>
              )}
            </button>
          ))}
        </div>
        {gasEstimate && (
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <div className="flex items-center space-x-1">
              <Zap size={12} />
              <span>Est. time: {gasEstimate.estimatedTime}</span>
            </div>
            <span>Current gas price: {gasService.formatGasFee(gasEstimate.minFee || 0.001, 'SUI')}</span>
          </div>
        )}
      </div>

      {/* Transaction Summary */}
      {amount && (
        <div className="bg-hoh-card rounded-xl p-4 space-y-2">
          <h3 className="font-medium">Transaction Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-hoh-text-secondary">Amount</span>
            <span>{amount} {selectedToken}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-hoh-text-secondary">Estimated Gas Fee</span>
            <span>{estimatedGas} SUI</span>
          </div>
          <div className="border-t border-hoh-border pt-2 flex justify-between font-medium">
            <span>Total</span>
            <span>{(parseFloat(amount || '0') + parseFloat(estimatedGas)).toFixed(6)} {selectedToken === 'SUI' ? 'SUI' : selectedToken}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Send Button */}
      <button
        disabled={!recipient || !amount || !!error || isResolving || (suiNS.isSuiNSName(recipient) && !resolvedAddress)}
        className="w-full bg-hoh-green text-black font-bold py-2 px-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isResolving ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
            <span>Resolving...</span>
          </>
        ) : (
          <span>Send {selectedToken}</span>
        )}
      </button>

      {/* Contact Selector Bottom Sheet */}
      <BottomSheet
        isOpen={showContactSelector}
        onClose={() => setShowContactSelector(false)}
        title="Select from Contacts"
      >
        <div className="p-4 space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-400 mb-4">No contacts saved yet</p>
              <button
                onClick={() => {
                  setShowContactSelector(false);
                  navigate('/contacts');
                }}
                className="bg-hoh-green text-black font-bold py-3 px-6 rounded-xl hover:opacity-90"
              >
                Go to Contacts
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {contacts.slice(0, 10).map((contact: Contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center justify-between p-3 bg-hoh-card rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-hoh-green/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-hoh-green">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-400 font-mono">{getShortAddress(contact.address)}</div>
                      {contact.note && (
                        <div className="text-xs text-gray-500 mt-1">{contact.note}</div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
              ))}
              {contacts.length > 10 && (
                <button
                  onClick={() => {
                    setShowContactSelector(false);
                    navigate('/contacts');
                  }}
                  className="w-full py-1.5 px-3 bg-hoh-card text-white font-medium rounded-lg hover:bg-gray-700 transition-all text-center"
                >
                  View All Contacts ({contacts.length})
                </button>
              )}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};