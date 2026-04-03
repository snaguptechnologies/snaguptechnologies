import React from 'react';
import { Search, Loader2, CheckCircle, X } from 'lucide-react';

interface AttendanceTabProps {
    attendanceSearch: string;
    setAttendanceSearch: (search: string) => void;
    attCourseId: string;
    setAttCourseId: (id: string) => void;
    attBatchId: string;
    setAttBatchId: (id: string) => void;
    attendanceData: any;
    setAttendanceData: (data: any) => void;
    courses: any[];
    attendanceBatches: any[];
    attLoading: boolean;
    filteredAttendance: any;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({
    attendanceSearch,
    setAttendanceSearch,
    attCourseId,
    setAttCourseId,
    setAttBatchId,
    setAttendanceData,
    attBatchId,
    courses,
    attendanceBatches,
    attLoading,
    filteredAttendance,
    attendanceData
}) => {
    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">Attendance Records</h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Global Student Attendance Logistics</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-72 flex items-center gap-2 px-3 py-2.5 bg-muted/20 border border-border/20 rounded-2xl focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Search student name..."
                            value={attendanceSearch}
                            onChange={(e) => setAttendanceSearch(e.target.value)}
                            className="flex-1 bg-transparent text-[12px] font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={attCourseId}
                            onChange={e => { setAttCourseId(e.target.value); setAttBatchId(''); setAttendanceData(null); }}
                            className="px-4 py-3 bg-muted/20 border border-border/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-muted/30 transition-all font-bold"
                        >
                            <option value="">All Programs</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select
                            value={attBatchId}
                            onChange={e => setAttBatchId(e.target.value)}
                            className="px-4 py-3 bg-muted/20 border border-border/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-muted/30 transition-all font-bold"
                        >
                            <option value="">All Cohorts</option>
                            {attendanceBatches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {attLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-12 h-12 text-foreground animate-spin" strokeWidth={3} /></div>
            ) : filteredAttendance && filteredAttendance.students.length > 0 ? (
                <div className="overflow-x-auto pb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="pb-6 pr-8 sticky left-0 bg-background/95 backdrop-blur-md z-10 w-64 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)]">Student Identity</th>
                                {filteredAttendance.dates.map((date: string) => (
                                    <th key={date} className="pb-6 px-4 text-center whitespace-nowrap min-w-[80px]">
                                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </th>
                                ))}
                                <th className="pb-6 px-4 text-right">%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredAttendance.students.map((student: any) => {
                                const total = filteredAttendance.dates.length;
                                const present = filteredAttendance.dates.filter((d: string) => filteredAttendance.records[student.id]?.[d] === 'present').length;
                                const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                                return (
                                    <tr key={student.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                        <td className="py-5 pr-8 sticky left-0 bg-background/95 backdrop-blur-md z-10 w-64 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)]">
                                            <div className="font-bold text-foreground text-sm tracking-tight mb-1">{student.name}</div>
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 lowercase">{student.email}</div>
                                        </td>
                                        {filteredAttendance.dates.map((date: string) => {
                                            const status = filteredAttendance.records[student.id]?.[date];
                                            return (
                                                <td key={date} className="py-5 px-4 text-center">
                                                    {status === 'present' ? (
                                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /></div>
                                                    ) : status === 'absent' ? (
                                                        <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20"><X className="w-3.5 h-3.5" /></div>
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
            ) : attendanceData ? (
                <div className="py-20 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20">No students found or no records for this batch</div>
            ) : (
                <div className="py-20 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20 border border-dashed border-border/50 rounded-3xl bg-muted/5">Select a program and cohort to view records</div>
            )}
        </div>
    );
};

export default AttendanceTab;
