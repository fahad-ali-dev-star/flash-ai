
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-gray-100">
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-400 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold tracking-tight">Flash<span className="text-blue-500">Edit</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Studio</a>
            <a href="#" className="hover:text-white transition-colors">Showcase</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>
          <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
            Get Started
          </button>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold mb-4">FlashEdit</h3>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Experience the next generation of creative editing. Powered by Google's Gemini models, we bridge the gap between imagination and reality with lightning speed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Tools</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>AI Upscaling</li>
              <li>Neural Filters</li>
              <li>Style Transfer</li>
              <li>Smart Eraser</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <i className="fab fa-twitter text-gray-400 hover:text-white cursor-pointer transition-colors"></i>
              <i className="fab fa-discord text-gray-400 hover:text-white cursor-pointer transition-colors"></i>
              <i className="fab fa-github text-gray-400 hover:text-white cursor-pointer transition-colors"></i>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-500">
          &copy; 2024 FlashEdit Studio. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
