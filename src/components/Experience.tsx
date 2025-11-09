"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const experiences = [
    {
        title: "Casual Academic",
        company: "University of Technology Sydney",
        period: "February 2023 - Present",
        description:
            "Performed activities such as leading tutorials, blended learning (online), and demonstrations, as well as marking, student consultations, and administrative duties.",
        logo: "https://www.uts.edu.au/sites/default/files/2020-06/UTS-logo-2.png",
    },
    {
        title: "Software Engineer",
        company: "Macquarie Group",
        period: "February 2024 - Present",
        description:
            "Performed activities related to AWS Cloud Security and FinOps, including supporting cloud operations, enhancing security practices, and contributing to cost optimisation initiatives.",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Macquarie_Group_logo.svg/2560px-Macquarie_Group_logo.svg.png",
    },
    {
        title: "Sales Consultant",
        company: "Tommy Hilfiger",
        period: "November 2019 - October 2025",
        description:
            "Completed various duties including customer service, register work, stock lifecycle, cleaning, and overseeing the daily store operations.",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Tommy_Hilfiger_logo.svg/1200px-Tommy_Hilfiger_logo.svg.png",
    },
    {
        title: "Faculty Assessment Partner",
        company: "University of Technology Sydney",
        period: "July 2023 - November 2023",
        description:
            "Faculty Assessment Partner at UTS, specialising in GenAl initiatives and academic integrity review, enhancing student experience through support, redesign, consultations, and resource creation.",
        logo: "https://www.uts.edu.au/sites/default/files/2020-06/UTS-logo-2.png",
    },
    {
        title: "Apple Foundation Program Participant",
        company: "UTS",
        period: "January - February 2023",
        description:
            "The Apple Foundation Program at UTS provided me with a challenge-based learning environment where I could get firsthand knowledge of the creative process required to address real-world issues, work in diverse teams, and create apps using the iOS ecosystem.",
        logo: "https://developer.apple.com/assets/elements/icons/develop-in-swift/develop-in-swift-96x96_2x.png",
    },
    {
        title: "Software Engineering (Intern)",
        company: "AgriWebb",
        period: "February 2022 - June 2022",
        description: `The UTS Software Development Studio's partnership with AgriWebb provided me with an opportunity to develop a Python machine learning algorithm, as well as experience in complex data querying and analysis in Snowflake SQL Data Warehouse.`,
        logo: "https://media.licdn.com/dms/image/C4E0BAQEf07ngE3BhRA/company-logo_200_200/0/1630603836208/agriwebb_logo?e=2147483647&v=beta&t=4K0avvHK0u4MUJkGqjXt4K1QHlJIc2tuBRYEVaRZuEQ",
    },
    {
        title: "Software Engineer (Intern)",
        company: "InfoPoint",
        period: "July 2021 - February 2022",
        description: `• Executed full lifecycle software development
• Integrated software components into a fully functional software system
• Developed software verification plans and quality assurance procedures
• Documented and maintained software functionality
• Worked collaboratively with the directors, stakeholders, and other technical team members
• Regularly reported to the technical lead on a formal and informal basis about the status of assigned tasks
• Provided timely technical support and issue resolution to customers`,
        logo: "https://infopoint.com.au/wp-content/themes/infopoint2016/images/logo.png",
    },
    {
        title: "Sales Assistant",
        company: "Mimco",
        period: "November 2019 - February 2020",
        description: "Completed a variety of tasks, including stock management, customer service, register work, and housekeeping.",
        logo: "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/012018/untitled-1_116.png",
    },
];

export default function Experience() {
    return (
        <section
            id="experience"
            className="py-20 px-8 bg-primary/50"
        >
            <div className="max-w-4xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-textLight mb-4"
                >
                    Experience
                </motion.h2>
                {/* Removed direct CV download link per request */}
                <div className="space-y-8">
                    {experiences.map((exp, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-primary/30 p-6 rounded-lg flex gap-6 items-start"
                        >
                            <div className="w-16 h-16 flex-shrink-0 bg-primary/60 rounded-lg overflow-hidden flex items-center justify-center">
                                <Image
                                    src={exp.logo}
                                    alt={exp.company}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-contain p-2"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full h-full flex items-center justify-center text-2xl font-bold text-secondary';
                                        fallback.textContent = exp.company.split(' ').map(word => word[0]).join('');
                                        target.parentElement?.appendChild(fallback);
                                    }}
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-textLight">{exp.title}</h3>
                                <p className="text-secondary mb-1">{exp.company}</p>
                                <p className="text-text mb-2">{exp.period}</p>
                                <p className="text-text">{exp.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
