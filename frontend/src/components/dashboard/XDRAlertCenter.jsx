import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Activity,
  Server,
  Target,
} from "lucide-react";

import { blockIp } from "../../services/api";

const severityStyles = {
  CRITICAL: {
    badge: "bg-red-500/15 text-red-300 border-red-500/40",
    dot: "bg-red-400",
    glow: "shadow-red-500/20",
    border: "border-red-500/30",
  },
  HIGH: {
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    dot: "bg-orange-400",
    glow: "shadow-orange-500/20",
    border: "border-orange-500/30",
  },
  MEDIUM: {
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
    dot: "bg-yellow-400",
    glow: "shadow-yellow-500/20",
    border: "border-yellow-500/30",
  },
  LOW: {
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
    dot: "bg-cyan-400",
    glow: "shadow-cyan-500/20",
    border: "border-cyan-500/30",
  },
};

const statusStyles = {
  NEW: "bg-red-500/10 text-red-300 border-red-500/30",
  INVESTIGATING: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  RESOLVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  BLOCKED: "bg-purple-500/10 text-purple-300 border-purple-500/30",
};

function formatDate(value) {
  if (!value) return "Unknown time";

  const rawValue = String(value);

  let normalizedValue = rawValue;

  const timeOnlyRegex = /^\d{2}:\d{2}:\d{2}$/;

  if (timeOnlyRegex.test(rawValue)) {
    const today = new Date().toISOString().split("T")[0];
    normalizedValue = `${today}T${rawValue}`;
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return rawValue;
  }

  return parsedDate.toLocaleString();
}

function normalizeSeverity(severity) {
  const sev = String(severity || "LOW").toUpperCase();

  if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(sev)) {
    return sev;
  }

  return "LOW";
}

function getEventTitle(event) {
  const type = String(
    event.event_type ||
      event.alert_type ||
      event.type ||
      "UNKNOWN_EVENT"
  );

  return type
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toUpperCase();
}

function getSourceIp(event) {
  return (
    event.source_ip ||
    event.src_ip ||
    event.ip ||
    event.attacker_ip ||
    "N/A"
  );
}

function getDestinationIp(event) {
  return (
    event.destination_ip ||
    event.dst_ip ||
    event.target_ip ||
    "N/A"
  );
}

function buildAlertId(event, index) {
  return `${event.event_type || event.type || "event"}-${
    event.timestamp || event.time || index
  }-${event.description || index}`;
}

export default function XDRAlertCenter({ events = [] }) {
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [localStatuses, setLocalStatuses] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [blockingIds, setBlockingIds] = useState({});

  const alerts = useMemo(() => {
    return events.map((event, index) => {
      const id = buildAlertId(event, index);

      return {
        id,
        raw: event,
        title: getEventTitle(event),
        description: event.description || "No description available.",
        severity: normalizeSeverity(event.severity),
        sourceIp: getSourceIp(event),
        destinationIp: getDestinationIp(event),
        timestamp:
          event.timestamp ||
          event.time ||
          new Date().toISOString(),
        score: Number(event.threat_score || event.score || 0),
        status: localStatuses[id] || "NEW",
        country: event.country || "Unknown",
        isTor: Boolean(event.is_tor),
        threatIntel: Boolean(event.threat_intel),
      };
    });
  }, [events, localStatuses]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alertItem) => {
      const matchesSeverity =
        severityFilter === "ALL" ||
        alertItem.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        alertItem.status === statusFilter;

      const term = searchTerm.toLowerCase();

      const matchesSearch =
        alertItem.title.toLowerCase().includes(term) ||
        alertItem.description.toLowerCase().includes(term) ||
        alertItem.sourceIp.toLowerCase().includes(term) ||
        alertItem.destinationIp.toLowerCase().includes(term) ||
        alertItem.country.toLowerCase().includes(term);

      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [alerts, severityFilter, statusFilter, searchTerm]);

  const counters = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "CRITICAL").length,
      high: alerts.filter((a) => a.severity === "HIGH").length,
      investigating: alerts.filter((a) => a.status === "INVESTIGATING").length,
      blocked: alerts.filter((a) => a.status === "BLOCKED").length,
    };
  }, [alerts]);

  const updateStatus = (id, status) => {
    setLocalStatuses((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const handleBlockIp = async (alertItem) => {
    try {
      const ip = alertItem.sourceIp;

      if (!ip || ip === "N/A") {
        window.alert("No hay una IP válida para bloquear.");
        return false;
      }

      setBlockingIds((prev) => ({
        ...prev,
        [alertItem.id]: true,
      }));

      const result = await blockIp(
        ip,
        `Manual block from XDR Alert Center: ${alertItem.title}`
      );

      if (result.success) {
        updateStatus(alertItem.id, "BLOCKED");
        return true;
      }

      window.alert(result.message || "No se pudo bloquear la IP.");
      return false;
    } catch (error) {
      console.error("[BLOCK IP ERROR]", error);
      window.alert("No se pudo bloquear la IP. Revisá el backend.");
      return false;
    } finally {
      setBlockingIds((prev) => {
        const copy = { ...prev };
        delete copy[alertItem.id];
        return copy;
      });
    }
  };

  return (
    <div className="bg-[#0B1120] border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/5 overflow-hidden">
      <div className="p-5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-red-500/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                <ShieldAlert className="w-5 h-5 text-red-300" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  XDR Alert Center
                </h2>
                <p className="text-sm text-slate-400">
                  Central de alertas SOC en tiempo real
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            LIVE MONITORING
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="bg-slate-950/60 border border-slate-700/60 rounded-xl p-3">
            <p className="text-xs text-slate-400">Total Alerts</p>
            <p className="text-2xl font-bold text-white">{counters.total}</p>
          </div>

          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3">
            <p className="text-xs text-red-300">Critical</p>
            <p className="text-2xl font-bold text-red-300">
              {counters.critical}
            </p>
          </div>

          <div className="bg-orange-950/20 border border-orange-500/30 rounded-xl p-3">
            <p className="text-xs text-orange-300">High</p>
            <p className="text-2xl font-bold text-orange-300">
              {counters.high}
            </p>
          </div>

          <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-3">
            <p className="text-xs text-yellow-300">Investigating</p>
            <p className="text-2xl font-bold text-yellow-300">
              {counters.investigating}
            </p>
          </div>

          <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3">
            <p className="text-xs text-purple-300">Blocked</p>
            <p className="text-2xl font-bold text-purple-300">
              {counters.blocked}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por IP, ataque, país o descripción..."
              className="w-full bg-[#020617] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#020617] border border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#020617] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60"
            >
              <option value="ALL">All Status</option>
              <option value="NEW">New</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-h-[620px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">
              No hay alertas para mostrar
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Cuando el backend detecte eventos sospechosos aparecerán acá.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {filteredAlerts.map((alertItem) => {
                const sevStyle =
                  severityStyles[alertItem.severity] || severityStyles.LOW;

                const isBlocking = Boolean(blockingIds[alertItem.id]);
                const isBlocked = alertItem.status === "BLOCKED";

                return (
                  <motion.div
                    key={alertItem.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className={`rounded-2xl border ${sevStyle.border} bg-[#020617]/80 p-4 shadow-lg ${sevStyle.glow}`}
                  >
                    <div className="flex flex-col 2xl:flex-row 2xl:items-start 2xl:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${sevStyle.dot}`}
                          />

                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border ${sevStyle.badge}`}
                          >
                            {alertItem.severity}
                          </span>

                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border ${
                              statusStyles[alertItem.status]
                            }`}
                          >
                            {alertItem.status}
                          </span>

                          {alertItem.isTor && (
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-purple-500/10 text-purple-300 border-purple-500/30">
                              TOR
                            </span>
                          )}

                          {alertItem.threatIntel && (
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                              THREAT INTEL
                            </span>
                          )}
                        </div>

                        <h3 className="text-white font-semibold tracking-wide">
                          {alertItem.title}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {alertItem.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Server className="w-4 h-4 text-cyan-400" />
                            <span className="text-slate-500">Source:</span>
                            <span>{alertItem.sourceIp}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Target className="w-4 h-4 text-red-400" />
                            <span className="text-slate-500">Target:</span>
                            <span>{alertItem.destinationIp}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span>{formatDate(alertItem.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 min-w-[170px]">
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span>Threat Score</span>
                            <span>{alertItem.score}/100</span>
                          </div>

                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-cyan-400"
                              style={{
                                width: `${Math.min(alertItem.score, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedAlert(alertItem)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(alertItem.id, "INVESTIGATING")
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-xs text-yellow-300 border border-yellow-500/30 transition"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Investigate
                          </button>

                          <button
                            onClick={() => handleBlockIp(alertItem)}
                            disabled={isBlocking || isBlocked}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition ${
                              isBlocked
                                ? "bg-purple-500/20 text-purple-200 border-purple-500/40 cursor-not-allowed"
                                : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30"
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {isBlocking
                              ? "Blocking..."
                              : isBlocked
                              ? "Blocked"
                              : "Block IP"}
                          </button>

                          <button
                            onClick={() => updateStatus(alertItem.id, "RESOLVED")}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-300 border border-emerald-500/30 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              className="w-full max-w-2xl bg-[#0B1120] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedAlert.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Alert investigation details
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 mb-1">Severity</p>
                  <p className="text-white font-semibold">
                    {selectedAlert.severity}
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 mb-1">Status</p>
                  <p className="text-white font-semibold">
                    {selectedAlert.status}
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 mb-1">Source IP</p>
                  <p className="text-cyan-300 font-mono">
                    {selectedAlert.sourceIp}
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 mb-1">Destination IP</p>
                  <p className="text-red-300 font-mono">
                    {selectedAlert.destinationIp}
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 mb-1">Country</p>
                  <p className="text-white">{selectedAlert.country}</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 mb-1">Threat Score</p>
                  <p className="text-white font-semibold">
                    {selectedAlert.score}/100
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-500 mb-2">Description</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedAlert.description}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    updateStatus(selectedAlert.id, "INVESTIGATING");
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-sm"
                >
                  Mark Investigating
                </button>

                <button
                  onClick={async () => {
                    const success = await handleBlockIp(selectedAlert);

                    if (success) {
                      setSelectedAlert(null);
                    }
                  }}
                  disabled={
                    Boolean(blockingIds[selectedAlert.id]) ||
                    selectedAlert.status === "BLOCKED"
                  }
                  className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {blockingIds[selectedAlert.id]
                    ? "Blocking..."
                    : selectedAlert.status === "BLOCKED"
                    ? "Blocked"
                    : "Block IP"}
                </button>

                <button
                  onClick={() => {
                    updateStatus(selectedAlert.id, "RESOLVED");
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm"
                >
                  Resolve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}