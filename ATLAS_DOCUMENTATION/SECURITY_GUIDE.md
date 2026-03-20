# Security Architecture Guide (Defense in Depth)

This document outlines the security strategy and implementation for your Docker infrastructure. We use a **Defense in Depth** approach, which provides multiple layers of protection.

## Layer 1: Edge Protection (Cloudflare WAF)
- **Role:** The first line of defense. It blocks common botnets, DDoS attacks, and known exploits before they reach your server.
- **Mechanism:** Cloudflare's Web Application Firewall (WAF) inspects incoming traffic at their edge locations.
- **Trust:** Traefik is configured to trust Cloudflare's IP ranges (`trustedIPs`) to ensure the real visitor IP is preserved in the headers.

## Layer 2: Gateway Enforcement (Traefik + CrowdSec Plugin)
- **Role:** The "Gatekeeper" at your server's doorstep.
- **Mechanism:** Traefik uses a CrowdSec bouncer plugin to check every request against a real-time list of banned IPs.
- **Why it's Enterprise-grade:** Even if an attacker bypasses Cloudflare or finds your server's direct IP, Traefik will still block them based on local detection.

## Layer 3: Local Detection (CrowdSec Engine)
- **Role:** The "Brain" of the security system.
- **Mechanism:** CrowdSec analyzes logs from Traefik (`access.log`) and other sources (like SSH).
- **Behavior:** It detects patterns such as:
  - Brute-force login attempts on Nextcloud.
  - Vulnerability scanning (path traversal, SQL injection).
  - Rapidly repeated 404/403 errors (port scanning).
- **Outcome:** When a threat is detected, CrowdSec adds the IP to its local blocklist, which Traefik immediately starts enforcing.

## Security Best Practices
1.  **Strict Firewall (UFW):** Port 80 and 443 should only accept traffic from Cloudflare IP ranges.
2.  **Secret Management:** Sensitive credentials (like Cloudflare tokens) are stored in dedicated files or Docker secrets, never hardcoded in compose files.
3.  **Real-Time Monitoring:** Regularly check `docker exec crowdsec cscli alerts list` to see what threats are being detected.
4.  **Automatic SSL:** Certificates are automatically managed and renewed via the Cloudflare DNS-01 challenge, ensuring encryption is always up to date.

## Conclusion
This layered architecture ensures that even if one layer fails, others are in place to mitigate the threat. By combining external edge protection with local behavioral analysis, you have a highly resilient and professional security posture.

---
*Created by Gemini CLI - 2026-03-17*
