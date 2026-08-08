'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlayerService } from '../services/playerService';
import { ShopItem } from '../types/store';

interface GameContextType {
  telegramId: number | null;
  firstName: string;
  username: string;
  balance: number;
  status: number;
  inventory: string[];
  lang: 'en' | 'am';
  setLang: (lang: 'en' | 'am') => void;
  loading: boolean;
  triggerHaptic: (style?: 'light' | 'medium' | 'heavy') => void;
  executePurchase: (item: ShopItem) => Promise<{ success: boolean; error?: string }>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<number>(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);

    const initApp = async () => {
      let userId: number | null = null;
      let userFirstName = '';
      let userUsername = '';
      let referrerId: number | undefined;

      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser?.id) {
          userId = tgUser.id;
          userFirstName = tgUser.first_name || '';
          userUsername = tgUser.username || '';
        }

        // Extract referral parameter
        let startParam = tg.initDataUnsafe?.start_param || '';

        if (!startParam) {
          const urlParams = new URLSearchParams(window.location.search);
          startParam = urlParams.get('tgWebAppStartParam') || urlParams.get('startapp') || urlParams.get('start_param') || '';
        }

        if (startParam.startsWith('ref_')) {
          const parsedId = parseInt(startParam.replace('ref_', ''), 10);
          if (!isNaN(parsedId)) {
            referrerId = parsedId;
          }
        }
      }

      // If no valid Telegram user is present, abort syncing to prevent fake accounts
      if (!userId) {
        setLoading(false);
        return;
      }

      setTelegramId(userId);
      setFirstName(userFirstName);
      setUsername(userUsername);

      try {
        // Fetch or create user record in Supabase using actual Telegram data only
        const player = await PlayerService.getOrCreatePlayer(
          {
            id: userId,
            first_name: userFirstName,
            username: userUsername,
          },
          referrerId
        );

        const dbBalance = Number(player.balance);
        const dbStatus = Number(player.status_points || 0);

        setBalance(dbBalance);
        setStatus(dbStatus);
        setLang((player.language as 'en' | 'am') || 'en');

        // Fetch owned items from database
        const ownedItemIds = await PlayerService.getPlayerInventory(userId);
        setInventory(ownedItemIds);

        // Process referral bonus if referred
        if (referrerId && userId !== referrerId) {
          await PlayerService.processReferralBonus(userId, referrerId);
        }
      } catch (err) {
        console.error('Failed to sync player state from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      } catch (e) {
        // Ignored
      }
    }
  }, []);

  const executePurchase = async (item: ShopItem) => {
    if (!telegramId) return { success: false, error: 'NO_TELEGRAM_ID' };

    try {
      const result = await PlayerService.purchaseItem(telegramId, item);

      if (result.success) {
        if (typeof result.new_balance === 'number') {
          setBalance(result.new_balance);
        } else {
          setBalance((prev) => Math.max(0, prev - Number(item.price)));
        }

        setStatus((prev) => prev + Number(item.statusBoost));
        setInventory((prev) => [...prev, item.id]);
        triggerHaptic('heavy');
      }
      return result;
    } catch (err: any) {
      console.error('Purchase failed:', err);
      return { success: false, error: err?.message || 'SERVER_ERROR' };
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-blueblack-950 text-white" />;
  }

  return (
    <GameContext.Provider
      value={{
        telegramId,
        firstName,
        username,
        balance,
        status,
        inventory,
        lang,
        setLang,
        loading,
        triggerHaptic,
        executePurchase,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useTelegramGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useTelegramGame must be used within a GameProvider');
  }
  return context;
}