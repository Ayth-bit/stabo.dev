// components/Hero.tsx
import React from 'react';

const Hero = () => {
  return (
    <section className="bg-gray-900 text-white text-center py-20">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold mb-4">新しい位置情報共有体験</h2>
        <p className="text-lg mb-8">その場の「リアル」を共有しよう。</p>
        <a href="#demo" className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full">
          機能を見る
        </a>
      </div>
    </section>
  );
};

export default Hero;