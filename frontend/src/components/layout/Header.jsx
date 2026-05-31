import { motion } from "framer-motion";

import {
  ShieldCheck,
  Wifi,
  AlertTriangle,
  Clock3,
} from "lucide-react";

export default function Header({ connected }) {
  return (
    <div className="w-full h-[90px] bg-[#0F172A] border-b border-cyan-500/20 px-6 flex items-center justify-between">

      {/* LEFT */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white"
        >
          Cyber Defense XDR
        </motion.h1>

        <p className="text-gray-400 mt-1">
          Real-Time Threat Monitoring Platform
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* WEBSOCKET STATUS */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className={`
            bg-[#111827]
            border
            rounded-xl
            px-4
            py-3
            flex
            items-center
            gap-3
            ${
              connected
                ? "border-green-500/20"
                : "border-red-500/20"
            }
          `}
        >
          <Wifi
            className={
              connected
                ? "text-green-400"
                : "text-red-400"
            }
            size={20}
          />

          <div>
            <p className="text-xs text-gray-400">
              WebSocket
            </p>

            <p
              className={`
                text-sm
                font-semibold
                ${
                  connected
                    ? "text-green-400"
                    : "text-red-400"
                }
              `}
            >
              {connected
                ? "Connected"
                : "Disconnected"}
            </p>
          </div>
        </motion.div>

        {/* ACTIVE THREATS */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="bg-[#111827] border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <AlertTriangle
            className="text-red-400"
            size={20}
          />

          <div>
            <p className="text-xs text-gray-400">
              Active Threats
            </p>

            <p className="text-sm text-red-400 font-semibold">
              LIVE
            </p>
          </div>
        </motion.div>

        {/* BACKEND STATUS */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className={`
            bg-[#111827]
            border
            rounded-xl
            px-4
            py-3
            flex
            items-center
            gap-3
            ${
              connected
                ? "border-green-500/20"
                : "border-red-500/20"
            }
          `}
        >
          <ShieldCheck
            className={
              connected
                ? "text-green-400"
                : "text-red-400"
            }
            size={20}
          />

          <div>
            <p className="text-xs text-gray-400">
              Backend
            </p>

            <p
              className={`
                text-sm
                font-semibold
                ${
                  connected
                    ? "text-green-400"
                    : "text-red-400"
                }
              `}
            >
              {connected
                ? "Operational"
                : "Offline"}
            </p>
          </div>
        </motion.div>

        {/* TIME */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="bg-[#111827] border border-cyan-500/20 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <Clock3
            className="text-cyan-400"
            size={20}
          />

          <div>
            <p className="text-xs text-gray-400">
              Local Time
            </p>

            <p className="text-sm text-cyan-400 font-semibold">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}