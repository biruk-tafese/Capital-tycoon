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

export interface NotificationItem {
  id: string;
  telegram_id: string;
  title: string;
  message: string;
  type: 'referral' | 'account' | 'task' | 'system';
  is_read: boolean;
  created_at: string;
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
      try {
        await this.processReferralBonus(rawTgId, validReferrerId);
        console.log(`[PlayerService] Referral bonus credited to ${validReferrerId}`);
      } catch (err) {
        console.error('[PlayerService] Referral bonus error:', err);
      }
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

      const res = Array.isArray(data) ? data[0] : data;
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

      const result = Array.isArray(data) ? data[0] : data;
      return (result as ReferralResult) || { success: false, error: 'UNKNOWN_ERROR' };
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

      if (error) {
        console.error('[Leaderboard] Error fetching player rank:', error);
        return null;
      }

      // RPC functions returning tables return arrays in JS -> Pick first element
      if (Array.isArray(data) && data.length > 0) {
        return data[0] as LeaderboardEntry;
      }

      return (data as LeaderboardEntry) || null;
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




  /**
   * Fetches all notifications for a specific player sorted by latest
   */
  async getNotifications(telegramId: string): Promise<NotificationItem[]> {
    if (!telegramId) return [];
    try {
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('telegram_id', String(telegramId))
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('[PlayerService] Error fetching notifications:', error);
        return [];
      }
      return (data || []) as NotificationItem[];
    } catch (err) {
      console.error('[PlayerService] Unhandled notifications error:', err);
      return [];
    }
  },

  /**
   * Marks specific or all notifications as read
   */
  async markNotificationsRead(telegramId: string, notificationId?: string): Promise<boolean> {
    if (!telegramId) return false;
    try {
      let query = (supabase.from('notifications') as any)
        .update({ is_read: true })
        .eq('telegram_id', String(telegramId));

      if (notificationId) {
        query = query.eq('id', notificationId);
      } else {
        query = query.eq('is_read', false);
      }

      const { error } = await query;
      if (error) {
        console.error('[PlayerService] Error marking notifications read:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[PlayerService] Unhandled mark read error:', err);
      return false;
    }
  },

  /**
   * Removes a notification from the list
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!notificationId) return false;
    try {
      const { error } = await (supabase
        .from('notifications') as any)
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[PlayerService] Error deleting notification:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[PlayerService] Unhandled notification delete error:', err);
      return false;
    }
  },

  /**
   * Creates a manual system/task notification
   */
  async createNotification(
    telegramId: string,
    title: string,
    message: string,
    type: 'referral' | 'account' | 'task' | 'system' = 'system'
  ): Promise<boolean> {
    if (!telegramId) return false;
    try {
      const { error } = await (supabase.from('notifications') as any).insert([
        {
          telegram_id: String(telegramId),
          title,
          message,
          type,
          is_read: false,
        },
      ]);
      return !error;
    } catch (err) {
      console.error('[PlayerService] Error creating notification:', err);
      return false;
    }
  },
};
