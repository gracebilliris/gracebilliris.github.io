'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="h-screen flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-textLight mb-4">
          Grace Billiris
        </h1>
        <h2 className="text-2xl md:text-4xl text-secondary mb-6">
          Software Engineer & PhD Candidate
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl">
          I am a software engineer working in industry and a PhD candidate in Software Engineering at the University of Technology Sydney. I am motivated by solving complex problems and understanding the systems behind them, with research focused on data privacy risks in agentic AI systems.
        </p>
        <div className="flex gap-4">
          <a
            href="#resume"
            className="inline-block bg-secondary text-primary px-8 py-3 rounded-lg font-medium hover:bg-opacity-80 transition-colors"
          >
            Resume
          </a>
          <a
            href="#projects"
            className="inline-block border-2 border-secondary text-secondary px-8 py-3 rounded-lg font-medium hover:bg-secondary/10 transition-colors"
          >
            Projects
          </a>
        </div>
      </motion.div>
    </section>
  );
}