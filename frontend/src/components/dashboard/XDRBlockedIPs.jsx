import { useEffect, useState } from "react";
import {
  Ban,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Server,
  Copy,
  CheckCircle,
  Unlock,
  Loader2,
} from "lucide-react";

import { getBlockedIps, unblockIp } from "../../services/api";

export default function XDRBlockedIPs() {
  const [blockedIps, setBlockedIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIp, setCopiedIp] = useState("");
  const [unblockingIp, setUnblockingIp] = useState("");

  function normalizeBlockedIps(data) {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.blocked_ips)) {
      return data.blocked_ips;
    }

    if (Array.isArray(data.blockedIps)) {
      return data.blockedIps;
    }

    if (Array.isArray(data.ips)) {
      return data.ips;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  }

  async function loadBlockedIps() {
    try {
      setLoading(true);
      setError("");

      const data = await getBlockedIps();

      console.log("Blocked IPs response:", data);

      const ips = normalizeBlockedIps(data);

      setBlockedIps(ips);
    } catch (err) {
      console.error("Error loading blocked IPs:", err);
      setError("No se pudieron cargar las IPs bloqueadas");
    } finally {
      setLoading(false);
    }
  }

  async function copyIp(ip) {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIp(ip);

      setTimeout(() => {
        setCopiedIp("");
      }, 1500);
    } catch (err) {
      console.error("Error copiando IP:", err);
    }
  }
  async function handleUnblockIp(ip) {
    const confirmed = window.confirm(`¿Querés desbloquear la IP ${ip}?`);

    if (!confirmed) {
      return;
    }

    try {
      setUnblockingIp(ip);

      const result = await unblockIp(
        ip,
        "Manual unblock from XDR Blocked IPs screen",
      );

      console.log("Unblock IP response:", result);

      await loadBlockedIps();
    } catch (err) {
      console.error("Error desbloqueando IP:", err);
      alert("No se pudo desbloquear la IP");
    } finally {
      setUnblockingIp("");
    }
  }

  function getIpValue(item) {
    if (typeof item === "string") {
      return item;
    }

    return (
      item?.ip ||
      item?.address ||
      item?.blocked_ip ||
      item?.source_ip ||
      item?.attacker_ip ||
      "Unknown"
    );
  }

  function getReasonValue(item) {
    if (typeof item === "string") {
      return "Blocked by XDR Response Engine";
    }

    return (
      item?.reason ||
      item?.description ||
      item?.source ||
      "Blocked by XDR Response Engine"
    );
  }

  function getTimeValue(item) {
    if (typeof item === "string") {
      return "Active rule";
    }

    const rawTime =
      item?.blocked_at || item?.timestamp || item?.time || item?.created_at;

    if (!rawTime) {
      return "Active rule";
    }

    const date = new Date(rawTime);

    if (Number.isNaN(date.getTime())) {
      return rawTime;
    }

    return date.toLocaleString();
  }

  useEffect(() => {
    loadBlockedIps();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#020617] text-white p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <Ban className="text-red-400" size={30} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">Blocked IPs</h1>
              <p className="text-slate-400 mt-1">
                IPs bloqueadas por el XDR Auto Response Engine.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadBlockedIps}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 px-4 py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0B1120] border border-red-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-slate-400">Total Blocked</p>
            <Ban className="text-red-400" />
          </div>

          <h2 className="text-4xl font-bold mt-3">{blockedIps.length}</h2>

          <p className="text-sm text-slate-500 mt-2">
            IPs actualmente bloqueadas
          </p>
        </div>

        <div className="bg-[#0B1120] border border-green-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-slate-400">Firewall</p>
            <ShieldCheck className="text-green-400" />
          </div>

          <h2 className="text-2xl font-bold mt-3 text-green-400">Active</h2>

          <p className="text-sm text-slate-500 mt-2">
            Protección con iptables habilitada
          </p>
        </div>

        <div className="bg-[#0B1120] border border-yellow-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-slate-400">Response Engine</p>
            <AlertTriangle className="text-yellow-400" />
          </div>

          <h2 className="text-2xl font-bold mt-3 text-yellow-400">
            Monitoring
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Bloqueo manual y automático
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#0B1120] border border-cyan-500/20 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-cyan-500/20 flex items-center gap-3">
          <Server className="text-cyan-400" />
          <div>
            <h2 className="text-xl font-semibold">Blocked IP List</h2>
            <p className="text-sm text-slate-500">
              Lista obtenida desde el backend: /response/blocked-ips
            </p>
          </div>
        </div>

        {loading && (
          <div className="p-6 text-slate-400">Cargando IPs bloqueadas...</div>
        )}

        {error && !loading && (
          <div className="p-6">
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && blockedIps.length === 0 && (
          <div className="p-8 text-center">
            <Ban className="mx-auto text-slate-600 mb-3" size={42} />
            <h3 className="text-lg font-semibold text-slate-300">
              No hay IPs bloqueadas todavía
            </h3>
            <p className="text-slate-500 mt-2">
              Cuando bloquees una IP desde Alerts o desde el Auto Response
              Engine, aparecerá en esta lista.
            </p>
          </div>
        )}

        {!loading && !error && blockedIps.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-cyan-500/10 text-cyan-300">
                <tr>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Protection</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {blockedIps.map((item, index) => {
                  const ip = getIpValue(item);
                  const reason = getReasonValue(item);
                  const time = getTimeValue(item);

                  return (
                    <tr
                      key={`${ip}-${index}`}
                      className="border-t border-slate-800 hover:bg-cyan-500/5 transition"
                    >
                      <td className="p-4 font-mono text-red-300">{ip}</td>

                      <td className="p-4">
                        <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-sm">
                          Blocked
                        </span>
                      </td>

                      <td className="p-4 text-slate-400">{reason}</td>

                      <td className="p-4">
                        <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-sm">
                          iptables active
                        </span>
                      </td>

                      <td className="p-4 text-slate-500">{time}</td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyIp(ip)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg transition"
                          >
                            {copiedIp === ip ? (
                              <>
                                <CheckCircle
                                  size={16}
                                  className="text-green-400"
                                />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy size={16} />
                                Copy
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleUnblockIp(ip)}
                            disabled={unblockingIp === ip}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {unblockingIp === ip ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Unblocking
                              </>
                            ) : (
                              <>
                                <Unlock size={16} />
                                Unblock
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
