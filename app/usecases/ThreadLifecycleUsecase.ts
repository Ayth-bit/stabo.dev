// Thread Lifecycle Usecase - スレッド寿命管理のビジネスロジック
// ====================================

import type { IBoardThreadRepository } from '@/app/repositories/interfaces';
import type { BoardThread } from '@/app/types/domain';

export interface ThreadLifecycleConfig {
  defaultExpireDays: number;
  maxThreadsPerBoard: number;
  fadeOutStartHours: number; // 期限切れ何時間前からフェードアウト開始
}

export class ThreadLifecycleUsecase {
  private config: ThreadLifecycleConfig = {
    defaultExpireDays: 3, // デフォルト3日で期限切れ
    maxThreadsPerBoard: 100, // 掲示板あたり最大100スレッド
    fadeOutStartHours: 6, // 期限切れ6時間前からフェードアウト
  };

  constructor(private threadRepository: IBoardThreadRepository) {}

  async createThreadWithExpiry(
    boardId: string,
    userId: string,
    content: string,
    stickerId?: string,
    customExpireDays?: number
  ): Promise<BoardThread> {
    const expireDays = customExpireDays || this.config.defaultExpireDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expireDays);

    return await this.threadRepository.create({
      boardId,
      userId,
      content,
      stickerId: stickerId || null,
      expiresAt,
      isArchived: false,
    });
  }

  async getThreadsWithLifecycleInfo(boardId: string): Promise<
    Array<
      BoardThread & {
        remainingHours: number;
        fadeFactor: number; // 0-1, フェードアウト度合い
        isExpiring: boolean;
      }
    >
  > {
    const threads = await this.threadRepository.findByBoardId(boardId);
    const now = new Date();

    return threads.map((thread) => {
      let remainingHours = 0;
      let fadeFactor = 1;
      let isExpiring = false;

      if (thread.expiresAt) {
        const remainingMs = thread.expiresAt.getTime() - now.getTime();
        remainingHours = Math.max(0, remainingMs / (1000 * 60 * 60));

        // フェードアウト計算
        const fadeStartHours = this.config.fadeOutStartHours;
        if (remainingHours <= fadeStartHours) {
          isExpiring = true;
          fadeFactor = Math.max(0.3, remainingHours / fadeStartHours); // 最低30%の透明度まで
        }
      }

      return {
        ...thread,
        remainingHours,
        fadeFactor,
        isExpiring,
      };
    });
  }

  async archiveExpiredThreads(): Promise<{
    archivedCount: number;
    archivedThreadIds: string[];
  }> {
    const expiredThreads = await this.threadRepository.findExpired();
    const archivedThreadIds: string[] = [];

    for (const thread of expiredThreads) {
      await this.threadRepository.archive(thread.id, 'expired');
      archivedThreadIds.push(thread.id);
    }

    return {
      archivedCount: archivedThreadIds.length,
      archivedThreadIds,
    };
  }

  async enforceThreadLimits(): Promise<{
    archivedCount: number;
    boardStats: Array<{
      boardId: string;
      threadCount: number;
      archivedCount: number;
    }>;
  }> {
    const allThreads = await this.threadRepository.findByBoardId(''); // すべてのスレッド
    const boardGroups = this.groupThreadsByBoard(allThreads);

    let totalArchivedCount = 0;
    const boardStats = [];

    for (const [boardId, threads] of boardGroups) {
      const activeThreads = threads.filter((t) => !t.isArchived);

      if (activeThreads.length > this.config.maxThreadsPerBoard) {
        // 作成日が古い順にソート
        const sortedThreads = activeThreads.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        const threadsToArchive = sortedThreads.slice(
          0,
          activeThreads.length - this.config.maxThreadsPerBoard
        );

        for (const thread of threadsToArchive) {
          await this.threadRepository.archive(thread.id, 'limit_reached');
        }

        totalArchivedCount += threadsToArchive.length;

        boardStats.push({
          boardId,
          threadCount: activeThreads.length,
          archivedCount: threadsToArchive.length,
        });
      }
    }

    return {
      archivedCount: totalArchivedCount,
      boardStats,
    };
  }

  async extendThreadLife(threadId: string, additionalDays: number): Promise<BoardThread> {
    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (thread.isArchived) {
      throw new Error('Cannot extend archived thread');
    }

    const newExpiresAt = thread.expiresAt ? new Date(thread.expiresAt) : new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

    return await this.threadRepository.update(threadId, {
      expiresAt: newExpiresAt,
    });
  }

  async restoreThread(threadId: string): Promise<BoardThread> {
    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (!thread.isArchived) {
      throw new Error('Thread is not archived');
    }

    // 復元回数チェック（1回のみ）
    const restoreCount = (thread as BoardThread & { restore_count?: number }).restore_count || 0;
    if (restoreCount >= 1) {
      throw new Error('Thread cannot be restored more than once');
    }

    // 72時間後の期限を再設定
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 72);

    return await this.threadRepository.update(threadId, {
      isArchived: false,
      expiresAt: newExpiresAt,
    });
  }

  async getRestorableThreads(
    boardId: string
  ): Promise<
    Array<
      BoardThread & {
        canRestore: boolean;
        restoreCount: number;
      }
    >
  > {
    const archivedThreads = await this.threadRepository.findByBoardId(boardId);
    const filteredArchivedThreads = archivedThreads.filter(thread => thread.isArchived);

    return filteredArchivedThreads.map((thread) => {
      const restoreCount = (thread as { restore_count?: number }).restore_count || 0;
      const canRestore = restoreCount === 0;

      return {
        ...thread,
        canRestore,
        restoreCount,
      };
    });
  }

  async getThreadLifecycleStats(): Promise<{
    totalActiveThreads: number;
    expiringIn24Hours: number;
    expiringIn6Hours: number;
    expired: number;
    averageLifetime: number; // 時間単位
  }> {
    const allThreads = await this.threadRepository.findByBoardId(''); // すべてのスレッド
    const now = new Date();

    const activeThreads = allThreads.filter((t) => !t.isArchived);
    let expiringIn24Hours = 0;
    let expiringIn6Hours = 0;
    let expired = 0;
    let totalLifetimeHours = 0;

    for (const thread of activeThreads) {
      if (thread.expiresAt) {
        const remainingMs = thread.expiresAt.getTime() - now.getTime();
        const remainingHours = remainingMs / (1000 * 60 * 60);

        if (remainingHours <= 0) {
          expired++;
        } else if (remainingHours <= 6) {
          expiringIn6Hours++;
        } else if (remainingHours <= 24) {
          expiringIn24Hours++;
        }

        // 寿命計算（作成から期限まで）
        const lifetimeMs = thread.expiresAt.getTime() - thread.createdAt.getTime();
        totalLifetimeHours += lifetimeMs / (1000 * 60 * 60);
      }
    }

    const averageLifetime =
      activeThreads.length > 0 ? totalLifetimeHours / activeThreads.length : 0;

    return {
      totalActiveThreads: activeThreads.length,
      expiringIn24Hours,
      expiringIn6Hours,
      expired,
      averageLifetime,
    };
  }

  private groupThreadsByBoard(threads: BoardThread[]): Map<string, BoardThread[]> {
    const groups = new Map<string, BoardThread[]>();

    for (const thread of threads) {
      if (!groups.has(thread.boardId)) {
        groups.set(thread.boardId, []);
      }
      groups.get(thread.boardId)!.push(thread);
    }

    return groups;
  }
}
