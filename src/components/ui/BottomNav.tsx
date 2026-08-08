'use client';

import React from 'react';
import { ShoppingBag, Zap, Wallet, Trophy } from 'lucide-react';
import { useTelegramGame } from '../../hooks/useTelegramGame';

export type TabType = 'store' | 'boosts' | 'withdraw' | 'leaderboard';

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
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-blueblack-900/95 backdrop-blur-md border-t border-slate-800 py-2 px-4">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center w-16 py-1 transition-all ${
                isActive ? 'text-gold-500 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-gold-500' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}