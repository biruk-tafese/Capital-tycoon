'use client';

import React, { useState } from 'react';
import { useTelegramGame } from '../../context/GameContext';
import { SHOP_ITEMS } from '../../data/shopItems';
import { ShopItem } from '../../types/store';
import FullStoreModal from './FullStoreModal';
import { soundEffects } from '../../lib/audio';
import { ShoppingBag, Sparkles, Store, ExternalLink } from 'lucide-react';
import gsap from 'gsap';

export default function StoreCatalog() {
  const {
    balance,
    inventory,
    lang,
    executePurchase,
    triggerHaptic,
  } = useTelegramGame();

  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Take top 3 items for preview
  const featuredItems = SHOP_ITEMS.slice(0, 3);

  const handleQuickPurchase = async (item: ShopItem) => {
    soundEffects.playClick();

    // 1. Force strict numeric parsing to prevent string/number comparison issues
    const currentBalance = Number(balance) || 0;
    const itemPrice = Number(item.price) || 0;

    console.log('--- PURCHASE DEBUG ---');
    console.log('Raw balance:', balance, 'Parsed:', currentBalance);
    console.log('Raw price:', item.price, 'Parsed:', itemPrice);

    if (currentBalance < itemPrice) {
      console.warn('Insufficient Balance Triggered!');
      soundEffects.playError();
      triggerHaptic('heavy');
      gsap.to('#balance-container', {
        keyframes: { x: [-5, 5, -5, 5, 0] },
        duration: 0.3,
      });
      return;
    }

    setLoadingItemId(item.id);
    const result = await executePurchase(item);
    setLoadingItemId(null);

    if (result.success) {
      soundEffects.playSuccess();
      triggerHaptic('heavy');
      gsap.fromTo('#status-container', { scale: 1.2 }, { scale: 1, duration: 0.3 });
    } else {
      console.error('Purchase RPC failed on server:', result.error);
      soundEffects.playError();
      triggerHaptic('heavy');
      gsap.to('#balance-container', {
        keyframes: { x: [-5, 5, -5, 5, 0] },
        duration: 0.3,
      });
    }
  };

  const handleOpenFullStore = () => {
    soundEffects.playClick();
    triggerHaptic('light');
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="w-full space-y-3 pb-24">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-gold-500" />
              Executive Store
            </h2>

            <button
              onClick={handleOpenFullStore}
              className="px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-500 hover:bg-gold-500 hover:text-black flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              <Store className="w-3 h-3" />
              <span>{lang === 'en' ? 'Open' : 'ክፈት'}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </button>
          </div>

          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            {inventory.length} / {SHOP_ITEMS.length}
          </span>
        </div>

        {/* Homepage Preview Cards */}
        <div className="space-y-2.5">
          {featuredItems.map((item) => {
            const isOwned = inventory.includes(item.id);
            const isLoading = loadingItemId === item.id;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-blueblack-900 border border-slate-800 shadow-md"
              >
                <div>
                  <p className="font-bold text-sm text-white">
                    {lang === 'en' ? item.nameEn : item.nameAm}
                  </p>
                  <p className="text-xs text-gold-500 font-semibold">
                    +{item.statusBoost} Status Points
                  </p>
                </div>

                <button
                  onClick={() => handleQuickPurchase(item)}
                  disabled={isOwned || isLoading}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
                    isOwned
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : 'bg-gold-500 hover:bg-gold-400 text-black shadow-md'
                  }`}
                >
                  {isLoading
                    ? '...'
                    : isOwned
                    ? lang === 'en'
                      ? 'Owned'
                      : 'የተገዛ'
                    : `$${item.price.toLocaleString()}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <FullStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}