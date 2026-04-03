"use client";

import Link from "next/link";
import Image from "next/image";
import BrandLogo from "./BrandLogo";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, Menu, User, LayoutDashboard, Shield, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem("snagup_user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, [pathname]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    function handleLogout() {
        localStorage.removeItem("snagup_token");
        localStorage.removeItem("snagup_user");
        setUser(null);
        window.location.href = "/login";
    }

    const navLinks = [
        { name: "Home", href: "/home" },
        { name: "Services", href: "/home#services" },
        { name: "Verify", href: "/home#verify" },
    ];

    if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/dashboard")) return null;

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 w-full transition-all duration-300 border-b z-50",
                    isScrolled
                        ? "bg-background/90 backdrop-blur-md border-border/50"
                        : "bg-transparent border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-muted-foreground hover:text-foreground md:hidden p-2 -ml-2 transition-colors"
                        >
                            {isMobileMenuOpen ? <LogOut className="w-6 h-6 rotate-90" /> : <Menu className="w-6 h-6" />}
                        </button>
                        
                        <Link href="/home" className="flex items-center gap-3 group">
                            <BrandLogo size={38} className="transition-transform duration-500 group-hover:rotate-[360deg]" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="hidden sm:flex font-black text-2xl tracking-tight text-foreground">
                                    SNAGUP
                                </span>
                                <span className="hidden sm:flex font-bold text-[10px] uppercase tracking-[0.25em] text-primary -mt-0.5 ml-0.5">
                                    Technologies
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary",
                                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <ThemeToggle />
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <Link
                                    href={`/dashboard/${user.role}`}
                                    className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground bg-primary rounded-xl transition-all shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground px-4">
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground bg-primary rounded-xl transition-all shadow-lg shadow-primary/10 hover:opacity-90 active:scale-95"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                        {/* Mobile dashboard/login icon quick link */}
                        <div className="md:hidden">
                            {user ? (
                                <Link href={`/dashboard/${user.role}`} className="p-2 text-primary">
                                    <LayoutDashboard className="w-6 h-6" />
                                </Link>
                            ) : (
                                <Link href="/login" className="p-2 text-muted-foreground">
                                    <User className="w-6 h-6" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-background md:hidden pt-24 px-6 pb-12 flex flex-col"
                    >
                        <div className="flex flex-col gap-6 flex-1 pt-12">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-4xl font-black text-foreground tracking-tighter hover:text-primary transition-colors flex items-center justify-between group"
                                >
                                    {link.name}
                                    <ArrowRight className="w-8 h-8 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                </Link>
                            ))}
                        </div>

                        <div className="mt-auto space-y-6 pt-12 border-t border-border">
                            {!user ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="h-14 flex items-center justify-center font-bold text-foreground border border-border rounded-2xl"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="h-14 flex items-center justify-center font-bold text-primary-foreground bg-primary rounded-2xl"
                                    >
                                        Register
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold truncate text-foreground">{user.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{user.role}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                        className="w-full h-14 flex items-center justify-center gap-3 font-bold text-rose-500 bg-rose-500/10 rounded-2xl"
                                    >
                                        <LogOut className="w-5 h-5" /> Logout Session
                                    </button>
                                </div>
                            )}
                            <div className="flex justify-center pt-4">
                                <ThemeToggle />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
