import { supabase } from '../lib/supabase/client';
import { ShopItem } from '../types/store';
import { PlayerRow } from '../types/database';

export interface TelegramUserData {
  id: number;
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

export const PlayerService = {
  /**
   * Safely fetches or creates a user opening the Telegram Mini App using UPSERT.
   * Sends telegram_id as a string to protect against 64-bit integer precision loss.
   */
  async getOrCreatePlayer(tgUser: TelegramUserData, referrerId?: number): Promise<PlayerRow> {
    const rawTgId = String(tgUser.id);

    // 1. Try fetching existing player first
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('telegram_id', rawTgId)
      .maybeSingle();

    if (existingPlayer) {
      return existingPlayer as unknown as PlayerRow;
    }

    // 2. Insert with 30,000 starting balance if new user
    const { data: newPlayer, error: upsertError } = await supabase
      .from('players')
      .upsert(
        {
          telegram_id: rawTgId,
          first_name: tgUser.first_name || 'Tycoon Player',
          username: tgUser.username || null,
          balance: 30000,
          status_points: 0,
          referred_by: referrerId ? String(referrerId) : null,
        } as any,
        { onConflict: 'telegram_id', ignoreDuplicates: true }
      )
      .select('*')
      .single();

    if (upsertError) {
      const { data: fallbackPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('telegram_id', rawTgId)
        .single();

      if (fallbackPlayer) return fallbackPlayer as unknown as PlayerRow;

      console.error('Error in getOrCreatePlayer:', upsertError);
      throw upsertError;
    }

    return newPlayer as unknown as PlayerRow;
  },

  /**
   * Fetches item IDs owned by the player from player_inventory
   */
  async getPlayerInventory(telegramId: number): Promise<string[]> {
    const { data, error } = await supabase
      .from('player_inventory')
      .select('item_id')
      .eq('telegram_id', String(telegramId));

    if (error || !data) {
      console.error('Error fetching inventory:', error);
      return [];
    }

    return (data as Array<{ item_id: string }>).map((row) => row.item_id);
  },

  /**
   * Executes atomic item purchase via Postgres RPC function
   */
  async purchaseItem(telegramId: number, item: ShopItem): Promise<PurchaseResult> {
    try {
      // Cast supabase.rpc as any to bypass client typing restrictions for custom RPCs
      const { data, error } = await (supabase.rpc as any)('buy_shop_item', {
        p_telegram_id: String(telegramId),
        p_item_id: String(item.id),
        p_price: Number(item.price),
        p_status_boost: Number(item.statusBoost),
      });

      if (error) {
        console.error('RPC purchase error:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message || 'RPC_FAILED' };
      }

      const res = data as any;
      if (!res.success) {
        console.warn('RPC purchase rejected by DB:', res.error);
        return { success: false, error: res.error };
      }

      return {
        success: true,
        new_balance: Number(res.new_balance),
        status_boost: Number(res.status_boost),
      };
    } catch (err: any) {
      console.error('Unhandled purchase exception:', err);
      return { success: false, error: err?.message || 'SERVER_ERROR' };
    }
  },

  /**
   * Processes referral reward when a user opens the app via a referral link
   */
  async processReferralBonus(
    newTelegramId: number,
    referrerId: number
  ): Promise<ReferralResult> {
    try {
      const { data, error } = await (supabase.rpc as any)('process_referral', {
        p_new_telegram_id: String(newTelegramId),
        p_referrer_id: String(referrerId),
        p_reward_amount: 3000, // Updated to $3,000 DD
      });

      if (error) {
        console.error('Error processing referral:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message || 'REFERRAL_FAILED' };
      }

      return (data as ReferralResult) || { success: false, error: 'UNKNOWN_ERROR' };
    } catch (err: any) {
      console.error('Unhandled referral exception:', err);
      return { success: false, error: err?.message || 'SERVER_ERROR' };
    }
  },
};