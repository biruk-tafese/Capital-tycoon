'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlayerService } from '../services/playerService';
import { ShopItem } from '../types/store';

interface GameContextType {
  telegramId: number | null;
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
  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<number>(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);

    const initApp = async () => {
      let userId: number = 99999999; // Default fallback ID for local/Ngrok desktop testing
      let firstName = 'Dev Executive';
      let username = 'dev_tycoon';
      let referrerId: number | undefined;

      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;
        const startParam = tg.initDataUnsafe?.start_param || '';

        if (tgUser?.id) {
          userId = tgUser.id;
          firstName = tgUser.first_name || firstName;
          username = tgUser.username || username;
        }

        if (startParam.startsWith('ref_')) {
          const parsedId = parseInt(startParam.replace('ref_', ''), 10);
          if (!isNaN(parsedId)) referrerId = parsedId;
        }
      }

      setTelegramId(userId);

      try {
        // Fetch or create user record in Supabase using the resolved userId
        const player = await PlayerService.getOrCreatePlayer(
          {
            id: userId,
            first_name: firstName,
            username: username,
          },
          referrerId
        );

        const currentBalance = Number(player.balance);
        const currentStatus = Number(player.status_points || 0);

        console.log('[SUPABASE DB READ] User:', userId, 'Balance:', currentBalance);

        setBalance(currentBalance);
        setStatus(currentStatus);
        setLang((player.language as 'en' | 'am') || 'en');

        // Fetch user's inventory
        const ownedItemIds = await PlayerService.getPlayerInventory(userId);
        setInventory(ownedItemIds);

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
        // Desktop testing fallback
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