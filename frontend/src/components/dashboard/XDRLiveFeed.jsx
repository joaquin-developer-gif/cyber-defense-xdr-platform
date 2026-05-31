import { motion } from "framer-motion";

import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Radio,
  Clock,
  Server,
  Target,
  Zap,
} from "lucide-react";

export default function XDRLiveFeed({ events = [] }) {
  // ============================================
  // NORMALIZE SEVERITY
  // ============================================
  function normalizeSeverity(severity) {
    return String(severity || "LOW").toUpperCase();
  }

  // ============================================
  // FORMAT TIME SAFELY
  // ============================================
  function formatTime(value) {
    if (!value) {
      return new Date().toLocaleTimeString();
    }

    const raw = String(value);

    // Si viene como HH:mm:ss, lo mostramos directo
    const onlyTimeRegex = /^\d{2}:\d{2}:\d{2}$/;

    if (onlyTimeRegex.test(raw)) {
      return raw;
    }

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleTimeString();
  }

  // ============================================
  // GET EVENT TIMESTAMP
  // ============================================
  function getEventDateValue(event) {
    const value = event.timestamp || event.time || event.created_at;

    if (!value) return 0;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 0;
    }

    return date.getTime();
  }

  // ============================================
  // EVENT COLORS
  // ============================================
  function getSeverityStyles(severity) {
    const sev = normalizeSeverity(severity);

    switch (sev) {
      case "CRITICAL":
        return {
          border: "border-red-600/40",
          bg: "bg-red-600/10",
          text: "text-red-300",
          badge: "bg-red-600/10 border-red-500/40 text-red-300",
          icon: <ShieldAlert size={18} />,
        };

      case "HIGH":
        return {
          border: "border-red-500/30",
          bg: "bg-red-500/10",
          text: "text-red-400",
          badge: "bg-red-500/10 border-red-500/30 text-red-400",
          icon: <ShieldAlert size={18} />,
        };

      case "MEDIUM":
        return {
          border: "border-yellow-500/30",
          bg: "bg-yellow-500/10",
          text: "text-yellow-400",
          badge: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
          icon: <AlertTriangle size={18} />,
        };

      default:
        return {
          border: "border-green-500/30",
          bg: "bg-green-500/10",
          text: "text-green-400",
          badge: "bg-green-500/10 border-green-500/30 text-green-400",
          icon: <ShieldCheck size={18} />,
        };
    }
  }

  // ============================================
  // GET EVENT VALUES
  // ============================================
  function getEventType(event) {
    return (
      event.event_type || event.alert_type || event.type || "UNKNOWN_EVENT"
    );
  }

  function getSourceIp(event) {
    return (
      event.source_ip || event.src_ip || event.ip || event.attacker_ip || "N/A"
    );
  }

  function getDestinationIp(event) {
    return event.destination_ip || event.dst_ip || event.target_ip || "N/A";
  }

  function getDescription(event) {
    return (
      event.description ||
      event.reason ||
      event.threat_type ||
      "No description available."
    );
  }

  function getThreatScore(event) {
    if (event.threat_score === undefined || event.threat_score === null) {
      return "N/A";
    }

    return event.threat_score;
  }

  // ============================================
  // PREPARE EVENTS
  // ============================================
  const feedEvents = Array.isArray(events)
    ? [...events]
        .sort((a, b) => getEventDateValue(b) - getEventDateValue(a))
        .slice(0, 30)
    : [];

  const totalEvents = feedEvents.length;

  const highEvents = feedEvents.filter((event) => {
    const severity = normalizeSeverity(event.severity);

    return severity === "HIGH" || severity === "CRITICAL";
  }).length;

  const mediumEvents = feedEvents.filter(
    (event) => normalizeSeverity(event.severity) === "MEDIUM",
  ).length;

  return (
    <div className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-5 h-[650px] overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Radio size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">LIVE Threat Feed</h2>

              <p className="text-sm text-gray-400 mt-1">
                Real-time XDR telemetry stream
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>

            <span className="text-green-400 text-sm font-semibold">LIVE</span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">
            {totalEvents} events
          </div>
        </div>
      </div>

      {/* MINI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-[#111827] border border-cyan-500/10 rounded-xl p-3">
          <p className="text-xs text-gray-500">TOTAL EVENTS</p>
          <p className="text-xl font-bold text-white mt-1">{totalEvents}</p>
        </div>

        <div className="bg-[#111827] border border-red-500/10 rounded-xl p-3">
          <p className="text-xs text-gray-500">HIGH / CRITICAL</p>
          <p className="text-xl font-bold text-red-400 mt-1">{highEvents}</p>
        </div>

        <div className="bg-[#111827] border border-yellow-500/10 rounded-xl p-3">
          <p className="text-xs text-gray-500">MEDIUM</p>
          <p className="text-xl font-bold text-yellow-400 mt-1">
            {mediumEvents}
          </p>
        </div>
      </div>

      {/* EVENTS */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {feedEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Activity className="text-slate-600 mb-3" size={44} />

            <h3 className="text-slate-300 font-semibold">
              No XDR events detected
            </h3>

            <p className="text-slate-500 text-sm mt-2 max-w-md">
              Cuando el sniffer detecte tráfico sospechoso, eventos ICMP, port
              scans, brute force o threat intelligence, aparecerán acá.
            </p>
          </div>
        ) : (
          feedEvents.map((event, index) => {
            const severity = normalizeSeverity(event.severity);
            const style = getSeverityStyles(severity);

            const eventType = getEventType(event);
            const sourceIp = getSourceIp(event);
            const destinationIp = getDestinationIp(event);
            const description = getDescription(event);
            const threatScore = getThreatScore(event);
            const time = formatTime(event.timestamp || event.time);

            return (
              <motion.div
                key={`${eventType}-${sourceIp}-${time}-${index}`}
                initial={{
                  opacity: 0,
                  x: 40,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
                whileHover={{
                  scale: 1.01,
                }}
                className={`
                  rounded-xl
                  border
                  p-4
                  ${style.border}
                  ${style.bg}
                  backdrop-blur-sm
                `}
              >
                {/* TOP */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={style.text}>{style.icon}</div>

                    <div>
                      <h3 className={`font-bold ${style.text}`}>{eventType}</h3>

                      <p className="text-xs text-gray-400 mt-1">
                        Severity: {severity}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        border
                        text-xs
                        font-semibold
                        ${style.badge}
                      `}
                    >
                      {severity}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={13} />
                      {time}
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm text-gray-300 mt-4 leading-relaxed">
                  {description}
                </p>

                {/* META */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#111827] rounded-lg p-3 border border-cyan-500/10">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Server size={13} />
                      SOURCE IP
                    </div>

                    <p className="text-sm text-cyan-400 mt-1 font-semibold font-mono">
                      {sourceIp}
                    </p>
                  </div>

                  <div className="bg-[#111827] rounded-lg p-3 border border-cyan-500/10">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Target size={13} />
                      DESTINATION
                    </div>

                    <p className="text-sm text-cyan-400 mt-1 font-semibold font-mono">
                      {destinationIp}
                    </p>
                  </div>

                  <div className="bg-[#111827] rounded-lg p-3 border border-cyan-500/10">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Zap size={13} />
                      THREAT SCORE
                    </div>

                    <p className="text-sm text-cyan-400 mt-1 font-semibold">
                      {threatScore}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
