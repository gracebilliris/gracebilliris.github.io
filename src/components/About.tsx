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
                        Through collaborative projects in Software and STEM (Science Technology Engineering Mathematics) fields, I have gained transferrable and
                        technical skills that can be applied to any professional engineering development environment. This includes producing a Bluetooth
                        messaging application suitable for Android-based mobile devices.
                    </p>
                    <p className="text-lg mb-4">
                        Supplementing this, the UTS Software Engineering Studios allowed me to work on large software projects with many contributors. I am
                        highly interested in the prospect of growing as a developer and as a researcher in every opportunity possible.
                    </p>
                    <p className="text-lg">
                        I believe in lifelong learning and hope that every opportunity will help me gain a better understanding of the world and its systems.
                    </p>
                </div>
            </motion.div>
        </section>
    );
}
