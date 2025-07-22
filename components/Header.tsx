// components/Header.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const Header = () => {
  const router = useRouter();

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Stabo.world</h1>
        <nav>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            アプリへ戻る
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;