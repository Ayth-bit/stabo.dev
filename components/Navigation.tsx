'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useState } from 'react';

export function Navigation() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          stabo.dev
        </Link>

        <div className="nav-links">
          <Link href="/boards" className="nav-link">
            掲示板一覧
          </Link>

          {user ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {user.user_metadata?.display_name || 'ユーザー'}
              </button>
              {isMenuOpen && (
                <div className="user-dropdown">
                  <Link 
                    href="/mypage" 
                    className="dropdown-item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    マイページ
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="dropdown-item logout-button"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link href="/auth/login" className="nav-link">
                ログイン
              </Link>
              <Link href="/auth/register" className="nav-button">
                新規登録
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .navigation {
          background: white;
          border-bottom: 1px solid #e9ecef;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
        }

        .nav-logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          text-decoration: none;
        }

        .nav-logo:hover {
          color: #667eea;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-link {
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: #333;
          background: #f8f9fa;
        }

        .nav-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .nav-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
        }

        .auth-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-menu {
          position: relative;
        }

        .user-button {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #333;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .user-button:hover {
          background: #e9ecef;
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          min-width: 150px;
          margin-top: 0.5rem;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          color: #333;
          text-decoration: none;
          border: none;
          background: none;
          text-align: left;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: #f8f9fa;
        }

        .logout-button {
          border-top: 1px solid #dee2e6;
          color: #dc3545;
        }

        .logout-button:hover {
          background: #f8d7da;
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0.75rem;
          }
          
          .nav-logo {
            font-size: 1.25rem;
          }
          
          .auth-links {
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .nav-link, .nav-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </nav>
  );
}