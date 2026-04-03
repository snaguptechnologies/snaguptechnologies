"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Award, Layers, Search, Clock, Calendar, Download, Loader2, RotateCw, X, PlayCircle, ArrowRight, CheckCircle, Video, Shield, Eye, EyeOff, AlertCircle, XCircle, FileText, Menu, LogOut, BarChart3, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import axios from "axios";
import PaymentGateway from "@/components/PaymentGateway";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { API_ENDPOINTS, BACKEND_URL } from "@/app/lib/api";

export default function StudentDashboard() {
    const router = useRouter();

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

    // Payment Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentBatch, setPaymentBatch] = useState<any>(null);
    const [transactionId, setTransactionId] = useState("");
    const [publicSettings, setPublicSettings] = useState<any>({ upi_id: "", upi_qr_image: "" });

    const [waitlistedBatches, setWaitlistedBatches] = useState<number[]>([]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowCourseModal(false);
                setShowPaymentModal(false);
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
        const itemsToRemove = ["snagup_token", "snagup_user", "snagup_role", "user_role"];
        itemsToRemove.forEach(item => localStorage.removeItem(item));
        sessionStorage.clear();
        router.replace('/login');
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

        const interval = setInterval(() => {
            fetchStats();
            fetchAvailableCourses();
            fetchWaitlistedBatches();
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
            setShowPaymentModal(false);
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
                className={`hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-2xl sticky top-0 h-screen shrink-0 p-6 transition-all duration-500 ease-in-out group/sidebar ${isSidebarCollapsed ? 'w-24' : 'w-72 shadow-2xl shadow-primary/5'}`}
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

                <nav className="space-y-4 flex-1">
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

                <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative z-10">
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
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                                {stats?.enrollments?.filter((e: any) => e.status === 'approved' && e.batch_status === 'active').length > 0 && (
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-black text-foreground">Course Progress Tracker</h2>
                                        {stats.enrollments.filter((e: any) => e.status === 'approved' && e.batch_status === 'active').map((enr: any) => {
                                            const pct = Math.min(Math.round(((enr.attended_sessions || 0) / (enr.duration_days || 1)) * 100), 100);
                                            return (
                                                <div key={enr.id} className="glass-panel p-6 rounded-2xl border border-border/50">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-bold">{enr.course_name}</span>
                                                        <span className="font-black">{pct}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'available' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loadingAvailable ? (
                                    <div className="col-span-full py-24 flex flex-col items-center justify-center">
                                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    </div>
                                ) : availableCourses?.length > 0 ? availableCourses.filter(c => !stats?.enrollments?.some((e: any) => e.course_id === c.id)).map((course) => (
                                    <div key={course.id} className="glass-panel p-8 rounded-[2rem] border border-border/20 flex flex-col">
                                        <h3 className="text-2xl font-bold mb-3">{course.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{course.description}</p>
                                        <div className="mt-auto flex justify-between items-center">
                                            <span className="text-xl font-black">₹{course.starting_price || 'TBA'}</span>
                                            <button onClick={() => openCourseDetails(course.id)} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase">Get Started</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-32 text-center text-muted-foreground">No available courses found.</div>
                                )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'my-courses' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {stats?.enrollments?.filter((e: any) => e.batch_status !== 'completed' && e.batch_status !== 'closed').length > 0 ? (
                                    stats.enrollments.filter((e: any) => e.batch_status !== 'completed' && e.batch_status !== 'closed').map((enr: any) => (
                                        <div key={enr.id} className="glass-panel p-8 rounded-[2rem] border border-border/50 flex flex-col">
                                            <div className="flex justify-between mb-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-white bg-opacity-20 ${enr.status === 'approved' ? 'bg-emerald-500' : enr.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`}>{enr.status}</span>
                                                <BookOpen className="w-6 h-6 opacity-30" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-2">{enr.course_name}</h3>
                                            <p className="text-sm text-muted-foreground mb-6">{enr.batch_name}</p>
                                            
                                            {enr.status === 'approved' && (
                                                <div className="mt-auto">
                                                    <Link href={`/dashboard/student/workspace/${enr.batch_id}`} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-black uppercase flex justify-center items-center gap-2">ENTER WORKSPACE <ArrowRight className="w-4 h-4" /></Link>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-32 text-center text-muted-foreground">No active courses found.</div>
                                )}
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
                                    {stats?.enrollments?.filter((e: any) => e.batch_status === 'completed').length > 0 ? 
                                        stats.enrollments.filter((e: any) => e.batch_status === 'completed').map((enr: any) => {
                                            const isArchived = !!enr.archived_at;
                                            const cert = stats?.certificates?.find((c: any) => c.batch_id === enr.batch_id);
                                            const hasCert = !!cert;

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
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Digital Record Verified</span>
                                                                </div>
                                                            )}
                                                            {!isArchived && (
                                                                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5 animate-pulse">
                                                                    <Clock className="w-3 h-3 text-amber-500" />
                                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Verification Pending</span>
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
                                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">Archiving Process Initiated</p>
                                                                <p className="text-[11px] leading-relaxed text-muted-foreground">Verification takes up to 48 hours. Estimated available by <span className="text-foreground font-bold">{enr.verification_deadline ? new Date(enr.verification_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '48 hours'}.</span></p>
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
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Email Address</label>
                                                    <input 
                                                        value={profileForm.email} 
                                                        onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                                                        placeholder="email@example.com" 
                                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold opacity-70 cursor-not-allowed" 
                                                        disabled
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md" onClick={() => setShowCourseModal(false)}>
                <div className="bg-card w-full max-w-3xl rounded-3xl p-10 border border-border" onClick={e => e.stopPropagation()}>
                    <h2 className="text-3xl font-black mb-2">{selectedCourse.name}</h2>
                    <p className="text-muted-foreground mb-8">{selectedCourse.description}</p>
                    <div className="space-y-4">
                        {selectedCourse.batches?.map((batch: any) => (
                            <div key={batch.id} className="p-6 bg-muted rounded-2xl flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold">{batch.name}</h4>
                                    <p className="text-xs text-muted-foreground">Ends: {batch.batch_end_date}</p>
                                </div>
                                <button onClick={() => { setPaymentBatch(batch); setShowPaymentModal(true); }} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase">Enroll ₹{batch.price}</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {showPaymentModal && paymentBatch && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-md">
                <div className="bg-card w-full max-w-lg rounded-3xl p-10 border border-border">
                    <PaymentGateway
                        batch={paymentBatch}
                        onClose={() => setShowPaymentModal(false)}
                        onSuccess={() => {
                            setShowPaymentModal(false);
                            setEnrollSuccess("Enrollment Successful! Waiting for approval.");
                            fetchStats();
                            setActiveTab('my-courses');
                        }}
                    />
                </div>
            </div>
        )}
        </>
    );
}
