'use client';

import { useState, useEffect, useCallback } from 'react';
import { TelegramUser, TelegramWebApp } from '../types/telegram';
import { Language } from '../lib/i18n';

export function useTelegramGame() {
  // Use TelegramWebApp directly for the state type
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [lang, setLang] = useState<Language>('en');
  const [balance, setBalance] = useState(10000);
  const [status, setStatus] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const app = window.Telegram.WebApp;
      app.ready();
      app.expand();
      setTg(app);

      const telegramUser = app.initDataUnsafe?.user;
      if (telegramUser) {
        setUser(telegramUser);
      }
    }
    setIsReady(true);
  }, []);

  const triggerHaptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      tg?.HapticFeedback?.impactOccurred(style);
    },
    [tg]
  );

  const triggerNotification = useCallback(
    (type: 'success' | 'warning' | 'error') => {
      tg?.HapticFeedback?.notificationOccurred(type);
    },
    [tg]
  );

  return {
    tg,
    user,
    isReady,
    lang,
    setLang,
    balance,
    setBalance,
    status,
    setStatus,
    triggerHaptic,
    triggerNotification,
  };
}