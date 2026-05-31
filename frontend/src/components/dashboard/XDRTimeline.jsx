import { motion } from "framer-motion";

import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

export default function XDRTimeline({ events = [] }) {

  // ============================================
  // SAFE TIME FORMATTER
  // ============================================
  const formatEventTime = (value) => {

    if (!value) return "N/A";

    // Si ya viene como HH:mm:ss desde el backend
    if (
      typeof value === "string" &&
      /^\d{2}:\d{2}:\d{2}$/.test(value)
    ) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // ============================================
  // STYLES
  // ============================================
  const getSeverityStyles = (severity) => {

    const normalizedSeverity =
      String(severity || "LOW").toUpperCase();

    switch (normalizedSeverity) {

      case "CRITICAL":
        return {
          dot: "bg-red-600",
          border: "border-red-500/40",
          text: "text-red-400",
          icon: <ShieldAlert size={18} />,
        };

      case "HIGH":
        return {
          dot: "bg-red-500",
          border: "border-red-500/30",
          text: "text-red-400",
          icon: <ShieldAlert size={18} />,
        };

      case "MEDIUM":
        return {
          dot: "bg-yellow-500",
          border: "border-yellow-500/30",
          text: "text-yellow-400",
          icon: <AlertTriangle size={18} />,
        };

      default:
        return {
          dot: "bg-green-500",
          border: "border-green-500/30",
          text: "text-green-400",
          icon: <ShieldCheck size={18} />,
        };
    }
  };

  return (

    <div className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-2xl font-bold text-white">
            Threat Timeline
          </h2>

          <p className="text-gray-400 mt-1 text-sm">
            Chronological security event analysis
          </p>

        </div>

        <div className="flex items-center gap-2">

          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />

          <span className="text-cyan-400 text-sm font-semibold">
            LIVE STREAM
          </span>

        </div>

      </div>

      {/* EVENTS */}
      <div className="relative">

        {/* TIMELINE LINE */}
        <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-cyan-500/20" />

        <div className="space-y-8">

          {events.length === 0 ? (

            <div className="text-gray-500">
              No timeline events available.
            </div>

          ) : (

            events.slice(0, 20).map((event, index) => {

              const style =
                getSeverityStyles(event.severity);

              return (

                <motion.div
                  key={`${event.event_type}-${event.time}-${index}`}
                  initial={{
                    opacity: 0,
                    x: -30,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay: index * 0.03,
                  }}
                  className="relative pl-10"
                >

                  {/* DOT */}
                  <div
                    className={`
                      absolute
                      left-0
                      top-1
                      w-6
                      h-6
                      rounded-full
                      border-4
                      border-[#0F172A]
                      ${style.dot}
                    `}
                  />

                  {/* EVENT CARD */}
                  <div
                    className={`
                      bg-[#111827]
                      border
                      rounded-xl
                      p-5
                      transition-all
                      hover:scale-[1.01]
                      ${style.border}
                    `}
                  >

                    {/* TOP */}
                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div className={style.text}>
                          {style.icon}
                        </div>

                        <div>

                          <h3 className={`font-bold ${style.text}`}>

                            {event.event_type ||
                              event.type ||
                              "Unknown Event"}

                          </h3>

                          <p className="text-xs text-gray-400 mt-1">

                            Severity:{" "}
                            {event.severity || "LOW"}

                          </p>

                        </div>

                      </div>

                      <span className="text-xs text-gray-500">

                        {formatEventTime(
                          event.timestamp || event.time
                        )}

                      </span>

                    </div>

                    {/* DESCRIPTION */}
                    <p className="text-gray-300 text-sm mt-4 leading-relaxed">

                      {event.description ||
                        "No event description available."}

                    </p>

                    {/* NETWORK DATA */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

                      <div className="bg-[#0F172A] border border-cyan-500/10 rounded-lg p-3">

                        <p className="text-xs text-gray-500">
                          SOURCE IP
                        </p>

                        <p className="text-cyan-400 text-sm font-semibold mt-1">

                          {event.source_ip || "N/A"}

                        </p>

                      </div>

                      <div className="bg-[#0F172A] border border-cyan-500/10 rounded-lg p-3">

                        <p className="text-xs text-gray-500">
                          DESTINATION IP
                        </p>

                        <p className="text-cyan-400 text-sm font-semibold mt-1">

                          {event.destination_ip || "N/A"}

                        </p>

                      </div>

                    </div>

                  </div>

                </motion.div>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
}