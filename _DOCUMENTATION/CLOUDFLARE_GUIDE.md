# Cloudflare Configuration Guide

This document tracks the specific settings and rules configured in the Cloudflare Dashboard for your domains (e.g., `nschouteren.nl`).

## DNS Settings
- **Proxy Status:** All public subdomains (like `cloud` and `traefik`) should have the **Orange Cloud (Proxied)** icon enabled.
- **SSL/TLS Mode:** Set to **Full (Strict)** to ensure end-to-end encryption between Cloudflare and Traefik.

## Security Rules (WAF)
- **Geo-Blocking:** A strict rule is in place to **only allow traffic from the Netherlands (NL)**. 
  - *Action:* Block (or Challenge) all countries except Netherlands.
  - *Reason:* Drastically reduces the attack surface from international bots and scanners.

## SSL/TLS Edge Certificates
- **Minimum TLS Version:** Recommended to set to **1.2** for modern security.
- **HSTS:** Enabled to enforce HTTPS at the browser level.

## Authentication
- **API Token:** Traefik uses a scoped API token with "Zone:DNS:Edit" permissions for SSL automation (DNS-01 challenge).

---
*Note: These settings are managed in the Cloudflare Web Dashboard, not on this server.*
