'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

function parseUserFromInitData(initData: string) {
  try {
    const searchParams = new URLSearchParams(initData);
    const userStr = searchParams.get('user');
    if (userStr) {
      return JSON.parse(decodeURIComponent(userStr));
    }
  } catch (e) {
    console.error('Failed to parse initData user payload:', e);
  }
  return null;
}

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

  // Prevent multiple executions in React Strict Mode
  const initializedRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    if (initializedRef.current) return;
    initializedRef.current = true;

    const initApp = async () => {
      let rawUserId: string | null = null;
      let userFirstName = '';
      let userUsername = '';
      let referrerId: string | undefined;

      let retries = 0;
      while (retries < 15) {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;

          // Call ready() and expand() ONLY ONCE on initial hit
          if (retries === 0) {
            try {
              tg.ready();
              tg.expand();
            } catch (e) {
              // Ignore bridge errors during SSR/dev
            }
          }

          let user = tg.initDataUnsafe?.user;

          if (!user?.id && tg.initData) {
            user = parseUserFromInitData(tg.initData);
          }

          if (user?.id) {
            rawUserId = String(user.id);
            userFirstName = user.first_name || '';
            userUsername = user.username || '';

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
            break;
          }
        }
        await new Promise((res) => setTimeout(res, 200));
        retries++;
      }

      if (!rawUserId) {
        console.warn('[GameContext] No active Telegram session detected.');
        setLoading(false);
        return;
      }

      console.log(`[GameContext] Session Loaded for Telegram ID: ${rawUserId}`);
      setTelegramId(rawUserId);
      setFirstName(userFirstName);
      setUsername(userUsername);

      try {
        const player = await PlayerService.getOrCreatePlayer(
          {
            id: rawUserId,
            first_name: userFirstName,
            username: userUsername,
          },
          referrerId
        );

        setBalance(Number(player?.balance || 0));
        setStatus(Number(player?.status_points || 0));
        setLang((player?.language as 'en' | 'am') || 'en');

        const ownedItems = await PlayerService.getPlayerInventory(rawUserId);
        setInventory(ownedItems || []);

        if (referrerId && !player?.referred_by) {
          await PlayerService.processReferralBonus(rawUserId, referrerId);
        }
      } catch (err: any) {
        console.error('[GameContext] Error syncing player state:', err?.message || err);
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
        setBalance((prev) => Math.max(0, prev - Number(item.price)));
        setStatus((prev) => prev + Number(item.statusBoost));
        setInventory((prev) => [...prev, item.id]);
        triggerHaptic('heavy');
      }
      return result;
    } catch (err: any) {
      console.error('Purchase failed:', err?.message || err);
      return { success: false, error: 'SERVER_ERROR' };
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