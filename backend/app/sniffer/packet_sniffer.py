from scapy.all import sniff

from app.sniffer.detection_engine import (
    analyze_packet
)


# =========================================================
# MAIN PACKET PROCESSOR
# =========================================================
# Wrapper principal del sniffer.
#
# Cada paquete capturado por Scapy pasa por:
#
# packet
#   ↓
# analyze_packet()
#
# donde se ejecuta:
# - detección heurística
# - threat intelligence
# - alertas
# - estadísticas
# =========================================================
def process_packet(packet):

    analyze_packet(packet)


# =========================================================
# REAL-TIME PACKET SNIFFER
# =========================================================
# Inicializa el motor de captura de paquetes.
#
# Utiliza:
# - Scapy
# - captura en tiempo real
# - procesamiento live
#
# Este componente funciona como:
# - sensor IDS
# - network monitor
# - traffic collector
# =========================================================
def start_sniffer():

    print("\n====================================")
    print("[*] Cyber Defense Sniffer Started")
    print("[*] Real-time packet capture enabled")
    print("====================================\n")

    try:

        # =================================================
        # START LIVE PACKET CAPTURE
        # =================================================
        sniff(

            # Función que procesa cada paquete
            prn=process_packet,

            # No almacenar paquetes en memoria
            store=False
        )

    except KeyboardInterrupt:

        print("\n[!] Sniffer detenido manualmente.")

    except Exception as e:

        print("\n[ERROR] Sniffer detenido:")
        print(str(e))