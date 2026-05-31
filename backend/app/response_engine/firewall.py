import subprocess


# =========================================================
# FIREWALL ENGINE - BLOCK IP
# =========================================================
def block_ip(ip: str) -> bool:
    """
    Bloquea una IP usando iptables.

    IMPORTANTE:
    El backend debe estar levantado con sudo.
    No usamos 'sudo' dentro del subprocess.
    """

    try:
        print(f"[FIREWALL] Checking existing rule for IP: {ip}")

        # Primero verificamos si la IP ya está bloqueada
        check_command = [
            "iptables",
            "-C",
            "INPUT",
            "-s",
            ip,
            "-j",
            "DROP",
        ]

        check_result = subprocess.run(
            check_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if check_result.returncode == 0:
            print(f"[FIREWALL] IP already blocked: {ip}")
            return True

        print(f"[FIREWALL] Blocking IP: {ip}")

        block_command = [
            "iptables",
            "-A",
            "INPUT",
            "-s",
            ip,
            "-j",
            "DROP",
        ]

        block_result = subprocess.run(
            block_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if block_result.returncode == 0:
            print(f"[FIREWALL] IP blocked successfully: {ip}")
            return True

        print("[FIREWALL ERROR]")
        print(block_result.stderr)

        return False

    except Exception as error:
        print(f"[FIREWALL EXCEPTION] {error}")
        return False


# =========================================================
# FIREWALL ENGINE - UNBLOCK IP
# =========================================================
def unblock_ip(ip: str) -> bool:
    """
    Elimina una regla DROP de iptables para desbloquear una IP.
    """

    try:
        print(f"[FIREWALL] Unblocking IP: {ip}")

        unblock_command = [
            "iptables",
            "-D",
            "INPUT",
            "-s",
            ip,
            "-j",
            "DROP",
        ]

        result = subprocess.run(
            unblock_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if result.returncode == 0:
            print(f"[FIREWALL] IP unblocked successfully: {ip}")
            return True

        print("[FIREWALL ERROR]")
        print(result.stderr)

        return False

    except Exception as error:
        print(f"[FIREWALL EXCEPTION] {error}")
        return False


# =========================================================
# FIREWALL ENGINE - LIST RULES
# =========================================================
def list_firewall_rules():
    """
    Muestra las reglas actuales de INPUT.
    Sirve para debug.
    """

    try:
        result = subprocess.run(
            [
                "iptables",
                "-L",
                "INPUT",
                "-n",
                "--line-numbers",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if result.returncode == 0:
            return {
                "success": True,
                "rules": result.stdout,
            }

        return {
            "success": False,
            "error": result.stderr,
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error),
        }