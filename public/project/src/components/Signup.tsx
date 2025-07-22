import React, { useState } from 'react';
import { Mail, ArrowRight, Shield, Zap } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <section className="py-20 px-4 bg-black relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-16 fade-in-up">
          <h2 className="font-pixel text-3xl md:text-4xl mb-6 glow-text text-white">
            &gt; JOIN_THE_MATRIX
          </h2>
          <p className="font-mono-retro text-xl text-green-400 tracking-wide mb-4">
            // ENTER THE QUANTUM WAITLIST
          </p>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Be the first to experience the future when we launch. Early adopters get exclusive access 
            to beta features and special cyber privileges.
          </p>
        </div>
        
        <div className="mb-12 fade-in-up">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@cyber.net"
                className="w-full px-6 py-4 bg-transparent border border-lime-400 rounded text-white placeholder-gray-500 font-mono-retro focus:outline-none focus:border-yellow-400 focus:shadow-lg transition-all duration-300"
                style={{ 
                  boxShadow: email ? '0 0 4px #C4FFB4' : 'none'
                }}
                required
              />
              <Mail size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              type="submit"
              className="cta-button px-8 py-4 font-pixel text-sm bg-transparent text-lime-400 hover:bg-lime-400 hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
              disabled={isSubscribed}
            >
              {isSubscribed ? (
                <>
                  <Shield size={16} />
                  ENCRYPTED
                </>
              ) : (
                <>
                  UPLOAD
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          
          {isSubscribed && (
            <div className="mt-6 glass-card p-4 rounded border border-green-400 max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-2 text-green-400 font-mono-retro text-sm">
                <Zap size={16} className="animate-pulse" />
                <span>TRANSMISSION SUCCESSFUL - WELCOME TO THE MATRIX</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="glass-card p-6 rounded">
            <div className="text-yellow-400 mb-3">
              <Shield size={32} className="mx-auto" />
            </div>
            <h3 className="font-pixel text-sm mb-2 text-white">SECURE</h3>
            <p className="text-gray-400 text-xs">
              Military-grade encryption protects your digital identity.
            </p>
          </div>
          
          <div className="glass-card p-6 rounded">
            <div className="text-lime-400 mb-3">
              <Zap size={32} className="mx-auto" />
            </div>
            <h3 className="font-pixel text-sm mb-2 text-white">INSTANT</h3>
            <p className="text-gray-400 text-xs">
              Quantum-speed notifications delivered to your neural link.
            </p>
          </div>
          
          <div className="glass-card p-6 rounded">
            <div className="text-cyan-400 mb-3">
              <Mail size={32} className="mx-auto" />
            </div>
            <h3 className="font-pixel text-sm mb-2 text-white">EXCLUSIVE</h3>
            <p className="text-gray-400 text-xs">
              Early access to features before they hit the mainframe.
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="font-mono-retro text-xs text-gray-500">
            // NO SPAM, NO BOTS, ONLY PURE DIGITAL CONSCIOUSNESS
          </p>
        </div>
      </div>
    </section>
  );
};

export default Signup;