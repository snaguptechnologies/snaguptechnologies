'use client';

import React, { useState, useMemo } from 'react';
import { Search, Loader2, User, Globe, Phone, Trash2, ChevronDown } from 'lucide-react';

interface StudentsTabProps {
    students: any[];
    // filteredStudents prop retained for backward compatibility but will be ignored in favor of internal filtering
    filteredStudents?: any[];
    studentSearch: string;
    setStudentSearch: (search: string) => void;
    tabLoading: boolean;
    handleDeleteUser: (id: number, name: string) => void;
    courses: any[];
    batches: any[];
    setReleaseCertModal?: (data: any) => void;
}

const StudentsTab: React.FC<StudentsTabProps> = ({
    students,
    filteredStudents = [],
    studentSearch,
    setStudentSearch,
    tabLoading,
    handleDeleteUser,
    courses = [],
    batches = [],
    setReleaseCertModal
}) => {
    // New separate filters for Course and Batch
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedBatch, setSelectedBatch] = useState<string>('');

    // Filter available batches for the dropdown based on selected course
    const availableBatches = useMemo(() => {
        if (!selectedCourse) return batches;
        return batches.filter(b => b.course_id.toString() === selectedCourse);
    }, [batches, selectedCourse]);

    const computeFiltered = () => {
        // Base filter by name/email (existing search)
        let list = students.filter((s) =>
            (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
            (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
        );

        // Filter by Course
        if (selectedCourse) {
            list = list.filter((s) =>
                s.enrollments && Array.isArray(s.enrollments) && s.enrollments.some((e: any) => e.course_id.toString() === selectedCourse)
            );
        }

        // Filter by Batch
        if (selectedBatch) {
            list = list.filter((s) =>
                s.enrollments && Array.isArray(s.enrollments) && s.enrollments.some((e: any) => e.batch_id.toString() === selectedBatch)
            );
        }

        return list;
    };

    const displayStudents = computeFiltered();

    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">Student Registry</h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Enrolled Learner Management & Data Control</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:max-w-4xl">
                    {/* Search Field */}
                    <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-muted/20 border border-border/20 rounded-2xl focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Find by name or email..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="flex-1 bg-transparent text-[13px] font-bold focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                        />
                    </div>

                    {/* Course Filter */}
                    <div className="w-full sm:w-48 relative group">
                        <select
                            value={selectedCourse}
                            onChange={(e) => {
                                setSelectedCourse(e.target.value);
                                setSelectedBatch(''); // Reset batch when course changes
                            }}
                            className="w-full appearance-none bg-muted/20 border border-border/20 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-muted/30"
                        >
                            <option value="">All Courses</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors" size={14} />
                    </div>

                    {/* Batch Filter */}
                    <div className="w-full sm:w-48 relative group">
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="w-full appearance-none bg-muted/20 border border-border/20 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-muted/30"
                        >
                            <option value="">All Batches</option>
                            {availableBatches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors" size={14} />
                    </div>
                </div>
            </div>

            {tabLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 text-foreground animate-spin" strokeWidth={3} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="pb-6 pr-8">Learner Profile & Enrolled Courses</th>
                                <th className="pb-6 px-8">Contact Channels</th>
                                <th className="pb-6 px-8 text-center text-[10px]">Enrollments</th>
                                <th className="pb-6 px-8 text-right">System Join Date</th>
                                <th className="pb-6 px-8 text-right w-28">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {displayStudents.map((student: any) => (
                                <tr key={student.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                    <td className="py-8 pr-8 max-w-xs sm:max-w-md">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-foreground/50 border border-border/20 group-hover:bg-foreground group-hover:text-background transition-all shrink-0 mt-1">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-foreground text-lg tracking-tight mb-0.5">{student.name}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-40 mb-3">
                                                    STUDENT ID: {student.id.toString().padStart(4, '0')}
                                                </div>

                                                {/* Enrolled Courses & Cert Release Row */}
                                                {student.enrollments && Array.isArray(student.enrollments) && student.enrollments.length > 0 && (
                                                    <div className="space-y-2">
                                                        {student.enrollments.map((enr: any, idx: number) => {
                                                            const pct = Math.min(Math.round(((enr.attended_sessions || 0) / (enr.duration_days || 1)) * 100), 100);
                                                            const hasCert = !!enr.cert_id;
                                                            const isReleased = hasCert || enr.cert_status === 'ADMIN_RELEASED';

                                                            return (
                                                                <div key={idx} className="p-3 rounded-xl bg-muted/20 border border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-foreground">{enr.course_name}</span>
                                                                        <span className="text-[10px] text-muted-foreground font-bold">
                                                                            {enr.batch_name} • Progress: <strong className={pct >= 80 ? 'text-emerald-500' : 'text-amber-500'}>{pct}%</strong>
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isReleased ? (
                                                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                                                {enr.release_type === 'ADMIN_OVERRIDE' ? 'ADMIN_RELEASED' : 'GENERATED'}
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (setReleaseCertModal) {
                                                                                        setReleaseCertModal({
                                                                                            show: true,
                                                                                            student_id: student.id,
                                                                                            student_name: student.name,
                                                                                            course_id: enr.course_id,
                                                                                            course_name: enr.course_name,
                                                                                            batch_id: enr.batch_id,
                                                                                            batch_name: enr.batch_name,
                                                                                            progress: pct,
                                                                                            reason: ''
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-md shadow-amber-500/10 flex items-center gap-1"
                                                                            >
                                                                                Release Cert
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-8 px-8 align-top">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground/60">
                                                <Globe className="w-3.5 h-3.5 opacity-50" /> {student.email}
                                            </div>
                                            {student.phone && (
                                                <div className="flex items-center gap-2 text-sm font-bold text-foreground/60">
                                                    <Phone className="w-3.5 h-3.5 opacity-50" /> {student.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-8 px-8 text-center align-top">
                                        <span className="px-5 py-2.5 bg-foreground/5 rounded-full text-[13px] font-black text-foreground border border-foreground/10">
                                            {student.enrollment_count}
                                        </span>
                                    </td>
                                    <td className="py-8 px-8 text-right font-black text-[11px] text-muted-foreground tracking-widest opacity-50 align-top">
                                        {new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                    </td>
                                    <td className="py-8 px-8 text-right uppercase align-top">
                                        <button
                                            onClick={() => handleDeleteUser(student.id, student.name)}
                                            className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                            title="Delete Student"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {displayStudents.length === 0 && (
                                <tr><td colSpan={5} className="py-32 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20">No students currently registered</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentsTab;
