"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Image from "next/image";
import BrandLogo from "./BrandLogo";
import { useTheme } from "next-themes";

export default function Hero3DAsset() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const { theme, resolvedTheme } = useTheme();

    // Mouse interaction
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springX = useSpring(mouseX, { damping: 20, stiffness: 100 });
    const springY = useSpring(mouseY, { damping: 20, stiffness: 100 });

    useEffect(() => {
        setMounted(true);
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
            mouseX.set(x * 15);
            mouseY.set(y * 15);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    if (!mounted) return <div className="w-full h-[500px]" />;

    const currentTheme = resolvedTheme || theme;
    const isLight = currentTheme === "light";
    const accentColor = isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.08)";
    const nodeColor = isLight ? "black" : "white";

    // Generate random nodes for the network
    const nodes = Array.from({ length: 45 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 80 + 50, // 10% to 90%
        y: (Math.random() - 0.5) * 80 + 50,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 10 + 20,
        delay: Math.random() * 5
    }));

    // Generate connections between nearby nodes
    const connections: { id: string; start: number; end: number }[] = [];
    nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach((otherNode) => {
            const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
            if (dist < 18) {
                connections.push({
                    id: `${node.id}-${otherNode.id}`,
                    start: node.id,
                    end: otherNode.id
                });
            }
        });
    });

    return (
        <div ref={containerRef} className="relative w-full max-w-[600px] h-[500px] md:h-[600px] mx-auto flex items-center justify-center select-none overflow-visible">
            {/* SVG Network Background */}
            <motion.svg
                viewBox="0 0 100 100"
                className={`absolute inset-0 w-full h-full ${isLight ? "drop-shadow-[0_0_15px_rgba(0,0,0,0.05)]" : "drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"}`}
                style={{ rotateX: springY, rotateY: springX }}
            >
                <defs>
                    <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={nodeColor} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={nodeColor} stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Connection Lines */}
                {connections.map((conn) => {
                    const nodeA = nodes[conn.start];
                    const nodeB = nodes[conn.end];
                    return (
                        <motion.line
                            key={conn.id}
                            x1={`${nodeA.x}%`} y1={`${nodeA.y}%`}
                            x2={`${nodeB.x}%`} y2={`${nodeB.y}%`}
                            stroke={accentColor}
                            strokeWidth="0.1"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: isLight ? [0.05, 0.2, 0.05] : [0.03, 0.12, 0.03] }}
                            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <motion.g key={node.id}>
                        <motion.circle
                            cx={`${node.x}%`} cy={`${node.y}%`}
                            r={node.size * 0.15}
                            fill={nodeColor}
                            initial={{ opacity: 0.2 }}
                            animate={{ opacity: isLight ? [0.1, 0.3, 0.1] : [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }}
                            transition={{ duration: node.speed, repeat: Infinity, delay: node.delay, ease: "linear" }}
                        />
                        <motion.circle
                            cx={`${node.x}%`} cy={`${node.y}%`}
                            r={node.size * 0.45}
                            fill="url(#nodeGlow)"
                            animate={{ opacity: isLight ? [0.05, 0.15, 0.05] : [0.1, 0.3, 0.1] }}
                            transition={{ duration: 4, repeat: Infinity, delay: node.delay }}
                        />
                    </motion.g>
                ))}
            </motion.svg>

            {/* Central Ethereal Core */}
            <div className="relative z-20 flex items-center justify-center">
                {/* Glow rings */}
                <motion.div
                    className={`absolute w-64 h-64 rounded-full border ${isLight ? "border-black/5" : "border-white/10"}`}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className={`absolute w-48 h-48 rounded-full ${isLight ? "bg-black/[0.01]" : "bg-white/[0.02]"}`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                {/* Central Radial Glow */}
                <div className={`absolute inset-0 w-80 h-80 bg-gradient-to-r from-transparent ${isLight ? "via-black/[0.02]" : "via-white/[0.03]"} to-transparent blur-[80px]`} />

                {/* Brand Logo */}
                <motion.div
                    className={`relative z-30 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center p-4 ${isLight ? "bg-card/30" : "bg-white/[0.03]"} backdrop-blur-md rounded-2xl border ${isLight ? "border-border" : "border-white/10"} ${isLight ? "shadow-lg" : "shadow-[0_0_50px_rgba(255,255,255,0.05)]"}`}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ rotateX: springY, rotateY: springX }}
                >
                    <BrandLogo size={120} priority />
                </motion.div>
            </div>

            {/* HUD Labels with Pointer Lines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[
                    { text: "AI-Powered", x: "85%", y: "25%", align: "right" },
                    { text: "Verified", x: "15%", y: "75%", align: "left" },
                    { text: "Live Batches", x: "82%", y: "70%", align: "right" },
                ].map((item, idx) => (
                    <motion.div
                        key={item.text}
                        className="absolute flex items-center gap-4"
                        style={{ top: item.y, left: item.x, transform: "translate(-50%, -50%)" }}
                        animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 3 + idx, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {item.align === "left" && (
                            <div className={`w-12 h-px bg-gradient-to-r from-transparent ${isLight ? "to-black/20" : "to-white/40"}`} />
                        )}
                        <div className={`px-3 py-1.5 rounded-lg ${isLight ? "bg-card/50" : "bg-white/[0.05]"} backdrop-blur-md border ${isLight ? "border-border" : "border-white/10"} shadow-lg`}>
                            <span className={`text-[10px] md:text-xs font-bold ${isLight ? "text-foreground/80" : "text-white/80"} uppercase tracking-widest whitespace-nowrap`}>
                                {item.text}
                            </span>
                        </div>
                        {item.align === "right" && (
                            <div className={`w-12 h-px bg-gradient-to-l from-transparent ${isLight ? "to-black/20" : "to-white/40"}`} />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
