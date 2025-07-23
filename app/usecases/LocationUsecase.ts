// Location Usecase - 位置・距離関連のビジネスロジック
// ====================================

import { Board, Location, DistanceResult } from '@/app/types/domain';
import { IBoardRepository, IUserRepository, IStickerRepository, IGachaRepository } from '@/app/repositories/interfaces';

export class LocationUsecase {
  constructor(
    private boardRepository: IBoardRepository,
    private userRepository: IUserRepository,
    private stickerRepository: IStickerRepository,
    private gachaRepository: IGachaRepository
  ) {}

  async getAccessibleBoards(userId: string, userLocation: Location): Promise<Board[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // ユーザーの持っているステッカーによる距離拡張効果を計算
    const radiusBoost = await this.calculateRadiusBoost(userId);
    
    const allBoards = await this.boardRepository.findAll();
    const accessibleBoards: Board[] = [];

    for (const board of allBoards) {
      const distance = this.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        board.lat,
        board.lng
      );

      const effectiveRadius = board.accessRadius + radiusBoost;
      
      if (distance <= effectiveRadius) {
        accessibleBoards.push(board);
      }
    }

    return accessibleBoards;
  }

  async checkBoardAccess(
    userId: string,
    boardId: string,
    userLocation: Location
  ): Promise<DistanceResult> {
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const radiusBoost = await this.calculateRadiusBoost(userId);
    const distance = this.calculateDistance(
      userLocation.lat,
      userLocation.lng,
      board.lat,
      board.lng
    );

    const effectiveRadius = board.accessRadius + radiusBoost;
    
    return {
      distance,
      isWithinRange: distance <= effectiveRadius
    };
  }

  async getRadiusBoostInfo(userId: string): Promise<{
    totalBoost: number;
    activeStickers: Array<{
      stickerId: string;
      stickerName: string;
      effectRadius: number;
    }>;
  }> {
    const gachaResults = await this.gachaRepository.findByUserId(userId);
    const stickerIds = gachaResults.map(result => result.stickerId);
    
    const totalBoost = await this.calculateRadiusBoost(userId);
    const activeStickers = [];

    for (const stickerId of stickerIds) {
      const sticker = await this.stickerRepository.findById(stickerId);
      if (sticker && sticker.effectType === 'radius_boost' && sticker.effectRadius) {
        activeStickers.push({
          stickerId: sticker.id,
          stickerName: sticker.name,
          effectRadius: sticker.effectRadius
        });
      }
    }

    return {
      totalBoost,
      activeStickers
    };
  }

  private async calculateRadiusBoost(userId: string): Promise<number> {
    const gachaResults = await this.gachaRepository.findByUserId(userId);
    let totalBoost = 0;

    for (const result of gachaResults) {
      const sticker = await this.stickerRepository.findById(result.stickerId);
      if (sticker && sticker.effectType === 'radius_boost' && sticker.effectRadius) {
        totalBoost += sticker.effectRadius;
      }
    }

    // 最大拡張距離を制限（例：5km）
    return Math.min(totalBoost, 5000);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // 地球の半径（メートル）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // メートルで返す
  }
}