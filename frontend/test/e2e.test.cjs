const { spawn } = require('child_process');
const electronPath = require('electron');
const path = require('path');
const fs = require('fs');

console.log('==================================================');
console.log('🏥 ClinicFlow - P2P Architecture End-to-End Test');
console.log('==================================================\n');

// 1. Cleanup old DBs to ensure clean state
const testDataPath = path.join(__dirname, 'test-data');
if (fs.existsSync(testDataPath)) {
  fs.rmSync(testDataPath, { recursive: true, force: true });
}
fs.mkdirSync(testDataPath);

// 2. Spawn Node A (Port 5002) using Electron binary to match SQLite ABI
const nodeA = spawn(electronPath, [path.join(__dirname, 'headless-node.cjs')], {
  env: { ...process.env, DB_NAME: 'node-a.db', PEER_PORT: '5002', ELECTRON_RUN_AS_NODE: '1' },
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});
nodeA.stdout.on('data', d => process.stdout.write(d));
nodeA.stderr.on('data', d => process.stderr.write(d));

// 3. Spawn Node B (Port 5003)
const nodeB = spawn(electronPath, [path.join(__dirname, 'headless-node.cjs')], {
  env: { ...process.env, DB_NAME: 'node-b.db', PEER_PORT: '5003', ELECTRON_RUN_AS_NODE: '1' },
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});
nodeB.stdout.on('data', d => process.stdout.write(d));
nodeB.stderr.on('data', d => process.stderr.write(d));

let createdClinicId = null;

// 4. Test Orchestration
setTimeout(() => {
  console.log('\n[TestRunner] 🚀 Nodes initialized. UDP Discovery should be active.');
  console.log('[TestRunner] 👉 Step 1: Instructing Node A to Create a Clinic (Offline Mode)');
  
  nodeA.send({ type: 'CREATE_CLINIC' });
}, 5000); // Wait 5s for boot & discovery

nodeA.on('message', (msg) => {
  if (msg.type === 'CLINIC_CREATED') {
    createdClinicId = msg.id;
    console.log(`[TestRunner] ✅ Node A successfully created clinic: ${createdClinicId}`);
    console.log(`[TestRunner] ⏳ Step 2: Waiting 12 seconds for Node B's P2P Sync Polling loop to fetch it...`);
    
    // 5. Wait for Sync Polling (SyncService loops every 10s)
    setTimeout(() => {
      console.log(`\n[TestRunner] 🔍 Step 3: Asking Node B if it has the Clinic...`);
      nodeB.send({ type: 'CHECK_CLINIC', id: createdClinicId });
    }, 12000);
  }
});

nodeB.on('message', (msg) => {
  if (msg.type === 'CLINIC_RESULT') {
    if (msg.clinic && msg.clinic.name === 'E2E Sync Clinic') {
      console.log(`\n🎉 SUCCESS! Node B has perfectly synchronized the clinic over the P2P network!`);
      console.log(JSON.stringify(msg.clinic, null, 2));
    } else {
      console.error(`\n❌ FAILED! Node B did not find the clinic. Migration or Sync failed.`);
    }
    
    // Shutdown
    console.log('\n[TestRunner] Shutting down nodes...');
    nodeA.send({ type: 'SHUTDOWN' });
    nodeB.send({ type: 'SHUTDOWN' });
    setTimeout(() => process.exit(0), 1000);
  }
});
