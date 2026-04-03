'use client';

import React from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';

interface CoursesTabProps {
    courses: any[];
    tabLoading: boolean;
    setShowCourseModal: (show: boolean) => void;
    handleDeleteCourse: (id: number) => void;
}

const CoursesTab: React.FC<CoursesTabProps> = ({
    courses,
    tabLoading,
    setShowCourseModal,
    handleDeleteCourse
}) => {
    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">Academic Curriculum</h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Global Course Architecture Management</p>
                </div>
                <button onClick={() => setShowCourseModal(true)} className="flex items-center gap-3 px-8 py-4 bg-foreground hover:opacity-90 text-background rounded-2xl font-black transition-all shadow-2xl shadow-foreground/10 hover:-translate-y-1 uppercase tracking-widest text-[11px]">
                    <Plus className="w-5 h-5" /> Define New Architecture
                </button>
            </div>
            {tabLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 text-foreground animate-spin" strokeWidth={3} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="pb-6 pr-8">Program Identity</th>
                                <th className="pb-6 px-8">Technical Descriptor</th>
                                <th className="pb-6 px-8 text-right">Operational Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {courses.map((course: any) => (
                                <tr key={course.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                    <td className="py-8 pr-8">
                                        <div className="font-black text-foreground text-lg tracking-tight mb-1">{course.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">SYSTEM UID: {course.id.toString().padStart(4, '0')}</div>
                                    </td>
                                    <td className="py-8 px-8">
                                        <p className="text-sm text-foreground/70 leading-relaxed max-w-2xl font-medium italic opacity-80">
                                            {course.description || 'System documentation pending for this deployment package.'}
                                        </p>
                                    </td>
                                    <td className="py-8 px-8 text-right">
                                        <button onClick={() => handleDeleteCourse(course.id)} className="p-3.5 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-border/10 hover:border-rose-500/30 group">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {courses.length === 0 && (
                                <tr><td colSpan={3} className="py-32 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20">No active curriculums detected</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CoursesTab;
