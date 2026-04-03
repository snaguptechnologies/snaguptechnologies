import React from 'react';
import { Search, Loader2, CheckCircle, XCircle, Globe, Mail, Phone } from 'lucide-react';

interface PaymentsTabProps {
    paymentTab: 'pending' | 'history';
    setPaymentTab: (tab: 'pending' | 'history') => void;
    paymentStatusFilter: string;
    setPaymentStatusFilter: (filter: string) => void;
    payments: any[];
    paymentSearch: string;
    setPaymentSearch: (search: string) => void;
    filteredPayments: any[];
    tabLoading: boolean;
    handleEnrollmentAction: (id: number, status: 'approved' | 'rejected', category: 'full' | 'invalid') => void;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({
    paymentTab,
    setPaymentTab,
    paymentStatusFilter,
    setPaymentStatusFilter,
    payments,
    paymentSearch,
    setPaymentSearch,
    filteredPayments,
    tabLoading,
    handleEnrollmentAction
}) => {
    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">Financial Ledger</h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Transaction Integrity & Revenue Archives</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-1.5 rounded-2xl border border-border/20">
                    <button 
                        onClick={() => { setPaymentTab('pending'); setPaymentStatusFilter('all'); }}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${paymentTab === 'pending' ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Active Requests
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${paymentTab === 'pending' ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'}`}>
                            {payments.filter((p: any) => p.enrollment_status === 'pending').length}
                        </span>
                    </button>
                    <button 
                        onClick={() => { setPaymentTab('history'); setPaymentStatusFilter('all'); }}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${paymentTab === 'history' ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Processed History
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${paymentTab === 'history' ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'}`}>
                            {payments.filter((p: any) => p.enrollment_status !== 'pending').length}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex-1 md:w-72 flex items-center gap-2 px-3 py-2.5 bg-muted/20 border border-border/20 rounded-2xl focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        placeholder="Search student, UTR or ID..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="flex-1 bg-transparent text-[12px] font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                    />
                </div>
                {paymentTab === 'history' && (
                    <select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-muted/20 border border-border/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-muted/30 transition-all font-bold"
                    >
                        <option value="all">All Logs</option>
                        <option value="approved">Approved Only</option>
                        <option value="rejected">Rejected Only</option>
                    </select>
                )}
            </div>

            {tabLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 text-foreground animate-spin" strokeWidth={3} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="pb-4 pr-4">Student Details</th>
                                <th className="pb-4 px-4">Program & Cohort</th>
                                <th className="pb-4 px-4">UTR Identity</th>
                                <th className="pb-4 px-4">{paymentTab === 'pending' ? 'Submission Date' : 'Processed On'}</th>
                                {paymentTab === 'history' && <th className="pb-4 px-4">Resolution Note</th>}
                                <th className="pb-4 px-4 text-right">Status Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {(filteredPayments || []).map((p: any) => (
                                <tr key={p.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                    <td className="py-5 pr-4">
                                        <div className="font-black text-foreground text-sm tracking-tight">{p.student_name || p.user_name}</div>
                                        <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">{p.student_uid || 'UID PENDING'}</div>
                                    </td>
                                    <td className="py-5 px-4 text-sm text-foreground/70">
                                        <div className="font-black text-[11px] uppercase tracking-tighter text-foreground/80">{p.course_name}</div>
                                        <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{p.batch_name}</div>
                                    </td>
                                    <td className="py-5 px-4">
                                        <div className="font-mono text-[11px] text-muted-foreground/60 tracking-tighter uppercase group-hover:text-foreground/70 transition-colors">{p.latest_transaction_id || p.transaction_id || 'N/A'}</div>
                                    </td>
                                    <td className="py-5 px-4 text-[9px] font-black text-muted-foreground uppercase opacity-50 leading-tight tracking-widest">
                                        {new Date(paymentTab === 'pending' ? p.created_at : p.updated_at || p.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}<br />
                                        {new Date(paymentTab === 'pending' ? p.created_at : p.updated_at || p.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </td>
                                    {paymentTab === 'history' && (
                                        <td className="py-5 px-4 max-w-[200px]">
                                            {p.admin_feedback ? (
                                                <p className="text-[10px] text-rose-500/80 font-bold italic line-clamp-2 leading-tight">"{p.admin_feedback}"</p>
                                            ) : (
                                                <span className="text-[9px] text-muted-foreground/30 uppercase font-black">No feedback provided</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="py-5 px-4 text-right">
                                        {p.enrollment_status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEnrollmentAction(p.enrollment_id, 'approved', 'full')}
                                                    className="px-3 py-1.5 rounded-lg text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 font-black uppercase text-[9px] tracking-wider flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("Reject this enrollment?")) {
                                                            handleEnrollmentAction(p.enrollment_id, 'rejected', 'invalid');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20 font-black uppercase text-[9px] tracking-wider flex items-center gap-1"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all inline-block ${
                                                p.enrollment_status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            }`}>
                                                {p.enrollment_status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && (
                                <tr><td colSpan={paymentTab === 'history' ? 6 : 5} className="py-32 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20">No matching records found in {paymentTab}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PaymentsTab;
