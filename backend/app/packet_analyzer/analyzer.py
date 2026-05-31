from app.threat_intel.intel import analyze_ip

from scapy.all import sniff, IP, TCP, UDP, ICMP

from collections import defaultdict

import time


# =========================================================
# GLOBAL PACKET STATISTICS
# =========================================================
# Este diccionario mantiene métricas globales del tráfico
# capturado por el sniffer.
#
# Se usa como un mini "state manager" del IDS.
# =========================================================
packet_stats = {
    "total_packets": 0,
    "tcp_packets": 0,
    "udp_packets": 0,
    "icmp_packets": 0,

    # Lista de alertas generadas por el motor de detección
    "suspicious_events": [],

    # Contador de IPs origen más activas
    "top_sources": defaultdict(int),
}


# =========================================================
# THREAT INTELLIGENCE CACHE
# =========================================================
# Evita realizar múltiples consultas externas
# (AbuseIPDB / VirusTotal / GeoIP)
# para la misma IP.
#
# Esto:
# - mejora rendimiento
# - reduce consumo de APIs
# - evita rate limits
# =========================================================
analyzed_ips = {}


# =========================================================
# DETECTION COUNTERS
# =========================================================
# Contadores utilizados por el motor heurístico
# de detección de amenazas.
# =========================================================

# SYN packets por IP
syn_counter = defaultdict(int)

# ICMP packets por IP
icmp_counter = defaultdict(int)

# Conexiones TCP por IP
connection_counter = defaultdict(int)

# Puertos escaneados por IP
scanned_ports = defaultdict(set)


# =========================================================
# ALERT ENGINE
# =========================================================
# Genera y almacena alertas de seguridad.
#
# Cada alerta representa un posible comportamiento
# sospechoso detectado por el IDS.
# =========================================================
def add_alert(alert_type, severity, description):

    alert = {
        "time": time.strftime("%H:%M:%S"),
        "type": alert_type,
        "severity": severity,
        "description": description
    }

    packet_stats["suspicious_events"].append(alert)

    print("\n====================================")
    print("[SECURITY ALERT]")
    print(f"TYPE: {alert_type}")
    print(f"SEVERITY: {severity}")
    print(f"DESCRIPTION: {description}")
    print("====================================\n")


# =========================================================
# THREAT INTELLIGENCE PROCESSOR
# =========================================================
# Consulta automáticamente:
#
# - AbuseIPDB
# - VirusTotal
# - GeoIP
# - TOR Detection
#
# y calcula el riesgo asociado a una IP.
# =========================================================
def process_threat_intelligence(src_ip):

    # Evita re-analizar la misma IP
    if src_ip in analyzed_ips:
        return

    print(f"\n[THREAT INTEL] Analizando IP: {src_ip}")

    try:

        intel_result = analyze_ip(src_ip)

        # Guardamos resultado en cache
        analyzed_ips[src_ip] = intel_result

        final_risk = intel_result.get("final_risk", "LOW")

        # Solo alertamos MEDIUM/HIGH
        if final_risk in ["HIGH", "MEDIUM"]:

            alert = {
                "time": time.strftime("%H:%M:%S"),
                "type": "THREAT_INTEL",
                "severity": final_risk,
                "description": f"Suspicious IP detected: {src_ip}",
                "intel": intel_result
            }

            packet_stats["suspicious_events"].append(alert)

            print("\n====================================")
            print("[THREAT ALERT]")
            print(f"IP: {src_ip}")
            print(f"RISK: {final_risk}")
            print("====================================\n")

    except Exception as e:

        print("\n[THREAT INTEL ERROR]")
        print(str(e))


# =========================================================
# MAIN PACKET ANALYZER
# =========================================================
# Función principal del IDS.
#
# Se ejecuta automáticamente por cada paquete
# capturado por Scapy.
# =========================================================
def analyze_packet(packet):

    # =====================================================
    # GLOBAL PACKET COUNTER
    # =====================================================
    packet_stats["total_packets"] += 1

    # Ignorar paquetes sin capa IP
    if not packet.haslayer(IP):
        return

    # =====================================================
    # IP EXTRACTION
    # =====================================================
    src_ip = packet[IP].src
    dst_ip = packet[IP].dst

    # =====================================================
    # SOURCE TRACKING
    # =====================================================
    packet_stats["top_sources"][src_ip] += 1

    print("\n[PACKET DETECTED]")
    print(f"TIME: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"SRC IP: {src_ip}")
    print(f"DST IP: {dst_ip}")
    print(f"TOTAL PACKETS: {packet_stats['total_packets']}")

    # =====================================================
    # AUTOMATIC THREAT INTELLIGENCE
    # =====================================================
    process_threat_intelligence(src_ip)

    # =====================================================
    # TCP ANALYSIS
    # =====================================================
    if packet.haslayer(TCP):

        packet_stats["tcp_packets"] += 1

        flags = packet[TCP].flags
        dst_port = packet[TCP].dport

        connection_counter[src_ip] += 1
        scanned_ports[src_ip].add(dst_port)

        # =================================================
        # SYN FLOOD DETECTION
        # =================================================
        if flags == "S":
            syn_counter[src_ip] += 1

        # =================================================
        # PORT SCAN DETECTION
        # =================================================
        if len(scanned_ports[src_ip]) >= 10:

            add_alert(
                "Possible Port Scan",
                "HIGH",
                f"{src_ip} scanned multiple ports on {dst_ip}"
            )

        # =================================================
        # SYN FLOOD DETECTION
        # =================================================
        if syn_counter[src_ip] >= 15:

            add_alert(
                "Possible SYN Flood",
                "HIGH",
                f"Many SYN packets detected from {src_ip}"
            )

        # =================================================
        # BRUTE FORCE DETECTION
        # =================================================
        if connection_counter[src_ip] >= 20:

            add_alert(
                "Possible Brute Force",
                "HIGH",
                f"High number of TCP connections from {src_ip}"
            )

    # =====================================================
    # UDP ANALYSIS
    # =====================================================
    elif packet.haslayer(UDP):

        packet_stats["udp_packets"] += 1

    # =====================================================
    # ICMP ANALYSIS
    # =====================================================
    elif packet.haslayer(ICMP):

        packet_stats["icmp_packets"] += 1

        icmp_counter[src_ip] += 1

        add_alert(
            "ICMP Activity",
            "MEDIUM",
            f"Ping activity detected from {src_ip}"
        )

        # =================================================
        # ICMP FLOOD DETECTION
        # =================================================
        if icmp_counter[src_ip] >= 10:

            add_alert(
                "Possible ICMP Flood",
                "HIGH",
                f"Large amount of ICMP traffic from {src_ip}"
            )


# =========================================================
# SNIFFER ENGINE
# =========================================================
# Inicializa el packet sniffer.
#
# Utiliza:
# - Scapy
# - procesamiento en tiempo real
# - análisis heurístico
# - threat intelligence automática
# =========================================================
def start_sniffing(packet_count: int = 20):

    print("\n[*] Starting Cyber Defense Intelligence Sniffer...")

    # =====================================================
    # RESET GLOBAL STATS
    # =====================================================
    packet_stats["total_packets"] = 0
    packet_stats["tcp_packets"] = 0
    packet_stats["udp_packets"] = 0
    packet_stats["icmp_packets"] = 0
    packet_stats["suspicious_events"] = []

    packet_stats["top_sources"].clear()

    # =====================================================
    # RESET DETECTION COUNTERS
    # =====================================================
    syn_counter.clear()
    icmp_counter.clear()
    connection_counter.clear()
    scanned_ports.clear()

    # =====================================================
    # START REAL-TIME PACKET CAPTURE
    # =====================================================
    sniff(
        prn=analyze_packet,
        count=packet_count,
        timeout=10,
        store=False
    )

    print("\n[*] Packet capture finished.")

    # =====================================================
    # FINAL IDS REPORT
    # =====================================================
    return {

        "total_packets": packet_stats["total_packets"],

        "tcp_packets": packet_stats["tcp_packets"],

        "udp_packets": packet_stats["udp_packets"],

        "icmp_packets": packet_stats["icmp_packets"],

        "top_sources": dict(packet_stats["top_sources"]),

        # Últimas 15 alertas
        "suspicious_events": packet_stats["suspicious_events"][-15:]
    }