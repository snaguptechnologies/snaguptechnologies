"use client";

import React, { useState } from "react";
import { Shield, Play, CheckCircle2, AlertTriangle, ArrowRight, Zap, RefreshCw, Layers, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResponseStrategy {
    id: string;
    name: string;
    action: string;
    estimated_traffic_reduction: number;
    risk_reduction_pct: number;
    service_availability_impact: number;
    latency_delta_ms: string;
    recommended: boolean;
}

export interface ResponseSimulationData {
    attack_type: string;
    target_device_id: string;
    current_risk: number;
    simulated_risk_after_defense: number;
    available_strategies: ResponseStrategy[];
    recommended_strategy: ResponseStrategy;
}

interface ResponseSimulatorProps {
    simulationData: ResponseSimulationData | null;
    eventId: string;
    onExecuteStrategy: (eventId: string, strategyId: string) => void;
    onClose: () => void;
}

export default function ResponseSimulatorModal({
    simulationData,
    eventId,
    onExecuteStrategy,
    onClose
}: ResponseSimulatorProps) {
    const [selectedStratId, setSelectedStratId] = useState<string>(
        simulationData?.recommended_strategy?.id || "STRAT-A"
    );
    const [executing, setExecuting] = useState(false);
    const [executedSuccess, setExecutedSuccess] = useState(false);

    if (!simulationData) return null;

    const selectedStrat = simulationData.available_strategies.find(s => s.id === selectedStratId) || simulationData.recommended_strategy;
    const projectedNewRisk = Math.max(8, Math.round(simulationData.current_risk * (1 - selectedStrat.risk_reduction_pct / 100)));

    const handleConfirmExecution = () => {
        setExecuting(true);
        setTimeout(() => {
            onExecuteStrategy(eventId, selectedStratId);
            setExecuting(false);
            setExecutedSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1200);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="relative w-full max-w-3xl glass-panel rounded-3xl border border-border/50 bg-card p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-foreground tracking-tight">
                                Digital Twin Response Simulator
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Closed-loop predictive impact modeling prior to live network mitigation.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                        Close
                    </button>
                </div>

                {/* Threat & Target Summary Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-muted/40 border border-border/30">
                    <div>
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">Detected Attack</span>
                        <span className="text-base font-black text-rose-500">{simulationData.attack_type}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">Target Node</span>
                        <span className="text-base font-black text-foreground font-mono">{simulationData.target_device_id}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">Current Risk Level</span>
                        <span className="text-base font-black text-amber-500">{simulationData.current_risk} / 100</span>
                    </div>
                </div>

                {/* Strategy Selection Options */}
                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block">
                        Select Defensive Mitigation Strategy Option
                    </label>

                    <div className="space-y-3">
                        {simulationData.available_strategies.map((strat) => {
                            const isSelected = selectedStratId === strat.id;

                            return (
                                <div
                                    key={strat.id}
                                    onClick={() => setSelectedStratId(strat.id)}
                                    className={cn(
                                        "cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                                        isSelected
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                                            : "border-border/60 bg-card hover:border-border hover:bg-muted/30"
                                    )}
                                >
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-foreground">{strat.name}</span>
                                            {strat.recommended && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    Optimal AI Choice
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">{strat.action}</p>
                                    </div>

                                    {/* Strategy Impact Metrics */}
                                    <div className="flex items-center gap-3 shrink-0 text-center">
                                        <div className="p-2 rounded-xl bg-muted/60 text-[10px] space-y-0.5 min-w-[70px]">
                                            <span className="text-muted-foreground font-bold block">Traffic Drop</span>
                                            <span className="font-black text-emerald-500 text-xs">-{strat.estimated_traffic_reduction}%</span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-muted/60 text-[10px] space-y-0.5 min-w-[70px]">
                                            <span className="text-muted-foreground font-bold block">Uptime</span>
                                            <span className="font-black text-foreground text-xs">{strat.service_availability_impact}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Digital Twin Simulation Forecast Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-slate-100 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Play className="w-3.5 h-3.5" /> Digital Twin Simulated Outcome Preview
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Monte-Carlo Simulation Iterations: 1,000</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Projected Risk Score</p>
                            <p className="text-xl font-black text-emerald-400">{projectedNewRisk} / 100</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Risk Reduction</p>
                            <p className="text-xl font-black text-emerald-400">-{selectedStrat.risk_reduction_pct}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Est. Traffic Cut</p>
                            <p className="text-xl font-black text-primary">-{selectedStrat.estimated_traffic_reduction}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Latency Delta</p>
                            <p className="text-xl font-black text-slate-200">{selectedStrat.latency_delta_ms}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={executing || executedSuccess}
                        onClick={handleConfirmExecution}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {executedSuccess ? (
                            <>
                                <Check className="w-4 h-4" /> Strategy Applied & Twin State Updated
                            </>
                        ) : executing ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" /> Deploying Adaptive Mitigation...
                            </>
                        ) : (
                            <>
                                Execute Adaptive Strategy <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
