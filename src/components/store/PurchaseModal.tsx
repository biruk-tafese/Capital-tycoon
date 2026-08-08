'use client';

import React from 'react';
import { ShopItem } from '../../types/store';
import Item3DCanvas from '../3d/Item3DCanvas';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ShoppingBag,
  Coins,
  X,
  ArrowRight,
} from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  type: 'success' | 'insufficient_funds' | 'error' | null;
  item: ShopItem | null;
  onClose: () => void;
  lang?: 'en' | 'am';
}

export default function PurchaseModal({
  isOpen,
  type,
  item,
  onClose,
  lang = 'en',
}: PurchaseModalProps) {
  if (!isOpen || !item || !type) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs bg-blueblack-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-full bg-blueblack-950/60 border border-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Status Header Badge */}
        <div className="flex justify-center pt-2">
          {isSuccess ? (
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Modal Title & Message */}
        <div>
          <h3 className="text-base font-extrabold text-white">
            {isSuccess
              ? lang === 'en'
                ? 'Purchase Successful!'
                : 'ግዢው ተሳክቷል!'
              : lang === 'en'
              ? 'Insufficient Balance'
              : 'በቂ ሂሳብ የሎትም'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
            {isSuccess
              ? lang === 'en'
                ? `You acquired ${item.nameEn} and unlocked +${item.statusBoost} Status Points!`
                : `${item.nameAm} በተሳካ ሁኔታ ተገዝቷል!`
              : lang === 'en'
              ? `You need $${item.price.toLocaleString()} Digital Dollars to buy this item.`
              : `ይህንን ለማግኘት $${item.price.toLocaleString()} ዲጂታል ዶላር ያስፈልጋቸዋል።`}
          </p>
        </div>

        {/* 3D Item Showcase */}
        <div className="w-full h-32 bg-white rounded-2xl border border-slate-800 overflow-hidden shadow-inner relative my-2">
          <Item3DCanvas category={item.category} />
        </div>

        {/* Item Stats Bar */}
        <div className="p-2.5 bg-blueblack-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 truncate max-w-[120px]">
            {lang === 'en' ? item.nameEn : item.nameAm}
          </span>
          <span className="font-black text-gold-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            +{item.statusBoost} PTS
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all ${
            isSuccess
              ? 'bg-gold-500 hover:bg-gold-400 text-black'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
          }`}
        >
          {isSuccess ? (
            <>
              {lang === 'en' ? 'Claim & Continue' : 'ቀጥል'}
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              {lang === 'en' ? 'Got It' : 'ተረድቻለሁ'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}