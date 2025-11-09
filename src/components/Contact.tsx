'use client';

import { motion } from 'framer-motion';

export default function Contact() {
  return (
    <section id="contact" className="py-20 px-8 bg-primary/50">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-textLight mb-8"
        >
          Get In Touch
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <a
            href="mailto:grace.v.billiris@student.uts.edu.au"
            className="inline-block bg-secondary text-primary px-8 py-3 rounded-lg font-medium hover:bg-opacity-80 transition-colors"
          >
            Send Email
          </a>
        </motion.div>
      </div>
    </section>
  );
}