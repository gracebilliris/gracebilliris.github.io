"use client";

import { motion } from "framer-motion";

const publications = [
    {
        citation: (
            <>
                Billiris, G., &amp; Gill, A. (2026). A federated observability architecture pattern for reliable agentic AI software systems across the AI software development lifecycle. <em>Information and Software Technology, 199</em>, Article 108260.
            </>
        ),
        href: "https://doi.org/10.1016/j.infsof.2026.108260",
        linkLabel: "https://doi.org/10.1016/j.infsof.2026.108260",
    },
    {
        citation: (
            <>
                Billiris, G., Gill, A., Haggag, O., Bandara, M., &amp; Grundy, J. (2026). CPL: A context processing layer for semantic observability in multi-agent AI systems. <em>SSRN</em> 7194446.
            </>
        ),
        href: "https://doi.org/10.2139/ssrn.7194446",
        linkLabel: "https://doi.org/10.2139/ssrn.7194446",
    },
    {
        citation: (
            <>
                Billiris, G., Gill, A., &amp; Bandara, M. (2026). Systematic literature review of data privacy risks in AI systems. <em>Science and Information Computing Conference (SAI) 2026</em>.
            </>
        ),
        href: "https://link.springer.com/book/10.1007/978-3-032-24810-7",
        linkLabel: "Published proceedings",
    },
    {
        citation: (
            <>
                Billiris, G., Gill, A., &amp; Bandara, M. (2025). Privacy in the age of AI: A taxonomy of data risks. <em>arXiv</em>.
            </>
        ),
        href: "https://doi.org/10.48550/arXiv.2510.02357",
        linkLabel: "https://doi.org/10.48550/arXiv.2510.02357",
    },
    {
        citation: (
            <>
                Billiris, G., Gill, A., &amp; Bandara, M. (2025). A taxonomy of data risks in AI and quantum computing (QAI): A systematic review. <em>arXiv</em>.
            </>
        ),
        href: "https://doi.org/10.48550/arXiv.2509.20418",
        linkLabel: "https://doi.org/10.48550/arXiv.2509.20418",
    },
    {
        citation: (
            <>
                Billiris, G., Gill, A., Oppermann, I., &amp; Niazi, M. (2024). Towards the development of a copyright risk checker tool for generative artificial intelligence systems. <em>Digital Government: Research and Practice, 5</em>(4), Article 41.
            </>
        ),
        href: "https://doi.org/10.1145/3703459",
        linkLabel: "https://doi.org/10.1145/3703459",
    },
    {
        citation: (
            <>
                Billiris, G., &amp; Gill, A. Q. (2024). An initial review of the copyright concerns of generative artificial intelligence. <em>ACIS 2024 Proceedings</em>, Article 17.
            </>
        ),
        href: "https://aisel.aisnet.org/acis2024/17/",
        linkLabel: "ACIS 2024 Proceedings",
    },
];

export default function Publications() {
    return (
        <section
            id="publications"
            className="py-20 px-8 bg-primary/50"
        >
            <div className="max-w-4xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-textLight mb-8"
                >
                    Publications
                </motion.h2>
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-10 rounded-lg border border-secondary/20 bg-primary/30 p-6 md:p-8"
                >
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-secondary">Featured Publication</p>
                    <h3 className="mb-3 text-xl md:text-2xl font-semibold text-textLight">
                        A Federated Observability Architecture Pattern for Reliable Agentic AI Software Systems Across the AI Software Development Lifecycle
                    </h3>
                    <p className="mb-3 text-text">
                        Published in the A-ranked journal <em>Information and Software Technology</em>, Volume 199, Article 108260 (2026).
                    </p>
                    <p className="mb-5 text-text">
                        FOAP introduces a seven-layer, schema-agnostic architecture for federating, normalising, retaining, and observing heterogeneous
                        telemetry across the AI software development lifecycle.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <a
                            href="https://doi.org/10.1016/j.infsof.2026.108260"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md bg-secondary px-4 py-2 font-medium text-primary hover:bg-secondary/80 transition-colors"
                        >
                            Read the Paper
                        </a>
                        <a
                            href="https://github.com/gracebilliris/federated-observability-architecture-pattern"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-secondary px-4 py-2 font-medium text-secondary hover:bg-secondary/10 transition-colors"
                        >
                            View the Prototype
                        </a>
                    </div>
                </motion.article>
                <motion.ol
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-5 list-decimal list-outside ml-5"
                >
                    {publications.map((publication, index) => (
                        <li
                            key={index}
                            className="text-text pl-2 leading-relaxed"
                        >
                            {publication.citation}
                            {publication.href && (
                                <>
                                    {" "}
                                    <a
                                        href={publication.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-secondary hover:text-secondary/80 break-words"
                                    >
                                        {publication.linkLabel}
                                    </a>
                                </>
                            )}
                        </li>
                    ))}
                </motion.ol>
            </div>
        </section>
    );
}
