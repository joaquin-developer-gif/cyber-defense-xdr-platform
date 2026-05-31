import os
import ipaddress
import requests

from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================
# Carga las API Keys desde el archivo .env
# =========================================================
load_dotenv()


ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")


# =========================================================
# LOCAL THREAT DATABASES
# =========================================================
# Blacklists locales básicas para detección rápida.
#
# En sistemas enterprise esto normalmente proviene de:
# - threat feeds
# - SIEM
# - CTI platforms
# - IOC databases
# =========================================================
BLACKLISTED_IPS = {

    "45.155.205.233": "Known malicious scanner",

    "185.220.101.1": "Tor exit node",
}


# =========================================================
# TOR EXIT NODES
# =========================================================
# Lista simple de nodos TOR conocidos.
#
# Luego se puede reemplazar por:
# - feeds automáticos
# - listas dinámicas
# - APIs TOR
# =========================================================
TOR_EXIT_NODES = {

    "185.220.101.1",

    "185.220.101.2",

    "185.220.101.3",
}


# =========================================================
# PRIVATE / INTERNAL IP DETECTION
# =========================================================
# Detecta:
# - privadas
# - loopback
# - multicast
#
# para evitar consultas innecesarias a APIs externas.
# =========================================================
def is_private_ip(ip: str) -> bool:

    try:

        ip_obj = ipaddress.ip_address(ip)

        return (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_multicast
        )

    except ValueError:

        return False


# =========================================================
# LOCAL BLACKLIST CHECK
# =========================================================
# Verificación rápida usando blacklist local.
# =========================================================
def check_local_blacklist(ip: str):

    if ip in BLACKLISTED_IPS:

        return {

            "detected": True,

            "source": "local blacklist",

            "reason": BLACKLISTED_IPS[ip],

            "risk": "HIGH",
        }

    return {

        "detected": False,

        "source": "local blacklist",

        "reason": "IP not found in local blacklist",

        "risk": "LOW",
    }


# =========================================================
# TOR DETECTION
# =========================================================
# Verifica si la IP pertenece a un TOR Exit Node.
# =========================================================
def check_tor(ip: str):

    if ip in TOR_EXIT_NODES:

        return {

            "detected": True,

            "source": "local tor list",

            "type": "TOR",

            "risk": "HIGH",
        }

    return {

        "detected": False,

        "source": "local tor list",

        "type": "TOR",

        "risk": "LOW",
    }


# =========================================================
# ABUSEIPDB INTEGRATION
# =========================================================
# Consulta reputación IP usando AbuseIPDB.
#
# Información obtenida:
# - abuse score
# - ISP
# - dominio
# - país
# - total reports
# - usage type
# =========================================================
def check_abuseipdb(ip: str):

    if not ABUSEIPDB_API_KEY:

        return {

            "enabled": False,

            "source": "AbuseIPDB",

            "error": "ABUSEIPDB_API_KEY not configured",
        }

    url = "https://api.abuseipdb.com/api/v2/check"

    headers = {

        "Accept": "application/json",

        "Key": ABUSEIPDB_API_KEY,
    }

    params = {

        "ipAddress": ip,

        "maxAgeInDays": 90,

        "verbose": True,
    }

    try:

        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json().get("data", {})

        score = data.get("abuseConfidenceScore", 0)

        # =================================================
        # RISK CLASSIFICATION
        # =================================================
        if score >= 75:

            risk = "HIGH"

        elif score >= 25:

            risk = "MEDIUM"

        else:

            risk = "LOW"

        return {

            "enabled": True,

            "source": "AbuseIPDB",

            "ip": data.get("ipAddress"),

            "abuse_confidence_score": score,

            "country": data.get("countryCode"),

            "usage_type": data.get("usageType"),

            "isp": data.get("isp"),

            "domain": data.get("domain"),

            "total_reports": data.get("totalReports"),

            "risk": risk,
        }

    except Exception as e:

        return {

            "enabled": True,

            "source": "AbuseIPDB",

            "error": str(e),
        }


# =========================================================
# VIRUSTOTAL INTEGRATION
# =========================================================
# Consulta reputación IP usando VirusTotal.
#
# Obtiene:
# - motores maliciosos
# - suspicious detections
# - ASN
# - propietario AS
# =========================================================
def check_virustotal(ip: str):

    if not VIRUSTOTAL_API_KEY:

        return {

            "enabled": False,

            "source": "VirusTotal",

            "error": "VIRUSTOTAL_API_KEY not configured",
        }

    url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"

    headers = {

        "x-apikey": VIRUSTOTAL_API_KEY,
    }

    try:

        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        data = response.json().get(
            "data",
            {}
        ).get(
            "attributes",
            {}
        )

        stats = data.get("last_analysis_stats", {})

        malicious = stats.get("malicious", 0)

        suspicious = stats.get("suspicious", 0)

        # =================================================
        # RISK CLASSIFICATION
        # =================================================
        if malicious > 0:

            risk = "HIGH"

        elif suspicious > 0:

            risk = "MEDIUM"

        else:

            risk = "LOW"

        return {

            "enabled": True,

            "source": "VirusTotal",

            "malicious": malicious,

            "suspicious": suspicious,

            "harmless": stats.get("harmless", 0),

            "undetected": stats.get("undetected", 0),

            "country": data.get("country"),

            "asn": data.get("asn"),

            "as_owner": data.get("as_owner"),

            "risk": risk,
        }

    except Exception as e:

        return {

            "enabled": True,

            "source": "VirusTotal",

            "error": str(e),
        }


# =========================================================
# GEOIP LOOKUP
# =========================================================
# Obtiene:
# - país
# - ciudad
# - ISP
# - ASN
# - coordenadas
# =========================================================
def geoip_lookup(ip: str):

    url = f"http://ip-api.com/json/{ip}"

    try:

        response = requests.get(url, timeout=10)

        data = response.json()

        if data.get("status") != "success":

            return {

                "source": "GeoIP",

                "error": data.get(
                    "message",
                    "GeoIP lookup failed"
                ),
            }

        return {

            "source": "GeoIP",

            "country": data.get("country"),

            "country_code": data.get("countryCode"),

            "region": data.get("regionName"),

            "city": data.get("city"),

            "lat": data.get("lat"),

            "lon": data.get("lon"),

            "isp": data.get("isp"),

            "org": data.get("org"),

            "as": data.get("as"),
        }

    except Exception as e:

        return {

            "source": "GeoIP",

            "error": str(e),
        }


# =========================================================
# FINAL RISK ENGINE
# =========================================================
# Calcula el riesgo final correlacionando:
# - blacklist
# - TOR
# - AbuseIPDB
# - VirusTotal
# =========================================================
def calculate_final_risk(results: dict):

    risks = []

    for value in results.values():

        if isinstance(value, dict):

            risk = value.get("risk")

            if risk:

                risks.append(risk)

    if "HIGH" in risks:

        return "HIGH"

    if "MEDIUM" in risks:

        return "MEDIUM"

    return "LOW"


# =========================================================
# MAIN THREAT INTELLIGENCE ANALYZER
# =========================================================
# Pipeline principal de Threat Intelligence.
#
# Flujo:
#
# IP
#  ↓
# blacklist
#  ↓
# TOR detection
#  ↓
# AbuseIPDB
#  ↓
# VirusTotal
#  ↓
# GeoIP
#  ↓
# risk engine
# =========================================================
def analyze_ip(ip: str):

    # =====================================================
    # IP VALIDATION
    # =====================================================
    try:

        ipaddress.ip_address(ip)

    except ValueError:

        return {

            "status": "error",

            "message": "Invalid IP address",

            "ip": ip,
        }

    # =====================================================
    # INTERNAL / PRIVATE IPS
    # =====================================================
    if is_private_ip(ip):

        return {

            "status": "analyzed",

            "ip": ip,

            "final_risk": "LOW",

            "reputation": "internal/private/multicast",

            "risk": "LOW",

            "message": (
                "Private, loopback or multicast IP "
                "ignored for online threat intelligence"
            ),
        }

    # =====================================================
    # THREAT INTELLIGENCE CORRELATION
    # =====================================================
    results = {

        "local_blacklist": check_local_blacklist(ip),

        "tor_detection": check_tor(ip),

        "abuseipdb": check_abuseipdb(ip),

        "virustotal": check_virustotal(ip),

        "geoip": geoip_lookup(ip),
    }

    # =====================================================
    # FINAL RISK CALCULATION
    # =====================================================
    final_risk = calculate_final_risk(results)

    # =====================================================
    # FINAL RESPONSE
    # =====================================================
    return {

        "status": "analyzed",

        "ip": ip,

        "final_risk": final_risk,

        "results": results,
    }