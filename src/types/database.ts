export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          telegram_id: number;
          username: string | null;
          first_name: string | null;
          balance: number;
          status_points: number;
          language: string;
          referred_by: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          telegram_id: number | string;
          username?: string | null;
          first_name?: string | null;
          balance?: number;
          status_points?: number;
          language?: string;
          referred_by?: number | string | null;
        };
        Update: {
          balance?: number;
          status_points?: number;
          language?: string;
          username?: string | null;
          first_name?: string | null;
          updated_at?: string;
        };
      };
      player_inventory: {
        Row: {
          id: string;
          telegram_id: number;
          item_id: string;
          purchased_at: string;
        };
        Insert: {
          telegram_id: number | string;
          item_id: string;
        };
      };
    };
    Functions: {
      buy_shop_item: {
        Args: {
          p_telegram_id: number | string;
          p_item_id: string;
          p_price: number;
          p_status_boost: number;
        };
        Returns: Json;
      };
    };
  };
}

export type PlayerRow = Database['public']['Tables']['players']['Row'];
export type PlayerInsert = Database['public']['Tables']['players']['Insert'];
export type InventoryRow = Database['public']['Tables']['player_inventory']['Row'];