"use client";

import { motion } from "framer-motion";

const skills = [
    {
        category: "Programming Languages",
        technologies: ["Python", "TypeScript", "JavaScript", "Go", "Swift", "SQL", "Java", "HTML5/CSS3"],
    },
    {
        category: "Frontend",
        technologies: ["React", "Next.js", "TailwindCSS", "iOS Development", "UI/UX Design", "TypeScript"],
    },
    {
        category: "Backend",
        technologies: ["Node.js", "PostgreSQL", "REST APIs", "API Design"],
    },
    {
        category: "Cloud & DevOps",
        technologies: ["AWS", "Azure", "Cloud Governance", "FinOps", "Docker", "Linux"],
    },
    {
        category: "Data & Analytics",
        technologies: [
            "Snowflake SQL",
            "Redshift SQL",
            "Database Management and Optimisation",
            "Data Analysis",
            "Machine Learning",
            "PowerBI",
            "Excel",
            "MongoDB",
            "Jupyter",
        ],
    },
    {
        category: "AI & LLMs",
        technologies: ["Prompt Engineering", "Agentic AI", "LLM Systems", "AI Architecture", "Generative AI"],
    },
    {
        category: "Security & Privacy",
        technologies: ["Risk Assessment", "Data Privacy", "Security Analysis", "Governance", "Data Policy", "Compliance", "Threat Modeling"],
    },
    {
        category: "Tools & Platforms",
        technologies: ["Git", "Microsoft Office", "Teams"],
    },
    {
        category: "Soft Skills",
        technologies: ["Agile/Scrum", "Project Management", "Time Management", "Communication", "Collaboration", "Problem Solving", "Mentoring", "Research"],
    },
];

export default function Skills() {
    return (
        <section
            id="skills"
            className="py-20 px-8"
        >
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
                            <h3 className="text-xl font-semibold text-textLight mb-4">{skillGroup.category}</h3>
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
