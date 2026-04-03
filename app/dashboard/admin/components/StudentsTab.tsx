'use client';

import React from 'react';
import { Search, Loader2, User, Globe, Phone, Trash2 } from 'lucide-react';

interface StudentsTabProps {
    students: any[];
    filteredStudents: any[];
    studentSearch: string;
    setStudentSearch: (search: string) => void;
    tabLoading: boolean;
    handleDeleteUser: (id: number, name: string) => void;
}

const StudentsTab: React.FC<StudentsTabProps> = ({
    students,
    filteredStudents,
    studentSearch,
    setStudentSearch,
    tabLoading,
    handleDeleteUser
}) => {
    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">Student Registry</h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Enrolled Learner Management & Data Control</p>
                </div>
                <div className="flex-1 max-w-sm w-full flex items-center gap-2 px-3 py-2.5 bg-muted/20 border border-border/20 rounded-2xl focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        placeholder="Search student name or email..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="flex-1 bg-transparent text-[12px] font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                    />
                </div>
            </div>
            {tabLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 text-foreground animate-spin" strokeWidth={3} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="pb-6 pr-8">Learner Profile</th>
                                <th className="pb-6 px-8">Contact Channels</th>
                                <th className="pb-6 px-8 text-center text-[10px]">Enrollment Weight</th>
                                <th className="pb-6 px-8 text-right">System Join Date</th>
                                <th className="pb-6 px-8 text-right w-20">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredStudents.map((student: any) => (
                                <tr key={student.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                    <td className="py-8 pr-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-foreground/50 border border-border/20 group-hover:bg-foreground group-hover:text-background transition-all">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-black text-foreground text-lg tracking-tight mb-1">{student.name}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-40">STUDENT ID: {student.id.toString().padStart(4, '0')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-8 px-8">
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
                                    <td className="py-8 px-8 text-center">
                                        <span className="px-5 py-2.5 bg-foreground/5 rounded-full text-[13px] font-black text-foreground border border-foreground/10">
                                            {student.enrollment_count}
                                        </span>
                                    </td>
                                    <td className="py-8 px-8 text-right font-black text-[11px] text-muted-foreground tracking-widest opacity-50">
                                        {new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                    </td>
                                    <td className="py-8 px-8 text-right uppercase">
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
                            {students.length === 0 && (
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
