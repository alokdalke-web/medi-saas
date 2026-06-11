require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeSchema } = require('./schema');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize SQLite DB Schema
initializeSchema();

app.use(cors());
app.use(express.json());

// Server Dashboard HTML View
app.get('/', (req, res) => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  res.send(`
    <html>
      <head>
        <title>ClinicFlow Local Server</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; background: #f8fafc; color: #0f172a; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 600px; margin: 0 auto; }
          h1 { color: #2563eb; margin-top: 0; }
          ul { background: #eff6ff; padding: 1rem 1rem 1rem 2.5rem; border-radius: 6px; }
          li { margin: 0.5rem 0; font-family: monospace; font-size: 1.1rem; }
          .badge { background: #22c55e; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>ClinicFlow Local Server</h1>
          <p>Status: <span class="badge">Running</span></p>
          <p>Database: <strong>SQLite (clinicflow.db) connected</strong></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;"/>
          <p>Connect from other PCs on your local network using:</p>
          <ul>
            ${ips.map(ip => `<li>http://${ip}:${PORT}</li>`).join('')}
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Import Routes
const authRouter = require('./routes/auth');
const patientsRouter = require('./routes/patients');
const appointmentsRouter = require('./routes/appointments');
const dashboardRouter = require('./routes/dashboard');
const usersRouter = require('./routes/users');
const doctorsRouter = require('./routes/doctors');
const clinicsRouter = require('./routes/clinics');
const syncRouter = require('./routes/sync');

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/doctors', doctorsRouter);
app.use('/api/v1/clinics', clinicsRouter);
app.use('/api/v1/sync', syncRouter);

// Start Server on 0.0.0.0 (Accessible across LAN)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================`);
  console.log(`✅ Local Server running on port ${PORT}`);
  console.log(`✅ Listening on 0.0.0.0 (LAN Accessible)`);
  console.log(`====================================`);
});
