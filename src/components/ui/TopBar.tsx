'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTelegramGame } from '../../context/GameContext';
import {
  Coins,
  Award,
  Globe,
  Bell,
  X,
  CheckCheck,
  UserPlus,
  CheckCircle,
  Info,
  ListTodo,
  TrendingUp,
} from 'lucide-react';

export default function TopBar() {
  const {
    balance,
    status,
    lang,
    setLang,
    triggerHaptic,
    notifications,
    unreadCount,
    markNotificationsAsRead,
    dismissNotification,
  } = useTelegramGame();

  const [animateBalance, setAnimateBalance] = useState(false);
  const [balanceDiff, setBalanceDiff] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Guarantee integer values
  const integerBalance = Math.floor(balance || 0);
  const integerStatus = Math.floor(status || 0);

  const prevBalanceRef = useRef<number>(integerBalance);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Animate and show delta floating text whenever balance increases
  useEffect(() => {
    const prev = prevBalanceRef.current;
    const diff = integerBalance - prev;

    if (diff > 0) {
      setAnimateBalance(true);
      setBalanceDiff(diff);

      const timeout = setTimeout(() => {
        setAnimateBalance(false);
        setBalanceDiff(null);
      }, 1000);

      prevBalanceRef.current = integerBalance;
      return () => clearTimeout(timeout);
    }

    prevBalanceRef.current = integerBalance;
  }, [integerBalance]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const toggleLanguage = () => {
    triggerHaptic('light');
    setLang(lang === 'en' ? 'am' : 'en');
  };

  const toggleNotifications = () => {
    triggerHaptic('medium');
    setShowNotifications((prev) => !prev);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'referral':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'account':
        return <CheckCircle className="w-4 h-4 text-amber-400" />;
      case 'task':
        return <ListTodo className="w-4 h-4 text-blue-400" />;
      case 'boost':
        return <TrendingUp className="w-4 h-4 text-gold-400" />;
      default:
        return <Info className="w-4 h-4 text-gold-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-blueblack-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 relative" ref={dropdownRef}>
        
        {/* Balance Counter Container */}
        <div
          id="balance-container"
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blueblack-900 border border-gold-500/30 shadow-inner transition-all duration-300 ${
            animateBalance
              ? 'scale-105 border-gold-400 bg-gold-500/15 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
              : ''
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-500">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              Balance
            </p>
            <p className="text-xs font-black text-gold-500 leading-tight">
              ${integerBalance.toLocaleString()} <span className="text-[10px]">DD</span>
            </p>
          </div>

          {/* Floating reward delta popup (+150 DD) */}
          {balanceDiff !== null && (
            <span className="absolute -bottom-4 right-2 text-[10px] font-black text-emerald-400 animate-out fade-out slide-out-to-top-3 duration-1000">
              +{balanceDiff.toLocaleString()}
            </span>
          )}
        </div>

        {/* Status Points Counter */}
        <div
          id="status-container"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blueblack-900 border border-slate-800 shadow-inner"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              Status
            </p>
            <p className="text-xs font-black text-emerald-400 leading-tight">
              {integerStatus.toLocaleString()} <span className="text-[10px]">PTS</span>
            </p>
          </div>
        </div>

        {/* Right Controls: Notification Bell + Language Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Notification Bell Button */}
          <button
            onClick={toggleNotifications}
            className="relative p-2 rounded-xl bg-blueblack-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-gold-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-blueblack-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold active:scale-95 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-gold-500" />
            <span>EN</span>
          </button>
        </div>

        {/* Real-time Notifications Dropdown Modal */}
        {showNotifications && (
          <div className="absolute top-14 right-0 w-80 sm:w-88 bg-blueblack-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-blueblack-950/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gold-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-full border border-gold-500/20">
                    {unreadCount} New
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    markNotificationsAsRead();
                  }}
                  className="text-[10px] text-slate-400 hover:text-gold-500 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark All Read
                </button>
              )}
            </div>

            {/* Notification Items List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.is_read) markNotificationsAsRead(item.id);
                    }}
                    className={`p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      !item.is_read
                        ? 'bg-gold-500/5 hover:bg-gold-500/10'
                        : 'bg-transparent hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Remove Icon in front of each notification */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          dismissNotification(item.id);
                        }}
                        className="mt-0.5 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Remove notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="p-1.5 rounded-lg bg-blueblack-950 border border-slate-800">
                        {getNotificationIcon(item.type)}
                      </div>

                      <div className="space-y-0.5">
                        {/* Title: Gold color if NOT read yet, text-slate-300 if read */}
                        <p
                          className={`text-xs font-bold leading-tight ${
                            !item.is_read ? 'text-gold-400' : 'text-slate-300'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {item.message}
                        </p>
                        <p className="text-[9px] text-slate-500 pt-1">
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}