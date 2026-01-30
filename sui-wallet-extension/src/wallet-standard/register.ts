import { registerWallet } from '@mysten/wallet-standard';
import { HOHXSuiWallet } from './HOHXSuiWallet';

console.log('[HOH Wallet] Injecting wallet standard adapter...');

const wallet = new HOHXSuiWallet();
registerWallet(wallet);

console.log('[HOH Wallet] Registered successfully!');
