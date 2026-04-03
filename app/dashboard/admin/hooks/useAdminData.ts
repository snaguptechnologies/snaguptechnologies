"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

export const useAdminData = () => {
    const router = useRouter();

    // Protect against browser back/forward button bypassing auth
    useAuthGuard('admin');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // Attendance specific states
    const [attCourseId, setAttCourseId] = useState<string>('');
    const [attBatchId, setAttBatchId] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<{ dates: string[], students: any[], records: any } | null>(null);
    const [attLoading, setAttLoading] = useState(false);

    // Active Tab with URL Hash Synchronization for Browser History
    const [activeTab, _setActiveTab] = useState<'overview' | 'courses' | 'instructors' | 'students' | 'batches' | 'payments' | 'attendance' | 'settings' | 'system_settings' | 'inquiries' | 'emails' | 'certificates'>('overview');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleHashChange = () => {
                const hash = window.location.hash.replace('#', '');
                const validTabs = ['overview', 'courses', 'instructors', 'students', 'batches', 'payments', 'attendance', 'settings', 'system_settings', 'inquiries', 'emails', 'certificates'];
                if (validTabs.includes(hash)) {
                    _setActiveTab(hash as any);
                } else if (!hash) {
                    _setActiveTab('overview');
                }
            };
            handleHashChange();
            window.addEventListener('hashchange', handleHashChange);
            return () => window.removeEventListener('hashchange', handleHashChange);
        }
    }, []);

    const setActiveTab = (tab: typeof activeTab) => {
        if (typeof window !== 'undefined' && window.location.hash !== `#${tab}`) {
            window.location.hash = tab;
        }
        _setActiveTab(tab);
    };
    const [paymentTab, setPaymentTab] = useState<'pending' | 'history'>('pending');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [tabLoading, setTabLoading] = useState(false);
    const [publicSettings, setPublicSettings] = useState<any>({});
    const [inquiries, setInquiries] = useState<any[]>([]);

    // Data states for tables and modals
    const [courses, setCourses] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [emailLogs, setEmailLogs] = useState<any[]>([]);
    const [approvedEnrollments, setApprovedEnrollments] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);

    // Filter states
    const [batchSearch, setBatchSearch] = useState("");
    const [batchCourseFilter, setBatchCourseFilter] = useState("");
    const [batchStatusFilter, setBatchStatusFilter] = useState("all");
    const [paymentSearch, setPaymentSearch] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [inquirySearch, setInquirySearch] = useState("");
    const [inquiryServiceFilter, setInquiryServiceFilter] = useState("all");
    const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");
    const [attendanceSearch, setAttendanceSearch] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [certSearch, setCertSearch] = useState("");
    const [certCourseFilter, setCertCourseFilter] = useState("all");

    // Modal & UI states
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showEditBatchModal, setShowEditBatchModal] = useState(false);
    const [editBatchForm, setEditBatchForm] = useState({
        id: -1,
        name: "",
        course_id: "",
        instructor_id: "",
        duration_days: 30,
        price: 0
    });
    const [selectedBatches, setSelectedBatches] = useState<number[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
    const [showInstructorModal, setShowInstructorModal] = useState(false);
    const [showEditDeadlineModal, setShowEditDeadlineModal] = useState(false);
    const [selectedBatchForDeadline, setSelectedBatchForDeadline] = useState<any>(null);
    const [editDeadlineForm, setEditDeadlineForm] = useState({ date: "", time: "" });

    // Settings states
    const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [upiSettings, setUpiSettings] = useState({ upi_id: "", upi_qr_image: "", razorpay_key_id: "", razorpay_key_secret: "" });
    const [upiSaving, setUpiSaving] = useState(false);
    const [generalSettings, setGeneralSettings] = useState({ site_name: "", site_url: "", site_logo: "", contact_email: "", contact_phone: "" });
    const [genSaving, setGenSaving] = useState(false);
    const [notifSettings, setNotifSettings] = useState<string[]>([]);
    const [notifSaving, setNotifSaving] = useState(false);
    const [upiMessage, setUpiMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ type: null, text: "" });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error" | null, text: string }>({ type: null, text: "" });
    const [settingsActiveTab, setSettingsActiveTab] = useState<'general' | 'profile' | 'payments' | 'notifications' | 'security'>('general');
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, verify: false });
    const [showInstPassword, setShowInstPassword] = useState(false);

    // Filtered Data (useMemo)
    const filteredBatches = useMemo(() => {
        return batches.filter(batch => {
            const matchesSearch = batch.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
                batch.instructor_name?.toLowerCase().includes(batchSearch.toLowerCase());
            const matchesCourse = !batchCourseFilter || batch.course_id.toString() === batchCourseFilter;
            let matchesStatus = true;
            if (batchStatusFilter === 'all') {
                matchesStatus = true;
            } else if (batchStatusFilter === 'enrollment_open') {
                const d = new Date();
                const nowLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                const isExpired = batch.enrollment_end_date && batch.enrollment_end_date <= nowLocal;
                matchesStatus = !isExpired && batch.enrollment_status === 'open' && !batch.is_finalized;
            } else if (batchStatusFilter === 'enrollment_closed') {
                const d = new Date();
                const nowLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                const isExpired = batch.enrollment_end_date && batch.enrollment_end_date <= nowLocal;
                matchesStatus = isExpired || batch.enrollment_status === 'closed' || batch.is_finalized;
            } else {
                matchesStatus = batch.batch_status.toLowerCase() === batchStatusFilter.toLowerCase();
            }
            return matchesSearch && matchesCourse && matchesStatus;
        });
    }, [batches, batchSearch, batchCourseFilter, batchStatusFilter]);

    const filteredPayments = useMemo(() => {
        return (payments || []).filter(p => {
            const matchesSearch = (p.student_name || p.user_name || "")?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                (p.email || "")?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                (p.latest_transaction_id || p.transaction_id || "")?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                (p.student_uid || "")?.toLowerCase().includes(paymentSearch.toLowerCase());
            
            const isPending = p.enrollment_status === 'pending';
            const matchesTab = paymentTab === 'pending' ? isPending : !isPending;
            
            const matchesStatus = paymentStatusFilter === 'all' || p.enrollment_status === paymentStatusFilter;
            return matchesSearch && matchesTab && matchesStatus;
        });
    }, [payments, paymentSearch, paymentStatusFilter, paymentTab]);

    const filteredInquiries = useMemo(() => {
        return inquiries.filter(iq => {
            const matchesSearch = iq.name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
                iq.email.toLowerCase().includes(inquirySearch.toLowerCase());
            const matchesService = inquiryServiceFilter === 'all' || iq.service_type === inquiryServiceFilter;
            const matchesStatus = inquiryStatusFilter === 'all' || iq.status === inquiryStatusFilter;
            return matchesSearch && matchesService && matchesStatus;
        });
    }, [inquiries, inquirySearch, inquiryServiceFilter, inquiryStatusFilter]);

    const filteredAttendance = useMemo(() => {
        if (!attendanceData) return null;
        return {
            ...attendanceData,
            students: attendanceData.students.filter(s =>
                s.name.toLowerCase().includes(attendanceSearch.toLowerCase())
            )
        };
    }, [attendanceData, attendanceSearch]);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(studentSearch.toLowerCase())
        );
    }, [students, studentSearch]);
    
    const filteredCertificates = useMemo(() => {
        return certificates.filter(c => {
            const matchesSearch = c.student_name.toLowerCase().includes(certSearch.toLowerCase()) ||
                c.cert_id.toLowerCase().includes(certSearch.toLowerCase()) ||
                c.course_name.toLowerCase().includes(certSearch.toLowerCase());
            const matchesCourse = certCourseFilter === 'all' || c.course_name === certCourseFilter;
            return matchesSearch && matchesCourse;
        });
    }, [certificates, certSearch, certCourseFilter]);

    const attendanceBatches = useMemo(() => {
        if (!attCourseId) return batches;
        return batches.filter(b => b.course_id.toString() === attCourseId);
    }, [batches, attCourseId]);

    // Form states
    const [courseForm, setCourseForm] = useState({ name: "", description: "" });
    const getLocalDatetime = () => {
        const d = new Date();
        const localD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
        return {
            enrollment_date: localD.toISOString().split('T')[0],
            enrollment_time: localD.toISOString().split('T')[1].substring(0, 5)
        };
    };

    const [batchForm, setBatchForm] = useState({
        name: "",
        course_id: "",
        instructor_id: "",
        duration_days: 30,
        price: 0,
        ...getLocalDatetime()
    });
    const [instForm, setInstForm] = useState({ name: "", email: "", password: "" });
    const [formLoading, setFormLoading] = useState(false);

    // Helpers
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchStats = async () => {
        const token = localStorage.getItem("snagup_token");
        if (!token) return;
        try {
            const res = await axios.get(API_ENDPOINTS.DASHBOARD + '/admin', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStats(res.data);
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            console.error("Failed to fetch admin stats:", err?.message || err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                handleLogout();
            } else {
                showToast("Failed to sync structural data", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicSettings = async () => {
        try {
            const res = await axios.get(API_ENDPOINTS.SETTINGS + '/public');
            setPublicSettings(res.data);
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    const loadData = async (tab: string = activeTab) => {
        try {
            const token = localStorage.getItem("snagup_token");
            if (!token) return router.push("/login");

            setTabLoading(true);
            if (tab === 'overview') {
                const res = await axios.get(`${API_ENDPOINTS.DASHBOARD}/admin`, { headers: { Authorization: `Bearer ${token}` } });
                setStats(res.data);
            } else if (tab === 'courses') {
                const res = await axios.get(`${API_ENDPOINTS.COURSES}?all=true`);
                setCourses(res.data);
            } else if (tab === 'instructors') {
                const res = await axios.get(API_ENDPOINTS.INSTRUCTORS, { headers: { Authorization: `Bearer ${token}` } });
                setInstructors(res.data);
            } else if (tab === 'students') {
                const res = await axios.get(`${API_ENDPOINTS.STUDENTS}`, { headers: { Authorization: `Bearer ${token}` } });
                setStudents(res.data);
            } else if (tab === 'batches') {
                const res = await axios.get(`${API_ENDPOINTS.BATCHS}?all=true`, { headers: { Authorization: `Bearer ${token}` } });
                setBatches(res.data);
            } else if (tab === 'payments') {
                const res = await axios.get(API_ENDPOINTS.PAYMENTS, { headers: { Authorization: `Bearer ${token}` } });
                setPayments(res.data);
            } else if (tab === 'inquiries') {
                const res = await axios.get(API_ENDPOINTS.INQUIRIES, { headers: { Authorization: `Bearer ${token}` } });
                setInquiries(res.data);
            } else if (tab === 'emails') {
                const res = await axios.get(`${API_ENDPOINTS.DASHBOARD}/admin/emails`, { headers: { Authorization: `Bearer ${token}` } });
                setEmailLogs(res.data);
            } else if (tab === 'attendance') {
                const [cRes, bRes] = await Promise.all([
                    axios.get(`${API_ENDPOINTS.COURSES}?all=true`),
                    axios.get(`${API_ENDPOINTS.BATCHS}?all=true`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setCourses(cRes.data);
                setBatches(bRes.data);
            } else if (tab === 'settings') {
                const [dashRes, setRes] = await Promise.all([
                    axios.get(`${API_ENDPOINTS.DASHBOARD}/admin`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(API_ENDPOINTS.SETTINGS, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (dashRes.data.user) {
                    setProfileForm({
                        name: dashRes.data.user.name || "",
                        email: dashRes.data.user.email || "",
                        phone: dashRes.data.user.phone || ""
                    });
                }
                setGeneralSettings({
                    site_name: setRes.data.site_name || "Snagup Technologies",
                    site_url: setRes.data.site_url || "http://localhost:3000",
                    site_logo: setRes.data.site_logo || "",
                    contact_email: setRes.data.contact_email || "",
                    contact_phone: setRes.data.contact_phone || ""
                });
                setUpiSettings({
                    upi_id: setRes.data.upi_id || '',
                    upi_qr_image: setRes.data.upi_qr_image || '',
                    razorpay_key_id: setRes.data.razorpay_key_id || '',
                    razorpay_key_secret: setRes.data.razorpay_key_secret || ''
                });
                try {
                    const reminders = JSON.parse(setRes.data.session_reminders || "[60, 30]");
                    setNotifSettings(reminders.map(String));
                } catch (e) {
                    setNotifSettings(["60", "30"]);
                }
            } else if (tab === 'certificates') {
                const res = await axios.get(`${API_ENDPOINTS.CERTIFICATES}/admin/all`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                setCertificates(res.data);
            }
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            console.error("Failed to load tab data:", err?.message || err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setTabLoading(false);
            setLoading(false);
        }
    };

    const fetchAttendanceData = async (batchId: string) => {
        if (!batchId) {
            setAttendanceData(null);
            return;
        }
        setAttLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ATTENDANCE}/batch/${batchId}/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendanceData(res.data);
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            console.error("Failed to fetch attendance:", err?.message || err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                handleLogout();
            } else {
                showToast("Failed to fetch attendance data", "error");
            }
        } finally {
            setAttLoading(false);
        }
    };

    const handleLogout = () => {
        const itemsToRemove = ["snagup_token", "snagup_user", "snagup_role", "user_role"];
        itemsToRemove.forEach(item => localStorage.removeItem(item));
        sessionStorage.clear();
        router.replace('/login');
    };

    // Life cycles
    useEffect(() => {
        const token = localStorage.getItem("snagup_token");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchStats();
        fetchPublicSettings();
    }, [router, activeTab]);

    useEffect(() => {
        if (activeTab === 'attendance' && attBatchId) {
            fetchAttendanceData(attBatchId);
        } else if (activeTab === 'attendance' && !attBatchId) {
            setAttendanceData(null);
        }
    }, [attBatchId, activeTab]);

    useEffect(() => {
        loadData(activeTab);
    }, [activeTab]);

    // Data Mutations
    const handleInquiryStatus = async (id: number, status: string) => {
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.patch(`${API_ENDPOINTS.INQUIRIES}/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
            setInquiries(inquiries.map(iq => iq.id === id ? { ...iq, status } : iq));
            showToast("Inquiry updated", "success");
        } catch (err) {
            showToast("Failed to update status", "error");
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSettingsLoading(true);
        setSettingsMessage({ type: null, text: "" });
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.AUTH}/profile`, profileForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettingsMessage({ type: "success", text: "Profile updated successfully!" });
            loadData('settings');
        } catch (err: any) {
            setSettingsMessage({ type: "error", text: err.response?.data?.error || "Failed to update profile" });
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSaveGeneralSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenSaving(true);
        setSettingsMessage({ type: null, text: "" });
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(API_ENDPOINTS.SETTINGS, generalSettings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettingsMessage({ type: "success", text: "System settings updated successfully!" });
            loadData('settings');
        } catch (err: any) {
            setSettingsMessage({ type: "error", text: err.response?.data?.error || "Failed to update settings" });
        } finally {
            setGenSaving(false);
        }
    };

    const handleUpdateDeadline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchForDeadline) return;
        setFormLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            const newEndDate = `${editDeadlineForm.date}T${editDeadlineForm.time}`;
            await axios.put(`${API_ENDPOINTS.BATCHS}/${selectedBatchForDeadline.id}/enrollment`, {
                enrollment_end_date: newEndDate,
                status: 'open'
            }, { headers: { Authorization: `Bearer ${token}` } });
            setShowEditDeadlineModal(false);
            loadData('batches');
            showToast("Deadline updated", "success");
        } catch (err: any) {
            showToast("Failed to update deadline", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(API_ENDPOINTS.COURSES, courseForm, { headers: { Authorization: `Bearer ${token}` } });
            setShowCourseModal(false);
            setCourseForm({ name: "", description: "" });
            loadData('courses');
            showToast("Course created", "success");
        } catch (err) {
            showToast("Failed to create course", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleCreateInstructor = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(API_ENDPOINTS.INSTRUCTORS, instForm, { headers: { Authorization: `Bearer ${token}` } });
            setShowInstructorModal(false);
            setInstForm({ name: "", email: "", password: "" });
            loadData('instructors');
            showToast("Instructor created", "success");
        } catch (err: any) {
            showToast(err.response?.data?.error || "Failed to create instructor", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            const payload = { ...batchForm, enrollment_end_date: `${batchForm.enrollment_date}T${batchForm.enrollment_time}` };
            await axios.post(API_ENDPOINTS.BATCHS, payload, { headers: { Authorization: `Bearer ${token}` } });
            setShowBatchModal(false);
            setBatchForm({
                name: "", course_id: "", instructor_id: "", duration_days: 30, price: 0,
                enrollment_date: new Date().toISOString().split('T')[0], enrollment_time: "23:59"
            });
            loadData('batches');
            showToast("Batch created", "success");
        } catch (err: any) {
            showToast(err.response?.data?.error || "Failed to create batch", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.BATCHS}/${editBatchForm.id}`, editBatchForm, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setShowEditBatchModal(false);
            loadData('batches');
            showToast("Batch updated", "success");
        } catch (err: any) {
            showToast("Failed to update batch", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleEnrollment = async (batchId: number) => {
        const token = localStorage.getItem("snagup_token");
        const batch = batches.find(b => b.id === batchId);
        if (!batch) return;
        const payload = { status: batch.enrollment_status === 'open' ? 'closed' : 'open' };
        try {
            await axios.put(`${API_ENDPOINTS.BATCHS}/${batchId}/enrollment`, payload, { headers: { Authorization: `Bearer ${token}` } });
            loadData('batches');
            showToast(`Enrollment ${payload.status}`, "info");
        } catch (err: any) {
            showToast("Action failed", "error");
        }
    };

    const handleFinalizeBatch = async (batchId: number) => {
        if (!confirm("Finalize admissions PERMANENTLY?")) return;
        const token = localStorage.getItem("snagup_token");
        try {
            await axios.put(`${API_ENDPOINTS.BATCHS}/${batchId}/finalize`, {}, { headers: { Authorization: `Bearer ${token}` } });
            loadData('batches');
            showToast("Batch finalized", "success");
        } catch (err: any) {
            showToast("Action failed", "error");
        }
    };

    const handleArchiveBatch = async (batchId: number) => {
        if (!confirm("Archive batch & generate certificates?")) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.BATCHS}/${batchId}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Batch archived", "success");
            loadData('batches');
        } catch (err: any) {
            showToast("Action failed", "error");
        }
    };

    const handleEnrollmentAction = async (id: number, status: 'approved' | 'rejected', category: 'full' | 'invalid' = 'full', feedback: string = '', paid_amount: number = 0) => {
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.ENROLLMENTS}/${id}/status`, { status, category, feedback, paid_amount }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadData('payments');
            showToast(`Action: ${status}`, "success");
        } catch (err: any) {
            showToast("Action failed", "error");
        }
    };

    const handleDeleteBatch = async (id: number) => {
        if (!confirm('Permanently delete this batch?')) return;
        try {
            const token = localStorage.getItem('snagup_token');
            await axios.delete(`${API_ENDPOINTS.BATCHS}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Batch deleted', 'success');
            loadData('batches');
        } catch (err: any) {
            showToast('Delete failed', 'error');
        }
    };

    const handleBulkBatchUpdate = async (ids: number[], action: 'active' | 'archived') => {
        if (!ids || ids.length === 0) return;
        setBulkLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.BATCHS}/bulk-update`, { ids, action }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedBatches([]);
            loadData('batches');
            showToast(`Bulk ${action} done`, "success");
        } catch (err: any) {
            showToast("Bulk action failed", "error");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setUpiSettings(prev => ({ ...prev, upi_qr_image: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const handleSaveUpiSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpiSaving(true);
        try {
            const token = localStorage.getItem('snagup_token');
            await axios.put(API_ENDPOINTS.SETTINGS, upiSettings, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Payment settings saved', "success");
        } catch (err) {
            showToast('Save failed', "error");
        } finally {
            setUpiSaving(false);
        }
    };

    const handleSaveNotifSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotifSaving(true);
        setSettingsMessage({ type: null, text: "" });
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(API_ENDPOINTS.SETTINGS, { session_reminders: JSON.stringify(notifSettings) }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Notifications updated", "success");
        } catch (err: any) {
            showToast("Update failed", "error");
        } finally {
            setNotifSaving(false);
        }
    };

    const handleDeleteCourse = async (courseId: number) => {
        if (!confirm("Delete this course & all related batches?")) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.delete(`${API_ENDPOINTS.COURSES}/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
            loadData('courses');
            showToast("Course deleted", "success");
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    const handleEndBatch = async (batchId: number) => {
        if (!confirm("Mark this batch as completed?")) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.BATCHS}/${batchId}/end`, {}, { headers: { Authorization: `Bearer ${token}` } });
            loadData('batches');
            showToast("Batch ended", "success");
        } catch (err) {
            showToast("Action failed", "error");
        }
    };

    const handleDeleteUser = async (userId: number, name: string) => {
        if (!confirm(`Delete user "${name}"?`)) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.delete(`${API_ENDPOINTS.USERS}/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            showToast("User deleted", "success");
            loadData();
        } catch (err: any) {
            showToast("Delete failed", "error");
        }
    };

    const handleOfficialClose = async (batchId: number) => {
        if (!confirm("OFFICIAL CLOSURE: Hide from students?")) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.BATCHS}/${batchId}/close`, {}, { headers: { Authorization: `Bearer ${token}` } });
            loadData('batches');
            showToast("Batch closed", "success");
        } catch (err) {
            showToast("Action failed", "error");
        }
    };

    const handleGenerateCert = async (studentId: number, batchId: number) => {
        setFormLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.CERTIFICATES}/generate`, { student_id: studentId, batch_id: batchId }, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Certificate generated", "success");
            setShowCertModal(false);
        } catch (err: any) {
            showToast("Generation failed", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const openEnrollmentsModal = async () => {
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ENROLLMENTS}?status=pending`, { headers: { Authorization: `Bearer ${token}` } });
            setEnrollments(res.data);
            setShowEnrollmentModal(true);
        } catch (err) {
            showToast("Failed to load enrollments", "error");
        }
    };

    const openCertModal = async () => {
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ENROLLMENTS}?status=approved`, { headers: { Authorization: `Bearer ${token}` } });
            setApprovedEnrollments(res.data);
            setShowCertModal(true);
        } catch (err) {
            showToast("Failed to load enrollments", "error");
        }
    };

    const handleDeleteCertificate = async (id: number) => {
        if (!confirm("Revoke this certificate? This will delete the record and the PDF file.")) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.delete(`${API_ENDPOINTS.CERTIFICATES}/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setCertificates(certificates.filter(c => c.id !== id));
            showToast("Certificate revoked", "success");
        } catch (err) {
            showToast("Failed to delete certificate", "error");
        }
    };

    const preloadDropdowns = async () => {
        const token = localStorage.getItem("snagup_token");
        try {
            const [cRes, iRes] = await Promise.all([
                axios.get(`${API_ENDPOINTS.COURSES}?all=true`),
                axios.get(API_ENDPOINTS.INSTRUCTORS, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setCourses(cRes.data);
            setInstructors(iRes.data);
        } catch (err) {}
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return setSettingsMessage({ type: "error", text: "New passwords do not match" });
        }
        setSettingsLoading(true);
        setSettingsMessage({ type: null, text: "" });
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.post(`${API_ENDPOINTS.AUTH}/password`, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            }, { headers: { Authorization: `Bearer ${token}` } });
            setSettingsMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            setSettingsMessage({ type: "error", text: err.response?.data?.error || "Failed to change password" });
        } finally {
            setSettingsLoading(false);
        }
    };

    const openEditDeadline = (batch: any) => {
        setSelectedBatchForDeadline(batch);
        if (batch.enrollment_end_date) {
            const [d, t] = batch.enrollment_end_date.split('T');
            setEditDeadlineForm({ date: d, time: t.substring(0, 5) });
        } else {
            const { enrollment_date, enrollment_time } = getLocalDatetime();
            setEditDeadlineForm({ date: enrollment_date, time: enrollment_time });
        }
        setShowEditDeadlineModal(true);
    };

    const handleSelectAllBatches = () => {
        if (selectedBatches.length === batches.length) {
            setSelectedBatches([]);
        } else {
            setSelectedBatches(batches.map((b: any) => b.id));
        }
    };

    const handleToggleBatchSelection = (id: number) => {
        setSelectedBatches(prev => prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]);
    };

    const handleStartBatch = async (batchId: number) => {
        if (!confirm("Start this batch now?")) return;
        try {
            const token = localStorage.getItem("snagup_token");
            await axios.put(`${API_ENDPOINTS.BATCHS}/${batchId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } });
            loadData('batches');
            showToast("Batch started", "success");
        } catch (err) {
            showToast("Failed to start batch", "error");
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setGeneralSettings(prev => ({ ...prev, site_logo: base64String }));
        };
        reader.readAsDataURL(file);
    };

    return {
        // State
        stats, loading, toast, activeTab, setActiveTab,
        paymentTab, setPaymentTab, isMobileMenuOpen, setIsMobileMenuOpen,
        tabLoading, publicSettings, inquiries, courses, instructors,
        batches, enrollments, approvedEnrollments, payments, students,
        batchSearch, setBatchSearch, batchCourseFilter, setBatchCourseFilter,
        batchStatusFilter, setBatchStatusFilter, paymentSearch, setPaymentSearch,
        paymentStatusFilter, setPaymentStatusFilter, inquirySearch, setInquirySearch,
        inquiryServiceFilter, setInquiryServiceFilter, inquiryStatusFilter, setInquiryStatusFilter,
        attendanceSearch, setAttendanceSearch, studentSearch, setStudentSearch,
        attCourseId, setAttCourseId, attBatchId, setAttBatchId, attendanceData, attLoading,
        showCourseModal, setShowCourseModal, showBatchModal, setShowBatchModal,
        showEditBatchModal, setShowEditBatchModal, editBatchForm, setEditBatchForm,
        selectedBatches, setSelectedBatches, bulkLoading, showEnrollmentModal,
        setShowEnrollmentModal, showCertModal, setShowCertModal, showInstructorModal,
        setShowInstructorModal, showEditDeadlineModal, setShowEditDeadlineModal,
        selectedBatchForDeadline, setSelectedBatchForDeadline, editDeadlineForm, setEditDeadlineForm,
        profileForm, setProfileForm, passwordForm, setPasswordForm, upiSettings, setUpiSettings,
        upiSaving, generalSettings, setGeneralSettings, genSaving, notifSettings, setNotifSettings,
        notifSaving, upiMessage, setUpiMessage, settingsLoading, settingsMessage, setSettingsMessage,
        settingsActiveTab, setSettingsActiveTab, showPasswords, setShowPasswords, showInstPassword, setShowInstPassword,
        courseForm, setCourseForm, batchForm, setBatchForm, instForm, setInstForm, formLoading,
        certificates, certSearch, setCertSearch, certCourseFilter, setCertCourseFilter,

        // Filtered Data
        filteredBatches, filteredPayments, filteredInquiries, filteredAttendance, filteredStudents, attendanceBatches, emailLogs,
        filteredCertificates,

        // Actions
        loadData, handleLogout, handleInquiryStatus, handleUpdateProfile, handleSaveGeneralSettings,
        handleUpdateDeadline, showToast, fetchAttendanceData,
        handleCreateCourse, handleCreateInstructor, handleCreateBatch, handleEditBatchSubmit,
        handleToggleEnrollment, handleFinalizeBatch, handleArchiveBatch, handleEnrollmentAction,
        handleDeleteBatch, handleBulkBatchUpdate, handleQrUpload, handleSaveUpiSettings,
        handleSaveNotifSettings, handleDeleteCourse, handleEndBatch,
        handleDeleteUser, handleOfficialClose, handleGenerateCert, openEnrollmentsModal,
        openCertModal, preloadDropdowns, handleChangePassword, openEditDeadline,
        handleSelectAllBatches, handleToggleBatchSelection, handleStartBatch, handleLogoUpload,
        getLocalDatetime, setToast, setAttendanceData, handleDeleteCertificate
    };
};
