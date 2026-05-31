from fastapi import WebSocket


# =========================================================
# WEBSOCKET CONNECTION MANAGER
# =========================================================
# Maneja:
#
# - clientes conectados
# - broadcast de eventos
# - conexiones activas
#
# Funciona como el canal LIVE del XDR.
# =========================================================
class ConnectionManager:

    def __init__(self):

        # Clientes WebSocket conectados
        self.active_connections = []

    # =====================================================
    # CONNECT NEW CLIENT
    # =====================================================
    async def connect(self, websocket: WebSocket):

        await websocket.accept()

        self.active_connections.append(websocket)

        print(
            f"[WEBSOCKET] Cliente conectado. "
            f"Total: {len(self.active_connections)}"
        )

    # =====================================================
    # DISCONNECT CLIENT
    # =====================================================
    def disconnect(self, websocket: WebSocket):

        self.active_connections.remove(websocket)

        print(
            f"[WEBSOCKET] Cliente desconectado. "
            f"Total: {len(self.active_connections)}"
        )

    # =====================================================
    # SEND MESSAGE TO SINGLE CLIENT
    # =====================================================
    async def send_personal_message(
        self,
        message,
        websocket: WebSocket
    ):

        await websocket.send_json(message)

    # =====================================================
    # BROADCAST TO ALL CLIENTS
    # =====================================================
    async def broadcast(self, message):

        disconnected_clients = []

        for connection in self.active_connections:

            try:

                await connection.send_json(message)

            except Exception:

                disconnected_clients.append(connection)

        # Eliminar clientes muertos
        for dead_connection in disconnected_clients:

            self.disconnect(dead_connection)


# =========================================================
# GLOBAL WEBSOCKET MANAGER INSTANCE
# =========================================================
manager = ConnectionManager()








