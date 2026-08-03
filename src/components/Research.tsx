"use client";

import { motion } from "framer-motion";

export default function Research() {
    return (
        <section
            id="research"
            className="py-20 px-8"
        >
            <div className="max-w-4xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-textLight mb-8"
                >
                    Research Experience
                </motion.h2>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-primary/30 p-8 rounded-lg"
                >
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-textLight">Doctor of Philosophy (PhD) — Current</h3>
                        <p className="text-secondary">University of Technology Sydney</p>
                        <p className="text-text">2025 – Present</p>
                    </div>
                    <div className="prose prose-invert max-w-none mb-6">
                        <p className="text-text">
                            My PhD research investigates data privacy risks in agentic and adaptive AI systems and develops practical architectures, methods,
                            and tools for building reliable and observable multi-agent software systems. This work spans the AI software development lifecycle
                            and combines systematic literature reviews, empirical taxonomies, design science, and prototype development.
                        </p>
                        <p className="text-text">
                            The research has produced taxonomies of data risks in AI, quantum computing, and data privacy; an accepted systematic literature
                            review for the SAI Computing Conference 2026; and a federated observability architecture pattern published in
                            <em> Information and Software Technology</em>. Current work also includes the Context Processing Layer (CPL), an SSRN-accepted
                            preprint proposing semantic observability for multi-agent AI systems.
                        </p>
                        <ul className="list-disc list-outside ml-4 mt-4 space-y-2">
                            <li className="text-text">
                                Developing evidence-based taxonomies and systematic reviews of privacy and data risks in AI systems.
                            </li>
                            <li className="text-text">
                                Designing federated and semantic observability patterns for reliable agentic AI software systems.
                            </li>
                            <li className="text-text">
                                Building and evaluating multi-agent prototypes that translate the research into practical developer tooling.
                            </li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <br />
                        <h3 className="text-xl font-semibold text-textLight">Honours Project</h3>
                        <p className="text-secondary">University of Technology Sydney</p>
                        <p className="text-text">January 2023 – August 2024</p>
                    </div>
                    <div className="prose prose-invert max-w-none">
                        <ul className="list-disc list-outside ml-4 space-y-3">
                            <li className="text-text">
                                A year-long research project investigating the intersection of Generative Artificial Intelligence (GAI) and copyright law,
                                culminating in the development and validation of the Copyright Health Checker (CHC) tool.
                            </li>
                            <li className="text-text">
                                Achieved High Distinction – 41029 Engineering Research Preparation (95/100) and 41030 Engineering Capstone (95/100).
                            </li>
                            <li className="text-text">
                                Published work on CHC available on{" "}
                                <a
                                    href="https://dl.acm.org/doi/10.1145/3703459"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-secondary hover:text-secondary/80 transition-colors"
                                >
                                    ACM Journal
                                </a>{" "}
                                &{" "}
                                <a
                                    href="https://aisel.aisnet.org/acis2024/17/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-secondary hover:text-secondary/80 transition-colors"
                                >
                                    ACIS2024 Conference
                                </a>
                            </li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
