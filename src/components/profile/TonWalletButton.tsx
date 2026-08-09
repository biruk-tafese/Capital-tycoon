'use client';

import React, { useEffect } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { PlayerService } from '../../services/playerService';
import { useTelegramGame } from '../../context/GameContext';

export default function TonWalletButton() {
  const userFriendlyAddress = useTonAddress();
  const { telegramId, triggerHaptic } = useTelegramGame();
  const [tonConnectUI] = useTonConnectUI();

  // Auto-sync wallet address to Supabase whenever connection status changes
  useEffect(() => {
    if (telegramId && userFriendlyAddress) {
      PlayerService.saveWalletAddress(telegramId, userFriendlyAddress);
      triggerHaptic('heavy');
    }
  }, [telegramId, userFriendlyAddress, triggerHaptic]);

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl w-full">
      <div className="flex items-center justify-between w-full">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            💎 TON Wallet
          </h3>
          <p className="text-[11px] text-slate-400">
            {userFriendlyAddress
              ? `${userFriendlyAddress.slice(0, 4)}...${userFriendlyAddress.slice(-4)}`
              : 'Connect wallet for Web3 payouts'}
          </p>
        </div>

        {/* TON Connect Official Button Component */}
        <TonConnectButton />
      </div>
    </div>
  );
}