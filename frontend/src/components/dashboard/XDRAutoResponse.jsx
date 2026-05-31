import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  ShieldCheck,
  ShieldAlert,
  Ban,
  Unlock,
  XCircle,
  AlertTriangle,
  Activity,
  Clock,
  RefreshCw,
} from "lucide-react";

import { getResponseEvents } from "../../services/api";

export default function XDRAutoResponse({ events = [] }) {
  const [responseHistory, setResponseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // RESPONSE ACTIONS
  // ============================================
  const responseActionTypes = [
    "IP_BLOCKED",
    "IP_UNBLOCKED",
    "BLOCK_FAILED",
    "BLOCK_REJECTED",
    "BLOCK_REJECTED_PROTECTED_IP",
    "UNBLOCK_FAILED",
    "UNBLOCK_ERROR",
    "UNBLOCK_REJECTED",
    "NO_ACTION_MONITORING",
  ];

  // ============================================
  // LOAD RESPONSE EVENTS FROM BACKEND
  // ============================================
  async function loadResponseEvents() {
    try {
      setLoading(true);
      setError("");

      const data = await getResponseEvents();

      console.log("Response events:", data);

      if (Array.isArray(data)) {
        setResponseHistory(data);
      } else if (Array.isArray(data.events)) {
        setResponseHistory(data.events);
      } else if (Array.isArray(data.response_events)) {
        setResponseHistory(data.response_events);
      } else {
        setResponseHistory([]);
      }
    } catch (err) {
      console.error("Error loading response events:", err);
      setError("No se pudieron cargar las acciones de respuesta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResponseEvents();

    const interval = setInterval(loadResponseEvents, 5000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // FILTER LIVE RESPONSE EVENTS FROM WEBSOCKET
  // ============================================
  const liveResponses = useMemo(() => {
    return events.filter((event) => {
      const type = String(
        event.type || event.event_type || event.alert_type || "",
      ).toUpperCase();

      const action = String(event.action || "").toUpperCase();

      const description = String(event.description || "").toLowerCase();

      return (
        type.includes("XDR_RESPONSE") ||
        type.includes("RESPONSE") ||
        type.includes("FIREWALL") ||
        responseActionTypes.includes(action) ||
        description.includes("blocked") ||
        description.includes("unblocked") ||
        description.includes("firewall")
      );
    });
  }, [events]);

  // ============================================
  // MERGE BACKEND HISTORY + LIVE EVENTS
  // ============================================
  const responses = useMemo(() => {
    const merged = [...responseHistory, ...liveResponses];

    const unique = [];
    const seen = new Set();

    merged.forEach((event) => {
      const action = event.action || event.event_type || event.type || "";
      const ip = event.ip || event.source_ip || event.src_ip || "";
      const timestamp = event.timestamp || event.time || "";
      const reason = event.reason || event.description || "";

      const key = `${action}-${ip}-${timestamp}-${reason}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(event);
      }
    });

    return unique.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.time || 0).getTime();
      const dateB = new Date(b.timestamp || b.time || 0).getTime();

      return dateB - dateA;
    });
  }, [responseHistory, liveResponses]);

  // ============================================
  // STATS
  // ============================================
  const totalActions = responses.length;

  const blockedActions = responses.filter(
    (event) => String(event.action || "").toUpperCase() === "IP_BLOCKED",
  ).length;

  const unblockedActions = responses.filter(
    (event) => String(event.action || "").toUpperCase() === "IP_UNBLOCKED",
  ).length;

  const failedActions = responses.filter((event) => {
    const action = String(event.action || "").toUpperCase();

    return (
      action.includes("FAILED") ||
      action.includes("ERROR") ||
      action.includes("REJECTED")
    );
  }).length;

  // ============================================
  // HELPERS
  // ============================================
  function getIpValue(event) {
    return (
      event.ip || event.source_ip || event.src_ip || event.attacker_ip || "N/A"
    );
  }

  function getActionValue(event) {
    return event.action || event.event_type || event.type || "XDR_RESPONSE";
  }

  function getReasonValue(event) {
    return (
      event.reason ||
      event.description ||
      event.threat_type ||
      "No response reason available"
    );
  }

  function formatTime(value) {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function getIcon(action) {
    const upper = String(action || "").toUpperCase();

    if (upper.includes("UNBLOCK")) {
      return <Unlock size={18} />;
    }

    if (upper.includes("BLOCKED") || upper.includes("BLOCK")) {
      return <Ban size={18} />;
    }

    if (upper.includes("FAILED") || upper.includes("ERROR")) {
      return <XCircle size={18} />;
    }

    if (upper.includes("REJECTED")) {
      return <AlertTriangle size={18} />;
    }

    return <ShieldCheck size={18} />;
  }

  function getActionStyle(action) {
    const upper = String(action || "").toUpperCase();

    if (upper === "IP_BLOCKED") {
      return {
        badge: "bg-red-500/10 border-red-500/30 text-red-400",
        icon: "text-red-400",
        border: "border-red-500/20",
      };
    }

    if (upper === "IP_UNBLOCKED") {
      return {
        badge: "bg-green-500/10 border-green-500/30 text-green-400",
        icon: "text-green-400",
        border: "border-green-500/20",
      };
    }

    if (upper.includes("FAILED") || upper.includes("ERROR")) {
      return {
        badge: "bg-orange-500/10 border-orange-500/30 text-orange-400",
        icon: "text-orange-400",
        border: "border-orange-500/20",
      };
    }

    if (upper.includes("REJECTED")) {
      return {
        badge: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
        icon: "text-yellow-400",
        border: "border-yellow-500/20",
      };
    }

    return {
      badge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
      icon: "text-cyan-400",
      border: "border-cyan-500/20",
    };
  }

  return (
    <div className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Auto Response Engine
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Historial real de acciones tomadas por el motor XDR.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl">
            <Activity size={16} />
            Live Response Monitor
          </div>

          <button
            onClick={loadResponseEvents}
            disabled={loading}
            className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 px-4 py-2 rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111827] border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Total Actions</p>
            <ShieldCheck className="text-cyan-400" size={20} />
          </div>

          <h3 className="text-3xl font-bold text-white mt-2">{totalActions}</h3>
        </div>

        <div className="bg-[#111827] border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Blocked</p>
            <Ban className="text-red-400" size={20} />
          </div>

          <h3 className="text-3xl font-bold text-red-400 mt-2">
            {blockedActions}
          </h3>
        </div>

        <div className="bg-[#111827] border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Unblocked</p>
            <Unlock className="text-green-400" size={20} />
          </div>

          <h3 className="text-3xl font-bold text-green-400 mt-2">
            {unblockedActions}
          </h3>
        </div>

        <div className="bg-[#111827] border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Failed / Rejected</p>
            <ShieldAlert className="text-yellow-400" size={20} />
          </div>

          <h3 className="text-3xl font-bold text-yellow-400 mt-2">
            {failedActions}
          </h3>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && responses.length === 0 && (
        <div className="bg-[#111827] border border-slate-700 rounded-xl p-8 text-center">
          <ShieldCheck className="mx-auto text-slate-600 mb-3" size={42} />

          <h3 className="text-lg font-semibold text-slate-300">
            No hay acciones de respuesta todavía
          </h3>

          <p className="text-slate-500 mt-2">
            Cuando bloquees o desbloquees una IP, el evento aparecerá en este
            historial.
          </p>
        </div>
      )}

      {/* RESPONSE TIMELINE */}
      {responses.length > 0 && (
        <div className="space-y-4">
          {responses.slice(0, 20).map((response, index) => {
            const action = getActionValue(response);
            const ip = getIpValue(response);
            const reason = getReasonValue(response);
            const time = formatTime(response.timestamp || response.time);
            const severity = String(response.severity || "LOW").toUpperCase();
            const style = getActionStyle(action);

            return (
              <motion.div
                key={`${action}-${ip}-${time}-${index}`}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.03,
                }}
                className={`
                  bg-[#111827]
                  border
                  ${style.border}
                  rounded-xl
                  p-5
                  hover:border-cyan-400/30
                  transition-all
                `}
              >
                {/* TOP */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={style.icon}>{getIcon(action)}</div>

                    <div>
                      <h3 className="font-bold text-white">{action}</h3>

                      <p className="text-sm text-gray-400 mt-1 font-mono">
                        {ip}
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
                      {action}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                      {severity}
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <p className="text-gray-300 text-sm mt-4">{reason}</p>

                {/* FOOTER */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
                  <Clock size={14} />
                  {time}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
