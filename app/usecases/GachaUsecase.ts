// Gacha Usecase - ガチャ関連のビジネスロジック
// ====================================

import type { IGachaRepository, IUserRepository } from '@/app/repositories/interfaces';
import type { GachaResult, Sticker, StickerRarity } from '@/app/types/domain';

export interface GachaConfig {
  commonCost: number;
  rareCost: number;
  superRareCost: number;
  commonRate: number; // 0-1の確率
  rareRate: number; // 0-1の確率
  superRareRate: number; // 0-1の確率
}

export class GachaUsecase {
  private config: GachaConfig = {
    commonCost: 100,
    rareCost: 300,
    superRareCost: 500,
    commonRate: 0.7, // 70%
    rareRate: 0.25, // 25%
    superRareRate: 0.05, // 5%
  };

  constructor(
    private gachaRepository: IGachaRepository,
    private userRepository: IUserRepository
  ) {}

  async drawGacha(userId: string, gachaType: 'normal' | 'premium'): Promise<GachaResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const cost = this.getGachaCost(gachaType);
    if (user.points < cost) {
      throw new Error('Insufficient points');
    }

    // ガチャを引く
    const sticker = await this.drawRandomSticker(gachaType);
    if (!sticker) {
      throw new Error('No stickers available');
    }

    // ポイントを消費
    await this.userRepository.updatePoints(userId, user.points - cost);

    // 結果を記録
    const result = await this.gachaRepository.create(userId, sticker.id);

    return result;
  }

  async getUserGachaHistory(userId: string): Promise<GachaResult[]> {
    return await this.gachaRepository.findByUserId(userId);
  }

  private getGachaCost(gachaType: 'normal' | 'premium'): number {
    switch (gachaType) {
      case 'normal':
        return this.config.commonCost;
      case 'premium':
        return this.config.rareCost;
      default:
        throw new Error('Invalid gacha type');
    }
  }

  private async drawRandomSticker(gachaType: 'normal' | 'premium'): Promise<Sticker | null> {
    const rarity = this.determineRarity(gachaType);
    return await this.gachaRepository.getRandomSticker(rarity);
  }

  private determineRarity(gachaType: 'normal' | 'premium'): StickerRarity {
    const random = Math.random();

    if (gachaType === 'premium') {
      // プレミアムガチャは高レア率アップ
      if (random < this.config.superRareRate * 2) {
        return 3; // スーパーレア
      }
      if (random < this.config.superRareRate * 2 + this.config.rareRate * 1.5) {
        return 2; // レア
      }
      return 1; // コモン
    }
    // 通常ガチャ
    if (random < this.config.superRareRate) {
      return 3; // スーパーレア
    }
    if (random < this.config.superRareRate + this.config.rareRate) {
      return 2; // レア
    }
    return 1; // コモン
  }

  async getGachaRates(gachaType: 'normal' | 'premium'): Promise<{
    common: number;
    rare: number;
    superRare: number;
    cost: number;
  }> {
    const cost = this.getGachaCost(gachaType);

    if (gachaType === 'premium') {
      return {
        common: this.config.commonRate * 0.6, // プレミアムでは下がる
        rare: this.config.rareRate * 1.5, // プレミアムでは上がる
        superRare: this.config.superRareRate * 2, // プレミアムでは2倍
        cost,
      };
    }
    return {
      common: this.config.commonRate,
      rare: this.config.rareRate,
      superRare: this.config.superRareRate,
      cost,
    };
  }
}
