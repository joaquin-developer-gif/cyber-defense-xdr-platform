export default function ThreatIntelPanel({ events }) {

  const latestThreat =
    events.find(
      (e) => e.threat_intel
    );

  return (

    <div className="bg-[#0f172a] rounded-2xl p-5 border border-[#1e293b] h-full">

      <h2 className="text-lg font-semibold mb-4">
        Threat Intelligence
      </h2>

      {latestThreat ? (

        <div className="space-y-4">

          <div>

            <p className="text-gray-400 text-sm">
              IP Address
            </p>

            <h3 className="text-xl font-bold">
              {latestThreat.source_ip}
            </h3>

          </div>

          <div>

            <p className="text-gray-400 text-sm">
              Reputation
            </p>

            <h3 className="text-red-400 font-semibold">
              MALICIOUS
            </h3>

          </div>

          <div>

            <p className="text-gray-400 text-sm">
              Threat Score
            </p>

            <h3 className="text-orange-400 font-bold">
              {latestThreat.threat_score || 95}/100
            </h3>

          </div>

          <div>

            <p className="text-gray-400 text-sm">
              Country
            </p>

            <h3>
              {latestThreat.country || "Unknown"}
            </h3>

          </div>

          <div>

            <p className="text-gray-400 text-sm">
              TOR Exit Node
            </p>

            <h3 className="text-cyan-400">
              {latestThreat.is_tor
                ? "YES"
                : "NO"}
            </h3>

          </div>

        </div>

      ) : (

        <div className="text-gray-400">

          Waiting for threat intelligence events...

        </div>
      )}

    </div>
  );
}