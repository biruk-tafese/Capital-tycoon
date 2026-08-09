'use client';

import React from 'react';
import { ShoppingBag, Zap, Wallet, Trophy, User } from 'lucide-react';
import { useTelegramGame } from '../../hooks/useTelegramGame';

export type TabType = 'store' | 'boosts' | 'withdraw' | 'leaderboard' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { triggerHaptic } = useTelegramGame();

  const navItems = [
    { id: 'store' as TabType, label: 'Store', icon: ShoppingBag },
    { id: 'boosts' as TabType, label: 'Boosts', icon: Zap },
    { id: 'withdraw' as TabType, label: 'Payout', icon: Wallet },
    { id: 'leaderboard' as TabType, label: 'Rank', icon: Trophy },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-blueblack-900/95 backdrop-blur-md border-t border-slate-800 py-1.5 px-2">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (triggerHaptic) {
                  triggerHaptic('light');
                }
                setActiveTab(item.id);
              }}
              className={`relative flex flex-col items-center justify-center w-14 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-gold-500 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Tab Ambient Glow Pill */}
              {isActive && (
                <span className="absolute inset-0 bg-gold-500/10 rounded-xl blur-sm -z-10" />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'stroke-[2.5px] scale-110 text-gold-500' : 'stroke-2'
                }`}
              />

              <span className={`text-[9px] mt-1 tracking-tight ${isActive ? 'text-gold-500 font-black' : ''}`}>
                {item.label}
              </span>

              {/* Active Tab Top Indicator Line */}
              {isActive && (
                <span className="absolute -top-1.5 w-5 h-0.5 bg-gold-500 rounded-full shadow-[0_0_8px_#f59e0b]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}