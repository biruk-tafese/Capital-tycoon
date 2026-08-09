'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlayerService } from '../services/playerService';
import { ShopItem } from '../types/store';

interface GameContextType {
  telegramId: string | null;
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
  const [telegramId, setTelegramId] = useState<string | null>(null);
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
      let rawUserId: string | null = null;
      let userFirstName = '';
      let userUsername = '';
      let referrerId: string | undefined;

      // Poll up to 10 times (2 seconds) to wait for Telegram WebApp object hydration
      let retries = 0;
      while (retries < 10) {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();

          const tgUser = tg.initDataUnsafe?.user;
          if (tgUser?.id) {
            rawUserId = String(tgUser.id);
            userFirstName = tgUser.first_name || '';
            userUsername = tgUser.username || '';

            // Check for referral start_param
            let startParam = tg.initDataUnsafe?.start_param || '';
            if (!startParam) {
              const urlParams = new URLSearchParams(window.location.search);
              startParam =
                urlParams.get('tgWebAppStartParam') ||
                urlParams.get('startapp') ||
                urlParams.get('start_param') ||
                '';
            }

            if (startParam.startsWith('ref_')) {
              referrerId = startParam.replace('ref_', '').trim();
            }
            break; // Successfully captured Telegram user
          }
        }
        await new Promise((res) => setTimeout(res, 200));
        retries++;
      }

      // If no Telegram user detected after retries, stop loading gracefully
      if (!rawUserId) {
        console.warn('[GameContext] No active Telegram user session found.');
        setLoading(false);
        return;
      }

      console.log(`[GameContext] Session Loaded for Telegram ID: ${rawUserId}`);
      setTelegramId(rawUserId);
      setFirstName(userFirstName);
      setUsername(userUsername);

      try {
        // Fetch or create user record in Supabase
        const player = await PlayerService.getOrCreatePlayer(
          {
            id: rawUserId,
            first_name: userFirstName,
            username: userUsername,
          },
          referrerId
        );

        setBalance(Number(player.balance || 0));
        setStatus(Number(player.status_points || 0));
        setLang((player.language as 'en' | 'am') || 'en');

        // Fetch owned items from inventory
        const ownedItems = await PlayerService.getPlayerInventory(rawUserId);
        setInventory(ownedItems);

        // Process referral bonus if valid
        if (referrerId && rawUserId !== referrerId) {
          await PlayerService.processReferralBonus(rawUserId, referrerId);
        }
      } catch (err) {
        console.error('[GameContext] Error syncing player state:', err);
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