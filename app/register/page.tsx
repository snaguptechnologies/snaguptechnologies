"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, AlertCircle, Loader2, ArrowLeft, ShieldCheck, Zap, Globe, Home, Eye, EyeOff } from "lucide-react";

import BrandLogo from "@/components/BrandLogo";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(`${API_ENDPOINTS.AUTH}/register`, formData);

            localStorage.setItem("snagup_token", res.data.token);
            localStorage.setItem("snagup_user", JSON.stringify(res.data.user));

            router.push(`/dashboard/student`);
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background text-foreground transition-colors duration-500" suppressHydrationWarning>
            {/* Left Panel: Branding & Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted items-center justify-center border-r border-border" suppressHydrationWarning>
                {/* Background Textures */}
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 p-12 max-w-xl">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-xl border border-border">
                            <BrandLogo size={48} priority />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter text-foreground">SNAGUP</h2>
                            <p className="text-muted-foreground font-light tracking-widest text-sm uppercase">Technologies</p>
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight text-foreground">
                        Start Your <span className="text-gradient">Professional</span> Journey Today.
                    </h1>
                    <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
                        Join thousands of students and industry experts who have already chosen Snagup Technologies for their career growth.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Verified Platform</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Instant Access</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Career Network</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Expert Ledger</span>
                        </div>
                    </div>
                </div>

                {/* Visual Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Right Panel: Registration Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-y-auto" suppressHydrationWarning>
                <div className="min-h-full w-full flex flex-col items-center justify-center py-12">
                    {/* Mobile Branding (Only visible on small screens) */}
                    <div className="lg:hidden flex items-center gap-3 mb-12">
                        <BrandLogo size={40} />
                    </div>

                    {/* Back to Home Button */}
                    <Link
                        href="/home"
                        className="absolute top-8 right-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all group z-20"
                    >
                        <BrandLogo size={24} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="text-sm font-medium uppercase tracking-widest text-[10px]">Back to Home</span>
                        <Home className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full max-w-lg"
                    >
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-4xl font-bold text-foreground mb-2">Join Us</h2>
                            <p className="text-muted-foreground">Create your student workspace to begin.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-slide-up">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-medium"
                                    placeholder="John Doe"
                                    suppressHydrationWarning
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-medium"
                                        placeholder="name@company.com"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-medium"
                                        placeholder="+91 00000 00000"
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-medium pr-12"
                                        placeholder="••••••••"
                                        suppressHydrationWarning
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground/40 mt-1 ml-1 uppercase tracking-widest">MINIMUM 6 CHARACTERS</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 mt-4 bg-primary hover:opacity-90 text-primary-foreground rounded-2xl font-black transition-all shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                                suppressHydrationWarning
                            >
                                <span className="relative z-10" suppressHydrationWarning>
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CREATE ACCOUNT"}
                                </span>
                            </button>
                        </form>

                        <p className="mt-10 text-center text-muted-foreground text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-foreground hover:opacity-80 font-bold transition-colors border-b border-border pb-0.5">
                                Sign In to Workspace
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
