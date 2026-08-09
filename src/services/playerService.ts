import { supabase } from '../lib/supabase/client';
import { ShopItem } from '../types/store';
import { PlayerRow } from '../types/database';

export interface TelegramUserData {
  id: string | number;
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
   * Auto-grants 30,000 starting coins to new accounts and triggers referral rewards.
   */
  async getOrCreatePlayer(tgUser: TelegramUserData, referrerId?: string): Promise<PlayerRow> {
    if (!tgUser?.id) {
      throw new Error('[PlayerService] Telegram user ID is required');
    }

    const rawTgId = String(tgUser.id);
    const validReferrerId =
      referrerId && String(referrerId) !== rawTgId ? String(referrerId) : null;

    // 1. Fetch player by telegram_id
    const { data: existingPlayer, error: fetchError } = await (supabase
      .from('players') as any)
      .select('*')
      .eq('telegram_id', rawTgId)
      .maybeSingle();

    if (fetchError) {
      console.error('[PlayerService] Error checking existing player:', fetchError);
    }

    if (existingPlayer) {
      const player = existingPlayer as PlayerRow;
      // Sync names if user changed them inside Telegram
      const updatedFirstName = tgUser.first_name || player.first_name || '';
      const updatedUsername = tgUser.username || player.username || '';

      if (
        updatedFirstName !== player.first_name ||
        updatedUsername !== player.username
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

      return player;
    }

    // 2. Insert new account with 30,000 starting balance
    const newAccountPayload = {
      telegram_id: rawTgId,
      first_name: tgUser.first_name || null,
      username: tgUser.username || null,
      balance: 30000, // Explicit starting balance
      status_points: 0,
      referred_by: validReferrerId,
    };

    const { data: newPlayer, error: insertError } = await (supabase
      .from('players') as any)
      .insert([newAccountPayload])
      .select('*')
      .single();

    if (insertError) {
      // Handle potential race condition if inserted simultaneously
      console.warn('[PlayerService] Insert fallback lookup triggered:', insertError);
      const { data: fallbackPlayer, error: fallbackError } = await (supabase
        .from('players') as any)
        .select('*')
        .eq('telegram_id', rawTgId)
        .single();

      if (fallbackPlayer) return fallbackPlayer as PlayerRow;
      throw fallbackError || insertError;
    }

    // 3. Trigger +3,000 referral bonus for the referrer
    if (validReferrerId && newPlayer) {
      this.processReferralBonus(rawTgId, validReferrerId).catch((err) =>
        console.error('[PlayerService] Background referral error:', err)
      );
    }

    return newPlayer as PlayerRow;
  },

  /**
   * Fetches asset IDs owned by the Telegram user
   */
  async getPlayerInventory(telegramId: string): Promise<string[]> {
    if (!telegramId) return [];

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
    if (!telegramId || !item?.id) {
      return { success: false, error: 'INVALID_PARAMETERS' };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('buy_shop_item', {
        p_telegram_id: String(telegramId),
        p_item_id: String(item.id),
        p_price: Number(item.price),
        p_status_boost: Number(item.statusBoost || 0),
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
   * Processes referral bonus (+3,000 coins to referrer)
   */
  async processReferralBonus(
    newTelegramId: string,
    referrerId: string
  ): Promise<ReferralResult> {
    if (!newTelegramId || !referrerId || newTelegramId === referrerId) {
      return { success: false, error: 'INVALID_REFERRAL_PAIR' };
    }

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
    if (!telegramId) return null;

    try {
      const { data, error } = await (supabase.rpc as any)('get_player_rank', {
        p_telegram_id: String(telegramId),
      });

      if (error || (data as any)?.error) {
        console.error('[Leaderboard] Error fetching player rank:', error || (data as any)?.error);
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
    if (!telegramId || !walletAddress) return false;

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
    if (!telegramId) return 0;

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