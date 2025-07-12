import React from 'react';
import { Calendar, Cpu, Zap, Globe, Brain, Rocket } from 'lucide-react';

const Roadmap = () => {
  const phases = [
    {
      phase: "ALPHA",
      date: "Q1 2024",
      title: "GENESIS PROTOCOL",
      description: "Initial quantum framework deployment and neural interface calibration.",
      icon: Cpu,
      color: "border-yellow-400 text-yellow-400"
    },
    {
      phase: "BETA", 
      date: "Q2 2024",
      title: "CYBER MESH",
      description: "Multi-dimensional asset bridging and cross-reality synchronization.",
      icon: Globe,
      color: "border-lime-400 text-lime-400"
    },
    {
      phase: "GAMMA",
      date: "Q3 2024", 
      title: "NEURAL LINK",
      description: "Direct consciousness integration with blockchain infrastructure.",
      icon: Brain,
      color: "border-cyan-400 text-cyan-400"
    },
    {
      phase: "OMEGA",
      date: "Q4 2024",
      title: "SINGULARITY",
      description: "Full reality merger and infinite possibility matrix activation.",
      icon: Rocket,
      color: "border-purple-400 text-purple-400"
    }
  ];

  return (
    <section className="py-20 px-4 noise-texture relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="font-pixel text-3xl md:text-4xl mb-6 glow-text text-white">
            &gt; TIMELINE.JSON
          </h2>
          <p className="font-mono-retro text-xl text-green-400 tracking-wide">
            // LOADING FUTURE PROTOCOLS...
          </p>
        </div>
        
        <div className="relative">
          {/* Central Timeline */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-yellow-400 via-lime-400 to-purple-400 opacity-30"></div>
          
          <div className="space-y-16">
            {phases.map((phase, index) => (
              <div 
                key={phase.phase}
                className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} fade-in-up`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="glass-card p-6 rounded-lg border-2 border-dashed hover:border-solid transition-all duration-300">
                    <div className={`font-mono-retro text-sm mb-2 ${phase.color}`}>
                      -- PHASE {phase.phase}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="font-mono-retro text-gray-400 text-sm">
                        {phase.date}
                      </span>
                    </div>
                    
                    <h3 className="font-pixel text-lg mb-3 text-white">
                      {phase.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                </div>
                
                {/* Central Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full border-2 ${phase.color} bg-black flex items-center justify-center`}>
                    <phase.icon size={24} />
                  </div>
                </div>
                
                <div className="w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 glass-card px-8 py-4 rounded-full border border-lime-400">
            <Zap size={20} className="text-lime-400 animate-pulse" />
            <span className="font-mono-retro text-lime-400">
              CURRENTLY IN BETA PHASE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;