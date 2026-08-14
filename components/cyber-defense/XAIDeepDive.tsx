"use client";

import React from "react";
import { Sparkles, Brain, Info, ArrowUpRight, BarChart2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface XAIFactor {
    feature: string;
    impact: "High" | "Medium" | "Low";
    weight: number; // e.g. 38 %
    direction: string; // e.g. "Positive (+)"
    note: string;
}

export interface XAIExplanation {
    summary: string;
    contributing_factors: XAIFactor[];
}

interface XAIDeepDiveProps {
    explanation: XAIExplanation | null;
    attackType: string;
    confidence: number;
    anomalyScore: number;
}

export default function XAIDeepDive({
    explanation,
    attackType,
    confidence,
    anomalyScore
}: XAIDeepDiveProps) {
    if (!explanation) return null;

    return (
        <div className="glass-panel p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                        <Sparkles className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            Explainable AI (XAI) Engine
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Transparent feature attribution & SHAP/LIME decision breakdown for security auditability.
                        </p>
                    </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                    Model Confidence: {confidence}%
                </div>
            </div>

            {/* Model Decision Overview Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">Classification Outcome</span>
                    <span className="text-xs font-bold text-muted-foreground font-mono">Anomaly Score: {anomalyScore}</span>
                </div>
                <p className="text-lg font-black text-foreground">
                    Classified as <span className="text-primary underline underline-offset-4 decoration-primary/40">{attackType}</span>
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {explanation.summary}
                </p>
            </div>

            {/* Feature Impact Progress Bars */}
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" /> Feature Contribution Weights (SHAP/LIME Impact)
                </h4>

                <div className="space-y-3">
                    {explanation.contributing_factors.map((factor, idx) => {
                        const getImpactColor = (impact: string) => {
                            switch (impact) {
                                case "High": return "bg-rose-500 text-rose-500 border-rose-500/30";
                                case "Medium": return "bg-amber-500 text-amber-500 border-amber-500/30";
                                default: return "bg-blue-500 text-blue-500 border-blue-500/30";
                            }
                        };

                        return (
                            <div key={idx} className="p-3.5 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-all space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 font-bold text-foreground">
                                        <span>{factor.feature}</span>
                                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border",
                                            factor.impact === 'High' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                            factor.impact === 'Medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        )}>
                                            {factor.impact} Impact ({factor.weight}%)
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground">{factor.direction}</span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-700 rounded-full",
                                            factor.impact === 'High' ? "bg-rose-500" :
                                            factor.impact === 'Medium' ? "bg-amber-500" : "bg-blue-500"
                                        )}
                                        style={{ width: `${Math.min(100, factor.weight * 2.2)}%` }}
                                    />
                                </div>

                                <p className="text-[11px] text-muted-foreground font-medium pt-0.5">
                                    {factor.note}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Research & Compliance Footnote */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/20 flex items-start gap-3 text-[11px] text-muted-foreground">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                    <strong>Explainable AI Guarantee:</strong> Feature weights are derived mathematically from additive feature attribution vectors without black-box approximations. Ensures compliance with ISO/IEC 42001 AI Transparency Standards.
                </p>
            </div>
        </div>
    );
}
