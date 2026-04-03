"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, User, Layers, CalendarCheck, FileText, X, Check, XCircle, Loader2, Clock, PlayCircle, ArrowLeft, Send, ArrowRight, Shield, Award, CheckCircle, Eye, EyeOff, Menu, BookOpen, LogOut, PenLine, Upload, Trash2, Settings, BarChart3, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

export default function InstructorDashboard() {
    const router = useRouter();

    // Protect against browser back/forward button bypassing auth
    useAuthGuard('instructor');

    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [stats, setStats] = useState<any>(null);

    // Modal states
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [activeBatch, setActiveBatch] = useState<any>(null);
    const [attendanceDate, setAttendanceDate] = useState(() => {
        const d = new Date();
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    });
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
    const [markingLoading, setMarkingLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [pastAttendanceDates, setPastAttendanceDates] = useState<string[]>([]);
    const [pastAttendanceLoading, setPastAttendanceLoading] = useState(false);
    const [linkLoading, setLinkLoading] = useState<Record<string, boolean>>({});
    const [materialLoading, setMaterialLoading] = useState<Record<string, boolean>>({});
    const [sessionLinks, setSessionLinks] = useState<Record<string, string>>({});
    const [sessionTimes, setSessionTimes] = useState<Record<string, string>>({});
    const [sessionMessage, setSessionMessage] = useState<Record<string, string>>({});
    const [sessionDates, setSessionDates] = useState<Record<string, string>>({});
    const [materialLinks, setMaterialLinks] = useState<Record<string, string>>({});
    const [materialMessages, setMaterialMessages] = useState<Record<string, string>>({});
    const [manageBatch, setManageBatch] = useState<any>(null);
    const [manageBatchTab, setManageBatchTab] = useState<'sessions' | 'attendance' | 'guidelines'>('sessions');
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [broadcastMode, setBroadcastMode] = useState<'portal' | 'email' | 'both'>('both');
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [reminderLoading, setReminderLoading] = useState<Record<string, boolean>>({});
    const [syncing, setSyncing] = useState(false);

    // Settings & Tabs
    const [activeTab, setActiveTab] = useState<'analytics' | 'batches' | 'history' | 'settings'>('batches');
    const [previousTab, setPreviousTab] = useState<string>('batches');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedHistoryBatchId, setSelectedHistoryBatchId] = useState<string>("");
    const [historyAttendanceData, setHistoryAttendanceData] = useState<any>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState({ type: "", text: "" });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, verify: false });

    const navItems = [
        { id: 'analytics', label: 'Analytics Insights', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'batches', label: 'My Assigned Batches', icon: <Layers className="w-5 h-5" /> },
        { id: 'history', label: 'Attendance History', icon: <BookOpen className="w-5 h-5" /> },
    ];



    const fetchStats = async () => {
        setSyncing(true);
        try {
            const token = localStorage.getItem("snagup_token");
            if (!token) return router.push("/login");

            const res = await axios.get(`${API_ENDPOINTS.DASHBOARD}/instructor`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);

            // If currently managing a batch, update the local reference from the fresh data
            if (manageBatch) {
                const fresh = res.data.myBatches?.find((b: any) => b.id === manageBatch.id);
                if (fresh) setManageBatch(fresh);
            }

            // Initialize/Update references
            const links: Record<string, string> = {};
            const times: Record<string, string> = {};
            const dates: Record<string, string> = {};
            const msgs: Record<string, string> = {};
            const mLinks: Record<string, string> = {};
            const mMsgs: Record<string, string> = {};

            // Calculate current local date/time for defaults
            const now = new Date();
            const localISO = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
            const defaultDate = localISO.split('T')[0];
            const defaultTime = localISO.split('T')[1].substring(0, 5);

            res.data.myBatches?.forEach((b: any) => {
                links[b.id] = b.session_link || "";

                // Default to current date/time if no session is set OR if set session is in the past
                let shouldUseDefault = !b.session_date || !b.session_time;
                if (!shouldUseDefault) {
                    const planDateTime = new Date(`${b.session_date}T${b.session_time}`);
                    if (planDateTime < now) shouldUseDefault = true;
                }

                times[b.id] = shouldUseDefault ? defaultTime : b.session_time;
                dates[b.id] = shouldUseDefault ? defaultDate : b.session_date;

                msgs[b.id] = b.session_message || "";
                mLinks[b.id] = b.material_link || "";
                mMsgs[b.id] = b.material_message || "";
            });
            setSessionLinks(links);
            setSessionTimes(times);
            setSessionDates(dates);
            setSessionMessage(msgs);
            setMaterialLinks(mLinks);
            setMaterialMessages(mMsgs);

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
            setSyncing(false);
        }
    };

    const handleBroadcast = async (batchId: number) => {
        if (!broadcastMessage.trim()) return alert("Please enter a guideline message.");
        setBroadcastLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.BATCHS}/${batchId}/broadcast`, {
                message: broadcastMessage,
                mode: broadcastMode
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert(`Message broadcasted via ${broadcastMode}!`);
            setBroadcastMessage("");
            fetchStats();
        } catch (err: any) {
            alert(err.response?.data?.error || "Broadcast failed");
        } finally {
            setBroadcastLoading(false);
        }
    };

    const handleDeleteBroadcast = async (batchId: number) => {
        if (!confirm("Are you sure you want to delete the published guideline from the student portal?")) return;
        setBroadcastLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.delete(`${API_ENDPOINTS.BATCHS}/${batchId}/broadcast`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Guideline removed from portal.");
            fetchStats();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to delete guideline");
        } finally {
            setBroadcastLoading(false);
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

        // Implement 30s polling for real-time consistency
        const interval = setInterval(() => {
            fetchStats();
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

    // Load students for active batch and date
    useEffect(() => {
        if (!activeBatch || !attendanceDate) return;
        const fetchStudents = async () => {
            setStudentsLoading(true);
            try {
                const token = localStorage.getItem("snagup_token");
                const res = await axios.get(`${API_ENDPOINTS.ATTENDANCE}/batch/${activeBatch.id}/date/${attendanceDate}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(res.data);

                // Init records mapping
                const initialMap: Record<string, string> = {};
                res.data.forEach((s: any) => {
                    initialMap[s.id] = s.attendance_status || 'present'; // default present
                });
                setAttendanceRecords(initialMap);
            } catch (err: any) {
                console.error("Failed to load students", err);
                if (err.response) {
                    console.error("Server Error Details:", err.response.data);
                    if (err.response.status === 401) {
                        localStorage.removeItem("snagup_token");
                        router.push("/login");
                    }
                }
            } finally {
                setStudentsLoading(false);
            }
        };
        fetchStudents();
    }, [activeBatch, attendanceDate]);


    // Fetch past recorded dates for the active batch
    useEffect(() => {
        if (!activeBatch) return;
        const fetchPastDates = async () => {
            setPastAttendanceLoading(true);
            try {
                const token = localStorage.getItem("snagup_token");
                const res = await axios.get(`${API_ENDPOINTS.ATTENDANCE}/batch/${activeBatch.id}/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPastAttendanceDates(res.data.dates || []);
            } catch (err) {
                console.error("Failed to fetch past attendance dates", err);
            } finally {
                setPastAttendanceLoading(false);
            }
        };
        fetchPastDates();
    }, [activeBatch]);

    const openAttendance = (batch: any) => {
        setActiveBatch(batch);
        setShowAttendanceModal(true);
    };

    const submitAttendance = async () => {
        setMarkingLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.ATTENDANCE}/batch/${activeBatch.id}`, {
                date: attendanceDate,
                records: attendanceRecords
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert(pastAttendanceDates.includes(attendanceDate) ? "Attendance updated successfully!" : "Attendance saved successfully!");
            if (!pastAttendanceDates.includes(attendanceDate)) {
                setPastAttendanceDates(prev => [...prev, attendanceDate].sort());
            }
            setShowAttendanceModal(false);
        } catch (err: any) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem("snagup_token");
                router.push("/login");
            } else {
                alert("Failed to save attendance");
                console.error(err);
            }
        } finally {
            setMarkingLoading(false);
        }
    };

    const handleSaveMaterial = async (batchId: number) => {
        const link = materialLinks[batchId];
        const msg = materialMessages[batchId];

        setMaterialLoading({ ...materialLoading, [batchId]: true });
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.BATCHS}/${batchId}/material`, {
                material_link: link,
                material_message: msg
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Materials updated successfully!");
        } catch (err) {
            alert("Failed to update materials");
            console.error(err);
        } finally {
            setMaterialLoading({ ...materialLoading, [batchId]: false });
        }
    };

    const handlePlanSession = async (batchId: number) => {
        const link = sessionLinks[batchId];
        const time = sessionTimes[batchId];
        const date = sessionDates[batchId];
        const message = sessionMessage[batchId];

        if (!link || !time || !date) return alert("Please provide Date, Time, and Session Link.");
        
        // Prevent planning in the past
        const selectedDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        if (selectedDateTime < now) {
            return alert("Cannot plan a session in the past. Please select a future date and time.");
        }

        setLinkLoading(prev => ({ ...prev, [batchId]: true }));
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.AUTH.replace('/auth', '')}/sessions/plan`, {
                batch_id: batchId,
                date,
                time,
                link,
                message
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Session planned/altered successfully! Students have been notified via email.");
            fetchStats(); // Refresh to show updated session info
        } catch (err: any) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem("snagup_token");
                router.push("/login");
            } else {
                alert(err.response?.data?.error || "Failed to plan session");
            }
        } finally {
            setLinkLoading(prev => ({ ...prev, [batchId]: false }));
        }
    };

    const handleSendManualReminder = async (batchId: number) => {
        setReminderLoading(prev => ({ ...prev, [batchId]: true }));
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.post(`${API_ENDPOINTS.AUTH.replace('/auth', '')}/sessions/remind/${batchId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message || "Reminder sent successfully!");
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to send reminder");
        } finally {
            setReminderLoading(prev => ({ ...prev, [batchId]: false }));
        }
    };

    const handleFinalizeCourse = async (batchId: number) => {
        if (!confirm("Are you sure you want to complete this course? This will lock attendance and begin the 2-day verification window for students to receive certificates.")) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.BATCHS}/${batchId}/finalize-course`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Course successfully finalized! 2-day verification window started.");
            fetchStats();
            setManageBatch(null);
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to finalize course");
            setLoading(false);
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

    const fetchHistoryAttendance = async (batchId: string) => {
        if (!batchId) {
            setHistoryAttendanceData(null);
            return;
        }
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ATTENDANCE}/batch/${batchId}/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoryAttendanceData(res.data);
        } catch (err: any) {
            console.error("Failed to load history", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history' && selectedHistoryBatchId) {
            fetchHistoryAttendance(selectedHistoryBatchId);
        } else if (activeTab === 'history' && !selectedHistoryBatchId) {
            setHistoryAttendanceData(null);
        }
    }, [activeTab, selectedHistoryBatchId]);


    const toggleStudentStatus = (id: string, status: string) => {
        setAttendanceRecords(prev => ({ ...prev, [id]: status }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        { title: "Total Batches", value: stats?.totalBatches || 0, icon: <Layers className="w-6 h-6 text-foreground" /> },
        { title: "Active Batches", value: stats?.activeBatches || 0, icon: <CalendarCheck className="w-6 h-6 text-foreground" /> },
        { title: "Total Students", value: stats?.totalStudents || 0, icon: <Users className="w-6 h-6 text-foreground" /> },
    ];

    const isManageInteractive = manageBatch && manageBatch.is_finalized === 1 && manageBatch.batch_status === 'active';
    const isManageRestricted = manageBatch && (manageBatch.batch_status === 'completed' || manageBatch.batch_status === 'closed');

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex flex-col">
                                <img src="/brand-logo-v2.png" alt="Logo" className="h-8 w-auto object-contain mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Instructor Portal</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); setManageBatch(null); }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold transition-all border ${activeTab === item.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                        : "text-muted-foreground bg-muted/30 border-transparent hover:bg-muted"
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside 
                onMouseEnter={() => setIsSidebarCollapsed(false)}
                onMouseLeave={() => setIsSidebarCollapsed(true)}
                className={`hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-2xl sticky top-0 h-screen shrink-0 p-6 transition-all duration-500 ease-in-out group/sidebar overflow-hidden ${isSidebarCollapsed ? 'w-24' : 'w-72 shadow-2xl shadow-primary/5'}`}
            >
                <div className="mb-12 px-2 flex items-center justify-between">
                    {!isSidebarCollapsed ? (
                        <div className="flex flex-col animate-in fade-in duration-500">
                            <img src="/brand-logo-v2.png" alt="Snagup Tech" className="h-14 w-auto object-contain" />
                        </div>
                    ) : (
                        <div className="w-full flex justify-center animate-in zoom-in duration-500">
                            <img src="/brand-logo-v2.png" alt="Logo" className="h-10 w-10 object-contain" />
                        </div>
                    )}
                </div>

                <nav className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar py-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { 
                                setActiveTab(item.id as any); 
                                setManageBatch(null);
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 border ${activeTab === item.id
                                ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                                : "text-muted-foreground bg-muted/30 border-transparent hover:bg-muted/60 hover:border-border/50"
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <div className={`transition-transform duration-500 ${activeTab === item.id ? 'rotate-[360deg]' : ''}`}>
                                {item.icon}
                            </div>
                            {!isSidebarCollapsed && (
                                <span className="animate-in slide-in-from-left-2 duration-300 truncate">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    ))}
                    
                    <div className="h-4" />
                </nav>

                <div className="mt-auto space-y-4">
                    <div className={`p-4 rounded-2xl bg-muted/30 border border-border/50 transition-all duration-300 ${isSidebarCollapsed ? 'px-2 flex justify-center' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase shrink-0">
                                {profileForm.name?.charAt(0) || 'I'}
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="min-w-0 animate-in fade-in duration-500">
                                    <p className="text-sm font-bold truncate">{profileForm.name || 'Instructor'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background/50">
                {/* Header */}
                <header className="h-20 shrink-0 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 md:hidden hover:bg-muted rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <div className="flex items-center gap-4">
                                {manageBatch ? (
                                    <button 
                                        onClick={() => setManageBatch(null)}
                                        className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground lg:hidden"
                                        title="Back to Batches"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                ) : activeTab === 'settings' ? (
                                    <button 
                                        onClick={() => setActiveTab(previousTab as any)}
                                        className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                                        title="Return"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                ) : null}
                                <h1 className="text-xl font-black tracking-tight uppercase truncate max-w-[200px] md:max-w-none">
                                    {manageBatch ? manageBatch.name : 
                                     activeTab === 'settings' ? 'Account Configuration' : 
                                     navItems.find(i => i.id === activeTab)?.label}
                                </h1>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                {manageBatch ? `Managing Batch · ${manageBatch.course_name}` : 
                                 activeTab === 'settings' ? 'Profile & Security' : 'Faculty Workspace'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => {
                                if (activeTab !== 'settings') setPreviousTab(activeTab);
                                setActiveTab('settings');
                                setManageBatch(null);
                            }}
                            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${activeTab === 'settings' ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'}`}
                            title="Instructor Settings"
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

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto space-y-10">
            {activeTab === 'analytics' && !manageBatch && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {statCards.map((stat, idx) => (
                            <div key={idx} className={`glass-panel p-8 rounded-[2rem] border border-primary/10 bg-card/40 backdrop-blur-xl flex items-center justify-between shadow-xl shadow-primary/5 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02]`}>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{stat.title}</p>
                                    <h3 className="text-4xl font-black text-foreground">{stat.value}</h3>
                                </div>
                                <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center border border-primary/20">
                                    {stat.icon}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {activeTab === 'batches' && !manageBatch && (
                <div className="glass-panel p-6 rounded-2xl border border-border bg-card animate-fade-in">
                    <h2 className="text-xl font-bold text-foreground mb-6">My Assigned Batches</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats?.myBatches?.filter((b: any) => b.archived_at === null).length > 0 ? (
                            stats.myBatches.filter((b: any) => b.archived_at === null).map((batch: any) => (
                                <div key={batch.id} className="border border-border rounded-xl p-5 bg-muted/30 hover:bg-muted/50 transition-all group flex flex-col justify-between hover:shadow-lg hover:shadow-primary/5">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">{batch.name}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{batch.course_name}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${batch.batch_status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                                batch.batch_status === 'completed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                batch.batch_status === 'closed' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                }`}>
                                                {batch.batch_status === 'active' ? '• LIVE' : batch.batch_status === 'completed' ? 'COMPLETED' : batch.batch_status === 'closed' ? 'CLOSED' : 'UPCOMING'}
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between text-xs p-2 bg-background/50 rounded-lg">
                                                <span className="text-muted-foreground font-medium">Enrolled Students</span>
                                                <span className="text-foreground font-bold">{batch.enrolled_count}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs p-2 bg-background/50 rounded-lg mt-2">
                                                <span className="text-muted-foreground font-medium">Sessions</span>
                                                <span className="text-foreground font-bold text-right ml-2">{batch.sessions_completed || 0} days completed out of {batch.duration_days} days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => {
                                                setManageBatch(batch);
                                                setActiveBatch(batch); // For attendance logic
                                            }}
                                            className="w-full py-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
                                        >
                                            <Layers className="w-3.5 h-3.5" /> {batch.is_finalized ? 'Manage Course' : 'Pre-Finalization Details'}
                                        </button>
                                        {batch.batch_status === 'active' && batch.is_finalized === 1 && (
                                            <button
                                                onClick={() => openAttendance(batch)}
                                                disabled={!batch.is_finalized}
                                                className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                                                    !batch.is_finalized 
                                                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                }`}
                                            >
                                                <CalendarCheck className="w-3.5 h-3.5" /> 
                                                {batch.is_finalized ? 'Mark Attendance' : 'Waiting for Finalization'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                                <Layers className="w-12 h-12 mb-3 opacity-50" />
                                <p>No batches assigned to you yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'batches' && manageBatch && (
                <div className="animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => setManageBatch(null)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium group"
                        >
                            <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            <span className="text-sm">Back to Batch List</span>
                        </button>
                    </div>

                    {/* Hero Batch Header Card */}
                    <div className="glass-panel rounded-2xl border border-border bg-card overflow-hidden mb-8">
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Layers className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground leading-tight">{manageBatch.name}</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{manageBatch.course_name}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                    manageBatch.batch_status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                    manageBatch.batch_status === 'completed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                    manageBatch.batch_status === 'closed' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {manageBatch.batch_status === 'active' ? '● LIVE' : manageBatch.batch_status.toUpperCase()}
                                </span>
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                    manageBatch.is_finalized ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                    {manageBatch.is_finalized ? '✓ Finalized' : '⏳ Awaiting Finalization'}
                                </span>
                                <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-muted/60 text-muted-foreground border border-border">
                                    {manageBatch.enrolled_count} Students · {manageBatch.duration_days} Days
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Subtab Navigation */}
                    <div className="flex flex-wrap items-center gap-2 mb-8 p-1 bg-muted/30 rounded-2xl w-fit border border-border/50">
                        {[
                            { id: 'sessions', label: 'Scheduling & Materials', icon: <PlayCircle className="w-4 h-4" /> },
                            { id: 'attendance', label: 'Attendance Management', icon: <CalendarCheck className="w-4 h-4" /> },
                            { id: 'guidelines', label: 'Guidelines & Policies', icon: <Shield className="w-4 h-4" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setManageBatchTab(tab.id as any)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    manageBatchTab === tab.id 
                                    ? 'bg-background text-foreground shadow-sm border border-border/50' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {manageBatchTab === 'sessions' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="glass-panel p-8 rounded-2xl border border-border bg-card relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground mb-1">Live Session Scheduling</h2>
                                            <p className="text-sm text-muted-foreground">Update session link and timing for students.</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                            <PlayCircle className="w-5 h-5 text-primary" />
                                            <span className="text-xs font-bold text-primary uppercase">{manageBatch.name}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground ml-1">Session Date</label>
                                            <input
                                                type="date"
                                                disabled={!isManageInteractive}
                                                value={sessionDates[manageBatch.id] || ""}
                                                onChange={(e) => setSessionDates({ ...sessionDates, [manageBatch.id]: e.target.value })}
                                                className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [color-scheme:light] dark:[color-scheme:dark] ${!isManageInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground ml-1">Session Timing</label>
                                            <input
                                                type="time"
                                                disabled={!isManageInteractive}
                                                value={sessionTimes[manageBatch.id] || ""}
                                                onChange={(e) => setSessionTimes({ ...sessionTimes, [manageBatch.id]: e.target.value })}
                                                className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [color-scheme:light] dark:[color-scheme:dark] ${!isManageInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-sm font-semibold text-muted-foreground">Session Link</label>
                                                {!isManageInteractive && (
                                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">{isManageRestricted ? 'Batch Concluded' : 'Finalization Pending'}</span>
                                                )}
                                            </div>
                                            <input
                                                type="url"
                                                placeholder={isManageInteractive ? "https://meet.google.com/..." : isManageRestricted ? "Session Planning Closed" : "Disabled until finalized"}
                                                value={sessionLinks[manageBatch.id] || ""}
                                                onChange={(e) => setSessionLinks({ ...sessionLinks, [manageBatch.id]: e.target.value })}
                                                disabled={!isManageInteractive}
                                                className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${!isManageInteractive ? 'cursor-not-allowed opacity-50 grayscale' : ''
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-8">
                                        <label className="text-sm font-semibold text-muted-foreground ml-1">Message to Students (Optional)</label>
                                        <textarea
                                            placeholder="Important notes for today's session..."
                                            disabled={!isManageInteractive}
                                            value={sessionMessage[manageBatch.id] || ""}
                                            onChange={(e) => setSessionMessage({ ...sessionMessage, [manageBatch.id]: e.target.value })}
                                            className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-none ${!isManageInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    {isManageInteractive && (
                                        <div className="flex flex-col md:flex-row items-center gap-4">
                                            <button
                                                onClick={() => handlePlanSession(manageBatch.id)}
                                                disabled={linkLoading[manageBatch.id]}
                                                className="w-full md:w-auto px-10 py-4 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-black text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                            >
                                                {linkLoading[manageBatch.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                                PLAN / ALTER SESSION & NOTIFY STUDENTS
                                            </button>

                                            <button
                                                onClick={() => handleSendManualReminder(manageBatch.id)}
                                                disabled={reminderLoading[manageBatch.id] || !sessionLinks[manageBatch.id]}
                                                className="w-full md:w-auto px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                            >
                                                {reminderLoading[manageBatch.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                                                SEND REMINDER EMAIL NOW
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Manual Reminders Note */}
                            {isManageInteractive && (
                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Manual Reminders Enabled</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            The automatic reminder system has been replaced with a manual button. Click <strong>SEND REMINDER EMAIL NOW</strong> above whenever you want to remind students about the session.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {!isManageInteractive && !isManageRestricted && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-amber-500" />
                                    <p className="text-xs text-amber-500 font-bold">Session planning is restricted until enrollment is finalized by admin.</p>
                                </div>
                            )}
                            {isManageRestricted && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-rose-500" />
                                    <p className="text-xs text-rose-500 font-bold">This batch is {manageBatch.batch_status}. Operations are locked.</p>
                                </div>
                            )}
                                </div>
                            )}

                            {manageBatchTab === 'guidelines' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Broadcast Guidelines / Pre-Course Announcements */}
                            <div className={`glass-panel p-8 rounded-2xl border ${!manageBatch.is_finalized ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border'} bg-card shadow-sm relative overflow-hidden`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 ${!manageBatch.is_finalized ? 'bg-primary/10' : 'bg-amber-500/5'}`}></div>
                                <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                                    {!manageBatch.is_finalized ? (
                                        <><Shield className="w-5 h-5 text-primary animate-pulse" /> Pre-Course Announcements</>
                                    ) : (
                                        <><Shield className="w-5 h-5 text-amber-500" /> Broadcast Guidelines &amp; Policy</>
                                    )}
                                </h2>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {!manageBatch.is_finalized 
                                        ? "Welcome enrolled students, share prerequisite instructions, or specify software needed before the administration finalizes the roster."
                                        : "Send guidelines or important messages visible on the student portal and/or via email."}
                                </p>
                                <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4">
                                    <textarea
                                        placeholder={!manageBatch.is_finalized ? "Welcome to the upcoming course! Please ensure you have VS Code installed..." : "Enter guidelines or important instructions for students..."}
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        disabled={isManageRestricted}
                                        className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 ${!manageBatch.is_finalized ? 'focus:ring-primary/20 focus:border-primary' : 'focus:ring-amber-500/20 focus:border-amber-500'} transition-all min-h-[100px] resize-none text-sm ${isManageRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    <div className="flex flex-wrap items-center gap-5 py-3 border-y border-border/30">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delivery:</span>
                                        {(['both', 'portal', 'email'] as const).map(mode => (
                                            <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                                                <input type="radio" name="broadcast_mode" value={mode} checked={broadcastMode === mode} onChange={(e) => setBroadcastMode(e.target.value as any)} className={`w-4 h-4 ${!manageBatch.is_finalized ? 'accent-primary' : 'accent-amber-500'}`} />
                                                <span className={`text-xs font-bold text-foreground transition-colors capitalize ${!manageBatch.is_finalized ? 'group-hover:text-primary' : 'group-hover:text-amber-500'}`}>{mode === 'both' ? 'Portal & Email' : mode === 'portal' ? 'Portal Only' : 'Email Only'}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {!isManageRestricted && (
                                        <button onClick={() => handleBroadcast(manageBatch.id)} disabled={broadcastLoading} className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 ${!manageBatch.is_finalized ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20' : 'bg-amber-500 text-amber-950 hover:bg-amber-600 shadow-lg shadow-amber-500/20'}`}>
                                            {broadcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            {!manageBatch.is_finalized ? 'ANNOUNCE NOW' : 'BROADCAST NOW'}
                                        </button>
                                    )}
                                    {isManageRestricted && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-rose-500" />
                                            <p className="text-xs text-rose-500 font-bold">Batch {manageBatch.batch_status} — operations locked.</p>
                                        </div>
                                    )}
                                    {manageBatch.broadcast_message && (
                                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="w-4 h-4 text-amber-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Published on Portal</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-xs text-foreground italic flex-1">"{manageBatch.broadcast_message}"</p>
                                                <button onClick={() => handleDeleteBroadcast(manageBatch.id)} disabled={broadcastLoading} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase">
                                                    <XCircle className="w-3.5 h-3.5" /> Clear
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-6 border-t border-border">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                        <h3 className="text-sm font-bold text-foreground">Professional Guidance Tips</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { title: 'Clarify Verification', body: 'Reassure students that enrollment is manually verified by admin. Human verification ensures security and trust.' },
                                            { title: 'UTR Accuracy', body: 'Guide students to double-check their Transaction ID (UTR). Incorrect IDs cause delays.' },
                                            { title: 'Realistic Timelines', body: 'Inform students approvals typically take 24-48 hours. Clear expectations build institutional trust.' },
                                            { title: 'Binary Approval', body: 'Only full payments are accepted. If a UTR is rejected, students can resubmit via their portal.' },
                                        ].map(tip => (
                                            <div key={tip.title} className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
                                                <h4 className="text-xs font-bold text-primary mb-1 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" />{tip.title}</h4>
                                                <p className="text-[11px] leading-relaxed text-muted-foreground">{tip.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                                </div>
                            )}

                            {manageBatchTab === 'sessions' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Course Materials */}
                            <div className="glass-panel p-8 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-bl-full -z-10"></div>
                                <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Course Materials &amp; Announcements
                                </h2>
                                <p className="text-sm text-muted-foreground mb-6">Share resources and messages with enrolled students. Auto-deletes when batch completes.</p>
                                <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-muted-foreground">Material Link (Drive, Dropbox…)</label>
                                            {!isManageInteractive && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">{isManageRestricted ? 'Restricted' : 'Pending Finalization'}</span>}
                                        </div>
                                        <input type="url" placeholder={isManageInteractive ? 'https://drive.google.com/...' : isManageRestricted ? 'Materials Locked' : 'Enabled after finalization'}
                                            value={materialLinks[manageBatch.id] || ''} onChange={(e) => setMaterialLinks({ ...materialLinks, [manageBatch.id]: e.target.value })} disabled={!isManageInteractive}
                                            className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${!isManageInteractive ? 'cursor-not-allowed opacity-50 grayscale' : ''}`} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-muted-foreground">Announcement or Message</label>
                                        <textarea placeholder="Welcome to the course! Here are your initial materials..." disabled={!isManageInteractive} value={materialMessages[manageBatch.id] || ''}
                                            onChange={(e) => setMaterialMessages({ ...materialMessages, [manageBatch.id]: e.target.value })}
                                            className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-none ${!isManageInteractive ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                    </div>
                                    {isManageInteractive && (
                                        <button onClick={() => handleSaveMaterial(manageBatch.id)} disabled={materialLoading[manageBatch.id]} className="px-8 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-black text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 disabled:opacity-50">
                                            {materialLoading[manageBatch.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            SAVE &amp; PUBLISH MATERIALS
                                        </button>
                                    )}
                                    {!isManageInteractive && !isManageRestricted && (
                                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2"><Shield className="w-4 h-4 text-amber-500" /><p className="text-xs text-amber-500 font-bold">Material sharing enabled after finalization.</p></div>
                                    )}
                                    {isManageRestricted && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2"><Shield className="w-4 h-4 text-rose-500" /><p className="text-xs text-rose-500 font-bold">Batch {manageBatch.batch_status} — locked.</p></div>
                                    )}
                                </div>
                            </div>
                                </div>
                            )}

                            {manageBatchTab === 'attendance' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Past Attendance Dates */}
                            {pastAttendanceDates.length > 0 && (
                                <div className="glass-panel p-6 rounded-2xl border border-border bg-card shadow-sm">
                                    <h2 className="text-base font-bold text-foreground mb-1">Past Attendance Records</h2>
                                    <p className="text-xs text-muted-foreground mb-4">Click any date to view or edit that day&apos;s attendance below.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {pastAttendanceDates.map(date => (
                                            <button key={date} onClick={() => { setAttendanceDate(date); document.getElementById('mark-attendance-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${attendanceDate === date ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20' : 'bg-muted/50 hover:bg-muted border-border text-foreground hover:border-primary/50'}`}>
                                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Mark Attendance */}
                            <div id="mark-attendance-section" className="glass-panel p-8 rounded-2xl border border-border bg-card">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground mb-1">Mark Attendance</h2>
                                        <p className="text-sm text-muted-foreground">Record student presence for the selected date.</p>
                                    </div>
                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="px-5 py-3 bg-muted border border-border rounded-xl text-foreground font-bold [color-scheme:light] dark:[color-scheme:dark] shadow-sm focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {studentsLoading ? (
                                        <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" /></div>
                                    ) : students.length > 0 ? students.map(s => (
                                        <div key={s.id} className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-muted/60 transition-all">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-sm">{s.name}</h4>
                                                    <span className="text-xs text-muted-foreground">{s.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => !manageBatch.is_finalized ? alert("Cannot mark attendance until finalized") : toggleStudentStatus(s.id, 'present')}
                                                    disabled={!manageBatch.is_finalized}
                                                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border-2 ${attendanceRecords[s.id] === 'present'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                                                        } ${!manageBatch.is_finalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <Check className="w-4 h-4" /> PRESENT
                                                </button>
                                                <button
                                                    onClick={() => !manageBatch.is_finalized ? alert("Cannot mark attendance until finalized") : toggleStudentStatus(s.id, 'absent')}
                                                    disabled={!manageBatch.is_finalized}
                                                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border-2 ${attendanceRecords[s.id] === 'absent'
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                        : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                                                        } ${!manageBatch.is_finalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <XCircle className="w-4 h-4" /> ABSENT
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-sm opacity-40">
                                            <Users className="w-16 h-16 mb-4" />
                                            <p className="font-bold">No students currently enrolled in this batch.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-border">
                                    {(!manageBatch.is_finalized || !isManageInteractive || (pastAttendanceDates.length >= manageBatch.duration_days && !pastAttendanceDates.includes(attendanceDate))) && (
                                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-rose-500 shrink-0" />
                                            <p className="text-xs text-rose-500 font-bold">
                                                {!manageBatch.is_finalized ? 'Attendance locked until admin finalizes enrollment.' :
                                                    !isManageInteractive ? `Batch is ${manageBatch.batch_status}. Operations locked.` :
                                                    'Max duration reached. Cannot add new attendance dates.'}
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        onClick={submitAttendance}
                                        disabled={markingLoading || students.length === 0 || !manageBatch.is_finalized || !isManageInteractive || (pastAttendanceDates.length >= manageBatch.duration_days && !pastAttendanceDates.includes(attendanceDate))}
                                        className="w-full mb-4 py-5 bg-foreground text-background dark:bg-primary dark:text-primary-foreground hover:opacity-90 rounded-2xl font-black text-base flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl transition-all active:scale-95"
                                    >
                                        {markingLoading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <CalendarCheck className="w-5 h-5" /> 
                                                {pastAttendanceDates.includes(attendanceDate) ? 'UPDATE SAVED ATTENDANCE' : 'SAVE DAILY ATTENDANCE'}
                                            </>
                                        )}
                                    </button>

                                    {isManageInteractive && pastAttendanceDates.length >= manageBatch.duration_days && (
                                        <button
                                            onClick={() => handleFinalizeCourse(manageBatch.id)}
                                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 animate-pulse"
                                        >
                                            <Shield className="w-5 h-5" /> SUBMIT FINAL ATTENDANCE & COMPLETE COURSE
                                        </button>
                                    )}
                                </div>
                            </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {manageBatchTab === 'attendance' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Progress Card */}
                            <div className="glass-panel p-6 rounded-2xl border border-border bg-card">
                                <h3 className="font-bold text-foreground mb-4 uppercase text-[10px] tracking-widest opacity-60">Session Progress</h3>
                                <div className="flex items-center gap-5">
                                    <div className="relative w-20 h-20 shrink-0">
                                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/40" />
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                                                strokeDasharray={`${Math.min((pastAttendanceDates.length / (manageBatch.duration_days || 1)) * 100, 100)} 100`}
                                                strokeLinecap="round" className="text-emerald-500 transition-all duration-700" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-black text-foreground">{Math.min(Math.round((pastAttendanceDates.length / (manageBatch.duration_days || 1)) * 100), 100)}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-foreground leading-none">{pastAttendanceDates.length}<span className="text-sm font-semibold text-muted-foreground"> / {manageBatch.duration_days}</span></p>
                                        <p className="text-xs text-muted-foreground mt-1">Days Completed</p>
                                        <p className="text-xs font-bold text-emerald-500 mt-2">
                                            {manageBatch.duration_days - pastAttendanceDates.length > 0 ? `${manageBatch.duration_days - pastAttendanceDates.length} days remaining` : '🎉 All sessions done!'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 w-full bg-muted/50 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min((pastAttendanceDates.length / (manageBatch.duration_days || 1)) * 100, 100)}%` }} />
                                </div>
                            </div>
                                </div>
                            )}

                            {manageBatchTab === 'guidelines' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Stats */}
                            <div className="glass-panel p-6 rounded-2xl border border-border bg-card space-y-3">
                                <h3 className="font-bold text-foreground mb-2 uppercase text-[10px] tracking-widest opacity-60">Batch Details</h3>
                                <div className="p-3 rounded-xl bg-muted/40">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Course</p>
                                    <p className="text-sm font-bold text-foreground">{manageBatch.course_name}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 flex items-center justify-between">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Enrolled</p>
                                    <p className="text-sm font-black text-primary">{manageBatch.enrolled_count} Students</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 flex items-center justify-between">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Duration</p>
                                    <p className="text-sm font-black text-foreground">{manageBatch.duration_days} Days</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 flex items-center justify-between">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                                    <p className={`text-xs font-black ${
                                        manageBatch.batch_status === 'active' ? 'text-emerald-500' :
                                        manageBatch.batch_status === 'completed' ? 'text-blue-500' : 'text-rose-500'
                                    }`}>{manageBatch.batch_status.toUpperCase()}</p>
                                </div>
                            </div>
                                </div>
                            )}

                            {manageBatchTab === 'attendance' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Enrolled Students */}
                            <div className="glass-panel rounded-2xl border border-border bg-card overflow-hidden">
                                <div className="p-4 flex items-center justify-between border-b border-border/50">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        <h3 className="font-bold text-foreground text-sm">Enrolled Students</h3>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                                        {studentsLoading ? '…' : students.length}
                                    </span>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-border/30">
                                    {studentsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-5 h-5 animate-spin text-primary opacity-50" />
                                        </div>
                                    ) : students.length > 0 ? students.map((s, idx) => (
                                        <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0">
                                                {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate leading-tight">{s.name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                                            </div>
                                            <span className="ml-auto text-[10px] font-black text-muted-foreground/50 shrink-0">#{idx + 1}</span>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                            <Users className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-xs font-bold opacity-50">No students enrolled yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reports */}
                            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center">
                                <FileText className="w-10 h-10 text-primary mb-3 opacity-50" />
                                <h4 className="font-bold text-foreground text-sm mb-1">Batch Reports</h4>
                                <p className="text-[10px] text-muted-foreground mb-4">Export attendance and performance reports for this batch.</p>
                                <button className="w-full py-2.5 bg-muted hover:bg-border text-foreground text-xs font-bold rounded-xl transition-all border border-border">COMING SOON</button>
                            </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="animate-fade-in space-y-8">
                    <div className="glass-panel p-8 rounded-2xl border border-border bg-card">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-1">Attendance Archive</h2>
                                <p className="text-sm text-muted-foreground">Historical records for your completed batches.</p>
                            </div>
                            <select
                                value={selectedHistoryBatchId}
                                onChange={e => setSelectedHistoryBatchId(e.target.value)}
                                className="px-5 py-3 bg-muted border border-border rounded-xl text-foreground font-bold focus:outline-none focus:border-primary transition-colors min-w-[280px] drop-shadow-sm"
                            >
                                <option value="">Select a completed batch...</option>
                                {stats?.myBatches?.filter((b: any) => b.batch_status === 'completed').map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name} — {b.course_name}</option>
                                ))}
                            </select>
                        </div>

                        {historyLoading ? (
                            <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={3} /></div>
                        ) : historyAttendanceData && historyAttendanceData.students.length > 0 ? (
                            <div className="overflow-x-auto pb-6">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                            <th className="pb-6 pr-8 sticky left-0 bg-card/95 backdrop-blur-md z-10 w-64 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.05)]">Student Name</th>
                                            {historyAttendanceData.dates.map((date: string) => (
                                                <th key={date} className="pb-6 px-4 text-center whitespace-nowrap min-w-[80px]">
                                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </th>
                                            ))}
                                            <th className="pb-6 px-4 text-right">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {historyAttendanceData.students.map((student: any) => {
                                            const total = historyAttendanceData.dates.length;
                                            const present = historyAttendanceData.dates.filter((d: string) => historyAttendanceData.records[student.id]?.[d] === 'present').length;
                                            const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                                            return (
                                                <tr key={student.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                                    <td className="py-5 pr-8 sticky left-0 bg-card/95 backdrop-blur-md z-10 w-64 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.05)]">
                                                        <div className="font-bold text-foreground text-sm tracking-tight mb-0.5">{student.name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 lowercase">{student.email}</div>
                                                    </td>
                                                    {historyAttendanceData.dates.map((date: string) => {
                                                        const status = historyAttendanceData.records[student.id]?.[date];
                                                        return (
                                                            <td key={date} className="py-5 px-4 text-center">
                                                                {status === 'present' ? (
                                                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20"><Check className="w-3 h-3" strokeWidth={4} /></div>
                                                                ) : status === 'absent' ? (
                                                                    <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20"><X className="w-3 h-3" strokeWidth={4} /></div>
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-muted/20 mx-auto"></div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-5 px-4 text-right">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${pct >= 75 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{pct}%</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : selectedHistoryBatchId ? (
                            <div className="py-24 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                                <Users className="w-12 h-12 mb-3 mx-auto opacity-30" />
                                <p className="font-bold opacity-60">No students recorded or no records found for this batch archive.</p>
                            </div>
                        ) : (
                            <div className="py-24 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border group hover:border-primary/30 transition-colors">
                                <Clock className="w-12 h-12 mb-3 mx-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                                <p className="font-bold opacity-60">Ready to audit. Select a past batch across your archive.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12 pb-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-8">
                        <div>
                            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">System Settings</h2>
                            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase opacity-60">Maintain your professional identity and security</p>
                        </div>
                        {previousTab && (
                            <button 
                                onClick={() => {
                                    setActiveTab(previousTab as any);
                                    setManageBatch(null);
                                }}
                                className="flex items-center gap-3 px-6 py-3 bg-muted/50 hover:bg-muted border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group"
                            >
                                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                                Return to {previousTab === 'analytics' ? 'Analytics Insights' : previousTab === 'batches' ? 'Assigned Batches' : 'Attendance History'}
                            </button>
                        )}
                    </div>

                    <div className="max-w-6xl space-y-8">
                        {/* Profile Information Card */}
                        <div className="p-8 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden group">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Update Profile</h2>
                                    <p className="text-xs text-muted-foreground">Update your personal and professional details</p>
                                </div>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={profileForm.name}
                                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={profileForm.email}
                                            onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={profileForm.phone}
                                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={settingsLoading}
                                    className="w-full py-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-2xl font-bold transition-all disabled:opacity-50 text-sm shadow-lg shadow-primary/20"
                                >
                                    {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" strokeWidth={3} /> : "Update Profile"}
                                </button>
                            </form>
                        </div>

                        {/* Security Settings Card */}
                        <div className="p-8 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden group">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-foreground/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <Shield className="w-6 h-6 text-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Password & Security</h2>
                                    <p className="text-xs text-muted-foreground">Change your account password to keep it secure</p>
                                </div>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                required
                                                value={passwordForm.currentPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all font-medium pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-foreground transition-all"
                                            >
                                                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                required
                                                minLength={6}
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all font-medium pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-foreground transition-all"
                                            >
                                                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">Verify Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.verify ? "text" : "password"}
                                                required
                                                minLength={6}
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all font-medium pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, verify: !showPasswords.verify })}
                                                className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-foreground transition-all"
                                            >
                                                {showPasswords.verify ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={settingsLoading}
                                    className="px-10 py-4 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-bold transition-all disabled:opacity-50 text-sm shadow-lg shadow-foreground/10"
                                >
                                    {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" strokeWidth={3} /> : "Update Password"}
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            )}

            {/* Attendance Modal */}
            {showAttendanceModal && activeBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl relative max-h-[90vh] flex flex-col shadow-2xl animate-fade-in scale-in">
                        <button onClick={() => setShowAttendanceModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-foreground">Mark Attendance</h2>
                        <p className="text-muted-foreground text-sm mb-4">{activeBatch.name} — {activeBatch.course_name}</p>

                        <div className="mb-6 flex items-center justify-between">
                            <label className="text-foreground font-medium whitespace-nowrap mr-4">Select Date:</label>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground [color-scheme:light] dark:[color-scheme:dark] max-w-xs w-full"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 custom-scrollbar">
                            {studentsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : students.length > 0 ? (
                                students.map(s => (
                                    <div key={s.id} className="p-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between hover:bg-muted transition-colors">
                                        <div>
                                            <h4 className="font-medium text-foreground text-sm">{s.name}</h4>
                                            <span className="text-xs text-muted-foreground">{s.email}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleStudentStatus(s.id, 'present')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border ${attendanceRecords[s.id] === 'present'
                                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                                                    }`}
                                            >
                                                <Check className="w-3 h-3" /> Present
                                            </button>
                                            <button
                                                onClick={() => toggleStudentStatus(s.id, 'absent')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border ${attendanceRecords[s.id] === 'absent'
                                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                                                    }`}
                                            >
                                                <XCircle className="w-3 h-3" /> Absent
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-8 text-muted-foreground text-sm">No students currently enrolled.</p>
                            )}
                        </div>

                        <button
                            onClick={submitAttendance}
                            disabled={markingLoading || students.length === 0}
                            className="w-full py-4 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-bold flex items-center justify-center disabled:opacity-50 shadow-lg transition-all"
                        >
                            {markingLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary-foreground" /> : "Save Attendance"}
                        </button>
                    </div>
                </div>
            )}
                    </div>
                </div>
            </main>
        </div>
    );
}
