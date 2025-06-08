// app/create-thread/layout.tsx
import React, { Suspense } from 'react';

export default function CreateThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Suspense で囲むことで、useSearchParams() が利用可能になるまで待機します。
    // fallback には、ローディング中に表示するUIを指定します。
    <Suspense fallback={<div>位置情報を準備中...</div>}>
      {children}
    </Suspense>
  );
}