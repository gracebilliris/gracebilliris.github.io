'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-colors duration-300 ${
        isScrolled ? 'bg-[#0a192f]/95 shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="#" className="text-textLight font-bold text-xl">
              Grace Billiris
            </a>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-text hover:text-textLight transition-colors">
              ABOUT ME
            </a>
            <a href="#experience" className="text-text hover:text-textLight transition-colors">
              RESUME
            </a>
            <a href="#projects" className="text-text hover:text-textLight transition-colors">
              PROJECTS
            </a>
            <a href="#contact" className="text-text hover:text-textLight transition-colors">
              CONTACT
            </a>
          </div>
          <div className="flex md:hidden items-center">
            {/* Mobile menu button */}
            <button 
              className="text-text hover:text-textLight" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-primary/95 p-4">
          <div className="flex flex-col space-y-4">
            <a href="#about" className="text-text hover:text-textLight transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              ABOUT ME
            </a>
            <a href="#experience" className="text-text hover:text-textLight transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              RESUME
            </a>
            <a href="#projects" className="text-text hover:text-textLight transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              PROJECTS
            </a>
            <a href="#contact" className="text-text hover:text-textLight transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              CONTACT
            </a>
          </div>
        </div>
      )}

      {/* Social Links */}
      <div className="fixed right-12 bottom-0 hidden lg:block z-50">
        <div className="flex flex-col items-center space-y-6">
          <a
            href="https://github.com/gracebilliris"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8892b0] hover:text-[#64ffda] transition-colors"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a
            href="mailto:grace.billiris@gmail.com"
            className="text-[#8892b0] hover:text-[#64ffda] transition-colors"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H1.5C.65 21 0 20.35 0 19.5v-15c0-.85.65-1.5 1.5-1.5h21c.85 0 1.5.65 1.5 1.5zm-1.5 0L12 13.5 1.5 4.5h21zM22.5 19.5V6.35L12 15.35 1.5 6.35V19.5h21z"/>
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/gracebilliris"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8892b0] hover:text-[#64ffda] transition-colors"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <div className="h-24 w-px bg-[#8892b0]/20 mt-4"></div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;