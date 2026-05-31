import ipaddress
import subprocess
from datetime import datetime

from app.response_engine.firewall import block_ip
from app.core.event_bus import publish_event


# =========================================================
# IN-MEMORY BLOCKED IP REGISTRY
# =========================================================
# Guarda las IP bloqueadas durante la ejecución actual.
# Más adelante esto puede migrarse a SQLite, PostgreSQL o Firebase.
# =========================================================
blocked_ips = []


# =========================================================
# IN-MEMORY RESPONSE EVENT HISTORY
# =========================================================
# Guarda el historial de acciones tomadas por el XDR.
# Esto permite que el frontend consulte eventos aunque no hayan llegado
# por WebSocket en vivo.
# =========================================================
response_events = []


# =========================================================
# LAB CONFIGURATION
# =========================================================
# Permitimos bloquear SOLO esta IP privada para pruebas de laboratorio.
# No agregues el router/gateway acá.
# Tu máquina Windows de prueba:
# 192.168.1.18
# =========================================================
LAB_ALLOWED_PRIVATE_IPS = {
    "192.168.1.18",
}


# =========================================================
# RESPONSE EVENT HISTORY
# =========================================================
def register_response_event(event: dict):
    """
    Guarda eventos de respuesta del XDR en memoria
    y también los publica por WebSocket.
    """

    if "timestamp" not in event:
        event["timestamp"] = datetime.now().isoformat()

    response_events.insert(0, event)

    # Mantener solo los últimos 100 eventos
    del response_events[100:]

    publish_event(event)


def get_response_events():
    """
    Devuelve el historial de acciones tomadas por el XDR.
    """

    return {
        "total": len(response_events),
        "events": response_events,
    }


# =========================================================
# IP VALIDATION
# =========================================================
def is_valid_ip(ip: str) -> bool:
    """
    Valida que el texto recibido sea una IP válida.
    """

    try:
        ipaddress.ip_address(ip)
        return True

    except ValueError:
        return False


def is_safe_to_block(ip: str) -> bool:
    """
    Valida que la IP sea bloqueable.

    Evitamos bloquear:
    - localhost
    - IPs privadas internas
    - multicast
    - unspecified
    - link-local

    Pero permitimos bloquear IPs privadas específicas de laboratorio
    definidas en LAB_ALLOWED_PRIVATE_IPS.

    Esto evita bloquear accidentalmente:
    - router
    - gateway
    - localhost
    - red interna de WSL
    """

    try:
        parsed_ip = ipaddress.ip_address(ip)

        # =================================================
        # LAB EXCEPTION
        # =================================================
        # Permite bloquear únicamente las IPs privadas
        # declaradas explícitamente para laboratorio.
        # =================================================
        if ip in LAB_ALLOWED_PRIVATE_IPS:
            return True

        if parsed_ip.is_loopback:
            return False

        if parsed_ip.is_private:
            return False

        if parsed_ip.is_multicast:
            return False

        if parsed_ip.is_unspecified:
            return False

        if parsed_ip.is_link_local:
            return False

        return True

    except ValueError:
        return False


# =========================================================
# MANUAL / API RESPONSE - BLOCK IP
# =========================================================
def manual_block_ip(ip: str, reason: str = "Manual block from XDR Alert Center"):
    """
    Bloquea una IP desde el frontend o desde un endpoint de FastAPI.
    """

    if not is_safe_to_block(ip):
        event = {
            "type": "XDR_RESPONSE",
            "ip": ip,
            "threat_type": "MANUAL_BLOCK",
            "severity": "MEDIUM",
            "action": "BLOCK_REJECTED",
            "reason": "Invalid, private or protected IP",
            "timestamp": datetime.now().isoformat(),
        }

        register_response_event(event)

        return {
            "success": False,
            "message": f"IP not safe to block: {ip}",
            "event": event,
        }

    blocked = block_ip(ip)

    action_taken = "IP_BLOCKED" if blocked else "BLOCK_FAILED"

    event = {
        "type": "XDR_RESPONSE",
        "ip": ip,
        "threat_type": "MANUAL_BLOCK",
        "severity": "HIGH",
        "action": action_taken,
        "reason": reason,
        "timestamp": datetime.now().isoformat(),
    }

    if blocked:
        already_registered = any(item["ip"] == ip for item in blocked_ips)

        if not already_registered:
            blocked_ips.append(
                {
                    "ip": ip,
                    "reason": reason,
                    "blocked_at": datetime.now().isoformat(),
                    "status": "BLOCKED",
                }
            )

    register_response_event(event)

    return {
        "success": bool(blocked),
        "message": (
            f"IP blocked successfully: {ip}"
            if blocked
            else f"Failed to block IP: {ip}"
        ),
        "event": event,
    }


# =========================================================
# MANUAL / API RESPONSE - UNBLOCK IP
# =========================================================
def manual_unblock_ip(
    ip: str,
    reason: str = "Manual unblock from XDR Blocked IPs",
):
    """
    Desbloquea una IP desde el frontend o desde un endpoint de FastAPI.

    Hace:
    - elimina la regla DROP de iptables
    - elimina la IP del registro en memoria blocked_ips
    - publica evento XDR al frontend
    """

    if not is_valid_ip(ip):
        event = {
            "type": "XDR_RESPONSE",
            "ip": ip,
            "threat_type": "MANUAL_UNBLOCK",
            "severity": "LOW",
            "action": "UNBLOCK_REJECTED",
            "reason": "Invalid IP format",
            "timestamp": datetime.now().isoformat(),
        }

        register_response_event(event)

        return {
            "success": False,
            "message": f"Invalid IP format: {ip}",
            "event": event,
        }

    was_registered = any(item["ip"] == ip for item in blocked_ips)

    firewall_removed = False
    errors = []

    # =====================================================
    # TRY TO REMOVE IPTABLES RULES
    # =====================================================
    # Probamos con ip normal y con ip/32 porque iptables
    # puede registrar la regla de ambas formas según el sistema.
    # =====================================================
    delete_commands = [
        ["iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"],
        ["iptables", "-D", "INPUT", "-s", f"{ip}/32", "-j", "DROP"],
    ]

    for command in delete_commands:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode == 0:
            firewall_removed = True
        else:
            if result.stderr:
                errors.append(result.stderr.strip())

    # =====================================================
    # REMOVE FROM IN-MEMORY REGISTRY
    # =====================================================
    before_count = len(blocked_ips)

    blocked_ips[:] = [item for item in blocked_ips if item["ip"] != ip]

    removed_from_registry = len(blocked_ips) < before_count

    action_taken = (
        "IP_UNBLOCKED"
        if firewall_removed or removed_from_registry
        else "UNBLOCK_FAILED"
    )

    event = {
        "type": "XDR_RESPONSE",
        "ip": ip,
        "threat_type": "MANUAL_UNBLOCK",
        "severity": "LOW",
        "action": action_taken,
        "reason": reason,
        "firewall_removed": firewall_removed,
        "removed_from_registry": removed_from_registry,
        "was_registered": was_registered,
        "timestamp": datetime.now().isoformat(),
    }

    register_response_event(event)

    if firewall_removed or removed_from_registry:
        return {
            "success": True,
            "message": f"IP unblocked successfully: {ip}",
            "ip": ip,
            "firewall_removed": firewall_removed,
            "removed_from_registry": removed_from_registry,
            "event": event,
        }

    return {
        "success": False,
        "message": f"Failed to unblock IP or IP was not blocked: {ip}",
        "ip": ip,
        "errors": errors,
        "event": event,
    }


# =========================================================
# AUTO RESPONSE ENGINE
# =========================================================
def auto_respond(ip, threat_type, severity):
    """
    Respuesta automática ante amenazas detectadas.

    Si la severidad es CRITICAL, intenta bloquear la IP.
    Luego publica un evento XDR al frontend.
    """

    print(f"[AUTO RESPONSE] {ip} | {threat_type}")

    action_taken = "NO_ACTION_MONITORING"

    # ============================================
    # CRITICAL ONLY
    # ============================================
    if severity in ["CRITICAL"]:

        if is_safe_to_block(ip):
            blocked = block_ip(ip)

            if blocked:
                action_taken = "IP_BLOCKED"

                already_registered = any(item["ip"] == ip for item in blocked_ips)

                if not already_registered:
                    blocked_ips.append(
                        {
                            "ip": ip,
                            "reason": f"Automatic response: {threat_type}",
                            "blocked_at": datetime.now().isoformat(),
                            "status": "BLOCKED",
                        }
                    )
            else:
                action_taken = "BLOCK_FAILED"

        else:
            action_taken = "BLOCK_REJECTED_PROTECTED_IP"

    # ============================================
    # XDR EVENT
    # ============================================
    event = {
        "type": "XDR_RESPONSE",
        "ip": ip,
        "threat_type": threat_type,
        "severity": severity,
        "action": action_taken,
        "reason": f"Automatic response evaluation: {threat_type}",
        "timestamp": datetime.now().isoformat(),
    }

    register_response_event(event)

    return event


# =========================================================
# GET BLOCKED IPS
# =========================================================
def get_blocked_ips():
    """
    Devuelve las IPs bloqueadas durante la ejecución actual.
    """

    return {
        "total": len(blocked_ips),
        "blocked_ips": blocked_ips,
    }