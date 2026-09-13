'use client';

import React, { useState } from 'react';
import { 
    BookOpen, Layers, Plus, Edit2, Trash2, ChevronDown, ChevronRight, 
    Link as LinkIcon, Video, CheckCircle, XCircle, ArrowLeft, Loader2, Power, FileText, AlertCircle, Award, HelpCircle, Clock, BarChart3
} from 'lucide-react';

interface SyllabusTabProps {
    course: any;
    syllabusData: any;
    syllabusLoading: boolean;
    onBack: () => void;
    openCreateModuleModal: (courseId: number) => void;
    openEditModuleModal: (module: any) => void;
    handleDeleteModule: (moduleId: number) => void;
    handleToggleModuleStatus: (moduleId: number, currentStatus: string) => void;
    openCreateLessonModal: (moduleId: number) => void;
    openEditLessonModal: (lesson: any) => void;
    handleDeleteLesson: (lessonId: number) => void;
    handleToggleLessonStatus: (lessonId: number, currentStatus: string) => void;
    // Assessment Props
    adminAssessments?: any[];
    adminAssessmentsLoading?: boolean;
    openCreateAssessmentModal?: (courseId: number) => void;
    openEditAssessmentModal?: (assessment: any) => void;
    handleDeleteAssessment?: (assessmentId: number) => void;
    openQuestionManager?: (assessment: any) => void;
    openAssessmentResults?: (assessment: any) => void;
}

const SyllabusTab: React.FC<SyllabusTabProps> = ({
    course,
    syllabusData,
    syllabusLoading,
    onBack,
    openCreateModuleModal,
    openEditModuleModal,
    handleDeleteModule,
    handleToggleModuleStatus,
    openCreateLessonModal,
    openEditLessonModal,
    handleDeleteLesson,
    handleToggleLessonStatus,
    adminAssessments = [],
    adminAssessmentsLoading = false,
    openCreateAssessmentModal,
    openEditAssessmentModal,
    handleDeleteAssessment,
    openQuestionManager,
    openAssessmentResults
}) => {
    // Sub tab state: modules or assessments
    const [activeSubTab, setActiveSubTab] = useState<'modules' | 'assessments'>('modules');
    // Keep track of open module accordions
    const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});

    const toggleModuleExpand = (moduleId: number) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const modules = syllabusData?.modules || [];
    const formattedCourseId = `SNAG-C${course?.id?.toString().padStart(3, '0')}`;

    return (
        <div className="animate-fade-in relative min-h-[600px] px-2 space-y-6">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/20 pb-6">
                <div>
                    <button 
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-wider mb-3 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Course Catalog
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-mono font-bold tracking-wider">
                            {formattedCourseId}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                            {course?.category || 'Software Development'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">
                        {course?.name} — Syllabus & Modules
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium max-w-2xl mt-1">
                        Manage structural modules, learning topics, resource links, and tutorial video assets.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {activeSubTab === 'modules' ? (
                        <button
                            onClick={() => openCreateModuleModal(course.id)}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-foreground hover:opacity-90 text-background rounded-2xl font-black transition-all shadow-xl shadow-foreground/10 uppercase tracking-widest text-xs"
                        >
                            <Plus className="w-4.5 h-4.5" /> ADD MODULE
                        </button>
                    ) : (
                        <button
                            onClick={() => openCreateAssessmentModal && openCreateAssessmentModal(course.id)}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-2xl font-black transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs"
                        >
                            <Plus className="w-4.5 h-4.5" /> CREATE ASSESSMENT
                        </button>
                    )}
                </div>
            </div>

            {/* SUB TAB NAVIGATION */}
            <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-2xl w-fit border border-border/50">
                <button
                    onClick={() => setActiveSubTab('modules')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeSubTab === 'modules'
                            ? "bg-background text-primary shadow-lg shadow-primary/5 border border-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                    <BookOpen className="w-4 h-4" /> Curriculum & Modules
                </button>
                <button
                    onClick={() => setActiveSubTab('assessments')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeSubTab === 'assessments'
                            ? "bg-background text-amber-500 shadow-lg shadow-amber-500/5 border border-amber-500/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                    <Award className="w-4 h-4" /> Assessments & Quizzes ({adminAssessments.length})
                </button>
            </div>

            {/* SUB TAB CONTENT */}
            {activeSubTab === 'modules' ? (
                /* LOADING STATE */
                syllabusLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={3} />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading course syllabus architecture...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {modules.map((mod: any) => {
                            const isExpanded = expandedModules[mod.id] ?? true; // Default expanded
                        const isActive = mod.status === 'active';
                        const lessons = mod.lessons || [];

                        return (
                            <div 
                                key={mod.id} 
                                className="bg-card/40 border border-border/30 rounded-2xl overflow-hidden backdrop-blur-sm shadow-md transition-all"
                            >
                                {/* MODULE HEADER / ACCORDION TRIGGER */}
                                <div className="p-5 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20">
                                    <div className="flex items-start gap-4 flex-1">
                                        <button
                                            onClick={() => toggleModuleExpand(mod.id)}
                                            className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all mt-0.5"
                                        >
                                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                        </button>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-0.5 bg-muted/60 text-muted-foreground rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                                                    Module #{mod.sequence_order}
                                                </span>
                                                {isActive ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase">
                                                        <XCircle className="w-3 h-3" /> Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-black text-foreground tracking-tight">
                                                {mod.title}
                                            </h3>
                                            {mod.description && (
                                                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-3xl">
                                                    {mod.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* MODULE ACTIONS */}
                                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                        <button
                                            onClick={() => openCreateLessonModal(mod.id)}
                                            className="px-3.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 flex items-center gap-1.5 text-xs font-bold"
                                            title="Add Lesson to Module"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Lesson
                                        </button>

                                        <button
                                            onClick={() => openEditModuleModal(mod)}
                                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border/20"
                                            title="Edit Module"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleToggleModuleStatus(mod.id, mod.status || 'active')}
                                            className={`p-2 rounded-xl transition-all border ${
                                                isActive 
                                                    ? 'text-rose-400 hover:bg-rose-500/10 border-border/20' 
                                                    : 'text-emerald-400 hover:bg-emerald-500/10 border-border/20'
                                            }`}
                                            title={isActive ? "Deactivate Module" : "Activate Module"}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteModule(mod.id)}
                                            className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-border/20"
                                            title="Delete Module"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* LESSONS LIST (COLLAPSIBLE) */}
                                {isExpanded && (
                                    <div className="p-4 bg-muted/5 divide-y divide-border/10 space-y-3">
                                        {lessons.map((lesson: any) => {
                                            const isLessonActive = lesson.status === 'active';
                                            return (
                                                <div 
                                                    key={lesson.id} 
                                                    className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                                                >
                                                    <div className="flex items-start gap-3 pl-4 border-l-2 border-primary/30">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                                                                    Topic #{lesson.sequence_order}
                                                                </span>
                                                                {isLessonActive ? (
                                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                                                {lesson.title}
                                                            </div>
                                                            {lesson.description && (
                                                                <p className="text-xs text-muted-foreground font-medium max-w-2xl">
                                                                    {lesson.description}
                                                                </p>
                                                            )}
                                                            {/* RESOURCE & VIDEO LINKS */}
                                                            <div className="flex items-center gap-3 pt-1">
                                                                {lesson.resource_url && (
                                                                    <a 
                                                                        href={lesson.resource_url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                                                    >
                                                                        <LinkIcon className="w-3 h-3" /> Resource Link
                                                                    </a>
                                                                )}
                                                                {lesson.video_url && (
                                                                    <a 
                                                                        href={lesson.video_url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:underline"
                                                                    >
                                                                        <Video className="w-3 h-3" /> Video Tutorial
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* LESSON ACTIONS */}
                                                    <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 opacity-90 group-hover:opacity-100">
                                                        <button
                                                            onClick={() => openEditLessonModal(lesson)}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border/10"
                                                            title="Edit Lesson"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleToggleLessonStatus(lesson.id, lesson.status || 'active')}
                                                            className={`p-1.5 rounded-lg transition-all border ${
                                                                isLessonActive 
                                                                    ? 'text-rose-400 hover:bg-rose-500/10 border-border/10' 
                                                                    : 'text-emerald-400 hover:bg-emerald-500/10 border-border/10'
                                                            }`}
                                                            title={isLessonActive ? "Deactivate Lesson" : "Activate Lesson"}
                                                        >
                                                            <Power className="w-3.5 h-3.5" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteLesson(lesson.id)}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-border/10"
                                                            title="Delete Lesson"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {lessons.length === 0 && (
                                            <div className="py-6 text-center text-muted-foreground text-xs font-semibold italic flex items-center justify-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-muted-foreground/40" />
                                                No lessons added to this module yet. Click "+ Add Lesson" above.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {modules.length === 0 && (
                        <div className="py-24 text-center rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <Layers className="w-12 h-12 text-muted-foreground/30" />
                                <p className="text-base font-black text-muted-foreground uppercase tracking-widest">
                                    No syllabus modules defined yet.
                                </p>
                                <p className="text-xs text-muted-foreground/60 font-medium max-w-md">
                                    Click "+ ADD MODULE" above to start structuring the academic curriculum for this course.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                )
            ) : (
                /* ASSESSMENTS TAB CONTENT */
                adminAssessmentsLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" strokeWidth={3} />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading course assessments...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {adminAssessments.length === 0 ? (
                            <div className="py-24 text-center rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm p-8 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                                    <Award className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-foreground uppercase tracking-widest">No Assessments Created Yet</h3>
                                    <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                                        Click "+ CREATE ASSESSMENT" above to add module quizzes or course-wide evaluation exams.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {adminAssessments.map((ass: any) => {
                                    const isAssActive = ass.status === 'active';

                                    return (
                                        <div 
                                            key={ass.id}
                                            className="bg-card/40 border border-border/30 rounded-2xl p-6 backdrop-blur-sm shadow-md transition-all space-y-4"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        {ass.module_title ? (
                                                            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                                                                Module: {ass.module_title}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                                                                Course Assessment
                                                            </span>
                                                        )}

                                                        {isAssActive ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase">
                                                                <CheckCircle className="w-3 h-3" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase">
                                                                <XCircle className="w-3 h-3" /> Inactive
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-black text-foreground tracking-tight">
                                                        {ass.title}
                                                    </h3>
                                                    {ass.description && (
                                                        <p className="text-xs text-muted-foreground font-medium max-w-3xl">
                                                            {ass.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                                                    <button
                                                        onClick={() => openQuestionManager && openQuestionManager(ass)}
                                                        className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/20 flex items-center gap-1.5 text-xs font-bold"
                                                        title="Manage Questions"
                                                    >
                                                        <HelpCircle className="w-4 h-4" /> Questions ({ass.question_count || 0})
                                                    </button>

                                                    <button
                                                        onClick={() => openAssessmentResults && openAssessmentResults(ass)}
                                                        className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 flex items-center gap-1.5 text-xs font-bold"
                                                        title="View Student Submissions"
                                                    >
                                                        <BarChart3 className="w-4 h-4" /> Results
                                                    </button>

                                                    <button
                                                        onClick={() => openEditAssessmentModal && openEditAssessmentModal(ass)}
                                                        className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-all border border-border/20"
                                                        title="Edit Assessment"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteAssessment && handleDeleteAssessment(ass.id)}
                                                        className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-border/20"
                                                        title="Delete Assessment"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/20">
                                                <div className="p-2.5 bg-muted/20 rounded-xl space-y-0.5">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Questions</p>
                                                    <p className="text-xs font-black text-foreground">{ass.question_count || 0} Questions</p>
                                                </div>
                                                <div className="p-2.5 bg-muted/20 rounded-xl space-y-0.5">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Pass Threshold</p>
                                                    <p className="text-xs font-black text-amber-500">{ass.pass_percentage}% Marks</p>
                                                </div>
                                                <div className="p-2.5 bg-muted/20 rounded-xl space-y-0.5">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Time Limit</p>
                                                    <p className="text-xs font-black text-foreground">{ass.time_limit_mins > 0 ? `${ass.time_limit_mins} Mins` : 'No Limit'}</p>
                                                </div>
                                                <div className="p-2.5 bg-muted/20 rounded-xl space-y-0.5">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Max Attempts</p>
                                                    <p className="text-xs font-black text-foreground">{ass.max_attempts > 0 ? ass.max_attempts : 'Unlimited'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};

export default SyllabusTab;
