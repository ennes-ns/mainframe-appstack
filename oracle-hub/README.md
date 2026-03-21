# Oracle Nexus Hub

De Oracle Nexus Hub is het centrale zenuwstelsel van CrokyOS op de Mainframe (Atlas). Het faciliteert de communicatie tussen de verschillende nodes (Neo/Icarus, Nexus/Oracle) en beheert containeriseerde diensten.

## Architectuurkeuzes

1. **Docker Compose Orchestratie**: We gebruiken Docker Compose voor een modulaire en reproduceerbare opzet van diensten.
2. **Exclusieve Binding**: Alle diensten zijn exclusief gebonden aan het Tailscale IP (`100.95.98.74`). Dit garandeert dat de Hub alleen toegankelijk is binnen het Tailscale netwerk van CrokyOS.
3. **MQTT Broker (Eclipse Mosquitto)**: Voor lichtgewicht, real-time communicatie tussen Icarus en Atlas. Dit is de 'Resonance' laag.
4. **Reverse Proxy (NGINX)**: Om diensten veilig te ontsluiten en interne routering te verzorgen.
5. **Central API (Node.js/Express)**: De 'Nucleus API' die fungeert als de logische interface voor de Oracle.

## Componenten
- **Resonance**: Mosquitto MQTT Broker op poort 1883 en 9001 (WebSockets).
- **Gateway**: NGINX Reverse Proxy op poort 80 en 443.
- **Nucleus**: De centrale API dienst op poort 3000.

## Installatie & Gebruik
```bash
# Start de Hub
docker-compose up -d

# Controleer of de poorten goed gebonden zijn
netstat -tulpn | grep 100.95.98.74
```

---
*Gedocumenteerd door Atlas op Mainframe (Tailscale IP: 100.95.98.74).*
