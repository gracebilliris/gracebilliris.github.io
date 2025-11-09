"use client";

import { motion } from "framer-motion";

export default function About() {
    return (
        <section
            id="about"
            className="py-20 px-8"
        >
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-textLight mb-8">About Me</h2>
                <div className="prose prose-invert max-w-none">
                    <p className="text-lg mb-4">
                        I am a software engineer working in industry and a PhD candidate in Software Engineering at the University of Technology Sydney. I have always been motivated by solving complex problems and understanding the systems behind them. What began as an early curiosity for technical challenges has grown into a focus on addressing real-world problems in software engineering and artificial intelligence.
                    </p>
                    <p className="text-lg mb-4">
                        My research focuses on data privacy risks in agentic AI systems that process personally identifiable information. Previously, my honours research explored the intersection of generative AI and copyright law, resulting in the development of the Copyright Health Checker (CHC) tool and a publication in the ACM Digital Library.
                    </p>
                    <p className="text-lg mb-4">
                        Alongside my research, I contribute to software engineering education through teaching and mentoring roles at the University of Technology Sydney. I am passionate about building trustworthy technology and collaborating across teams.
                    </p>
                    <p className="text-lg">
                        I value continuous learning and see each opportunity—whether through research, industry work, or collaboration—as a way to deepen my understanding of complex systems and grow as an engineer.
                    </p>
                </div>
            </motion.div>
        </section>
    );
}
