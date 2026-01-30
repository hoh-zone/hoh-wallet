import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useSecurityStore } from '../store/securityStore';
import { ArrowLeft, Globe, Network, Moon, Sun, Check, ChevronRight, Shield, Plus, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '../lib/i18n';
import { BottomSheet } from '../components/BottomSheet';

type Language = 'en' | 'zh';
type NetworkType = 'mainnet' | 'testnet';
type Theme = 'dark' | 'light';

interface Settings {
  language: Language;
  network: NetworkType;
  theme: Theme;
}

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { refreshBalance } = useWalletStore();
  const { requirePasswordForSend, requirePasswordForSwap, requirePasswordForApprove, trustedAddresses, phishingProtectionEnabled, setRequirePasswordForSend, setRequirePasswordForSwap, setRequirePasswordForApprove, addTrustedAddress, removeTrustedAddress, setPhishingProtectionEnabled } = useSecurityStore();

  // Bottom sheet state
  const [activeSheet, setActiveSheet] = useState<'language' | 'network' | 'theme' | 'security' | 'contacts' | null>(null);

  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('sui_wallet_settings');
    return saved ? JSON.parse(saved) : {
      language: 'en' as Language,
      network: 'mainnet' as NetworkType,
      theme: 'dark' as Theme
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sui_wallet_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNetworkChange = async (network: NetworkType) => {
    updateSetting('network', network);
    // Update the global Sui client URL
    const event = new CustomEvent('networkChange', { detail: { network } });
    window.dispatchEvent(event);
    // Refresh balance after network change
    setTimeout(() => refreshBalance(), 500);
  };

  const handleThemeChange = (theme: Theme) => {
    updateSetting('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'zh' as Language, name: '中文', flag: '🇨🇳' }
  ];

  const networks = [
    { code: 'mainnet' as NetworkType, name: t('mainnet'), description: t('production_network') },
    { code: 'testnet' as NetworkType, name: t('testnet'), description: t('testing_network') }
  ];

  const themes = [
    { code: 'dark' as Theme, name: t('dark'), icon: Moon },
    { code: 'light' as Theme, name: t('light'), icon: Sun }
  ];

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
        <h1 className="text-xl font-bold">{t('settings')}</h1>
      </div>

      {/* Language Setting */}
      <div className="bg-hoh-card rounded-xl p-4">
        <button
          onClick={() => setActiveSheet('language')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-hoh-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Globe className="text-hoh-green" size={20} />
            <div className="text-left">
              <h3 className="font-medium">{t('language')}</h3>
              <p className="text-sm text-hoh-text-secondary">
                {languages.find(l => l.code === settings.language)?.name}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-hoh-text-secondary" />
        </button>
      </div>

      {/* Network Setting */}
      <div className="bg-hoh-card rounded-xl p-4">
        <button
          onClick={() => setActiveSheet('network')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-hoh-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Network className="text-hoh-green" size={20} />
            <div className="text-left">
              <h3 className="font-medium">{t('network')}</h3>
              <p className="text-sm text-hoh-text-secondary">
                {networks.find(n => n.code === settings.network)?.name}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-hoh-text-secondary" />
        </button>
      </div>

      {/* Backup Wallet */}
      <div className="bg-hoh-card rounded-xl p-4">
        <button
          onClick={() => navigate('/backup')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-hoh-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Shield className="text-hoh-green" size={20} />
            <div className="text-left">
              <h3 className="font-medium">Backup Wallet</h3>
              <p className="text-sm text-hoh-text-secondary">
                Secure your recovery phrase
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-hoh-text-secondary" />
        </button>
      </div>

      {/* Security Settings */}
      <div className="bg-hoh-card rounded-xl p-4">
        <button
          onClick={() => setActiveSheet('security')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-hoh-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Shield className="text-hoh-green" size={20} />
            <div className="text-left">
              <h3 className="font-medium">Security</h3>
              <p className="text-sm text-hoh-text-secondary">
                Passwords and trusted addresses
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-hoh-text-secondary" />
        </button>
      </div>

      {/* Contacts Management */}
      <div className="bg-hoh-card rounded-xl p-4">
        <button
          onClick={() => navigate('/contacts')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-hoh-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Users className="text-hoh-green" size={20} />
            <div className="text-left">
              <h3 className="font-medium">Contacts</h3>
              <p className="text-sm text-hoh-text-secondary">
                Manage your saved contacts
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-hoh-text-secondary" />
        </button>
      </div>

      {/* Theme Setting */}
      <div className="bg-hoh-card rounded-xl p-4">
        <button
          onClick={() => setActiveSheet('theme')}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-hoh-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            {settings.theme === 'dark' ? (
              <Moon className="text-hoh-green" size={20} />
            ) : (
              <Sun className="text-hoh-green" size={20} />
            )}
            <div className="text-left">
              <h3 className="font-medium">{t('theme')}</h3>
              <p className="text-sm text-hoh-text-secondary">
                {themes.find(th => th.code === settings.theme)?.name}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-hoh-text-secondary" />
        </button>
      </div>

      {/* Version Info */}
      <div className="bg-hoh-card rounded-xl p-4">
        <div className="text-center">
          <h3 className="text-sm font-medium text-hoh-text-secondary">HOH Wallet</h3>
          <p className="text-xs text-hoh-text-secondary mt-1">Version 1.0.0</p>
        </div>
      </div>

      {/* Language Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'language'}
        onClose={() => setActiveSheet(null)}
        title={t('language')}
      >
        <div className="p-4 space-y-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                updateSetting('language', lang.code);
                setActiveSheet(null);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-lg hover:bg-hoh-hover transition-colors ${
                settings.language === lang.code ? 'bg-hoh-green/20 border border-hoh-green' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </div>
              {settings.language === lang.code && (
                <Check size={16} className="text-hoh-green" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Network Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'network'}
        onClose={() => setActiveSheet(null)}
        title={t('network')}
      >
        <div className="p-4 space-y-2">
          {networks.map(network => (
            <button
              key={network.code}
              onClick={() => {
                handleNetworkChange(network.code);
                setActiveSheet(null);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-lg hover:bg-hoh-hover transition-colors ${
                settings.network === network.code ? 'bg-hoh-green/20 border border-hoh-green' : ''
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{network.name}</span>
                <span className="text-sm text-hoh-text-secondary">{network.description}</span>
              </div>
              {settings.network === network.code && (
                <Check size={16} className="text-hoh-green" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Theme Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'theme'}
        onClose={() => setActiveSheet(null)}
        title={t('theme')}
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {themes.map(theme => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.code}
                  onClick={() => {
                    handleThemeChange(theme.code);
                    setActiveSheet(null);
                  }}
                  className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-colors ${
                    settings.theme === theme.code
                      ? 'border-hoh-green bg-hoh-green/20'
                      : 'border-hoh-border hover:border-hoh-border-hover'
                  }`}
                >
                  <Icon size={32} className="mb-3" />
                  <span className="font-medium">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* Security Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'security'}
        onClose={() => setActiveSheet(null)}
        title="Security Settings"
      >
        <div className="p-4 space-y-4">
          {/* Password Requirements */}
          <div className="space-y-3">
            <h3 className="font-medium mb-2">Require Password For</h3>

            <div className="space-y-2">
              <button
                onClick={() => setRequirePasswordForSend(!requirePasswordForSend)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium">Sending Tokens</span>
                {requirePasswordForSend ? (
                  <Check size={18} className="text-hoh-green" />
                ) : (
                  <div className="w-5 h-5 border border-gray-500 rounded"></div>
                )}
              </button>

              <button
                onClick={() => setRequirePasswordForSwap(!requirePasswordForSwap)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium">Swapping Tokens</span>
                {requirePasswordForSwap ? (
                  <Check size={18} className="text-hoh-green" />
                ) : (
                  <div className="w-5 h-5 border border-gray-500 rounded"></div>
                )}
              </button>

              <button
                onClick={() => setRequirePasswordForApprove(!requirePasswordForApprove)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium">DApp Approvals</span>
                {requirePasswordForApprove ? (
                  <Check size={18} className="text-hoh-green" />
                ) : (
                  <div className="w-5 h-5 border border-gray-500 rounded"></div>
                )}
              </button>
            </div>
          </div>

          {/* Phishing Protection */}
          <div className="border-t border-gray-700 pt-3">
            <button
              onClick={() => setPhishingProtectionEnabled(!phishingProtectionEnabled)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div>
                <div className="font-medium">Phishing Protection</div>
                <div className="text-sm text-gray-400">Warn about suspicious websites</div>
              </div>
              {phishingProtectionEnabled ? (
                <Check size={18} className="text-hoh-green" />
              ) : (
                <div className="w-5 h-5 border border-gray-500 rounded"></div>
              )}
            </button>
          </div>

          {/* Trusted Addresses */}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Trusted Addresses</h3>
              <button
                onClick={() => {
                  const address = prompt('Enter address to add to trusted list:');
                  if (address) {
                    addTrustedAddress(address);
                  }
                }}
                className="flex items-center space-x-1 text-hoh-green hover:underline text-sm"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            {trustedAddresses.length === 0 ? (
              <div className="text-sm text-gray-400 p-3 bg-hoh-hover rounded-lg">
                No trusted addresses yet
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {trustedAddresses.map((address, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-hoh-hover rounded-lg"
                  >
                    <span className="font-mono text-sm flex-1">{address.slice(0, 10)}...{address.slice(-6)}</span>
                    <button
                      onClick={() => removeTrustedAddress(address)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};