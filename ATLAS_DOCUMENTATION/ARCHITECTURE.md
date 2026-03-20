# 🏗️ Mainframe Sentinel - System Architecture

Dit document beschrijft de volledige technische architectuur van de **Atlas Mainframe Sentinel**.

## 💻 Hardware & OS Layer
- **Host:** Strato VPS (Mainframe)
- **CPU:** 6-Core AMD EPYC-Milan (Gekalibreerd op 2026-03-20)
- **RAM:** 16 GB DDR4
- **OS:** Debian GNU/Linux 13 (Trixie)
- **Kernel:** Linux 6.12.x-amd64

## 🌐 Networking & Ingress
De Mainframe fungeert als een publieke gateway voor specifieke diensten, beveiligd door een gelaagde aanpak:
1.  **Cloudflare:** DNS-beheer en WAF (Web Application Firewall) voor publieke endpoints.
2.  **Tailscale:** Private mesh-netwerk voor beveiligde communicatie tussen Nexus, Neo en Mainframe.
3.  **Traefik (Reverse Proxy):** Beheert TLS-certificaten (Let's Encrypt) en routeert verkeer naar Docker-containers op basis van labels.

## 🛡️ Security Framework
- **Intrusion Detection/Prevention:** **CrowdSec** analyseert logs van Traefik en SSH. Het blokkeert kwaadaardige IP-adressen op firewall-niveau.
- **Isolatie:** Docker-containers draaien op gescheiden netwerken (`proxy_net` voor publieke toegang, `internal_net` voor database-verkeer).
- **Secret Management:** Alle secrets (`.env` bestanden) bevinden zich in de lokale `secrets/` directory en worden NOOIT gesynchroniseerd met Git.

## 📦 Docker Stack Ecosystem
De stack wordt beheerd via `docker-compose` en is onderverdeeld in functionele blokken:
- **Core:** Traefik, CrowdSec, Portainer.
- **Productiviteit:** Nextcloud AiO (All-in-One).
- **Automatisering:** n8n.
- **Custom Apps:** dnd-character (Go-gebaseerde applicatie).

## 💾 Storage & Backup
- **Docker Volumes:** Gekoppeld aan persistente opslag op de host-SSD.
- **Backups:** BorgBackup-configuratie (lokale en externe opslag in `backup/borg/`).

---
*Gedocumenteerd door Atlas - De Mainframe Sentinel*
