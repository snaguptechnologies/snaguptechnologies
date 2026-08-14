'use client';

import React from 'react';
import { 
    Search, Plus, Loader2, Calendar, PlayCircle, 
    FileText, Trash2, CheckCircle 
} from 'lucide-react';

interface BatchesTabProps {
    batches: any[];
    filteredBatches: any[];
    batchSearch: string;
    setBatchSearch: (search: string) => void;
    batchCourseFilter: string;
    setBatchCourseFilter: (id: string) => void;
    batchStatusFilter: string;
    setBatchStatusFilter: (status: string) => void;
    selectedBatches: number[];
    handleSelectAllBatches: () => void;
    handleToggleBatchSelection: (id: number) => void;
    tabLoading: boolean;
    courses: any[];
    preloadDropdowns: () => Promise<void>;
    setBatchForm: React.Dispatch<React.SetStateAction<any>>;
    setShowBatchModal: (show: boolean) => void;
    handleToggleEnrollment: (id: number) => void;
    handleFinalizeBatch: (id: number) => void;
    openEditDeadline: (batch: any) => void;
    handleStartBatch: (id: number) => void;
    handleEndBatch: (id: number) => void;
    handleArchiveBatch: (id: number) => void;
    setEditBatchForm: (form: any) => void;
    setShowEditBatchModal: (show: boolean) => void;
    handleDeleteBatch: (id: number) => void;
    handleBulkBatchUpdate: (ids: number[], action: 'open_enrollment' | 'close_enrollment' | 'end_batch') => void;
    bulkLoading: boolean;
    getLocalDatetime: () => { enrollment_date: string; enrollment_time: string };
}

const BatchesTab: React.FC<BatchesTabProps> = ({
    batches,
    filteredBatches,
    batchSearch,
    setBatchSearch,
    batchCourseFilter,
    setBatchCourseFilter,
    batchStatusFilter,
    setBatchStatusFilter,
    selectedBatches,
    handleSelectAllBatches,
    handleToggleBatchSelection,
    tabLoading,
    courses,
    preloadDropdowns,
    setBatchForm,
    setShowBatchModal,
    handleToggleEnrollment,
    handleFinalizeBatch,
    openEditDeadline,
    handleStartBatch,
    handleEndBatch,
    handleArchiveBatch,
    setEditBatchForm,
    setShowEditBatchModal,
    handleDeleteBatch,
    handleBulkBatchUpdate,
    bulkLoading,
    getLocalDatetime
}) => {
    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex flex-col gap-6 mb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">Batch Clusters</h1>
                        <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Active Cohort Sync & Orchestration</p>
                    </div>
                    <button onClick={() => { 
                        preloadDropdowns().then(() => {
                            setBatchForm((prev: any) => ({ ...prev, ...getLocalDatetime() }));
                            setShowBatchModal(true);
                        }); 
                    }} className="flex items-center gap-3 px-8 py-4 bg-foreground hover:opacity-90 text-background rounded-2xl font-black transition-all shadow-2xl shadow-foreground/10 hover:-translate-y-1 uppercase tracking-widest text-[11px]">
                        <Plus className="w-5 h-5" /> Initialize New Cluster
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-64 flex items-center gap-2 px-3 py-2.5 bg-muted/20 border border-border/20 rounded-2xl focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Search batch or instructor..."
                            value={batchSearch}
                            onChange={(e) => setBatchSearch(e.target.value)}
                            className="flex-1 bg-transparent text-[12px] font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                        />
                    </div>
                    <select
                        value={batchCourseFilter}
                        onChange={(e) => setBatchCourseFilter(e.target.value)}
                        className="px-4 py-3.5 bg-muted/20 border border-border/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-muted/30 transition-all text-muted-foreground focus:text-foreground"
                    >
                        <option value="">All Programs</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                        value={batchStatusFilter}
                        onChange={(e) => setBatchStatusFilter(e.target.value)}
                        className="px-4 py-3.5 bg-muted/20 border border-border/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-muted/30 transition-all text-muted-foreground focus:text-foreground"
                    >
                        <option value="all">All Status</option>
                        <optgroup label="── Batch Status ──">
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="closed">Archived</option>
                        </optgroup>
                        <optgroup label="── Enrollment Status ──">
                            <option value="enrollment_open">Enrollment Open</option>
                            <option value="enrollment_closed">Enrollment Closed</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            {tabLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 text-foreground animate-spin" strokeWidth={3} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="pb-3 pr-2 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border/40 bg-muted/20 accent-foreground cursor-pointer"
                                        checked={selectedBatches.length === filteredBatches.length && filteredBatches.length > 0}
                                        onChange={handleSelectAllBatches}
                                    />
                                </th>
                                <th className="pb-3 pr-4">Batch</th>
                                <th className="pb-3 px-4">Course</th>
                                <th className="pb-3 px-4">Instructor</th>
                                <th className="pb-3 px-4">Duration</th>
                                <th className="pb-3 px-4">Enrollment Deadline</th>
                                <th className="pb-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredBatches.map((batch: any) => {
                                const now = new Date();
                                const nowLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                                const isExpired = batch.enrollment_end_date && batch.enrollment_end_date <= nowLocal;
                                const isOpen = !isExpired && batch.enrollment_status === 'open';
                                
                                return (
                                    <tr key={batch.id} className={`hover:bg-foreground/[0.03] transition-colors group ${selectedBatches.includes(batch.id) ? 'bg-foreground/[0.04]' : ''}`}>
                                        <td className="py-3 pr-2 align-middle">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-border/40 bg-muted/20 accent-foreground cursor-pointer"
                                                checked={selectedBatches.includes(batch.id)}
                                                onChange={() => handleToggleBatchSelection(batch.id)}
                                            />
                                        </td>
                                        <td className="py-3 pr-4 align-middle min-w-[180px]">
                                            <div className="font-black text-foreground text-[13px] tracking-tight leading-tight mb-1 group-hover:text-foreground/80 transition-colors">
                                                {batch.name}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                                    batch.batch_status === 'active' ? 'bg-foreground text-background border-foreground' :
                                                    batch.batch_status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    batch.batch_status === 'closed' ? 'bg-muted/40 text-muted-foreground border-border/50' :
                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                    {batch.batch_status}
                                                </span>
                                                {batch.is_finalized ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                        Finalized
                                                    </span>
                                                ) : (
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                                        isOpen ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}>
                                                        {isOpen ? 'Enroll Open' : 'Enroll Closed'}
                                                    </span>
                                                )}
                                                {!!batch.attendance_completed && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                        Attendance Done
                                                    </span>
                                                )}
                                                {!!batch.instructor_verified && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border bg-emerald-500 text-white border-emerald-500 shadow-sm">
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 align-middle min-w-[140px]">
                                            <div className="text-[13px] font-semibold text-foreground/80">{batch.course_name || '—'}</div>
                                        </td>
                                        <td className="py-3 px-4 align-middle min-w-[160px]">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded bg-muted/30 flex items-center justify-center text-[10px] font-black border border-border/30 shrink-0">
                                                    {batch.instructor_name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-[13px] font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors">
                                                    {batch.instructor_name || <span className="italic text-muted-foreground/40 text-xs">Unassigned</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 align-middle">
                                            <div className="text-[13px] font-semibold text-foreground/70">
                                                {batch.duration_days > 0 ? `${batch.duration_days} days` : <span className="text-rose-400 text-xs font-black">Not set</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 align-middle min-w-[150px]">
                                            {batch.enrollment_end_date ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[13px] font-bold text-foreground/80">
                                                        {new Date(batch.enrollment_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-muted-foreground">
                                                        {new Date(batch.enrollment_end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </div>
                                                    {isExpired && (
                                                        <span className="mt-0.5 text-[8px] font-black text-rose-500 uppercase tracking-tighter bg-rose-500/10 px-1.5 py-0.5 rounded w-fit border border-rose-500/20">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/40 italic">No deadline set</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                {!batch.is_finalized && (batch.batch_status === 'upcoming' || batch.batch_status === 'active') && (
                                                    <>
                                                        {batch.enrollment_status === 'closed' ? (
                                                            <button onClick={() => handleToggleEnrollment(batch.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all uppercase tracking-widest whitespace-nowrap">
                                                                Open Enroll
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleToggleEnrollment(batch.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all uppercase tracking-widest whitespace-nowrap">
                                                                    Close Enroll
                                                                </button>
                                                                <button onClick={() => handleFinalizeBatch(batch.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-rose-500 text-white hover:opacity-90 transition-all uppercase tracking-widest shadow-sm whitespace-nowrap">
                                                                    Finalize
                                                                </button>
                                                            </>
                                                        )}
                                                        <button onClick={() => openEditDeadline(batch)} className="p-1.5 rounded-lg bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border/30" title="Change Enrollment Deadline">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                {!!batch.is_finalized && batch.batch_status === 'upcoming' && (
                                                    <button onClick={() => handleStartBatch(batch.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-foreground text-background hover:opacity-90 transition-all shadow-sm uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                                                        <PlayCircle className="w-3.5 h-3.5" /> Start
                                                    </button>
                                                )}
                                                {batch.batch_status === 'active' && (
                                                    <button onClick={() => handleEndBatch(batch.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest whitespace-nowrap">
                                                        End Batch
                                                    </button>
                                                )}
                                                {batch.batch_status === 'completed' && !batch.archived_at && (
                                                    <button 
                                                        onClick={() => handleArchiveBatch(batch.id)} 
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest shadow-sm whitespace-nowrap flex items-center gap-2 ${
                                                            batch.instructor_verified 
                                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 scale-105 shadow-emerald-500/20' 
                                                            : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted'
                                                        }`}
                                                    >
                                                        {batch.instructor_verified ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                                                        {batch.instructor_verified ? 'Verify & Archive' : 'Archive'}
                                                    </button>
                                                )}
                                                {!!(batch.batch_status === 'closed' || batch.archived_at) && (
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-25 tracking-widest">Archived</span>
                                                )}
                                                <button onClick={() => {
                                                    setEditBatchForm({
                                                        id: batch.id,
                                                        name: batch.name,
                                                        course_id: batch.course_id.toString(),
                                                        instructor_id: batch.instructor_id ? batch.instructor_id.toString() : "",
                                                        duration_days: batch.duration_days,
                                                        price: batch.price
                                                    });
                                                    preloadDropdowns().then(() => setShowEditBatchModal(true));
                                                }} className="p-1.5 rounded-lg bg-blue-500/5 text-blue-400 hover:bg-blue-500/20 hover:text-blue-500 transition-all border border-blue-500/10 ml-1" title="Edit Batch">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDeleteBatch(batch.id)} className="p-1.5 rounded-lg bg-rose-500/5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-rose-500/10 ml-1" title="Delete Batch">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {batches.length === 0 && (
                                <tr><td colSpan={8} className="py-24 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20">No batches found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bulk Action Toolbar */}
            {selectedBatches.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-5 bg-foreground text-background rounded-3xl shadow-2xl z-50 flex items-center gap-8 animate-in slide-in-from-bottom-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Operations Matrix</span>
                        <span className="text-sm font-black uppercase tracking-tighter">{selectedBatches.length} Clusters Selected</span>
                    </div>
                    <div className="h-8 w-px bg-background/20" />
                    <div className="flex items-center gap-3">
                        <button
                            disabled={bulkLoading}
                            onClick={() => handleBulkBatchUpdate(selectedBatches, 'open_enrollment')}
                            className="px-6 py-2.5 bg-background text-foreground rounded-2xl text-[10px] font-black hover:bg-white transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            Open Enrollment
                        </button>
                        <button
                            disabled={bulkLoading}
                            onClick={() => handleBulkBatchUpdate(selectedBatches, 'close_enrollment')}
                            className="px-6 py-2.5 bg-background/10 text-background border border-background/20 rounded-2xl text-[10px] font-black hover:bg-background/20 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            Close Enrollment
                        </button>
                        <button
                            disabled={bulkLoading}
                            onClick={() => handleBulkBatchUpdate(selectedBatches, 'end_batch')}
                            className="px-6 py-2.5 bg-rose-500 text-white rounded-2xl text-[10px] font-black hover:bg-rose-600 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            End Batches
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchesTab;
