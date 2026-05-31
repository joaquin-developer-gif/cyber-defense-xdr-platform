from collections import defaultdict
from datetime import datetime, timedelta

from app.response_engine.responder import auto_respond

ip_packet_count = defaultdict(list)
port_scan_attempts = defaultdict(set)


def detect_threat(src_ip, dst_port=None):

    alerts = []

    now = datetime.now()

    # =====================================================
    # FLOOD DETECTION
    # =====================================================

    ip_packet_count[src_ip].append(now)

    ip_packet_count[src_ip] = [
        t for t in ip_packet_count[src_ip]
        if now - t < timedelta(seconds=10)
    ]

    if len(ip_packet_count[src_ip]) > 50:

        alert = {
            "type": "FLOOD_DETECTED",
            "source_ip": src_ip,
            "severity": "HIGH",
            "message": f"Possible flood attack from {src_ip}"
        }

        alerts.append(alert)

        # AUTO RESPONSE
        auto_respond(
            src_ip,
            "FLOOD_ATTACK",
            "HIGH"
        )

    # =====================================================
    # PORT SCAN DETECTION
    # =====================================================

    if dst_port:

        port_scan_attempts[src_ip].add(dst_port)

        if len(port_scan_attempts[src_ip]) > 10:

            alert = {
                "type": "PORT_SCAN_DETECTED",
                "source_ip": src_ip,
                "severity": "MEDIUM",
                "message": f"Possible port scan from {src_ip}"
            }

            alerts.append(alert)

            # AUTO RESPONSE
            auto_respond(
                src_ip,
                "PORT_SCAN",
                "MEDIUM"
            )

    return alerts