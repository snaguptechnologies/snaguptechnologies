"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    BookOpen,
    Layers,
    Video,
    FileText,
    PlayCircle,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Clock,
    Award,
    Shield
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";

export default function CourseWorkspacePage() {
    const { batchId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWorkspaceData = async () => {
            try {
                const token = localStorage.getItem("snagup_token");
                if (!token) {
                    router.push("/login");
                    return;
                }
                const res = await axios.get(`${API_ENDPOINTS.BATCHS}/${batchId}/workspace`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBatch(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || "Failed to load course workspace");
            } finally {
                setLoading(false);
            }
        };

        if (batchId) fetchWorkspaceData();
    }, [batchId, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-border border-t-white rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-opacity-50">Initializing Workspace</p>
                </div>
            </div>
        );
    }

    if (error || !batch) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="max-w-md w-full bg-card border border-border p-12 rounded-2xl text-center space-y-8">
                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto border border-border">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Access Restricted</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">{error || "The workspace could not be verified for your account."}</p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/student")}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 hover:bg-primary transition-all active:scale-[0.98]"
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground text-opacity-90 pb-32 font-sans selection:bg-primary selection:text-primary-foreground antialiased">

            {/* Top Navigation Bar - Low Profile */}
            <nav className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-border bg-background">
                <button
                    onClick={() => router.push("/dashboard/student")}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-[11px] font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    Workspace
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-opacity-30">Node ID</span>
                    <span className="text-[9px] font-mono text-muted-foreground text-opacity-50 bg-muted/50 px-2 py-0.5 rounded border border-border">{batchId?.toString().slice(0, 12)}</span>
                <div className="w-px h-4 bg-border mx-2"></div><ThemeToggle />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 lg:px-12 mt-12 lg:mt-20">
                {/* Dashboard Summary area */}
                <div className="mb-16 pb-12 border-b border-border lg:flex lg:items-end lg:justify-between gap-12">
                    <div className="max-w-3xl space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 bg-muted/50 border border-border text-muted-foreground rounded">
                                {batch.batch_status}
                            </span>
                            <span className="text-[10px] text-muted-foreground text-opacity-50 font-bold uppercase tracking-widest">
                                {batch.category}
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-none">
                            {batch.course_name}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium max-w-xl">
                            Learning path facilitated by <span className="text-muted-foreground">{batch.instructor_name || 'Expert Faculty'}</span>. All data is synchronized directly from the learning platform.
                        </p>
                    </div>

                    <div className="flex gap-10 mt-10 lg:mt-0">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground text-opacity-30 uppercase tracking-widest">Attendance</p>
                            <p className="text-3xl font-black font-mono tracking-tighter">{batch.attendance.percentage}%</p>
                        </div>
                        <div className="w-px h-10 bg-muted/50 mt-auto"></div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground text-opacity-30 uppercase tracking-widest">Progress</p>
                            <p className="text-3xl font-black font-mono tracking-tighter">
                                {batch.attendance.attendedClasses}<span className="text-sm text-muted-foreground text-opacity-30 font-bold">/{batch.attendance.totalClasses}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Primary Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

                    {/* Primary Feed */}
                    <div className="lg:col-span-8 space-y-16">

                        {/* INSTRUCTOR BROADCAST GUIDELINES */}
                        {batch.broadcast_message && (
                            <section className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/20 p-8 lg:p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 dark:bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700"></div>
                                <div className="flex items-start gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-500/20 shadow-sm shadow-amber-500/5">
                                        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-amber-500/70 border-b border-amber-300 dark:border-amber-500/20 pb-1">Essential Guidelines</h3>
                                            <span className="text-[9px] font-bold text-neutral-500 dark:text-amber-500/30 uppercase tracking-widest">Priority Sync</span>
                                        </div>
                                        <p className="text-sm font-black leading-relaxed italic" style={{ color: "var(--foreground)" }}>
                                            "{batch.broadcast_message}"
                                        </p>
                                        <div className="pt-2 flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-600 dark:bg-amber-500/40"></div>
                                            <span className="text-[9px] font-bold text-neutral-600 dark:text-amber-500/40 uppercase tracking-widest">Posted by {batch.instructor_name || 'Instructor'}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Live Session Container */}
                        <section className="bg-card rounded-2xl border border-border overflow-hidden">
                            <div className="p-8 lg:p-10">
                                <header className="flex items-center justify-between mb-10 pb-6 border-b border-border">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-lg font-bold tracking-tight flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${batch.is_finalized ? 'bg-primary animate-pulse' : 'bg-primary/20'}`}></div>
                                            Live Classroom
                                        </h2>
                                        {!batch.is_finalized && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 text-black dark:text-amber-500 border border-amber-400 dark:border-amber-500/20 rounded">
                                                Finalization Pending
                                            </span>
                                        )}
                                    </div>
                                    <Video className="w-5 h-5 text-muted-foreground text-opacity-30" />
                                </header>

                                {batch.session_link && batch.is_finalized ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {batch.session_time && (
                                                <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-2">
                                                    <p className="text-[9px] font-bold text-muted-foreground text-opacity-30 uppercase tracking-widest">Next Broadcast</p>
                                                    <p className="text-xs font-bold flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground text-opacity-50" /> {batch.session_time}
                                                    </p>
                                                </div>
                                            )}
                                            {batch.session_message && (
                                                <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-2">
                                                    <p className="text-[9px] font-bold text-muted-foreground text-opacity-30 uppercase tracking-widest">Instructor Note</p>
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">"{batch.session_message}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                            <a
                                                href={batch.session_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-primary py-3 px-8 rounded-xl text-xs font-extrabold uppercase tracking-widest hover:opacity-90 hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                                
                                            >
                                                <PlayCircle className="w-4 h-4 text-primary-foreground" />
                                                Join Live Session
                                            </a>
                                            <button className="py-2.5 px-6 border border-border rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground">
                                                Outlook Sync
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {batch.session_message && (
                                            <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-2 border-dashed">
                                                <p className="text-[9px] font-bold text-muted-foreground text-opacity-30 uppercase tracking-widest">Message from Instructor</p>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium italic">"{batch.session_message}"</p>
                                            </div>
                                        )}
                                        <div className="py-16 text-center bg-primary/[0.02] rounded-xl border border-dashed border-border">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-opacity-30">
                                                {batch.is_finalized ? 'Class deployment pending' : 'Syncing classroom assets...'}
                                            </p>
                                            {!batch.is_finalized && (
                                                <p className="text-[9px] text-muted-foreground text-opacity-20 mt-2 font-medium">Classroom links will activate once enrollment is finalized by admin.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Learning Materials Container */}
                        <section className="bg-card rounded-2xl border border-border p-8 lg:p-10 space-y-8">
                            <header className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">Knowledge Vault</h3>
                                <FileText className="w-5 h-5 text-muted-foreground text-opacity-20" />
                            </header>

                             {(batch.material_link || batch.material_message) && batch.is_finalized === 1 ? (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-xl border border-border bg-muted/50 flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-muted transition-all">
                                        <div className="flex items-center gap-5 text-center md:text-left">
                                            <div className="w-12 h-12 rounded-lg bg-black border border-border flex items-center justify-center shrink-0">
                                                <Layers className="w-5 h-5 text-muted-foreground text-opacity-50 group-hover:text-muted-foreground transition-colors" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold">Training Materials</h4>
                                                <p className="text-[11px] text-muted-foreground text-opacity-50 leading-relaxed font-medium max-w-sm">
                                                    {batch.material_message || "Access documents, curriculum files, and supplementary content."}
                                                </p>
                                            </div>
                                        </div>
                                        {batch.material_link && (
                                            <a
                                                href={batch.material_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full md:w-auto py-2.5 px-8 border border-border text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all text-center active:scale-[0.98]"
                                            >
                                                Open Vault
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center border border-dashed border-border rounded-xl opacity-30">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">
                                        {batch.is_finalized ? 'No assets shared' : 'Vault locked during enrollment phase'}
                                    </p>
                                    {!batch.is_finalized && (
                                        <p className="text-[9px] mt-2 font-medium">Resources will appear here once the batch is finalized.</p>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <aside className="lg:col-span-4 space-y-10">

                        {/* Status Tracker */}
                        <div className="bg-card rounded-2xl border border-border p-8 lg:p-10 space-y-12">
                            <h3 className="text-[10px] font-bold text-muted-foreground text-opacity-30 uppercase tracking-[0.3em]">Compliance & Track</h3>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-4xl font-black font-mono tracking-tighter">{batch.attendance.percentage}%</span>
                                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${batch.attendance.eligibleForCertificate ? 'bg-muted text-foreground border border-border' : 'bg-muted/50 text-muted-foreground text-opacity-30 border border-border'}`}>
                                            {batch.attendance.eligibleForCertificate ? 'Eligible' : 'Requirement: 75%'}
                                        </span>
                                    </div>
                                    <div className="h-0.5 bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${Math.min(batch.attendance.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-border">
                                    {[
                                        { label: "Course Term", value: `${batch.duration_days} Days`, icon: Clock },
                                        { label: "Certificate", value: "Verified e-Pass", icon: Award },
                                        { label: "Instruction", value: "Live Sync", icon: BookOpen },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <item.icon className="w-3.5 h-3.5 text-muted-foreground text-opacity-30 group-hover:text-muted-foreground transition-colors" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-opacity-50">{item.label}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-muted-foreground">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ID Tag */}
                        <div className="p-6 rounded-2xl border border-border bg-card flex items-center justify-between opacity-50 text-[9px] font-bold uppercase tracking-[0.2em]">
                            <span className="text-muted-foreground">Build Version</span>
                            <span className="font-mono text-muted-foreground text-opacity-30 tracking-normal">v1.2.4-stable</span>
                        </div>

                    </aside>
                </div>
            </main>
        </div>
    );
}
