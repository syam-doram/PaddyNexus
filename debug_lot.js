import Database from 'better-sqlite3';
const db = new Database('c:/Users/syamk/OneDrive/Desktop/GoogleAIStudio/paddymanager-load-encounter/local.db');

const lotId = '#SB-2026-002';

console.log(`Checking Lot: ${lotId}`);

const lot = db.prepare('SELECT * FROM lots WHERE id = ?').get(lotId);
console.log('Lot:', lot);

const batches = db.prepare('SELECT * FROM batches WHERE lotId = ?').all(lotId);
console.log('Batches:', batches);

const rate = db.prepare('SELECT * FROM lot_rates WHERE lotId = ?').get(lotId);
console.log('Rate:', rate);

const joined = db.prepare(`
  SELECT l.id, SUM(b.bags) as bags, lr.rate
  FROM lots l
  LEFT JOIN batches b ON l.id = b.lotId
  LEFT JOIN lot_rates lr ON l.id = lr.lotId
  WHERE l.id = ?
  GROUP BY l.id
`).get(lotId);
console.log('Joined result:', joined);
