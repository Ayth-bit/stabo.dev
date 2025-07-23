// Repository Interfaces - データアクセス層の抽象化
// ====================================

import {
  User,
  Connection,
  Sticker,
  Board,
  BoardThread,
  Chat,
  ChatMessage,
  Notification,
  GachaResult,
  Location,
  BoardType,
  StickerRarity
} from '@/app/types/domain';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByQrCode(qrCode: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  updatePoints(id: string, points: number): Promise<void>;
}

export interface IConnectionRepository {
  findByUserId(userId: string): Promise<Connection[]>;
  create(userId: string, connectedUserId: string): Promise<Connection>;
  delete(userId: string, connectedUserId: string): Promise<void>;
  exists(userId: string, connectedUserId: string): Promise<boolean>;
}

export interface IStickerRepository {
  findAll(): Promise<Sticker[]>;
  findById(id: string): Promise<Sticker | null>;
  findByCreatorId(creatorId: string): Promise<Sticker[]>;
  findByRarity(rarity: StickerRarity): Promise<Sticker[]>;
  findForSale(): Promise<Sticker[]>;
  create(sticker: Omit<Sticker, 'id' | 'createdAt'>): Promise<Sticker>;
  update(id: string, sticker: Partial<Sticker>): Promise<Sticker>;
  delete(id: string): Promise<void>;
}

export interface IBoardRepository {
  findAll(): Promise<Board[]>;
  findById(id: string): Promise<Board | null>;
  findByType(type: BoardType): Promise<Board[]>;
  findWithinRadius(location: Location, radius: number): Promise<Board[]>;
  create(board: Omit<Board, 'id' | 'createdAt'>): Promise<Board>;
  update(id: string, board: Partial<Board>): Promise<Board>;
  delete(id: string): Promise<void>;
}

export interface IBoardThreadRepository {
  findByBoardId(boardId: string, limit?: number): Promise<BoardThread[]>;
  findById(id: string): Promise<BoardThread | null>;
  findByUserId(userId: string): Promise<BoardThread[]>;
  findExpired(): Promise<BoardThread[]>;
  create(thread: Omit<BoardThread, 'id' | 'createdAt' | 'viewCount' | 'likeCount'>): Promise<BoardThread>;
  update(id: string, thread: Partial<BoardThread>): Promise<BoardThread>;
  incrementViewCount(id: string): Promise<void>;
  incrementLikeCount(id: string): Promise<void>;
  decrementLikeCount(id: string): Promise<void>;
  archive(id: string, reason: string): Promise<void>;
}

export interface IChatRepository {
  findByUserId(userId: string): Promise<Chat[]>;
  findById(id: string): Promise<Chat | null>;
  findBetweenUsers(user1Id: string, user2Id: string): Promise<Chat | null>;
  create(user1Id: string, user2Id: string): Promise<Chat>;
  updateLastMessage(id: string, message: string): Promise<void>;
}

export interface IChatMessageRepository {
  findByChatId(chatId: string, limit?: number): Promise<ChatMessage[]>;
  findById(id: string): Promise<ChatMessage | null>;
  create(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
  markAsRead(id: string): Promise<void>;
  markAllAsReadByChatId(chatId: string, userId: string): Promise<void>;
}

export interface INotificationRepository {
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteOld(userId: string, keepCount: number): Promise<void>;
}

export interface IGachaRepository {
  findByUserId(userId: string): Promise<GachaResult[]>;
  create(userId: string, stickerId: string): Promise<GachaResult>;
  getRandomSticker(rarity?: StickerRarity): Promise<Sticker | null>;
}