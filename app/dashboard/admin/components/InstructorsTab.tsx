'use client';

import React from 'react';
import { Plus, Loader2, Trash2, Globe } from 'lucide-react';

interface InstructorsTabProps {
    instructors: any[];
    tabLoading: boolean;
    setShowInstructorModal: (show: boolean) => void;
    handleDeleteUser: (id: number, name: string) => void;
}

const InstructorsTab: React.FC<InstructorsTabProps> = ({
    instructors,
    tabLoading,
    setShowInstructorModal,
    handleDeleteUser
}) => {
    return (
        <div className="animate-fade-in relative min-h-[600px] px-2">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-1">System Facilitators</h1>
                    <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">Verified Educational Operations Authority</p>
                </div>
                <button onClick={() => setShowInstructorModal(true)} className="flex items-center gap-3 px-8 py-4 bg-muted/20 hover:bg-muted/40 text-foreground border border-border/20 rounded-2xl font-black transition-all hover:-translate-y-1 uppercase tracking-widest text-[11px]">
                    <Plus className="w-5 h-5" /> Onboard New Authority
                </button>
            </div>
            {tabLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 text-foreground animate-spin" strokeWidth={3} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                <th className="pb-6 pr-8 w-1/4">Professional Identity</th>
                                <th className="pb-6 px-8 w-1/4">Communication Protocol</th>
                                <th className="pb-6 px-8 text-right">Onboarding Date</th>
                                <th className="pb-6 px-8 text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {instructors.map((inst: any) => (
                                <tr key={inst.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                    <td className="py-8 pr-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center text-foreground font-black border border-foreground/20 text-xl shadow-inner group-hover:scale-105 transition-transform">
                                                {inst.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-foreground text-lg tracking-tight mb-1">{inst.name}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-40">FACILITATOR ID: {inst.id.toString().padStart(3, '0')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-8 px-8">
                                        <div className="flex items-center gap-3 text-sm font-bold text-foreground/60 group-hover:text-foreground transition-colors">
                                            <Globe className="w-4 h-4 text-muted-foreground/50" /> {inst.email}
                                        </div>
                                    </td>
                                    <td className="py-8 px-8 text-right font-black text-[11px] text-muted-foreground tracking-widest opacity-50">
                                        {new Date(inst.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                    </td>
                                    <td className="py-8 px-8 text-right uppercase">
                                        <button
                                            onClick={() => handleDeleteUser(inst.id, inst.name)}
                                            className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                            title="Delete Facilitator"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {instructors.length === 0 && (
                                <tr><td colSpan={4} className="py-32 text-center text-muted-foreground italic font-black uppercase tracking-widest opacity-20">No facilitators currently indexed</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InstructorsTab;
