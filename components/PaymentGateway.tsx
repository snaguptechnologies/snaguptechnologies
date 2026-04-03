"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Landmark, Smartphone, ShieldCheck, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import axios from "axios";

interface PaymentGatewayProps {
    batch: {
        id: number;
        name: string;
        price: number;
    };
    onSuccess: () => void;
    onClose: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ batch, onSuccess, onClose }) => {
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState(3);
    const [utr, setUtr] = useState("");
    const [upiSettings, setUpiSettings] = useState({ upi_id: "", upi_qr_image: "" });
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        if (status === "success" && countdown === 0) {
            onSuccess();
        }
    }, [status, countdown, onSuccess]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/settings/public");
                setUpiSettings({
                    upi_id: res.data.upi_id || "payments@snagup",
                    upi_qr_image: res.data.upi_qr_image || ""
                });
            } catch (err) {
                console.error("Failed to fetch payment settings");
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);

    const handlePayment = async () => {
        if (!utr || utr.trim().length < 6) {
            setError("Please enter a valid 12-digit UTR / Transaction ID");
            return;
        }

        setStatus("processing");
        setError("");

        try {
            const token = localStorage.getItem("snagup_token");
            if (!token) throw new Error("Authentication required");

            await axios.post("http://localhost:5000/api/enrollments", {
                batch_id: batch.id,
                payment_method: "upi",
                transaction_id: utr.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStatus("success");
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err: any) {
            setStatus("error");
            setError(err.response?.data?.error || "Submission failed. Please check your UTR.");
        }
    };

    if (status === "success") {
        return (
            <div className="p-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-4 italic uppercase">Received</h2>
                <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 mb-8 max-w-sm">
                    <p className="text-sm text-foreground font-bold mb-2">We are verifying your payment.</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                        Once validated by our team, you will receive an automated enrollment email. This usually takes 5-10 minutes.
                    </p>
                </div>
                <div className="bg-foreground text-background px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em]">
                    Redirecting in {countdown}s...
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border bg-muted/5 flex justify-between items-center relative z-10 shrink-0">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter uppercase italic">Manual Transfer</h2>
                    <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> Encrypted UTR Verification
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <div className="p-8">
                    {/* Order Summary */}
                    <div className="bg-foreground text-background rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 mb-6 sm:mb-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-background/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-background/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Program Enrollment</p>
                                    <h3 className="text-xl sm:text-2xl font-black truncate max-w-[150px] sm:max-w-[200px] tracking-tight italic">{batch.name}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Net Payable</p>
                                    <span className="text-2xl sm:text-3xl font-black italic tracking-tighter">₹{batch.price}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-background/10">
                                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Transaction Fee: ₹0.00 (Standard)</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="bg-muted/10 border border-border/50 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 mb-6 sm:mb-10 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-[10px] sm:text-xs font-black text-foreground mb-4 sm:mb-6 uppercase tracking-[0.2em]">Scan to Pay</h4>

                            {loadingSettings ? (
                                <div className="w-32 h-32 sm:w-48 sm:h-48 bg-muted/20 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center animate-pulse">
                                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-muted-foreground/20" />
                                </div>
                            ) : upiSettings.upi_qr_image ? (
                                <div className="w-40 h-40 sm:w-56 sm:h-56 bg-white p-3 sm:p-4 rounded-xl sm:rounded-[2rem] mx-auto mb-4 sm:mb-6 shadow-xl border border-border/20 group hover:scale-[1.02] transition-transform cursor-zoom-in">
                                    <img src={upiSettings.upi_qr_image} alt="UPI QR" className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-32 h-32 sm:w-48 sm:h-48 bg-muted/20 rounded-2xl sm:rounded-3xl mx-auto flex flex-col items-center justify-center mb-4 sm:mb-6 border border-dashed border-border">
                                    <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-[8px] font-black text-muted-foreground/50 uppercase px-4">QR Not Configured</p>
                                </div>
                            )}

                            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 bg-background border border-border/50 rounded-full mb-2">
                                <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">UPI ID:</span>
                                <span className="text-[10px] sm:text-xs font-black text-foreground">{upiSettings.upi_id}</span>
                            </div>
                        </div>
                    </div>

                    {/* UTR Input Section */}
                    <div className="space-y-3 sm:space-y-4">
                        <label className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 opacity-60">Verification Detail</label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter 12-digit UTR Number"
                                value={utr}
                                onChange={e => setUtr(e.target.value)}
                                className="w-full bg-muted/20 border border-border/50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-foreground focus:outline-none focus:border-foreground/30 transition-all font-black placeholder:text-muted-foreground/20 tracking-widest text-base sm:text-lg"
                            />
                            <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium px-2 leading-relaxed italic">
                            *Find the UTR/Reference number in your bank app after payment. It is usually a 12-digit number starting with 3, 4, or 5.
                        </p>
                    </div>

                    {error && (
                        <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-tight flex items-center gap-3 animate-shake">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={status === "processing" || !utr}
                        className="w-full mt-8 sm:mt-10 py-5 sm:py-6 bg-foreground text-background rounded-xl sm:rounded-[2.5rem] font-black text-xs sm:text-sm transition-all shadow-2xl shadow-foreground/10 hover:shadow-foreground/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                    >
                        {status === "processing" ? (
                            <>
                                <Loader2 className="w-4 h-4 sm:w-5 h-5 animate-spin" />
                                <span className="uppercase tracking-[0.2em]">Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span className="uppercase tracking-[0.2em]">Submit Payment Reference</span>
                                <ChevronRight className="w-4 h-4 sm:w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <p className="mt-6 text-center text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        Hand-verified | Secure processing | zero fees
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
