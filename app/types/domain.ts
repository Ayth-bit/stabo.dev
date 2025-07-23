// Domain Types - ドメインレイヤーの型定義
// ====================================

export interface User {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  baseLat: number | null;
  baseLng: number | null;
  baseRadius: number;
  isCreator: boolean;
  qrCode: string | null;
  points: number;
  createdAt: Date;
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  createdAt: Date;
}

export interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
  creatorId: string | null;
  rarity: StickerRarity;
  effectType: StickerEffectType | null;
  effectRadius: number | null;
  price: number;
  isForSale: boolean;
  createdAt: Date;
}

export interface Board {
  id: string;
  type: BoardType;
  name: string;
  lat: number;
  lng: number;
  accessRadius: number; // 投稿可能範囲 (300m)
  viewRadius?: number;  // 閲覧可能範囲 (1500m) - デフォルト
  description?: string;
  createdAt: Date;
}

export interface BoardThread {
  id: string;
  boardId: string;
  userId: string;
  content: string;
  stickerId: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  isArchived: boolean;
  viewCount: number;
  likeCount: number;
}

export interface Chat {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  stickerId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

export interface GachaResult {
  id: string;
  userId: string;
  stickerId: string;
  obtainedAt: Date;
}

// Enums
export type StickerRarity = 1 | 2 | 3; // 1:コモン, 2:レア, 3:スーパーレア
export type StickerEffectType = "radius_boost" | null;
export type BoardType = "station" | "ward" | "park";
export type NotificationType =
  | "new_board"
  | "chat_message"
  | "sticker_drop"
  | "thread_like";

// Location
export interface Location {
  lat: number;
  lng: number;
}

// Distance calculation result
export interface DistanceResult {
  distance: number;
  isWithinRange: boolean;
}
