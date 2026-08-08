'use client';

import React, { useState } from 'react';
import { useTelegramGame } from '../hooks/useTelegramGame';
import BottomNav, { TabType } from '../components/ui/BottomNav';
import StoreCatalog from '../components/store/StoreCatalog';
import ProfileView from '../components/profile/ProfileView';
import PedestalCanvas from '../components/3d/PedestalCanvas';
import TopBar from '../components/ui/TopBar';
import { Loader2, Zap, Wallet, Trophy } from 'lucide-react';

export default function Home() {
  const { lang, loading } = useTelegramGame();
  const [activeTab, setActiveTab] = useState<TabType>('store');

  if (loading) {
    return (
      <div className="min-h-screen bg-blueblack-950 flex flex-col items-center justify-center text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
          {lang === 'en' ? 'Loading Capital Tycoon...' : 'ካፒታል ታይኮን በመጫን ላይ...'}
        </p>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-blueblack-950 text-white flex flex-col justify-between overflow-x-hidden select-none">
      {/* 1. Fixed Header with Live Balance & Status Points */}
      <TopBar />

      {/* 2. Interactive 3D Asset Canvas (Hero Section) */}
      <div className="w-full h-64 relative my-2">
        <PedestalCanvas />
      </div>

      {/* 3. Main Dynamic Content Area (Switches by Tab) */}
      <div className="w-full px-4 flex-1">
        {/* Store Tab (Inline Showcase + Open Store E-Commerce Modal Button) */}
        {activeTab === 'store' && <StoreCatalog />}

        {/* Boosts Tab */}
        {activeTab === 'boosts' && (
          <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 text-center space-y-3">
            <Zap className="w-8 h-8 text-gold-500 mx-auto" />
            <h3 className="font-bold text-sm text-white">Daily Multipliers & Ad Boosts</h3>
            <p className="text-xs text-slate-400">Watch short video ads or complete micro-tasks to earn bonus Digital Dollars!</p>
          </div>
        )}

        {/* Payout Tab */}
        {activeTab === 'withdraw' && (
          <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 text-center space-y-3">
            <Wallet className="w-8 h-8 text-gold-500 mx-auto" />
            <h3 className="font-bold text-sm text-white">TON Wallet Payouts</h3>
            <p className="text-xs text-slate-400">Connect your TON Wallet to convert in-game assets into Web3 rewards.</p>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 text-center space-y-3">
            <Trophy className="w-8 h-8 text-gold-500 mx-auto" />
            <h3 className="font-bold text-sm text-white">Global Executive Ranks</h3>
            <p className="text-xs text-slate-400">Top 100 players with the highest Status Points receive weekly TON rewards.</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && <ProfileView />}
      </div>

      {/* 4. Bottom Sticky Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}