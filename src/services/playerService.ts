import { supabase } from '../lib/supabase/client';
import { ShopItem } from '../types/store';
import { PlayerRow } from '../types/database';

export interface TelegramUserData {
  id: string; // Keep as string to avoid 64-bit integer truncation
  first_name?: string;
  username?: string;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  new_balance?: number;
  status_boost?: number;
}

export interface ReferralResult {
  success: boolean;
  reward_amount?: number;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  telegram_id: string;
  first_name: string;
  username: string;
  balance: number;
  status_points: number;
}

export const PlayerService = {
  /**
   * Safely fetches or registers the active Telegram account in Supabase.
   * Dynamically updates first_name and username if changed inside Telegram.
   */
  async getOrCreatePlayer(tgUser: TelegramUserData, referrerId?: string): Promise<PlayerRow> {
    const rawTgId = String(tgUser.id);

    // 1. Fetch player by telegram_id
    const { data: existingPlayer } = await (supabase
      .from('players') as any)
      .select('*')
      .eq('telegram_id', rawTgId)
      .maybeSingle();

    if (existingPlayer) {
      // Sync names if user changed them in Telegram
      const updatedFirstName = tgUser.first_name || existingPlayer.first_name;
      const updatedUsername = tgUser.username || existingPlayer.username;

      if (
        updatedFirstName !== existingPlayer.first_name ||
        updatedUsername !== existingPlayer.username
      ) {
        const { data: updatedPlayer } = await (supabase
          .from('players') as any)
          .update({
            first_name: updatedFirstName,
            username: updatedUsername,
            updated_at: new Date().toISOString(),
          })
          .eq('telegram_id', rawTgId)
          .select('*')
          .single();

        if (updatedPlayer) return updatedPlayer as PlayerRow;
      }

      return existingPlayer as PlayerRow;
    }

    // 2. Perform safe UPSERT for new accounts
    const { data: newPlayer, error: upsertError } = await (supabase
      .from('players') as any)
      .upsert(
        {
          telegram_id: rawTgId,
          first_name: tgUser.first_name || null,
          username: tgUser.username || null,
          balance: 30000,
          status_points: 0,
          referred_by: referrerId || null,
        },
        { onConflict: 'telegram_id', ignoreDuplicates: false }
      )
      .select('*')
      .single();

    if (upsertError) {
      console.warn('[PlayerService] Upsert fallback lookup triggered:', upsertError);
      const { data: fallbackPlayer } = await (supabase
        .from('players') as any)
        .select('*')
        .eq('telegram_id', rawTgId)
        .single();

      if (fallbackPlayer) return fallbackPlayer as PlayerRow;
      throw upsertError;
    }

    return newPlayer as PlayerRow;
  },

  /**
   * Fetches asset IDs owned by the Telegram user
   */
  async getPlayerInventory(telegramId: string): Promise<string[]> {
    const { data, error } = await (supabase
      .from('player_inventory') as any)
      .select('item_id')
      .eq('telegram_id', String(telegramId));

    if (error || !data) {
      console.error('[PlayerService] Error fetching inventory:', error);
      return [];
    }

    return (data as Array<{ item_id: string }>).map((row) => row.item_id);
  },

  /**
   * Executes atomic item purchase in PostgreSQL
   */
  async purchaseItem(telegramId: string, item: ShopItem): Promise<PurchaseResult> {
    try {
      const { data, error } = await (supabase.rpc as any)('buy_shop_item', {
        p_telegram_id: String(telegramId),
        p_item_id: String(item.id),
        p_price: Number(item.price),
        p_status_boost: Number(item.statusBoost),
      });

      if (error) {
        console.error('[PlayerService] Purchase RPC error:', error);
        return { success: false, error: error.message || 'RPC_FAILED' };
      }

      const res = data as any;
      if (!res?.success) {
        return { success: false, error: res?.error || 'PURCHASE_REJECTED' };
      }

      return {
        success: true,
        new_balance: Number(res.new_balance),
        status_boost: Number(res.status_boost),
      };
    } catch (err: any) {
      console.error('[PlayerService] Unhandled purchase error:', err);
      return { success: false, error: err?.message || 'SERVER_ERROR' };
    }
  },

  /**
   * Processes referral bonus ($3,000 DD)
   */
  async processReferralBonus(
    newTelegramId: string,
    referrerId: string
  ): Promise<ReferralResult> {
    try {
      const { data, error } = await (supabase.rpc as any)('process_referral', {
        p_new_telegram_id: String(newTelegramId),
        p_referrer_id: String(referrerId),
        p_reward_amount: 3000,
      });

      if (error) {
        console.error('[PlayerService] Referral RPC error:', error);
        return { success: false, error: error.message || 'REFERRAL_FAILED' };
      }

      return (data as ReferralResult) || { success: false, error: 'UNKNOWN_ERROR' };
    } catch (err: any) {
      console.error('[PlayerService] Unhandled referral error:', err);
      return { success: false, error: err?.message || 'SERVER_ERROR' };
    }
  },

  /**
   * Fetches the top N players sorted by Status Points
   */
  async getTopLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await (supabase.rpc as any)('get_top_leaderboard', {
        p_limit: limit,
      });

      if (error) {
        console.error('[Leaderboard] Error fetching top players:', error);
        return [];
      }

      return (data || []) as LeaderboardEntry[];
    } catch (err) {
      console.error('[Leaderboard] Unhandled exception:', err);
      return [];
    }
  },

  /**
   * Fetches the specific logged-in player's rank details
   */
  async getPlayerRank(telegramId: string): Promise<LeaderboardEntry | null> {
    try {
      const { data, error } = await (supabase.rpc as any)('get_player_rank', {
        p_telegram_id: String(telegramId),
      });

      if (error || data?.error) {
        console.error('[Leaderboard] Error fetching player rank:', error || data?.error);
        return null;
      }

      return data as LeaderboardEntry;
    } catch (err) {
      console.error('[Leaderboard] Unhandled exception:', err);
      return null;
    }
  },

  /**
   * Saves or updates the player's connected TON wallet address
   */
  async saveWalletAddress(telegramId: string, walletAddress: string): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('players') as any)
        .update({
          ton_wallet_address: walletAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('telegram_id', String(telegramId));

      if (error) {
        console.error('[PlayerService] Failed to save TON wallet address:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[PlayerService] Unhandled wallet save exception:', err);
      return false;
    }
  },
  
  /**
   * Fetches the total number of users referred by a player from Supabase
   */
  async getReferralCount(telegramId: string): Promise<number> {
    try {
      const { count, error } = await (supabase
        .from('players') as any)
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', String(telegramId));

      if (error) {
        console.error('[PlayerService] Error fetching referral count:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('[PlayerService] Unhandled referral count exception:', err);
      return 0;
    }
  },
};