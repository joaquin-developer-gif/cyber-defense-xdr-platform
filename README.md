[README.md](https://github.com/user-attachments/files/28430475/README.md)

# Cyber Defense XDR Platform v1.0

Developer: Joaquin Rodriguez
GitHub: https://github.com/joaquin-developer-gif/

> **English version first. Versión en español más abajo.**

---

# 🇬🇧 English

## Overview

**Cyber Defense XDR Platform** is a real-time cybersecurity monitoring and response platform built as a practical **SOC/XDR lab project**.

The platform combines network traffic monitoring, suspicious event detection, real-time WebSocket telemetry, threat intelligence, alert visualization, manual IP blocking, IP unblocking, and response history tracking.

It was developed as a cybersecurity and software development portfolio project.

---

## Main Objective

The objective of this project is to demonstrate how a defensive cybersecurity platform works from detection to response.

The system follows this flow:

```txt
Network Traffic
      ↓
Packet Sniffer
      ↓
Detection Engine
      ↓
XDR Event Bus
      ↓
WebSocket Realtime Stream
      ↓
React SOC Dashboard
      ↓
Manual / Auto Response Engine
      ↓
Firewall Blocking / Unblocking
```

---

## Tech Stack

### Backend

- Python
- FastAPI
- Uvicorn
- Scapy
- WebSockets
- iptables
- Threat Intelligence modules
- In-memory blocked IP registry
- In-memory response event history

### Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts

### Environment

- Linux / WSL
- Git
- GitHub
- Local cybersecurity lab network

---

## Main Features

### Real-Time Dashboard

The main dashboard provides a live overview of the XDR platform.

It includes:

- WebSocket connection status
- Backend status
- Local time
- Threat counters
- Severity counters
- SOC-style interface

---

### Live Threat Feed

The **Live Threat Feed** displays real-time XDR telemetry events.

It shows:

- Event type
- Severity
- Source IP
- Destination IP
- Threat score
- Timestamp
- Live status

Detected events may include:

- Brute force behavior
- Port scan activity
- ICMP activity
- ICMP flood
- Suspicious TCP activity
- Threat intelligence matches

---

### XDR Alert Center

The **XDR Alert Center** provides a SOC-style alert management interface.

It allows the analyst to review suspicious events and trigger response actions such as manual IP blocking.

---

### Threat Intelligence

The platform includes a Threat Intelligence module for analyzing suspicious IP addresses.

It can be extended with providers such as:

- AbuseIPDB
- VirusTotal
- GeoIP
- TOR exit node detection
- Custom blacklists

API keys must be stored locally in `.env` and must never be pushed to GitHub.

---

### Blocked IPs Module

The **Blocked IPs** module displays IP addresses currently blocked by the XDR response engine.

It includes:

- Total blocked IPs
- Blocked IP table
- Blocking reason
- Firewall protection status
- Block timestamp
- Copy IP button
- Unblock IP button

Backend endpoint:

```txt
GET /response/blocked-ips
```

---

### Manual IP Blocking

The platform can block an IP address through the backend API.

Endpoint:

```txt
POST /response/block-ip
```

Example:

```bash
curl -X POST http://127.0.0.1:8000/response/block-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual block from XDR Alert Center"}'
```

When successful, the backend:

- Validates the IP address
- Applies a firewall rule using `iptables`
- Adds the IP to the blocked IP registry
- Publishes an XDR response event
- Stores the event in response history

---

### Manual IP Unblocking

The platform can remove a blocked IP from the firewall and internal registry.

Endpoint:

```txt
POST /response/unblock-ip
```

Example:

```bash
curl -X POST http://127.0.0.1:8000/response/unblock-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual unblock from XDR Blocked IPs"}'
```

When successful, the backend:

- Removes the `iptables` firewall rule
- Removes the IP from the blocked registry
- Publishes an `IP_UNBLOCKED` event
- Stores the action in the Auto Response history

---

### Auto Response Engine

The **Auto Response Engine** displays a real history of actions taken by the platform.

It tracks response events such as:

```txt
IP_BLOCKED
IP_UNBLOCKED
BLOCK_FAILED
BLOCK_REJECTED
BLOCK_REJECTED_PROTECTED_IP
UNBLOCK_FAILED
UNBLOCK_ERROR
NO_ACTION_MONITORING
```

Backend endpoint:

```txt
GET /response/events
```

This allows the frontend to display response history even if the WebSocket event was missed.

---

## API Endpoints

### General

```txt
GET /
GET /stats
GET /scan
GET /ports
GET /threat/ip
```

### Response Engine

```txt
POST /response/block-ip
POST /response/unblock-ip
GET /response/blocked-ips
GET /response/events
```

### WebSocket

```txt
WS /ws
```

---

## Project Structure

```txt
cyber-defense-intelligence-system/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── event_bus.py
│   │   │
│   │   ├── packet_analyzer/
│   │   │   ├── analyzer.py
│   │   │   └── detector.py
│   │   │
│   │   ├── response_engine/
│   │   │   ├── firewall.py
│   │   │   ├── quarantine.py
│   │   │   ├── responder.py
│   │   │   └── rules.py
│   │   │
│   │   ├── scanner/
│   │   │   └── scanner.py
│   │   │
│   │   ├── sniffer/
│   │   │   ├── detection_engine.py
│   │   │   └── packet_sniffer.py
│   │   │
│   │   ├── threat_intel/
│   │   │   └── intel.py
│   │   │
│   │   ├── websocket_manager.py
│   │   └── main.py
│   │
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── XDRAlertCenter.jsx
│   │   │   │   ├── XDRBlockedIPs.jsx
│   │   │   │   ├── XDRAutoResponse.jsx
│   │   │   │   ├── XDRLiveFeed.jsx
│   │   │   │   ├── XDRCharts.jsx
│   │   │   │   ├── XDRTimeline.jsx
│   │   │   │   └── ThreatIntelPanel.jsx
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── Sidebar.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   │
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── websocket.js
│   │   │
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Environment Variables

Create a `.env` file inside the `backend/` folder.

Example:

```env
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
```

A `.env.example` file is recommended for public repositories:

```env
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
```

Important:

```txt
Never commit real API keys to GitHub.
```

---

## Running the Project

### Backend

From the backend folder:

```bash
cd backend
sudo ./venv/bin/uvicorn app.main:app --reload
```

The backend runs at:

```txt
http://127.0.0.1:8000
```

`sudo` is required because the response engine uses `iptables`.

---

### Frontend

From the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```txt
http://localhost:5173
```

---

## Example Workflow

### 1. Start the backend

```bash
cd backend
sudo ./venv/bin/uvicorn app.main:app --reload
```

### 2. Start the frontend

```bash
cd frontend
npm run dev
```

### 3. Open the dashboard

```txt
http://localhost:5173
```

### 4. Block an IP

```bash
curl -X POST http://127.0.0.1:8000/response/block-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual test block"}'
```

### 5. Check blocked IPs

```bash
curl http://127.0.0.1:8000/response/blocked-ips
```

### 6. Unblock the IP

```bash
curl -X POST http://127.0.0.1:8000/response/unblock-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual test unblock"}'
```

### 7. Check response history

```bash
curl http://127.0.0.1:8000/response/events
```

---

## Lab Testing

### Public IP Test

The platform was tested with the public IP:

```txt
45.155.205.233
```

Confirmed results:

- IP blocked successfully
- IP appeared in the Blocked IPs module
- Firewall rule was created
- IP was unblocked successfully
- Firewall rule was removed
- Auto Response history registered the action

---

### Private Lab IP Test

A controlled lab test was performed against a Windows machine in the same WiFi network.

Lab IP:

```txt
192.168.1.18
```

To avoid accidentally blocking private infrastructure such as the router or WSL gateway, the platform uses a private lab allowlist:

```python
LAB_ALLOWED_PRIVATE_IPS = {
    "192.168.1.18",
}
```

Confirmed results:

- Private lab IP was blocked successfully
- Private lab IP was unblocked successfully
- Firewall rule was removed
- Registry was updated correctly

Protected addresses include:

```txt
localhost
router / gateway
WSL gateway
multicast
link-local addresses
private IPs not explicitly allowlisted
```

---

## Local Network Investigation Example

During testing, a device was discovered on the local network:

```txt
192.168.1.7
```

Nmap discovered the following open ports:

```txt
8008/tcp
8009/tcp
8443/tcp
9000/tcp
9080/tcp
```

A request to:

```txt
http://192.168.1.7:8008/setup/eureka_info
```

identified the device as:

```txt
Crown Mustang UK Android TV
```

This demonstrated safe device identification in a controlled local lab environment.

---

## Screenshots

This section shows the main visual modules of the Cyber Defense XDR Platform, captured from a controlled local lab environment. The screenshots demonstrate real-time telemetry, threat detection, alert management, firewall-based IP blocking and automated response history.```txt

# 1. Main SOC/XDR Dashboard

Main monitoring dashboard showing the global status of the platform, WebSocket connectivity, backend health, active threat state and SOC/XDR security metrics.

# 2. Live Threat Feed

Real-time threat telemetry stream displaying detected security events, severity levels, source IPs, destination data and threat scores.

# 3. XDR Alert Center

Alert management center used to review suspicious activity such as brute force attempts, threat intelligence detections and high-severity events. The interface includes investigation, manual blocking and resolution actions.

# 4. Blocked IPs Management

Blocked IP management panel connected to the backend response engine and Linux iptables. It displays currently blocked addresses, blocking reasons, timestamps, firewall status and manual unblock actions.

# 5. Auto Response Engine

Automated response history showing actions performed by the XDR response engine, including blocked IPs, unblocked IPs, rejected actions and monitoring events.

# Note:

All screenshots were generated in a controlled local environment for educational, testing and portfolio purposes.

---

## Security Notes

This project is intended for:

```txt
Educational use
Personal lab use
Cybersecurity portfolio demonstration
Defensive security research
```

This project should only be used on:

```txt
Networks you own
Devices you own
Authorized lab environments
```

The project includes safeguards to avoid blocking critical internal IP addresses. Private IP blocking is only allowed for explicitly configured lab devices.

---

## Current Version

```txt
Version: 1.0
Status: Stable lab release
```

Completed modules:

- Real-time dashboard
- Live Threat Feed
- Alert Center
- Threat Intelligence panel
- Blocked IPs module
- Manual Block IP
- Manual Unblock IP
- Auto Response history
- WebSocket live telemetry
- iptables response engine
- Safe private IP lab validation

---

## Roadmap

Future improvements:

- SQLite or Firebase persistence
- Docker deployment
- Router-based Network Quarantine
- Endpoint agent for Windows/Linux
- PDF incident reports
- AI-based threat scoring
- Advanced MITRE ATT&CK mapping
- SIEM-style event search
- Multi-agent XDR architecture
- Kubernetes deployment

---

## Author

Developed by **Joaquin Rodriguez**.

GitHub:

```txt
https://github.com/joaquin-developer-gif
```

---

## Disclaimer

This project was built for defensive cybersecurity learning and portfolio purposes.

Do not use this tool against third-party networks, public systems, or devices without explicit authorization.

---

# 🇪🇸 Español

## Descripción general

**Cyber Defense XDR Platform** es una plataforma de monitoreo y respuesta de ciberseguridad en tiempo real, desarrollada como un proyecto práctico de laboratorio **SOC/XDR**.

La plataforma combina monitoreo de tráfico de red, detección de eventos sospechosos, telemetría en tiempo real mediante WebSocket, inteligencia de amenazas, visualización de alertas, bloqueo manual de IPs, desbloqueo de IPs e historial de acciones de respuesta.

Fue desarrollada como proyecto de portfolio en ciberseguridad y desarrollo de software.

---

## Objetivo principal

El objetivo del proyecto es demostrar cómo funciona una plataforma defensiva de ciberseguridad desde la detección hasta la respuesta.

El sistema sigue este flujo:

```txt
Tráfico de red
      ↓
Packet Sniffer
      ↓
Motor de detección
      ↓
XDR Event Bus
      ↓
WebSocket en tiempo real
      ↓
Dashboard SOC en React
      ↓
Motor de respuesta manual / automática
      ↓
Bloqueo / desbloqueo con firewall
```

---

## Tecnologías utilizadas

### Backend

- Python
- FastAPI
- Uvicorn
- Scapy
- WebSockets
- iptables
- Módulos de Threat Intelligence
- Registro en memoria de IPs bloqueadas
- Historial en memoria de eventos de respuesta

### Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts

### Entorno

- Linux / WSL
- Git
- GitHub
- Red local de laboratorio

---

## Funcionalidades principales

### Dashboard en tiempo real

El dashboard principal muestra una vista general del estado del sistema XDR.

Incluye:

- Estado de WebSocket
- Estado del backend
- Hora local
- Contadores de amenazas
- Contadores por severidad
- Interfaz visual estilo SOC

---

### Live Threat Feed

El **Live Threat Feed** muestra eventos de telemetría XDR en tiempo real.

Muestra:

- Tipo de evento
- Severidad
- IP de origen
- IP de destino
- Puntaje de amenaza
- Fecha/hora
- Estado en vivo

Eventos detectados posibles:

- Comportamiento de fuerza bruta
- Port scanning
- Actividad ICMP
- ICMP flood
- Actividad TCP sospechosa
- Coincidencias de Threat Intelligence

---

### XDR Alert Center

El **XDR Alert Center** proporciona una interfaz estilo SOC para revisar alertas sospechosas.

Permite al analista revisar eventos y ejecutar acciones de respuesta, como el bloqueo manual de una IP.

---

### Threat Intelligence

La plataforma incluye un módulo de inteligencia de amenazas para analizar IPs sospechosas.

Puede extenderse con proveedores como:

- AbuseIPDB
- VirusTotal
- GeoIP
- Detección de nodos TOR
- Blacklists personalizadas

Las API keys deben guardarse localmente en `.env` y nunca deben subirse a GitHub.

---

### Módulo Blocked IPs

El módulo **Blocked IPs** muestra las IPs actualmente bloqueadas por el motor de respuesta XDR.

Incluye:

- Total de IPs bloqueadas
- Tabla de IPs bloqueadas
- Motivo del bloqueo
- Estado de protección del firewall
- Fecha/hora del bloqueo
- Botón para copiar IP
- Botón para desbloquear IP

Endpoint del backend:

```txt
GET /response/blocked-ips
```

---

### Bloqueo manual de IP

La plataforma puede bloquear una IP mediante la API del backend.

Endpoint:

```txt
POST /response/block-ip
```

Ejemplo:

```bash
curl -X POST http://127.0.0.1:8000/response/block-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual block from XDR Alert Center"}'
```

Cuando el bloqueo es exitoso, el backend:

- Valida la IP
- Aplica una regla de firewall usando `iptables`
- Agrega la IP al registro de IPs bloqueadas
- Publica un evento de respuesta XDR
- Guarda el evento en el historial de respuesta

---

### Desbloqueo manual de IP

La plataforma puede quitar una IP bloqueada del firewall y del registro interno.

Endpoint:

```txt
POST /response/unblock-ip
```

Ejemplo:

```bash
curl -X POST http://127.0.0.1:8000/response/unblock-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual unblock from XDR Blocked IPs"}'
```

Cuando el desbloqueo es exitoso, el backend:

- Elimina la regla de `iptables`
- Elimina la IP del registro de bloqueadas
- Publica un evento `IP_UNBLOCKED`
- Guarda la acción en el historial de Auto Response

---

### Auto Response Engine

El **Auto Response Engine** muestra un historial real de acciones tomadas por la plataforma.

Registra eventos como:

```txt
IP_BLOCKED
IP_UNBLOCKED
BLOCK_FAILED
BLOCK_REJECTED
BLOCK_REJECTED_PROTECTED_IP
UNBLOCK_FAILED
UNBLOCK_ERROR
NO_ACTION_MONITORING
```

Endpoint del backend:

```txt
GET /response/events
```

Esto permite que el frontend muestre el historial de respuesta aunque un evento WebSocket no haya sido capturado.

---

## Endpoints de la API

### General

```txt
GET /
GET /stats
GET /scan
GET /ports
GET /threat/ip
```

### Response Engine

```txt
POST /response/block-ip
POST /response/unblock-ip
GET /response/blocked-ips
GET /response/events
```

### WebSocket

```txt
WS /ws
```

---

## Estructura del proyecto

```txt
cyber-defense-intelligence-system/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── event_bus.py
│   │   │
│   │   ├── packet_analyzer/
│   │   │   ├── analyzer.py
│   │   │   └── detector.py
│   │   │
│   │   ├── response_engine/
│   │   │   ├── firewall.py
│   │   │   ├── quarantine.py
│   │   │   ├── responder.py
│   │   │   └── rules.py
│   │   │
│   │   ├── scanner/
│   │   │   └── scanner.py
│   │   │
│   │   ├── sniffer/
│   │   │   ├── detection_engine.py
│   │   │   └── packet_sniffer.py
│   │   │
│   │   ├── threat_intel/
│   │   │   └── intel.py
│   │   │
│   │   ├── websocket_manager.py
│   │   └── main.py
│   │
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── XDRAlertCenter.jsx
│   │   │   │   ├── XDRBlockedIPs.jsx
│   │   │   │   ├── XDRAutoResponse.jsx
│   │   │   │   ├── XDRLiveFeed.jsx
│   │   │   │   ├── XDRCharts.jsx
│   │   │   │   ├── XDRTimeline.jsx
│   │   │   │   └── ThreatIntelPanel.jsx
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── Sidebar.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   │
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── websocket.js
│   │   │
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Variables de entorno

Creá un archivo `.env` dentro de la carpeta `backend/`.

Ejemplo:

```env
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
```

Se recomienda crear un archivo `.env.example` para repositorios públicos:

```env
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
```

Importante:

```txt
Nunca subas claves reales a GitHub.
```

---

## Cómo ejecutar el proyecto

### Backend

Desde la carpeta backend:

```bash
cd backend
sudo ./venv/bin/uvicorn app.main:app --reload
```

El backend corre en:

```txt
http://127.0.0.1:8000
```

Se usa `sudo` porque el motor de respuesta utiliza `iptables`.

---

### Frontend

Desde la carpeta frontend:

```bash
cd frontend
npm install
npm run dev
```

El frontend corre en:

```txt
http://localhost:5173
```

---

## Flujo de prueba

### 1. Iniciar backend

```bash
cd backend
sudo ./venv/bin/uvicorn app.main:app --reload
```

### 2. Iniciar frontend

```bash
cd frontend
npm run dev
```

### 3. Abrir dashboard

```txt
http://localhost:5173
```

### 4. Bloquear una IP

```bash
curl -X POST http://127.0.0.1:8000/response/block-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual test block"}'
```

### 5. Consultar IPs bloqueadas

```bash
curl http://127.0.0.1:8000/response/blocked-ips
```

### 6. Desbloquear la IP

```bash
curl -X POST http://127.0.0.1:8000/response/unblock-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"45.155.205.233","reason":"Manual test unblock"}'
```

### 7. Consultar historial de respuesta

```bash
curl http://127.0.0.1:8000/response/events
```

---

## Pruebas de laboratorio

### Prueba con IP pública

La plataforma fue probada con la IP pública:

```txt
45.155.205.233
```

Resultados confirmados:

- IP bloqueada correctamente
- IP visible en el módulo Blocked IPs
- Regla de firewall creada
- IP desbloqueada correctamente
- Regla de firewall eliminada
- Acción registrada en Auto Response

---

### Prueba con IP privada de laboratorio

Se realizó una prueba controlada contra una máquina Windows en la misma red WiFi.

IP de laboratorio:

```txt
192.168.1.18
```

Para evitar bloquear infraestructura privada por accidente, como el router o el gateway de WSL, la plataforma usa una lista permitida de IPs privadas de laboratorio:

```python
LAB_ALLOWED_PRIVATE_IPS = {
    "192.168.1.18",
}
```

Resultados confirmados:

- IP privada de laboratorio bloqueada correctamente
- IP privada de laboratorio desbloqueada correctamente
- Regla de firewall eliminada
- Registro interno actualizado correctamente

Direcciones protegidas:

```txt
localhost
router / gateway
WSL gateway
multicast
link-local
IPs privadas no permitidas explícitamente
```

---

## Ejemplo de investigación en red local

Durante las pruebas se descubrió un dispositivo en la red local:

```txt
192.168.1.7
```

Nmap descubrió los siguientes puertos abiertos:

```txt
8008/tcp
8009/tcp
8443/tcp
9000/tcp
9080/tcp
```

Una consulta a:

```txt
http://192.168.1.7:8008/setup/eureka_info
```

identificó el dispositivo como:

```txt
Crown Mustang UK Android TV
```

Esto demostró identificación segura de dispositivos dentro de un entorno local controlado.

---

## Capturas de pantalla

Esta sección muestra los módulos visuales principales de la Cyber Defense XDR Platform, capturados desde un entorno local controlado de laboratorio. Las capturas demuestran telemetría en tiempo real, detección de amenazas, gestión de alertas, bloqueo de IPs mediante firewall e historial de respuesta automática.

# 1. Dashboard principal SOC/XDR

Dashboard principal de monitoreo que muestra el estado general de la plataforma, conectividad WebSocket, salud del backend, estado de amenazas activas y métricas de seguridad SOC/XDR.

# 2. Feed de amenazas en vivo

Flujo de telemetría de amenazas en tiempo real que muestra eventos de seguridad detectados, niveles de severidad, IPs de origen, datos de destino y puntajes de amenaza.

# 3. Centro de alertas XDR

Centro de gestión de alertas utilizado para revisar actividad sospechosa como intentos de fuerza bruta, detecciones de inteligencia de amenazas y eventos de alta severidad. La interfaz incluye acciones de investigación, bloqueo manual y resolución.

# 4. Gestión de IPs bloqueadas

Panel de gestión de IPs bloqueadas conectado al motor de respuesta del backend y a iptables en Linux. Muestra direcciones actualmente bloqueadas, motivos del bloqueo, fechas, estado del firewall y acciones manuales de desbloqueo.

# 5. Motor de respuesta automática

Historial de respuesta automática que muestra acciones realizadas por el motor de respuesta XDR, incluyendo IPs bloqueadas, IPs desbloqueadas, acciones rechazadas y eventos de monitoreo.

# Nota:

Todas las capturas fueron generadas en un entorno local controlado con fines educativos, de prueba y de portfolio.

---

## Notas de seguridad

Este proyecto está pensado para:

```txt
Uso educativo
Laboratorio personal
Portfolio de ciberseguridad
Investigación defensiva
```

Debe utilizarse solo en:

```txt
Redes propias
Dispositivos propios
Entornos autorizados
```

El proyecto incluye validaciones para evitar bloquear IPs internas críticas. El bloqueo de IPs privadas solo se permite para dispositivos de laboratorio configurados explícitamente.

---

## Versión actual

```txt
Versión: 1.0
Estado: Stable lab release
```

Módulos completados:

- Dashboard en tiempo real
- Live Threat Feed
- Alert Center
- Panel de Threat Intelligence
- Módulo Blocked IPs
- Bloqueo manual de IP
- Desbloqueo manual de IP
- Historial de Auto Response
- Telemetría WebSocket en vivo
- Motor de respuesta con iptables
- Validación segura para IP privada de laboratorio

---

## Roadmap

Mejoras futuras:

- Persistencia con SQLite o Firebase
- Despliegue con Docker
- Network Quarantine desde router/firewall
- Agente endpoint para Windows/Linux
- Reportes PDF de incidentes
- AI Threat Scoring real
- Mapeo avanzado MITRE ATT&CK
- Búsqueda de eventos estilo SIEM
- Arquitectura XDR multi-agente
- Despliegue con Kubernetes

---

## Autor

Desarrollado por **Joaquin Rodriguez**.

GitHub:

```txt
https://github.com/joaquin-developer-gif
```

---

## Disclaimer

Este proyecto fue creado con fines educativos, defensivos y de portfolio.

No utilices esta herramienta contra redes, sistemas o dispositivos de terceros sin autorización explícita.
