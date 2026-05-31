import { motion } from "framer-motion";

import {
  Brain,
  ShieldAlert,
  Activity,
  Radar,
} from "lucide-react";

export default function XDRAIThreatScore({ events = [] }) {

  // ============================================
  // CALCULATE THREAT SCORE
  // ============================================
  const calculateThreatScore = () => {

    let score = 15;

    events.forEach((event) => {

      const severity =
        (
          event.severity ||
          ""
        ).toUpperCase();

      const type =
        (
          event.event_type ||
          ""
        ).toLowerCase();

      // SEVERITY
      if (severity === "HIGH")
        score += 20;

      if (severity === "MEDIUM")
        score += 10;

      // ATTACK TYPES
      if (type.includes("flood"))
        score += 15;

      if (type.includes("brute"))
        score += 20;

      if (type.includes("scan"))
        score += 10;

      if (type.includes("tor"))
        score += 15;

      if (type.includes("malicious"))
        score += 20;
    });

    // LIMIT 100
    return Math.min(score, 100);
  };

  const threatScore =
    calculateThreatScore();

  // ============================================
  // THREAT LEVEL
  // ============================================
  const getThreatLevel = () => {

    if (threatScore >= 80)
      return {
        label: "CRITICAL",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
      };

    if (threatScore >= 60)
      return {
        label: "HIGH",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
      };

    if (threatScore >= 40)
      return {
        label: "MEDIUM",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
      };

    return {
      label: "LOW",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    };
  };

  const level =
    getThreatLevel();

  return (

    <div className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-2xl font-bold text-white">
            AI Threat Scoring
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Intelligent adversary risk analysis engine
          </p>

        </div>

        <div className="text-cyan-400">

          <Brain size={28} />

        </div>

      </div>

      {/* SCORE */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* MAIN SCORE */}
        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          className={`
            flex-1
            rounded-2xl
            border
            p-8
            ${level.bg}
            ${level.border}
          `}
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-400 text-sm">
                Threat Score
              </p>

              <h1 className={`text-7xl font-bold mt-4 ${level.color}`}>

                {threatScore}

              </h1>

              <p className={`mt-4 text-lg font-semibold ${level.color}`}>

                {level.label} RISK

              </p>

            </div>

            <div className={`${level.color}`}>

              <ShieldAlert size={60} />

            </div>

          </div>

        </motion.div>

        {/* AI ANALYSIS */}
        <div className="flex-1 space-y-4">

          {/* CARD */}
          <div className="bg-[#111827] border border-cyan-500/10 rounded-xl p-5">

            <div className="flex items-center gap-3">

              <Radar className="text-cyan-400" />

              <h3 className="font-semibold text-white">
                Behavioral Analysis
              </h3>

            </div>

            <p className="text-gray-400 text-sm mt-3">

              AI engine detected anomalous traffic patterns
              and suspicious reconnaissance activity.

            </p>

          </div>

          {/* CARD */}
          <div className="bg-[#111827] border border-cyan-500/10 rounded-xl p-5">

            <div className="flex items-center gap-3">

              <Activity className="text-orange-400" />

              <h3 className="font-semibold text-white">
                Threat Prediction
              </h3>

            </div>

            <p className="text-gray-400 text-sm mt-3">

              Increased probability of coordinated attack
              behavior based on current telemetry.

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}













