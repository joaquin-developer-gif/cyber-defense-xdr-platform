from app.threat_intel.intel import analyze_ip
from app.core.event_bus import publish_event
from app.response_engine.responder import auto_respond

from scapy.all import IP, TCP, UDP, ICMP

from collections import defaultdict

import time
import ipaddress


# =========================================================
# GLOBAL PACKET STATISTICS
# =========================================================
packet_stats = {

    "total_packets": 0,

    "tcp_packets": 0,

    "udp_packets": 0,

    "icmp_packets": 0,

    "suspicious_events": [],

    "top_sources": defaultdict(int),
}


# =========================================================
# THREAT INTELLIGENCE CACHE
# =========================================================
analyzed_ips = {}

# =========================================================
# ALERT COOLDOWN
# Evita spam de alertas repetidas
# =========================================================
last_alert_time = {}

ALERT_COOLDOWN = 15

# =========================================================
# DETECTION COUNTERS
# =========================================================
syn_counter = defaultdict(int)

icmp_counter = defaultdict(int)

connection_counter = defaultdict(int)

scanned_ports = defaultdict(set)


# =========================================================
# PRIVATE IP VALIDATION
# =========================================================
def is_private_ip(ip):

    try:
        return ipaddress.ip_address(ip).is_private
    except:
        return False


# =========================================================
# ALERT ENGINE
# =========================================================
def add_alert(

    alert_type,
    severity,
    description,
    source_ip=None,
    destination_ip=None,
    metadata=None
):

    current_time = time.time()

    cooldown_key = f"{alert_type}:{source_ip}"

    # =====================================================
    # ANTI SPAM ALERTS
    # =====================================================
    if cooldown_key in last_alert_time:

        if current_time - last_alert_time[cooldown_key] < ALERT_COOLDOWN:
            return

    last_alert_time[cooldown_key] = current_time

    # =====================================================
    # ALERT OBJECT
    # =====================================================
    alert = {

        "time": time.strftime("%H:%M:%S"),

        "type": alert_type,

        "severity": severity,

        "description": description
    }

    packet_stats["suspicious_events"].append(alert)

    # =====================================================
    # XDR EVENT
    # =====================================================
    event = {

        "type": alert_type,

        "severity": severity,

        "source_ip": source_ip,

        "destination_ip": destination_ip,

        "description": description,

        "metadata": metadata
    }

    publish_event(event)

    # =====================================================
    # AUTO RESPONSE ENGINE
    # =====================================================
    if source_ip and not is_private_ip(source_ip):

        auto_respond(
            source_ip,
            alert_type,
            severity
        )

    # =====================================================
    # CONSOLE ALERT
    # =====================================================
    print("\n====================================")
    print("[SECURITY ALERT]")
    print(f"TYPE: {alert_type}")
    print(f"SEVERITY: {severity}")
    print(f"SOURCE: {source_ip}")
    print(f"DESCRIPTION: {description}")
    print("====================================\n")


# =========================================================
# THREAT INTELLIGENCE PROCESSOR
# =========================================================
def process_threat_intelligence(src_ip, dst_ip):

    # IGNORE PRIVATE IPS
    if is_private_ip(src_ip):
        return

    # CACHE
    if src_ip in analyzed_ips:
        return

    print(f"\n[THREAT INTEL] Analyzing IP: {src_ip}")

    try:

        intel_result = analyze_ip(src_ip)

        analyzed_ips[src_ip] = intel_result

        final_risk = intel_result.get(
            "final_risk",
            "LOW"
        )

        # =================================================
        # THREAT EVENT
        # =================================================
        event = {

            "type": "THREAT_INTELLIGENCE",

            "severity": final_risk,

            "source_ip": src_ip,

            "destination_ip": dst_ip,

            "description": (
                f"Threat Intelligence analysis for {src_ip}"
            ),

            "metadata": intel_result
        }

        publish_event(event)

        # =================================================
        # HIGH RISK ALERT
        # =================================================
        if final_risk in ["HIGH", "CRITICAL"]:

            add_alert(

                alert_type="THREAT_INTEL",

                severity=final_risk,

                description=(
                    f"Suspicious IP detected: {src_ip}"
                ),

                source_ip=src_ip,

                destination_ip=dst_ip,

                metadata=intel_result
            )

    except Exception as e:

        print("\n[THREAT INTEL ERROR]")
        print(str(e))


# =========================================================
# MAIN PACKET ANALYZER
# =========================================================
def analyze_packet(packet):

    packet_stats["total_packets"] += 1

    if not packet.haslayer(IP):
        return

    src_ip = packet[IP].src

    dst_ip = packet[IP].dst

    packet_stats["top_sources"][src_ip] += 1

    print("\n[PACKET DETECTED]")
    print(f"SRC: {src_ip}")
    print(f"DST: {dst_ip}")

    # =====================================================
    # NETWORK EVENT
    # =====================================================
    publish_event({

        "type": "NETWORK_PACKET",

        "severity": "LOW",

        "source_ip": src_ip,

        "destination_ip": dst_ip,

        "description": "Network packet captured",

        "metadata": {
            "summary": packet.summary()
        }
    })

    # =====================================================
    # THREAT INTELLIGENCE
    # =====================================================
    process_threat_intelligence(src_ip, dst_ip)

    # =====================================================
    # TCP ANALYSIS
    # =====================================================
    if packet.haslayer(TCP):

        packet_stats["tcp_packets"] += 1

        flags = packet[TCP].flags

        dst_port = packet[TCP].dport

        connection_counter[src_ip] += 1

        scanned_ports[src_ip].add(dst_port)

        # SYN TRACKING
        if flags == "S":

            syn_counter[src_ip] += 1

        # =================================================
        # PORT SCAN
        # =================================================
        if len(scanned_ports[src_ip]) >= 10:

            add_alert(

                alert_type="PORT_SCAN",

                severity="HIGH",

                description=(
                    f"{src_ip} scanned multiple ports"
                ),

                source_ip=src_ip,

                destination_ip=dst_ip,

                metadata={
                    "ports_scanned": list(scanned_ports[src_ip])
                }
            )

        # =================================================
        # SYN FLOOD
        # =================================================
        if syn_counter[src_ip] >= 15:

            add_alert(

                alert_type="SYN_FLOOD",

                severity="CRITICAL",

                description=(
                    f"SYN flood detected from {src_ip}"
                ),

                source_ip=src_ip,

                destination_ip=dst_ip,

                metadata={
                    "syn_count": syn_counter[src_ip]
                }
            )

        # =================================================
        # BRUTE FORCE
        # =================================================
        if connection_counter[src_ip] >= 20:

            add_alert(

                alert_type="BRUTE_FORCE",

                severity="HIGH",

                description=(
                    f"Multiple TCP connections from {src_ip}"
                ),

                source_ip=src_ip,

                destination_ip=dst_ip,

                metadata={
                    "connection_count":
                        connection_counter[src_ip]
                }
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

            alert_type="ICMP_ACTIVITY",

            severity="MEDIUM",

            description=(
                f"ICMP activity detected from {src_ip}"
            ),

            source_ip=src_ip,

            destination_ip=dst_ip,

            metadata={
                "icmp_count": icmp_counter[src_ip]
            }
        )

        # =================================================
        # ICMP FLOOD
        # =================================================
        if icmp_counter[src_ip] >= 10:

            add_alert(

                alert_type="ICMP_FLOOD",

                severity="HIGH",

                description=(
                    f"ICMP flood detected from {src_ip}"
                ),

                source_ip=src_ip,

                destination_ip=dst_ip,

                metadata={
                    "icmp_count": icmp_counter[src_ip]
                }
            )


# =========================================================
# IDS/XDR REPORT
# =========================================================
def get_packet_statistics():

    return {

        "total_packets": packet_stats["total_packets"],

        "tcp_packets": packet_stats["tcp_packets"],

        "udp_packets": packet_stats["udp_packets"],

        "icmp_packets": packet_stats["icmp_packets"],

        "top_sources": dict(packet_stats["top_sources"]),

        "suspicious_events": (
            packet_stats["suspicious_events"][-20:]
        )
    }