import { useEffect, useState } from 'react';
import { useWalletStore } from '../store/walletStore';

export const RequestApproval = () => {
  const [request, setRequest] = useState<any>(null);
  const { getAllWallets, currentWalletId } = useWalletStore();
  const [loading, setLoading] = useState(false);

  const wallets = getAllWallets();
  const currentWallet = wallets.find(w => w.id === currentWalletId);

  useEffect(() => {
    // 1. Load pending request
    chrome.storage.local.get(['pendingRequest'], (result) => {
      if (result.pendingRequest) {
        setRequest(result.pendingRequest);
      }
    });

    // 2. Wallet should already be unlocked at this point
  }, []);

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (!currentWallet) throw new Error('No wallet selected');

      let result;
      const { method, params } = request;

      if (method === 'connect') {
        result = {
          accounts: [{
            address: currentWallet.keypair.getPublicKey().toSuiAddress(),
            publicKey: currentWallet.keypair.getPublicKey().toRawBytes(), // Use toRawBytes()
            chains: ['sui:mainnet']
          }]
        };
      }
       else if (method === 'signTransactionBlock') {
         const { signature } = await currentWallet.keypair.signTransaction(params.transactionBlockBytes);
         result = {
           signature,
           transactionBlockBytes: params.transactionBlockBytes
         };
       }

      // Send result back to background
      chrome.runtime.sendMessage({
        type: 'APPROVAL_RESULT',
        success: true,
        result
      });

    } catch (e: any) {
      console.error(e);
      chrome.runtime.sendMessage({
        type: 'APPROVAL_RESULT',
        success: false,
        error: e.message
      });
    } finally {
        setLoading(false);
    }
  };

  const handleReject = () => {
    chrome.runtime.sendMessage({
        type: 'APPROVAL_RESULT',
        success: false,
        error: 'User rejected'
    });
  };

  if (!request) return <div className="p-10 text-center">Loading request...</div>;

  return (
    <div className="h-full bg-hoh-bg text-white p-6 flex flex-col">
      <h2 className="text-xl font-bold mb-6 text-center">Request Signature</h2>
      
      <div className="flex-1 bg-hoh-card rounded-xl p-4 mb-6 overflow-auto">
         <h3 className="font-bold text-gray-400 text-sm mb-2">Method</h3>
         <div className="mb-4 font-mono bg-black p-2 rounded">{request.method}</div>
         
         <h3 className="font-bold text-gray-400 text-sm mb-2">Params</h3>
         <pre className="text-xs break-all whitespace-pre-wrap font-mono text-gray-300">
            {JSON.stringify(request.params, null, 2)}
         </pre>
      </div>

      <div className="flex space-x-4">
        <button 
            onClick={handleReject}
            className="flex-1 py-3 bg-gray-800 rounded-xl font-bold hover:bg-gray-700">
            Reject
        </button>
        <button 
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 py-3 bg-okx-green text-black rounded-xl font-bold hover:opacity-90">
            {loading ? 'Signing...' : 'Approve'}
        </button>
      </div>
    </div>
  );
};
