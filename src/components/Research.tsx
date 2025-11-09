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
                            My PhD research investigates privacy and data risks in agentic and adaptive AI systems, and develops a practical solution framework
                            supported by empirical taxonomies and tooling. Several outputs from this research are currently undergoing peer review, providing
                            early external validation and feedback to inform further development. These include:
                        </p>
                        <ol className="list-decimal list-inside ml-4 space-y-2 text-text">
                            <li>
                                A systematic literature review following PRISMA guidelines that identifies privacy and data risks in agentic AI systems —
                                submitted to the Software and Information (SAI) Conference 2026.
                            </li>
                            <li>
                                A demonstration paper of an initial version of the proposed solution framework — submitted to the 48th International Conference
                                on Software Engineering (ICSE 2026).
                            </li>
                            <li>A submission to the ICSE 2026 Doctoral Symposium track.</li>
                            <li>
                                A study on privacy risk management in Agentic AI systems — submitted to the International Conference on Advanced Information
                                Systems Engineering (CAiSE 2026).
                            </li>
                        </ol>
                    </div>
                    <div className="prose prose-invert max-w-none">
                        <p className="text-text">
                            Prior work contributing to these outputs includes the development of a structured taxonomy of data risks in AI and quantum computing
                            contexts (Billiris, 2025a), and an extended taxonomy focusing on data privacy-specific risk dimensions within AI systems (Billiris,
                            2025b). These studies provide empirical and conceptual grounding for modelling privacy risks that emerge from adaptive and
                            distributed system behaviours. Collectively, these submissions support community engagement and the iterative refinement of both the
                            taxonomy and the proposed solution framework.
                        </p>
                        <ul className="list-disc list-outside ml-4 mt-4">
                            <li className="text-text">
                                Billiris et al. (2025a). A Taxonomy of Data Risks in AI and Quantum Computing (QAI): A Systematic Review. arXiv preprint.{" "}
                                <a
                                    href="https://arxiv.org/abs/2509.20418"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-secondary hover:text-secondary/80"
                                >
                                    arXiv:2509.20418
                                </a>
                            </li>
                            <li className="text-text">
                                Billiris et al. (2025b). Privacy in the Age of AI: A Taxonomy of Data Risks. arXiv preprint.{" "}
                                <a
                                    href="https://arxiv.org/abs/2510.02357"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-secondary hover:text-secondary/80"
                                >
                                    arXiv:2510.02357
                                </a>
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
