'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

export function Navigation() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-2xl font-bold text-primary hover:text-accent transition-colors duration-200 md:text-xl"
        >
          stabo.dev
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Link 
            href="/boards" 
            className="text-secondary hover:text-primary hover:bg-gray-50 px-4 py-2 rounded-lg transition-all duration-200"
          >
            掲示板一覧
          </Link>

          {user ? (
            <div className="relative">
              <button 
                type="button" 
                className="btn-secondary text-sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {user.user_metadata?.display_name || 'ユーザー'}
              </button>
              
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 card shadow-lg min-w-[150px] z-10">
                  <Link
                    href="/mypage"
                    className="block w-full px-4 py-3 text-primary text-sm hover:bg-gray-50 transition-colors duration-200 no-underline"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    マイページ
                  </Link>
                  <button 
                    type="button" 
                    onClick={handleSignOut} 
                    className="block w-full px-4 py-3 text-red-600 text-sm hover:bg-red-50 transition-colors duration-200 border-t border-gray-200 text-left bg-transparent border-0 cursor-pointer"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 md:flex-col md:gap-1">
              <Link 
                href="/auth/login" 
                className="text-secondary hover:text-primary hover:bg-gray-50 px-4 py-2 rounded-lg transition-all duration-200 md:px-3 md:py-1.5 md:text-sm"
              >
                ログイン
              </Link>
              <Link 
                href="/auth/register" 
                className="btn-primary text-sm no-underline md:px-3 md:py-1.5"
              >
                新規登録
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
