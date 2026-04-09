"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, AlertCircle, Loader2, ArrowLeft, ShieldCheck, Zap, Globe, Home, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";



import Image from "next/image";
import BrandLogo from "@/components/BrandLogo";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";

export default function Login() {
    const router = useRouter();

    // ── Security guard: redirect already-authenticated users ──────────────
    // Prevents the portal → /login → portal-without-login bypass.
    // If a valid session exists, skip the login form entirely.
    useEffect(() => {
        const token = localStorage.getItem("snagup_token");
        const userStr = localStorage.getItem("snagup_user");
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user?.role) {
                    router.replace(`/dashboard/${user.role}`);
                }
            } catch {
                // Corrupt data — let them see the login form
            }
        }
    }, [router]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [forgotNewPassword, setForgotNewPassword] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");
        setForgotLoading(true);

        try {
            if (forgotStep === 1) {
                const res = await axios.post(`${API_ENDPOINTS.AUTH}/forgot-password`, { email: forgotEmail });
                setForgotSuccess(res.data.message);
                setForgotStep(2);
            } else if (forgotStep === 2) {
                await axios.post(`${API_ENDPOINTS.AUTH}/verify-otp`, { email: forgotEmail, otp: forgotOtp });
                setForgotStep(3);
            } else if (forgotStep === 3) {
                await axios.post(`${API_ENDPOINTS.AUTH}/reset-password`, {
                    email: forgotEmail,
                    otp: forgotOtp,
                    newPassword: forgotNewPassword
                });
                setForgotSuccess("Password reset successfully! You can now login.");
                setTimeout(() => {
                    setShowForgotModal(false);
                    setForgotStep(1);
                    setForgotEmail("");
                    setForgotOtp("");
                    setForgotNewPassword("");
                    setForgotSuccess("");
                }, 3000);
            }
        } catch (err: any) {
            setForgotError(err.response?.data?.error || "An error occurred. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(`${API_ENDPOINTS.AUTH}/login`, {
                email,
                password,
            });

            localStorage.setItem("snagup_token", res.data.token);
            localStorage.setItem("snagup_user", JSON.stringify(res.data.user));

            // Redirect based on role
            router.push(`/dashboard/${res.data.user.role}`);
        } catch (err: any) {
            if (err.response) {
                // Server responded with an error status
                setError(err.response.data?.error || "Login failed. Please check your credentials.");
            } else if (err.request) {
                // Request was made but no response (server down / network issue)
                setError("Cannot reach the server. Please ensure the backend is running.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
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
                    <div className="flex items-center gap-4 mb-12 animate-fade-in">
                        <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-xl border border-border">
                            <BrandLogo size={48} priority />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter text-foreground">SNAGUP</h2>
                            <p className="text-muted-foreground font-light tracking-widest text-sm uppercase">Technologies</p>
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight text-foreground">
                        Empowering the <span className="text-gradient">Next Generation</span> of Innovators.
                    </h1>
                    <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
                        Join the most prestigious learning community and master the skills that define the future of technology.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Secure Access</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Fast Learning</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Global Reach</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Elite Content</span>
                        </div>
                    </div>
                </div>

                {/* Visual Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Right Panel: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 relative" suppressHydrationWarning>
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10">
                        <h2 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h2>
                        <p className="text-muted-foreground">Enter your credentials to access your dashboard.</p>
                    </div>


                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-slide-up">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-medium"
                                placeholder="name@company.com"
                                suppressHydrationWarning
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between ml-1">
                                <label className="text-sm font-medium text-muted-foreground">Password</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotModal(true);
                                        setForgotStep(1);
                                        setForgotError("");
                                        setForgotSuccess("");
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 mt-4 bg-primary hover:opacity-90 text-primary-foreground rounded-2xl font-black transition-all shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                            suppressHydrationWarning
                        >
                            <span className="relative z-10" suppressHydrationWarning>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIGN IN TO DASHBOARD"}
                            </span>
                        </button>
                    </form>

                    <p className="mt-10 text-center text-muted-foreground text-sm">
                        New member?{" "}
                        <Link href="/register" className="text-foreground hover:opacity-80 font-bold transition-colors border-b border-border pb-0.5">
                            Create Workspace Account
                        </Link>
                    </p>
                </motion.div>


                {/* Forgot Password Modal Overlay */}
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {forgotStep === 1 && "Recover Password"}
                                        {forgotStep === 2 && "Verify OTP"}
                                        {forgotStep === 3 && "Reset Password"}
                                    </h3>
                                    <button
                                        onClick={() => setShowForgotModal(false)}
                                        className="p-2 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>

                                {forgotError && (
                                    <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {forgotError}
                                    </div>
                                )}

                                {forgotSuccess && (
                                    <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        {forgotSuccess}
                                    </div>
                                )}

                                <form onSubmit={handleForgotSubmit} className="space-y-4">
                                    {forgotStep === 1 && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground mb-4">Enter your email address and we'll send you a 6-digit OTP to reset your password.</p>
                                            <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                placeholder="name@company.com"
                                            />
                                        </div>
                                    )}

                                    {forgotStep === 2 && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-muted-foreground">We've sent a 6-digit code to <span className="text-foreground font-medium">{forgotEmail}</span>.</p>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Authentication Code</label>
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={6}
                                                    value={forgotOtp}
                                                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                                                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-center text-2xl font-bold tracking-[0.5em]"
                                                    placeholder="000000"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setForgotStep(1)}
                                                className="text-xs text-primary font-bold hover:underline"
                                            >
                                                Wrong email? Go back
                                            </button>
                                        </div>
                                    )}

                                    {forgotStep === 3 && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-muted-foreground">Create a new secure password for your account.</p>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        required
                                                        minLength={6}
                                                        value={forgotNewPassword}
                                                        onChange={(e) => setForgotNewPassword(e.target.value)}
                                                        className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-foreground transition-all"
                                                    >
                                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full py-4 mt-2 bg-primary text-primary-foreground rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center disabled:opacity-70"
                                    >
                                        {forgotLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            forgotStep === 1 ? "SEND OTP" : (forgotStep === 2 ? "VERIFY OTP" : "RESET PASSWORD")
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
