export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  dietary_preferences: string[];
  points: number;
  streak_days: number;
  items_saved: number;
  money_saved: number;
  last_active: Date | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export type UserPublic = Omit<User, 'password_hash'>;

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  dietary_preferences?: string[];
}

export interface UserUpdateInput {
  name?: string;
  dietary_preferences?: string[];
  avatar_url?: string;
}
