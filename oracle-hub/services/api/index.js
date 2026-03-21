const express = require('express');
const mqtt = require('mqtt');
const app = express();
const port = 3000;

const client = mqtt.connect('mqtt://resonance:1883');

client.on('connect', () => {
  console.log('Verbonden met Resonance (MQTT Broker)');
  client.subscribe('oracle/nexus/pulse');
});

client.on('message', (topic, message) => {
  console.log(\`Pulse ontvangen op \${topic}: \${message.toString()}\`);
});

app.get('/', (req, res) => {
  res.send('Oracle Nexus Nucleus is online.');
});

app.listen(port, () => {
  console.log(\`Nucleus API draait op http://localhost:\${port}\`);
});
