'use client';

import React, { useState } from 'react';
import { useTelegramGame } from '../../context/GameContext';
import { translations } from '../../lib/i18n';
import {
  Wallet,
  Users,
  Award,
  Coins,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Sparkles,
  Package,
} from 'lucide-react';

export default function ProfileView() {
  const {
    telegramId,
    balance,
    status,
    inventory,
    lang,
    triggerHaptic,
  } = useTelegramGame();

  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  // Authenticated Telegram WebApp User
  const tgUser =
    typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user
      ? window.Telegram.WebApp.initDataUnsafe.user
      : null;

  const displayName = tgUser
    ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim()
    : 'Capital Tycoon Player';

  const username = tgUser?.username ? `@${tgUser.username}` : 'Executive Account';
  const avatarInitial = (tgUser?.first_name?.[0] || 'C').toUpperCase();

  // Dynamic Executive Rank based on status points saved in Supabase
  const getExecutiveRank = (points: number) => {
    if (points >= 5000) return 'Mogul Billionaire';
    if (points >= 2000) return 'Senior Investor';
    if (points >= 500) return 'Venture Capitalist';
    return 'Starter Tycoon';
  };

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'CapitalTycoonBot';
  const referralLink = `https://t.me/${botUsername}?start=ref_${telegramId || 'guest'}`;

  const handleCopyReferral = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareReferral = () => {
    triggerHaptic('medium');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
    )}&text=${encodeURIComponent(
      'Join me in Capital Tycoon! Build your luxury empire and earn rewards.'
    )}`;

    if (typeof window !== 'undefined') {
      const tgWebApp = (window as any).Telegram?.WebApp;
      if (tgWebApp?.openTelegramLink) {
        tgWebApp.openTelegramLink(shareUrl);
      } else if (tgWebApp?.openLink) {
        tgWebApp.openLink(shareUrl);
      } else {
        window.open(shareUrl, '_blank');
      }
    }
  };

  return (
    <div className="w-full space-y-4 pb-28 animate-in fade-in duration-200">
      {/* 1. Executive Profile Header Card */}
      <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 border-2 border-gold-300 flex items-center justify-center font-black text-black text-xl shadow-lg">
            {avatarInitial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-base text-white truncate">
                {displayName}
              </h2>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-xs text-gold-500 font-semibold truncate">{username}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              ID: {telegramId ? telegramId : 'Offline Mode'}
            </p>
          </div>
        </div>

        {/* Dynamic Status Rank Badge */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" /> Executive Rank
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-500 font-black text-xs uppercase tracking-wider">
            {getExecutiveRank(status)}
          </span>
        </div>
      </div>

      {/* 2. Live Parameters Overview (Synced via GameContext) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Balance Parameter */}
        <div className="p-3 bg-blueblack-900 rounded-2xl border border-slate-800 text-center space-y-1">
          <Coins className="w-4 h-4 text-gold-500 mx-auto" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Balance</p>
          <p className="text-xs font-black text-white">${balance.toLocaleString()}</p>
        </div>

        {/* Status Points Parameter */}
        <div className="p-3 bg-blueblack-900 rounded-2xl border border-slate-800 text-center space-y-1">
          <Award className="w-4 h-4 text-emerald-400 mx-auto" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
          <p className="text-xs font-black text-emerald-400">{status.toLocaleString()} PTS</p>
        </div>

        {/* Inventory Owned Assets Parameter */}
        <div className="p-3 bg-blueblack-900 rounded-2xl border border-slate-800 text-center space-y-1">
          <Package className="w-4 h-4 text-sky-400 mx-auto" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assets</p>
          <p className="text-xs font-black text-sky-400">{inventory.length} Owned</p>
        </div>
      </div>

      {/* 3. Payout Method Settings */}
      <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-gold-500" />
          Payout Method & Wallet
        </h3>

        <div className="p-3 bg-blueblack-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs text-white">TON Connect Wallet</p>
            <p className="text-[10px] text-slate-400">Web3 Network Payout Active</p>
          </div>
          <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
            Connected
          </span>
        </div>
      </div>

      {/* 4. Referral Section */}
      <div className="p-4 bg-blueblack-900 rounded-2xl border border-slate-800 space-y-3">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gold-500" />
            Invite Friends & Earn DD
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Earn +$1,000 Digital Dollars (DD) for every friend who joins via your invite link.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShareReferral}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Invite Friends
          </button>

          <button
            onClick={handleCopyReferral}
            className="py-2.5 px-3 rounded-xl bg-blueblack-950 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}