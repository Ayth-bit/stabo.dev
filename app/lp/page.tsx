// app/lp/page.tsx
'use client';

import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Demo from '@/components/Demo';
import Footer from '@/components/Footer';

const LandingPage = () => {
  return (
    <div className="bg-white">
      <Header />
      <main>
        <Hero />
        <Demo />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;