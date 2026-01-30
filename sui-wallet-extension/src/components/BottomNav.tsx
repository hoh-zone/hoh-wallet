
import { NavLink } from 'react-router-dom';
import { Wallet, ArrowRightLeft, Settings, CreditCard, Lock } from 'lucide-react';
import clsx from 'clsx';
import { t } from '../lib/i18n';

export const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Wallet, label: t('home') },
    { to: '/swap', icon: ArrowRightLeft, label: t('swap') },
    { to: '/staking', icon: Lock, label: 'Staking' },
    { to: '/wallets', icon: CreditCard, label: t('wallets') },
    { to: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-hoh-card border-t border-gray-800 h-16 flex items-center justify-around px-4">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center justify-center space-y-1 w-16 h-full transition-colors",
              isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
            )
          }
        >
          <Icon size={20} />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </div>
  );
};
