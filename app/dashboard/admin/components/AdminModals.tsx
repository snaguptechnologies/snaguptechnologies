'use client';

import React from 'react';
import { 
    X, CheckCircle, Loader2, Users, BookOpen, Clock, 
    Layers, Search, AlertCircle, XCircle, User, 
    Award, GraduationCap, Eye, EyeOff, FileText, Calendar, Trash2 
} from 'lucide-react';

interface AdminModalsProps {
    // State & Visibility
    showCourseModal: boolean;
    setShowCourseModal: (show: boolean) => void;
    showInstructorModal: boolean;
    setShowInstructorModal: (show: boolean) => void;
    showBatchModal: boolean;
    setShowBatchModal: (show: boolean) => void;
    showEditBatchModal: boolean;
    setShowEditBatchModal: (show: boolean) => void;
    showEnrollmentModal: boolean;
    setShowEnrollmentModal: (show: boolean) => void;
    showCertModal: boolean;
    setShowCertModal: (show: boolean) => void;
    showEditDeadlineModal: boolean;
    setShowEditDeadlineModal: (show: boolean) => void;
    showEditCourseModal: boolean;
    setShowEditCourseModal: (show: boolean) => void;
    showViewCourseModal?: boolean;
    setShowViewCourseModal?: (show: boolean) => void;
    viewCourseData?: any;

    // Module & Lesson Modals
    showCreateModuleModal?: boolean;
    setShowCreateModuleModal?: (show: boolean) => void;
    showEditModuleModal?: boolean;
    setShowEditModuleModal?: (show: boolean) => void;
    showCreateLessonModal?: boolean;
    setShowCreateLessonModal?: (show: boolean) => void;
    showEditLessonModal?: boolean;
    setShowEditLessonModal?: (show: boolean) => void;
    deleteModuleConfirmModal?: any;
    setDeleteModuleConfirmModal?: (data: any) => void;

    moduleForm?: any;
    setModuleForm?: (form: any) => void;
    editModuleForm?: any;
    setEditModuleForm?: (form: any) => void;
    lessonForm?: any;
    setLessonForm?: (form: any) => void;
    editLessonForm?: any;
    setEditLessonForm?: (form: any) => void;

    handleCreateModuleSubmit?: (e: React.FormEvent) => void;
    handleEditModuleSubmit?: (e: React.FormEvent) => void;
    handleConfirmDeleteModule?: (moduleId: number) => void;
    handleCreateLessonSubmit?: (e: React.FormEvent) => void;
    handleEditLessonSubmit?: (e: React.FormEvent) => void;

    // Forms
    courseForm: any;
    setCourseForm: (form: any) => void;
    instForm: any;
    setInstForm: (form: any) => void;
    batchForm: any;
    setBatchForm: (form: any) => void;
    editBatchForm: any;
    setEditBatchForm: (form: any) => void;
    editDeadlineForm: any;
    setEditDeadlineForm: (form: any) => void;
    editCourseForm: any;
    setEditCourseForm: (form: any) => void;
    showInstPassword: boolean;
    setShowInstPassword: (show: boolean) => void;

    // Data
    courses: any[];
    instructors: any[];
    batches: any[];
    enrollments: any[];
    approvedEnrollments: any[];
    selectedBatchForDeadline: any;

    // Admin Certificate Release Modal
    releaseCertModal?: any;
    setReleaseCertModal?: (data: any) => void;
    handleAdminReleaseCert?: (studentId: number, batchId: number, reason: string) => void;

    // Handlers
    handleCreateCourse: (e: React.FormEvent) => void;
    handleCreateInstructor: (e: React.FormEvent) => void;
    handleCreateBatch: (e: React.FormEvent) => void;
    handleEditBatchSubmit: (e: React.FormEvent) => void;
    handleEnrollmentAction: (id: number, status: 'approved' | 'rejected', category: 'full' | 'invalid') => void;
    handleGenerateCert: (studentId: number, batchId: number) => void;
    handleUpdateDeadline: (e: React.FormEvent) => void;
    handleEditCourseSubmit: (e: React.FormEvent) => void;
    showToast: (msg: string, type: any) => void;
    formLoading: boolean;
}

const CATEGORY_OPTIONS = [
    "Software Development",
    "Backend & Application Development",
    "Data & Artificial Intelligence",
    "Cloud & Web3 Technologies",
    "Hardware Engineering",
    "Cybersecurity",
    "General"
];

const AdminModals: React.FC<AdminModalsProps> = (props) => {
    const {
        showCourseModal, setShowCourseModal,
        showInstructorModal, setShowInstructorModal,
        showBatchModal, setShowBatchModal,
        showEditBatchModal, setShowEditBatchModal,
        showEnrollmentModal, setShowEnrollmentModal,
        showCertModal, setShowCertModal,
        showEditDeadlineModal, setShowEditDeadlineModal,
        showViewCourseModal, setShowViewCourseModal, viewCourseData,
        showCreateModuleModal, setShowCreateModuleModal,
        showEditModuleModal, setShowEditModuleModal,
        showCreateLessonModal, setShowCreateLessonModal,
        showEditLessonModal, setShowEditLessonModal,
        deleteModuleConfirmModal, setDeleteModuleConfirmModal,
        moduleForm, setModuleForm,
        editModuleForm, setEditModuleForm,
        lessonForm, setLessonForm,
        editLessonForm, setEditLessonForm,
        handleCreateModuleSubmit, handleEditModuleSubmit,
        handleConfirmDeleteModule, handleCreateLessonSubmit, handleEditLessonSubmit,
        courseForm, setCourseForm,
        instForm, setInstForm,
        batchForm, setBatchForm,
        editBatchForm, setEditBatchForm,
        editDeadlineForm, setEditDeadlineForm,
        showInstPassword, setShowInstPassword,
        courses, instructors, batches, enrollments,
        approvedEnrollments, selectedBatchForDeadline,
        handleCreateCourse, handleCreateInstructor, handleCreateBatch,
        handleEditBatchSubmit, handleEnrollmentAction, handleGenerateCert,
        handleUpdateDeadline, showToast, formLoading,
        showEditCourseModal, setShowEditCourseModal, editCourseForm, setEditCourseForm,
        handleEditCourseSubmit,
        releaseCertModal, setReleaseCertModal, handleAdminReleaseCert
    } = props;

    return (
        <>
            {/* ADD COURSE MODAL */}
            {showCourseModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowCourseModal(false)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-xl relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCourseModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter mb-1 uppercase flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-primary" /> Add New Course
                            </h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Continuous Academic Curriculum Definition</p>
                        </div>
                        <form onSubmit={handleCreateCourse} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Course Name *</label>
                                <input required value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold placeholder:text-muted-foreground/30 text-sm" placeholder="e.g. Java Programming" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Category</label>
                                    <select value={courseForm.category || 'Software Development'} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Initial Status</label>
                                    <select value={courseForm.status || 'active'} onChange={e => setCourseForm({ ...courseForm, status: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        <option value="active">Active (Available for Enrollment)</option>
                                        <option value="inactive">Inactive (Disabled for Registration)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Description</label>
                                <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[90px] font-medium text-sm placeholder:text-muted-foreground/30" placeholder="Provide a comprehensive course overview..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Learning Objectives</label>
                                <textarea value={courseForm.learning_objectives} onChange={e => setCourseForm({ ...courseForm, learning_objectives: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[70px] font-medium text-sm placeholder:text-muted-foreground/30" placeholder="Key skills & outcomes students will master..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Prerequisites</label>
                                <textarea value={courseForm.prerequisites} onChange={e => setCourseForm({ ...courseForm, prerequisites: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[70px] font-medium text-sm placeholder:text-muted-foreground/30" placeholder="Recommended background or foundation required..." />
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full py-4 bg-foreground text-background hover:opacity-90 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-foreground/10 text-xs tracking-[0.2em] mt-4">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> CREATE COURSE</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT COURSE MODAL */}
            {showEditCourseModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowEditCourseModal(false)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-xl relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowEditCourseModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter mb-1 uppercase flex items-center gap-2">
                                <FileText className="w-6 h-6 text-primary" /> Edit Course
                            </h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">
                                SNAG-C{editCourseForm.id ? editCourseForm.id.toString().padStart(3, '0') : ''} Configuration
                            </p>
                        </div>
                        <form onSubmit={handleEditCourseSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Course Name *</label>
                                <input required value={editCourseForm.name} onChange={e => setEditCourseForm({ ...editCourseForm, name: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold placeholder:text-muted-foreground/30 text-sm" placeholder="e.g. Java Programming" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Category</label>
                                    <select value={editCourseForm.category || 'Software Development'} onChange={e => setEditCourseForm({ ...editCourseForm, category: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Status</label>
                                    <select value={editCourseForm.status || 'active'} onChange={e => setEditCourseForm({ ...editCourseForm, status: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        <option value="active">Active (Available for Enrollment)</option>
                                        <option value="inactive">Inactive (Disabled for Registration)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Description</label>
                                <textarea value={editCourseForm.description} onChange={e => setEditCourseForm({ ...editCourseForm, description: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[90px] font-medium text-sm placeholder:text-muted-foreground/30" placeholder="Provide a comprehensive course overview..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Learning Objectives</label>
                                <textarea value={editCourseForm.learning_objectives} onChange={e => setEditCourseForm({ ...editCourseForm, learning_objectives: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[70px] font-medium text-sm placeholder:text-muted-foreground/30" placeholder="Key skills & outcomes students will master..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Prerequisites</label>
                                <textarea value={editCourseForm.prerequisites} onChange={e => setEditCourseForm({ ...editCourseForm, prerequisites: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[70px] font-medium text-sm placeholder:text-muted-foreground/30" placeholder="Recommended background or foundation required..." />
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full py-4 bg-foreground text-background hover:opacity-90 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-foreground/10 text-xs tracking-[0.2em] mt-4">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> SAVE CHANGES</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW COURSE DETAILS MODAL */}
            {showViewCourseModal && viewCourseData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowViewCourseModal && setShowViewCourseModal(false)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-2xl relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowViewCourseModal && setShowViewCourseModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        
                        {/* HEADER */}
                        <div className="mb-6 border-b border-border/20 pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2.5 py-1 bg-muted/40 text-foreground border border-border/30 rounded-lg text-xs font-mono font-bold tracking-wider">
                                    SNAG-C{viewCourseData.id.toString().padStart(3, '0')}
                                </span>
                                {viewCourseData.status === 'active' ? (
                                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                                        Active
                                    </span>
                                ) : (
                                    <span className="px-3 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight">{viewCourseData.name}</h2>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">{viewCourseData.category || 'Software Development'}</p>
                        </div>

                        {/* DETAILED CONTENT */}
                        <div className="space-y-5 overflow-y-auto custom-scrollbar pr-1 text-sm">
                            {/* METRICS ROW */}
                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/20">
                                <div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Enrolled Students</span>
                                    <div className="text-xl font-black text-primary flex items-center gap-1.5">
                                        <Users className="w-5 h-5" /> {viewCourseData.enrolled_students || 0}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Created Date</span>
                                    <div className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-1">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        {viewCourseData.created_at ? new Date(viewCourseData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Course Description</h4>
                                <p className="text-foreground/90 font-medium leading-relaxed bg-muted/10 p-4 rounded-xl border border-border/20">
                                    {viewCourseData.description || 'No description provided for this course.'}
                                </p>
                            </div>

                            {/* LEARNING OBJECTIVES */}
                            <div>
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Learning Objectives</h4>
                                <p className="text-foreground/90 font-medium leading-relaxed bg-muted/10 p-4 rounded-xl border border-border/20 whitespace-pre-line">
                                    {viewCourseData.learning_objectives || 'No explicit learning objectives specified.'}
                                </p>
                            </div>

                            {/* PREREQUISITES */}
                            <div>
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Prerequisites</h4>
                                <p className="text-foreground/90 font-medium leading-relaxed bg-muted/10 p-4 rounded-xl border border-border/20 whitespace-pre-line">
                                    {viewCourseData.prerequisites || 'No prior prerequisites required.'}
                                </p>
                            </div>
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="mt-6 border-t border-border/20 pt-4 flex justify-end">
                            <button
                                onClick={() => setShowViewCourseModal && setShowViewCourseModal(false)}
                                className="px-6 py-2.5 bg-foreground text-background hover:opacity-90 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showInstructorModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowInstructorModal(false)}>
                    <div className="admin-card p-6 md:p-10 w-full max-w-md relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowInstructorModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2 uppercase">Facilitator</h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Access Provisioning</p>
                        </div>
                        <form onSubmit={handleCreateInstructor} className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-70">Legal Identity</label>
                                <input required value={instForm.name} onChange={e => setInstForm({ ...instForm, name: e.target.value })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold placeholder:text-muted-foreground/30" placeholder="Full name of specialist" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-70">Node Email</label>
                                <input type="email" required value={instForm.email} onChange={e => setInstForm({ ...instForm, email: e.target.value })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold placeholder:text-muted-foreground/30" placeholder="facilitator@snagup.tech" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-70">Mobile Protocol</label>
                                <input 
                                    type="text"
                                    value={instForm.phone} 
                                    onChange={e => setInstForm({ ...instForm, phone: e.target.value })} 
                                    className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold placeholder:text-muted-foreground/30" 
                                    placeholder="+91 00000 00000" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-70">Access Credential</label>
                                <div className="relative">
                                    <input
                                        type={showInstPassword ? "text" : "password"}
                                        required
                                        minLength={6}
                                        value={instForm.password}
                                        onChange={e => setInstForm({ ...instForm, password: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold placeholder:text-muted-foreground/30 pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowInstPassword(!showInstPassword)}
                                        className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        {showInstPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={formLoading} className="w-full py-5 bg-foreground text-background hover:opacity-90 rounded-2xl font-black transition-all shadow-2xl shadow-foreground/10 flex items-center justify-center gap-3 text-xs tracking-[0.2em] sticky bottom-0">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><Users className="w-5 h-5" /> VERIFY & ENROLL</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showBatchModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowBatchModal(false)}>
                    <div className="admin-card p-6 md:p-10 w-full max-w-md relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setShowBatchModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2 uppercase">Batch Unit</h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Synchronized Unit Deployment</p>
                        </div>
                        <form onSubmit={handleCreateBatch} className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Program Architecture</label>
                                <select
                                    required
                                    value={batchForm.course_id}
                                    onChange={e => {
                                        const cId = e.target.value;
                                        let nextBatchName = "";
                                        if (cId) {
                                            const numericId = parseInt(cId);
                                            const existingBatchesForCourse = batches.filter(b => b.course_id === numericId || b.course_id === cId);
                                            const nextNumber = existingBatchesForCourse.length + 1;
                                            nextBatchName = `Batch ${nextNumber}`;
                                        }
                                        setBatchForm({
                                            ...batchForm,
                                            course_id: cId,
                                            name: nextBatchName || batchForm.name
                                        });
                                    }}
                                    className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-background">Select program...</option>
                                    {courses.map(c => <option key={c.id} value={c.id} className="bg-background">{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Batch Identifier (Name)</label>
                                <input
                                    type="text"
                                    required
                                    value={batchForm.name}
                                    onChange={e => setBatchForm({ ...batchForm, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold placeholder:text-muted-foreground/30"
                                    placeholder="e.g. COHORT ALPHA"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Facilitator Assignment</label>
                                <select required value={batchForm.instructor_id} onChange={e => setBatchForm({ ...batchForm, instructor_id: e.target.value })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold appearance-none cursor-pointer">
                                    <option value="" disabled className="bg-background">Select Facilitator...</option>
                                    {instructors.map(i => <option key={i.id} value={i.id} className="bg-background">{i.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Enrollment Deadline*</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        required
                                        value={batchForm.enrollment_date}
                                        onChange={e => setBatchForm({ ...batchForm, enrollment_date: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold"
                                    />
                                    <input
                                        type="time"
                                        required
                                        value={batchForm.enrollment_time}
                                        onChange={e => setBatchForm({ ...batchForm, enrollment_time: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Duration (Days)</label>
                                <input type="number" required value={batchForm.duration_days || ""} onChange={e => setBatchForm({ ...batchForm, duration_days: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold" />
                            </div>
                            <button type="submit" disabled={formLoading} className="w-full py-5 bg-foreground text-background hover:opacity-90 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-foreground/10 text-xs tracking-[0.2em] sticky bottom-0">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><Clock className="w-5 h-5" /> SYNCHRONIZE BATCH</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showEditBatchModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowEditBatchModal(false)}>
                    <div className="admin-card p-6 md:p-10 w-full max-w-md relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setShowEditBatchModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2 uppercase">Edit Batch</h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Update Configuration</p>
                        </div>
                        <form onSubmit={handleEditBatchSubmit} className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Program Architecture</label>
                                <select
                                    required
                                    value={editBatchForm.course_id}
                                    onChange={e => setEditBatchForm({ ...editBatchForm, course_id: e.target.value })}
                                    className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-background">Select program...</option>
                                    {courses.map(c => <option key={c.id} value={c.id} className="bg-background">{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Batch Identifier (Name)</label>
                                <input
                                    type="text"
                                    required
                                    value={editBatchForm.name}
                                    onChange={e => setEditBatchForm({ ...editBatchForm, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Facilitator Assignment</label>
                                <select required value={editBatchForm.instructor_id} onChange={e => setEditBatchForm({ ...editBatchForm, instructor_id: e.target.value })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold appearance-none cursor-pointer">
                                    <option value="" disabled className="bg-background">Select Facilitator...</option>
                                    {instructors.map(i => <option key={i.id} value={i.id} className="bg-background">{i.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Duration (Days)</label>
                                <input type="number" required value={editBatchForm.duration_days === 0 ? "" : editBatchForm.duration_days} onChange={e => setEditBatchForm({ ...editBatchForm, duration_days: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold" />
                            </div>
                            <button type="submit" disabled={formLoading} className="w-full py-5 bg-foreground text-background hover:opacity-90 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-foreground/10 text-xs tracking-[0.2em] sticky bottom-0">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><FileText className="w-5 h-5" /> SAVE CHANGES</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Enrollments Modal */}
            {showEnrollmentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowEnrollmentModal(false)}>
                    <div className="admin-card p-8 w-full max-w-2xl relative max-h-[90vh] flex flex-col border-amber-500/20 bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowEnrollmentModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Pending Applications</h2>
                        <p className="text-xs text-muted-foreground mb-8 tracking-widest uppercase font-bold opacity-60">Authorize student entry into the ecosystem</p>
                        <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {enrollments.length > 0 ? ( enrollments.map(enr => (
                                <div key={enr.id} className="p-6 rounded-3xl bg-muted/20 border border-border/50 flex flex-col gap-6 hover:bg-muted/30 transition-all relative group/enr">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                                                <User className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-foreground tracking-tight">{enr.student_name}</h3>
                                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">{enr.student_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-black text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 uppercase tracking-widest">{enr.course_name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">{enr.batch_name}</span>
                                                {enr.admin_feedback && (
                                                    <span className="text-[9px] font-black bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-tighter animate-pulse">Updated</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {enr.admin_feedback && (
                                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
                                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Previous Admin Feedback</p>
                                                <p className="text-sm text-amber-200/80 italic font-medium">"{enr.admin_feedback}"</p>
                                            </div>
                                        </div>
                                    )}

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-background/50 rounded-2xl border border-border/40">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Latest Transaction ID (UTR)</p>
                                                <div className="flex items-center gap-3">
                                                    <code className="text-md font-black text-foreground tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{enr.transaction_id}</code>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(enr.transaction_id);
                                                            showToast("UTR Copied!", "success");
                                                        }}
                                                        className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground"
                                                        title="Copy UTR"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-0.5 opacity-40">Paid Amount</p>
                                                    <p className="text-xs font-black text-emerald-500">₹{enr.paid_amount || 0}</p>
                                                </div>
                                                <div className="w-px h-6 bg-border/40"></div>
                                                <div>
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-0.5 opacity-40">Batch Price</p>
                                                    <p className="text-xs font-black text-foreground">₹{enr.batch_price || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 md:justify-end">
                                            <button
                                                onClick={() => {
                                                    if (confirm("Confirm FULL payment received? Access will be granted immediately.")) {
                                                        handleEnrollmentAction(enr.id, 'approved', 'full');
                                                    }
                                                }}
                                                className="px-4 py-3 bg-foreground text-background hover:scale-[1.02] active:scale-95 rounded-xl text-[10px] font-black transition-all shadow-xl shadow-foreground/10 uppercase tracking-widest flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Approve Full
                                            </button>
                                            <button
                                                onClick={() => handleEnrollmentAction(enr.id, 'rejected', 'invalid')}
                                                className="px-4 py-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 border border-rose-500/20"
                                            >
                                                <XCircle className="w-4 h-4" /> Invalid UTR
                                            </button>
                                        </div>
                                        </div>
                                    </div>
                                ))) : (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4 border border-border/50">
                                        <CheckCircle className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-50">Log Clear: No Pending Requests</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Certificate Modal */}
            {showCertModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowCertModal(false)}>
                    <div className="admin-card p-8 w-full max-w-2xl relative max-h-[90vh] flex flex-col border-rose-500/20 bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCertModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Digital Credentials</h2>
                        <p className="text-xs text-muted-foreground mb-8 tracking-widest uppercase font-bold opacity-60">Issue blockchain-verifiable completion certificates</p>
                        <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {approvedEnrollments.length > 0 ? approvedEnrollments.map(enr => (
                                <div key={enr.id} className="p-5 rounded-2xl bg-muted/30 border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/40 transition-colors">
                                    <div>
                                        <h3 className="font-black text-foreground tracking-tight flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-primary" /> {enr.student_name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-[10px] font-black text-rose-500 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 uppercase tracking-tighter">{enr.course_name}</span>
                                            <span className="text-[10px] font-black text-muted-foreground px-2 py-0.5 rounded bg-muted/50 border border-border/50 uppercase tracking-tighter">{enr.batch_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <button onClick={() => handleGenerateCert(enr.student_id, enr.batch_id)} disabled={formLoading} className="px-6 py-2.5 bg-foreground text-background hover:opacity-90 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-foreground/10 flex items-center gap-2 uppercase tracking-widest">
                                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} /> : <Award className="w-4 h-4" />} GENERATE ASSET
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4 border border-border/50">
                                        <Award className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-50">Queue Empty: No Eligible Candidates</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showEditDeadlineModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowEditDeadlineModal(false)}>
                    <div className="admin-card p-6 md:p-10 w-full max-w-md relative shadow-2xl border-primary/20 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowEditDeadlineModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2 uppercase">Shift Deadline</h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">
                                {selectedBatchForDeadline?.name} • {selectedBatchForDeadline?.course_name}
                            </p>
                        </div>
                        <form onSubmit={handleUpdateDeadline} className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block opacity-70">New Enrollment Deadline*</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase opacity-40 ml-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={editDeadlineForm.date}
                                            onChange={e => setEditDeadlineForm({ ...editDeadlineForm, date: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase opacity-40 ml-1">Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={editDeadlineForm.time}
                                            onChange={e => setEditDeadlineForm({ ...editDeadlineForm, time: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                <p className="text-[10px] font-bold text-primary italic leading-relaxed">
                                    Note: Extending the deadline will automatically make the batch visible to students again if it was previously hidden.
                                </p>
                            </div>
                            <button type="submit" disabled={formLoading} className="w-full py-5 bg-foreground text-background hover:opacity-90 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-foreground/10 text-xs tracking-[0.2em] sticky bottom-0">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> AUTHORIZE UPDATE</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Manual Certificate Release Modal (Admin Override) */}
            {releaseCertModal && releaseCertModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/70 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setReleaseCertModal && setReleaseCertModal(null)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-lg relative shadow-2xl border-amber-500/30 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setReleaseCertModal && setReleaseCertModal(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="mb-6 border-b border-border/50 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                    ADMIN OVERRIDE
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">MANUAL CERTIFICATE RELEASE</h2>
                            <p className="text-xs text-muted-foreground font-medium">Bypass normal 80% progress requirement and issue credential</p>
                        </div>

                        <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                            {/* Summary Rack */}
                            <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-3 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Student:</span>
                                    <span className="font-black text-foreground text-sm">{releaseCertModal.student_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Course:</span>
                                    <span className="font-black text-primary">{releaseCertModal.course_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Current Progress:</span>
                                    <span className={`font-black ${releaseCertModal.progress >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {releaseCertModal.progress}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Automatic Eligibility:</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        releaseCertModal.progress >= 80 
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    }`}>
                                        {releaseCertModal.progress >= 80 ? 'Eligible' : 'Not Eligible (<80%)'}
                                    </span>
                                </div>
                            </div>

                            {/* Warning Box */}
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <p className="font-black text-amber-500 uppercase text-[10px] tracking-wider mb-0.5">Admin Override Protocol</p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        This action will manually release the certificate for this student. The release record will be tagged as <strong className="text-foreground">ADMIN_OVERRIDE</strong> and logged in the system audit trail.
                                    </p>
                                </div>
                            </div>

                            {/* Required Reason Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block opacity-80">
                                    Release Reason (Required for Audit Record)*
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={releaseCertModal.reason || ''}
                                    onChange={(e) => setReleaseCertModal && setReleaseCertModal({ ...releaseCertModal, reason: e.target.value })}
                                    placeholder="e.g. Completed external practical assessment / Approved by course coordinator"
                                    className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold text-xs placeholder:text-muted-foreground/40"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReleaseCertModal && setReleaseCertModal(null)}
                                    className="flex-1 py-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black text-xs uppercase tracking-widest border border-border/50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={formLoading || !releaseCertModal.reason || !releaseCertModal.reason.trim()}
                                    onClick={() => {
                                        if (handleAdminReleaseCert) {
                                            handleAdminReleaseCert(releaseCertModal.student_id, releaseCertModal.batch_id, releaseCertModal.reason);
                                        }
                                    }}
                                    className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                                >
                                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Award className="w-4 h-4" /> Release Certificate</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* CREATE MODULE MODAL */}
            {showCreateModuleModal && moduleForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowCreateModuleModal && setShowCreateModuleModal(false)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-lg relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCreateModuleModal && setShowCreateModuleModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter mb-1 uppercase flex items-center gap-2">
                                <Layers className="w-6 h-6 text-primary" /> Add Syllabus Module
                            </h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Define structural topic module</p>
                        </div>
                        <form onSubmit={handleCreateModuleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Module Title *</label>
                                <input required value={moduleForm.title || ''} onChange={e => setModuleForm && setModuleForm({ ...moduleForm, title: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" placeholder="e.g. Module 1: Core Fundamentals & Syntax" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Sequence Order *</label>
                                    <input type="number" min={1} required value={moduleForm.sequence_order || 1} onChange={e => setModuleForm && setModuleForm({ ...moduleForm, sequence_order: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Status</label>
                                    <select value={moduleForm.status || 'active'} onChange={e => setModuleForm && setModuleForm({ ...moduleForm, status: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Description</label>
                                <textarea value={moduleForm.description || ''} onChange={e => setModuleForm && setModuleForm({ ...moduleForm, description: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[90px] font-medium text-sm" placeholder="Provide an overview of key concepts taught in this module..." />
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full py-4 bg-foreground text-background hover:opacity-90 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-foreground/10 text-xs tracking-[0.2em] mt-4">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> CREATE MODULE</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODULE MODAL */}
            {showEditModuleModal && editModuleForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowEditModuleModal && setShowEditModuleModal(false)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-lg relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowEditModuleModal && setShowEditModuleModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter mb-1 uppercase flex items-center gap-2">
                                <FileText className="w-6 h-6 text-primary" /> Edit Module
                            </h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Update module details & ordering</p>
                        </div>
                        <form onSubmit={handleEditModuleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Module Title *</label>
                                <input required value={editModuleForm.title || ''} onChange={e => setEditModuleForm && setEditModuleForm({ ...editModuleForm, title: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" placeholder="e.g. Module 1: Core Fundamentals" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Sequence Order *</label>
                                    <input type="number" min={1} required value={editModuleForm.sequence_order || 1} onChange={e => setEditModuleForm && setEditModuleForm({ ...editModuleForm, sequence_order: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Status</label>
                                    <select value={editModuleForm.status || 'active'} onChange={e => setEditModuleForm && setEditModuleForm({ ...editModuleForm, status: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Description</label>
                                <textarea value={editModuleForm.description || ''} onChange={e => setEditModuleForm && setEditModuleForm({ ...editModuleForm, description: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[90px] font-medium text-sm" placeholder="Overview of key concepts..." />
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full py-4 bg-foreground text-background hover:opacity-90 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-foreground/10 text-xs tracking-[0.2em] mt-4">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> SAVE CHANGES</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE LESSON MODAL */}
            {showCreateLessonModal && lessonForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowCreateLessonModal && setShowCreateLessonModal(false)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-lg relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCreateLessonModal && setShowCreateLessonModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter mb-1 uppercase flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-primary" /> Add Lesson / Topic
                            </h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Add specific learning lesson or resource</p>
                        </div>
                        <form onSubmit={handleCreateLessonSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Lesson Title *</label>
                                <input required value={lessonForm.title || ''} onChange={e => setLessonForm && setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" placeholder="e.g. Lesson 1: Introduction & Variables" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Sequence Order *</label>
                                    <input type="number" min={1} required value={lessonForm.sequence_order || 1} onChange={e => setLessonForm && setLessonForm({ ...lessonForm, sequence_order: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Status</label>
                                    <select value={lessonForm.status || 'active'} onChange={e => setLessonForm && setLessonForm({ ...lessonForm, status: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Resource URL (Optional)</label>
                                <input type="url" value={lessonForm.resource_url || ''} onChange={e => setLessonForm && setLessonForm({ ...lessonForm, resource_url: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-medium text-sm" placeholder="https://docs.snagup.com/resources/pdf" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Video Tutorial URL (Optional)</label>
                                <input type="url" value={lessonForm.video_url || ''} onChange={e => setLessonForm && setLessonForm({ ...lessonForm, video_url: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-medium text-sm" placeholder="https://youtube.com/watch?v=..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Description / Content</label>
                                <textarea value={lessonForm.description || ''} onChange={e => setLessonForm && setLessonForm({ ...lessonForm, description: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[80px] font-medium text-sm" placeholder="Topic overview or instructions..." />
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full py-4 bg-foreground text-background hover:opacity-90 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-foreground/10 text-xs tracking-[0.2em] mt-4">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> CREATE LESSON</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT LESSON MODAL */}
            {showEditLessonModal && editLessonForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowEditLessonModal && setShowEditLessonModal(false)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-lg relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowEditLessonModal && setShowEditLessonModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter mb-1 uppercase flex items-center gap-2">
                                <FileText className="w-6 h-6 text-primary" /> Edit Lesson / Topic
                            </h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Update lesson content & resource links</p>
                        </div>
                        <form onSubmit={handleEditLessonSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Lesson Title *</label>
                                <input required value={editLessonForm.title || ''} onChange={e => setEditLessonForm && setEditLessonForm({ ...editLessonForm, title: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" placeholder="e.g. Lesson 1: Introduction" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Sequence Order *</label>
                                    <input type="number" min={1} required value={editLessonForm.sequence_order || 1} onChange={e => setEditLessonForm && setEditLessonForm({ ...editLessonForm, sequence_order: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Status</label>
                                    <select value={editLessonForm.status || 'active'} onChange={e => setEditLessonForm && setEditLessonForm({ ...editLessonForm, status: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-bold text-sm">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Resource URL (Optional)</label>
                                <input type="url" value={editLessonForm.resource_url || ''} onChange={e => setEditLessonForm && setEditLessonForm({ ...editLessonForm, resource_url: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-medium text-sm" placeholder="https://docs.snagup.com/resources/pdf" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Video Tutorial URL (Optional)</label>
                                <input type="url" value={editLessonForm.video_url || ''} onChange={e => setEditLessonForm && setEditLessonForm({ ...editLessonForm, video_url: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all font-medium text-sm" placeholder="https://youtube.com/watch?v=..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-80">Description / Content</label>
                                <textarea value={editLessonForm.description || ''} onChange={e => setEditLessonForm && setEditLessonForm({ ...editLessonForm, description: e.target.value })} className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary transition-all min-h-[80px] font-medium text-sm" placeholder="Topic overview..." />
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full py-4 bg-foreground text-background hover:opacity-90 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-foreground/10 text-xs tracking-[0.2em] mt-4">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> SAVE CHANGES</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODULE CONFIRMATION MODAL */}
            {deleteModuleConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setDeleteModuleConfirmModal && setDeleteModuleConfirmModal(null)}>
                    <div className="admin-card p-6 md:p-8 w-full max-w-md relative shadow-2xl border-rose-500/20 bg-card flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="mb-6 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Delete Module?</h3>
                                <p className="text-xs text-rose-500 font-bold uppercase tracking-wider">Warning: Cascading Delete</p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-6 bg-muted/20 p-4 rounded-xl border border-border/30">
                            Are you sure you want to delete module <strong className="text-foreground">{deleteModuleConfirmModal.title}</strong>? All lessons and topics associated with this module will also be permanently deleted.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteModuleConfirmModal && setDeleteModuleConfirmModal(null)}
                                className="flex-1 py-3.5 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={formLoading}
                                onClick={() => {
                                    if (handleConfirmDeleteModule) {
                                        handleConfirmDeleteModule(deleteModuleConfirmModal.id);
                                    }
                                }}
                                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                            >
                                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete Module</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminModals;
