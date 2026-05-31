const API_BASE_URL = "http://127.0.0.1:8000";

// =======================================================
// NETWORK SCANNER
// =======================================================
export async function scanNetwork(target) {
  const response = await fetch(
    `${API_BASE_URL}/scan?target=${encodeURIComponent(target)}`,
  );

  if (!response.ok) {
    throw new Error("No se pudo conectar con el backend");
  }

  return await response.json();
}

// =======================================================
// PORT SCANNER
// =======================================================
export async function scanPorts(target) {
  const response = await fetch(
    `${API_BASE_URL}/ports?target=${encodeURIComponent(target)}`,
  );

  if (!response.ok) {
    throw new Error("No se pudieron escanear los puertos");
  }

  return await response.json();
}

// =======================================================
// PACKET STATS
// =======================================================
export async function getPacketStats() {
  const response = await fetch(`${API_BASE_URL}/packets/stats?count=5`);

  if (!response.ok) {
    throw new Error("Error obteniendo tráfico");
  }

  return await response.json();
}

// =======================================================
// THREAT INTELLIGENCE
// =======================================================
export async function checkThreatIntel(ip) {
  const response = await fetch(
    `${API_BASE_URL}/threat/ip?ip=${encodeURIComponent(ip)}`,
  );

  if (!response.ok) {
    throw new Error("Error consultando Threat Intelligence");
  }

  return await response.json();
}

// =======================================================
// REALTIME XDR STATS
// =======================================================
export async function getRealtimeStats() {
  const response = await fetch(`${API_BASE_URL}/stats`);

  if (!response.ok) {
    throw new Error("Error obteniendo métricas realtime");
  }

  return await response.json();
}

// =======================================================
// AUTO RESPONSE ENGINE - BLOCK IP
// =======================================================
export async function blockIp(
  ip,
  reason = "Manual block from XDR Alert Center",
) {
  const response = await fetch(`${API_BASE_URL}/response/block-ip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ip,
      reason,
    }),
  });

  if (!response.ok) {
    throw new Error("Error bloqueando IP");
  }

  return await response.json();
}

// =======================================================
// AUTO RESPONSE ENGINE - GET BLOCKED IPS
// =======================================================
export async function getBlockedIps() {
  const response = await fetch(`${API_BASE_URL}/response/blocked-ips`);

  if (!response.ok) {
    throw new Error("Error obteniendo IPs bloqueadas");
  }

  return await response.json();
}
// =======================================================
// AUTO RESPONSE ENGINE - UNBLOCK IP
// =======================================================
export async function unblockIp(
  ip,
  reason = "Manual unblock from XDR Blocked IPs",
) {
  const response = await fetch(`${API_BASE_URL}/response/unblock-ip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ip,
      reason,
    }),
  });

  if (!response.ok) {
    throw new Error("Error desbloqueando IP");
  }

  return await response.json();
}
// =======================================================
// AUTO RESPONSE ENGINE - GET RESPONSE EVENTS
// =======================================================
export async function getResponseEvents() {
  const response = await fetch(`${API_BASE_URL}/response/events`);

  if (!response.ok) {
    throw new Error("Error obteniendo eventos de respuesta");
  }

  return await response.json();
}
