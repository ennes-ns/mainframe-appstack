# Full Server Installation Guide: Docker, Traefik, CrowdSec & Tailscale

This guide provides the complete steps to build and restore your entire server infrastructure from a fresh Linux install.

## 1. Operating System & Docker
First, ensure your system is up to date and Docker is installed.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (re-login after this)
sudo usermod -aG docker $USER
```

---

## 2. Tailscale Setup (Private Access)
Tailscale is used to access sensitive dashboards (like Portainer and Traefik) without exposing them to the public internet.

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Log in and start
sudo tailscale up
```

---

## 3. Folder Structure & Git
We keep all configurations in a central `~/docker` directory.

```bash
mkdir -p ~/docker/_DOCUMENTATION
mkdir -p ~/docker/traefik/data/logs
mkdir -p ~/docker/crowdsec/config
mkdir -p ~/docker/crowdsec/data
mkdir -p ~/docker/portainer/data
mkdir -p ~/docker/secrets
```

### Git Version Control
To keep your configuration safe, initialize a Git repository in `~/docker`.
**CRITICAL:** Create a `.gitignore` file to NEVER commit your secrets.

```bash
# Create .gitignore
echo "secrets/" >> ~/docker/.gitignore
echo "**/acme.json" >> ~/docker/.gitignore
echo "**/data/" >> ~/docker/.gitignore

# Init Git
cd ~/docker
git init
git add .
git commit -m "Initial setup"
```

---

## 4. Secrets Management
Store all sensitive tokens and passwords in the `~/docker/secrets/` directory.

- `cloudflare_dns_token.txt`: API Token for SSL certificates.
- `npm_db_password.txt`: Database password for Proxy Manager (if used).

**Permissions:** Always ensure secrets are protected: `chmod 600 ~/docker/secrets/*`

---

## 5. Portainer (GUI Management)
Portainer is used for visual container management. It is only accessible via your **Tailscale IP**.

```bash
# Start Portainer
docker run -d -p 9443:9443 \
  --name portainer \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/docker/portainer/data:/data \
  portainer/portainer-ce:latest
```

---

## 6. Traefik & CrowdSec Gateway
This is the core of your security architecture.

### Step 1: Create the Network
```bash
docker network create backend
```

### Step 2: CrowdSec
1.  Configure `docker-compose.yml` in `~/docker/crowdsec/`.
2.  Set up `acquis.yaml` to read Traefik and Auth logs.
3.  `docker compose up -d`

### Step 3: Traefik
1.  Configure `traefik.yml` (Static) and `dynamic_conf.yml` (Dynamic).
2.  Load the `crowdsec-bouncer-traefik-plugin`.
3.  Trust Cloudflare IP ranges in `traefik.yml`.
4.  `docker compose up -d`

### Step 4: Link Traefik to CrowdSec
1.  Generate LAPI Key: `docker exec crowdsec cscli bouncers add traefik-bouncer`
2.  Add the key to `dynamic_conf.yml`.
3.  `docker compose up -d --force-recreate`

---

## 7. Maintenance & Backup
- **Backup:** Regularly backup the `~/docker` directory (excluding data/ and secrets/).
- **Updates:** `docker compose pull && docker compose up -d`
- **Security Check:** `docker exec crowdsec cscli alerts list`

---
*Created by Gemini CLI - 2026-03-17*
