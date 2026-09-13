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
    Link as LinkIcon,
    CheckCircle,
    CheckCircle2,
    XCircle,
    HelpCircle,
    RotateCw,
    Sparkles
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { LockKeyhole as Lock } from "lucide-react";

const getEmbedUrl = (url: string) => {
    if (!url) return null;
    try {
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            if (videoId) return `https://player.vimeo.com/video/${videoId}`;
        }
        if (url.endsWith('.mp4') || url.endsWith('.webm')) {
            return url;
        }
        return null;
    } catch (e) {
        return null;
    }
};

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

    const [activeTab, setActiveTab] = useState<'classroom' | 'resources' | 'syllabus' | 'assessments'>('classroom');

    // Student Assessment State
    const [assessmentsData, setAssessmentsData] = useState<any>(null);
    const [assessmentsLoading, setAssessmentsLoading] = useState(false);
    const [assessmentsError, setAssessmentsError] = useState("");

    // Active Test Execution State
    const [activeTest, setActiveTest] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
    const [startingTestId, setStartingTestId] = useState<number | null>(null);
    const [submittingTest, setSubmittingTest] = useState(false);
    const [testError, setTestError] = useState("");
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

    // Assessment Result Modal State
    const [lastResult, setLastResult] = useState<any>(null);
    const [showResultModal, setShowResultModal] = useState(false);

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

    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [togglingLessonId, setTogglingLessonId] = useState<number | null>(null);
    const [toggleError, setToggleError] = useState<string>("");

    useEffect(() => {
        if (studentSyllabus?.modules?.length > 0) {
            const firstModule = studentSyllabus.modules[0];
            setExpandedModules(prev => {
                if (Object.keys(prev).length === 0 && firstModule?.id) {
                    return { [firstModule.id]: true };
                }
                return prev;
            });

            if (!selectedLesson && firstModule.lessons?.length > 0) {
                setSelectedLesson(firstModule.lessons[0]);
            }
        }
    }, [studentSyllabus, selectedLesson]);

    const handleToggleComplete = async (lessonId: number) => {
        try {
            setTogglingLessonId(lessonId);
            setToggleError("");
            const token = localStorage.getItem("snagup_token");
            const res = await axios.post(
                `${API_ENDPOINTS.SYLLABUS}/lessons/${lessonId}/toggle-complete`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { completed, lesson_progress } = res.data;

            setStudentSyllabus((prev: any) => {
                if (!prev) return prev;
                const updatedModules = prev.modules?.map((mod: any) => ({
                    ...mod,
                    lessons: mod.lessons?.map((les: any) =>
                        les.id === lessonId ? { ...les, completed } : les
                    )
                }));
                return {
                    ...prev,
                    modules: updatedModules,
                    lesson_progress: lesson_progress || prev.lesson_progress
                };
            });

            setSelectedLesson((prev: any) => {
                if (prev && prev.id === lessonId) {
                    return { ...prev, completed };
                }
                return prev;
            });
        } catch (err: any) {
            console.error("Failed to toggle lesson completion", err);
            setToggleError(err.response?.data?.error || "Failed to update completion status.");
        } finally {
            setTogglingLessonId(null);
        }
    };

    // Assessment API Handlers
    const fetchAssessments = async () => {
        setAssessmentsLoading(true);
        setAssessmentsError("");
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ASSESSMENTS}/student/batch/${batchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssessmentsData(res.data);
        } catch (err: any) {
            console.error("Failed to load assessments", err);
            setAssessmentsError(err.response?.data?.error || "Failed to load assessments for this course.");
        } finally {
            setAssessmentsLoading(false);
        }
    };

    useEffect(() => {
        if (batchId && activeTab === 'assessments') {
            fetchAssessments();
        }
    }, [batchId, activeTab]);

    const handleStartTest = async (assessmentId: number) => {
        setStartingTestId(assessmentId);
        setTestError("");
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.post(`${API_ENDPOINTS.ASSESSMENTS}/${assessmentId}/start`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const test = res.data;
            setActiveTest(test);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});

            if (test.time_limit_mins > 0 && test.started_at) {
                const startMs = new Date(test.started_at).getTime();
                const elapsedSec = Math.floor((Date.now() - startMs) / 1000);
                const totalSec = test.time_limit_mins * 60;
                const remainSec = Math.max(0, totalSec - elapsedSec);
                setTimeLeftSeconds(remainSec);
            } else {
                setTimeLeftSeconds(null);
            }
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to start assessment.");
        } finally {
            setStartingTestId(null);
        }
    };

    const handleSubmitTest = async () => {
        if (!activeTest) return;
        setSubmittingTest(true);
        setTestError("");
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.post(`${API_ENDPOINTS.ASSESSMENTS}/${activeTest.assessment_id}/submit`, {
                attempt_id: activeTest.attempt_id,
                answers: selectedAnswers
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const result = res.data;
            setLastResult({
                ...result,
                assessment_title: activeTest.assessment_title
            });
            setActiveTest(null);
            setTimeLeftSeconds(null);
            setShowResultModal(true);
            fetchAssessments();
        } catch (err: any) {
            setTestError(err.response?.data?.error || "Failed to submit assessment.");
        } finally {
            setSubmittingTest(false);
        }
    };

    useEffect(() => {
        if (!activeTest || timeLeftSeconds === null) return;
        if (timeLeftSeconds <= 0) {
            handleSubmitTest();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeftSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [activeTest, timeLeftSeconds]);

    const handleViewResult = async (assessmentId: number, attemptId: number) => {
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ASSESSMENTS}/${assessmentId}/result/${attemptId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLastResult(res.data);
            setShowResultModal(true);
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to load result.");
        }
    };

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
                    <button
                        onClick={() => setActiveTab('assessments')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'assessments'
                                ? "bg-background text-amber-500 shadow-xl shadow-amber-500/5 border border-amber-500/10 scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                        <Award className={`w-4 h-4 ${activeTab === 'assessments' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        Assessments
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
                                                    <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Requirement: 80% Attendance</span>
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
                                                Your learning progress and attendance are synchronized in real-time. Please maintain a minimum of <span className="text-foreground font-bold">80% attendance</span> and <span className="text-foreground font-bold">pass all course assessments</span> to unlock your automated credentials.
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
                    ) : activeTab === 'resources' ? (
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
                    ) : activeTab === 'syllabus' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Syllabus & Learning Workspace Tab */}
                            
                            {/* 1. Lesson Progress Bar & Header */}
                            <div className="bg-card rounded-3xl border border-border p-6 lg:p-8 space-y-6 shadow-sm bg-gradient-to-br from-card to-muted/20">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Curriculum Learning Workspace</h2>
                                            <p className="text-xs text-muted-foreground font-medium">Master modules and complete video lessons at your own pace</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/40 px-5 py-3 rounded-2xl border border-border/50 self-stretch sm:self-auto justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Course Progress</p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-sm font-black font-mono text-primary">
                                                    {studentSyllabus?.lesson_progress?.completed || 0} / {studentSyllabus?.lesson_progress?.total || 0} <span className="text-[10px] text-muted-foreground font-normal uppercase">Lessons</span>
                                                </p>
                                                {studentSyllabus?.assessment_progress && studentSyllabus.assessment_progress.total > 0 && (
                                                    <p className="text-sm font-black font-mono text-amber-500 border-l border-border pl-4">
                                                        {studentSyllabus.assessment_progress.passed} / {studentSyllabus.assessment_progress.total} <span className="text-[10px] text-muted-foreground font-normal uppercase">Assessments</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right sm:pl-4 sm:border-l border-border w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0">
                                            <p className="text-xl font-black font-mono text-primary">
                                                {studentSyllabus?.course_progress?.percentage ?? studentSyllabus?.lesson_progress?.percentage ?? 0}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-700 ease-out"
                                            style={{ width: `${Math.min(studentSyllabus?.course_progress?.percentage ?? studentSyllabus?.lesson_progress?.percentage ?? 0, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Main Syllabus View Layout */}
                            {syllabusLoading ? (
                                <div className="py-20 text-center bg-card rounded-3xl border border-border flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Course Syllabus...</p>
                                </div>
                            ) : !studentSyllabus || !studentSyllabus.modules || studentSyllabus.modules.length === 0 ? (
                                <div className="py-24 text-center bg-card rounded-3xl border border-border flex flex-col items-center justify-center gap-4 p-8">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">No Syllabus Content Available Yet</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm">Course modules and lessons will appear here as soon as the instructor uploads the curriculum.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    
                                    {/* Modules & Lessons Accordion List (Left Column) */}
                                    <div className="lg:col-span-5 space-y-4">
                                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Modules & Lessons</h3>
                                        <div className="space-y-3">
                                            {studentSyllabus.modules.map((mod: any, mIdx: number) => {
                                                const isExpanded = !!expandedModules[mod.id];
                                                const lessonCount = mod.lessons?.length || 0;
                                                const completedCount = mod.lessons?.filter((l: any) => l.completed).length || 0;

                                                return (
                                                    <div key={mod.id} className="bg-card rounded-2xl border border-border overflow-hidden transition-all shadow-sm">
                                                        {/* Module Header */}
                                                        <button
                                                            onClick={() => toggleModuleExpand(mod.id)}
                                                            className="w-full p-4 flex items-start justify-between text-left hover:bg-muted/30 transition-colors gap-3"
                                                        >
                                                            <div className="space-y-1 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                                        Module {mIdx + 1}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground">
                                                                        ({completedCount}/{lessonCount} Done)
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-sm font-bold text-foreground leading-tight truncate">{mod.title}</h4>
                                                                {mod.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-1 font-medium">{mod.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="p-1 rounded-lg bg-muted/50 shrink-0 mt-1">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                            </div>
                                                        </button>

                                                        {/* Lessons List inside Module */}
                                                        {isExpanded && (
                                                            <div className="border-t border-border/50 bg-muted/10 p-2 space-y-1">
                                                                {mod.lessons && mod.lessons.length > 0 ? (
                                                                    mod.lessons.map((les: any) => {
                                                                        const isSelected = selectedLesson?.id === les.id;
                                                                        return (
                                                                            <button
                                                                                key={les.id}
                                                                                onClick={() => setSelectedLesson(les)}
                                                                                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all gap-3 text-xs ${
                                                                                    isSelected
                                                                                        ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 scale-[1.01]"
                                                                                        : "hover:bg-muted/60 text-foreground"
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                                                    {les.completed ? (
                                                                                        <CheckCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-emerald-500'}`} />
                                                                                    ) : (
                                                                                        <PlayCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                                                                    )}
                                                                                    <span className="truncate">{les.title}</span>
                                                                                </div>
                                                                                {les.completed && (
                                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${
                                                                                        isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                                                    }`}>
                                                                                        Completed
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <p className="text-[11px] text-muted-foreground p-3 italic text-center">No lessons in this module yet.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Selected Lesson Content Viewer (Right Column) */}
                                    <div className="lg:col-span-7 space-y-6">
                                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Lesson Content</h3>

                                        {selectedLesson ? (
                                            <div className="bg-card rounded-3xl border border-border p-6 lg:p-8 space-y-6 shadow-sm">
                                                {/* Lesson Header & Mark Complete Action */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
                                                    <div className="space-y-1 flex-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                                            Selected Lesson
                                                        </span>
                                                        <h3 className="text-xl font-bold text-foreground leading-snug">{selectedLesson.title}</h3>
                                                    </div>

                                                    <button
                                                        onClick={() => handleToggleComplete(selectedLesson.id)}
                                                        disabled={togglingLessonId === selectedLesson.id}
                                                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${
                                                            selectedLesson.completed
                                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20"
                                                                : "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                                                        }`}
                                                    >
                                                        {togglingLessonId === selectedLesson.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : selectedLesson.completed ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                                Completed ✓
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                Mark as Complete
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {toggleError && (
                                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                                        {toggleError}
                                                    </div>
                                                )}

                                                {/* Lesson Description */}
                                                {selectedLesson.description && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Overview</h4>
                                                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedLesson.description}</p>
                                                    </div>
                                                )}

                                                {/* Embedded Video Player or Link */}
                                                {selectedLesson.video_url ? (
                                                    <div className="space-y-3 pt-2">
                                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <Video className="w-4 h-4 text-primary" /> Video Lecture
                                                        </h4>
                                                        {(() => {
                                                            const embedUrl = getEmbedUrl(selectedLesson.video_url);
                                                            if (embedUrl) {
                                                                return (
                                                                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border shadow-inner">
                                                                        <iframe
                                                                            src={embedUrl}
                                                                            title={selectedLesson.title}
                                                                            className="w-full h-full border-0"
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                            allowFullScreen
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <Video className="w-5 h-5 text-primary shrink-0" />
                                                                        <span className="text-xs font-bold truncate">{selectedLesson.video_url}</span>
                                                                    </div>
                                                                    <a
                                                                        href={selectedLesson.video_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 shrink-0"
                                                                    >
                                                                        Open Video
                                                                    </a>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : null}

                                                {/* Resource Attachment */}
                                                {selectedLesson.resource_url ? (
                                                    <div className="space-y-3 pt-2">
                                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-emerald-500" /> Learning Material & Code
                                                        </h4>
                                                        <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                                                                <span className="text-xs font-bold text-emerald-600 truncate">{selectedLesson.resource_url}</span>
                                                            </div>
                                                            <a
                                                                href={selectedLesson.resource_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 shrink-0 flex items-center gap-2"
                                                            >
                                                                <Upload className="w-3.5 h-3.5" />
                                                                Open Resource
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {!selectedLesson.video_url && !selectedLesson.resource_url && (
                                                    <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl space-y-2">
                                                        <BookOpen className="w-6 h-6 text-muted-foreground/30 mx-auto" />
                                                        <p className="text-xs font-bold text-muted-foreground">No media or learning attachment attached to this lesson.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-16 text-center bg-card border border-border rounded-3xl space-y-3">
                                                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select a lesson from the left panel to begin learning</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Assessments Tab */}
                            <div className="bg-card rounded-3xl border border-border p-6 lg:p-8 space-y-6 shadow-sm bg-gradient-to-br from-card to-muted/20">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Course Assessments & Quizzes</h2>
                                            <p className="text-xs text-muted-foreground font-medium">Verify your knowledge and track evaluation attempts for {assessmentsData?.course_name || batch?.course_name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={fetchAssessments}
                                        className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 text-xs font-bold shrink-0"
                                        title="Refresh Assessments"
                                    >
                                        <RotateCw className={`w-4 h-4 ${assessmentsLoading ? 'animate-spin' : ''}`} />
                                        Sync Status
                                    </button>
                                </div>
                            </div>

                            {assessmentsLoading ? (
                                <div className="py-20 text-center bg-card rounded-3xl border border-border flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Assessment Matrix...</p>
                                </div>
                            ) : assessmentsError ? (
                                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{assessmentsError}</span>
                                </div>
                            ) : !assessmentsData?.assessments || assessmentsData.assessments.length === 0 ? (
                                <div className="py-24 text-center bg-card rounded-3xl border border-border flex flex-col items-center justify-center gap-4 p-8">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                        <Award className="w-8 h-8 text-muted-foreground/40" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">No Assessments Assigned Yet</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm">Quizzes and evaluation tests will appear here as soon as published by the course coordinator.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {assessmentsData.assessments.map((ass: any) => {
                                        const isPassed = ass.is_passed;
                                        const hasInProgress = ass.has_in_progress;
                                        const isExhausted = ass.max_attempts > 0 && ass.remaining_attempts === 0 && !hasInProgress;

                                        return (
                                            <div key={ass.id} className="bg-card rounded-3xl border border-border/80 p-6 lg:p-8 space-y-6 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-sm">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        {ass.module_title ? (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                                                                {ass.module_title}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
                                                                Course Assessment
                                                            </span>
                                                        )}

                                                        {isPassed ? (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Passed
                                                            </span>
                                                        ) : hasInProgress ? (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-sky-500 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 animate-pulse">
                                                                ● In Progress
                                                            </span>
                                                        ) : isExhausted ? (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
                                                                Attempts Limit
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2.5 py-1 rounded-md bg-muted border border-border">
                                                                Available
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-bold text-foreground leading-snug">{ass.title}</h3>
                                                        {ass.description && (
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ass.description}</p>
                                                        )}
                                                    </div>

                                                    {/* Specs Grid */}
                                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                                        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 space-y-0.5">
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Questions</p>
                                                            <p className="text-xs font-black text-foreground">{ass.question_count} Questions</p>
                                                        </div>
                                                        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 space-y-0.5">
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Pass Threshold</p>
                                                            <p className="text-xs font-black text-amber-500">{ass.pass_percentage}% Marks</p>
                                                        </div>
                                                        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 space-y-0.5">
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Time Limit</p>
                                                            <p className="text-xs font-black text-foreground">{ass.time_limit_mins > 0 ? `${ass.time_limit_mins} Mins` : 'No Limit'}</p>
                                                        </div>
                                                        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 space-y-0.5">
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Attempts Used</p>
                                                            <p className="text-xs font-black text-foreground">{ass.attempt_count} / {ass.max_attempts > 0 ? ass.max_attempts : '∞'}</p>
                                                        </div>
                                                    </div>

                                                    {ass.attempt_count > 0 && (
                                                        <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
                                                            <span className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Best Percentage</span>
                                                            <span className="font-black text-emerald-600 font-mono text-sm">{ass.best_percentage}%</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-3">
                                                    {hasInProgress ? (
                                                        <button
                                                            onClick={() => handleStartTest(ass.id)}
                                                            disabled={startingTestId === ass.id}
                                                            className="w-full py-3.5 bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                                                        >
                                                            {startingTestId === ass.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                                            Resume Assessment
                                                        </button>
                                                    ) : isExhausted ? (
                                                        <button
                                                            disabled
                                                            className="w-full py-3.5 bg-muted text-muted-foreground rounded-xl text-xs font-black uppercase tracking-widest border border-border opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            <Lock className="w-4 h-4" /> Max Attempts Reached
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStartTest(ass.id)}
                                                            disabled={startingTestId === ass.id || ass.question_count === 0}
                                                            className="w-full py-3.5 bg-amber-500 text-amber-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                                                        >
                                                            {startingTestId === ass.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : ass.attempt_count > 0 ? (
                                                                <>
                                                                    <RotateCw className="w-4 h-4" /> Re-attempt Assessment
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PlayCircle className="w-4 h-4" /> Start Assessment
                                                                </>
                                                            )}
                                                        </button>
                                                    )}

                                                    {ass.attempts && ass.attempts.length > 0 && (
                                                        <button
                                                            onClick={() => handleViewResult(ass.id, ass.attempts[0].attempt_id)}
                                                            className="py-3.5 px-4 bg-muted/50 hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                            title="View Latest Result"
                                                        >
                                                            <Award className="w-4 h-4 text-amber-500" /> Result
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Active Test Execution Player Modal (Fullscreen Overlay) */}
            {activeTest && (
                <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-300">
                    {/* Test Player Header */}
                    <header className="h-20 px-6 lg:px-12 border-b border-border bg-card flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-foreground tracking-tight uppercase truncate max-w-md">{activeTest.assessment_title}</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Attempt #{activeTest.attempt_number} · Pass Threshold: {activeTest.pass_percentage}%
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Countdown Timer Badge */}
                            {timeLeftSeconds !== null && (
                                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-sm font-black ${
                                    timeLeftSeconds < 60
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse'
                                        : 'bg-muted/50 border-border text-amber-500'
                                }`}>
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {String(Math.floor(timeLeftSeconds / 60)).padStart(2, '0')}:
                                        {String(timeLeftSeconds % 60).padStart(2, '0')}
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to pause/exit this attempt? You can resume it anytime before the time limit expires.")) {
                                        setActiveTest(null);
                                        setTimeLeftSeconds(null);
                                        fetchAssessments();
                                    }
                                }}
                                className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-border"
                            >
                                Pause & Exit
                            </button>
                        </div>
                    </header>

                    {/* Test Player Body */}
                    <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar flex items-center justify-center">
                        <div className="max-w-3xl w-full space-y-8">
                            
                            {/* Stepper Progress */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    <span>Question {currentQuestionIndex + 1} of {activeTest.questions?.length || 0}</span>
                                    <span>{Math.round(((currentQuestionIndex + 1) / (activeTest.questions?.length || 1)) * 100)}% Completed</span>
                                </div>
                                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden border border-border/30">
                                    <div
                                        className="h-full bg-amber-500 transition-all duration-500"
                                        style={{ width: `${((currentQuestionIndex + 1) / (activeTest.questions?.length || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {testError && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{testError}</span>
                                </div>
                            )}

                            {/* Question Card */}
                            {activeTest.questions && activeTest.questions.length > currentQuestionIndex && (
                                <div className="bg-card rounded-3xl border border-border p-8 lg:p-10 space-y-8 shadow-xl">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                                {activeTest.questions[currentQuestionIndex].points} {activeTest.questions[currentQuestionIndex].points === 1 ? 'Point' : 'Points'}
                                            </span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                {activeTest.questions[currentQuestionIndex].question_type === 'tf' ? 'True / False' : 'Multiple Choice'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground leading-relaxed">
                                            {activeTest.questions[currentQuestionIndex].question_text}
                                        </h3>
                                    </div>

                                    {/* Options List */}
                                    <div className="space-y-3">
                                        {activeTest.questions[currentQuestionIndex].options?.map((opt: string, optIdx: number) => {
                                            const qId = activeTest.questions[currentQuestionIndex].id;
                                            const isSelected = selectedAnswers[qId] === optIdx;

                                            return (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => {
                                                        setSelectedAnswers(prev => ({ ...prev, [qId]: optIdx }));
                                                    }}
                                                    className={`w-full p-5 rounded-2xl text-left border text-sm font-bold transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-amber-500/10 text-amber-500 border-amber-500 shadow-md shadow-amber-500/5 scale-[1.01]"
                                                            : "bg-muted/30 border-border text-foreground hover:bg-muted/70"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black ${
                                                            isSelected ? 'border-amber-500 bg-amber-500 text-amber-950' : 'border-border text-muted-foreground'
                                                        }`}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </div>
                                                        <span>{opt}</span>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Bottom Controls */}
                            <div className="flex items-center justify-between gap-4 pt-4">
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-6 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-40 transition-all border border-border"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-2">
                                    {activeTest.questions?.map((_: any, idx: number) => {
                                        const qId = activeTest.questions[idx]?.id;
                                        const isAnswered = selectedAnswers[qId] !== undefined;
                                        const isCurrent = currentQuestionIndex === idx;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentQuestionIndex(idx)}
                                                className={`w-3 h-3 rounded-full transition-all ${
                                                    isCurrent ? 'bg-amber-500 scale-125' :
                                                    isAnswered ? 'bg-emerald-500/80' : 'bg-muted-foreground/30'
                                                }`}
                                                title={`Question ${idx + 1}`}
                                            />
                                        );
                                    })}
                                </div>

                                {currentQuestionIndex < (activeTest.questions?.length || 0) - 1 ? (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min((activeTest.questions?.length || 1) - 1, prev + 1))}
                                        className="px-6 py-3.5 bg-foreground text-background hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Next Question
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmitTest}
                                        disabled={submittingTest}
                                        className="px-8 py-3.5 bg-amber-500 text-amber-950 hover:bg-amber-400 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {submittingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                        Submit Assessment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Score & Result Modal Overlay */}
            {showResultModal && lastResult && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative animate-in zoom-in-95 duration-300">
                        <div className="flex justify-center">
                            {lastResult.is_passed ? (
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 animate-bounce">
                                    <Award className="w-10 h-10" />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                                    <XCircle className="w-10 h-10" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                lastResult.is_passed
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}>
                                {lastResult.is_passed ? '🎉 Assessment Passed' : 'Needs Review'}
                            </span>
                            <h3 className="text-2xl font-black text-foreground tracking-tight">{lastResult.assessment_title || 'Assessment Result'}</h3>
                        </div>

                        <div className="p-6 bg-muted/40 rounded-2xl border border-border/50 space-y-3">
                            <div className="text-4xl font-black font-mono tracking-tight text-foreground">
                                {lastResult.percentage}%
                            </div>
                            <p className="text-xs font-bold text-muted-foreground">
                                Score: <span className="text-foreground font-black">{lastResult.score_obtained}</span> / {lastResult.total_points} Points
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-widest">
                                Required Threshold: {lastResult.pass_percentage}%
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowResultModal(false);
                                setLastResult(null);
                            }}
                            className="w-full py-4 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Return to Workspace Assessments
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
