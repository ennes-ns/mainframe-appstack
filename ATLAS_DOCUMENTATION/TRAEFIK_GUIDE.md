# Traefik Management Guide

This document explains the current Traefik setup and how to manage it.

## Current Setup Details
- **Base Directory:** `/home/ennes/docker/traefik/`
- **Network:** All services communicate via the `backend` Docker network.
- **Port Strategy:**
  - **80/443:** Open to the public via Cloudflare.
  - **8080 (Dashboard):** Internal only, exposed via Tailscale IP (`100.95.98.74:8081`).

## How it works:
- **Cloudflare DNS-01 Challenge:** Traefik uses a Cloudflare API token for automatic SSL certificates.
- **Real IP Tracking:** Traefik is configured to trust Cloudflare's IP ranges. This ensures that the **real visitor IP** is logged and checked, rather than Cloudflare's proxy IP.
- **Auto-Discovery:** Traefik watches the Docker socket for labels.

## CrowdSec Integration (Bouncer Plugin)
Traefik uses the `bouncer` plugin (`github.com/maxlerebourg/crowdsec-bouncer-traefik-plugin`).

### 1. The Middleware
The middleware `crowdsec-bouncer` is defined in `dynamic_conf.yml`. It communicates with the CrowdSec LAPI on `crowdsec:8080`.

### 2. Protecting a Service
To protect a service, simply add the middleware to its router in the Docker labels:

```yaml
labels:
  - "traefik.http.routers.nextcloud.middlewares=crowdsec-bouncer"
```

### 3. Testing the Bouncer
To verify the connection between Traefik and CrowdSec:
1.  **Ban an IP:** `docker exec crowdsec cscli decisions add --ip <TEST_IP> --reason "manual test"`
2.  **Verify:** Access the site from that IP. You should receive a `403 Forbidden`.
3.  **Unban:** `docker exec crowdsec cscli decisions delete --ip <TEST_IP>`

## Maintenance Commands
- **Check Bouncer Status:** `docker exec crowdsec cscli bouncers list`
- **View CrowdSec Alerts:** `docker exec crowdsec cscli alerts list`
- **View Traefik Logs:** `tail -f /home/ennes/docker/traefik/logs/traefik.log`
- **Restart Traefik (Apply static config):** `cd /home/ennes/docker/traefik/ && docker compose up -d --force-recreate`

## Security Notes
- **Trusted IPs:** If Cloudflare updates their IP ranges, update the `forwardedHeaders.trustedIPs` section in `traefik.yml`.
- **Acquis.yaml:** CrowdSec reads logs from `/var/log/traefik/access.log`. Ensure this file mapping remains intact in `crowdsec/docker-compose.yml`.

---
*Updated by Gemini CLI - 2026-03-17*
