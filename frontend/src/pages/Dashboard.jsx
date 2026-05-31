import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import StatsCards from "../components/dashboard/StatsCards";
import XDRCharts from "../components/dashboard/XDRCharts";
import XDRLiveFeed from "../components/dashboard/XDRLiveFeed";
import XDRTimeline from "../components/dashboard/XDRTimeline";

import XDRAlertCenter from "../components/dashboard/XDRAlertCenter";
import ThreatIntelPanel from "../components/dashboard/ThreatIntelPanel";
import XDRBlockedIPs from "../components/dashboard/XDRBlockedIPs";
import XDRMitreMatrix from "../components/dashboard/XDRMitreMatrix";
import XDRAttackMap from "../components/dashboard/XDRAttackMap";
import XDRAutoResponse from "../components/dashboard/XDRAutoResponse";
import XDRAIThreatScore from "../components/dashboard/XDRAIThreatScore";

import useWebSocket from "../hooks/useWebSocket";

import { getRealtimeStats } from "../services/api";

export default function Dashboard() {
  // ============================================
  // WEBSOCKET EVENTS
  // ============================================
  const { xdrEvents, connected } = useWebSocket();

  // ============================================
  // REALTIME TRAFFIC DATA FROM /stats
  // ============================================
  const [trafficData, setTrafficData] = useState(null);

  // ============================================
  // FETCH REALTIME STATS
  // ============================================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getRealtimeStats();

        setTrafficData(data);
      } catch (error) {
        console.error("[XDR STATS ERROR]", error);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 3000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // EXTRACT IP FROM DESCRIPTION
  // ============================================
  const extractIpFromText = (text = "") => {
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

    const match = text.match(ipRegex);

    return match ? match[0] : "N/A";
  };

  // ============================================
  // CALCULATE BASIC EVENT SCORE
  // ============================================
  const calculateThreatScore = (eventType, severity, description) => {
    let score = 20;

    const type = String(eventType || "").toLowerCase();
    const desc = String(description || "").toLowerCase();
    const sev = String(severity || "").toUpperCase();

    if (sev === "CRITICAL") score += 50;
    if (sev === "HIGH") score += 35;
    if (sev === "MEDIUM") score += 20;
    if (sev === "LOW") score += 5;

    if (type.includes("flood")) score += 20;
    if (type.includes("brute")) score += 20;
    if (type.includes("scan")) score += 15;
    if (type.includes("threat")) score += 15;
    if (type.includes("intel")) score += 15;
    if (type.includes("tor")) score += 20;

    if (desc.includes("malicious")) score += 20;
    if (desc.includes("suspicious")) score += 10;
    if (desc.includes("blocked")) score += 15;
    if (desc.includes("firewall")) score += 15;

    return Math.min(score, 100);
  };

  // ============================================
  // NORMALIZE EVENTS FOR FRONTEND COMPONENTS
  // ============================================
  const normalizeEvent = (event = {}) => {
    const eventType =
      event.event_type || event.alert_type || event.type || "UNKNOWN_EVENT";

    const description = event.description || "No event description available.";

    const severityUpper = String(event.severity || "LOW").toUpperCase();

    const sourceIp =
      event.source_ip ||
      event.src_ip ||
      event.ip ||
      extractIpFromText(description);

    const destinationIp = event.destination_ip || event.dst_ip || "N/A";

    const timestamp = event.timestamp || event.time || new Date().toISOString();

    const threatScore =
      event.threat_score ||
      calculateThreatScore(eventType, severityUpper, description);

    return {
      ...event,

      // Main fields used by dashboard components
      event_type: eventType,
      alert_type: eventType,
      type: eventType,

      severity: severityUpper,
      severity_level: severityUpper.toLowerCase(),

      source_ip: sourceIp,
      destination_ip: destinationIp,

      timestamp,
      time: timestamp,

      description,
      threat_score: threatScore,

      // Optional helpers for Threat Intel / Attack Map
      country: event.country || "Unknown",
      is_tor: event.is_tor || false,

      threat_intel:
        event.threat_intel ||
        eventType.toLowerCase().includes("threat_intel") ||
        eventType.toLowerCase().includes("intel"),
    };
  };

  // ============================================
  // MERGE WEBSOCKET EVENTS + /stats EVENTS
  // ============================================
  const allEvents = useMemo(() => {
    const websocketEvents = Array.isArray(xdrEvents)
      ? xdrEvents.map(normalizeEvent)
      : [];

    const statsEvents = Array.isArray(trafficData?.suspicious_events)
      ? trafficData.suspicious_events.map(normalizeEvent)
      : [];

    const merged = [...websocketEvents, ...statsEvents];

    // Remove duplicated events by type + time + description
    const uniqueEvents = [];
    const seen = new Set();

    merged.forEach((event) => {
      const key = `${event.event_type}-${event.time}-${event.description}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueEvents.push(event);
      }
    });

    return uniqueEvents.slice(0, 50);
  }, [xdrEvents, trafficData]);

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden">
      {/* ===================================== */}
      {/* SIDEBAR */}
      {/* ===================================== */}
      <div className="w-[260px] flex-shrink-0">
        <Sidebar />
      </div>

      {/* ===================================== */}
      {/* MAIN CONTENT */}
      {/* ===================================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <Header connected={connected} />

        {/* ===================================== */}
        {/* BODY */}
        {/* ===================================== */}
        <main
          id="dashboard-scroll-container"
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {/* ================================= */}
          {/* DASHBOARD STATS */}
          {/* ================================= */}
          <section id="dashboard" className="scroll-mt-24">
            <StatsCards events={allEvents} />
          </section>

          {/* ================================= */}
          {/* ALERT CENTER + THREAT INTEL */}
          {/* ================================= */}
          <section
            id="alerts"
            className="scroll-mt-24 grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            <div className="xl:col-span-2">
              <XDRAlertCenter events={allEvents} />
            </div>

            <div id="threat-intel" className="scroll-mt-24">
              <ThreatIntelPanel events={allEvents} />
            </div>
          </section>

          {/* ================================= */}
          {/* BLOCKED IPS */}
          {/* ================================= */}
          <section id="blocked-ips" className="scroll-mt-24">
            <XDRBlockedIPs />
          </section>

          {/* ================================= */}
          {/* CHARTS */}
          {/* ================================= */}
          <section id="charts" className="scroll-mt-24">
            <XDRCharts traffic={trafficData} />
          </section>

          {/* ================================= */}
          {/* LIVE THREAT FEED */}
          {/* ================================= */}
          <section id="threat-feed" className="scroll-mt-24">
            <XDRLiveFeed events={allEvents} />
          </section>

          {/* ================================= */}
          {/* THREAT TIMELINE */}
          {/* ================================= */}
          <section id="timeline" className="scroll-mt-24">
            <XDRTimeline events={allEvents} />
          </section>

          {/* ================================= */}
          {/* MITRE ATT&CK MATRIX */}
          {/* ================================= */}
          <section id="mitre" className="scroll-mt-24">
            <XDRMitreMatrix events={allEvents} />
          </section>

          {/* ================================= */}
          {/* GLOBAL ATTACK MAP */}
          {/* ================================= */}
          <section id="attack-map" className="scroll-mt-24">
            <XDRAttackMap events={allEvents} />
          </section>

          {/* ================================= */}
          {/* AUTO RESPONSE ENGINE */}
          {/* ================================= */}
          <section id="auto-response" className="scroll-mt-24">
            <XDRAutoResponse events={allEvents} />
          </section>

          {/* ================================= */}
          {/* AI THREAT SCORING */}
          {/* ================================= */}
          <section id="ai-threat-score" className="scroll-mt-24">
            <XDRAIThreatScore events={allEvents} />
          </section>
        </main>
      </div>
    </div>
  );
}
