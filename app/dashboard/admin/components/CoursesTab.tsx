'use client';

import React from 'react';
import { Plus, Loader2, Trash2, Edit2, Search, Eye, Power, BookOpen, Users, CheckCircle, XCircle, Filter, Layers } from 'lucide-react';

interface CoursesTabProps {
    courses: any[];
    filteredCourses: any[];
    tabLoading: boolean;
    courseSearch: string;
    setCourseSearch: (query: string) => void;
    courseStatusFilter: 'all' | 'active' | 'inactive';
    setCourseStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
    setShowCourseModal: (show: boolean) => void;
    handleDeleteCourse: (id: number) => void;
    setShowEditCourseModal: (show: boolean) => void;
    setEditCourseForm: (form: any) => void;
    handleViewCourse: (course: any) => void;
    handleToggleCourseStatus: (id: number, currentStatus: string) => void;
    openSyllabusManager?: (course: any) => void;
}

const CoursesTab: React.FC<CoursesTabProps> = ({
    courses,
    filteredCourses,
    tabLoading,
    courseSearch,
    setCourseSearch,
    courseStatusFilter,
    setCourseStatusFilter,
    setShowCourseModal,
    handleDeleteCourse,
    setShowEditCourseModal,
    setEditCourseForm,
    handleViewCourse,
    handleToggleCourseStatus,
    openSyllabusManager
}) => {
    const displayCourses = filteredCourses || courses || [];

    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase mb-1 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-primary" /> Course Management
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60">
                        Global Course Architecture & Continuous Enrollment Control
                    </p>
                </div>
                <button
                    onClick={() => setShowCourseModal(true)}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-foreground hover:opacity-90 text-background rounded-2xl font-black transition-all shadow-xl shadow-foreground/10 hover:-translate-y-0.5 uppercase tracking-widest text-[11px]"
                >
                    <Plus className="w-5 h-5" /> ADD COURSE
                </button>
            </div>

            {/* CONTROLS: SEARCH & STATUS FILTER */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-card/40 p-4 rounded-2xl border border-border/20 backdrop-blur-sm">
                {/* SEARCH INPUT */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        placeholder="Search by Course Name, Course ID (e.g. SNAG-C001), or Category..."
                        className="w-full pl-11 pr-4 py-3 bg-muted/20 border border-border/40 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>

                {/* STATUS FILTER PILLS */}
                <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/20">
                    <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground px-2 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Status:
                    </span>
                    {(['all', 'active', 'inactive'] as const).map((st) => (
                        <button
                            key={st}
                            onClick={() => setCourseStatusFilter(st)}
                            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                                courseStatusFilter === st
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT TABLE / LOADING / EMPTY STATES */}
            {tabLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={3} />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fetching course catalog...</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-muted/20">
                                <th className="py-5 px-6">Course ID</th>
                                <th className="py-5 px-6">Course Name</th>
                                <th className="py-5 px-6">Category</th>
                                <th className="py-5 px-6 text-center">Students</th>
                                <th className="py-5 px-6 text-center">Status</th>
                                <th className="py-5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {displayCourses.map((course: any) => {
                                const formattedId = `SNAG-C${course.id.toString().padStart(3, '0')}`;
                                const isActive = course.status === 'active';

                                return (
                                    <tr key={course.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                        {/* COURSE ID */}
                                        <td className="py-5 px-6 font-mono text-xs font-bold text-muted-foreground tracking-wider">
                                            {formattedId}
                                        </td>

                                        {/* COURSE NAME */}
                                        <td className="py-5 px-6">
                                            <div className="font-black text-foreground text-base tracking-tight mb-0.5 group-hover:text-primary transition-colors">
                                                {course.name}
                                            </div>
                                            {course.description && (
                                                <p className="text-xs text-muted-foreground font-medium line-clamp-1 opacity-70">
                                                    {course.description}
                                                </p>
                                            )}
                                        </td>

                                        {/* CATEGORY */}
                                        <td className="py-5 px-6">
                                            <span className="px-3 py-1 bg-muted/40 text-foreground border border-border/30 rounded-lg text-xs font-bold tracking-wide">
                                                {course.category || 'Software Development'}
                                            </span>
                                        </td>

                                        {/* ENROLLED STUDENTS COUNT */}
                                        <td className="py-5 px-6 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-black text-xs">
                                                <Users className="w-3.5 h-3.5" />
                                                {course.enrolled_students || 0}
                                            </div>
                                        </td>

                                        {/* STATUS BADGE */}
                                        <td className="py-5 px-6 text-center">
                                            {isActive ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {/* VIEW */}
                                                <button
                                                    onClick={() => handleViewCourse(course)}
                                                    className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all border border-border/10 hover:border-border/30 flex items-center gap-1 text-[11px] font-bold"
                                                    title="View Course Details"
                                                >
                                                    <Eye className="w-4 h-4" /> View
                                                </button>

                                                {/* SYLLABUS */}
                                                {openSyllabusManager && (
                                                    <button
                                                        onClick={() => openSyllabusManager(course)}
                                                        className="p-2.5 rounded-xl text-primary bg-primary/5 hover:bg-primary/10 transition-all border border-primary/20 flex items-center gap-1 text-[11px] font-bold"
                                                        title="Manage Course Syllabus & Modules"
                                                    >
                                                        <Layers className="w-4 h-4" /> Syllabus
                                                    </button>
                                                )}

                                                {/* EDIT */}
                                                <button
                                                    onClick={() => {
                                                        setEditCourseForm({
                                                            id: course.id,
                                                            name: course.name,
                                                            category: course.category || 'Software Development',
                                                            status: course.status || 'active',
                                                            description: course.description || '',
                                                            learning_objectives: course.learning_objectives || '',
                                                            prerequisites: course.prerequisites || ''
                                                        });
                                                        setShowEditCourseModal(true);
                                                    }}
                                                    className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-border/10 hover:border-primary/30 flex items-center gap-1 text-[11px] font-bold"
                                                    title="Edit Course"
                                                >
                                                    <Edit2 className="w-4 h-4" /> Edit
                                                </button>

                                                {/* STATUS TOGGLE (ACTIVATE / DEACTIVATE) */}
                                                <button
                                                    onClick={() => handleToggleCourseStatus(course.id, course.status || 'active')}
                                                    className={`p-2.5 rounded-xl transition-all border flex items-center gap-1 text-[11px] font-bold ${
                                                        isActive
                                                            ? 'text-rose-400 hover:bg-rose-500/10 border-border/10 hover:border-rose-500/30'
                                                            : 'text-emerald-400 hover:bg-emerald-500/10 border-border/10 hover:border-emerald-500/30'
                                                    }`}
                                                    title={isActive ? "Deactivate Course" : "Activate Course"}
                                                >
                                                    <Power className="w-4 h-4" /> {isActive ? 'Deactivate' : 'Activate'}
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    onClick={() => handleDeleteCourse(course.id)}
                                                    className="p-2.5 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-border/10 hover:border-rose-500/30"
                                                    title="Delete Course (Danger)"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {displayCourses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                                            <p className="text-base font-black text-muted-foreground uppercase tracking-widest">
                                                No courses found.
                                            </p>
                                            {courseSearch && (
                                                <p className="text-xs text-muted-foreground/60 font-medium">
                                                    No results matching "{courseSearch}". Try adjusting your search query.
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CoursesTab;
