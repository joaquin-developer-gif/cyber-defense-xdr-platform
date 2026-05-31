from pydantic import BaseModel

import asyncio
import threading

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# =========================================================
# INTERNAL MODULES
# =========================================================
from app.scanner.scanner import scan_network, scan_ports

from app.packet_analyzer.analyzer import start_sniffing

# REAL PACKET STATS
from app.sniffer.detection_engine import packet_stats

from app.threat_intel.intel import analyze_ip

from app.sniffer.packet_sniffer import start_sniffer

from app.websocket_manager import manager

from app.core.event_bus import set_event_loop

from app.response_engine.responder import (
    manual_block_ip,
    manual_unblock_ip,
    get_blocked_ips,
    get_response_events,
)


# =========================================================
# REQUEST MODELS
# =========================================================
class BlockIPRequest(BaseModel):
    ip: str
    reason: str = "Manual block from XDR Alert Center"


class UnblockIPRequest(BaseModel):
    ip: str
    reason: str = "Manual unblock from XDR Blocked IPs"


# =========================================================
# FASTAPI APPLICATION
# =========================================================
app = FastAPI(
    title="Cyber Defense XDR Platform",
    version="2.0.0",
)


# =========================================================
# CORS CONFIGURATION
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT ENDPOINT
# =========================================================
@app.get("/")
def root():
    return {
        "status": "running",
        "platform": "Cyber Defense XDR Platform",
        "version": "2.0.0",
    }


# =========================================================
# NETWORK DISCOVERY
# =========================================================
@app.get("/scan")
def network_scan(target: str):
    return scan_network(target)


# =========================================================
# PORT SCANNER
# =========================================================
@app.get("/ports")
def ports_scan(target: str):
    return scan_ports(target)


# =========================================================
# XDR RESPONSE - MANUAL BLOCK IP
# =========================================================
@app.post("/response/block-ip")
def response_block_ip(request: BlockIPRequest):
    return manual_block_ip(
        ip=request.ip,
        reason=request.reason,
    )


# =========================================================
# XDR RESPONSE - MANUAL UNBLOCK IP
# =========================================================
@app.post("/response/unblock-ip")
def response_unblock_ip(request: UnblockIPRequest):
    return manual_unblock_ip(
        ip=request.ip,
        reason=request.reason,
    )


# =========================================================
# XDR RESPONSE - GET BLOCKED IPS
# =========================================================
@app.get("/response/blocked-ips")
def response_get_blocked_ips():
    return get_blocked_ips()


# =========================================================
# XDR RESPONSE - GET RESPONSE EVENTS
# =========================================================
@app.get("/response/events")
def response_get_events():
    return get_response_events()


# =========================================================
# REALTIME XDR STATS
# =========================================================
@app.get("/stats")
def realtime_stats():
    return {
        "total_packets": packet_stats.get("total_packets", 0),
        "tcp_packets": packet_stats.get("tcp_packets", 0),
        "udp_packets": packet_stats.get("udp_packets", 0),
        "icmp_packets": packet_stats.get("icmp_packets", 0),
        "top_sources": dict(packet_stats.get("top_sources", {})),
        "suspicious_events": packet_stats.get("suspicious_events", []),
    }


# =========================================================
# MANUAL PACKET ANALYSIS
# =========================================================
@app.get("/sniff")
def sniff_packets():
    return start_sniffing(50)


# =========================================================
# THREAT INTELLIGENCE ANALYSIS
# =========================================================
@app.get("/threat/ip")
def threat_ip(ip: str):
    result = analyze_ip(ip)

    return {
        "status": "analyzed",
        "result": result,
    }


# =========================================================
# WEBSOCKET LIVE CHANNEL
# =========================================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            # Keep alive
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)

        print("[WEBSOCKET] Cliente desconectado")


# =========================================================
# REAL-TIME PACKET SNIFFER
# =========================================================
def run_sniffer_background():
    try:
        print("[*] Packet Sniffer iniciado...")

        start_sniffer()

    except Exception as e:
        print(f"[ERROR] Sniffer detenido: {e}")


# =========================================================
# APPLICATION STARTUP
# =========================================================
@app.on_event("startup")
async def startup_event():
    print("\n===================================")
    print("[*] Iniciando Cyber Defense XDR Platform...")
    print("===================================\n")

    # =====================================================
    # MAIN FASTAPI EVENT LOOP
    # =====================================================
    loop = asyncio.get_running_loop()

    set_event_loop(loop)

    print("[*] Event loop XDR registrado.")

    # =====================================================
    # START BACKGROUND SNIFFER
    # =====================================================
    sniffer_thread = threading.Thread(
        target=run_sniffer_background,
        daemon=True,
    )

    sniffer_thread.start()

    print("[*] Sniffer realtime iniciado.")