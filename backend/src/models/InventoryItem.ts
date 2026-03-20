export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  expiry_date: string;
  storage_type: string;
  barcode: string | null;
  brand: string | null;
  image_url: string | null;
  estimated_cost: number | null;
  is_consumed: boolean;
  is_wasted: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryItemCreateInput {
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  purchase_date?: string;
  expiry_date: string;
  storage_type?: string;
  barcode?: string;
  brand?: string;
  image_url?: string;
  estimated_cost?: number;
  notes?: string;
}

export interface InventoryItemUpdateInput {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  storage_type?: string;
  estimated_cost?: number;
  notes?: string;
  is_consumed?: boolean;
  is_wasted?: boolean;
}
