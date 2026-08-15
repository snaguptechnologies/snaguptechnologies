'use client';

import React, { useState, useMemo } from 'react';
import { 
    Search, Users, Calendar, Eye, X, BookOpen, User, Mail, ShieldCheck, Clock
} from 'lucide-react';

interface BatchesTabProps {
    courses: any[];
    enrollments?: any[];
    tabLoading?: boolean;
    students?: any[];
}

const BatchesTab: React.FC<BatchesTabProps> = ({
    courses = [],
    enrollments = [],
    tabLoading = false,
    students = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseForView, setSelectedCourseForView] = useState<any>(null);

    // Group enrollments by course ID
    const courseEnrollmentMap = useMemo(() => {
        const map: { [courseId: number]: any[] } = {};
        
        (enrollments || []).forEach(e => {
            const courseId = e.course_id;
            if (courseId) {
                if (!map[courseId]) {
                    map[courseId] = [];
                }
                map[courseId].push(e);
            }
        });
        return map;
    }, [enrollments]);

    // Format date cleanly e.g. "15 Aug 2026"
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

    // Filter courses by search query
    const filteredCourses = useMemo(() => {
        return (courses || []).filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [courses, searchQuery]);

    // Enrolled students for selected modal course
    const selectedCourseStudents = useMemo(() => {
        if (!selectedCourseForView) return [];
        const courseEnrs = courseEnrollmentMap[selectedCourseForView.id] || [];
        
        // Map enrollments to detailed student records
        return courseEnrs.map(enr => {
            const matchedStudent = (students || []).find(s => s.id === enr.student_id);
            return {
                id: enr.id,
                student_id: enr.student_id,
                name: enr.student_name || matchedStudent?.name || 'Unknown Student',
                email: enr.student_email || matchedStudent?.email || 'N/A',
                phone: enr.student_phone || matchedStudent?.phone || 'N/A',
                enrolled_at: enr.enrolled_at || enr.created_at,
                status: enr.status || 'approved'
            };
        }).sort((a, b) => new Date(b.enrolled_at || 0).getTime() - new Date(a.enrolled_at || 0).getTime());
    }, [selectedCourseForView, courseEnrollmentMap, students]);

    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            {/* Header & Controls */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight uppercase mb-1 flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-primary" /> Course Enrollment Management
                        </h1>
                        <p className="text-[11px] text-muted-foreground font-bold tracking-[0.2em] uppercase opacity-70">
                            Real-Time Student Registration & Course Enrollments
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="w-80 flex items-center gap-2 px-4 py-3 bg-muted/20 border border-border/30 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Search course by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-xs font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                        />
                    </div>

                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-4 py-2.5 rounded-xl border border-border/20">
                        Total Courses: <span className="text-foreground font-black">{courses.length}</span>
                    </div>
                </div>
            </div>

            {/* Main Course Enrollments Table */}
            {tabLoading ? (
                <div className="py-24 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-border/30 bg-card/40 backdrop-blur-md shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="py-4 px-6">COURSE</th>
                                <th className="py-4 px-6 text-center">ENROLLED STUDENTS</th>
                                <th className="py-4 px-6 text-center">LATEST ENROLLMENT</th>
                                <th className="py-4 px-6 text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredCourses.map((course: any) => {
                                const courseEnrs = courseEnrollmentMap[course.id] || [];
                                const totalEnrolled = courseEnrs.length;
                                
                                // Calculate latest enrollment date
                                let latestDateStr: string | null = null;
                                if (courseEnrs.length > 0) {
                                    const sorted = [...courseEnrs].sort((a, b) => 
                                        new Date(b.enrolled_at || b.created_at || 0).getTime() - new Date(a.enrolled_at || a.created_at || 0).getTime()
                                    );
                                    latestDateStr = sorted[0].enrolled_at || sorted[0].created_at;
                                }

                                return (
                                    <tr key={course.id} className="hover:bg-muted/20 transition-colors group">
                                        {/* COURSE COLUMN */}
                                        <td className="py-4 px-6 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground text-sm tracking-tight leading-snug group-hover:text-primary transition-colors">
                                                        {course.name}
                                                    </div>
                                                    {course.description && (
                                                        <div className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">
                                                            {course.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* ENROLLED STUDENTS COLUMN */}
                                        <td className="py-4 px-6 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                                                totalEnrolled > 0 
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                : 'bg-muted/50 text-muted-foreground border border-border/40'
                                            }`}>
                                                <Users className="w-3.5 h-3.5" />
                                                {totalEnrolled} {totalEnrolled === 1 ? 'Student' : 'Students'}
                                            </span>
                                        </td>

                                        {/* LATEST ENROLLMENT COLUMN */}
                                        <td className="py-4 px-6 align-middle text-center">
                                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                {formatDate(latestDateStr)}
                                            </div>
                                        </td>

                                        {/* ACTION COLUMN */}
                                        <td className="py-4 px-6 align-middle text-right">
                                            <button
                                                onClick={() => setSelectedCourseForView(course)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> VIEW STUDENTS
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredCourses.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-muted-foreground italic font-medium">
                                        No courses found matching "{searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VIEW STUDENTS MODAL */}
            {selectedCourseForView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div 
                        className="fixed inset-0 bg-background/80 backdrop-blur-md" 
                        onClick={() => setSelectedCourseForView(null)} 
                    />
                    
                    <div className="relative w-full max-w-4xl bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                                    Enrolled Students Overview
                                </div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">
                                    {selectedCourseForView.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-xs font-bold text-muted-foreground">
                                    <span>Total Enrolled: <strong className="text-foreground">{selectedCourseStudents.length} Students</strong></span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedCourseForView(null)}
                                className="p-2.5 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Student List Table */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {selectedCourseStudents.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                                    <Users className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-semibold italic">No students are currently enrolled in this course.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                            <th className="pb-3 px-4">Student Name</th>
                                            <th className="pb-3 px-4">Email</th>
                                            <th className="pb-3 px-4">Enrollment Date</th>
                                            <th className="pb-3 px-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {selectedCourseStudents.map((st) => (
                                            <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3.5 px-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 shrink-0">
                                                            {st.name?.charAt(0) || 'S'}
                                                        </div>
                                                        <div className="font-bold text-foreground text-sm">
                                                            {st.name}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 align-middle text-xs font-medium text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                        {st.email}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 align-middle text-xs font-semibold text-foreground/80">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                        {formatDate(st.enrolled_at)}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 align-middle text-right">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                        st.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        st.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}>
                                                        {st.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 border-t border-border/30 bg-muted/10 flex justify-end">
                            <button
                                onClick={() => setSelectedCourseForView(null)}
                                className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl uppercase tracking-wider transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchesTab;
