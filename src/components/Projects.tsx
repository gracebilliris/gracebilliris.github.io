'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const projects = [
  {
    title: 'Copyright Health Checker (CHC)',
    organization: 'UTS',
    role: 'Honours Research Project',
    description: `Generative Artificial Intelligence (GAI) marks a transformative shift in creative landscapes, blurring the lines between human and machine-generated content. This capstone project developed the Copyright Health Checker (CHC) tool to identify and assess GAI system's copyright concerns through analysis of regulations, legislations, and legal cases spanning Australia, the UK, the US, and Europe.`,
    longDescription: `The CHC tool has been developed based on the analysis of selected, publicly available copyright cases and academic literature. While it serves as an initial health checker for GAI system developers, it provides important insights for responsible GAI development and policy formulation in the digital era.`,
    technologies: ['Research', 'Legal Analysis', 'GAI', 'Copyright Law'],
    links: {
      acm: 'https://dl.acm.org/doi/10.1145/3703459',
      conference: 'https://aisel.aisnet.org/acis2024/17/'
    },
    image: 'https://www.uts.edu.au/sites/default/files/2020-06/UTS-logo-2.png'
  },
  {
    title: 'TextInsights',
    organization: 'UTS',
    role: 'Software Engineer',
    description: 'A web application that uses Natural Language Processing to examine and provide insights into text, developed as part of the Software Innovation Studio subject.',
    technologies: ['NLP', 'Web Development', 'Text Analysis'],
    image: 'https://www.uts.edu.au/sites/default/files/2020-06/UTS-logo-2.png'
  },
  {
    title: 'Quality Assurance & Feature Development',
    organization: 'InfoPoint',
    role: 'Software Engineer',
    description: 'Implemented comprehensive testing suite including Component, End-to-End, and Integration tests. Developed new Registers feature with Excel integration and enhanced search functionality.',
    technologies: ['Testing', 'QA', 'Feature Development', 'Excel Integration'],
    image: 'https://infopoint.com.au/wp-content/themes/infopoint2016/images/logo.png'
  },
  {
    title: 'Machine Learning Algorithm Development',
    organization: 'AgriWebb',
    role: 'Software Engineer (Intern)',
    description: 'Developed Python machine learning algorithms and performed complex data querying and analysis using Snowflake SQL Data Warehouse.',
    technologies: ['Python', 'Machine Learning', 'Snowflake SQL', 'Data Analysis'],
    image: 'https://media.licdn.com/dms/image/C4E0BAQEf07ngE3BhRA/company-logo_200_200/0/1630603836208/agriwebb_logo?e=2147483647&v=beta&t=4K0avvHK0u4MUJkGqjXt4K1QHlJIc2tuBRYEVaRZuEQ'
  },
  {
    title: 'ShuffleCook',
    organization: 'UTS Apple Foundation Program',
    role: 'iOS Developer',
    description: 'Developed an iOS mobile application that helps users decide what to cook by providing random recipe suggestions and generating shopping lists for ingredients.',
    technologies: ['iOS', 'Swift', 'UI/UX Design', 'Mobile Development'],
    image: 'https://developer.apple.com/assets/elements/icons/develop-in-swift/develop-in-swift-96x96_2x.png',
    github: 'https://github.com/gracebilliris/ShuffleCook'
  },
  {
    title: 'GroupBuddies',
    organization: 'UTS',
    role: 'Software Engineer',
    description: 'Developed a web application for intelligent student-group management, featuring smart group sorting based on complementary student profiles and manual management options for students and tutors.',
    technologies: ['Web Development', 'Algorithm Design', 'User Management'],
    image: 'https://www.uts.edu.au/sites/default/files/2020-06/UTS-logo-2.png',
    github: 'https://github.com/nicholasfinos/GroupBuddies'
  },
  {
    title: 'eRestaurant',
    organization: 'UTS',
    role: 'Software Engineer',
    description: 'Created a web application for Le Bistrot D\'Andre restaurant, implementing table booking and food ordering functionality with menu management features.',
    technologies: ['Web Development', 'Booking System', 'Restaurant Management'],
    image: 'https://www.uts.edu.au/sites/default/files/2020-06/UTS-logo-2.png',
    github: 'https://github.com/gracebilliris/eRestaurant'
  }
];

export default function Projects() {
  return (
    <section id="projects" className="py-20 px-8 bg-primary/50">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-textLight mb-12"
        >
          Featured Projects
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-primary/30 rounded-lg overflow-hidden"
            >
              <div className="h-40 bg-primary/60 relative">
                <Image
                  src={project.image}
                  alt={`${project.organization} logo`}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-textLight">
                    {project.title}
                  </h3>
                </div>
                <div className="mb-2">
                  <p className="text-secondary">{project.organization}</p>
                  <p className="text-text text-sm">{project.role}</p>
                </div>
                <p className="text-text mb-4">{project.description}</p>
                {project.longDescription && (
                  <p className="text-text mb-4">{project.longDescription}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm bg-secondary/10 text-secondary rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                {project.links && (
                  <div className="flex gap-4">
                    {project.links.acm && (
                      <a
                        href={project.links.acm}
                        className="text-secondary hover:text-secondary/80 transition-colors text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ACM Publication →
                      </a>
                    )}
                    {project.links.conference && (
                      <a
                        href={project.links.conference}
                        className="text-secondary hover:text-secondary/80 transition-colors text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Conference Paper →
                      </a>
                    )}
                  </div>
                )}
                {project.github && (
                  <div className="mt-4">
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.563 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      View on GitHub
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}