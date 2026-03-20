export interface WasteLog {
  id: string;
  user_id: string;
  item_id: string | null;
  item_name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  estimated_cost: number | null;
  reason: 'expired' | 'spoiled' | 'over_purchased' | 'disliked' | 'other' | null;
  logged_at: Date;
}

export interface WasteLogCreateInput {
  item_id?: string;
  item_name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  estimated_cost?: number;
  reason?: WasteLog['reason'];
}
