import React from "react";
import { 
    Users, GraduationCap, BookOpen, Layers, Clock, 
    CheckCircle, ArrowRight, Award, Plus, 
    DollarSign, TrendingUp, BarChart3,
    ArrowUpRight, FileText, Download, TrendingDown,
    Zap, Activity, PieChart, Landmark, Calendar, Filter
} from 'lucide-react';
import { EnrollmentTrendChart, RevenueTrendChart, DistributionPieChart, RadialProgressChart, BatchCompletionChart } from './DashboardCharts';

interface DashboardTabProps {
    stats: any;
    setActiveTab: (tab: any) => void;
    openEnrollmentsModal: () => void;
    openCertModal: () => void;
    setShowCourseModal: (show: boolean) => void;
    dashboardSubTab: 'analytics' | 'financials';
    setDashboardSubTab: (tab: 'analytics' | 'financials') => void;
    handleExport: (type: 'students' | 'payments' | 'attendance' | 'certificates' | 'financials' | 'dashboard_graph') => void;
    
    // New Props for Charts & Filtering
    dateRange: 'week' | 'month' | 'year' | 'all' | 'custom';
    setDateRange: (range: 'week' | 'month' | 'year' | 'all' | 'custom') => void;
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
    chartCourseFilter: string;
    setChartCourseFilter: (id: string) => void;
    chartBatchFilter: string;
    setChartBatchFilter: (id: string) => void;
    chartData: any;
    courses: any[];
    batches: any[];
    enrollments: any[];
    handleEnrollmentAction: (id: number, status: 'approved' | 'rejected', category?: 'full' | 'invalid', feedback?: string, paid_amount?: number) => void;
    handleToggleEnrollment: (batchId: number) => void;
    handleStartBatch: (batchId: number) => void;
    handleEndBatch: (batchId: number) => void;
    handleFinalizeBatch: (batchId: number) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
    stats,
    setActiveTab,
    openEnrollmentsModal,
    openCertModal,
    setShowCourseModal,
    dashboardSubTab,
    setDashboardSubTab,
    handleExport,
    dateRange,
    setDateRange,
    chartCourseFilter,
    setChartCourseFilter,
    chartBatchFilter,
    setChartBatchFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    chartData,
    courses,
    batches,
    enrollments,
    handleEnrollmentAction,
    handleToggleEnrollment,
    handleStartBatch,
    handleEndBatch,
    handleFinalizeBatch
}) => {
    const [quickActionTab, setQuickActionTab] = React.useState<'payments' | 'batches'>('payments');
    const financials = stats?.financials || { totalRevenue: 0, pendingRevenue: 0, paymentSuccessRate: 0, recentPayments: [] };

    // Grouping Telemetry for the Top Bar
    const telemetryCards = [
        { title: "Learners", value: stats?.totalStudents || 0, icon: <Users className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Instructors", value: stats?.totalInstructors || 0, icon: <GraduationCap className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/10" },
        { title: "Courses", value: stats?.totalCourses || 0, icon: <BookOpen className="w-5 h-5" />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { title: "Active Batches", value: stats?.activeBatches || 0, icon: <Layers className="w-5 h-5" />, color: "text-orange-500", bg: "bg-orange-500/10" },
        { title: "Inactive Batches", value: stats?.completedBatches || 0, icon: <Activity className="w-5 h-5" />, color: "text-slate-500", bg: "bg-slate-500/10" },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-10 pb-20">
            {/* Header Area with Sub-tab Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase mb-1">Intelligence Control</h1>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Operational Insights & High-Fidelity Tracking</p>
                </div>
                
                <div className="flex p-1 bg-muted/30 border border-border/20 rounded-2xl w-full md:w-auto">
                    <button 
                        onClick={() => setDashboardSubTab('analytics')}
                        className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardSubTab === 'analytics' ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                        Performance
                    </button>
                    <button 
                        onClick={() => setDashboardSubTab('financials')}
                        className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardSubTab === 'financials' ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                        Capital
                    </button>
                </div>
            </div>

            {/* Performance Stats Cards - (Stats appearing first) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {telemetryCards.map((card, idx) => (
                    <div key={idx} className="p-6 rounded-[2rem] bg-card border border-border/20 hover:border-foreground/10 transition-all group relative overflow-hidden">
                        <div className={`absolute -right-4 -bottom-4 w-16 h-16 ${card.bg} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`w-10 h-10 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-6 border border-current/10 shadow-inner group-hover:scale-110 transition-transform`}>
                            {card.icon}
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">{card.title}</p>
                        <h3 className="text-2xl font-black text-foreground tracking-tighter">{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* Global Controls */}
            <div className="p-6 md:p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-2xl border border-border/20 shadow-xl shadow-foreground/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-1 bg-muted/30 border border-border/40 rounded-[1.5rem]">
                                {(['week', 'month', 'year', 'custom'] as const).map((r) => {
                                    const label = r === 'week' ? '1W' : r === 'month' ? '1M' : r === 'year' ? '1Y' : 'Custom';
                                    return (
                                        <button 
                                            key={r}
                                            onClick={() => setDateRange(r)}
                                            className={`flex-1 py-3 px-2 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all ${dateRange === r ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {dateRange === 'custom' && (
                                <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-muted/20 border border-border/30 rounded-xl">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase">From</span>
                                        <input 
                                            type="date" 
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="bg-transparent border-none text-[10px] font-bold text-foreground focus:outline-none w-full [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-muted/20 border border-border/30 rounded-xl">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase">To</span>
                                        <input 
                                            type="date" 
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="bg-transparent border-none text-[10px] font-bold text-foreground focus:outline-none w-full [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="md:col-span-4 lg:col-span-4 flex items-center gap-4">
                        <div className="relative flex-1 group">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                            <select 
                                value={chartCourseFilter} 
                                onChange={(e) => {
                                    setChartCourseFilter(e.target.value);
                                    setChartBatchFilter('all');
                                }}
                                className="w-full bg-muted/40 border border-border/40 rounded-[1.2rem] pl-10 pr-6 py-4 text-[11px] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">ALL PROGRAMS</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-3 lg:col-span-4 flex items-center gap-4">
                        <div className="relative flex-1 group">
                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                            <select 
                                value={chartBatchFilter} 
                                onChange={(e) => setChartBatchFilter(e.target.value)}
                                className="w-full bg-muted/40 border border-border/40 rounded-[1.2rem] pl-10 pr-6 py-4 text-[11px] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">ALL BATCHES</option>
                                {batches
                                    .filter(b => chartCourseFilter === 'all' || b.course_id.toString() === chartCourseFilter)
                                    .map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)
                                }
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {dashboardSubTab === 'analytics' ? (
                <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-500">
                    {/* SECTION: Deep Triage & Institutional Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* 8-Col: Enrollment Intelligence */}
                        <div className="lg:col-span-8 p-8 md:p-10 rounded-[2.5rem] bg-card border border-border/20 shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="absolute -right-10 -top-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 flex-1">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/10">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground tracking-tight uppercase leading-none mb-1">
                                                Enrollment Trends
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Learner Acquisition matrix</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleExport('dashboard_graph')}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-lg shadow-foreground/10"
                                    >
                                        <Download className="w-3 h-3" />
                                        Export Dataset
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <EnrollmentTrendChart data={chartData.enrollmentTrend} />
                                </div>
                            </div>
                        </div>

                        {/* 4-Col: Deep Triage Quick Actions */}
                        <div className="lg:col-span-4 p-8 rounded-[2.5rem] bg-muted/10 border border-border/10 flex flex-col">
                            <div className="mb-8 flex items-center justify-between gap-6">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">Deep Triage</h3>
                                <div className="flex p-1 bg-muted/40 rounded-xl border border-border/20">
                                    <button 
                                        onClick={() => setQuickActionTab('payments')}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${quickActionTab === 'payments' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        Payments
                                    </button>
                                    <button 
                                        onClick={() => setQuickActionTab('batches')}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${quickActionTab === 'batches' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        Batches
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                {quickActionTab === 'payments' ? (
                                    enrollments.filter(e => e.status === 'pending').length > 0 ? (
                                        enrollments.filter(e => e.status === 'pending').slice(0, 10).map((enroll: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-[1.5rem] bg-card border border-border/20 hover:border-primary/20 transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-tight text-foreground block mb-0.5">{enroll.student_name}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 flex items-center gap-1.5">
                                                            <Landmark className="w-2.5 h-2.5" /> {enroll.batch_name}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[11px] font-black tracking-tighter px-2 py-0.5 rounded-lg border ${
                                                        enroll.paid_amount
                                                            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                                            : 'text-muted-foreground bg-muted/40 border-border/20'
                                                    }`}>
                                                        ₹{Number(enroll.paid_amount || enroll.batch_price || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleEnrollmentAction(enroll.id, 'approved', 'full', '', enroll.paid_amount)}
                                                        className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all shadow-inner border border-emerald-500/10"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEnrollmentAction(enroll.id, 'rejected')}
                                                        className="flex-1 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center opacity-20 text-[9px] font-black uppercase tracking-widest">No pending triage</div>
                                    )
                                ) : (
                                    batches.filter(b => ['upcoming', 'active'].includes(b.batch_status)).slice(0, 10).map((batch: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-[1.5rem] bg-card border border-border/20 hover:border-amber-500/20 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="text-[11px] font-black uppercase tracking-tight text-foreground block mb-0.5">{batch.name}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 block truncate max-w-[150px]">{batch.course_name}</span>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${batch.batch_status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'}`}>
                                                    {batch.batch_status}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button 
                                                    onClick={() => handleToggleEnrollment(batch.id)}
                                                    className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase transition-all border ${batch.enrollment_status === 'open' ? 'bg-orange-500/10 text-orange-500 border-orange-500/10' : 'bg-blue-500/10 text-blue-500 border-blue-500/10'}`}
                                                >
                                                    {batch.enrollment_status === 'open' ? 'Close' : 'Open'} Enroll
                                                </button>
                                                
                                                {batch.enrollment_status === 'open' && (
                                                    <button 
                                                        onClick={() => handleFinalizeBatch(batch.id)}
                                                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase border border-amber-500/10 hover:bg-amber-500 hover:text-white transition-all"
                                                    >
                                                        Finalize Adm.
                                                    </button>
                                                )}

                                                {batch.batch_status === 'upcoming' ? (
                                                    <button 
                                                        onClick={() => handleStartBatch(batch.id)}
                                                        className="w-full py-2 rounded-xl bg-foreground text-background text-[9px] font-black uppercase shadow-lg shadow-foreground/10 hover:scale-[1.02] transition-all"
                                                    >
                                                        Launch Batch
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleEndBatch(batch.id)}
                                                        className="w-full py-2 rounded-xl bg-muted text-muted-foreground text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all"
                                                    >
                                                        End Batch
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: System Analytics Distribution */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xs font-black text-primary uppercase tracking-[.25em] px-2 mb-2">Operational Progress</h2>
                            <p className="text-[9px] text-muted-foreground font-bold tracking-[.15em] uppercase opacity-50 px-2 leading-none">Real-time learning velocity & completion status</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            {chartData.activeProgress.length > 0 ? (
                                chartData.activeProgress.map((batch: any, idx: number) => (
                                    <div key={idx} className="p-8 md:p-10 rounded-[2.5rem] bg-card border border-border/20 flex flex-col justify-between min-h-[400px] group hover:border-primary/20 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-[10px] font-black text-foreground tracking-[.2em] uppercase opacity-70">Velocity Metrics</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                <span className="text-[8px] font-black text-primary uppercase tracking-widest">{batch.status}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 flex items-center justify-center">
                                            <RadialProgressChart data={[batch]} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full p-20 rounded-[2.5rem] bg-card border border-border/10 flex flex-col items-center justify-center text-center">
                                    <Activity className="w-12 h-12 text-muted-foreground/20 mb-4" />
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">No active batches for progress tracking</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-500">
                    {/* SECTION: Revenue Intelligence */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest px-2 mb-2">Financial Perspective</h2>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-50 px-2 leading-none">Capital Flow & Transaction velocity</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-12 p-8 md:p-10 rounded-[2.5rem] bg-card border border-border/20 shadow-2xl relative overflow-hidden">
                                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground tracking-tight uppercase leading-none mb-1">
                                                Revenue Streampulse
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-50">Financial realization matrix</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <h3 className="text-3xl font-black text-emerald-500 tracking-tighter leading-none mb-1">₹{financials.totalRevenue.toLocaleString('en-IN')}</h3>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Total Realized Asset</p>
                                        </div>
                                        <button 
                                            onClick={() => handleExport('financials')}
                                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-lg shadow-foreground/10"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Export Financials
                                        </button>
                                    </div>
                                </div>
                                <RevenueTrendChart data={chartData.revenueTrend} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardTab;
