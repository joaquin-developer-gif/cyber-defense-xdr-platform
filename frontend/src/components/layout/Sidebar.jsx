import { useState } from "react";

import {
  Shield,
  Activity,
  Radar,
  Globe,
  Ban,
  AlertTriangle,
  Settings,
  Zap,
} from "lucide-react";

import { motion } from "framer-motion";

const menuItems = [
  {
    title: "Dashboard",
    icon: Shield,
    sectionId: "dashboard",
  },
  {
    title: "Threat Feed",
    icon: Activity,
    sectionId: "threat-feed",
  },
  {
    title: "Threat Intel",
    icon: Radar,
    sectionId: "threat-intel",
  },
  {
    title: "Attack Map",
    icon: Globe,
    sectionId: "attack-map",
  },
  {
    title: "Blocked IPs",
    icon: Ban,
    sectionId: "blocked-ips",
  },
  {
    title: "Alerts",
    icon: AlertTriangle,
    sectionId: "alerts",
  },
  {
    title: "Auto Response",
    icon: Zap,
    sectionId: "auto-response",
  },
  {
    title: "AI Threat Score",
    icon: Settings,
    sectionId: "ai-threat-score",
  },
];

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState("dashboard");

  // ============================================
  // SCROLL TO DASHBOARD SECTION
  // ============================================
  const scrollToSection = (sectionId) => {
    const container = document.getElementById("dashboard-scroll-container");
    const section = document.getElementById(sectionId);

    if (!container || !section) {
      console.warn(`[SIDEBAR] No se encontró la sección: ${sectionId}`);
      return;
    }

    const containerTop = container.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;

    const scrollPosition = sectionTop - containerTop + container.scrollTop - 24;

    container.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    });

    setActiveSection(sectionId);
  };

  return (
    <div className="w-[260px] h-screen bg-[#0B1120] border-r border-cyan-500/20 flex flex-col justify-between">
      {/* TOP */}
      <div>
        {/* LOGO */}
        <div className="p-6 border-b border-cyan-500/20">
          <motion.h1
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="text-2xl font-bold text-cyan-400 tracking-wider"
          >
            CYBER XDR
          </motion.h1>

          <p className="text-gray-400 text-sm mt-2">
            Defense Intelligence Platform
          </p>
        </div>

        {/* MENU */}
        <div className="p-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.sectionId;

            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                whileHover={{
                  scale: 1.03,
                  x: 5,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className={`
                  w-full
                  flex
                  items-center
                  gap-4
                  px-4
                  py-3
                  rounded-xl
                  border
                  transition-all
                  duration-300
                  text-left
                  ${
                    isActive
                      ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-400"
                      : "bg-[#111827] border-transparent text-gray-300 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-400"
                  }
                `}
              >
                <Icon size={20} />

                <span className="font-medium">{item.title}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM STATUS */}
      <div className="p-4 border-t border-cyan-500/20">
        <div className="bg-[#111827] rounded-xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>

            <div>
              <p className="text-sm text-gray-400">System Status</p>

              <p className="text-green-400 font-semibold">Operational</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500">XDR Engine v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
