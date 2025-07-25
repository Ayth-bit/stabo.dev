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
    <nav className="bg-white sticky top-0 z-50 shadow-md border-b border-yellow-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-6">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-3xl font-bold transition-all duration-200 hover:scale-105 md:text-2xl"
          style={{color: 'rgb(230, 168, 0)', letterSpacing: '0.05em'}}
        >
          stabo.dev
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link 
            href="/boards" 
            className="text-gray-600 hover:bg-yellow-50 px-6 py-3 rounded-lg transition-all duration-200 font-semibold hover:text-yellow-600 hover:shadow-sm"
          >
            掲示板一覧
          </Link>

          {user ? (
            <div className="relative">
              <button 
                type="button" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {user.user_metadata?.display_name || 'ユーザー'}
              </button>
              
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-3 bg-white rounded-xl min-w-[200px] z-10 py-3 shadow-xl border border-gray-100">
                  <Link
                    href="/mypage"
                    className="block w-full px-6 py-4 text-gray-700 hover:bg-yellow-50 transition-colors duration-200 no-underline font-medium hover:text-yellow-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    マイページ
                  </Link>
                  <div className="h-px bg-gray-200 mx-4 my-2" />
                  <button 
                    type="button" 
                    onClick={handleSignOut} 
                    className="block w-full px-6 py-4 text-red-600 hover:bg-red-50 transition-colors duration-200 text-left bg-transparent border-0 cursor-pointer font-medium hover:text-red-700"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/login" 
                className="text-gray-600 hover:bg-yellow-50 px-6 py-3 rounded-lg transition-all duration-200 font-semibold hover:text-yellow-600 hover:shadow-sm"
              >
                ログイン
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg no-underline"
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
