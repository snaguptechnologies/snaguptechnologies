const express = require('express');
const router = express.Router();
const {
    digitalTwinDevices,
    securityEventsLog,
    telemetryHistory,
    processSecurityEvent,
    applyAdaptiveResponse,
    getModelEvaluationMetrics,
    generateTelemetry
} = require('../lib/securityEngine');

// Seed an initial event on server load if empty
if (securityEventsLog.length === 0) {
    processSecurityEvent("DDoS", "DEV-102");
    processSecurityEvent("Brute Force", "DEV-103");
    processSecurityEvent("NORMAL", "DEV-101");
}

/**
 * GET /api/security/dashboard
 * Summary telemetry, threat gauge, device state count
 */
router.get('/dashboard', (req, res) => {
    try {
        const totalDevices = digitalTwinDevices.length;
        const criticalDevices = digitalTwinDevices.filter(d => d.status === 'RED' || d.status === 'ORANGE').length;
        const yellowDevices = digitalTwinDevices.filter(d => d.status === 'YELLOW').length;
        const normalDevices = digitalTwinDevices.filter(d => d.status === 'GREEN').length;

        const maxRisk = Math.max(...digitalTwinDevices.map(d => d.risk_level), 0);
        let globalThreatLevel = "LOW";
        if (maxRisk > 30) globalThreatLevel = "ELEVATED";
        if (maxRisk > 60) globalThreatLevel = "HIGH";
        if (maxRisk > 80) globalThreatLevel = "CRITICAL";

        const recentEvents = securityEventsLog.slice(0, 10);
        const latestTelemetry = telemetryHistory[0] || generateTelemetry("NORMAL", "DEV-102");

        res.json({
            status: "ok",
            global_threat_level: globalThreatLevel,
            max_risk_score: maxRisk,
            device_summary: {
                total: totalDevices,
                normal: normalDevices,
                suspicious: yellowDevices,
                critical: criticalDevices,
                offline: 0
            },
            latest_telemetry: latestTelemetry,
            recent_events: recentEvents,
            devices: digitalTwinDevices
        });
    } catch (err) {
        console.error("Security dashboard error:", err);
        res.status(500).json({ error: "Failed to fetch security dashboard state" });
    }
});

/**
 * GET /api/security/devices
 * Digital Twin device list
 */
router.get('/devices', (req, res) => {
    res.json(digitalTwinDevices);
});

/**
 * GET /api/security/digital-twin
 * Full Digital Twin topology & telemetry
 */
router.get('/digital-twin', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        devices: digitalTwinDevices,
        telemetry: telemetryHistory.slice(0, 20)
    });
});

/**
 * GET /api/security/events
 * Security event logs with optional filtering
 */
router.get('/events', (req, res) => {
    const { attack_type, severity, status, device_id } = req.query;
    let events = [...securityEventsLog];

    if (attack_type && attack_type !== 'ALL') {
        events = events.filter(e => e.attack_type.toLowerCase() === attack_type.toLowerCase());
    }
    if (severity && severity !== 'ALL') {
        events = events.filter(e => e.severity.toLowerCase() === severity.toLowerCase());
    }
    if (status && status !== 'ALL') {
        events = events.filter(e => e.response_status.toLowerCase() === status.toLowerCase());
    }
    if (device_id) {
        events = events.filter(e => e.affected_device_id === device_id);
    }

    res.json(events);
});

/**
 * GET /api/security/events/:id
 */
router.get('/events/:id', (req, res) => {
    const event = securityEventsLog.find(e => e.event_id === req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
});

/**
 * POST /api/security/telemetry/generate
 * Trigger a new synthetic cyber attack simulation or normal flow
 */
router.post('/telemetry/generate', (req, res) => {
    const { attack_type = "DDoS", target_device_id = "DEV-102" } = req.body;
    try {
        const result = processSecurityEvent(attack_type, target_device_id);
        res.json({
            message: `Telemetry generated and analyzed for attack scenario: ${attack_type}`,
            result
        });
    } catch (err) {
        console.error("Telemetry generation error:", err);
        res.status(500).json({ error: "Failed to process security simulation" });
    }
});

/**
 * POST /api/security/simulate-response
 * Execute adaptive response strategy on an event
 */
router.post('/simulate-response', (req, res) => {
    const { event_id, strategy_id } = req.body;
    if (!event_id) return res.status(400).json({ error: "event_id is required" });

    try {
        const updatedEvent = applyAdaptiveResponse(event_id, strategy_id);
        if (!updatedEvent) return res.status(404).json({ error: "Event not found" });

        res.json({
            message: "Adaptive response executed successfully. Digital Twin state updated.",
            event: updatedEvent,
            devices: digitalTwinDevices
        });
    } catch (err) {
        console.error("Response execution error:", err);
        res.status(500).json({ error: "Failed to execute response simulation" });
    }
});

/**
 * GET /api/security/analytics
 * Security analytics charts data
 */
router.get('/analytics', (req, res) => {
    const categoryCounts = {};
    const severityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    securityEventsLog.forEach(e => {
        categoryCounts[e.attack_type] = (categoryCounts[e.attack_type] || 0) + 1;
        if (severityCounts[e.severity] !== undefined) {
            severityCounts[e.severity] += 1;
        }
    });

    const categoryDistribution = Object.keys(categoryCounts).map(cat => ({
        name: cat,
        count: categoryCounts[cat]
    }));

    const deviceRiskRanking = digitalTwinDevices.map(d => ({
        name: d.name,
        ip: d.ip_address,
        risk: d.risk_level,
        status: d.status
    })).sort((a, b) => b.risk - a.risk);

    res.json({
        total_events: securityEventsLog.length,
        category_distribution: categoryDistribution,
        severity_distribution: Object.keys(severityCounts).map(sev => ({ name: sev, count: severityCounts[sev] })),
        device_risk_ranking: deviceRiskRanking,
        traffic_trend: telemetryHistory.slice(0, 15).map((t, idx) => ({
            time: t.timestamp ? t.timestamp.substring(11, 19) : `T-${idx}`,
            packet_rate: t.packet_rate,
            connections: t.num_connections,
            cpu_load: t.cpu_load
        }))
    });
});

/**
 * GET /api/security/evaluation
 * Model evaluation metrics & comparative research results
 */
router.get('/evaluation', (req, res) => {
    res.json(getModelEvaluationMetrics());
});

module.exports = router;
