import type React from 'react';
import { Suspense } from 'react';

export default function CreateThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div>位置情報を準備中...</div>}>{children}</Suspense>;
}
