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
   * Safely fetches or creates a user opening the Telegram Mini App.
   * Updates profile details dynamically if the user changed their name/username in Telegram.
   */
  async getOrCreatePlayer(tgUser: TelegramUserData, referrerId?: number): Promise<PlayerRow> {
    const rawTgId = String(tgUser.id);

    // 1. Check if the player already exists in the database
    const { data: existingPlayer, error: fetchError } = await (supabase
      .from('players') as any)
      .select('*')
      .eq('telegram_id', rawTgId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing player:', fetchError);
    }

    if (existingPlayer) {
      // Sync first_name or username if they changed in Telegram
      const needsNameUpdate = tgUser.first_name && existingPlayer.first_name !== tgUser.first_name;
      const needsUserUpdate = tgUser.username && existingPlayer.username !== tgUser.username;

      if (needsNameUpdate || needsUserUpdate) {
        const { data: updatedPlayer } = await (supabase
          .from('players') as any)
          .update({
            first_name: tgUser.first_name || existingPlayer.first_name,
            username: tgUser.username || existingPlayer.username,
            updated_at: new Date().toISOString(),
          })
          .eq('telegram_id', rawTgId)
          .select('*')
          .single();

        if (updatedPlayer) return updatedPlayer as PlayerRow;
      }

      return existingPlayer as PlayerRow;
    }

    // 2. Insert new player row strictly with actual Telegram parameters
    const { data: newPlayer, error: upsertError } = await (supabase
      .from('players') as any)
      .upsert(
        {
          telegram_id: rawTgId,
          first_name: tgUser.first_name || null,
          username: tgUser.username || null,
          balance: 30000,
          status_points: 0,
          referred_by: referrerId ? String(referrerId) : null,
        },
        { onConflict: 'telegram_id', ignoreDuplicates: false }
      )
      .select('*')
      .single();

    if (upsertError) {
      console.error('Upsert failed, querying fallback player:', upsertError);
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
   * Fetches item IDs owned by the player from player_inventory
   */
  async getPlayerInventory(telegramId: number): Promise<string[]> {
    const { data, error } = await (supabase
      .from('player_inventory') as any)
      .select('item_id')
      .eq('telegram_id', String(telegramId));

    if (error || !data) {
      console.error('Error fetching player inventory:', error);
      return [];
    }

    return (data as Array<{ item_id: string }>).map((row) => row.item_id);
  },

  /**
   * Executes atomic item purchase via Postgres buy_shop_item RPC function
   */
  async purchaseItem(telegramId: number, item: ShopItem): Promise<PurchaseResult> {
    try {
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
      if (!res?.success) {
        console.warn('RPC purchase rejected by database:', res?.error);
        return { success: false, error: res?.error || 'PURCHASE_REJECTED' };
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
   * Processes referral reward ($3,000 DD) when opened via a referral link
   */
  async processReferralBonus(
    newTelegramId: number,
    referrerId: number
  ): Promise<ReferralResult> {
    try {
      const { data, error } = await (supabase.rpc as any)('process_referral', {
        p_new_telegram_id: String(newTelegramId),
        p_referrer_id: String(referrerId),
        p_reward_amount: 3000,
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