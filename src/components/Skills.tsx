'use client';

import { motion } from 'framer-motion';

const skills = [
  {
    category: 'Frontend',
    technologies: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'HTML5/CSS3']
  },
  {
    category: 'Backend',
    technologies: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'REST APIs']
  },
  {
    category: 'Tools & Others',
    technologies: ['Git', 'Docker', 'AWS', 'Linux', 'Agile/Scrum']
  }
];

export default function Skills() {
  return (
    <section id="skills" className="py-20 px-8">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-textLight mb-12"
        >
          Skills & Technologies
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skillGroup, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-primary/30 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold text-textLight mb-4">
                {skillGroup.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillGroup.technologies.map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-sm bg-secondary/10 text-secondary rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}