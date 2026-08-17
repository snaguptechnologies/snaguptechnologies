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
    Shield,
    Upload,
    ArrowRight,
    User,
    PenLine,
    CalendarCheck,
    ChevronDown,
    ChevronRight,
    Link as LinkIcon
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { LockKeyhole as Lock } from "lucide-react";

const formatTo12Hr = (timeStr: string) => {
    if (!timeStr) return "";
    try {
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
};

const checkJoinable = (sessionDateStr: string, sessionTimeStr: string) => {
    if (!sessionDateStr || !sessionTimeStr) return false;
    try {
        const sessionDate = new Date(sessionDateStr);
        const [hours, minutes] = sessionTimeStr.split(':');
        sessionDate.setHours(parseInt(hours), parseInt(minutes), 0);
        const now = new Date();
        const diffInMinutes = (sessionDate.getTime() - now.getTime()) / 60000;
        // Joinable from 10 mins before until 2 hours after
        return diffInMinutes <= 10 && diffInMinutes > -120;
    } catch (e) {
        return false;
    }
};

export default function CourseWorkspacePage() {
    const { batchId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState<any>(null);
    const [error, setError] = useState("");
    const [markingRead, setMarkingRead] = useState(false);

    const [activeTab, setActiveTab] = useState<'classroom' | 'resources' | 'syllabus'>('classroom');

    // Student Syllabus state
    const [studentSyllabus, setStudentSyllabus] = useState<any>(null);
    const [syllabusLoading, setSyllabusLoading] = useState(false);
    const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});

    const toggleModuleExpand = (moduleId: number) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    useEffect(() => {
        if (batch?.course_id && activeTab === 'syllabus' && !studentSyllabus) {
            const fetchStudentSyllabus = async () => {
                setSyllabusLoading(true);
                try {
                    const token = localStorage.getItem("snagup_token");
                    const res = await axios.get(`${API_ENDPOINTS.SYLLABUS}/student/course/${batch.course_id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setStudentSyllabus(res.data);
                } catch (err) {
                    console.error("Failed to load student syllabus", err);
                } finally {
                    setSyllabusLoading(false);
                }
            };
            fetchStudentSyllabus();
        }
    }, [batch?.course_id, activeTab, studentSyllabus]);

    const handleMarkAsRead = async () => {
        try {
            setMarkingRead(true);
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.BATCHS}/${batchId}/read-guideline`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatch((prev: any) => ({ ...prev, last_read_guideline_at: new Date().toISOString() }));
        } catch (err) {
            console.error("Failed to mark as read");
        } finally {
            setMarkingRead(false);
        }
    };

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
            <nav className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-border bg-background sticky top-0 z-50 backdrop-blur-md">
                <button
                    onClick={() => router.push("/dashboard/student")}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-[11px] font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    Student Portal
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-opacity-30">Course Instance</span>
                    <span className="text-[9px] font-mono text-muted-foreground text-opacity-50 bg-muted/50 px-2 py-0.5 rounded border border-border">{batchId?.toString().slice(0, 12)}</span>
                    <div className="w-px h-4 bg-border mx-2"></div>
                    <ThemeToggle />
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 lg:px-12 mt-12 lg:mt-16 space-y-12">
                {/* Dashboard Summary area */}
                <div className="pb-12 border-b border-border flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
                    <div className="max-w-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-md">
                                {batch.batch_status === 'active' ? '● LIVE INSTANCE' : batch.batch_status.toUpperCase()}
                            </span>
                            <span className="text-[9px] text-muted-foreground text-opacity-50 font-bold uppercase tracking-widest">
                                {batch.category}
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-none">
                            {batch.course_name}
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium max-w-lg">
                            Batch: <span className="font-bold text-foreground">{batch.name}</span> · Fast-track learning spearheaded by <span className="text-primary font-bold">{batch.instructor_name || 'Expert Faculty'}</span>.
                        </p>
                    </div>

                    <div className="flex gap-8">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground text-opacity-30 uppercase tracking-[0.2em]">Compliance</p>
                            <p className="text-2xl font-black font-mono tracking-tighter text-primary">{batch.attendance.percentage}%</p>
                        </div>
                        <div className="w-px h-10 bg-muted/50 mt-auto"></div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground text-opacity-30 uppercase tracking-[0.2em]">Activity</p>
                            <p className="text-2xl font-black font-mono tracking-tighter">
                                {batch.attendance.attendedClasses}<span className="text-xs text-muted-foreground text-opacity-30 font-bold">/{batch.attendance.totalClasses}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-2xl w-fit border border-border/50">
                    <button
                        onClick={() => setActiveTab('classroom')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'classroom'
                                ? "bg-background text-primary shadow-xl shadow-primary/5 border border-primary/10 scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                        <Video className={`w-4 h-4 ${activeTab === 'classroom' ? 'text-primary' : 'text-muted-foreground'}`} />
                        Workspace
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'resources'
                                ? "bg-background text-emerald-500 shadow-xl shadow-emerald-500/5 border border-emerald-500/10 scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                        <FileText className={`w-4 h-4 ${activeTab === 'resources' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        Resources
                    </button>
                    <button
                        onClick={() => setActiveTab('syllabus')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'syllabus'
                                ? "bg-background text-primary shadow-xl shadow-primary/5 border border-primary/10 scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                        <BookOpen className={`w-4 h-4 ${activeTab === 'syllabus' ? 'text-primary' : 'text-muted-foreground'}`} />
                        Syllabus & Curriculum
                    </button>
                </div>

                {/* Focused Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {activeTab === 'classroom' ? (
                        <div className="space-y-12">
                            {/* Compliance & Track Card (From User Screenshot) */}
                            <div className="bg-card rounded-3xl border border-border p-8 lg:p-12 space-y-12 shadow-sm bg-gradient-to-br from-card to-muted/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 animate-in fade-in duration-1000"></div>
                                <h3 className="text-[10px] font-black text-muted-foreground text-opacity-40 uppercase tracking-[0.4em]">Compliance & Track</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-6xl font-black font-mono tracking-tighter text-primary transition-all hover:scale-105 cursor-default">{batch.attendance.percentage}%</span>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${batch.attendance.eligibleForCertificate ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted/80 text-muted-foreground border-border'}`}>
                                                        {batch.attendance.eligibleForCertificate ? 'Eligible' : 'Certification Restricted'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Requirement: 75% Marks</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                                    style={{ width: `${Math.min(batch.attendance.percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-6 border-t border-border/50">
                                            {[
                                                { label: "Course Term", value: `${batch.duration_days} Days`, icon: Clock },
                                                { label: "Batch Name", value: batch.name, icon: Layers },
                                                { label: "Instructor", value: batch.instructor_name || "Expert Faculty", icon: User },
                                                { label: "Certificate", value: "Verified e-Pass", icon: Award },
                                                { label: "Instruction", value: "Live Sync", icon: BookOpen },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                            <item.icon className="w-3.5 h-3.5 text-muted-foreground text-opacity-30 group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-opacity-50 group-hover:text-foreground transition-colors">{item.label}</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-foreground">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="p-8 rounded-3xl bg-background/50 border border-border/50 backdrop-blur-sm space-y-6">
                                            <div className="flex items-center gap-3">
                                                <Video className="w-5 h-5 text-primary" />
                                                <h4 className="text-sm font-black uppercase tracking-tight">Deployment Node</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Your learning progress and attendance are synchronized in real-time. Please maintain a minimum of <span className="text-foreground font-bold">75% attendance</span> to unlock your automated credentials.
                                            </p>
                                            <div className="pt-2 flex items-center gap-4 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                                                <Shield className="w-3.5 h-3.5" />
                                                Identity Verified
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Session Container */}
                            <section className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                                <div className="p-8 lg:p-12">
                                    <header className="flex items-center justify-between mb-10 pb-6 border-b border-border">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${batch.is_finalized ? 'bg-primary animate-pulse' : 'bg-primary/20'}`}></div>
                                                Live Classroom
                                            </h2>
                                            {!batch.is_finalized && (
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-md">
                                                    Restricted Access
                                                </span>
                                            )}
                                        </div>
                                        <Video className="w-5 h-5 text-primary opacity-30" />
                                    </header>

                                    {batch.session_link && batch.is_finalized ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {batch.session_time && (
                                                    <div className="p-6 rounded-2xl bg-muted/40 border border-border shadow-inner space-y-3">
                                                        <p className="text-[9px] font-black text-muted-foreground text-opacity-30 uppercase tracking-[0.3em]">Next Sync Window</p>
                                                        <p className="text-sm font-black flex items-center gap-3">
                                                            <CalendarCheck className="w-4 h-4 text-primary" /> 
                                                            {batch.session_date ? new Date(batch.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Everyday"}
                                                            <span className="text-muted-foreground text-opacity-20 px-2">|</span>
                                                            {formatTo12Hr(batch.session_time)}
                                                        </p>
                                                    </div>
                                                )}
                                                {batch.session_message && (
                                                    <div className="p-6 rounded-2xl bg-muted/40 border border-border shadow-inner space-y-3">
                                                        <p className="text-[9px] font-black text-muted-foreground text-opacity-30 uppercase tracking-[0.3em]">Instructor Broadcast</p>
                                                        <p className="text-[12px] text-foreground leading-relaxed font-bold italic">"{batch.session_message}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4">
                                                {(() => {
                                                    const canJoin = checkJoinable(batch.session_date, batch.session_time);
                                                    if (!canJoin) {
                                                        return (
                                                            <div className="inline-flex items-center gap-4 px-8 py-4 bg-muted/50 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                                                <Lock className="w-4 h-4" /> 
                                                                <span>Link activates exact 10 mins before start</span>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20"></span>
                                                                <span>IST Standard Time</span>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <a
                                                            href={batch.session_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex bg-primary text-primary-foreground py-4 px-12 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 hover:shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-4 group active:scale-95"
                                                        >
                                                            <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                            Enter Classroom Environment
                                                        </a>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {batch.session_message && (
                                                <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3 border-dashed">
                                                    <p className="text-[9px] font-black text-muted-foreground text-opacity-30 uppercase tracking-[0.3em]">Instructor Memo</p>
                                                    <p className="text-[12px] text-muted-foreground/80 leading-relaxed font-bold italic">"{batch.session_message}"</p>
                                                </div>
                                            )}
                                            <div className="py-24 text-center bg-muted/20 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center gap-6">
                                                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                                                    <Lock className="w-8 h-8 text-muted-foreground/20" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-opacity-40">
                                                        {batch.is_finalized ? 'Class deployment pending' : 'Roster Locking in Progress'}
                                                    </p>
                                                    <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest">
                                                        {batch.is_finalized ? 'The instructor is finalizing the sync. Check back in a few moments.' : 'Classroom nodes will activate after admin authentication.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Pre-Finalization Guidelines Notification (Floating) */}
                            {batch.broadcast_message && !batch.is_finalized && (
                                <section className="bg-amber-500/5 rounded-3xl border border-amber-500/20 p-8 lg:p-10 relative overflow-hidden group shadow-xl shadow-amber-500/5">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="flex items-start gap-8">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                                            <Shield className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-500/80">Instructional Guidelines</h3>
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                </div>
                                                {(!batch.last_read_guideline_at || new Date(batch.broadcast_updated_at) > new Date(batch.last_read_guideline_at)) && (
                                                    <button
                                                        onClick={handleMarkAsRead}
                                                        disabled={markingRead}
                                                        className="px-4 py-1.5 bg-amber-500 text-amber-950 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {markingRead ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Acknowledge'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[13px] font-bold leading-relaxed italic text-foreground/80 border-l-4 border-amber-500/30 pl-4">
                                                "{batch.broadcast_message}"
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Resource Channel (One-way Broadcast) */}
                            <section className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm min-h-[600px] flex flex-col">
                                <header className="p-8 lg:p-10 border-b border-border bg-muted/10 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5 shrink-0">
                                            <FileText className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Resource Channel</h3>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">Official Archive & Assets</p>
                                        </div>
                                    </div>
                                    {(!batch.materials || batch.materials.length === 0) && (
                                        <span className="px-4 py-1.5 bg-muted/60 text-[10px] font-black text-muted-foreground uppercase tracking-widest rounded-full border border-border">Encrypted Stream</span>
                                    )}
                                </header>

                                <div className="p-8 lg:p-12 flex-1">
                                    {batch.materials && batch.materials.length > 0 && batch.is_finalized === 1 ? (
                                        <div className="flex flex-col gap-12">
                                            {/* Materials Rendered in Reversed Order (Newest at Bottom) */}
                                            {[...batch.materials].reverse().map((item: any, idx: number) => (
                                                <div key={item.id} className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                                                    <div className="flex items-start gap-4 w-full">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                                            <User className="w-5 h-5 text-emerald-600" />
                                                        </div>
                                                        <div className="flex flex-col gap-3 flex-1 max-w-[90%] sm:max-w-[75%]">
                                                            <div className="bg-muted/40 backdrop-blur-md border border-border/80 p-6 sm:p-8 rounded-[2rem] rounded-tl-none shadow-sm space-y-6">
                                                                {item.message && (
                                                                    <p className="text-[14px] font-bold text-foreground leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/20">
                                                                        {item.message}
                                                                    </p>
                                                                )}
                                                                
                                                                {item.link && (
                                                                    <div className="p-4 sm:p-5 bg-background border border-border/50 rounded-2xl flex items-center justify-between gap-4 sm:gap-8 group/file hover:border-emerald-500/40 transition-all shadow-lg active:scale-[0.99] cursor-pointer" onClick={() => window.open(item.link, '_blank')}>
                                                                        <div className="flex items-center gap-4 sm:gap-5 overflow-hidden">
                                                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover/file:scale-105 transition-transform duration-500">
                                                                                <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                                                                            </div>
                                                                            <div className="min-w-0 space-y-1">
                                                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">Asset Node</p>
                                                                                <p className="text-[10px] sm:text-xs text-emerald-600 font-black truncate max-w-[120px] sm:max-w-[280px]">{item.link}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div 
                                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 shrink-0"
                                                                        >
                                                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 px-3">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></span>
                                                                <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">
                                                                    {new Date(item.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Chat anchor for recent messages */}
                                            <div className="pt-8 flex items-center justify-center gap-4">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/30"></div>
                                                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/20">End of History</span>
                                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/30"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20 opacity-30">
                                            <div className="w-24 h-24 rounded-[3rem] bg-muted/50 border border-border flex items-center justify-center animate-pulse">
                                                <Lock className="w-12 h-12 text-muted-foreground/20" />
                                            </div>
                                            <div className="max-w-[320px] space-y-3">
                                                <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Asset History Restricted</h4>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed font-black uppercase tracking-widest">
                                                    {batch.is_finalized ? 'Workspace successfully decrypted. Waiting for primary instructor to sync shared assets.' : 'Material nodes will activate upon batch finalization.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <footer className="p-8 bg-muted/5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-muted-foreground opacity-30" />
                                        <p className="text-[10px] font-black text-muted-foreground text-opacity-30 uppercase tracking-[0.4em]">Identity Aware Encryption Stream</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[9px] font-black text-emerald-600/50 uppercase tracking-widest">Authenticated & Secure</span>
                                    </div>
                                </footer>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
