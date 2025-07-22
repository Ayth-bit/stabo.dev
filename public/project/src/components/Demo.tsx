import React from 'react';
import { Play, Monitor, Wifi } from 'lucide-react';

const Demo = () => {
  return (
    <section className="py-20 px-4 bg-black relative">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-16 fade-in-up">
          <h2 className="font-pixel text-3xl md:text-4xl mb-6 glow-text text-white">
            &gt; LIVE_DEMO.MP4
          </h2>
          <p className="font-mono-retro text-xl text-green-400 tracking-wide">
            // STREAMING QUANTUM INTERFACE...
          </p>
        </div>
        
        <div className="relative mb-12 fade-in-up">
          <div className="glass-card p-2 rounded-lg neon-border">
            <div className="bg-black rounded aspect-video flex items-center justify-center rgb-split relative overflow-hidden">
              {/* Simulated Video Preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/30"></div>
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-8 h-full gap-1">
                  {[...Array(32)].map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-green-400 animate-pulse"
                      style={{ 
                        animationDelay: `${i * 0.1}s`,
                        opacity: Math.random() * 0.5
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="bg-black/80 backdrop-blur-sm rounded-full p-6 mb-4 border border-lime-400">
                  <Play size={48} className="text-lime-400 ml-1" />
                </div>
                <p className="font-mono-retro text-lime-400 text-sm">
                  CLICK TO EXPERIENCE
                </p>
              </div>
              
              {/* TV Static Overlay */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full bg-repeat" 
                     style={{
                       backgroundImage: `url("data:image/svg+xml,%3Csvg width='2' height='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`,
                       backgroundSize: '2px 2px'
                     }}>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center items-center gap-6 text-sm font-mono-retro text-gray-400">
            <div className="flex items-center gap-2">
              <Monitor size={16} />
              <span>1080P HD</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={16} />
              <span>LIVE STREAM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>RECORDING</span>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="glass-card p-6 rounded">
            <div className="font-mono-retro text-yellow-400 text-sm mb-2">
              &gt; REAL_TIME_FEED
            </div>
            <p className="text-gray-300 text-sm">
              Watch quantum transactions flow through the cyber-mesh in real-time.
            </p>
          </div>
          
          <div className="glass-card p-6 rounded">
            <div className="font-mono-retro text-lime-400 text-sm mb-2">
              &gt; NEURAL_PATTERNS
            </div>
            <p className="text-gray-300 text-sm">
              Visualize thought-to-blockchain conversion patterns in 4D space.
            </p>
          </div>
          
          <div className="glass-card p-6 rounded">
            <div className="font-mono-retro text-cyan-400 text-sm mb-2">
              &gt; MATRIX_OVERLAY
            </div>
            <p className="text-gray-300 text-sm">
              Experience the digital rain of pure information cascading down.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo;