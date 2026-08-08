'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useTelegramGame } from '../hooks/useTelegramGame';
import { translations } from '../lib/i18n';
import BottomNav, { TabType } from '../components/ui/BottomNav';
import StoreCatalog from '../components/ui/StoreCatalog';

const PedestalCanvas = dynamic(() => import('../components/3d/PedestalCanvas'), {
  ssr: false,
  loading: () => <div className="w-[220px] h-[220px] bg-blueblack-900 rounded-3xl animate-pulse" />,
});

export default function Home() {
  const { lang, setLang, balance, status, triggerHaptic } = useTelegramGame();
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [showHowToPlay, setShowHowToPlay] = useState(true);

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-blueblack-950 text-white flex flex-col items-center">
      {/* Mobile Frame Container */}
      <main className="w-full max-w-md min-h-screen flex flex-col justify-between p-4 relative">
        {/* Top Header */}
        <header id="balance-container" className="w-full flex justify-between items-center bg-blueblack-900/80 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              triggerHaptic('light');
              setLang(lang === 'en' ? 'am' : 'en');
            }}
            className="px-3 py-1 bg-gold-500/10 border border-gold-500 text-gold-500 rounded-lg text-xs font-black uppercase tracking-wider"
          >
            {lang === 'en' ? 'ENGLISH' : 'አማርኛ'}
          </button>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">{t.balance}</p>
            <p className="text-base font-black text-gold-500">${balance.toLocaleString()}</p>
          </div>
        </header>

        {/* 3D Showcase & Status Section */}
        <section className="my-4 flex flex-col items-center">
          <PedestalCanvas />
          <div id="status-container" className="mt-2 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">{t.status}</p>
            <p className="text-2xl font-black text-gold-500">{status} PTS</p>
          </div>
        </section>

        {/* Tab Content Display */}
        {activeTab === 'store' && <StoreCatalog />}
        {activeTab === 'boosts' && (
          <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 pb-24">
            <p className="font-bold text-white mb-2">{t.watchAd}</p>
            <p>Watch video ads or invite friends to earn additional Digital Dollars.</p>
          </div>
        )}
        {activeTab === 'withdraw' && (
          <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 pb-24">
            <p className="font-bold text-gold-500 mb-2">{t.withdrawTitle}</p>
            <p>{t.minStatusReq}</p>
          </div>
        )}
        {activeTab === 'leaderboard' && (
          <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 pb-24">
            <p className="font-bold text-white mb-2">Global Leaderboard</p>
            <p>Compete with top players across Telegram.</p>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Onboarding Dialog Modal */}
        {showHowToPlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6">
            <div className="w-full max-w-sm rounded-2xl bg-blueblack-900 border border-gold-500/40 p-6 space-y-4 text-center">
              <h3 className="text-xl font-black text-gold-500">{t.howToPlayTitle}</h3>

              <ul className="text-xs text-slate-300 space-y-2 text-left">
                <li>{t.step1}</li>
                <li>{t.step2}</li>
                <li>{t.step3}</li>
                <li>{t.step4}</li>
              </ul>

              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setShowHowToPlay(false);
                }}
                className="w-full py-3.5 rounded-xl bg-gold-500 text-black font-black text-xs uppercase tracking-wider"
              >
                {t.startGame}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}