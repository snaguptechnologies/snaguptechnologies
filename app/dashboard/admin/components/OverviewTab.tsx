"use client";

import React from "react";
import { 
    Users, GraduationCap, BookOpen, Layers, Clock, 
    CheckCircle, ArrowRight, Award, Plus, Loader2, 
    User, Globe, DollarSign, TrendingUp, BarChart3,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface OverviewTabProps {
    stats: any;
    setActiveTab: (tab: any) => void;
    openEnrollmentsModal: () => void;
    openCertModal: () => void;
    setShowCourseModal: (show: boolean) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    stats,
    setActiveTab,
    openEnrollmentsModal,
    openCertModal,
    setShowCourseModal
}) => {
    const financials = stats?.financials || { totalRevenue: 0, pendingRevenue: 0, paymentSuccessRate: 0, recentPayments: [] };

    const statCards = [
        { title: "Total Students", value: stats?.totalStudents || 0, icon: <Users className="w-6 h-6 text-foreground" /> },
        { title: "Instructors", value: stats?.totalInstructors || 0, icon: <GraduationCap className="w-6 h-6 text-foreground" /> },
        { title: "Courses", value: stats?.totalCourses || 0, icon: <BookOpen className="w-6 h-6 text-foreground" /> },
        { title: "Active Batches", value: stats?.activeBatches || 0, icon: <Layers className="w-6 h-6 text-primary" /> },
        { title: "Pending Enrollments", value: stats?.pendingEnrollments || 0, icon: <Clock className="w-6 h-6 text-amber-500" /> },
        { title: "Certs Issued", value: stats?.certsIssued || 0, icon: <CheckCircle className="w-6 h-6 text-rose-500" /> },
    ];

    const financeCards = [
        { 
            title: "Total Revenue", 
            value: `₹${financials.totalRevenue.toLocaleString('en-IN')}`, 
            icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
            trend: "All-time Captured"
        },
        { 
            title: "Pending Capital", 
            value: `₹${financials.pendingRevenue.toLocaleString('en-IN')}`, 
            icon: <Clock className="w-5 h-5 text-amber-500" />,
            trend: "In Pipeline"
        },
        { 
            title: "Payment Success", 
            value: `${financials.paymentSuccessRate}%`, 
            icon: <TrendingUp className="w-5 h-5 text-primary" />,
            trend: "Conversion Rate"
        },
    ];

    return (
        <div className="animate-fade-in space-y-10">
            {/* Top Section: Stats & Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Stats Telemetry (8/12) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="mb-6 px-2 text-foreground">
                        <h2 className="text-xl font-black tracking-tight uppercase">Telemetry</h2>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Live System Metrics</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {statCards.map((stat, idx) => (
                            <div key={idx} className="group p-4 rounded-2xl bg-card border border-border/20 transition-all hover:bg-muted/10 hover:border-foreground/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-background/50 flex items-center justify-center border border-border/30 group-hover:scale-105 transition-transform shadow-inner">
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-0.5">{stat.title}</p>
                                        <h3 className="text-2xl font-black text-foreground tracking-tighter leading-none">{stat.value}</h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 3: Orchestration (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="mb-6 px-2">
                        <h2 className="text-xl font-black text-foreground tracking-tight uppercase">Operations</h2>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Quick Deployment Actions</p>
                    </div>
                    <div className="space-y-3">
                        <button onClick={openEnrollmentsModal} className="w-full p-4 rounded-2xl bg-card hover:bg-muted/10 border border-border/20 text-left transition-all hover:scale-[1.02] group relative overflow-hidden flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Enrollments</span>
                                    <div className="flex items-center px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground border border-foreground/20 text-[8px] font-black">
                                        {stats?.pendingEnrollments || 0}
                                    </div>
                                </div>
                                <p className="text-[9px] text-muted-foreground font-medium leading-tight">Review applications.</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1" />
                        </button>

                        <button onClick={openCertModal} className="w-full p-4 rounded-2xl bg-card hover:bg-muted/10 border border-border/20 text-left transition-all hover:scale-[1.02] group flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Credentials</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground font-medium leading-tight">Issue certificates.</p>
                            </div>
                            <Award className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>

                        <button onClick={() => { setActiveTab('courses'); setShowCourseModal(true); }} className="w-full p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-left transition-all hover:scale-[1.02] group flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Deployment</span>
                                </div>
                                <p className="text-[9px] text-primary/70 font-medium leading-tight">Launch new program.</p>
                            </div>
                            <Plus className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Financial Intelligence Section */}
            <div className="space-y-6">
                <div className="px-2">
                    <h2 className="text-xl font-black text-foreground tracking-tight uppercase flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Financial Intelligence
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Revenue & Transaction Analytics</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {financeCards.map((card, idx) => (
                        <div key={idx} className="p-6 rounded-[2rem] bg-card border border-border/20 shadow-xl shadow-foreground/[0.02] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                {React.cloneElement(card.icon as React.ReactElement<any>, { className: "w-24 h-24" })}
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center border border-border/20">
                                    {card.icon}
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.title}</span>
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight mb-1">{card.value}</h3>
                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter opacity-60 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> {card.trend}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Stream (Already existed, now moved/re-styled) */}
                    <div className="bg-muted/5 rounded-[2rem] p-6 border border-border/10">
                        <div className="mb-6 flex justify-between items-end px-2">
                            <div>
                                <h2 className="text-lg font-black text-foreground tracking-tight uppercase">Activity Stream</h2>
                                <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Latest Batch Lifecycle</p>
                            </div>
                            <button onClick={() => setActiveTab('batches')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all flex items-center gap-2 mb-1">
                                VIEW ALL <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border/30 text-[9px] uppercase font-black tracking-widest text-muted-foreground">
                                        <th className="pb-3 pr-4">Identity</th>
                                        <th className="pb-3 px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {stats?.recentBatches?.length > 0 ? (
                                        stats.recentBatches.slice(0, 4).map((batch: any) => (
                                            <tr key={batch.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                                <td className="py-4 pr-4">
                                                    <div className="font-bold text-foreground text-sm tracking-tight">{batch.name}</div>
                                                    <div className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-40">{batch.course_name}</div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${batch.batch_status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-muted/30 text-muted-foreground border-border/50'
                                                        }`}>
                                                        {batch.batch_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="py-10 text-center text-muted-foreground text-xs italic opacity-40">Stream inactive</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Transactions (NEW) */}
                    <div className="bg-muted/5 rounded-[2rem] p-6 border border-border/10">
                        <div className="mb-6 flex justify-between items-end px-2">
                            <div>
                                <h2 className="text-lg font-black text-foreground tracking-tight uppercase">Recent Transactions</h2>
                                <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Latest Capital Inflow</p>
                            </div>
                            <button onClick={() => setActiveTab('payments')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all flex items-center gap-2 mb-1">
                                RECONCILE <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border/30 text-[9px] uppercase font-black tracking-widest text-muted-foreground">
                                        <th className="pb-3 pr-4">Source</th>
                                        <th className="pb-3 px-4">Amount</th>
                                        <th className="pb-3 px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {financials.recentPayments?.length > 0 ? (
                                        financials.recentPayments.map((payment: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-foreground/[0.03] transition-colors group">
                                                <td className="py-4 pr-4">
                                                    <div className="font-bold text-foreground text-sm tracking-tight">{payment.student_name}</div>
                                                    <div className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-40">{payment.course_name}</div>
                                                </td>
                                                <td className="py-4 px-4 font-black text-foreground text-sm tracking-tighter">
                                                    ₹{payment.amount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${payment.status === 'completed'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : payment.status === 'pending'
                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                        }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="py-10 text-center text-muted-foreground text-xs italic opacity-40">No transactions recorded</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
