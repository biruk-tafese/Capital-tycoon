'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlayerService } from '../services/playerService';
import { ShopItem } from '../types/store';

export function useTelegramGame() {
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<number>(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initApp = async () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe?.user;
        const startParam = tg.initDataUnsafe?.start_param || '';
        let referrerId: number | undefined;

        if (startParam.startsWith('ref_')) {
          const parsedId = parseInt(startParam.replace('ref_', ''), 10);
          if (!isNaN(parsedId)) {
            referrerId = parsedId;
          }
        }

        if (user?.id) {
          setTelegramId(user.id);
          try {
            const player = await PlayerService.getOrCreatePlayer(
              {
                id: user.id,
                first_name: user.first_name,
                username: user.username,
              },
              referrerId
            );

            let currentBalance = Number(player.balance);
            setStatus(player.status_points);
            setLang((player.language as 'en' | 'am') || 'en');

            if (referrerId && !player.referred_by) {
              const refResult = await PlayerService.processReferralBonus(user.id, referrerId);
              if (refResult.success && refResult.reward_amount) {
                currentBalance += refResult.reward_amount;
              }
            }

            setBalance(currentBalance);

            const ownedItemIds = await PlayerService.getPlayerInventory(user.id);
            setInventory(ownedItemIds);
          } catch (err) {
            console.error('Failed to sync player state:', err);
          }
        }
      }
      setLoading(false);
    };

    initApp();
  }, []);

  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      } catch (e) {
        // Fallback silently for browser testing
      }
    }
  }, []);

  const executePurchase = async (item: ShopItem) => {
    if (!telegramId) return { success: false, error: 'NO_TELEGRAM_ID' };

    try {
      const result = await PlayerService.purchaseItem(telegramId, item);

      if (result.success) {
        // Optimistically update local state & sync inventory with Supabase DB
        setBalance((prev) => Math.max(0, prev - item.price));
        setStatus((prev) => prev + item.statusBoost);
        setInventory((prev) => [...prev, item.id]);

        triggerHaptic('heavy');
      }

      return result;
    } catch (err) {
      console.error('Purchase failed:', err);
      return { success: false, error: 'SERVER_ERROR' };
    }
  };

  return {
    telegramId,
    balance,
    status,
    inventory,
    lang,
    setLang,
    loading,
    triggerHaptic,
    executePurchase,
  };
}