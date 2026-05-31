import { motion } from "framer-motion";

export default function XDRMitreMatrix({ events = [] }) {

  // ============================================
  // MITRE TACTICS
  // ============================================
  const tactics = [
    {
      name: "Reconnaissance",
      key: "recon",
      color: "border-cyan-500/30 text-cyan-400",
    },
    {
      name: "Discovery",
      key: "scan",
      color: "border-yellow-500/30 text-yellow-400",
    },
    {
      name: "Credential Access",
      key: "brute",
      color: "border-orange-500/30 text-orange-400",
    },
    {
      name: "Impact",
      key: "flood",
      color: "border-red-500/30 text-red-400",
    },
    {
      name: "Execution",
      key: "malware",
      color: "border-purple-500/30 text-purple-400",
    },
  ];

  // ============================================
  // DETECT ACTIVE TACTICS
  // ============================================
  const isActive = (key) => {

    return events.some((event) => {

      const type =
        (
          event.event_type ||
          ""
        ).toLowerCase();

      return type.includes(key);
    });
  };

  return (

    <div className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6">

      {/* HEADER */}
      <div className="mb-6">

        <h2 className="text-2xl font-bold text-white">
          MITRE ATT&CK Matrix
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Tactical adversary behavior mapping
        </p>

      </div>

      {/* MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

        {tactics.map((tactic, index) => {

          const active =
            isActive(tactic.key);

          return (

            <motion.div
              key={index}
              whileHover={{
                scale: 1.03,
              }}
              className={`
                rounded-2xl
                border
                p-5
                transition-all
                duration-300
                ${tactic.color}
                ${
                  active
                    ? "bg-white/5 shadow-lg"
                    : "bg-[#111827]"
                }
              `}
            >

              {/* STATUS */}
              <div className="flex items-center justify-between mb-4">

                <span className="text-xs font-semibold">

                  MITRE

                </span>

                <div
                  className={`
                    w-3
                    h-3
                    rounded-full
                    ${
                      active
                        ? "bg-red-500 animate-pulse"
                        : "bg-gray-600"
                    }
                  `}
                />

              </div>

              {/* TITLE */}
              <h3 className="font-bold text-lg leading-tight">

                {tactic.name}

              </h3>

              {/* ACTIVE */}
              <p className="text-sm text-gray-400 mt-4">

                {
                  active
                    ? "Active threats detected"
                    : "No active detections"
                }

              </p>

            </motion.div>
          );
        })}

      </div>

    </div>
  );
}





