"use client";

import React, { useState } from 'react';
import { BACKEND_URL } from '@/app/lib/api';
import { 
    Award, Search, Download, Trash2, 
    Calendar, Filter, User, BookOpen, 
    FileText, ExternalLink, RefreshCw, X 
} from 'lucide-react';

interface CertificatesTabProps {
    certificates: any[];
    filteredCertificates: any[];
    certSearch: string;
    setCertSearch: (val: string) => void;
    certCourseFilter: string;
    setCertCourseFilter: (val: string) => void;
    tabLoading: boolean;
    handleDeleteCertificate: (id: number) => void;
    courses: any[];
}

const CertificatesTab: React.FC<CertificatesTabProps> = ({
    certificates,
    filteredCertificates,
    certSearch,
    setCertSearch,
    certCourseFilter,
    setCertCourseFilter,
    tabLoading,
    handleDeleteCertificate,
    courses
}) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Secondary filter for date range
    const finalFiltered = filteredCertificates.filter(cert => {
        if (!startDate && !endDate) return true;
        const certDate = new Date(cert.issued_at).toISOString().split('T')[0];
        if (startDate && certDate < startDate) return false;
        if (endDate && certDate > endDate) return false;
        return true;
    });

    const uniqueCourses = Array.from(new Set(certificates.map(c => c.course_name)));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Credential Registry</h2>
                    <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase opacity-60 flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        Audit and manage all issued academic certificates
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="px-5 py-3 glass-panel border border-primary/20 bg-primary/5 rounded-2xl flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Total Issued</span>
                            <span className="text-xl font-black text-foreground">{certificates.length}</span>
                        </div>
                        <div className="w-px h-8 bg-primary/20" />
                        <Award className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Filters Rack */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 glass-panel rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl">
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search student or ID..."
                        value={certSearch}
                        onChange={(e) => setCertSearch(e.target.value)}
                        className="w-full bg-background/50 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {/* Course Filter */}
                <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select 
                        value={certCourseFilter}
                        onChange={(e) => setCertCourseFilter(e.target.value)}
                        className="w-full bg-background/50 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all cursor-pointer"
                    >
                        <option value="all">All Courses</option>
                        {uniqueCourses.map(course => (
                            <option key={course} value={course}>{course}</option>
                        ))}
                    </select>
                </div>

                {/* Date Start */}
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-background/50 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {/* Date End */}
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-background/50 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Records Table */}
            <div className="glass-panel rounded-[2.5rem] border border-border/50 bg-card/20 backdrop-blur-3xl overflow-hidden shadow-2xl shadow-black/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Credential ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Student Details</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Course & Batch</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Issued Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {tabLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : finalFiltered.length > 0 ? (
                                finalFiltered.map((cert) => (
                                    <tr key={cert.id} className="group hover:bg-muted/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{cert.cert_id}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Officially Verified</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-orange-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{cert.student_name}</span>
                                                    <span className="text-[11px] text-muted-foreground font-medium">{cert.student_email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-foreground uppercase tracking-tight">{cert.course_name}</span>
                                                <span className="text-[10px] text-muted-foreground font-bold">{cert.batch_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{new Date(cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => window.open(`${BACKEND_URL}/certs/${cert.cert_id}.pdf`, '_blank')}
                                                    className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                                    title="View PDF"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCertificate(cert.id)}
                                                    className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300"
                                                    title="Revoke Certificate"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <FileText className="w-16 h-16 text-muted-foreground mb-2" />
                                            <h3 className="text-lg font-bold">No Certificate Records Found</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest max-w-[240px]">Refine your search or date filters to locate specific credentials.</p>
                                            {(certSearch || certCourseFilter !== 'all' || startDate || endDate) && (
                                                <button 
                                                    onClick={() => { setCertSearch(""); setCertCourseFilter("all"); setStartDate(""); setEndDate(""); }}
                                                    className="mt-4 px-6 py-2 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
                                                >
                                                    Clear All Filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CertificatesTab;
