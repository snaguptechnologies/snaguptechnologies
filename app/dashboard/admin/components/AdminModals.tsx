'use client';

import React from 'react';
import { 
    X, CheckCircle, Loader2, Users, BookOpen, Clock, 
    Layers, Search, AlertCircle, XCircle, User, 
    Award, GraduationCap, Eye, EyeOff, FileText, Calendar 
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
    showInstPassword: boolean;
    setShowInstPassword: (show: boolean) => void;

    // Data
    courses: any[];
    instructors: any[];
    batches: any[];
    enrollments: any[];
    approvedEnrollments: any[];
    selectedBatchForDeadline: any;

    // Handlers
    handleCreateCourse: (e: React.FormEvent) => void;
    handleCreateInstructor: (e: React.FormEvent) => void;
    handleCreateBatch: (e: React.FormEvent) => void;
    handleEditBatchSubmit: (e: React.FormEvent) => void;
    handleEnrollmentAction: (id: number, status: 'approved' | 'rejected', category: 'full' | 'invalid') => void;
    handleGenerateCert: (studentId: number, batchId: number) => void;
    handleUpdateDeadline: (e: React.FormEvent) => void;
    showToast: (msg: string, type: any) => void;
    formLoading: boolean;
}

const AdminModals: React.FC<AdminModalsProps> = (props) => {
    const {
        showCourseModal, setShowCourseModal,
        showInstructorModal, setShowInstructorModal,
        showBatchModal, setShowBatchModal,
        showEditBatchModal, setShowEditBatchModal,
        showEnrollmentModal, setShowEnrollmentModal,
        showCertModal, setShowCertModal,
        showEditDeadlineModal, setShowEditDeadlineModal,
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
        handleUpdateDeadline, showToast, formLoading
    } = props;

    return (
        <>
            {showCourseModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setShowCourseModal(false)}>
                    <div className="admin-card p-6 md:p-10 w-full max-w-md relative shadow-2xl border-foreground/10 bg-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCourseModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2 uppercase">New Program</h2>
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold opacity-60">Architectural Deployment</p>
                        </div>
                        <form onSubmit={handleCreateCourse} className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-70">Program Title</label>
                                <input required value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold placeholder:text-muted-foreground/30" placeholder="e.g. FULLSTACK NEURAL ENG" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-70">Descriptor</label>
                                <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all min-h-[140px] font-bold placeholder:text-muted-foreground/30" placeholder="Define program objectives..." />
                            </div>
                            <button type="submit" disabled={formLoading} className="w-full py-5 bg-foreground text-background hover:opacity-90 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-foreground/10 text-xs tracking-[0.2em] sticky bottom-0">
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <><CheckCircle className="w-5 h-5" /> AUTHORIZE DEPLOYMENT</>}
                            </button>
                        </form>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Valuation (₹)</label>
                                    <input type="number" required value={batchForm.price || ""} onChange={e => setBatchForm({ ...batchForm, price: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Duration (Days)</label>
                                    <input type="number" required value={batchForm.duration_days || ""} onChange={e => setBatchForm({ ...batchForm, duration_days: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold" />
                                </div>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Valuation (₹)</label>
                                    <input type="number" required value={editBatchForm.price === 0 ? "" : editBatchForm.price} onChange={e => setEditBatchForm({ ...editBatchForm, price: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-70">Duration (Days)</label>
                                    <input type="number" required value={editBatchForm.duration_days === 0 ? "" : editBatchForm.duration_days} onChange={e => setEditBatchForm({ ...editBatchForm, duration_days: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-5 py-4 bg-muted/20 border border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-foreground/30 transition-all font-bold" />
                                </div>
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
        </>
    );
};

export default AdminModals;
