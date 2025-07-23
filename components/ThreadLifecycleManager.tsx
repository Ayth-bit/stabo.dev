'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ThreadLifecycleManagerProps {
  threadId?: string;
  expiresAt?: string;
  isArchived?: boolean;
  restoreCount?: number;
  onRestore?: (threadId: string) => void;
  className?: string;
}

interface ThreadStatus {
  remainingHours: number;
  fadeFactor: number;
  isExpiring: boolean;
  isExpired: boolean;
  canRestore: boolean;
}

const ThreadLifecycleManager: React.FC<ThreadLifecycleManagerProps> = ({
  threadId,
  expiresAt,
  isArchived = false,
  restoreCount = 0,
  onRestore,
  className = ''
}) => {
  const [status, setStatus] = useState<ThreadStatus>({
    remainingHours: 0,
    fadeFactor: 1,
    isExpiring: false,
    isExpired: false,
    canRestore: false
  });
  const [isRestoring, setIsRestoring] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!expiresAt) return;

    const updateStatus = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const remainingMs = expiry.getTime() - now.getTime();
      const remainingHours = Math.max(0, remainingMs / (1000 * 60 * 60));

      const isExpired = remainingHours <= 0;
      const isExpiring = remainingHours <= 6 && remainingHours > 0;
      const fadeFactor = isExpiring ? Math.max(0.3, remainingHours / 6) : 1;
      const canRestore = isArchived && restoreCount === 0;

      setStatus({
        remainingHours,
        fadeFactor,
        isExpiring,
        isExpired,
        canRestore
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // 1分ごとに更新

    return () => clearInterval(interval);
  }, [expiresAt, isArchived, restoreCount]);

  const handleRestore = async () => {
    if (!threadId || !status.canRestore) return;

    setIsRestoring(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/threads/lifecycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restore_thread',
          threadId,
          userId: user.user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore thread');
      }

      await response.json();
      if (onRestore) {
        onRestore(threadId);
      }
      
      // 成功通知
      alert('スレッドが復元されました！72時間後に再度期限切れになります。');
    } catch (error) {
      console.error('Thread restore error:', error);
      alert(error instanceof Error ? error.message : 'スレッドの復元に失敗しました');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatRemainingTime = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}分`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}時間${Math.floor((hours % 1) * 60)}分`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return `${days}日${remainingHours}時間`;
    }
  };

  if (isArchived) {
    return (
      <div className={`p-2 rounded-md bg-gray-100 border border-gray-300 text-sm ${className}`}>
        <div className="inline-block px-2 py-0.5 bg-gray-500 text-white rounded text-xs mr-2">
          アーカイブ済み
        </div>
        {status.canRestore && (
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="px-3 py-1 bg-blue-500 text-white border-none rounded text-xs cursor-pointer ml-2 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRestoring ? '復元中...' : 'スレッドを復元'}
          </button>
        )}
        {restoreCount > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            このスレッドは既に復元されています
          </div>
        )}
      </div>
    );
  }

  if (status.isExpired) {
    return (
      <div className={`p-2 rounded-md bg-red-50 border border-red-200 text-sm opacity-70 ${className}`}>
        <div className="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-xs mr-2">
          期限切れ
        </div>
        <span className="text-red-600">
          このスレッドは期限切れです
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`p-2 rounded-md text-sm transition-opacity duration-300 ease-in-out ${
        status.isExpiring 
          ? 'bg-orange-50 border border-orange-200' 
          : 'bg-blue-50 border border-blue-200'
      } ${className}`}
      style={{ opacity: status.fadeFactor }}
    >
      <div className={`inline-block px-2 py-0.5 text-white rounded text-xs mr-2 ${
        status.isExpiring ? 'bg-amber-500' : 'bg-green-500'
      }`}>
        {status.isExpiring ? '期限間近' : 'アクティブ'}
      </div>
      <span className={`font-medium ${
        status.isExpiring ? 'text-amber-600' : 'text-blue-600'
      }`}>
        残り {formatRemainingTime(status.remainingHours)}
      </span>
    </div>
  );
};

export default ThreadLifecycleManager;