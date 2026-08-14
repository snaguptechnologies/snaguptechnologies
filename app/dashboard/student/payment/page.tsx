"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentGateway from "@/components/PaymentGateway";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { ShieldCheck, Loader2 } from "lucide-react";

function PaymentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    useAuthGuard("student");

    const batchId = searchParams.get("batchId");
    const batchName = searchParams.get("batchName");
    const price = searchParams.get("price");

    const [batch, setBatch] = useState<{ id: number; name: string; price: number } | null>(null);

    useEffect(() => {
        router.replace("/dashboard/student");
    }, [router]);

    if (!batch) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
                        Loading Payment...
                    </p>
                </div>
            </div>
        );
    }

    const handleSuccess = () => {
        // Navigate back to student dashboard with a query flag so it can show the success message and switch to my-courses
        router.replace("/dashboard/student?payment=success");
    };

    const handleClose = () => {
        router.replace("/dashboard/student");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top brand bar */}
            <header className="h-16 shrink-0 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <img src="/brand-logo-v2.png" alt="Snagup Technologies" className="h-9 w-auto object-contain" />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Secure Checkout
                </div>
            </header>

            {/* Centered payment card */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-lg bg-card border border-border/50 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <PaymentGateway
                        batch={batch}
                        onClose={handleClose}
                        onSuccess={handleSuccess}
                    />
                </div>
            </div>

            {/* Footer */}
            <footer className="py-4 text-center">
                <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.25em]">
                    © {new Date().getFullYear()} Snagup Technologies — Encrypted & Verified
                </p>
            </footer>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <PaymentPageContent />
        </Suspense>
    );
}
