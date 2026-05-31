import { motion } from "framer-motion";

export default function XDRAttackMap({ events = [] }) {

  // ============================================
  // MOCK ATTACK DATA
  // ============================================
     const attacks = [
     {
       country: "USA",
       x: 22,
      y: 36,
      severity: "low",
     },
     {
      country: "Brazil",
      x: 39,
      y: 69,
      severity: "medium",
     },
     {
       country: "Russia",
      x: 79,
      y: 29,
      severity: "critical",
     },
      {
      country: "China",
     x: 88,
      y: 41,
      severity: "high",
     },
    ];

  // ============================================
  // COLORS
  // ============================================
  const getColor = (severity) => {

    switch (severity) {

      case "critical":
        return {
          dot: "bg-red-500",
          line: "#ef4444",
        };

      case "high":
        return {
          dot: "bg-orange-500",
          line: "#f97316",
        };

      case "medium":
        return {
          dot: "bg-yellow-500",
          line: "#eab308",
        };

      default:
        return {
          dot: "bg-cyan-400",
          line: "#22d3ee",
        };
    }
  };

  return (

    <div className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6 overflow-hidden">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}
      <div className="mb-6">

        <h2 className="text-2xl font-bold text-white">
          Global Attack Map
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Real-time global threat intelligence telemetry
        </p>

      </div>

      {/* ========================================= */}
      {/* MAP CONTAINER */}
      {/* ========================================= */}
      <div className="
        relative
        h-[550px]
        rounded-2xl
        overflow-hidden
        border
        border-cyan-500/10
        bg-[#020617]
      ">

        {/* ===================================== */}
        {/* GRID BACKGROUND */}
        {/* ===================================== */}
        <div className="absolute inset-0 opacity-10 z-0">

          <div className="
            w-full
            h-full
            bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)]
            bg-[size:50px_50px]
          " />

        </div>

        {/* ===================================== */}
        {/* TITLE */}
        {/* ===================================== */}
        <div className="
          absolute
          top-4
          left-4
          z-30
          text-cyan-400
          text-sm
          font-semibold
          tracking-wider
        ">

          XDR GLOBAL THREAT INTELLIGENCE

        </div>

        {/* ===================================== */}
        {/* WORLD MAP IMAGE */}
        {/* ===================================== */}
        <img
         src="/world-map.jpg"
         alt="World Map"
         className="
          absolute
          inset-0
          w-full
           h-full
              object-cover
             invert
             opacity-[0.18]
             mix-blend-screen
              contrast-125
              brightness-125
              pointer-events-none
                  z-10
                    "
                />

        {/* ===================================== */}
        {/* CENTRAL SERVER */}
        {/* ===================================== */}
        <div
            className="
             absolute
             -translate-x-1/2
             -translate-y-1/2
                 z-20
                "
                style={{
                 left: "53%",
                     top: "49%",
                     }}
                    >

          {/* GLOW */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0.2, 0.8],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
            }}
            className="
              absolute
              w-24
              h-24
              rounded-full
              bg-cyan-500
              blur-3xl
              -translate-x-1/2
              -translate-y-1/2
            "
          />

          {/* SERVER */}
          <div
            className="
              relative
              z-20
              w-6
              h-6
              rounded-full
              bg-cyan-400
              border-2
              border-white
              shadow-2xl
              shadow-cyan-400/50
            "
          />

        </div>

        {/* ===================================== */}
        {/* ATTACK LINES */}
        {/* ===================================== */}
        <svg
          className="absolute inset-0 w-full h-full z-20"
        >

          {attacks.map((attack, index) => {

            const color =
              getColor(attack.severity);

            return (

              <motion.line
                key={index}
                x1={`${attack.x}%`}
                y1={`${attack.y}%`}
                x2="53%"
                y2="49%"
                stroke={color.line}
                strokeWidth="2"
                strokeDasharray="6 6"
                initial={{
                  pathLength: 0,
                  opacity: 0,
                }}
                animate={{
                  pathLength: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 1.5,
                  delay: index * 0.3,
                }}
              />
            );
          })}

        </svg>

        {/* ===================================== */}
        {/* ATTACK POINTS */}
        {/* ===================================== */}
        {attacks.map((attack, index) => {

          const color =
            getColor(attack.severity);

          return (

            <motion.div
              key={index}
              initial={{
                scale: 0,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                delay: index * 0.2,
              }}
              className="absolute z-30"
              style={{
                left: `${attack.x}%`,
                top: `${attack.y}%`,
              }}
            >

              {/* PULSE */}
              <motion.div
                animate={{
                  scale: [1, 2.5, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}
                className={`
                  absolute
                  w-12
                  h-12
                  rounded-full
                  blur-2xl
                  -translate-x-1/2
                  -translate-y-1/2
                  ${color.dot}
                `}
              />

              {/* DOT */}
              <div
                className={`
                  relative
                  z-20
                  w-4
                  h-4
                  rounded-full
                  border-2
                  border-white
                  shadow-2xl
                  ${color.dot}
                `}
              />

              {/* LABEL */}
              <div className="mt-3 -ml-4">

                <p className="text-xs text-white font-bold">

                  {attack.country}

                </p>

                <p className="text-[10px] uppercase text-gray-400">

                  {attack.severity}

                </p>

              </div>

            </motion.div>
          );
        })}

      </div>

    </div>
  );
}