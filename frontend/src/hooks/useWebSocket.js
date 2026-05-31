import { useEffect, useState } from "react";

export default function useWebSocket() {
  // =====================================================
  // STATES
  // =====================================================
  const [xdrEvents, setXdrEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  // =====================================================
  // EXTRACT IP FROM TEXT
  // =====================================================
  const extractIpFromText = (text = "") => {
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
    const match = text.match(ipRegex);

    return match ? match[0] : "N/A";
  };

  // =====================================================
  // CALCULATE EVENT SCORE
  // =====================================================
  const calculateEventScore = (
    eventType,
    severity,
    description
  ) => {
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

  // =====================================================
  // NORMALIZE EVENT
  // =====================================================
  const normalizeEvent = (event = {}) => {
    const eventType =
      event.event_type ||
      event.alert_type ||
      event.type ||
      "UNKNOWN_EVENT";

    const description =
      event.description ||
      "No event description available.";

    const severity =
      String(event.severity || "LOW").toUpperCase();

    const sourceIp =
      event.source_ip ||
      event.src_ip ||
      event.ip ||
      extractIpFromText(description);

    const destinationIp =
      event.destination_ip ||
      event.dst_ip ||
      "N/A";

    const timestamp =
      event.timestamp ||
      event.time ||
      new Date().toISOString();

    const threatScore =
      event.threat_score ||
      calculateEventScore(
        eventType,
        severity,
        description
      );

    return {
      ...event,

      event_type: eventType,
      alert_type: eventType,
      type: eventType,

      severity,
      severity_level: severity.toLowerCase(),

      source_ip: sourceIp,
      destination_ip: destinationIp,

      timestamp,
      time: timestamp,

      description,
      threat_score: threatScore,

      country: event.country || "Unknown",
      is_tor: event.is_tor || false,

      threat_intel:
        event.threat_intel ||
        eventType.toLowerCase().includes("threat_intel") ||
        eventType.toLowerCase().includes("intel"),
    };
  };

  // =====================================================
  // WEBSOCKET CONNECTION
  // =====================================================
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws");

    let keepAliveInterval = null;

    // ==========================================
    // CONNECTED
    // ==========================================
    socket.onopen = () => {
      console.log("[XDR] WebSocket Connected");

      setConnected(true);

      keepAliveInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send("ping");
        }
      }, 30000);
    };

    // ==========================================
    // RECEIVE EVENTS
    // ==========================================
    socket.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);

        console.log("[XDR RAW EVENT]", data);

        // If backend sends array of events
        if (Array.isArray(data)) {
          const normalizedEvents =
            data.map(normalizeEvent);

          console.log(
            "[XDR NORMALIZED EVENTS]",
            normalizedEvents
          );

          setXdrEvents((prev) => [
            ...normalizedEvents,
            ...prev,
          ].slice(0, 50));

          return;
        }

        // If backend sends one event
        const normalizedEvent =
          normalizeEvent(data);

        console.log(
          "[XDR NORMALIZED EVENT]",
          normalizedEvent
        );

        setXdrEvents((prev) => [
          normalizedEvent,
          ...prev.slice(0, 49),
        ]);

      } catch (error) {
        console.error(
          "[XDR PARSE ERROR]",
          error
        );
      }
    };

    // ==========================================
    // ERROR
    // ==========================================
    socket.onerror = (error) => {
      console.error(
        "[XDR SOCKET ERROR]",
        error
      );
    };

    // ==========================================
    // DISCONNECTED
    // ==========================================
    socket.onclose = () => {
      console.log(
        "[XDR] WebSocket Disconnected"
      );

      setConnected(false);
    };

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }

      socket.close();
    };
  }, []);

  // =====================================================
  // RETURN
  // =====================================================
  return {
    xdrEvents,
    connected,
  };
}