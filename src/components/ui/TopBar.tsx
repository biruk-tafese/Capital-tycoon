'use client';

import React, { useEffect, useState } from 'react';
import { useTelegramGame } from '../../context/GameContext';
import { translations } from '../../lib/i18n';
import { Coins, Award, Globe } from 'lucide-react';

export default function TopBar() {
  const { balance, status, lang, setLang, triggerHaptic } = useTelegramGame();
  const t = translations[lang];

  const [animateBalance, setAnimateBalance] = useState(false);

  // Flash animation trigger whenever balance updates
  useEffect(() => {
    setAnimateBalance(true);
    const timeout = setTimeout(() => setAnimateBalance(false), 300);
    return () => clearTimeout(timeout);
  }, [balance]);

  const toggleLanguage = () => {
    triggerHaptic('light');
    setLang(lang === 'en' ? 'am' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-blueblack-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Balance Counter */}
        <div
          id="balance-container"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blueblack-900 border border-gold-500/30 shadow-inner transition-transform duration-200 ${
            animateBalance ? 'scale-105 border-gold-400 bg-gold-500/10' : ''
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-500">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              {t.balance}
            </p>
            <p className="text-xs font-black text-gold-500 leading-tight">
              ${balance.toLocaleString()} <span className="text-[10px]">DD</span>
            </p>
          </div>
        </div>

        {/* Status Points Counter */}
        <div
          id="status-container"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blueblack-900 border border-slate-800 shadow-inner"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              {t.status}
            </p>
            <p className="text-xs font-black text-emerald-400 leading-tight">
              {status.toLocaleString()} <span className="text-[10px]">PTS</span>
            </p>
          </div>
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 rounded-xl bg-blueblack-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold active:scale-95 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-gold-500" />
          <span>{lang === 'en' ? 'EN' : 'አማ'}</span>
        </button>
      </div>
    </header>
  );
}