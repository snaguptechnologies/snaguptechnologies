"use client";

import { useState } from "react";
import { Globe, Calendar, CheckCircle, XCircle, Search } from "lucide-react";

export default function EmailsTab({ emailLogs }: { emailLogs: any[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPurpose, setSelectedPurpose] = useState("all");

    // Get unique purpose categories for the dropdown
    const purposes = ["all", ...Array.from(new Set(emailLogs?.map(log => log.purpose || 'System Default')))];

    const filteredLogs = emailLogs?.filter(log => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            log.recipient_email?.toLowerCase().includes(query) ||
            log.subject?.toLowerCase().includes(query)
        );
        const matchesPurpose = selectedPurpose === "all" || (log.purpose || 'System Default') === selectedPurpose;
        return matchesSearch && matchesPurpose;
    });

    if (!emailLogs || emailLogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <Globe className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground">No Logs Found</h3>
                <p className="text-muted-foreground mt-2 max-w-sm text-sm">There are no outbound email logs in the database. When the system begins dispatching notifications, they will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Globe className="w-6 h-6 text-primary" />
                        System Outbound Emails
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Audit trail of all administrative notifications and alerts</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Purpose Dropdown Filter */}
                    <div className="relative group min-w-[200px]">
                        <select
                            value={selectedPurpose}
                            onChange={(e) => setSelectedPurpose(e.target.value)}
                            className="w-full h-11 pl-4 pr-10 bg-muted/20 border border-border/20 rounded-2xl text-[12px] font-black uppercase tracking-widest text-foreground appearance-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-muted/30"
                        >
                            {purposes.map((p, idx) => (
                                <option key={idx} value={p} className="bg-background text-foreground py-2">
                                    {p === 'all' ? '🔍 All Categories' : p}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-transform group-hover:translate-y-[-40%] group-hover:scale-y-75">
                            ▼
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 md:w-80 flex items-center gap-2 px-3 py-2.5 bg-muted/20 border border-border/20 rounded-2xl focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-[12px] font-medium focus:outline-none placeholder:text-muted-foreground/50 text-foreground min-w-0"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card border-x border-t border-border rounded-xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="p-4 font-black text-xs uppercase tracking-widest text-muted-foreground">Recipient</th>
                                <th className="p-4 font-black text-xs uppercase tracking-widest text-muted-foreground">Subject</th>
                                <th className="p-4 font-black text-xs uppercase tracking-widest text-muted-foreground">Purpose / Context</th>
                                <th className="p-4 font-black text-xs uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="p-4 font-black text-xs uppercase tracking-widest text-muted-foreground w-48 whitespace-nowrap">Dispatched At</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {filteredLogs && filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-foreground truncate max-w-[200px]">{log.recipient_email}</div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="text-muted-foreground truncate max-w-[250px]">{log.subject}</div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="bg-muted/50 text-foreground px-2 py-1 rounded text-xs font-bold uppercase tracking-wider inline-block">
                                                {log.purpose || 'System Default'}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            {log.status === 'sent' ? (
                                                <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                                    <CheckCircle className="w-4 h-4" /> Sent
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-rose-500 font-bold text-xs uppercase tracking-widest">
                                                    <XCircle className="w-4 h-4" /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider align-top">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.sent_at).toLocaleString('en-IN', {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic text-sm">
                                        No email logs found matching your filter criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="text-center mt-6">
                <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground/50 border border-border px-4 py-2 rounded-full">
                    END OF LOGS — TOP 100
                </span>
            </div>
        </div>
    );
}
