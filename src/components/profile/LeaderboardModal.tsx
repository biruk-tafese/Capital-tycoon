'use client';

import React, { useEffect, useState } from 'react';
import { PlayerService, LeaderboardEntry } from '../../services/playerService';
import { useTelegramGame } from '../../context/GameContext';

export default function LeaderboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { telegramId } = useTelegramGame();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboardData = async () => {
      setLoading(true);
      try {
        const topPlayers = await PlayerService.getTopLeaderboard(50);
        setLeaderboard(topPlayers);

        if (telegramId) {
          const myRank = await PlayerService.getPlayerRank(telegramId);
          setUserRank(myRank);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [isOpen, telegramId]);

  if (!isOpen) return null;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-bold text-slate-400">#{rank}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🏆 Global Leaderboard
            </h2>
            <p className="text-xs text-slate-400">Ranked by Status Points & Net Worth</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium">Loading rankings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No active tycoons yet.</div>
          ) : (
            leaderboard.map((player) => {
              const isCurrentUser = String(player.telegram_id) === String(telegramId);
              return (
                <div
                  key={player.telegram_id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isCurrentUser
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center">{getRankBadge(player.rank)}</div>
                    <div>
                      <p className="text-sm font-bold leading-tight">
                        {player.first_name || 'Tycoon'} {isCurrentUser && <span className="text-xs text-amber-400">(You)</span>}
                      </p>
                      {player.username && <p className="text-xs text-slate-400">@{player.username}</p>}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-amber-400">{player.status_points} PTS</p>
                    <p className="text-[10px] text-slate-400">${Number(player.balance).toLocaleString()} DD</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pinned Logged-In User Rank Footer */}
        {userRank && (
          <div className="p-3 bg-slate-950 border-t border-amber-500/30 rounded-b-2xl">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">YOUR RANK:</span>
                <span className="text-sm font-black text-white">#{userRank.rank}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-400">{userRank.status_points} PTS</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}