import React from 'react';
import { Shield, Zap, Globe, Cpu, Gamepad2, Radio } from 'lucide-react';

const Features = () => {
  const features = [
    {
      id: "01",
      icon: Shield,
      title: "QUANTUM SECURITY",
      description: "Military-grade encryption meets Y2K nostalgia. Your data travels through time-locked corridors.",
      color: "text-yellow-400"
    },
    {
      id: "02", 
      icon: Zap,
      title: "NEURAL INTERFACE",
      description: "Direct brain-to-blockchain connection. Think it, mint it, trade it in milliseconds.",
      color: "text-lime-400"
    },
    {
      id: "03",
      icon: Globe,
      title: "CYBER PROTOCOLS",
      description: "Cross-dimensional asset management. Your NFTs exist in multiple realities simultaneously.",
      color: "text-cyan-400"
    }
  ];

  return (
    <section className="py-20 px-4 noise-texture relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="font-pixel text-3xl md:text-4xl mb-6 glow-text text-white">
            &gt; CORE_FEATURES.EXE
          </h2>
          <p className="font-mono-retro text-xl text-green-400 tracking-wide">
            // INITIALIZING QUANTUM PROTOCOLS...
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.id}
              className="glass-card p-8 rounded-lg hover:border-lime-400 transition-all duration-300 fade-in-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="font-mono-retro text-gray-500 text-sm mb-4 tracking-wider">
                -- FEATURE {feature.id}
              </div>
              
              <div className={`${feature.color} mb-6`}>
                <feature.icon size={48} className="glow-text" />
              </div>
              
              <h3 className="font-pixel text-lg mb-4 text-white">
                {feature.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed text-sm">
                {feature.description}
              </p>
              
              <div className="mt-6 flex items-center gap-2 text-xs font-mono-retro text-gray-500">
                <Cpu size={12} />
                <span>STATUS: ONLINE</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 glass-card px-6 py-3 rounded-full">
            <Radio size={16} className="text-green-400 animate-pulse" />
            <span className="font-mono-retro text-sm text-green-400">
              SYSTEM_STATUS: OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;