/**
 * プロファイル関連の型定義
 * 画面設計書に基づく型定義
 */

export type Theme = "mental" | "love" | "career";

export type Profile = {
  user_id: string;
  selected_character_id: string | null;
  default_theme: Theme | null;
  display_name?: string;
  avatar_url?: string;
  locale?: string;
  created_at: string;
  updated_at: string;
};

export type Character = {
  character_id: string;
  user_id: string;
  name: string;
  thumbnail_url?: string;
  theme: Theme;
  personality_type?: string;
  model_asset_id?: string;
  default_pose?: string;
  popularity?: number;
  created_at: string;
  updated_at: string;
};

export type ProfileResponse = {
  success: boolean;
  message: string;
  data?: Profile;
  error?: string;
};

export type CharacterResponse = {
  success: boolean;
  message: string;
  data?: Character[];
  error?: string;
};

export type UpdateProfileRequest = {
  selected_character_id?: string | null;
  default_theme?: Theme | null;
  display_name?: string;
  avatar_url?: string;
  locale?: string;
};
