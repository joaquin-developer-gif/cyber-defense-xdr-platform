import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

import { motion } from "framer-motion";

export default function XDRCharts({ traffic }) {

  if (!traffic) return null;

  // ============================================
  // PROTOCOL DISTRIBUTION
  // ============================================
  const protocolData = [
    {
      name: "TCP",
      value: traffic.tcp_packets || 0,
    },
    {
      name: "UDP",
      value: traffic.udp_packets || 0,
    },
    {
      name: "ICMP",
      value: traffic.icmp_packets || 0,
    },
  ];

  // ============================================
  // TOP SOURCE IPS
  // ============================================
  const topSources = Object.entries(
    traffic.top_sources || {}
  ).map(([ip, count]) => ({
    ip,
    packets: count,
  }));

  // ============================================
  // MOCK TRAFFIC DATA
  // ============================================
  const trafficTimeline = [
    { time: "10:00", packets: 1200 },
    { time: "10:05", packets: 1800 },
    { time: "10:10", packets: 2600 },
    { time: "10:15", packets: 3200 },
    { time: "10:20", packets: 2800 },
    { time: "10:25", packets: 4200 },
    { time: "10:30", packets: 3900 },
  ];

  const COLORS = [
    "#06b6d4",
    "#00ff88",
    "#f59e0b",
  ];

  return (

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

      {/* ===================================== */}
      {/* NETWORK TRAFFIC */}
      {/* ===================================== */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6"
      >

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Network Traffic
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Real-time packet telemetry
          </p>

        </div>

        <div className="h-[300px]">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={trafficTimeline}>

              <defs>

                <linearGradient
                  id="trafficGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#06b6d4"
                    stopOpacity={0.8}
                  />

                  <stop
                    offset="95%"
                    stopColor="#06b6d4"
                    stopOpacity={0}
                  />

                </linearGradient>

              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
              />

              <YAxis stroke="#64748b" />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="packets"
                stroke="#06b6d4"
                fillOpacity={1}
                fill="url(#trafficGradient)"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </motion.div>

      {/* ===================================== */}
      {/* PROTOCOL PIE CHART */}
      {/* ===================================== */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6"
      >

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Protocol Distribution
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Traffic distribution by protocol
          </p>

        </div>

        <div className="h-[300px]">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={protocolData}
                dataKey="value"
                outerRadius={100}
                label
              >

                {protocolData.map((entry, index) => (

                  <Cell
                    key={index}
                    fill={
                      COLORS[index % COLORS.length]
                    }
                  />

                ))}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </motion.div>


    </div>
  );
}