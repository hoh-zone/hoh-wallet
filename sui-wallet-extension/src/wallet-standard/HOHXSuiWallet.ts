import type {
  StandardConnectFeature,
  StandardEventsFeature,
  Wallet,
  SuiFeatures,
  SuiSignTransactionBlockOutput,
  SuiSignAndExecuteTransactionBlockOutput,
  SuiSignPersonalMessageOutput
} from '@mysten/wallet-standard';
import { ReadonlyWalletAccount } from '@mysten/wallet-standard';

export const SuiChain = {
  SUI_MAINNET: 'sui:mainnet',
  SUI_TESTNET: 'sui:testnet',
} as const;

// Helper to send messages to Content Script
function postRequest(method: string, params: any): Promise<any> {
  const id = Math.random().toString(36).substring(7);
  return new Promise((resolve, reject) => {
    // Listener for response
    const listener = (event: MessageEvent) => {
      if (event.data.target === 'HOH_WALLET_INJECT' && event.data.requestId === id) {
        window.removeEventListener('message', listener);
        if (event.data.payload.error) {
          reject(new Error(event.data.payload.error));
        } else {
          resolve(event.data.payload.data);
        }
      }
    };
    window.addEventListener('message', listener);

    // Send to Content Script
    window.postMessage({
      target: 'HOH_WALLET_CONTENT',
      payload: { id, method, params }
    }, window.location.origin);
  });
}

export class HOHXSuiWallet implements Wallet {
  readonly name = 'HOH Wallet';
  readonly version = '1.0.0';
  readonly icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBGRjgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtM2wtOCAzdjdsOCAxeiIvPjwvc3ZnPg==`; 
  
  get accounts() {
    // In a real app this should be synced, for now we request it
    return this._accounts;
  }

  get chains() {
    return [SuiChain.SUI_MAINNET, SuiChain.SUI_TESTNET] as any;
  }

  get features(): StandardConnectFeature & StandardEventsFeature & SuiFeatures {
    return {
      'standard:connect': {
        version: '1.0.0',
        connect: this.connect.bind(this),
      },
      'standard:events': {
        version: '1.0.0',
        on: this.on.bind(this),
      },
      'sui:signTransactionBlock': {
        version: '1.0.0', 
        signTransactionBlock: this.signTransactionBlock.bind(this) as any,
      },
      'sui:signAndExecuteTransactionBlock': {
        version: '1.0.0', 
        signAndExecuteTransactionBlock: this.signAndExecuteTransactionBlock.bind(this) as any,
      },
      'sui:signPersonalMessage': {
        version: '1.0.0',
        signPersonalMessage: this.signPersonalMessage.bind(this) as any,
      },
    } as any;
  }

  private _accounts: ReadonlyWalletAccount[] = [];

  async connect() {
    try {
      const result = await postRequest('connect', {});
      
      this._accounts = result.accounts.map((acc: any) => new ReadonlyWalletAccount({
        address: acc.address,
        publicKey: new Uint8Array(Object.values(acc.publicKey)), // Deserialize
        chains: [SuiChain.SUI_MAINNET as any],
        features: ['sui:signTransactionBlock', 'sui:signAndExecuteTransactionBlock'],
      }));
      
      return { accounts: this.accounts };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  on(event: string, _listener: any) {
    console.log(`[OKX Wallet] Event listener added for ${event}`);
    return () => {};
  }

  async signTransactionBlock(input: any): Promise<SuiSignTransactionBlockOutput> {
    return await postRequest('signTransactionBlock', input);
  }

  async signAndExecuteTransactionBlock(input: any): Promise<SuiSignAndExecuteTransactionBlockOutput> {
    return await postRequest('signAndExecuteTransactionBlock', input);
  }

  async signPersonalMessage(input: any): Promise<SuiSignPersonalMessageOutput> {
    return await postRequest('signPersonalMessage', input);
  }
}
