import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useWalletStore } from './store/walletStore';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Swap } from './pages/Swap';
import { Welcome } from './pages/Welcome';
import { Unlock } from './pages/Unlock';
import { RequestApproval } from './pages/RequestApproval';
import { WalletManagement } from './pages/WalletManagement';
import { SettingsPage } from './pages/Settings';
import { SendPage } from './pages/Send';
import { HistoryPage } from './pages/History';
import { ReceivePage } from './pages/Receive';
import { BackupMnemonicPage } from './pages/BackupMnemonic';
import { CoinDetail } from './pages/CoinDetail';
import { NFTDetail } from './pages/NFTDetail';
import { StakingPage } from './pages/Staking';
import { AddTokenPage } from './pages/AddToken';
import { ContactsPage } from './pages/Contacts';
import { NetworkSwitchPage } from './pages/NetworkSwitch';

function App() {
  const { walletGroups, isLocked } = useWalletStore();
  const location = useLocation();
  const isApprovalWindow = location.hash.includes('approve') || location.pathname.includes('approve');

  useEffect(() => {
    // This effect is no longer needed since we handle unlocking separately
  }, []);

  // If this is the approval window, we don't show the full wallet UI structure (nav, etc)
  if (isApprovalWindow) {
     return (
        <Routes>
           <Route path="/approve" element={<RequestApproval />} />
        </Routes>
     );
  }

  // If wallet exists but is locked, show unlock screen
  if (walletGroups.length > 0 && isLocked) {
    return <Unlock />;
  }

  // If no wallet exists, show welcome screen
  if (walletGroups.length === 0) {
    return <Welcome />;
  }

  return (
    <div className="bg-hoh-bg text-white h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="/receive" element={<ReceivePage />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/wallets" element={<WalletManagement />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/backup" element={<BackupMnemonicPage />} />
          <Route path="/coin/:address" element={<CoinDetail />} />
          <Route path="/nft/:nftId" element={<NFTDetail />} />
          <Route path="/staking" element={<StakingPage />} />
          <Route path="/add-token" element={<AddTokenPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/network" element={<NetworkSwitchPage />} />
          {/* Fallback route for approval in case accessed directly */}
          <Route path="/approve" element={<RequestApproval />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

export default App;
