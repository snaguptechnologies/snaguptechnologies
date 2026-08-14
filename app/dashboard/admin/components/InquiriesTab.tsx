import React from 'react';
import { Search, Loader2, CheckCircle, Mail, Phone } from 'lucide-react';

interface InquiriesTabProps {
    inquirySearch: string;
    setInquirySearch: (search: string) => void;
    inquiryServiceFilter: string;
    setInquiryServiceFilter: (filter: string) => void;
    inquiryStatusFilter: string;
    setInquiryStatusFilter: (filter: string) => void;
    filteredInquiries: any[];
    inquiries: any[];
    tabLoading: boolean;
    handleInquiryStatus: (id: number, status: string) => void;
}

const InquiriesTab: React.FC<InquiriesTabProps> = ({
    inquirySearch,
    setInquirySearch,
    inquiryServiceFilter,
    setInquiryServiceFilter,
    inquiryStatusFilter,
    setInquiryStatusFilter,
    filteredInquiries,
    inquiries,
    tabLoading,
    handleInquiryStatus
}) => {
    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">Service Inquiries</h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Client Requests & Project Pipelines</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-72 flex items-center gap-2 px-3 py-2.5 bg-muted/20 border border-border/20 rounded-2xl focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={inquirySearch}
                            onChange={(e) => setInquirySearch(e.target.value)}
                            className="flex-1 bg-transparent text-[12px] font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                        />
                    </div>
                    <select
                        value={inquiryServiceFilter}
                        onChange={(e) => setInquiryServiceFilter(e.target.value)}
                        className="px-4 py-3 bg-muted/20 border border-border/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-muted/30 transition-all font-bold"
                    >
                        <option value="all">All Services</option>
                        <option value="Web Development">Web Development</option>
                        <option value="App Development">App Development</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="UI/UX Design">UI/UX Design</option>
                        <option value="Cloud Solutions">Cloud Solutions</option>
                    </select>
                    <select
                        value={inquiryStatusFilter}
                        onChange={(e) => setInquiryStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-muted/20 border border-border/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-muted/30 transition-all font-bold"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="archived">Archived</option>
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
                                <th className="pb-6 pr-8">Client Identity</th>
                                <th className="pb-6 px-8">Service Requested</th>
                                <th className="pb-6 px-8">Project Brief</th>
                                <th className="pb-6 px-8 text-right">Status Orchestration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredInquiries.map((iq: any) => (
                                <tr key={iq.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                    <td className="py-8 pr-8">
                                        <div className="font-black text-foreground text-sm tracking-tight mb-1">{iq.name}</div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 line-clamp-1 lowercase">
                                                <Mail className="w-3 h-3" /> {iq.email}
                                            </div>
                                            {iq.phone && (
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3" /> {iq.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-8 px-8">
                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                            {iq.service_type}
                                        </span>
                                    </td>
                                    <td className="py-8 px-8 max-w-md">
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic line-clamp-3">
                                            "{iq.message || 'No additional details provided.'}"
                                        </p>
                                        <div className="mt-2 text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                                            Submitted {new Date(iq.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="py-8 px-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <select
                                                value={iq.status}
                                                onChange={(e) => handleInquiryStatus(iq.id, e.target.value)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer focus:outline-none appearance-none ${iq.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    iq.status === 'contacted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-muted text-muted-foreground border-border'
                                                    }`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                            {iq.status === 'pending' && (
                                                <button
                                                    onClick={() => handleInquiryStatus(iq.id, 'contacted')}
                                                    className="p-2 rounded-xl bg-foreground text-background hover:opacity-90 transition-all shadow-lg shadow-foreground/10"
                                                    title="Mark as Contacted"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {inquiries.length === 0 && (
                                <tr><td colSpan={4} className="py-32 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20 text-sm">No incoming service inquiries detected</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InquiriesTab;
