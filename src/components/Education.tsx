"use client";

import { motion } from "framer-motion";

const education = [
    {
        school: "University of Technology Sydney",
        degree: "Doctor of Philosophy",
        period: "2025 - 2027",
        location: "Australia",
        achievements: [],
    },
    {
        school: "University of Technology Sydney",
        degree: "Bachelor's of Engineering, majoring in Software (Honours)",
        secondDegree: "Bachelor's of Science, majoring in Mathematics",
        period: "2020 - 2023",
        location: "Australia",
        achievements: [
            "Achieving a 6.57/7 GPA (High Distinction Average)",
            "Achieved High Distinction in Programming Fundamentals, Database Fundamentals",
            "Achieved High Distinction in Introduction to Data Analytics, Data Structures and Algorithms",
            "Achieved High Distinction in Business Requirements Modelling",
        ],
    },
    {
        school: "Riverside Girls High School",
        degree: "NSW Higher School Certificate",
        period: "2014 - 2019",
        location: "Australia",
        achievements: ["Years 7-10 Student Representative Council Member"],
    },
];

const skills = {
    technical: ["C++", "C#", "Java", "JavaScript", "TypeScript", "HTML", "Python"],
    applications: ["Visual Studio Code", "JetBrains Rider", "PostMan", "MongoDB", "GrayLog", "Microsoft Office Suite", "Adobe Creative Suite"],
    softSkills: ["Organisation and Time Management", "Teamwork & Collaboration", "Communication"],
    languages: ["English (native)", "Greek (fluent)"],
};

export default function Education() {
    return (
        <section
            id="education"
            className="py-20 px-8"
        >
            <div className="max-w-4xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-textLight mb-12"
                >
                    Education & Skills
                </motion.h2>

                {/* Education */}
                <div className="space-y-8 mb-16">
                    {education.map((edu, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-primary/30 p-6 rounded-lg"
                        >
                            <h3 className="text-xl font-semibold text-textLight mb-2">{edu.school}</h3>
                            <p className="text-secondary mb-1">{edu.degree}</p>
                            {edu.secondDegree && <p className="text-secondary mb-1">{edu.secondDegree}</p>}
                            <p className="text-text mb-2">
                                {edu.period} • {edu.location}
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                {edu.achievements.map((achievement, i) => (
                                    <li
                                        key={i}
                                        className="text-text"
                                    >
                                        {achievement}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Skills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div className="bg-primary/30 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-textLight mb-4">Programming Languages</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.technical.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-secondary/10 text-secondary rounded-full"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary/30 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-textLight mb-4">Applications</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.applications.map((app, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-secondary/10 text-secondary rounded-full"
                                >
                                    {app}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary/30 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-textLight mb-4">Professional Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.softSkills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-secondary/10 text-secondary rounded-full"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary/30 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-textLight mb-4">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.languages.map((lang, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-secondary/10 text-secondary rounded-full"
                                >
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
