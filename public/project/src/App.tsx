import React, { useEffect } from 'react';
import Ticker from './components/Ticker';
import Hero from './components/Hero';
import Features from './components/Features';
import Demo from './components/Demo';
import Roadmap from './components/Roadmap';
import Signup from './components/Signup';
import Footer from './components/Footer';
import { useScrollAnimation } from './hooks/useScrollAnimation';

function App() {
  useScrollAnimation();

  useEffect(() => {
    // Add loading animation
    document.body.classList.add('loaded');
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Ticker />
      <Hero />
      <Features />
      <Demo />
      <Roadmap />
      <Signup />
      <Footer />
    </div>
  );
}

export default App;