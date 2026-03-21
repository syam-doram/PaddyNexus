import Database from 'better-sqlite3';
const db = new Database('local.db');
console.log(db.prepare('SELECT * FROM commission_rates').all());
