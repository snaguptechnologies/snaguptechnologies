"use client";

import React from "react";
import { Award, BarChart3, CheckCircle2, ShieldCheck, Activity, Cpu, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModelEvaluationData {
    model_name: string;
    dataset_benchmarked: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    false_positive_rate: number;
    false_negative_rate: number;
    detection_latency_ms: number;
    response_latency_ms: number;
    confusion_matrix: {
        true_positive: number;
        false_positive: number;
        true_negative: number;
        false_negative: number;
    };
    comparative_research_results: Array<{
        framework: string;
        accuracy: string;
        false_positive_rate: string;
        detection_latency: string;
        response_automation: string;
        digital_twin_sync: string;
    }>;
}

interface EvaluationCardProps {
    evaluation: ModelEvaluationData | null;
}

export default function ModelEvaluationCard({ evaluation }: EvaluationCardProps) {
    if (!evaluation) return null;

    const { confusion_matrix } = evaluation;

    return (
        <div className="glass-panel p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-2xl space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            AI/ML Model Evaluation & Empirical Benchmarks
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Validation metrics benchmarked on CIC-IDS2017 & UNSW-NB15 standardized cybersecurity research datasets.
                        </p>
                    </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High Precision Architecture
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Accuracy</span>
                    <p className="text-lg font-black text-emerald-400">{evaluation.accuracy}%</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Precision</span>
                    <p className="text-lg font-black text-foreground">{evaluation.precision}%</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Recall</span>
                    <p className="text-lg font-black text-foreground">{evaluation.recall}%</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">F1-Score</span>
                    <p className="text-lg font-black text-primary">{evaluation.f1_score}%</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">ROC-AUC</span>
                    <p className="text-lg font-black text-emerald-400">{evaluation.roc_auc}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">FPR</span>
                    <p className="text-lg font-black text-emerald-400">{evaluation.false_positive_rate}%</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">FNR</span>
                    <p className="text-lg font-black text-amber-400">{evaluation.false_negative_rate}%</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 text-center space-y-1">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Latency</span>
                    <p className="text-lg font-black text-primary">{evaluation.detection_latency_ms}ms</p>
                </div>
            </div>

            {/* Confusion Matrix & Performance Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Confusion Matrix Grid */}
                <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" /> Empirical Confusion Matrix
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <span className="text-[10px] font-extrabold text-emerald-400 uppercase">True Positive (TP)</span>
                            <p className="text-2xl font-black text-emerald-400">{confusion_matrix.true_positive}</p>
                            <p className="text-[10px] text-muted-foreground">Malicious correctly identified</p>
                        </div>
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                            <span className="text-[10px] font-extrabold text-rose-400 uppercase">False Positive (FP)</span>
                            <p className="text-2xl font-black text-rose-400">{confusion_matrix.false_positive}</p>
                            <p className="text-[10px] text-muted-foreground">Normal flagged as malicious</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                            <span className="text-[10px] font-extrabold text-amber-400 uppercase">False Negative (FN)</span>
                            <p className="text-2xl font-black text-amber-400">{confusion_matrix.false_negative}</p>
                            <p className="text-[10px] text-muted-foreground">Malicious missed</p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                            <span className="text-[10px] font-extrabold text-blue-400 uppercase">True Negative (TN)</span>
                            <p className="text-2xl font-black text-blue-400">{confusion_matrix.true_negative}</p>
                            <p className="text-[10px] text-muted-foreground">Normal correctly identified</p>
                        </div>
                    </div>
                </div>

                {/* Research Highlights & Latency Breakout */}
                <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-4 flex flex-col justify-between">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-primary" /> Latency & Performance Breakdown
                        </h4>
                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
                                <span className="font-bold text-foreground">AI Inference Detection Latency</span>
                                <span className="font-mono font-black text-primary">{evaluation.detection_latency_ms} ms / flow</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
                                <span className="font-bold text-foreground">Digital Twin Response Simulation Time</span>
                                <span className="font-mono font-black text-emerald-400">{evaluation.response_latency_ms} ms / scenario</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
                                <span className="font-bold text-foreground">Dataset Baseline Validation</span>
                                <span className="font-mono font-black text-foreground">{evaluation.dataset_benchmarked}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground italic">
                        * Research Note: Evaluation metrics are updated dynamically from real empirical runs against benchmark flow samples.
                    </p>
                </div>
            </div>

            {/* Comparative Research Table (Traditional ML IDS vs Our Digital Twin Framework) */}
            <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Comparative Research Analysis Matrix
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-border/40">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-muted/60 uppercase tracking-wider text-[10px] font-black text-muted-foreground border-b border-border/40">
                            <tr>
                                <th className="p-3.5">Cybersecurity Framework</th>
                                <th className="p-3.5">Accuracy</th>
                                <th className="p-3.5">False Positive Rate</th>
                                <th className="p-3.5">Detection Latency</th>
                                <th className="p-3.5">Response Automation</th>
                                <th className="p-3.5">Digital Twin Sync</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 font-medium">
                            {evaluation.comparative_research_results.map((row, idx) => {
                                const isOurs = row.framework.includes("Ours");

                                return (
                                    <tr key={idx} className={cn(
                                        "transition-colors",
                                        isOurs ? "bg-primary/10 font-bold text-foreground" : "bg-card hover:bg-muted/20 text-muted-foreground"
                                    )}>
                                        <td className="p-3.5 flex items-center gap-2">
                                            {isOurs && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                                            <span>{row.framework}</span>
                                        </td>
                                        <td className="p-3.5 font-bold text-foreground">{row.accuracy}</td>
                                        <td className="p-3.5">{row.false_positive_rate}</td>
                                        <td className="p-3.5 font-mono">{row.detection_latency}</td>
                                        <td className="p-3.5">{row.response_automation}</td>
                                        <td className="p-3.5">
                                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase",
                                                row.digital_twin_sync === 'Yes' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-muted text-muted-foreground"
                                            )}>
                                                {row.digital_twin_sync}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
