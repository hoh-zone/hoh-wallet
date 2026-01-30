import { useState } from 'react';
import { Globe, QrCode, Plus, ExternalLink, Info } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';

export const MoreMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: Globe,
      label: 'Explore Blockchains',
      description: 'Browse Sui dApps and protocols',
      action: () => window.open('https://suiscan.xyz', '_blank'),
    },
    {
      icon: Plus,
      label: 'Add Token',
      description: 'Add custom tokens to your wallet',
      action: () => {
        alert('Add token feature coming soon!');
        setIsOpen(false);
      },
    },
    {
      icon: QrCode,
      label: 'Scan QR Code',
      description: 'Scan a QR code to send or receive',
      action: () => {
        alert('QR scanner feature coming soon!');
        setIsOpen(false);
      },
    },
    {
      icon: ExternalLink,
      label: 'Open in Explorer',
      description: 'View your address on SuiScan',
      action: () => window.open('https://suiscan.xyz', '_blank'),
    },
    {
      icon: Info,
      label: 'About',
      description: 'Learn more about HOH Wallet',
      action: () => {
        alert('HOH Wallet v1.0.0\nA secure and user-friendly Sui wallet.');
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-hoh-card rounded-full"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="More Options"
      >
        <div className="p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="w-10 h-10 bg-hoh-green/20 rounded-full flex items-center justify-center">
                <item.icon size={20} className="text-hoh-green" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-400">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
};
