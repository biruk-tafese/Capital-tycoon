'use client';

import React, { useState } from 'react';
import { useTelegramGame } from '../../context/GameContext';
import { SHOP_ITEMS } from '../../data/shopItems';
import { ShopItem } from '../../types/store';
import StoreItemCard from './StoreItemCard';
import PurchaseModal from './PurchaseModal';
import { soundEffects } from '../../lib/audio';
import { ShoppingBag, Sparkles, X } from 'lucide-react';

interface FullStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullStoreModal({ isOpen, onClose }: FullStoreModalProps) {
  const {
    balance,
    inventory,
    lang,
    executePurchase,
    triggerHaptic,
  } = useTelegramGame();

  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'insufficient_funds' | 'error' | null;
    item: ShopItem | null;
  }>({
    isOpen: false,
    type: null,
    item: null,
  });

  if (!isOpen) return null;

  const handlePurchase = async (item: ShopItem) => {
    soundEffects.playClick();

    if (balance < item.price) {
      soundEffects.playError();
      triggerHaptic('heavy');
      setModalState({
        isOpen: true,
        type: 'insufficient_funds',
        item,
      });
      return;
    }

    setLoadingItemId(item.id);
    const result = await executePurchase(item);
    setLoadingItemId(null);

    if (result.success) {
      soundEffects.playSuccess();
      setModalState({
        isOpen: true,
        type: 'success',
        item,
      });
    } else {
      soundEffects.playError();
      setModalState({
        isOpen: true,
        type: 'insufficient_funds',
        item,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-auto bg-blueblack-950 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-blueblack-900">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold-500" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              {lang === 'en' ? 'Full Executive Catalog' : 'ሙሉ ኤክስኪዩቲቭ ካታሎግ'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              {inventory.length} / {SHOP_ITEMS.length}
            </span>

            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Catalog Grid */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {SHOP_ITEMS.map((item) => {
              const isOwned = inventory.includes(item.id);
              const isLoading = loadingItemId === item.id;

              return (
                <StoreItemCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  isOwned={isOwned}
                  isLoading={isLoading}
                  onPurchase={handlePurchase}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Item Purchase Confirmation Popup */}
      <PurchaseModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        item={modalState.item}
        onClose={() => setModalState({ isOpen: false, type: null, item: null })}
        lang={lang}
      />
    </div>
  );
}