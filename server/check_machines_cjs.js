const Database = require('better-sqlite3');
const db = new Database('local.db');
const machines = db.prepare('SELECT * FROM machines').all();
console.log('Current machines in DB:', JSON.stringify(machines, null, 2));
db.close();
