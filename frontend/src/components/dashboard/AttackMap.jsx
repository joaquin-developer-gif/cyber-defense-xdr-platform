import { motion } from "framer-motion";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

// ============================================
// MOCK ATTACK DATA
// ============================================
const attacks = [
  {
    name: "Russia",
    coordinates: [37.6173, 55.7558],
    severity: "HIGH",
  },
  {
    name: "China",
    coordinates: [116.4074, 39.9042],
    severity: "MEDIUM",
  },
  {
    name: "USA",
    coordinates: [-74.006, 40.7128],
    severity: "LOW",
  },
  {
    name: "Germany",
    coordinates: [13.405, 52.52],
    severity: "HIGH",
  },
];

export default function AttackMap() {

  const getColor = (severity) => {

    switch (severity) {

      case "HIGH":
        return "#ef4444";

      case "MEDIUM":
        return "#f59e0b";

      default:
        return "#22c55e";
    }
  };

  return (

    <motion.div
      whileHover={{ scale: 1.005 }}
      className="bg-[#0F172A] rounded-2xl border border-cyan-500/20 p-6"
    >

      {/* HEADER */}
      <div className="mb-6">

        <h2 className="text-2xl font-bold text-white">
          Global Attack Map
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          Real-time geographic threat intelligence
        </p>

      </div>

      {/* MAP */}
      <div className="w-full h-[500px] bg-[#020617] rounded-xl overflow-hidden border border-cyan-500/10">

        <ComposableMap
          projectionConfig={{
            scale: 140,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >

          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">

            {({ geographies }) =>

              geographies.map((geo) => (

                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#111827"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: {
                      outline: "none",
                    },

                    hover: {
                      fill: "#1e293b",
                      outline: "none",
                    },

                    pressed: {
                      outline: "none",
                    },
                  }}
                />
              ))
            }

          </Geographies>

          {/* ATTACK MARKERS */}
          {attacks.map((attack, index) => (

            <Marker
              key={index}
              coordinates={attack.coordinates}
            >

              <motion.circle
                r={8}
                fill={getColor(attack.severity)}
                stroke="#fff"
                strokeWidth={2}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [1, 0.6, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />

            </Marker>
          ))}

        </ComposableMap>

      </div>

    </motion.div>
  );
}

