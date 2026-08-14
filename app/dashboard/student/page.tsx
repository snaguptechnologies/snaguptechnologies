"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Award, Layers, Search, Clock, Calendar, Download, Loader2, RotateCw, X, PlayCircle, ArrowRight, CheckCircle, Video, Shield, Eye, EyeOff, AlertCircle, XCircle, FileText, Menu, LogOut, BarChart3, User, LockKeyhole as Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import axios from "axios";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { API_ENDPOINTS, BACKEND_URL } from "@/app/lib/api";

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

function StudentDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Protect against browser back/forward button bypassing auth
    useAuthGuard('student');

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'analytics' | 'available' | 'my-courses' | 'completed' | 'settings'>('my-courses');
    const [previousTab, setPreviousTab] = useState<string>('my-courses');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(true);
    const [availableError, setAvailableError] = useState("");

    // Profile & Password states
    const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, verify: false });
    const [settingsMessage, setSettingsMessage] = useState({ type: "", text: "" });

    // Enrollment Modal states
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrollSuccess, setEnrollSuccess] = useState("");
    const [enrollError, setEnrollError] = useState("");

    // No local payment modal state — payment opens as a separate page

    const [waitlistedBatches, setWaitlistedBatches] = useState<number[]>([]);
    const [courseSearch, setCourseSearch] = useState("");
    const [publicSettings, setPublicSettings] = useState<any>(null);

    const [myApplications, setMyApplications] = useState<any[]>([]);
    const [myActivities, setMyActivities] = useState<any[]>([]);

    const fetchApplicationsAndActivities = async () => {
        const token = localStorage.getItem("snagup_token");
        if (!token) return;
        try {
            const [appRes, actRes] = await Promise.all([
                axios.get(`${API_ENDPOINTS.APPLICATIONS}/my`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(API_ENDPOINTS.ACTIVITIES, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setMyApplications(appRes.data || []);
            setMyActivities(actRes.data || []);
        } catch (e) {
            console.warn("Could not fetch applications/activities:", e);
        }
    };

    // Handle return from payment page
    useEffect(() => {
        const paymentResult = searchParams.get('payment');
        if (paymentResult === 'success') {
            setEnrollSuccess("Payment submitted! Awaiting team verification.");
            setActiveTab('my-courses');
            // Clean the query param from the URL without a full reload
            router.replace('/dashboard/student', { scroll: false });
            fetchStats();
            fetchApplicationsAndActivities();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [searchParams]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowCourseModal(false);
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("snagup_token");
            if (!token) return router.push("/login");

            const res = await axios.get(`${API_ENDPOINTS.DASHBOARD}/student`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
            if (res.data.user) {
                setProfileForm({
                    name: res.data.user.name || "",
                    email: res.data.user.email || "",
                    phone: res.data.user.phone || ""
                });
            }
        } catch (err) {
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableCourses = async () => {
        setLoadingAvailable(true);
        setAvailableError("");
        try {
            const res = await axios.get(`${API_ENDPOINTS.COURSES}`);
            setAvailableCourses(res.data);
        } catch (err) {
            setAvailableError("Connection error: Unable to synchronize with the learning matrix.");
        } finally {
            setLoadingAvailable(false);
        }
    };

    const fetchPublicSettings = async () => {
        try {
            const res = await axios.get(`${API_ENDPOINTS.SETTINGS}/public`);
            setPublicSettings(res.data);
        } catch {
            // Non-critical: public settings (UPI, QR) may be unavailable silently
        }
    };

    const fetchWaitlistedBatches = async () => {
        try {
            const token = localStorage.getItem("snagup_token");
            if (!token) return;
            const res = await axios.get(`${API_ENDPOINTS.BATCHS}/waitlisted`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWaitlistedBatches(res.data);
        } catch (err: any) {
            console.warn("Could not fetch waitlist data:", err.response?.status);
        }
    };

    const handleNotifyMe = async (batchId: number) => {
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.BATCHS}/${batchId}/notify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWaitlistedBatches(prev => [...prev, batchId]);
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to set notification");
        }
    };

    const handleMarkGuidelineAsRead = async (batchId: number) => {
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.BATCHS}/${batchId}/read-guideline`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStats();
        } catch (err) {
            console.error("Failed to mark guideline as read");
        }
    };

    const handleLogout = () => {
        const keys = ["snagup_token", "snagup_user", "snagup_role", "user_role"];
        keys.forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        window.location.href = "/login";
    };

    useEffect(() => {
        // Global axios interceptor for 401/403
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && [401, 403].includes(error.response.status)) {
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    useEffect(() => {
        fetchStats();
        fetchAvailableCourses();
        fetchPublicSettings();
        fetchWaitlistedBatches();
        fetchApplicationsAndActivities();

        const interval = setInterval(() => {
            fetchStats();
            fetchAvailableCourses();
            fetchWaitlistedBatches();
            fetchApplicationsAndActivities();
        }, 30000);

        return () => clearInterval(interval);
    }, [router]);

    useEffect(() => {
        const handleToggle = () => setIsMobileMenuOpen(prev => !prev);
        window.addEventListener('toggleMobileMenu', handleToggle);
        return () => window.removeEventListener('toggleMobileMenu', handleToggle);
    }, []);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('sidebarStateChange', { detail: { open: isMobileMenuOpen } }));
    }, [isMobileMenuOpen]);


    const openCourseDetails = async (id: number) => {
        try {
            setEnrollSuccess("");
            setEnrollError("");
            const res = await axios.get(`${API_ENDPOINTS.COURSES}/${id}`);
            setSelectedCourse(res.data);
            setShowCourseModal(true);
        } catch (err) {
            alert("Failed to load course details");
        }
    };

    const handleEnroll = async (batchId: number, method: string = 'simulated_card', txId: string = '') => {
        const token = localStorage.getItem("snagup_token");
        if (!token) return;

        setEnrollLoading(true);
        setEnrollSuccess("");
        setEnrollError("");

        try {
            await axios.post(`${API_ENDPOINTS.ENROLLMENTS}`, {
                batch_id: batchId,
                payment_method: method,
                transaction_id: txId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrollSuccess("You would be approved by our team shortly and receive an success message");
            fetchStats();
            fetchAvailableCourses();
            setActiveTab('my-courses');
            setShowCourseModal(false);
        } catch (err: any) {
            setEnrollError(err.response?.data?.error || "Failed to enroll. You may already be enrolled.");
        } finally {
            setEnrollLoading(false);
        }
    };

    const handleClaimCertificate = async (batchId: number) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            const payload = JSON.parse(atob(token!.split('.')[1]));
            const res = await axios.post(`${API_ENDPOINTS.CERTIFICATES}/generate`, { student_id: payload.id, batch_id: batchId }, { headers: { Authorization: `Bearer ${token}` } });
            
            const certId = res.data.cert_id;
            
            // Trigger automatic download
            const link = document.createElement('a');
            link.href = `${BACKEND_URL}/certs/${certId}.pdf`;
            link.setAttribute('download', `${certId}.pdf`);
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (!res.data.exists) {
                alert("Certificate generated and downloaded successfully!");
            } else {
                alert("Certificate already generated. Downloading your existing copy.");
            }
            fetchStats();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to generate certificate");
        } finally {
            setLoading(false);
        }
    };

    const [regeneratingCerts, setRegeneratingCerts] = useState<Record<number, boolean>>({});
    const handleRegenerateCert = async (cert: any) => {
        if (!confirm('This will regenerate your certificate PDF with the latest design. Continue?')) return;
        setRegeneratingCerts(prev => ({ ...prev, [cert.id]: true }));
        try {
            const token = localStorage.getItem('snagup_token');
            await axios.post(`${API_ENDPOINTS.CERTIFICATES}/regenerate`,
                { batch_id: cert.batch_id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchStats();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to regenerate certificate');
        } finally {
            setRegeneratingCerts(prev => ({ ...prev, [cert.id]: false }));
        }
    };

    const handleClearRejection = async (enrollmentId: number) => {
        if (!confirm("This will remove the rejected enrollment from your view. You can then re-enroll from the Available Courses tab. Proceed?")) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.delete(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStats();
            fetchAvailableCourses();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to clear rejection");
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSettingsLoading(true);
        setSettingsMessage({ type: "", text: "" });
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.AUTH}/profile`, profileForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettingsMessage({ type: "success", text: "Profile updated successfully!" });
            
            // Sync localStorage user info
            const storedUser = localStorage.getItem("snagup_user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                localStorage.setItem("snagup_user", JSON.stringify({ ...userData, ...profileForm }));
            }
            
            fetchStats();

        } catch (err: any) {
            setSettingsMessage({ type: "error", text: err.response?.data?.error || "Failed to update profile" });
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return setSettingsMessage({ type: "error", text: "New passwords do not match" });
        }
        setSettingsLoading(true);
        setSettingsMessage({ type: "", text: "" });
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.AUTH}/password`, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettingsMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            setSettingsMessage({ type: "error", text: err.response?.data?.error || "Failed to change password" });
        } finally {
            setSettingsLoading(false);
        }
    };

    const tabs = [
        { id: 'analytics', label: 'My Progress', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'my-courses', label: 'My Courses', icon: <Layers className="w-5 h-5" /> },
        { id: 'available', label: 'Available Courses', icon: <Search className="w-5 h-5" /> },
        { id: 'completed', label: 'Certificates & History', icon: <Award className="w-5 h-5" /> }
    ];

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        { title: "Course Applications", value: myApplications.length, icon: <FileText className="w-6 h-6 text-sky-400" />, color: "border-sky-500/30 bg-sky-500/5" },
        { title: "Enrolled Courses", value: stats?.totalEnrollments || 0, icon: <BookOpen className="w-6 h-6 text-primary/80" />, color: "border-primary/30 bg-primary/5" },
        { title: "Certificates Earned", value: stats?.totalCertificates || 0, icon: <Award className="w-6 h-6 text-emerald-400" />, color: "border-emerald-500/30 bg-emerald-500/5" },
    ];


    return (
        <>
        {isMobileMenuOpen && (
            <div className="fixed inset-0 md:hidden" style={{ zIndex: 99999 }}>
                <div className="absolute inset-0 bg-background" onClick={() => setIsMobileMenuOpen(false)} />
                <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-card border-r border-border p-8 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                    <div className="flex justify-between items-center mb-12">
                        <div className="flex flex-col">
                            <img src="/brand-logo-v2.png" alt="Snagup Technologies" className="h-12 w-auto object-contain mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Navigation</span>
                            <span className="text-xl font-bold text-foreground">Student Portal</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-muted rounded-xl border border-border">
                            <X className="w-5 h-5 text-foreground" />
                        </button>
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-base font-bold transition-all border ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                    : "text-muted-foreground bg-muted/30 border-border/50 hover:bg-muted"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                </div>
            </div>
        )}

        <div className="flex min-h-screen bg-background text-foreground transition-all duration-500 overflow-hidden" suppressHydrationWarning>
            <aside 
                onMouseEnter={() => setIsSidebarCollapsed(false)}
                onMouseLeave={() => setIsSidebarCollapsed(true)}
                className={`hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-2xl sticky top-0 h-screen shrink-0 p-6 transition-all duration-500 ease-in-out group/sidebar overflow-hidden ${isSidebarCollapsed ? 'w-24' : 'w-72 shadow-2xl shadow-primary/5'}`}
            >
                <div className="mb-12 px-2 flex items-center justify-between">
                    {!isSidebarCollapsed ? (
                        <div className="flex flex-col animate-in fade-in duration-500">
                            <img src="/brand-logo-v2.png" alt="Snagup Technologies" className="h-14 w-auto object-contain" />
                        </div>
                    ) : (
                        <div className="w-full flex justify-center animate-in zoom-in duration-500">
                            <img src="/brand-logo-v2.png" alt="Logo" className="h-10 w-10 object-contain" />
                        </div>
                    )}
                </div>

                <nav className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar py-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 relative group/btn ${activeTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted"
                            } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                            title={isSidebarCollapsed ? tab.label : ""}
                        >
                            <div className={`transition-transform duration-500 ${activeTab === tab.id ? 'rotate-[360deg]' : 'group-hover/btn:scale-110'}`}>
                                {tab.icon}
                            </div>
                            {!isSidebarCollapsed && (
                                <span className="animate-in slide-in-from-left-4 fade-in duration-500 whitespace-nowrap overflow-hidden">
                                    {tab.label}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>


            </aside>

            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background/50 relative">
                <header className="h-20 shrink-0 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors border border-border"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-foreground tracking-tight">
                                {activeTab === 'settings' ? 'Profile Settings' : tabs.find(t => t.id === activeTab)?.label}
                            </h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
                                {activeTab === 'settings' ? 'Account Security' : 'Learning Workspace'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => {
                                if (activeTab !== 'settings') setPreviousTab(activeTab);
                                setActiveTab('settings');
                            }}
                            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${activeTab === 'settings' ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'}`}
                            title="Profile Settings"
                        >
                            <User className="w-5 h-5" />
                        </button>
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative z-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12">
                            <h1 className="text-3xl font-black text-foreground tracking-tight mb-2 uppercase">
                                {activeTab === 'available' ? 'Global Course Matrix' : 
                                 activeTab === 'my-courses' ? 'Active Operations' :
                                 activeTab === 'completed' ? 'Mission History' : 'System Configuration'}
                            </h1>
                            <p className="text-sm font-medium text-muted-foreground/60 tracking-wider">
                                {activeTab === 'available' ? 'Discover and deploy to new learning clusters' : 
                                 activeTab === 'my-courses' ? 'Monitor and manage your current training status' :
                                 activeTab === 'completed' ? 'Access your verifiable achievement records' : 'Update your personal credentials and security'}
                            </p>
                        </div>

                        {activeTab === 'analytics' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                                {/* Stat Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {statCards.map((stat, idx) => (
                                        <div key={idx} className={`glass-panel p-8 rounded-[2rem] border ${stat.color} flex items-center justify-between bg-card transition-all duration-500 hover:scale-[1.02]`}>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{stat.title}</p>
                                                <h3 className="text-4xl font-black text-foreground">{stat.value}</h3>
                                            </div>
                                            <div className="w-16 h-16 rounded-[1.25rem] bg-muted/50 flex items-center justify-center border border-border/10">
                                                {stat.icon}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* My Progress — Submitted Applications */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                        <div>
                                            <h2 className="text-2xl font-black text-foreground tracking-tight">My Progress</h2>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1 opacity-70">
                                                Real-time application & enrollment status
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                                            {myApplications.length} Applied
                                        </span>
                                    </div>

                                    {myApplications.length === 0 ? (
                                        <div className="p-8 rounded-2xl border border-border/50 bg-card/40 text-center space-y-3">
                                            <FileText className="w-8 h-8 text-muted-foreground opacity-30 mx-auto" />
                                            <p className="text-sm font-bold text-foreground">No course applications submitted yet</p>
                                            <p className="text-xs text-muted-foreground">Explore available courses and click "Join Batch" to apply.</p>
                                            <button 
                                                onClick={() => setActiveTab('available')}
                                                className="mt-2 px-5 py-2.5 bg-foreground text-background text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                                            >
                                                Browse Courses
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {myApplications.map((app: any) => (
                                                <div key={app.id} className="glass-panel p-6 rounded-2xl border border-border/50 bg-card/60 flex flex-col justify-between hover:border-primary/40 transition-all">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                                                ID: {app.app_id}
                                                            </span>
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                                app.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                app.status === 'In Progress' || app.status === 'Enrolled' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                                                                app.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            }`}>
                                                                Status: {app.status || 'Applied'}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-xl font-black text-foreground mb-2">{app.course_name}</h3>
                                                        <p className="text-xs text-muted-foreground font-medium mb-1">College: {app.college_name}</p>
                                                        {app.college_register_id && (
                                                            <p className="text-xs text-muted-foreground font-medium mb-1">Reg ID: {app.college_register_id}</p>
                                                        )}
                                                    </div>

                                                    <div className="pt-4 border-t border-border/40 mt-4 flex items-center justify-between text-[11px] text-muted-foreground font-bold">
                                                        <span>Applied: {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        <span className="text-primary font-black uppercase tracking-wider">Application Saved</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Active Course Progress Tracker */}
                                {stats?.enrollments?.filter((e: any) => e.status === 'approved').length > 0 && (
                                    <div className="space-y-6 pt-4 border-t border-border/50">
                                        <h2 className="text-2xl font-black text-foreground tracking-tight">Course Progress & Certificate Credentials</h2>
                                        {stats.enrollments.filter((e: any) => e.status === 'approved').map((enr: any) => {
                                            const pct = Math.min(Math.round(((enr.attended_sessions || 0) / (enr.duration_days || 1)) * 100), 100);
                                            const cert = stats?.certificates?.find((c: any) => c.batch_id === enr.batch_id);
                                            const hasCert = !!cert;
                                            const isUnlocked = hasCert || pct >= 80 || enr.cert_status === 'ADMIN_RELEASED' || enr.release_type === 'ADMIN_OVERRIDE';

                                            return (
                                                <div key={enr.id} className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-border/50 space-y-6 bg-card/40">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">{enr.batch_name}</span>
                                                                {isUnlocked ? (
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                                                        🏆 Certificate Available
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                                                                        <Lock className="w-3 h-3" /> Locked (&lt;80%)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="text-xl font-black text-foreground">{enr.course_name}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-3xl font-black text-foreground">{pct}%</span>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target: 80% Eligibility</p>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="space-y-1">
                                                        <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/30">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-1000 ${pct >= 80 ? 'bg-emerald-500' : 'bg-primary'}`} 
                                                                style={{ width: `${pct}%` }} 
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                            <span>0% Enrolled</span>
                                                            <span className={pct >= 80 ? 'text-emerald-500 font-black' : ''}>80% Auto Eligible</span>
                                                            <span>100% Mastery</span>
                                                        </div>
                                                    </div>

                                                    {/* Certificate Section Component */}
                                                    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-xl">
                                                        {/* Visual Certificate Mockup */}
                                                        <div className={`transition-all duration-500 ${!isUnlocked ? 'filter blur-[4px] select-none pointer-events-none opacity-40' : ''}`}>
                                                            <div className="border-4 border-foreground/70 p-6 rounded-xl bg-background text-center relative">
                                                                <div className="flex justify-center mb-2">
                                                                    <img src="/brand-logo-v2.png" alt="Snagup" className="h-8 object-contain" />
                                                                </div>
                                                                <p className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">SnagUp Technologies</p>
                                                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight mt-1">Certificate of Achievement</h4>
                                                                <p className="text-[10px] text-muted-foreground mt-2">This certificate is proudly presented to</p>
                                                                <p className="text-lg font-black text-primary my-1">{profileForm.name || 'Learner Name'}</p>
                                                                <p className="text-[10px] text-muted-foreground">for successfully meeting the required learning criteria in</p>
                                                                <p className="text-xs font-black text-foreground uppercase mt-1">{enr.course_name}</p>
                                                                <div className="flex justify-between items-end mt-4 pt-2 border-t border-border/30 text-[8px] text-muted-foreground font-mono">
                                                                    <span>{cert ? `ID: ${cert.cert_id}` : 'ID: SNAGUP-CREDENTIAL-XXXXXX'}</span>
                                                                    <span>Officially Verified Credential</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Locked State Overlay */}
                                                        {!isUnlocked && (
                                                            <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                                                                    <Lock className="w-6 h-6 text-amber-500" />
                                                                </div>
                                                                <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
                                                                    🔒 Certificate Locked
                                                                </span>
                                                                <p className="text-xs font-bold text-foreground max-w-xs mb-1">
                                                                    Reach 80% course progress to unlock your certificate.
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground font-semibold mb-4">
                                                                    Current Progress: <span className="text-primary font-black">{pct}%</span> (Threshold: 80%)
                                                                </p>
                                                                <button
                                                                    disabled
                                                                    className="px-5 py-2.5 bg-muted text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest border border-border/50 cursor-not-allowed opacity-50 flex items-center gap-2"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" /> Download Certificate
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Unlocked Controls */}
                                                        {isUnlocked && (
                                                            <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-1.5">
                                                                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                                                                    🏆 Certificate Available
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    {hasCert ? (
                                                                        <>
                                                                            <button
                                                                                onClick={() => window.open(`${BACKEND_URL}/certs/${cert.cert_id}.pdf`, '_blank')}
                                                                                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                                                            >
                                                                                <Eye className="w-3.5 h-3.5" /> View Certificate
                                                                            </button>
                                                                            <a
                                                                                href={`${BACKEND_URL}/certs/${cert.cert_id}.pdf`}
                                                                                download={`${cert.cert_id}.pdf`}
                                                                                target="_blank"
                                                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-90 transition-all shadow-md shadow-primary/20"
                                                                            >
                                                                                <Download className="w-3.5 h-3.5" /> Download Certificate
                                                                            </a>
                                                                        </>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleClaimCertificate(enr.batch_id)}
                                                                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                                                                        >
                                                                            <Award className="w-3.5 h-3.5" /> Claim Your Certificate
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* My Activity — Activity History Timeline */}
                                <div className="space-y-6 pt-6 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black text-foreground tracking-tight">My Activity</h2>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1 opacity-70">
                                                Chronological activity history timeline
                                            </p>
                                        </div>
                                    </div>

                                    {myActivities.length === 0 ? (
                                        <div className="p-8 rounded-2xl border border-border/50 bg-card/40 text-center space-y-2">
                                            <Clock className="w-8 h-8 text-muted-foreground opacity-30 mx-auto" />
                                            <p className="text-sm font-bold text-foreground">No recent activity logs</p>
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-primary/20 ml-4 space-y-8 pl-6 py-2">
                                            {myActivities.map((act: any) => (
                                                <div key={act.id} className="relative group">
                                                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                                                    <div className="glass-panel p-5 rounded-2xl border border-border/40 bg-card/40 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-black text-foreground">{act.title}</h4>
                                                            <span className="text-[10px] font-bold text-muted-foreground">
                                                                {new Date(act.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">{act.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                        {activeTab === 'available' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Header + Search */}
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                                            {availableCourses.filter(c => !stats?.enrollments?.some((e: any) => e.course_id === c.id)).length} courses available
                                        </p>
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            value={courseSearch}
                                            onChange={e => setCourseSearch(e.target.value)}
                                            placeholder="Search courses..."
                                            className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {loadingAvailable ? (
                                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                                        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Loading Courses</p>
                                    </div>
                                ) : (() => {
                                    const filtered = availableCourses
                                        .filter(c => !stats?.enrollments?.some((e: any) => e.course_id === c.id))
                                        .filter(c => !courseSearch || c.name.toLowerCase().includes(courseSearch.toLowerCase()) || c.description?.toLowerCase().includes(courseSearch.toLowerCase()));

                                    if (filtered.length === 0) return (
                                        <div className="py-32 flex flex-col items-center justify-center text-center gap-4">
                                            <div className="w-20 h-20 rounded-[2rem] bg-muted/40 border border-border/30 flex items-center justify-center">
                                                <Search className="w-8 h-8 text-muted-foreground opacity-20" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-foreground mb-1">{courseSearch ? 'No Results Found' : 'No Courses Available'}</p>
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">{courseSearch ? `No courses match "${courseSearch}"` : 'Check back later for new courses'}</p>
                                            </div>
                                            {courseSearch && <button onClick={() => setCourseSearch('')} className="text-xs font-bold text-primary hover:opacity-70 transition-opacity">Clear search</button>}
                                        </div>
                                    );

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filtered.map((course: any) => {
                                                const hasOpenEnrollment = course.open_batches > 0;
                                                const hasUpcoming = course.upcoming_batches > 0;
                                                const isActive = course.active_batches > 0;
                                                return (
                                                    <div
                                                        key={course.id}
                                                        className="group relative glass-panel rounded-[2rem] border border-border/20 flex flex-col overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
                                                    >
                                                        {/* Top accent */}
                                                        <div className={`h-1 w-full ${hasOpenEnrollment ? 'bg-gradient-to-r from-emerald-500/60 to-emerald-400/20' : hasUpcoming ? 'bg-gradient-to-r from-amber-500/60 to-amber-400/20' : 'bg-gradient-to-r from-primary/30 to-primary/5'}`} />

                                                        <div className="p-7 flex flex-col flex-1">
                                                            {/* Status Badge */}
                                                            <div className="flex items-center justify-between mb-5">
                                                                {hasOpenEnrollment ? (
                                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                                        Enrollment Open
                                                                    </span>
                                                                ) : hasUpcoming || isActive ? (
                                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                                        {isActive ? 'In Progress' : 'Upcoming'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 bg-muted/50 border border-border/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                                        Coming Soon
                                                                    </span>
                                                                )}
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-50">{course.batch_count || 0} Batches</span>
                                                            </div>

                                                            {/* Title + Description */}
                                                            <h3 className="text-lg font-black text-foreground tracking-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">{course.name}</h3>
                                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3 mb-6 flex-1">{course.description || 'No description available.'}</p>

                                                            {/* Meta Row */}
                                                            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border/30">
                                                                {course.max_duration && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="w-3 h-3 text-muted-foreground opacity-50" />
                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{course.max_duration} Days</span>
                                                                    </div>
                                                                )}
                                                                {course.active_batches > 0 && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{course.active_batches} Live</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Footer */}
                                                            <div className="flex items-center justify-end mt-auto gap-3">
                                                                <button
                                                                    onClick={() => openCourseDetails(course.id)}
                                                                    className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-primary/20"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'my-courses' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {(() => {
                                    const activeEnrollments = stats?.enrollments?.filter((e: any) => e.batch_status !== 'completed' && e.batch_status !== 'closed' && !e.attendance_completed) || [];
                                    if (activeEnrollments.length === 0) return (
                                        <div className="py-32 flex flex-col items-center justify-center text-center gap-5">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-[2rem] bg-muted/40 border border-border/30 flex items-center justify-center">
                                                    <BookOpen className="w-10 h-10 text-muted-foreground opacity-20" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                                                    <ArrowRight className="w-3 h-3 text-primary rotate-45" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-foreground mb-1">No Active Courses</p>
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Explore available courses to get started</p>
                                            </div>
                                            <button onClick={() => setActiveTab('available')} className="px-6 py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all">
                                                Browse Courses
                                            </button>
                                        </div>
                                    );

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {activeEnrollments.map((enr: any) => {
                                                const isApproved = enr.status === 'approved';
                                                const isPending = enr.status === 'pending';
                                                const isRejected = enr.status === 'rejected';
                                                return (
                                                    <div key={enr.id} className={`group relative glass-panel rounded-[2rem] border flex flex-col overflow-hidden transition-all duration-300 ${
                                                        isApproved ? 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5' :
                                                        isPending  ? 'border-amber-500/20 hover:border-amber-500/30' :
                                                        'border-rose-500/20 hover:border-rose-500/30'
                                                    }`}>
                                                        {/* Color strip */}
                                                        <div className={`h-1 w-full ${isApproved ? 'bg-gradient-to-r from-emerald-500/70 to-emerald-400/10' : isPending ? 'bg-gradient-to-r from-amber-500/70 to-amber-400/10' : 'bg-gradient-to-r from-rose-500/70 to-rose-400/10'}`} />

                                                        <div className="p-7 flex flex-col flex-1">
                                                            {/* Header row */}
                                                            <div className="flex items-start justify-between mb-5 gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                                            isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                                                            isPending  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                                                            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                                        }`}>{enr.status}</span>
                                                                        {enr.batch_status && (
                                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">{enr.batch_status}</span>
                                                                        )}
                                                                        {isApproved && enr.session_link && enr.is_finalized && (
                                                                            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 animate-pulse">
                                                                                <Video className="w-2.5 h-2.5" />
                                                                                Live Session Active
                                                                            </span>
                                                                        )}
                                                                        {enr.broadcast_message && (!enr.last_read_guideline_at || new Date(enr.broadcast_updated_at) > new Date(enr.last_read_guideline_at)) && (
                                                                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 animate-pulse">
                                                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                                                                1 New Notification
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h3 className="text-lg font-black text-foreground tracking-tight line-clamp-1">{enr.course_name}</h3>
                                                                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{enr.batch_name}</p>
                                                                </div>
                                                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                                                                    isApproved ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                                    isPending  ? 'bg-amber-500/5 border-amber-500/20' :
                                                                    'bg-rose-500/5 border-rose-500/20'
                                                                }`}>
                                                                    {isApproved ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
                                                                     isPending  ? <Clock className="w-5 h-5 text-amber-500" /> :
                                                                     <AlertCircle className="w-5 h-5 text-rose-500" />}
                                                                </div>
                                                            </div>

                                                            {/* Enrolled date */}
                                                            {enr.enrolled_at && (
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-5 opacity-50">
                                                                    Enrolled {new Date(enr.enrolled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            )}

                                                            {/* Context message */}
                                                            {isPending && (
                                                                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 mb-5">
                                                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">Payment Under Review</p>
                                                                    <p className="text-[10px] text-amber-700/60 dark:text-amber-300/50 font-medium">Our team is verifying your payment. You'll be notified once approved.</p>
                                                                </div>
                                                            )}
                                                            {isRejected && enr.admin_feedback && (
                                                                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 mb-5">
                                                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">Admin Feedback</p>
                                                                    <p className="text-[10px] text-rose-500/70 font-medium">"{enr.admin_feedback}"</p>
                                                                </div>
                                                            )}

                                                            {/* CTA */}
                                                            <div className="mt-auto pt-4 space-y-3">
                                                                {isApproved && (
                                                                    <>
                                                                        {enr.session_link && enr.is_finalized && (
                                                                            <div className="space-y-2 mb-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Active Broadcast</span>
                                                                                    {enr.session_time && (
                                                                                        <span className="text-[9px] font-bold text-muted-foreground opacity-50 flex items-center gap-1">
                                                                                            <Clock className="w-2.5 h-2.5" /> {formatTo12Hr(enr.session_time)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {(() => {
                                                                                    const canJoin = checkJoinable(enr.session_date, enr.session_time);
                                                                                    if (!canJoin) {
                                                                                        return (
                                                                                            <div className="w-full py-3 bg-muted/30 border border-border/20 text-muted-foreground rounded-xl text-[9px] font-bold uppercase tracking-widest flex flex-col items-center gap-1 opacity-70">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <Lock className="w-3 h-3" /> Join active 10m before start
                                                                                                </div>
                                                                                                <span className="text-[8px] opacity-50">{enr.session_date ? new Date(enr.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} @ {formatTo12Hr(enr.session_time)}</span>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return (
                                                                                        <a
                                                                                            href={enr.session_link}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="w-full py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all group"
                                                                                        >
                                                                                            <Video className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Join Live Session
                                                                                        </a>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                        <Link
                                                                            href={`/dashboard/student/workspace/${enr.batch_id}`}
                                                                            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-primary/20"
                                                                        >
                                                                            Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
                                                                        </Link>
                                                                    </>
                                                                )}
                                                                {isRejected && (
                                                                    <button
                                                                        onClick={() => handleClearRejection(enr.id)}
                                                                        className="w-full py-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[11px] font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-rose-500/20 active:scale-95 transition-all"
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5" /> Clear & Re-enroll
                                                                    </button>
                                                                )}
                                                                {isPending && (
                                                                    <div className="w-full py-3 bg-muted/50 border border-border/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 text-muted-foreground cursor-default">
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Awaiting Verification
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'completed' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Mission Accomplishments</h2>
                                        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase opacity-60">Verified history of your academic achievements</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <Award className="w-4 h-4 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{stats?.certificates?.length || 0} Credentials Issued</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {stats?.enrollments?.filter((e: any) => e.status === 'approved' && (e.batch_status === 'completed' || e.attendance_completed || stats?.certificates?.some((c: any) => c.batch_id === e.batch_id) || Math.min(Math.round(((e.attended_sessions || 0) / (e.duration_days || 1)) * 100), 100) >= 80 || e.cert_status === 'ADMIN_RELEASED' || e.release_type === 'ADMIN_OVERRIDE')).length > 0 ? 
                                        stats.enrollments.filter((e: any) => e.status === 'approved' && (e.batch_status === 'completed' || e.attendance_completed || stats?.certificates?.some((c: any) => c.batch_id === e.batch_id) || Math.min(Math.round(((e.attended_sessions || 0) / (e.duration_days || 1)) * 100), 100) >= 80 || e.cert_status === 'ADMIN_RELEASED' || e.release_type === 'ADMIN_OVERRIDE')).map((enr: any) => {
                                            const pct = Math.min(Math.round(((enr.attended_sessions || 0) / (enr.duration_days || 1)) * 100), 100);
                                            const cert = stats?.certificates?.find((c: any) => c.batch_id === enr.batch_id);
                                            const hasCert = !!cert;
                                            const isUnlocked = hasCert || pct >= 80 || enr.cert_status === 'ADMIN_RELEASED' || enr.release_type === 'ADMIN_OVERRIDE';
                                            const isArchived = !!enr.archived_at;
                                            const isInstructorVerified = !!enr.instructor_verified;
                                            const isAttendanceDone = !!enr.attendance_completed;

                                            return (
                                                <div key={enr.id} className="group relative glass-panel p-8 rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 hover:border-amber-500/40 transition-all duration-500 shadow-2xl shadow-amber-500/5 overflow-hidden flex flex-col min-h-[420px]">
                                                    {/* Decorative Metallic Background Elements */}
                                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />

                                                    <div className="relative z-10 flex flex-col h-full">
                                                        <div className="flex justify-between items-start mb-8">
                                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                                                                <Award className="w-7 h-7 text-amber-500" />
                                                            </div>
                                                            {hasCert && (
                                                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1.5">
                                                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Record Verified</span>
                                                                </div>
                                                            )}
                                                            {!hasCert && isInstructorVerified && !isArchived && (
                                                                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-1.5 animate-pulse">
                                                                    <Shield className="w-3 h-3 text-blue-500" />
                                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Admin Sync Pending</span>
                                                                </div>
                                                            )}
                                                            {!hasCert && isAttendanceDone && !isInstructorVerified && (
                                                                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5 animate-pulse">
                                                                    <Clock className="w-3 h-3 text-amber-500" />
                                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Instructor Review</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="space-y-1 mb-6">
                                                            <h3 className="text-2xl font-black text-foreground tracking-tight line-clamp-2 uppercase group-hover:text-amber-500 transition-colors leading-tight">{enr.course_name}</h3>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{enr.batch_name}</p>
                                                            </div>
                                                        </div>

                                                        {hasCert ? (
                                                            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 mb-8">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Credential ID</span>
                                                                    <Shield className="w-3 h-3 text-amber-500/40" />
                                                                </div>
                                                                <p className="text-xs font-mono font-bold text-amber-500/90 tracking-wider">
                                                                    {cert.cert_id}
                                                                </p>
                                                            </div>
                                                        ) : !isArchived ? (
                                                            <div className="mt-2 p-5 bg-black/20 rounded-2xl border border-white/5 space-y-2 flex-grow">
                                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">
                                                                    {isInstructorVerified ? 'Admin Final Verification' : 'Instructor Reviewing Records'}
                                                                </p>
                                                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                                                    {isInstructorVerified 
                                                                        ? 'The instructor has verified your records. Your certificate will be published within 2 days. You will be notified once the certificate is available through your respective mail account.' 
                                                                        : 'The instructor is verifying your records. Your certificate will be published within 2 days. You will be notified once the certificate is available through your respective mail account.'}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex-grow">
                                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-emerald-500/10 pb-2 mb-2">Achievement Unlocked</p>
                                                                <p className="text-[11px] leading-relaxed text-muted-foreground">Manual verification complete. You can now claim your unique digital achievement record.</p>
                                                            </div>
                                                        )}

                                                        <div className="mt-auto pt-6">
                                                            {hasCert ? (
                                                                <div className="flex gap-3">
                                                                    <a 
                                                                        href={`${BACKEND_URL}/certs/${cert.cert_id}.pdf`} 
                                                                        download={`${cert.cert_id}.pdf`} 
                                                                        target="_blank" 
                                                                        className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black text-center rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                                                    >
                                                                        <Download className="w-4 h-4" /> Download PDF
                                                                    </a>
                                                                    <button 
                                                                        onClick={() => handleRegenerateCert(cert)} 
                                                                        disabled={regeneratingCerts[cert.id]}
                                                                        className="p-4 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-2xl transition-all hover:scale-105 active:scale-90 disabled:opacity-50"
                                                                        title="Synchronize/Refresh Seal Text"
                                                                    >
                                                                        {regeneratingCerts[cert.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                                                                    </button>
                                                                </div>
                                                            ) : isArchived ? (
                                                                <button 
                                                                    onClick={() => handleClaimCertificate(enr.batch_id)} 
                                                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                                                >
                                                                    Claim Your Certificate <Award className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <div className="w-full py-4 bg-muted/50 text-muted-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed border border-border/50">
                                                                    Waiting for Seal Minting
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="col-span-full py-32 glass-panel rounded-[3rem] border border-border/50 flex flex-col items-center justify-center text-center bg-card/30">
                                                <Award className="w-20 h-20 text-muted-foreground/10 mb-8" />
                                                <h3 className="text-xl font-bold mb-2">No Achievements Yet</h3>
                                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest max-w-sm px-6">Your completed courses and verifiable records will appear here.</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                                <button 
                                    onClick={() => setActiveTab(previousTab as any)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 hover:bg-muted border border-border/50 rounded-xl text-xs font-bold transition-all mb-8 group"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    Return to {tabs.find(t => t.id === previousTab)?.label || 'Learning Workspace'}
                                </button>
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Profile Section */}
                                    <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-3xl shadow-2xl shadow-black/5">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                                <User className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Profile Identity</h2>
                                                <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase opacity-60">Manage your personal credentials</p>
                                            </div>
                                        </div>

                                        {settingsMessage.text && (
                                            <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in slide-in-from-top-2 ${settingsMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'}`}>
                                                {settingsMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                                                <span className="text-sm font-bold">{settingsMessage.text}</span>
                                            </div>
                                        )}

                                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Full Name</label>
                                                    <input 
                                                        value={profileForm.name} 
                                                        onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                                                        placeholder="Your Name" 
                                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Phone Number</label>
                                                    <input 
                                                        value={profileForm.phone} 
                                                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                                                        placeholder="+91 00000 00000" 
                                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" 
                                                    />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Email Address</label>
                                                    <input 
                                                        value={profileForm.email} 
                                                        onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                                                        placeholder="email@example.com" 
                                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-start">
                                                <button 
                                                    type="submit" 
                                                    disabled={settingsLoading} 
                                                    className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Synchronize Profile'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Security Section */}
                                    <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-3xl shadow-2xl shadow-black/5">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                                <Shield className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Encryption & Security</h2>
                                                <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase opacity-60">Update your access credentials</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleChangePassword} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Current Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={passwordForm.currentPassword} 
                                                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                                                        placeholder="••••••••" 
                                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">New Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={passwordForm.newPassword} 
                                                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                                                        placeholder="••••••••" 
                                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Confirm New Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={passwordForm.confirmPassword} 
                                                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                                                        placeholder="••••••••" 
                                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-start">
                                                <button 
                                                    type="submit" 
                                                    disabled={settingsLoading} 
                                                    className="px-10 py-4 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-foreground/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Access Keys'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>

        {showCourseModal && selectedCourse && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-lg" onClick={() => setShowCourseModal(false)}>
                <div
                    className="bg-card w-full sm:max-w-2xl max-h-[90vh] sm:rounded-3xl rounded-t-3xl border border-border/50 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-border/50 flex-shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2 opacity-70">Course Details</p>
                                <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">{selectedCourse.name}</h2>
                                {selectedCourse.description && (
                                    <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed line-clamp-2">{selectedCourse.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowCourseModal(false)}
                                className="p-2 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Success / Error banners */}
                        {enrollSuccess && (
                            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <p className="text-xs font-bold text-emerald-500">{enrollSuccess}</p>
                            </div>
                        )}
                        {enrollError && (
                            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                <p className="text-xs font-bold text-rose-500">{enrollError}</p>
                            </div>
                        )}
                    </div>

                    {/* Batch List */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar space-y-3">
                        {!selectedCourse.batches?.length ? (
                            <div className="py-20 text-center">
                                <Calendar className="w-10 h-10 text-muted-foreground opacity-20 mx-auto mb-4" />
                                <p className="text-sm font-bold text-muted-foreground">No batches scheduled yet</p>
                                <p className="text-[10px] text-muted-foreground opacity-50 mt-1 uppercase tracking-widest">Check back soon</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-4">{selectedCourse.batches.length} Available {selectedCourse.batches.length === 1 ? 'Batch' : 'Batches'}</p>
                                {selectedCourse.batches.map((batch: any) => {
                                    const isOpen = batch.batch_status === 'active' && batch.enrollment_status === 'open' && !batch.is_finalized;
                                    const isUpcoming = batch.batch_status === 'upcoming';
                                    const isTemporarilyClosed = batch.enrollment_status === 'closed' && !batch.is_finalized;
                                    const isNotified = waitlistedBatches.includes(batch.id);
                                    return (
                                        <div key={batch.id} className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                                            isOpen ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' :
                                            isUpcoming || isTemporarilyClosed ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30' :
                                            'bg-muted/30 border-border/30'
                                        }`}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                            batch.batch_status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                            batch.batch_status === 'upcoming' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                            'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {batch.batch_status === 'active' ? '● Live' : batch.batch_status === 'upcoming' ? 'Upcoming' : batch.batch_status}
                                                        </span>
                                                        {batch.enrollment_status === 'open' && !batch.is_finalized && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                                                Enrolling
                                                            </span>
                                                        )}
                                                        {isTemporarilyClosed && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                                Temporarily Closed
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-black text-foreground text-sm">{batch.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        {batch.instructor_name && (
                                                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                                <User className="w-2.5 h-2.5" />{batch.instructor_name}
                                                            </span>
                                                        )}
                                                        {(batch.enrolled_count != null && !isTemporarilyClosed) && (
                                                            <span className="text-[10px] text-muted-foreground">{batch.enrolled_count} enrolled</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {isOpen ? (
                                                        <button
                                                            disabled={enrollLoading}
                                                            onClick={async () => {
                                                                try {
                                                                    setEnrollLoading(true);
                                                                    setEnrollError("");
                                                                    setEnrollSuccess("");
                                                                    const token = localStorage.getItem("snagup_token");
                                                                    await axios.post(API_ENDPOINTS.ENROLLMENTS, { batch_id: batch.id }, {
                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                    });
                                                                    setEnrollSuccess("Application submitted successfully!");
                                                                    fetchApplicationsAndActivities();
                                                                } catch (err: any) {
                                                                    setEnrollError(err.response?.data?.error || "Failed to submit application");
                                                                } finally {
                                                                    setEnrollLoading(false);
                                                                }
                                                            }}
                                                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-wider hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            {enrollLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enroll Now'}
                                                        </button>
                                                    ) : (isUpcoming || isTemporarilyClosed) ? (
                                                        isNotified ? (
                                                            <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                                                                <CheckCircle className="w-3 h-3" /> Notified
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleNotifyMe(batch.id)}
                                                                className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                                                            >
                                                                🔔 Notify Me
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="px-4 py-2 bg-muted/50 border border-border/40 text-muted-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider">
                                                            {batch.is_finalized ? 'Finalized' : 'Closed'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-8 py-5 border-t border-border/50 flex-shrink-0 flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">Snagup Technologies</p>
                        <button onClick={() => setShowCourseModal(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        </>
    );
}

export default function StudentDashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <StudentDashboardContent />
        </Suspense>
    );
}
