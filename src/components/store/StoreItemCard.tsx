'use client';

import React from 'react';
import { ShopItem } from '../../types/store';
import Item3DCanvas from '../3d/Item3DCanvas';
import {
  ShoppingBag,
  Check,
  Loader2,
  Shirt,
  Watch,
  Home,
  Crown,
  Sparkles,
} from 'lucide-react';

interface StoreItemCardProps {
  item: ShopItem;
  lang: 'en' | 'am';
  isOwned: boolean;
  isLoading?: boolean;
  onPurchase: (item: ShopItem) => void;
  layout?: 'compact' | 'grid';
}

export default function StoreItemCard({
  item,
  lang,
  isOwned,
  isLoading = false,
  onPurchase,
  layout = 'grid',
}: StoreItemCardProps) {
  // Helper to render Lucide React icons instead of text emojis
  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'clothing':
        return <Shirt className="w-5 h-5 text-purple-400" />;
      case 'watch':
        return <Watch className="w-5 h-5 text-gold-500" />;
      case 'home':
        return <Home className="w-5 h-5 text-sky-400" />;
      default:
        return <Crown className="w-5 h-5 text-gold-500" />;
    }
  };

  if (layout === 'compact') {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blueblack-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blueblack-950 border border-slate-800 flex items-center justify-center shadow-inner">
            {renderCategoryIcon(item.category)}
          </div>
          <div>
            <p className="font-bold text-sm text-white">
              {lang === 'en' ? item.nameEn : item.nameAm}
            </p>
            <p className="text-xs text-gold-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold-500" />
              +{item.statusBoost} PTS
            </p>
          </div>
        </div>

        <button
          onClick={() => onPurchase(item)}
          disabled={isOwned || isLoading}
          className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 ${
            isOwned
              ? 'bg-slate-800 text-slate-400 cursor-default'
              : 'bg-gold-500 hover:bg-gold-400 text-black shadow-md disabled:opacity-70'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isOwned ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'en' ? 'Owned' : 'ተገዝቷል'}
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />${item.price.toLocaleString()}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-blueblack-900 border border-slate-800 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-gold-500/50 transition-all">
      {/* Real-time Three.js 3D Object Render */}
      <div className="w-full h-28 bg-blueblack-950 rounded-xl border border-slate-800/80 overflow-hidden shadow-inner group-hover:scale-105 transition-transform relative">
        <Item3DCanvas category={item.category} />
      </div>

      <div>
        <p className="font-bold text-xs text-white line-clamp-1">
          {lang === 'en' ? item.nameEn : item.nameAm}
        </p>
        <p className="text-[11px] text-gold-500 font-semibold mt-0.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold-500" />
          +{item.statusBoost} Status PTS
        </p>
      </div>

      <button
        onClick={() => onPurchase(item)}
        disabled={isOwned || isLoading}
        className={`w-full py-2 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-transform active:scale-95 ${
          isOwned
            ? 'bg-slate-800 text-slate-400 cursor-default'
            : 'bg-gold-500 hover:bg-gold-400 text-black shadow-md disabled:opacity-70'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isOwned ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            {lang === 'en' ? 'Owned' : 'ተገዝቷል'}
          </>
        ) : (
          <>
            <ShoppingBag className="w-3 h-3" />
            Buy (${item.price.toLocaleString()})
          </>
        )}
      </button>
    </div>
  );
}