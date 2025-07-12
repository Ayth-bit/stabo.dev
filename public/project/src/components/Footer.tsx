import React from 'react';
import { Github, Twitter, Globe, Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={32} className="text-yellow-400" />
              <span className="font-pixel text-xl text-white">STABO</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Bridging the gap between Y2K nostalgia and quantum future. 
              Where retro meets revolutionary in perfect digital harmony.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-lime-400 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-lime-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-lime-400 transition-colors">
                <Globe size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-pixel text-sm text-white mb-4">&gt; PROTOCOLS</h4>
            <ul className="space-y-2 text-sm text-gray-400 font-mono-retro">
              <li><a href="#" className="hover:text-lime-400 transition-colors">QUANTUM_BRIDGE</a></li>
              <li><a href="#" className="hover:text-lime-400 transition-colors">NEURAL_MESH</a></li>
              <li><a href="#" className="hover:text-lime-400 transition-colors">CYBER_VAULT</a></li>
              <li><a href="#" className="hover:text-lime-400 transition-colors">MATRIX_API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-pixel text-sm text-white mb-4">&gt; SUPPORT</h4>
            <ul className="space-y-2 text-sm text-gray-400 font-mono-retro">
              <li><a href="#" className="hover:text-lime-400 transition-colors">DOCUMENTATION</a></li>
              <li><a href="#" className="hover:text-lime-400 transition-colors">HELP_CENTER</a></li>
              <li><a href="#" className="hover:text-lime-400 transition-colors">COMMUNITY</a></li>
              <li><a href="#" className="hover:text-lime-400 transition-colors">STATUS_PAGE</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="font-mono-retro text-xs text-gray-500 mb-4 md:mb-0">
            © 2024 STABO BETA. ALL RIGHTS RESERVED IN THE DIGITAL DIMENSION.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono-retro text-gray-500">
            <span>PRIVACY_POLICY</span>
            <span>|</span>
            <span>TERMS_OF_SERVICE</span>
            <span>|</span>
            <span>QUANTUM_LICENSE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;