const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const BRAIN_DIR = path.join(__dirname, '.gemini', 'BRAIN');

app.get('/', (req, res) => {
  res.send('Oracle Nexus Hub is online. Persistence: .gemini volume.');
});

app.get('/brain', (req, res) => {
  fs.readdir(BRAIN_DIR, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading BRAIN directory: ' + err.message);
    }
    res.json({ files });
  });
});

app.get('/brain/:file', (req, res) => {
  const filePath = path.join(BRAIN_DIR, req.params.file);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found in BRAIN.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Oracle Nexus Hub draait op http://0.0.0.0:${port}`);
});
