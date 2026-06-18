const Database = require('better-sqlite3');
const db = new Database('C:\\Users\\igtec\\AppData\\Roaming\\frontend\\clinicflow-local.db');
db.prepare('UPDATE events SET cloud_synced = 0').run();
console.log('All events set to cloud_synced = 0');
