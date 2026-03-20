# 🛡️ Atlas Mainframe Sentinel - Technical Map

This is the architectural compass for the Mainframe Sentinel. It defines the skeleton, framework, and security boundaries of the production infrastructure.

## 🏗️ System Architecture (The Skeleton)
The Mainframe operates as a **High-Availability Production Sentinel** on Debian 13 (Trixie), utilizing Docker as the primary orchestration engine.

### Core Nodes & Flow
1.  **Ingress Layer:** Cloudflare (WAF/DNS) -> **Traefik** (Reverse Proxy & TLS)
2.  **Security Layer:** **CrowdSec** (IDS/IPS) monitoring Traefik & System logs.
3.  **Application Layer:**
    *   **Nextcloud AiO:** Primary data and collaboration hub.
    *   **n8n:** Automation and workflow engine.
    *   **Portainer:** Container management interface.
    *   **DnD-Character:** Custom Go-based application.

## 🔐 Security Framework
*   **Principle of Least Privilege:** GitHub scopes are restricted; Docker secrets are isolated and ignored by Git.
*   **Network Isolation:** Containers operate on dedicated Docker networks (`proxy_net`, `internal_net`).
*   **Monitoring:** CrowdSec active blocking of malicious actors at the Traefik level.

## 🗺️ Directory Framework
- `/home/ennes/docker/`: Root of the application stack (Version controlled).
- `ATLAS_DOCUMENTATION/`: This technical map and specialized guides.
- `secrets/`: (Local Only) Sensitive environment files and credentials.

---
*Maintained by Atlas - The Mainframe Sentinel*
