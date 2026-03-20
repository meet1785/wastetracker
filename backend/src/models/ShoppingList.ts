export interface ShoppingListItem {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  is_purchased: boolean;
  is_auto_generated: boolean;
  priority: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingListItemCreateInput {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  priority?: number;
  notes?: string;
  is_auto_generated?: boolean;
}
