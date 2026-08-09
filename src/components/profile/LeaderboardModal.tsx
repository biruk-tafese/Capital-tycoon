'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PlayerService, LeaderboardEntry } from '../../services/playerService';
import { useTelegramGame } from '../../context/GameContext';
import { supabase } from '../../lib/supabase/client';

export default function LeaderboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { telegramId, triggerHaptic } = useTelegramGame();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    try {
      const topPlayers = await PlayerService.getTopLeaderboard(50);
      setLeaderboard(topPlayers || []);

      if (telegramId) {
        const myRank = await PlayerService.getPlayerRank(telegramId);
        setUserRank(myRank);
      }
    } catch (err) {
      console.error('[LeaderboardModal] Error loading rankings:', err);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  // Fetch on open & listen to live point updates
  useEffect(() => {
    if (!isOpen) return;

    fetchLeaderboardData();

    // Subscribe to changes on the players table for real-time leaderboard updates
    const channel = supabase
      .channel('realtime:leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
        },
        () => {
          console.log('[LeaderboardModal] Realtime update detected! Refreshing rankings...');
          fetchLeaderboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, fetchLeaderboardData]);

  if (!isOpen) return null;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-xs font-bold text-slate-400">#{rank}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-blueblack-900 border border-slate-800 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-blueblack-950">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              🏆 Global Leaderboard
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">Ranked by Status Points & Net Worth</p>
          </div>
          <button 
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-16 text-slate-500 font-medium text-xs animate-pulse">
              Syncing global rankings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No active tycoons found yet.
            </div>
          ) : (
            leaderboard.map((player) => {
              const isCurrentUser = String(player.telegram_id) === String(telegramId);
              return (
                <div
                  key={player.telegram_id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-gold-500/10 border-gold-500/40 text-white shadow-sm'
                      : 'bg-blueblack-950/60 border-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 text-center shrink-0">{getRankBadge(Number(player.rank))}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">
                        {player.first_name || 'Tycoon'}{' '}
                        {isCurrentUser && <span className="text-[10px] text-gold-500 font-black">(You)</span>}
                      </p>
                      {player.username && (
                        <p className="text-[10px] text-slate-400 truncate">@{player.username}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gold-500">
                      {Number(player.status_points).toLocaleString()} PTS
                    </p>
                    <p className="text-[9px] font-bold text-emerald-400">
                      ${Number(player.balance).toLocaleString()} DD
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pinned Logged-In User Rank Footer */}
        {userRank && (
          <div className="p-3.5 bg-blueblack-950 border-t border-slate-800 shadow-inner">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">YOUR RANK:</span>
                <span className="text-sm font-black text-gold-500">#{userRank.rank}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-gold-500">
                  {Number(userRank.status_points).toLocaleString()} PTS
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}