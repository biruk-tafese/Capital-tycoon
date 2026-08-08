'use client';

import React from 'react';
import { useTelegramGame } from '../../hooks/useTelegramGame';
import { translations } from '../../lib/i18n';
import gsap from 'gsap';

export interface ShopItem {
  id: string;
  nameEn: string;
  nameAm: string;
  category: 'clothing' | 'watch' | 'home';
  price: number;
  statusBoost: number;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'suit_1', nameEn: 'Designer Suit', nameAm: 'ስማርት ልብስ', category: 'clothing', price: 1200, statusBoost: 15 },
  { id: 'watch_1', nameEn: 'Gold Watch', nameAm: 'ወርቃማ ሰዓት', category: 'watch', price: 4500, statusBoost: 60 },
  { id: 'home_1', nameEn: 'Luxury Villa', nameAm: 'ዘመናዊ ቪላ', category: 'home', price: 25000, statusBoost: 400 },
];

export default function StoreCatalog() {
  const { lang, balance, setBalance, setStatus, triggerHaptic, triggerNotification } = useTelegramGame();
  const t = translations[lang];

  const handlePurchase = (item: ShopItem) => {
    if (balance < item.price) {
      triggerNotification('error');
      gsap.to('#balance-container', { x: [-5, 5, -5, 5, 0], duration: 0.3 });
      return;
    }

    triggerHaptic('heavy');
    setBalance((prev) => prev - item.price);
    setStatus((prev) => prev + item.statusBoost);

    gsap.fromTo('#status-container', { scale: 1.2 }, { scale: 1, duration: 0.3 });
  };

  return (
    <div className="w-full space-y-3 pb-24">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.store}</h2>
      {SHOP_ITEMS.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-blueblack-900 border border-slate-800 shadow-md"
        >
          <div>
            <p className="font-bold text-sm text-white">
              {lang === 'en' ? item.nameEn : item.nameAm}
            </p>
            <p className="text-xs text-gold-500 font-semibold">+{item.statusBoost} Status Points</p>
          </div>

          <button
            onClick={() => handlePurchase(item)}
            className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-black text-xs uppercase tracking-wider active:scale-95 transition-transform"
          >
            {t.buy} (${item.price.toLocaleString()})
          </button>
        </div>
      ))}
    </div>
  );
}