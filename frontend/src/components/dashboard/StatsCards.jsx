import { motion } from "framer-motion";

import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Activity,
} from "lucide-react";

export default function StatsCards({ events = [] }) {

  // ============================================
  // COUNTERS
  // ============================================
  const totalThreats = events.length;

  const highThreats = events.filter(
    (event) => event.severity === "HIGH"
  ).length;

  const mediumThreats = events.filter(
    (event) => event.severity === "MEDIUM"
  ).length;

  const lowThreats = events.filter(
    (event) =>
      event.severity === "LOW" ||
      !event.severity
  ).length;

  // ============================================
  // CARD DATA
  // ============================================
  const cards = [
    {
      title: "Total Threats",
      value: totalThreats,
      icon: Activity,
      color: "cyan",
    },
    {
      title: "High Severity",
      value: highThreats,
      icon: ShieldAlert,
      color: "red",
    },
    {
      title: "Medium Severity",
      value: mediumThreats,
      icon: AlertTriangle,
      color: "yellow",
    },
    {
      title: "Low Severity",
      value: lowThreats,
      icon: ShieldCheck,
      color: "green",
    },
  ];

  // ============================================
  // COLORS
  // ============================================
  const styles = {
    cyan: {
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      glow: "hover:shadow-cyan-500/20",
    },

    red: {
      border: "border-red-500/20",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      glow: "hover:shadow-red-500/20",
    },

    yellow: {
      border: "border-yellow-500/20",
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
      glow: "hover:shadow-yellow-500/20",
    },

    green: {
      border: "border-green-500/20",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
      glow: "hover:shadow-green-500/20",
    },
  };

  return (

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card, index) => {

        const Icon = card.icon;

        const style = styles[card.color];

        return (

          <motion.div
            key={index}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.1,
            }}
            whileHover={{
              scale: 1.03,
            }}
            className={`
              bg-[#0F172A]
              rounded-2xl
              border
              p-6
              shadow-lg
              transition-all
              duration-300
              ${style.border}
              ${style.glow}
            `}
          >

            {/* TOP */}
            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  {card.title}
                </p>

                <h1 className="text-4xl font-bold text-white mt-3">
                  {card.value}
                </h1>

              </div>

              <div
                className={`
                  w-14
                  h-14
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  ${style.iconBg}
                `}
              >

                <Icon
                  size={28}
                  className={style.iconColor}
                />

              </div>

            </div>

            {/* BOTTOM */}
            <div className="mt-6">

              <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">

                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${Math.min(
                      card.value * 5,
                      100
                    )}%`,
                  }}
                  transition={{
                    duration: 1,
                  }}
                  className={`
                    h-full
                    rounded-full
                    ${style.iconBg}
                  `}
                />

              </div>

            </div>

          </motion.div>
        );
      })}

    </div>
  );
}