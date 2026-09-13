"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { UPCOMING_LEARNING_CLUSTERS, CourseItem } from "@/app/lib/courses";
import Navbar from "@/components/Navbar";
import {
    ArrowLeft, BookOpen, Clock, Award, CheckCircle2, ChevronDown, ChevronUp,
    Shield, Sparkles, Layers, FileCode, Check, Lock, AlertCircle, Loader2, ArrowRight
} from "lucide-react";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourseDetail = async () => {
            try {
                setLoading(true);
                setNotFound(false);

                const res = await axios.get(`${API_ENDPOINTS.COURSES}/${courseId}`);
                if (res.data && res.data.id) {
                    setCourse(res.data);
                } else {
                    attemptStaticFallback();
                }
            } catch (err) {
                console.warn("Course detail endpoint error, attempting fallback lookup:", err);
                attemptStaticFallback();
            } finally {
                setLoading(false);
            }
        };

        const attemptStaticFallback = () => {
            const numId = Number(courseId);
            const found = UPCOMING_LEARNING_CLUSTERS.find(
                (item) => item.id === numId || String(item.id) === courseId
            );

            if (found) {
                // Generate baseline module structure for demonstration if static fallback
                setCourse({
                    ...found,
                    duration_days: parseInt(found.duration || "30"),
                    learning_objectives: "Master key practical concepts, build production-grade projects, and prepare for industry interviews.",
                    prerequisites: "Basic programming understanding and passion to learn.",
                    modules: [
                        {
                            id: 101,
                            title: "Module 1: Foundations & Architecture",
                            description: "Core setup, foundational concepts, environment configuration, and initial project structure.",
                            sequence_order: 1,
                            lessons: [
                                { id: 1, title: "Introduction & Setup Overview", sequence_order: 1 },
                                { id: 2, title: "Core Syntax & Best Practices", sequence_order: 2 },
                                { id: 3, title: "Initial Hands-on Lab", sequence_order: 3 }
                            ]
                        },
                        {
                            id: 102,
                            title: "Module 2: Intermediate Implementation & Projects",
                            description: "Advanced data patterns, integration techniques, and building practical modules.",
                            sequence_order: 2,
                            lessons: [
                                { id: 4, title: "System Workflows & Data Handling", sequence_order: 1 },
                                { id: 5, title: "Error Handling & Optimization", sequence_order: 2 },
                                { id: 6, title: "Mid-Term Project Construction", sequence_order: 3 }
                            ]
                        },
                        {
                            id: 103,
                            title: "Module 3: Industry Project & Certification",
                            description: "Production readiness, security standards, deployment, and final evaluation project.",
                            sequence_order: 3,
                            lessons: [
                                { id: 7, title: "Production Deployment Patterns", sequence_order: 1 },
                                { id: 8, title: "Security & Optimization Audit", sequence_order: 2 },
                                { id: 9, title: "Final Capstone Project Evaluation", sequence_order: 3 }
                            ]
                        }
                    ]
                });
            } else {
                setNotFound(true);
            }
        };

        fetchCourseDetail();
    }, [courseId]);

    const toggleModule = (index: number) => {
        setOpenModuleIndex(openModuleIndex === index ? null : index);
    };

    const handleRegisterClick = () => {
        if (!course) return;
        const token = localStorage.getItem("snagup_token");
        const u = localStorage.getItem("snagup_user");

        if (!token || !u) {
            localStorage.setItem("snagup_selected_course_id", String(course.id));
            localStorage.setItem("snagup_selected_course", course.name);
            router.push(`/login?apply_course_id=${course.id}`);
        } else {
            router.push(`/home?apply_course_id=${course.id}#batches`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-muted-foreground">Loading course detail...</p>
                </div>
            </div>
        );
    }

    if (notFound || !course) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-6 pt-32">
                    <div className="bg-card border border-border rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
                        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-foreground">Course Not Found</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                The requested course ID (<span className="font-mono text-primary">{courseId}</span>) does not exist in our catalog or may have been updated.
                            </p>
                        </div>
                        <Link
                            href="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Course Catalog
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const durationText = course.duration || `${course.duration_days || 30} Days`;
    const modules = course.modules && course.modules.length > 0 ? course.modules : [];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Navbar />

            {/* Header / Hero */}
            <header className="relative pt-32 pb-16 px-6 border-b border-border/40 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Link
                        href="/courses"
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> All Courses
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                        <div className="space-y-4 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                    {course.category || "General"}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-primary" /> {durationText}
                                </span>
                                <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wide flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Enrollment Open
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                                {course.name}
                            </h1>

                            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                {course.description || "Comprehensive hands-on training program designed to master practical technical competencies and real-world project applications."}
                            </p>
                        </div>

                        {/* Quick Action Card */}
                        <div className="bg-card border border-border rounded-3xl p-6 md:w-80 shrink-0 shadow-xl space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm font-bold">
                                    <span className="text-muted-foreground">Skill Level</span>
                                    <span>{course.skillLevel || "All Levels"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm font-bold">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span>{durationText}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm font-bold">
                                    <span className="text-muted-foreground">Certificate</span>
                                    <span className="text-primary flex items-center gap-1">
                                        <Award className="w-4 h-4" /> Included
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleRegisterClick}
                                className="w-full py-3.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Register for this Course <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <main className="flex-1 py-12 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left 2 columns: Overview & Syllabus */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Objectives & Prerequisites */}
                    <section className="space-y-6 bg-card border border-border/60 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-primary" /> Course Overview & Objectives
                        </h2>

                        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                            <p>
                                {course.learning_objectives ||
                                    "This course provides structured learning designed to take students from core concepts to enterprise deployment. Students will work through interactive modules, practical coding assignments, and a capstone project."}
                            </p>

                            {course.prerequisites && (
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                    <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">Prerequisites:</p>
                                    <p className="text-xs text-muted-foreground">{course.prerequisites}</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Expandable Syllabus Modules */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Layers className="w-6 h-6 text-primary" /> Course Curriculum & Modules
                            </h2>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {modules.length} Modules Total
                            </span>
                        </div>

                        {modules.length === 0 ? (
                            <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
                                Detailed syllabus modules for this course will be published prior to batch commencement.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {modules.map((mod: any, idx: number) => {
                                    const isOpen = openModuleIndex === idx;
                                    const lessons = mod.lessons || [];

                                    return (
                                        <div
                                            key={mod.id || idx}
                                            className="bg-card border border-border/60 rounded-2xl overflow-hidden transition-colors"
                                        >
                                            <button
                                                onClick={() => toggleModule(idx)}
                                                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                                            >
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                                        Module {mod.sequence_order || idx + 1}
                                                    </span>
                                                    <h3 className="text-lg font-bold text-foreground">
                                                        {mod.title}
                                                    </h3>
                                                    {mod.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {mod.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                                                        {lessons.length} Lessons
                                                    </span>
                                                    {isOpen ? (
                                                        <ChevronUp className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="px-6 pb-6 pt-2 border-t border-border/40 space-y-3"
                                                    >
                                                        {lessons.length === 0 ? (
                                                            <p className="text-xs text-muted-foreground italic">No individual lessons listed.</p>
                                                        ) : (
                                                            lessons.map((lesson: any, lIdx: number) => (
                                                                <div
                                                                    key={lesson.id || lIdx}
                                                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/20 text-xs font-semibold text-foreground"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                                                                        <span>
                                                                            <span className="text-muted-foreground mr-2">{lIdx + 1}.</span>
                                                                            {lesson.title}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                                                        Practical Lesson
                                                                    </span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Right column: Certificate Preview & Registration Callout */}
                <div className="space-y-8">
                    {/* Certificate Preview Card */}
                    <section className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                <Award className="w-4 h-4" /> Certificate Preview
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                                Verified
                            </span>
                        </div>

                        {/* Display-only certificate sample graphic */}
                        <div className="relative border-2 border-dashed border-primary/30 rounded-2xl p-6 bg-gradient-to-br from-card via-muted/10 to-primary/5 space-y-4 text-center overflow-hidden">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                                <Award className="w-6 h-6" />
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Certificate of Completion</p>
                                <p className="text-xs font-bold text-foreground">PROUDLY PRESENTED TO</p>
                                <p className="text-sm font-black text-primary underline underline-offset-4 decoration-primary/30">[ Student Name ]</p>
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                For successfully completing all curriculum requirements & hands-on evaluation for
                            </p>

                            <p className="text-xs font-black text-foreground uppercase tracking-wide">
                                {course.name}
                            </p>

                            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                                <span>SNAGUP-CERT-SAMPLE</span>
                                <span>VERIFIED STAMP</span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
                            Official tamper-proof digital certificate with instant QR verification is granted upon course & attendance completion.
                        </p>
                    </section>

                    {/* Final Registration Card */}
                    <section className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-6 space-y-4 shadow-xl text-center">
                        <h3 className="text-xl font-black text-foreground">Ready to Elevate Your Career?</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Join the upcoming batch cohort for {course.name} and get hands-on experience under expert mentorship.
                        </p>
                        <button
                            onClick={handleRegisterClick}
                            className="w-full py-3.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            Register for this Course
                        </button>
                    </section>
                </div>
            </main>
        </div>
    );
}
