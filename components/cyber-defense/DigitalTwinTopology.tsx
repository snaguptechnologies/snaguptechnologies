"use client";

import React, { useState } from "react";
import { Server, Cpu, HardDrive, Shield, Activity, Wifi, RefreshCw, AlertTriangle, CheckCircle, Smartphone, Laptop, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DigitalTwinDevice {
    id: string;
    name: string;
    type: "Router" | "Server" | "PC" | "IoT Device";
    ip_address: string;
    status: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "GRAY";
    cpu_utilization: number;
    memory_utilization: number;
    network_traffic: number; // kbps
    active_connections: number;
    criticality: number;
    services?: string[];
    risk_level: number; // 0 - 100
    anomaly_score?: number;
    last_sync_time: string;
}

interface TopologyProps {
    devices: DigitalTwinDevice[];
    selectedDevice: DigitalTwinDevice | null;
    onSelectDevice: (device: DigitalTwinDevice) => void;
    onRefreshTwin?: () => void;
}

export default function DigitalTwinTopology({
    devices,
    selectedDevice,
    onSelectDevice,
    onRefreshTwin
}: TopologyProps) {
    const [hoveredDev, setHoveredDev] = useState<string | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "GREEN": return "bg-emerald-500 text-emerald-500 border-emerald-500/30 shadow-emerald-500/20";
            case "YELLOW": return "bg-amber-500 text-amber-500 border-amber-500/30 shadow-amber-500/20";
            case "ORANGE": return "bg-orange-500 text-orange-500 border-orange-500/30 shadow-orange-500/20";
            case "RED": return "bg-rose-500 text-rose-500 border-rose-500/30 shadow-rose-500/20 animate-pulse";
            case "GRAY": return "bg-slate-500 text-slate-500 border-slate-500/30 shadow-slate-500/10";
            default: return "bg-emerald-500 text-emerald-500 border-emerald-500/30";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "GREEN": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
            case "YELLOW": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
            case "ORANGE": return "bg-orange-500/10 text-orange-400 border-orange-500/30";
            case "RED": return "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/30";
        }
    };

    const renderDeviceIcon = (type: string) => {
        switch (type) {
            case "Router": return <Shield className="w-6 h-6" />;
            case "Server": return <Server className="w-6 h-6" />;
            case "PC": return <Laptop className="w-6 h-6" />;
            case "IoT Device": return <Radio className="w-6 h-6" />;
            default: return <Cpu className="w-6 h-6" />;
        }
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-2xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/30">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            Digital Twin Network Topology
                        </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Real-time state synchronization across virtual network assets & micro-segment nodes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30">
                        <Activity className="w-3.5 h-3.5 text-primary animate-pulse" /> Live Telemetry Sync
                    </div>
                    {onRefreshTwin && (
                        <button
                            onClick={onRefreshTwin}
                            className="p-2 rounded-xl bg-card border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Force Sync State"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Network Topology Visual Graph */}
            <div className="relative min-h-[360px] rounded-2xl bg-slate-950/80 border border-border/40 p-6 overflow-hidden flex flex-col justify-between">
                {/* Background Grid Accent */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* Legend Bar */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Suspicious</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> High Risk</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Under Attack</span>
                    </div>
                    <span>Virtual Network: 192.168.1.0/24</span>
                </div>

                {/* Topology Canvas Layout */}
                <div className="relative z-10 my-8 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center">
                    {devices.map((device) => {
                        const isSelected = selectedDevice?.id === device.id;
                        const statusColors = getStatusColor(device.status);

                        return (
                            <div
                                key={device.id}
                                onClick={() => onSelectDevice(device)}
                                onMouseEnter={() => setHoveredDev(device.id)}
                                onMouseLeave={() => setHoveredDev(null)}
                                className={cn(
                                    "group relative cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center space-y-3 bg-slate-900/90 backdrop-blur-md hover:-translate-y-1.5",
                                    isSelected
                                        ? "border-primary ring-2 ring-primary/40 shadow-xl shadow-primary/20 scale-105"
                                        : "border-slate-800 hover:border-slate-700 shadow-md"
                                )}
                            >
                                {/* Node Status Badge */}
                                <div className="absolute -top-2 -right-2 z-20">
                                    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-md", getStatusBadge(device.status))}>
                                        {device.status}
                                    </span>
                                </div>

                                {/* Node Icon Circle */}
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                                    device.status === 'RED' ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse shadow-lg shadow-rose-500/20" :
                                    device.status === 'ORANGE' ? "bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/20" :
                                    device.status === 'YELLOW' ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-lg shadow-amber-500/20" :
                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                                )}>
                                    {renderDeviceIcon(device.type)}
                                </div>

                                {/* Device Metadata */}
                                <div className="w-full space-y-1">
                                    <p className="text-xs font-black text-slate-100 truncate">{device.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400">{device.ip_address}</p>
                                </div>

                                {/* Dynamic Telemetry Bar */}
                                <div className="w-full space-y-1 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                                        <span>Risk</span>
                                        <span className={cn(
                                            device.risk_level > 70 ? "text-rose-400 font-extrabold" :
                                            device.risk_level > 40 ? "text-amber-400" : "text-emerald-400"
                                        )}>
                                            {device.risk_level}/100
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-500 rounded-full",
                                                device.risk_level > 70 ? "bg-rose-500" :
                                                device.risk_level > 40 ? "bg-amber-500" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${Math.min(100, Math.max(5, device.risk_level))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Connection Status Footprint */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Active Twin Node Links: 6/6 Connected</span>
                    <span className="font-mono text-[10px]">Sync Interval: 1.2s | Protocol: Dynamic SSE / WebSockets</span>
                </div>
            </div>

            {/* Selected Device Telemetry Drawer */}
            {selectedDevice && (
                <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                {renderDeviceIcon(selectedDevice.type)}
                            </div>
                            <div>
                                <h4 className="text-base font-black text-foreground">{selectedDevice.name}</h4>
                                <p className="text-xs text-muted-foreground font-mono">{selectedDevice.id} • IP: {selectedDevice.ip_address} • Criticality Score: {selectedDevice.criticality}/10</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border", getStatusBadge(selectedDevice.status))}>
                                Status: {selectedDevice.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/30 space-y-1">
                            <p className="text-[10px] font-extrabold text-muted-foreground uppercase">CPU Utilization</p>
                            <p className="text-lg font-black text-foreground">{selectedDevice.cpu_utilization}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/30 space-y-1">
                            <p className="text-[10px] font-extrabold text-muted-foreground uppercase">Memory Load</p>
                            <p className="text-lg font-black text-foreground">{selectedDevice.memory_utilization}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/30 space-y-1">
                            <p className="text-[10px] font-extrabold text-muted-foreground uppercase">Network Traffic</p>
                            <p className="text-lg font-black text-foreground">{(selectedDevice.network_traffic / 1024).toFixed(2)} MB/s</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/30 space-y-1">
                            <p className="text-[10px] font-extrabold text-muted-foreground uppercase">Active Connections</p>
                            <p className="text-lg font-black text-foreground">{selectedDevice.active_connections}</p>
                        </div>
                    </div>

                    {selectedDevice.services && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mr-2">Active Services:</span>
                            {selectedDevice.services.map(s => (
                                <span key={s} className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-bold text-foreground border border-border/30">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
