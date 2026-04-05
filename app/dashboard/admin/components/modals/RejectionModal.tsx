import React from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';

interface RejectionModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isBulk: boolean;
    count: number;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ show, onClose, onSubmit, isBulk, count }) => {
    const [reason, setReason] = React.useState("");

    if (!show) return null;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onSubmit(reason);
        setReason("");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="relative p-8 md:p-10">
                    <button 
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/10">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight uppercase leading-none mb-1">
                                Rejection Feedback
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-50">
                                {isBulk ? `Rejecting ${count} enrollments` : 'Single enrollment rejection'}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Please provide a reason for the rejection. This message will be sent to the {isBulk ? 'selected students' : 'student'} via email to help them understand why their request was denied.
                    </p>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 px-2 flex justify-between">
                                Reason for Rejection
                                <span className={reason.length > 0 ? "text-rose-500" : "opacity-30"}>* Required</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Invalid UTR ID, Mismatch in payment amount, etc."
                                required
                                className="w-full min-h-[140px] bg-muted/20 border border-border/30 rounded-2xl p-6 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/30 transition-all resize-none placeholder:text-muted-foreground/30"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 rounded-2xl bg-muted/40 text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all border border-border/20"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!reason.trim()}
                                className="flex-[2] py-4 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Confirm & Send Notification
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RejectionModal;
