'use client';

import React, { useState, useMemo } from 'react';
import { 
    Search, Loader2, User, Mail, Phone, Calendar, ChevronDown, 
    Eye, ShieldCheck, ShieldAlert, X, BookOpen, Layers, Award, CheckCircle, Clock, Plus, AlertCircle
} from 'lucide-react';

interface StudentsTabProps {
    students: any[];
    filteredStudents?: any[];
    studentSearch: string;
    setStudentSearch: (search: string) => void;
    tabLoading: boolean;
    handleDeleteUser?: (id: number, name: string) => void;
    handleToggleUserStatus?: (id: number, status: number | boolean) => void;
    handleAdminEnrollStudent?: (studentId: number, courseId: number) => Promise<{ success: boolean; error?: string; message?: string; enrollment?: any }>;
    courses: any[];
    batches?: any[];
    setReleaseCertModal?: (data: any) => void;
}

const ITEMS_PER_PAGE = 10;

const StudentsTab: React.FC<StudentsTabProps> = ({
    students = [],
    studentSearch,
    setStudentSearch,
    tabLoading,
    handleToggleUserStatus,
    handleAdminEnrollStudent,
    courses = []
}) => {
    // Internal filter & view states
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedStudentForView, setSelectedStudentForView] = useState<any>(null);
    const [detailTab, setDetailTab] = useState<'basic_courses' | 'performance' | 'attendance' | 'assessments' | 'certificates'>('basic_courses');

    // Admin Enroll Modal states
    const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
    const [enrollCourseId, setEnrollCourseId] = useState<string>('');
    const [enrollSubmitting, setEnrollSubmitting] = useState<boolean>(false);
    const [enrollError, setEnrollError] = useState<string>('');
    const [enrollSuccess, setEnrollSuccess] = useState<string>('');

    // Helper: Format Student ID (e.g. SNAG20260001)
    const formatStudentId = (id: number | string) => {
        const numericId = typeof id === 'number' ? id : parseInt(id, 10) || 0;
        return `SNAG2026${numericId.toString().padStart(4, '0')}`;
    };

    // Helper: Format Date (e.g. 15 Aug 2026)
    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return '—';
        }
    };

    // Computed filtered list
    const filteredList = useMemo(() => {
        return (students || []).filter((s) => {
            const studentIdFormatted = formatStudentId(s.id).toLowerCase();
            const query = (studentSearch || '').toLowerCase().trim();

            const matchesSearch = !query || 
                (s.name || '').toLowerCase().includes(query) ||
                (s.email || '').toLowerCase().includes(query) ||
                studentIdFormatted.includes(query) ||
                s.id.toString().includes(query);

            const isActiveBool = s.is_active === 1 || s.is_active === true || s.is_active === undefined;
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'active' && isActiveBool) || 
                (statusFilter === 'inactive' && !isActiveBool);

            const matchesCourse = !selectedCourseFilter || 
                (s.enrollments && Array.isArray(s.enrollments) && s.enrollments.some((e: any) => e.course_id?.toString() === selectedCourseFilter));

            return matchesSearch && matchesStatus && matchesCourse;
        });
    }, [students, studentSearch, statusFilter, selectedCourseFilter]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredList.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredList, currentPage]);

    // Reset to page 1 on search or filter change
    const handleSearchChange = (val: string) => {
        setStudentSearch(val);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (val: 'all' | 'active' | 'inactive') => {
        setStatusFilter(val);
        setCurrentPage(1);
    };

    const handleCourseFilterChange = (val: string) => {
        setSelectedCourseFilter(val);
        setCurrentPage(1);
    };

    const openEnrollModal = () => {
        setEnrollError('');
        setEnrollSuccess('');
        if (courses.length > 0) {
            setEnrollCourseId(courses[0].id.toString());
        } else {
            setEnrollCourseId('');
        }
        setShowEnrollModal(true);
    };

    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            {/* Page Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase mb-1 flex items-center gap-3">
                        <User className="w-8 h-8 text-primary" /> Student Management
                    </h1>
                    <p className="text-[11px] text-muted-foreground font-bold tracking-[0.2em] uppercase opacity-70">
                        Learner Profiles, Registration Records & Course Enrollments
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Search Field */}
                    <div className="w-full sm:w-72 flex items-center gap-2 px-4 py-2.5 bg-muted/20 border border-border/30 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or Student ID..."
                            value={studentSearch}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="flex-1 bg-transparent text-xs font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                        />
                    </div>

                    {/* Account Status Filter */}
                    <div className="relative group">
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                            className="appearance-none bg-muted/20 border border-border/30 rounded-2xl px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-muted/30 pr-8"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Accounts</option>
                            <option value="inactive">Inactive Accounts</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors" size={14} />
                    </div>

                    {/* Course Filter */}
                    <div className="relative group">
                        <select
                            value={selectedCourseFilter}
                            onChange={(e) => handleCourseFilterChange(e.target.value)}
                            className="appearance-none bg-muted/20 border border-border/30 rounded-2xl px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-muted/30 pr-8 max-w-[200px] truncate"
                        >
                            <option value="">All Courses</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors" size={14} />
                    </div>
                </div>
            </div>

            {/* Student Table */}
            {tabLoading ? (
                <div className="py-24 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-border/30 bg-card/40 backdrop-blur-md shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="py-4 px-6">STUDENT ID</th>
                                <th className="py-4 px-6">STUDENT NAME</th>
                                <th className="py-4 px-6">EMAIL</th>
                                <th className="py-4 px-6">PHONE</th>
                                <th className="py-4 px-6">REGISTERED</th>
                                <th className="py-4 px-6 text-center">STATUS</th>
                                <th className="py-4 px-6 text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {paginatedStudents.map((student: any) => {
                                const isActive = student.is_active === 1 || student.is_active === true || student.is_active === undefined;
                                const studentIdFormatted = formatStudentId(student.id);

                                return (
                                    <tr key={student.id} className="hover:bg-muted/20 transition-colors group">
                                        {/* STUDENT ID */}
                                        <td className="py-4 px-6 align-middle">
                                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                                                {studentIdFormatted}
                                            </span>
                                        </td>

                                        {/* STUDENT NAME */}
                                        <td className="py-4 px-6 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 shrink-0">
                                                    {student.name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                                    {student.name}
                                                </div>
                                            </div>
                                        </td>

                                        {/* EMAIL */}
                                        <td className="py-4 px-6 align-middle text-xs font-medium text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                {student.email}
                                            </div>
                                        </td>

                                        {/* PHONE */}
                                        <td className="py-4 px-6 align-middle text-xs font-medium text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                {student.phone || '—'}
                                            </div>
                                        </td>

                                        {/* REGISTRATION DATE */}
                                        <td className="py-4 px-6 align-middle text-xs font-semibold text-foreground/80">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                {formatDate(student.created_at)}
                                            </div>
                                        </td>

                                        {/* STATUS */}
                                        <td className="py-4 px-6 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                isActive 
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                : 'bg-muted/50 text-muted-foreground border-border/40'
                                            }`}>
                                                {isActive ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                                {isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* ACTION */}
                                        <td className="py-4 px-6 align-middle text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedStudentForView(student);
                                                    setDetailTab('basic_courses');
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:opacity-90 text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> VIEW
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {paginatedStudents.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-muted-foreground italic font-medium">
                                        No students found matching your search or filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {!tabLoading && filteredList.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-muted/20 border border-border/30 rounded-2xl">
                    <div className="text-xs font-semibold text-muted-foreground">
                        Showing <strong className="text-foreground">{Math.min(filteredList.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</strong> to <strong className="text-foreground">{Math.min(filteredList.length, currentPage * ITEMS_PER_PAGE)}</strong> of <strong className="text-foreground">{filteredList.length}</strong> students
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-bold px-3 py-1 bg-card rounded-lg border border-border/40 text-foreground">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* VIEW STUDENT DETAILS MODAL */}
            {selectedStudentForView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div 
                        className="fixed inset-0 bg-background/80 backdrop-blur-md" 
                        onClick={() => setSelectedStudentForView(null)} 
                    />
                    
                    <div className="relative w-full max-w-4xl bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                                    {selectedStudentForView.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">
                                            {selectedStudentForView.name}
                                        </h3>
                                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                                            {formatStudentId(selectedStudentForView.id)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                        Registered on {formatDate(selectedStudentForView.created_at)}
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedStudentForView(null)}
                                className="p-2.5 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Module Architecture Navigation Tabs */}
                        <div className="px-8 bg-muted/10 border-b border-border/20 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                            <button
                                onClick={() => setDetailTab('basic_courses')}
                                className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                                    detailTab === 'basic_courses' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <User className="w-3.5 h-3.5" /> Basic Info & Courses
                            </button>
                            <button
                                onClick={() => setDetailTab('performance')}
                                className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                                    detailTab === 'performance' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground opacity-70'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5" /> Performance <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">Coming Soon</span>
                            </button>
                            <button
                                onClick={() => setDetailTab('attendance')}
                                className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                                    detailTab === 'attendance' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground opacity-70'
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5" /> Attendance <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">Coming Soon</span>
                            </button>
                            <button
                                onClick={() => setDetailTab('assessments')}
                                className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                                    detailTab === 'assessments' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground opacity-70'
                                }`}
                            >
                                <CheckCircle className="w-3.5 h-3.5" /> Assessments <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">Coming Soon</span>
                            </button>
                            <button
                                onClick={() => setDetailTab('certificates')}
                                className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                                    detailTab === 'certificates' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground opacity-70'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" /> Certificates <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">Coming Soon</span>
                            </button>
                        </div>

                        {/* Modal Body Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {detailTab === 'basic_courses' && (
                                <>
                                    {/* Basic Information Grid */}
                                    <div className="bg-muted/20 border border-border/30 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <User className="w-4 h-4" /> Basic Information
                                            </h4>
                                            
                                            <div className="flex items-center gap-3">
                                                {/* ENROLL IN COURSE Button */}
                                                <button
                                                    onClick={openEnrollModal}
                                                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> ENROLL IN COURSE
                                                </button>

                                                {/* Account Status Toggle Action */}
                                                {handleToggleUserStatus && (
                                                    <button
                                                        onClick={() => handleToggleUserStatus(selectedStudentForView.id, selectedStudentForView.is_active)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                                            (selectedStudentForView.is_active === 1 || selectedStudentForView.is_active === true || selectedStudentForView.is_active === undefined)
                                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                                        }`}
                                                    >
                                                        {(selectedStudentForView.is_active === 1 || selectedStudentForView.is_active === true || selectedStudentForView.is_active === undefined)
                                                            ? 'Deactivate Account'
                                                            : 'Activate Account'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                            <div className="p-3 bg-card/60 rounded-xl border border-border/20">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Student ID</span>
                                                <span className="font-mono font-bold text-foreground">{formatStudentId(selectedStudentForView.id)}</span>
                                            </div>

                                            <div className="p-3 bg-card/60 rounded-xl border border-border/20">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Full Name</span>
                                                <span className="font-bold text-foreground">{selectedStudentForView.name}</span>
                                            </div>

                                            <div className="p-3 bg-card/60 rounded-xl border border-border/20">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Email Address</span>
                                                <span className="font-bold text-foreground truncate block">{selectedStudentForView.email}</span>
                                            </div>

                                            <div className="p-3 bg-card/60 rounded-xl border border-border/20">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Phone</span>
                                                <span className="font-bold text-foreground">{selectedStudentForView.phone || '—'}</span>
                                            </div>

                                            <div className="p-3 bg-card/60 rounded-xl border border-border/20">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Registration Date</span>
                                                <span className="font-bold text-foreground">{formatDate(selectedStudentForView.created_at)}</span>
                                            </div>

                                            <div className="p-3 bg-card/60 rounded-xl border border-border/20">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Account Status</span>
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    (selectedStudentForView.is_active === 1 || selectedStudentForView.is_active === true || selectedStudentForView.is_active === undefined)
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-muted/50 text-muted-foreground border-border/40'
                                                }`}>
                                                    {(selectedStudentForView.is_active === 1 || selectedStudentForView.is_active === true || selectedStudentForView.is_active === undefined) ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enrolled Courses Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" /> Enrolled Courses
                                            </h4>
                                            <span className="text-xs font-bold text-muted-foreground">
                                                Total Courses: <strong className="text-foreground">{selectedStudentForView.enrollments?.length || 0}</strong>
                                            </span>
                                        </div>

                                        {!selectedStudentForView.enrollments || selectedStudentForView.enrollments.length === 0 ? (
                                            <div className="py-12 border border-border/30 rounded-2xl bg-muted/10 text-center text-muted-foreground flex flex-col items-center gap-2">
                                                <BookOpen className="w-8 h-8 opacity-20" />
                                                <p className="text-xs font-semibold italic">This student has not enrolled in any courses yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedStudentForView.enrollments.map((enr: any, idx: number) => (
                                                    <div key={idx} className="p-4 rounded-2xl bg-muted/20 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0">
                                                                <BookOpen className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground text-sm">
                                                                    {enr.course_name || 'Enrolled Course'}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                                    <span>Enrolled: <strong>{formatDate(enr.enrolled_at)}</strong></span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                                                enr.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                enr.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                                'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                            }`}>
                                                                {enr.status || 'Enrolled'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Future Module Integration Views */}
                            {detailTab !== 'basic_courses' && (
                                <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3 border border-border/30 rounded-2xl bg-muted/10">
                                    <Layers className="w-12 h-12 opacity-20 text-primary" />
                                    <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                                        {detailTab.toUpperCase()} MODULE
                                    </h4>
                                    <p className="text-xs font-medium max-w-md text-muted-foreground">
                                        This integration point is reserved for future stage releases. Real performance, assessment, and attendance metrics will populate here when enabled.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 border-t border-border/30 bg-muted/10 flex justify-end">
                            <button
                                onClick={() => setSelectedStudentForView(null)}
                                className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl uppercase tracking-wider transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ENROLL STUDENT MODAL */}
            {showEnrollModal && selectedStudentForView && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowEnrollModal(false)} />
                    <div className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between pb-4 border-b border-border/30 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-foreground tracking-tight">Enroll Student</h3>
                                    <p className="text-[11px] text-muted-foreground font-medium">Assign a new course to learner</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEnrollModal(false)} className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Inline Alert Messages */}
                        {enrollError && (
                            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{enrollError}</span>
                            </div>
                        )}
                        {enrollSuccess && (
                            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>{enrollSuccess}</span>
                            </div>
                        )}

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Student</label>
                                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl font-bold text-foreground">
                                    {selectedStudentForView.name} ({formatStudentId(selectedStudentForView.id)})
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Select Course</label>
                                <select
                                    value={enrollCourseId}
                                    onChange={(e) => setEnrollCourseId(e.target.value)}
                                    className="w-full bg-muted/20 border border-border/30 rounded-xl p-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border/30">
                            <button
                                onClick={() => setShowEnrollModal(false)}
                                className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={enrollSubmitting || !enrollCourseId}
                                onClick={async () => {
                                    if (!handleAdminEnrollStudent) return;
                                    setEnrollSubmitting(true);
                                    setEnrollError('');
                                    setEnrollSuccess('');
                                    const res = await handleAdminEnrollStudent(selectedStudentForView.id, Number(enrollCourseId));
                                    setEnrollSubmitting(false);
                                    if (!res.success) {
                                        setEnrollError(res.error || "Student is already enrolled in this course.");
                                    } else {
                                        setEnrollSuccess("Student enrolled successfully!");
                                        if (res.enrollment) {
                                            setSelectedStudentForView((prev: any) => {
                                                if (!prev) return prev;
                                                const existing = prev.enrollments || [];
                                                return {
                                                    ...prev,
                                                    enrollment_count: (prev.enrollment_count || 0) + 1,
                                                    enrollments: [res.enrollment, ...existing]
                                                };
                                            });
                                        }
                                        setTimeout(() => {
                                            setShowEnrollModal(false);
                                            setEnrollSuccess('');
                                        }, 1200);
                                    }
                                }}
                                className="px-6 py-2.5 bg-primary text-primary-foreground font-black text-xs rounded-xl uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {enrollSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'JOIN COURSE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsTab;
