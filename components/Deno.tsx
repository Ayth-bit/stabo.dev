// components/Demo.tsx
'use client';
import React from 'react';
import { Play, Monitor, Wifi } from 'lucide-react';

const Demo = () => {
  return (
    <section id="demo" className="py-20 bg-gray-100">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">主な機能</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-lg shadow-md">
            <div className="flex justify-center mb-4">
              <Play className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">リアルタイム共有</h3>
            <p>その場の出来事をリアルタイムに共有できます。</p>
          </div>
          <div className="p-8 bg-white rounded-lg shadow-md">
            <div className="flex justify-center mb-4">
              <Monitor className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">マルチデバイス対応</h3>
            <p>スマートフォン、PCなど、どんなデバイスからでも快適に利用できます。</p>
          </div>
          <div className="p-8 bg-white rounded-lg shadow-md">
            <div className="flex justify-center mb-4">
              <Wifi className="w-16 h-16 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">位置情報ベース</h3>
            <p>現在地から1km圏内のスレッドにのみ書き込める、新しい体験。</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo;