'use client';

import React, { useState } from 'react';
import { ShopItem, FilterCategoryType } from '../../types/store';
import { SHOP_ITEMS } from '../../data/shopItems';
import StoreItemCard from './StoreItemCard';
import { Store, Sparkles, Shirt, Watch, Home, X } from 'lucide-react';

interface ECommerceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'am';
  purchasedIds: string[];
  onPurchase: (item: ShopItem) => void;
  triggerHaptic: (style?: any) => void;
}

export default function ECommerceModal({
  isOpen,
  onClose,
  lang,
  purchasedIds,
  onPurchase,
  triggerHaptic,
}: ECommerceModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategoryType>('all');

  if (!isOpen) return null;

  const filteredItems = selectedCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  const CATEGORIES = [
    { id: 'all', labelEn: 'All Items', labelAm: 'ሁሉም', icon: Sparkles },
    { id: 'clothing', labelEn: 'Apparel', labelAm: 'ልብሶች', icon: Shirt },
    { id: 'watch', labelEn: 'Watches', labelAm: 'ሰዓቶች', icon: Watch },
    { id: 'home', labelEn: 'Real Estate', labelAm: 'ቤቶች', icon: Home },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-gold-500" />
            <h3 className="text-base font-black text-white">
              {lang === 'en' ? 'E-Commerce Marketplace' : 'የገበያ ቦታ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategory(tab.id as FilterCategoryType);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gold-500 text-black shadow-lg scale-105'
                    : 'bg-blueblack-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {lang === 'en' ? tab.labelEn : tab.labelAm}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          {filteredItems.map((item) => (
            <StoreItemCard
              key={item.id}
              item={item}
              lang={lang}
              isOwned={purchasedIds.includes(item.id)}
              onPurchase={onPurchase}
              layout="grid"
            />
          ))}
        </div>
      </div>
    </div>
  );
}