'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PlayerService, NotificationItem } from '../services/playerService';
import { ShopItem } from '../types/store';
import { supabase } from '../lib/supabase/client';

interface GameContextType {
  telegramId: string | null;
  firstName: string;
  username: string;
  balance: number;
  status: number;
  inventory: string[];
  notifications: NotificationItem[];
  unreadCount: number;
  lang: 'en' | 'am';
  setLang: (lang: 'en' | 'am') => void;
  loading: boolean;
  markNotificationsAsRead: (id?: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  addBalanceReward: (amount: number, reasonTitle?: string, reasonMessage?: string) => Promise<void>;
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
    console.error('[GameContext] Failed to parse initData user payload:', e);
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [loading, setLoading] = useState<boolean>(true);

  const initializedRef = useRef(false);

  // -------------------------------------------------------------
  // 1. Native Telegram Haptic Feedback Trigger
  // -------------------------------------------------------------
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      } catch (e) {
        // Fallback for non-Telegram desktop testing context
      }
    }
  }, []);

  // -------------------------------------------------------------
  // 2. Initial Telegram Hydration & Player State Fetch
  // -------------------------------------------------------------
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

          if (retries === 0) {
            try {
              tg.ready();
              tg.expand();
            } catch (e) {
              // Non-telegram browser context fallback
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

        setBalance(Math.floor(Number(player?.balance || 0)));
        setStatus(Math.floor(Number(player?.status_points || 0)));
        setLang((player?.language as 'en' | 'am') || 'en');

        const [ownedItems, initialNotifications] = await Promise.all([
          PlayerService.getPlayerInventory(rawUserId),
          PlayerService.getNotifications(rawUserId),
        ]);

        setInventory(ownedItems || []);
        setNotifications(initialNotifications || []);
      } catch (err: any) {
        console.error('[GameContext] Error syncing player state:', err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // -------------------------------------------------------------
  // 3. Realtime WebSocket Subscriptions (Player Balance & Notifications)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!telegramId) return;

    console.log(`[GameContext Realtime] Subscribing to live channels for Telegram ID: ${telegramId}`);

    // Channel A: Live Balance & Status Updates
    const playerChannel = supabase
      .channel(`realtime:player:${telegramId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `telegram_id=eq.${telegramId}`,
        },
        (payload) => {
          const updatedPlayer = payload.new as any;

          if (updatedPlayer?.balance !== undefined) {
            setBalance(Math.floor(Number(updatedPlayer.balance)));
          }
          if (updatedPlayer?.status_points !== undefined) {
            setStatus(Math.floor(Number(updatedPlayer.status_points)));
          }
          if (updatedPlayer?.language) {
            setLang(updatedPlayer.language as 'en' | 'am');
          }

          triggerHaptic('heavy');
        }
      )
      .subscribe();

    // Channel B: Real-time Incoming Notifications
    const notifyChannel = supabase
      .channel(`realtime:notifications:${telegramId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `telegram_id=eq.${telegramId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationItem;
          setNotifications((prev) => [newNotification, ...prev]);
          triggerHaptic('heavy');
        }
      )
      .subscribe();

    return () => {
      console.log('[GameContext Realtime] Cleaning up WebSocket channels');
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(notifyChannel);
    };
  }, [telegramId, triggerHaptic]);

  // -------------------------------------------------------------
  // 4. Notification Action Handlers
  // -------------------------------------------------------------
  const markNotificationsAsRead = async (id?: string) => {
    if (!telegramId) return;

    setNotifications((prev) =>
      prev.map((item) =>
        id ? (item.id === id ? { ...item, is_read: true } : item) : { ...item, is_read: true }
      )
    );

    await PlayerService.markNotificationsRead(telegramId, id);
  };

  const dismissNotification = async (id: string) => {
    if (!id) return;

    setNotifications((prev) => prev.filter((item) => item.id !== id));
    await PlayerService.deleteNotification(id);
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  // -------------------------------------------------------------
  // 5. Future Boost / Video Reward Incrementor
  // -------------------------------------------------------------
  const addBalanceReward = useCallback(
    async (amount: number, reasonTitle?: string, reasonMessage?: string) => {
      if (!telegramId || amount <= 0) return;

      const integerAmount = Math.floor(amount);

      // Optimistic local state update
      setBalance((prev) => Math.floor(prev) + integerAmount);
      triggerHaptic('heavy');

      try {
        // Cast supabase to any to safely execute custom SQL stored procedure
        const { error } = await (supabase as any).rpc('increment_player_balance', {
          p_telegram_id: telegramId,
          p_amount: integerAmount,
        });

        if (error) {
          console.error('[GameContext] Error incrementing balance via RPC:', error);
        }

        if (reasonTitle && reasonMessage) {
          await PlayerService.createNotification(
            telegramId,
            reasonTitle,
            reasonMessage,
            'task'
          );
        }
      } catch (err) {
        console.error('[GameContext] Unhandled reward increment error:', err);
      }
    },
    [telegramId, triggerHaptic]
  );

  // -------------------------------------------------------------
  // 6. Shop Purchases Execution
  // -------------------------------------------------------------
  const executePurchase = async (item: ShopItem) => {
    if (!telegramId) return { success: false, error: 'NO_TELEGRAM_ID' };

    try {
      const result = await PlayerService.purchaseItem(telegramId, item);

      if (result.success) {
        setBalance((prev) => Math.max(0, Math.floor(prev - Number(item.price))));
        setStatus((prev) => Math.floor(prev + Number(item.statusBoost || 0)));
        setInventory((prev) => [...prev, item.id]);

        // Safely extract item name regardless of property naming convention
        const itemName =
          (item as any).title ||
          (item as any).nameEn ||
          (item as any).name ||
          item.id;

        await PlayerService.createNotification(
          telegramId,
          'Asset Purchased!',
          `You acquired ${itemName} for $${item.price.toLocaleString()} DD.`,
          'account'
        );

        triggerHaptic('heavy');
      }
      return result;
    } catch (err: any) {
      console.error('[GameContext] Purchase failed:', err?.message || err);
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
        notifications,
        unreadCount,
        lang,
        setLang,
        loading,
        markNotificationsAsRead,
        dismissNotification,
        addBalanceReward,
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