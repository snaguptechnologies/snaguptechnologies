"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { UPCOMING_LEARNING_CLUSTERS, CourseItem, TRAINING_DOMAINS } from "@/app/lib/courses";
import {
    Search, Filter, BookOpen, Clock, ArrowRight, Sparkles, Layers,
    Shield, Code, Terminal, FileCode, Cpu, Server, Microchip,
    Binary, Database, BarChart3, Brain, LineChart, Cloud, Globe, ShieldCheck, Loader2
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function CourseDiscoveryPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const res = await axios.get(API_ENDPOINTS.COURSES);
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setCourses(res.data);
                } else {
                    setCourses(UPCOMING_LEARNING_CLUSTERS);
                }
            } catch (err) {
                console.warn("Course API unreachable, falling back to local dataset:", err);
                setCourses(UPCOMING_LEARNING_CLUSTERS);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const categories = [
        "All",
        "Software Development",
        "Backend & Application Development",
        "Data & Artificial Intelligence",
        "Cloud & Web3 Technologies"
    ];

    const getCourseIcon = (name: string = "") => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("python")) return <Terminal className="w-5 h-5 text-emerald-500" />;
        if (lowerName.includes("java")) return <FileCode className="w-5 h-5 text-amber-500" />;
        if (lowerName.includes("c++") || lowerName.includes("c ")) return <Code className="w-5 h-5 text-blue-500" />;
        if (lowerName.includes("backend") || lowerName.includes("server")) return <Server className="w-5 h-5 text-indigo-500" />;
        if (lowerName.includes("ai") || lowerName.includes("learning") || lowerName.includes("data science")) return <Brain className="w-5 h-5 text-purple-500" />;
        if (lowerName.includes("database") || lowerName.includes("sql")) return <Database className="w-5 h-5 text-cyan-500" />;
        if (lowerName.includes("web3") || lowerName.includes("blockchain") || lowerName.includes("hardhat") || lowerName.includes("contract")) return <Globe className="w-5 h-5 text-violet-500" />;
        if (lowerName.includes("cloud") || lowerName.includes("aws")) return <Cloud className="w-5 h-5 text-sky-500" />;
        if (lowerName.includes("analytics") || lowerName.includes("bi") || lowerName.includes("statistics")) return <BarChart3 className="w-5 h-5 text-pink-500" />;
        return <BookOpen className="w-5 h-5 text-primary" />;
    };

    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.category?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;

        let matchesDomain = true;
        if (selectedDomainFilter) {
            const domainObj = TRAINING_DOMAINS.find((d) => d.id === selectedDomainFilter);
            if (domainObj) {
                // If course has numeric id or matching name
                matchesDomain = domainObj.courseIds.includes(Number(course.id)) ||
                    domainObj.modules.some(m => course.name?.toLowerCase().includes(m.toLowerCase()));
            }
        }

        return matchesSearch && matchesCategory && matchesDomain;
    });

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 px-6 overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
                <div className="max-w-7xl mx-auto text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest"
                    >
                        <Sparkles className="w-4 h-4" /> Comprehensive Learning Paths
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tight text-foreground"
                    >
                        Explore Industry-Leading <span className="text-primary">Courses</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg leading-relaxed"
                    >
                        Discover project-based learning tracks across 6 core domain specializations designed for high-impact technical career development.
                    </motion.p>
                </div>
            </section>

            {/* Search & Domain Filter Bar */}
            <section className="py-8 px-6 bg-muted/20 border-b border-border/40">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Search & Main Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search courses, skills, technologies..."
                                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setSelectedDomainFilter(null);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                        selectedCategory === cat && !selectedDomainFilter
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "bg-card text-muted-foreground hover:text-foreground border border-border"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Six Training Domains Quick Filters */}
                    <div className="pt-2 border-t border-border/30">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-primary" /> Training Domain Tracks:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedDomainFilter(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    selectedDomainFilter === null
                                        ? "bg-foreground text-background"
                                        : "bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                All Domains
                            </button>
                            {TRAINING_DOMAINS.map((domain) => (
                                <button
                                    key={domain.id}
                                    onClick={() => {
                                        setSelectedDomainFilter(domain.id);
                                        setSelectedCategory("All");
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        selectedDomainFilter === domain.id
                                            ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30"
                                            : "bg-card text-muted-foreground hover:text-foreground border border-border/60"
                                    }`}
                                >
                                    {domain.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Course Grid */}
            <main className="flex-1 py-12 px-6 max-w-7xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm font-semibold text-muted-foreground">Loading course catalog...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20 space-y-4 bg-card border border-border rounded-3xl p-8 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No Courses Found</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            No courses match your current search or category filter. Try clearing your filters or search query.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("All");
                                setSelectedDomainFilter(null);
                            }}
                            className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course, idx) => {
                            const courseId = course.id;
                            const duration = course.duration || `${course.duration_days || 30} Days`;
                            const level = course.skillLevel || "All Levels";

                            return (
                                <motion.div
                                    key={courseId || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    className="group bg-card border border-border/60 rounded-3xl p-6 flex flex-col justify-between hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 truncate">
                                                {course.category || "General"}
                                            </span>
                                            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-primary" /> {duration}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                                {getCourseIcon(course.name)}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {course.name}
                                                </h2>
                                                <p className="text-xs text-muted-foreground font-semibold">
                                                    Level: {level}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                            {course.description || "Comprehensive hands-on curriculum built for industry standard practical software engineering."}
                                        </p>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-border/40 flex items-center justify-between gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Enrollment Open
                                            </span>
                                        </div>

                                        <Link
                                            href={`/courses/${courseId}`}
                                            className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
                                        >
                                            View Course <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
