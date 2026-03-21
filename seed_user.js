import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  // Check if a trader exists first
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('trader');
  
  if (!existing) {
    const insert = db.prepare('INSERT INTO users (name, mobile, password, location, role) VALUES (?, ?, ?, ?, ?)');
    insert.run('Default Trader', '1234567890', 'password', 'Local', 'trader');
    console.log('Successfully seeded default trader user.');
    console.log('Mobile: 1234567890');
    console.log('Password: password');
  } else {
    console.log('Trader user already exists.');
  }
} catch (error) {
  console.error("Error seeding user:", error);
}
