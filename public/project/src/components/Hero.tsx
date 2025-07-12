import React from 'react';
import { Play, Zap, Globe } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-grainy hero-glow flex items-center justify-center overflow-hidden">
      {/* Ghost Logo Repetition */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="grid grid-cols-3 h-full gap-8 p-8">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i} 
              className="flex items-center justify-center"
              style={{ transform: `rotate(${Math.random() * 4 - 2}deg)` }}
            >
              <Zap size={120} className="text-white" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-8 float-animation">
          <Zap size={120} className="mx-auto mb-6 text-yellow-400 glow-text" />
        </div>
        
        <h1 className="font-pixel text-4xl md:text-6xl lg:text-7xl mb-6 glow-text">
          <span className="text-yellow-400">STABO</span>
          <span className="text-lime-400 ml-4">BETA</span>
        </h1>
        
        <p className="font-mono-retro text-xl md:text-2xl mb-8 text-green-400 tracking-wide">
          &gt; ENTER THE Y2K DIGITAL EXPERIENCE _
        </p>
        
        <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed text-gray-300">
          Experience the future of digital interaction with our retro-cyber platform. 
          Combining nostalgic aesthetics with cutting-edge technology.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="cta-button px-8 py-4 font-pixel text-sm bg-transparent text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300">
            LAUNCH APP
          </button>
          
          <button className="cta-button px-8 py-4 font-pixel text-sm bg-transparent text-lime-400 hover:bg-lime-400 hover:text-black transition-all duration-300">
            CONNECT WALLET
          </button>
        </div>
        
        <div className="mt-16 flex justify-center items-center gap-8 text-sm font-mono-retro text-gray-400">
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <span>DECENTRALIZED</span>
          </div>
          <div className="flex items-center gap-2">
            <Play size={16} />
            <span>INTERACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} />
            <span>LIGHTNING FAST</span>
          </div>
        </div>
      </div>
      
      {/* Scan Lines Effect */}
      <div className="absolute inset-0 scan-lines pointer-events-none"></div>
    </section>
  );
};

export default Hero;