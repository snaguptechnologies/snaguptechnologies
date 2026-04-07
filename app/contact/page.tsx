"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Instagram, Linkedin, MessageSquare, ArrowRight, Globe, Shield, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import ThreeBackground from "@/components/ThreeBackground";
import BrandLogo from "@/components/BrandLogo";

export default function ContactPage() {
    const contactLinks = [
        {
            name: "Gmail",
            value: "snaguptechnologies@gmail.com",
            icon: <Mail className="w-6 h-6" />,
            href: "mailto:snaguptechnologies@gmail.com",
            color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            hover: "hover:bg-rose-500 hover:text-white"
        },
        {
            name: "Instagram",
            value: "@snaguptechnologies",
            icon: <Instagram className="w-6 h-6" />,
            href: "https://instagram.com/snaguptechnologies",
            color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
            hover: "hover:bg-purple-500 hover:text-white"
        },
        {
            name: "LinkedIn",
            value: "Snagup Technologies",
            icon: <Linkedin className="w-6 h-6" />,
            href: "https://linkedin.com/company/snagup-technologies",
            color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            hover: "hover:bg-blue-500 hover:text-white"
        }
    ];



    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <ThreeBackground />
            <Navbar />

            <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column: Heading & Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            <MessageSquare className="w-3 h-3" /> Get In Touch
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
                            Let&apos;s Build Something <br />
                            <span className="text-gradient">Extraordinary.</span>
                        </h1>
                        <p className="text-muted-foreground text-lg mb-12 max-w-xl leading-relaxed">
                            Have a question, a project in mind, or just want to say hello? 
                            Our team is ready to collaborate and turn your vision into reality with premium digital solutions.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">Secure Communication</h4>
                                    <p className="text-sm text-muted-foreground">Your data is protected with end-to-end security protocols.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                                    <Zap className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">Lightning Fast Response</h4>
                                    <p className="text-sm text-muted-foreground">Expect a reply from our experts within 24 hours.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Contact Cards */}
                    <div className="grid gap-6">
                        {contactLinks.map((link, i) => (
                            <motion.a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className={`group relative p-8 rounded-[32px] border transition-all duration-500 backdrop-blur-md overflow-hidden ${link.color}`}
                            >
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-background/50 border border-border/10 flex items-center justify-center shadow-xl transition-transform duration-500 group-hover:scale-110">
                                            {link.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">{link.name}</p>
                                            <h3 className="text-xl font-bold tracking-tight">{link.value}</h3>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-6 h-6 transition-all duration-500 group-hover:translate-x-2" />
                                </div>
                                {/* Shine effects */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </motion.a>
                        ))}

                        {/* Extra Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="p-8 rounded-[32px] bg-muted/30 border border-border/50 backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Available Globally</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Snagup Technologies operates as a digital-first agency. 
                                We are available for projects across all timezones.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-border py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                        <BrandLogo size={28} className="group-hover:rotate-[360deg] transition-transform duration-500" />
                        <span className="font-black text-muted-foreground tracking-[0.15em] text-sm uppercase">Snagup Technologies</span>
                    </Link>
                    <div className="flex items-center gap-8 text-xs text-muted-foreground font-medium">
                        <span>© 2026 Snagup Technologies</span>
                        <span>•</span>
                        <span>All Rights Reserved</span>
                        <span>•</span>
                        <Globe className="w-4 h-4" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
