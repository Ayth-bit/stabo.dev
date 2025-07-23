// User Usecase - ユーザー関連のビジネスロジック
// ====================================

import { User, Location } from '@/app/types/domain';
import { IUserRepository } from '@/app/repositories/interfaces';

export class UserUsecase {
  constructor(private userRepository: IUserRepository) {}

  async getUserProfile(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async createUserProfile(
    id: string,
    displayName: string,
    avatarUrl?: string
  ): Promise<User> {
    const qrCode = this.generateQRCode(id);
    
    return await this.userRepository.create({
      displayName,
      avatarUrl: avatarUrl || null,
      baseLat: null,
      baseLng: null,
      baseRadius: 1000,
      isCreator: false,
      qrCode,
      points: 0
    });
  }

  async updateUserProfile(
    id: string,
    updates: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'isCreator'>>
  ): Promise<User> {
    return await this.userRepository.update(id, updates);
  }

  async setUserBase(
    id: string,
    location: Location,
    radius: number
  ): Promise<User> {
    if (radius < 500 || radius > 5000) {
      throw new Error('Base radius must be between 500m and 5000m');
    }

    return await this.userRepository.update(id, {
      baseLat: location.lat,
      baseLng: location.lng,
      baseRadius: radius
    });
  }

  async findUserByQRCode(qrCode: string): Promise<User | null> {
    return await this.userRepository.findByQrCode(qrCode);
  }

  async addPoints(id: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Point amount must be positive');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const newPoints = user.points + amount;
    await this.userRepository.updatePoints(id, newPoints);
  }

  async deductPoints(id: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Point amount must be positive');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.points < amount) {
      throw new Error('Insufficient points');
    }

    const newPoints = user.points - amount;
    await this.userRepository.updatePoints(id, newPoints);
  }

  private generateQRCode(userId: string): string {
    return `stabo_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
  }
}