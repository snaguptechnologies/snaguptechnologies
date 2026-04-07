"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import ThreeBackground from "@/components/ThreeBackground";
import Hero3DAsset from "@/components/Hero3DAsset";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import {
    BookOpen, Award, Users, BarChart3,
    ArrowRight, Shield, Zap, Globe, CheckCircle, Play,
    MessageSquare, Mail, Phone, Loader2, Layers
} from "lucide-react";

// ─── Floating 3D Particle ───────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
    return <div className="absolute rounded-full pointer-events-none" style={style} />;
}


// ─── Section animation wrapper ───────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ─── Animated Counter (scroll-triggered) ─────────────────
function AnimatedCounter({ to, suffix = "" }: { to: number | string; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView || typeof to !== "number") return;
        const node = ref.current;
        if (!node) return;
        const ctrl = animate(0, to, {
            duration: 1.8,
            ease: "easeOut",
            onUpdate(v) { node.textContent = Math.round(v) + suffix; },
        });
        return () => ctrl.stop();
    }, [inView, to, suffix]);
    return <span ref={ref}>{typeof to === "number" ? "0" + suffix : to}</span>;
}

// ─── Typewriter word cycler ───────────────────────────────
function TypewriterWord({ words }: { words: string[] }) {
    const [idx, setIdx] = useState(0);
    const [display, setDisplay] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const word = words[idx];
        let timeout: ReturnType<typeof setTimeout>;
        if (!deleting && display.length < word.length) {
            timeout = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), 80);
        } else if (!deleting && display.length === word.length) {
            timeout = setTimeout(() => setDeleting(true), 1800);
        } else if (deleting && display.length > 0) {
            timeout = setTimeout(() => setDisplay(display.slice(0, -1)), 45);
        } else if (deleting && display.length === 0) {
            setDeleting(false);
            setIdx((i) => (i + 1) % words.length);
        }
        return () => clearTimeout(timeout);
    }, [display, deleting, idx, words]);

    return (
        <span className="inline-block min-w-[2ch]">
            <span className="text-gradient">{display}</span>
            <span className="ml-0.5 border-r-2 border-primary animate-pulse" />
        </span>
    );
}

// ─── Infinite Marquee Ticker ──────────────────────────────
function MarqueeTicker() {
    const items = [
        "Digital Courses", "Website Development", "Logo Designing", "Portfolio Design",
        "Batch-Based Learning", "Verified Certificates", "Expert Instructors",
        "Attendance Tracking", "Brand Identity", "UI/UX Design", "Full-Stack Apps",
    ];
    const doubled = [...items, ...items]; // duplicate for seamless loop
    return (
        <div className="w-full overflow-hidden border-y border-border/50 py-4 marquee-mask bg-muted/5">
            <div className="flex gap-12 animate-marquee whitespace-nowrap w-max">
                {doubled.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.15em]">{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Feature Card ────────────────────────────────────────
function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
    return (
        <FadeIn delay={delay}>
            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-border hover:bg-accent/10 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-6 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">{icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
            </div>
        </FadeIn>
    );
}

// ─── Main Home Page ──────────────────────────────────────
export default function HomePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        const u = localStorage.getItem("snagup_user");
        if (u) setUser(JSON.parse(u));
    }, []);

    const handleCTA = () => {
        if (user) router.push(`/dashboard/${user.role}`);
        else router.push("/register");
    };

    const handleInquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingInquiry(true);
        try {
            await axios.post(`${API_ENDPOINTS.INQUIRIES}`, inquiryData);
            setInquirySubmitted(true);
            setInquiryData({ name: "", email: "", phone: "", service_type: "", message: "" });
        } catch (err) {
            alert("Failed to submit inquiry. Please try again.");
        } finally {
            setSubmittingInquiry(false);
        }
    };

    const handleLogin = () => router.push("/login");

    const [inquiryData, setInquiryData] = useState({ name: "", email: "", phone: "", service_type: "", message: "" });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [inquirySubmitted, setInquirySubmitted] = useState(false);

    // Certificate Verification State
    const [certId, setCertId] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [verificationError, setVerificationError] = useState("");

    const handleVerify = async (e?: React.FormEvent, overrideId?: string) => {
        if (e) e.preventDefault();
        const targetId = overrideId || certId;
        if (!targetId.trim()) return;
        
        setVerifying(true);
        setVerificationError("");
        setVerificationResult(null);
        try {
            const res = await axios.get(`${API_ENDPOINTS.CERTIFICATES}/verify/${targetId.trim()}`);
            setVerificationResult(res.data.certificate);
            
            // If it's an auto-verify, scroll to the verification results
            if (overrideId) {
                setTimeout(() => {
                    document.getElementById("verify")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            }
        } catch (err: any) {
            setVerificationError(err.response?.data?.error || "Invalid Certificate ID. Please check and try again.");
        } finally {
            setVerifying(false);
        }
    };

    // Auto-verify from URL param
    useEffect(() => {
        if (mounted) {
            const params = new URLSearchParams(window.location.search);
            const idParam = params.get("id");
            if (idParam) {
                setCertId(idParam.toUpperCase());
                handleVerify(undefined, idParam.toUpperCase());
            }
        }
    }, [mounted]);

    const [batches, setBatches] = useState<any[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await axios.get(API_ENDPOINTS.BATCHS);
                // Technical filter: List batches which are not finalized
                setBatches(res.data.filter((b: any) => !b.is_finalized));
            } catch (err) {
                console.error("Failed to fetch batches:", err);
            } finally {
                setLoadingBatches(false);
            }
        };
        fetchBatches();
    }, []);

    const features = [
        { icon: <BookOpen className="w-6 h-6" />, title: "Structured Batch Courses", description: "Enroll in professionally managed cohort-based courses. Track your progress from Day 1 to certification.", delay: 0 },
        { icon: <Users className="w-6 h-6" />, title: "Live Instructor Sessions", description: "Learn directly from expert instructors with real-time attendance tracking and personalized feedback.", delay: 0.1 },
        { icon: <Award className="w-6 h-6" />, title: "Verifiable Certificates", description: "Earn tamper-proof digital certificates upon completion, verifiable by anyone with your unique certificate ID.", delay: 0.2 },
        { icon: <BarChart3 className="w-6 h-6" />, title: "Progress Analytics", description: "Detailed attendance matrices and performance dashboards for students, instructors, and administrators.", delay: 0.3 },
        { icon: <Shield className="w-6 h-6" />, title: "Role-Based Access", description: "Secure, separate dashboards for Admins, Instructors, and Students — each tailored to their workflow.", delay: 0.4 },
        { icon: <Zap className="w-6 h-6" />, title: "Instant Enrollment", description: "Seamless payment flow with instant enrollment confirmation. Start learning within minutes.", delay: 0.5 },
    ];

    if (!mounted) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background overflow-x-hidden font-sans text-foreground selection:bg-primary/20">
            {/* Three.js particle canvas */}
            <ThreeBackground />

            {/* Subtle vignette layer */}
            <div className="fixed inset-0 pointer-events-none transition-colors duration-500" style={{
                zIndex: 1,
                background: "radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 100%)",
                opacity: 0.6
            }} />

            {/* All page content sits above canvas */}
            <div className="relative" style={{ zIndex: 2 }}>

                {/* ── HERO ── */}
                <section className="relative min-h-screen flex items-center pt-20">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:items-center py-24">

                        {/* Left: Text — dark glass pill so particles don't bleed */}
                        <div className="relative order-2 lg:order-1">
                            <div className="absolute inset-x-0 inset-y-0 -mx-8 -my-8 rounded-3xl bg-background/60 backdrop-blur-md border border-border/50" />
                            <div className="relative">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Next-Generation LMS Platform
                                </motion.div>

                                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                                    className="text-5xl md:text-7xl font-black text-foreground leading-[1.05] mb-6 tracking-tight text-center lg:text-left">
                                    Learn.<br />
                                    <TypewriterWord words={["Grow.", "Build.", "Launch.", "Achieve."]} /><br />
                                    Succeed.
                                </motion.h1>

                                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                                    className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                                    Snagup Technologies delivers professional, cohort-based learning with
                                    expert instructors, real-time progress tracking, and verifiable digital certifications.
                                </motion.p>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                                    className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                    <button onClick={handleCTA}
                                        className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-base hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-3">
                                        Start Learning
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <Link href="#verify"
                                        className="px-8 py-4 border border-border text-foreground rounded-2xl font-bold text-base hover:bg-muted transition-all flex items-center gap-3">
                                        <Award className="w-4 h-4 text-primary" /> Verify Certificate
                                    </Link>
                                </motion.div>

                                {/* Trust indicators */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}
                                    className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 mt-10 pt-10 border-t border-border">
                                    {[
                                        { icon: <CheckCircle className="w-4 h-4 text-primary" />, text: "Free Registration" },
                                        { icon: <CheckCircle className="w-4 h-4 text-primary" />, text: "Verified Certificates" },
                                        { icon: <CheckCircle className="w-4 h-4 text-primary" />, text: "Expert Instructors" },
                                    ].map(({ icon, text }) => (
                                        <div key={text} className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                            {icon} {text}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>

                        {/* Right: 3D Animation */}
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-center justify-center relative z-10 order-1 lg:order-2">
                            <Hero3DAsset />
                        </motion.div>
                    </div>
                </section>

                {/* ── MARQUEE TICKER ── */}
                <MarqueeTicker />

                {/* ── STATS ── */}
                <section className="relative py-24 border-y border-border bg-muted/30 backdrop-blur-[2px]">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {([
                                { value: 100, suffix: "%", label: "Digital Certification" },
                                { value: 3, suffix: "+", label: "Role-Based Dashboards" },
                                { value: "Live", suffix: "", label: "Attendance Tracking" },
                                { value: "24/7", suffix: "", label: "Platform Access" },
                            ] as Array<{ value: number | string; suffix: string; label: string }>).map(({ value, suffix, label }, i) => (
                                <FadeIn key={label} delay={i * 0.1}>
                                    <div className="text-center">
                                        <div className="text-4xl md:text-5xl font-black text-foreground mb-2">
                                            <AnimatedCounter to={value} suffix={suffix} />
                                        </div>
                                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SERVICES ── */}
                <section id="services" className="relative py-24 md:py-32 px-6 border-t border-border bg-muted/10 backdrop-blur-[1px] scroll-mt-20">
                    <div className="max-w-7xl mx-auto">
                        <FadeIn className="text-center mb-12 md:mb-20">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">What We Offer</p>
                            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight">
                                Services Built for<br className="hidden md:block" />
                                <span className="text-gradient"> Your Digital Growth</span>
                            </h2>
                            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base px-4">From learning to launching — Snagup Technologies is your end-to-end digital partner.</p>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Digital Courses */}
                            <FadeIn delay={0}>
                                <div className="group relative p-6 md:p-10 rounded-3xl border border-border bg-card hover:border-primary/50 hover:bg-accent/10 transition-all duration-500 overflow-hidden flex flex-col gap-6 min-h-[200px] md:min-h-[240px]">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/2 rounded-full blur-3xl group-hover:bg-primary/5 transition-all duration-700 translate-x-16 -translate-y-16" />
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                            <BookOpen className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-foreground mb-2">Digital Courses</h3>
                                            <p className="text-muted-foreground leading-relaxed">Professional cohort-based learning programs delivered online. Structured curriculum, live instruction, real-time attendance tracking, and verifiable digital certificates upon completion.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {["Live Batches", "Certificates", "Instructor-Led", "Attendance Tracking"].map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Website Development */}
                            <FadeIn delay={0.1}>
                                <div className="group relative p-10 rounded-3xl border border-border bg-card hover:border-primary/50 hover:bg-accent/10 transition-all duration-500 overflow-hidden flex flex-col gap-6 min-h-[240px]">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/2 rounded-full blur-3xl group-hover:bg-primary/5 transition-all duration-700 translate-x-16 -translate-y-16" />
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                            <Globe className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-foreground mb-2">Website Development</h3>
                                            <p className="text-muted-foreground leading-relaxed">Custom, high-performance websites built for businesses, startups, and enterprises. From landing pages to full-stack web applications — modern, fast, and scalable.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {["Landing Pages", "Web Apps", "E-Commerce", "Next.js & React"].map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Portfolio Design */}
                            <FadeIn delay={0.2}>
                                <div className="group relative p-10 rounded-3xl border border-border bg-card hover:border-primary/50 hover:bg-accent/10 transition-all duration-500 overflow-hidden flex flex-col gap-6 min-h-[240px]">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/2 rounded-full blur-3xl group-hover:bg-primary/5 transition-all duration-700 translate-x-16 -translate-y-16" />
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                            <BarChart3 className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-foreground mb-2">Portfolio Design</h3>
                                            <p className="text-muted-foreground leading-relaxed">Stunning personal and professional portfolios that make lasting impressions. Designed for developers, designers, freelancers, and creatives who want to stand out.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {["Personal Branding", "Interactive UI", "Responsive", "SEO-Ready"].map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Logo Designing */}
                            <FadeIn delay={0.3}>
                                <div className="group relative p-10 rounded-3xl border border-border bg-card hover:border-primary/50 hover:bg-accent/10 transition-all duration-500 overflow-hidden flex flex-col gap-6 min-h-[240px]">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/2 rounded-full blur-3xl group-hover:bg-primary/5 transition-all duration-700 translate-x-16 -translate-y-16" />
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                            <Zap className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-foreground mb-2">Logo Designing</h3>
                                            <p className="text-muted-foreground leading-relaxed">Unique, timeless logos and brand identities crafted to represent your vision. Every design is tailored to your business personality, values, and target audience.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {["Brand Identity", "Vector Files", "Multiple Variants", "Quick Delivery"].map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>

                {/* ── ACTIVE COHORTS ── */}
                {batches.length > 0 && (
                    <section id="batches" className="relative py-32 px-6 border-t border-border bg-gradient-to-b from-muted/5 to-transparent scroll-mt-20">
                        <div className="max-w-7xl mx-auto">
                            <FadeIn className="text-center mb-16 md:mb-24">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Learning Matrix</p>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight tracking-tight">
                                    Upcoming <span className="text-gradient">Learning Clusters</span>
                                </h2>
                                <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
                                    Join our upcoming cohort-based programs. High-intensity training with industry veterans, starting soon.
                                </p>
                            </FadeIn>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {batches.map((batch, i) => {
                                    const isOpen = batch.enrollment_status === 'open';
                                    const isUpcoming = batch.batch_status === 'upcoming';
                                    
                                    return (
                                        <FadeIn key={batch.id} delay={i * 0.1}>
                                            <div className="group relative glass-panel rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-3xl overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2">
                                                {/* Status Pill */}
                                                <div className="absolute top-6 right-6 z-10">
                                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${
                                                        isOpen ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 
                                                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                        {isOpen ? 'Admission Open' : 'Starting Soon'}
                                                    </div>
                                                </div>

                                                <div className="p-8 md:p-10 flex flex-col h-full">
                                                    {/* Course Identifier */}
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                            <Layers className="w-5 h-5" />
                                                        </div>
                                                        <div className="h-px flex-1 bg-border/30" />
                                                    </div>

                                                    {/* Title & Batch ID */}
                                                    <div className="space-y-1 mb-6">
                                                        <h3 className="text-2xl font-black text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors duration-300">
                                                            {batch.course_name}
                                                        </h3>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                                                            Cluster Sync: {batch.name}
                                                        </p>
                                                    </div>

                                                    {/* Instructor Context */}
                                                    <div className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-muted/20 border border-border/10">
                                                        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-[10px] font-black">
                                                            {batch.instructor_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter opacity-70">Expert Mentor</span>
                                                            <span className="text-xs font-bold text-foreground">{batch.instructor_name || 'System Orchestrator'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Metrics Grid */}
                                                    <div className="grid grid-cols-2 gap-4 mb-10 pt-6 border-t border-border/20">
                                                        <div>
                                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">Duration</p>
                                                            <p className="text-sm font-black text-foreground">{batch.duration_days} Days</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">Enrollment Deadline</p>
                                                            <p className="text-sm font-black text-foreground">
                                                                {batch.enrollment_end_date ? new Date(batch.enrollment_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBA'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Pricing & CTA */}
                                                    <div className="mt-auto flex items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-0.5">Program Fee</p>
                                                            <p className="text-2xl font-black text-foreground tracking-tighter">₹{Number(batch.price).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <button 
                                                            onClick={handleCTA}
                                                            className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xl shadow-foreground/5 hover:shadow-primary/20"
                                                        >
                                                            Join Batch <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </FadeIn>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── SERVICE INQUIRY ── */}
                <section id="service-inquiry" className="relative py-40 px-6 overflow-hidden">
                    {/* Background Integration */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.01] rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
                        <FadeIn>
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Digital Solutions</p>
                                    </div>
                                    <h2 className="text-5xl md:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
                                        Scale Your Idea<br />
                                        <span className="text-gradient">Into Reality.</span>
                                    </h2>
                                    <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                                        We don't just teach code — we build it. Partner with our expert team for high-end digital services tailored to your vision.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    {[
                                        { icon: <Globe className="w-5 h-5" />, title: "Full-Stack Development", desc: "Production-ready web applications built with modern stacks." },
                                        { icon: <Zap className="w-5 h-5" />, title: "Brand Engineering", desc: "Strategic identity design that captures your brand's essence." },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-6 group">
                                            <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 border border-border/50">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-lg mb-1">{item.title}</h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-10 opacity-60">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mail</p>
                                        <p className="text-sm font-bold text-foreground">snaguptechnologies@gmail.com</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Instagram</p>
                                        <p className="text-sm font-bold text-foreground">@snaguptechnologies</p>
                                    </div>

                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                            <div className="relative">
                                {/* Glass Form Card */}
                                <div className="relative p-1 bg-gradient-to-tr from-border/50 via-transparent to-border/50 rounded-[3rem]">
                                    <div className="relative p-10 md:p-12 rounded-[2.8rem] bg-background/50 backdrop-blur-3xl border border-white/5 shadow-2xl">
                                        {inquirySubmitted ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-24 text-center">
                                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                                    <CheckCircle className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">Mission Received</h3>
                                                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">Our architects are reviewing your brief. Expect a response within 24 hours.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setInquirySubmitted(false)}
                                                    className="mt-10 px-8 py-3 rounded-full border border-border text-xs font-black text-muted-foreground uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
                                                >
                                                    New Brief
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <form onSubmit={handleInquirySubmit} className="space-y-8">
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black text-foreground tracking-tight">Tell us your story</h3>
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Complete the mission brief</p>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="group space-y-2">
                                                            <input required type="text" placeholder="Name"
                                                                value={inquiryData.name} onChange={e => setInquiryData({ ...inquiryData, name: e.target.value })}
                                                                className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary transition-all font-medium placeholder:text-muted-foreground/30 text-lg" />
                                                        </div>
                                                        <div className="group space-y-2">
                                                            <input required type="email" placeholder="Email"
                                                                value={inquiryData.email} onChange={e => setInquiryData({ ...inquiryData, email: e.target.value })}
                                                                className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary transition-all font-medium placeholder:text-muted-foreground/30 text-lg" />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="group space-y-2">
                                                            <input type="tel" placeholder="Phone (Optional)"
                                                                value={inquiryData.phone} onChange={e => setInquiryData({ ...inquiryData, phone: e.target.value })}
                                                                className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary transition-all font-medium placeholder:text-muted-foreground/30 text-lg" />
                                                        </div>
                                                        <div className="group space-y-2">
                                                            <select required value={inquiryData.service_type} onChange={e => setInquiryData({ ...inquiryData, service_type: e.target.value })}
                                                                className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary transition-all font-medium appearance-none cursor-pointer text-lg">
                                                                <option value="" disabled className="bg-background">Service Category</option>
                                                                <option value="Website Development" className="bg-background">Website Development</option>
                                                                <option value="Logo Designing" className="bg-background">Logo Designing</option>
                                                                <option value="Portfolio Design" className="bg-background">Portfolio Design</option>
                                                                <option value="Custom Web App" className="bg-background">Custom Web Application</option>
                                                                <option value="Branding & Identity" className="bg-background">Branding & Identity</option>
                                                                <option value="Other" className="bg-background">Other Digital Services</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="group space-y-2">
                                                        <textarea rows={1} placeholder="Your Brief..."
                                                            value={inquiryData.message} onChange={e => setInquiryData({ ...inquiryData, message: e.target.value })}
                                                            className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary transition-all font-medium resize-none placeholder:text-muted-foreground/30 text-lg" />
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submittingInquiry}
                                                    className="w-full py-6 bg-foreground text-background rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group shadow-xl shadow-foreground/5"
                                                >
                                                    {submittingInquiry ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Initialize Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* ── CERTIFICATE VERIFICATION ── */}
                <section id="verify" className="relative py-32 px-6 border-t border-border bg-muted/5">
                    <div className="max-w-4xl mx-auto">
                        <FadeIn className="text-center mb-16">
                            <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4">Verification Center</p>
                            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">Verify Achievement</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">Enter the unique Certificate ID to verify the authenticity of credentials issued by Snagup Technologies.</p>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <div className="relative p-1 bg-gradient-to-br from-primary/20 via-transparent to-primary/20 rounded-[2.5rem] shadow-2xl">
                                <div className="bg-card/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.3rem] border border-border/50">
                                    <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 relative">
                                            <Award className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. SNAGUP-2026-0001"
                                                value={certId}
                                                onChange={e => setCertId(e.target.value.toUpperCase())}
                                                className="w-full pl-14 pr-6 py-5 bg-muted/50 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-muted-foreground/30"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={verifying}
                                            className="px-10 py-5 bg-foreground text-background rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-w-[200px]"
                                        >
                                            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify ID"}
                                        </button>
                                    </form>

                                    {/* Results Area */}
                                    <AnimatePresence mode="wait">
                                        {verificationResult && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-10 pt-10 border-t border-border"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="flex items-start gap-6">
                                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Authenticity Confirmed</p>
                                                            <h4 className="text-2xl font-black text-foreground leading-tight">{verificationResult.student_name}</h4>
                                                            <p className="text-muted-foreground text-sm mt-1">Verified Graduate</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between py-2 border-b border-border/50">
                                                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Program</span>
                                                            <span className="text-sm font-bold text-foreground">{verificationResult.course_name}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2 border-b border-border/50">
                                                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Issue Date</span>
                                                            <span className="text-sm font-bold text-foreground">{new Date(verificationResult.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2">
                                                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Instructor</span>
                                                            <span className="text-sm font-bold text-foreground">{verificationResult.instructor_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {verificationError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-8 p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-4 text-rose-500"
                                            >
                                                <Shield className="w-5 h-5 shrink-0" />
                                                <p className="text-sm font-bold">{verificationError}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>
                <section className="relative py-32 px-6 bg-muted/20 backdrop-blur-[2px]">
                    <div className="max-w-7xl mx-auto">
                        <FadeIn className="text-center mb-20">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">Platform Capabilities</p>
                            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">Everything You Need to<br />
                                <span className="text-gradient">Master Any Skill</span>
                            </h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">A complete learning management system built for professionals — from enrollment to certification.</p>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map(f => <FeatureCard key={f.title} {...f} />)}
                        </div>
                    </div>
                </section>

                {/* ── HOW IT WORKS ── */}
                <section className="relative py-32 px-6 border-t border-border bg-muted/10 backdrop-blur-[1px]">
                    <div className="max-w-5xl mx-auto">
                        <FadeIn className="text-center mb-20">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">The Process</p>
                            <h2 className="text-4xl md:text-5xl font-black text-foreground">How It Works</h2>
                        </FadeIn>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Connecting line */}
                            <div className="hidden md:block absolute top-8 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gradient-to-r from-border/5 via-border/50 to-border/5" />
                            {[
                                { step: "01", title: "Register & Browse", description: "Create your free account and explore available courses and upcoming batch schedules." },
                                { step: "02", title: "Enroll & Pay", description: "Choose your preferred batch, complete the secure checkout, and get instant approval." },
                                { step: "03", title: "Learn & Certify", description: "Attend live sessions, track your attendance, and claim your digital certificate upon completion." },
                            ].map(({ step, title, description }, i) => (
                                <FadeIn key={step} delay={i * 0.15}>
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 rounded-2xl border border-border bg-muted flex items-center justify-center mx-auto mb-6 text-xl font-black text-muted-foreground/30">{step}</div>
                                        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="relative py-32 px-6 bg-muted/30 backdrop-blur-[2px] border-t border-border">
                    <div className="max-w-4xl mx-auto text-center">
                        <FadeIn>
                            <div className="relative p-16 rounded-3xl border border-border overflow-hidden"
                                style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.05) 0%, transparent 70%)" }}>
                                {/* Corner accents */}
                                <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-border rounded-tl-3xl" />
                                <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-border rounded-br-3xl" />

                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6">Begin Your Journey</p>
                                <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                                    Ready to Level Up<br />Your Career?
                                </h2>
                                <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
                                    Join Snagup Technologies today. Get access to structured courses, expert mentors, and verifiable credentials.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <button onClick={handleCTA}
                                        className="group px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-[0_0_60px_rgba(var(--primary),0.15)] flex items-center gap-3">
                                        {user ? "Go to Dashboard" : "Get Started Free"}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="border-t border-border py-12 px-6">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <Link href={user ? `/dashboard/${user.role}` : "/login"} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                            <BrandLogo size={28} className="group-hover:rotate-[360deg] transition-transform duration-500" />
                            <span className="font-black text-muted-foreground tracking-[0.15em] text-sm uppercase">Snagup Technologies</span>
                        </Link>
                        <div className="flex items-center gap-8 text-xs text-muted-foreground font-medium">
                            <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
                            <span>•</span>
                            <span>© 2026 Snagup Technologies</span>
                            <span>•</span>
                            <span>All Rights Reserved</span>
                            <span>•</span>
                            <Globe className="w-4 h-4" />
                        </div>
                    </div>
                </footer>
            </div>{/* end content wrapper */}
        </div>
    );
}
