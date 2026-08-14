"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DigitalTwinTopology, { DigitalTwinDevice } from "@/components/cyber-defense/DigitalTwinTopology";
import XAIDeepDive, { XAIExplanation } from "@/components/cyber-defense/XAIDeepDive";
import ResponseSimulatorModal, { ResponseSimulationData } from "@/components/cyber-defense/ResponseSimulatorModal";
import ModelEvaluationCard, { ModelEvaluationData } from "@/components/cyber-defense/ModelEvaluationCard";
import {
    Shield, Activity, Zap, AlertTriangle, CheckCircle2, Play, RefreshCw,
    BarChart3, Filter, Search, Award, Info, Lock, ArrowUpRight, Cpu, Layers, Server
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";

const SECURITY_API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/security` : "http://localhost:5000/api/security";

export default function CyberDefenseCenterPage() {
    const [loading, setLoading] = useState(true);
    const [globalThreat, setGlobalThreat] = useState<string>("LOW");
    const [maxRisk, setMaxRisk] = useState<number>(12);
    const [devices, setDevices] = useState<DigitalTwinDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DigitalTwinDevice | null>(null);

    // Latest Prediction & Telemetry State
    const [latestPrediction, setLatestPrediction] = useState<any>(null);
    const [latestTelemetry, setLatestTelemetry] = useState<any>(null);
    const [xaiExplanation, setXaiExplanation] = useState<XAIExplanation | null>(null);

    // Events History
    const [events, setEvents] = useState<any[]>([]);
    const [eventFilterAttack, setEventFilterAttack] = useState<string>("ALL");
    const [eventFilterSeverity, setEventFilterSeverity] = useState<string>("ALL");
    const [eventSearch, setEventSearch] = useState<string>("");

    // Simulation Modal State
    const [simulationModalOpen, setSimulationModalOpen] = useState(false);
    const [activeSimulationData, setActiveSimulationData] = useState<ResponseSimulationData | null>(null);
    const [activeEventId, setActiveEventId] = useState<string>("");

    // Model Evaluation
    const [evaluationData, setEvaluationData] = useState<ModelEvaluationData | null>(null);

    // Auto Simulation Loop
    const [autoSimulate, setAutoSimulate] = useState(false);
    const [simulatingAttack, setSimulatingAttack] = useState(false);

    // Fetch initial security state
    const fetchSecurityState = async () => {
        try {
            const [dashRes, eventsRes, evalRes] = await Promise.allSettled([
                axios.get(`${SECURITY_API_BASE}/dashboard`),
                axios.get(`${SECURITY_API_BASE}/events`),
                axios.get(`${SECURITY_API_BASE}/evaluation`)
            ]);

            if (dashRes.status === "fulfilled" && dashRes.value.data) {
                const data = dashRes.value.data;
                setGlobalThreat(data.global_threat_level || "LOW");
                setMaxRisk(data.max_risk_score || 12);
                setDevices(data.devices || []);
                if (!selectedDevice && data.devices?.length > 0) {
                    setSelectedDevice(data.devices[1] || data.devices[0]);
                }
                setLatestTelemetry(data.latest_telemetry);
            }

            if (eventsRes.status === "fulfilled" && eventsRes.value.data) {
                setEvents(eventsRes.value.data || []);
                if (eventsRes.value.data.length > 0) {
                    const firstEvt = eventsRes.value.data[0];
                    setLatestPrediction({
                        attack_type: firstEvt.attack_type,
                        confidence: firstEvt.confidence,
                        anomaly_score: firstEvt.anomaly_score,
                        severity: firstEvt.severity
                    });
                    setXaiExplanation(firstEvt.xai_explanation);
                }
            }

            if (evalRes.status === "fulfilled" && evalRes.value.data) {
                setEvaluationData(evalRes.value.data);
            }
        } catch (err) {
            console.error("Failed to load security center data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSecurityState();
    }, []);

    // Auto Simulation Polling
    useEffect(() => {
        let interval: any = null;
        if (autoSimulate) {
            interval = setInterval(() => {
                const scenarios = ["NORMAL", "DDoS", "Brute Force", "Port Scanning", "Unknown Anomaly"];
                const targetDevs = ["DEV-101", "DEV-102", "DEV-103", "DEV-105"];
                const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
                const randomDev = targetDevs[Math.floor(Math.random() * targetDevs.length)];
                triggerAttackScenario(randomScenario, randomDev);
            }, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoSimulate]);

    // Trigger Attack Simulation
    const triggerAttackScenario = async (scenario: string, targetDevId: string = "DEV-102") => {
        setSimulatingAttack(true);
        try {
            const res = await axios.post(`${SECURITY_API_BASE}/telemetry/generate`, {
                attack_type: scenario,
                target_device_id: targetDevId
            });

            if (res.data && res.data.result) {
                const { telemetry, aiDetection, riskAssessment, xaiExplanation, responseSimulation, updatedDevice, eventRecord } = res.data.result;
                
                setLatestTelemetry(telemetry);
                setLatestPrediction({
                    attack_type: aiDetection.prediction,
                    confidence: aiDetection.confidence_score,
                    anomaly_score: aiDetection.anomaly_score,
                    severity: aiDetection.severity
                });
                setXaiExplanation(xaiExplanation);

                // Update device in list
                setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
                if (selectedDevice?.id === updatedDevice.id) {
                    setSelectedDevice(updatedDevice);
                }

                // Add to events list
                setEvents(prev => [eventRecord, ...prev]);

                // Recalculate global max risk
                const allRisks = devices.map(d => d.id === updatedDevice.id ? updatedDevice.risk_level : d.risk_level);
                const newMax = Math.max(...allRisks, riskAssessment.risk_score);
                setMaxRisk(newMax);
                if (newMax > 80) setGlobalThreat("CRITICAL");
                else if (newMax > 60) setGlobalThreat("HIGH");
                else if (newMax > 30) setGlobalThreat("ELEVATED");
                else setGlobalThreat("LOW");
            }
        } catch (err) {
            console.error("Error generating telemetry scenario:", err);
        } finally {
            setSimulatingAttack(false);
        }
    };

    // Trigger Simulation Modal for event
    const handleOpenSimulationModal = (event: any) => {
        if (event && event.response_simulation) {
            setActiveSimulationData(event.response_simulation);
            setActiveEventId(event.event_id);
            setSimulationModalOpen(true);
        }
    };

    // Execute Response Strategy from Modal
    const handleExecuteStrategy = async (eventId: string, strategyId: string) => {
        try {
            const res = await axios.post(`${SECURITY_API_BASE}/simulate-response`, {
                event_id: eventId,
                strategy_id: strategyId
            });

            if (res.data) {
                // Update events status
                setEvents(prev => prev.map(e => e.event_id === eventId ? { ...e, response_status: "EXECUTED" } : e));
                if (res.data.devices) {
                    setDevices(res.data.devices);
                    if (selectedDevice) {
                        const updatedSel = res.data.devices.find((d: any) => d.id === selectedDevice.id);
                        if (updatedSel) setSelectedDevice(updatedSel);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to execute response:", err);
        }
    };

    const getThreatBadge = (threat: string) => {
        switch (threat) {
            case "CRITICAL": return "bg-rose-500 text-rose-100 border-rose-400 animate-pulse";
            case "HIGH": return "bg-orange-500 text-orange-100 border-orange-400";
            case "ELEVATED": return "bg-amber-500 text-amber-100 border-amber-400";
            default: return "bg-emerald-500 text-emerald-100 border-emerald-400";
        }
    };

    const filteredEvents = events.filter(e => {
        const matchesAttack = eventFilterAttack === "ALL" || e.attack_type.toLowerCase() === eventFilterAttack.toLowerCase();
        const matchesSev = eventFilterSeverity === "ALL" || e.severity.toLowerCase() === eventFilterSeverity.toLowerCase();
        const q = eventSearch.toLowerCase().trim();
        const matchesQ = !q || e.attack_type.toLowerCase().includes(q) || e.affected_device_name.toLowerCase().includes(q) || e.source_ip.includes(q);
        return matchesAttack && matchesSev && matchesQ;
    });

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
            <Navbar />

            <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Shield className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                Research & Defense Framework
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                            AI Cyber <span className="text-gradient">Defense Center</span>
                        </h1>
                        <p className="text-muted-foreground max-w-2xl text-xs md:text-sm">
                            Real-Time Cyber Attack Detection, Digital Twin State Machine Synchronization, Explainable AI (XAI) & Closed-Loop Adaptive Mitigation Simulation.
                        </p>
                    </div>

                    {/* Threat Level Badge Card */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-1 shadow-lg">
                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">System Threat State</span>
                            <div className="flex items-center gap-2">
                                <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md", getThreatBadge(globalThreat))}>
                                    {globalThreat} RISK
                                </span>
                                <span className="text-sm font-black text-foreground font-mono">{maxRisk}/100</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setAutoSimulate(!autoSimulate)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shadow-lg",
                                autoSimulate
                                    ? "bg-rose-500 text-white border-rose-400 shadow-rose-500/20"
                                    : "bg-card text-foreground border-border/60 hover:bg-muted"
                            )}
                        >
                            <Activity className={cn("w-4 h-4", autoSimulate && "animate-spin")} />
                            {autoSimulate ? "Stop Auto Telemetry" : "Live Auto Telemetry"}
                        </button>
                    </div>
                </div>

                {/* Scenario Trigger Bar */}
                <div className="p-4 rounded-2xl glass-panel border border-border/40 bg-card/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">Inject Synthetic Scenario:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { label: "Normal Traffic", scenario: "NORMAL", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" },
                            { label: "DDoS Attack", scenario: "DDoS", color: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" },
                            { label: "Brute Force", scenario: "Brute Force", color: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" },
                            { label: "Port Scan", scenario: "Port Scanning", color: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" },
                            { label: "Unknown Anomaly", scenario: "Unknown Anomaly", color: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" }
                        ].map((btn) => (
                            <button
                                key={btn.scenario}
                                disabled={simulatingAttack}
                                onClick={() => triggerAttackScenario(btn.scenario, selectedDevice?.id || "DEV-102")}
                                className={cn("px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm disabled:opacity-50", btn.color)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Grid: Digital Twin Topology + Real-Time AI Detection Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Digital Twin Graph (7 Cols) */}
                    <div className="lg:col-span-7">
                        <DigitalTwinTopology
                            devices={devices}
                            selectedDevice={selectedDevice}
                            onSelectDevice={(d) => setSelectedDevice(d)}
                            onRefreshTwin={fetchSecurityState}
                        />
                    </div>

                    {/* AI Prediction & Telemetry Ticker (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Live AI Detection Banner Card */}
                        <div className="glass-panel p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1.5">
                                    <Cpu className="w-4 h-4" /> Real-Time ML Anomaly Detector
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">Inference: 3.2ms</span>
                            </div>

                            {latestPrediction && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-foreground">{latestPrediction.attack_type}</h3>
                                        <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase border",
                                            latestPrediction.severity === 'CRITICAL' ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" :
                                            latestPrediction.severity === 'HIGH' ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                                            latestPrediction.severity === 'MEDIUM' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        )}>
                                            {latestPrediction.severity} SEVERITY
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-center pt-2">
                                        <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
                                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase block">Confidence Score</span>
                                            <span className="text-lg font-black text-foreground">{latestPrediction.confidence}%</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
                                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase block">Anomaly Index</span>
                                            <span className="text-lg font-black text-primary">{latestPrediction.anomaly_score} / 1.0</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Telemetry Snapshot Data */}
                            {latestTelemetry && (
                                <div className="pt-3 border-t border-border/30 space-y-2 text-xs">
                                    <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                                        <span>Flow Target: {latestTelemetry.dest_ip}:{latestTelemetry.dest_port}</span>
                                        <span>Proto: {latestTelemetry.protocol}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-muted-foreground">
                                        <div className="p-2 rounded-lg bg-muted/30">Rate: {latestTelemetry.packet_rate} p/s</div>
                                        <div className="p-2 rounded-lg bg-muted/30">Conns: {latestTelemetry.num_connections}</div>
                                        <div className="p-2 rounded-lg bg-muted/30">Size: {latestTelemetry.packet_size}B</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Explainable AI Component */}
                        <XAIDeepDive
                            explanation={xaiExplanation}
                            attackType={latestPrediction?.attack_type || "DDoS"}
                            confidence={latestPrediction?.confidence || 96.4}
                            anomalyScore={latestPrediction?.anomaly_score || 0.88}
                        />
                    </div>
                </div>

                {/* Security Event Management Table */}
                <div className="glass-panel p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-2xl space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/30">
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                                Security Event History & Audit Ledger
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Filterable log of detected network threats, risk evaluations, and adaptive mitigations.
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={eventSearch}
                                    onChange={(e) => setEventSearch(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 bg-card border border-border/50 rounded-xl text-xs focus:outline-none focus:border-primary"
                                />
                            </div>

                            <select
                                value={eventFilterAttack}
                                onChange={(e) => setEventFilterAttack(e.target.value)}
                                className="px-3 py-1.5 bg-card border border-border/50 rounded-xl text-xs font-bold text-muted-foreground focus:outline-none"
                            >
                                <option value="ALL">All Attacks</option>
                                <option value="DDoS">DDoS</option>
                                <option value="DoS">DoS</option>
                                <option value="Brute Force">Brute Force</option>
                                <option value="Port Scanning">Port Scanning</option>
                                <option value="Unknown Anomaly">Unknown Anomaly</option>
                            </select>

                            <select
                                value={eventFilterSeverity}
                                onChange={(e) => setEventFilterSeverity(e.target.value)}
                                className="px-3 py-1.5 bg-card border border-border/50 rounded-xl text-xs font-bold text-muted-foreground focus:outline-none"
                            >
                                <option value="ALL">All Severities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl border border-border/40">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/60 uppercase tracking-wider text-[10px] font-black text-muted-foreground border-b border-border/40">
                                <tr>
                                    <th className="p-3.5">Timestamp</th>
                                    <th className="p-3.5">Attack Type</th>
                                    <th className="p-3.5">Source IP</th>
                                    <th className="p-3.5">Target Node</th>
                                    <th className="p-3.5">Severity</th>
                                    <th className="p-3.5">Risk</th>
                                    <th className="p-3.5">Recommended Response</th>
                                    <th className="p-3.5">Status</th>
                                    <th className="p-3.5 text-right">Simulation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 font-medium">
                                {filteredEvents.map((evt) => (
                                    <tr key={evt.event_id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3.5 font-mono text-[10px] text-muted-foreground">
                                            {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just Now'}
                                        </td>
                                        <td className="p-3.5 font-black text-foreground">{evt.attack_type}</td>
                                        <td className="p-3.5 font-mono text-muted-foreground">{evt.source_ip}</td>
                                        <td className="p-3.5 font-semibold text-foreground">{evt.affected_device_name}</td>
                                        <td className="p-3.5">
                                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                                                evt.severity === 'CRITICAL' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                evt.severity === 'HIGH' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            )}>
                                                {evt.severity}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-black text-foreground">{evt.risk_score}</td>
                                        <td className="p-3.5 text-muted-foreground max-w-[200px] truncate">{evt.recommended_response}</td>
                                        <td className="p-3.5">
                                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                                evt.response_status === 'EXECUTED' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                            )}>
                                                {evt.response_status}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <button
                                                onClick={() => handleOpenSimulationModal(evt)}
                                                className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-[10px] font-black uppercase tracking-wider transition-colors"
                                            >
                                                Simulate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Model Evaluation & Research Benchmarks */}
                <ModelEvaluationCard evaluation={evaluationData} />
            </main>

            {/* Response Simulator Modal */}
            {simulationModalOpen && activeSimulationData && (
                <ResponseSimulatorModal
                    simulationData={activeSimulationData}
                    eventId={activeEventId}
                    onExecuteStrategy={handleExecuteStrategy}
                    onClose={() => setSimulationModalOpen(false)}
                />
            )}
        </div>
    );
}
