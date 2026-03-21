import Database from 'better-sqlite3';

const db = new Database('local.db');
db.pragma('journal_mode = WAL');

// Initialize tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT DEFAULT 'IDLE',
    operator TEXT,
    image TEXT,
    owner_name TEXT,
    owner_mobile TEXT,
    per_hour_rate INTEGER DEFAULT 1200,
    trader_id INTEGER,
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS machine_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    date TEXT NOT NULL,
    start_reading REAL,
    end_reading REAL,
    hours REAL,
    acres REAL,
    fuel_cost INTEGER,
    rate INTEGER,
    total_amount INTEGER,
    farmer_mobile TEXT,
    location TEXT,
    trader_id INTEGER,
    FOREIGN KEY(machine_id) REFERENCES machines(id),
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );


  CREATE TABLE IF NOT EXISTS machine_advances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    trader_id INTEGER,
    FOREIGN KEY(machine_id) REFERENCES machines(id),
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    lot TEXT NOT NULL,
    time TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    bags INTEGER NOT NULL,
    weight TEXT NOT NULL,
    moisture TEXT NOT NULL,
    moistureStatus TEXT NOT NULL,
    lotId TEXT NOT NULL,
    paddyType TEXT,
    amountType TEXT,
    moistureType TEXT,
    mobile TEXT,
    labour_gratuity INTEGER DEFAULT 0,
    trader_id INTEGER,
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    weight TEXT NOT NULL,
    amount TEXT NOT NULL,
    stage TEXT NOT NULL,
    paymentStatus TEXT NOT NULL,
    date TEXT NOT NULL,
    loaded_at TEXT,
    transit_at TEXT,
    delivered_at TEXT,
    quality_checked_at TEXT,
    paid_at TEXT,
    load_area TEXT,
    mill_name TEXT,
    empty_bags INTEGER,
    driver_mobile TEXT,
    photo_path TEXT,
    vehicle_type TEXT,
    reg_number TEXT,
    gratuity INTEGER DEFAULT 0,
    machine_cost INTEGER DEFAULT 0,
    machine_id TEXT,
    labour_group_id TEXT,
    weigh_scale_kgs TEXT,
    settled_at TEXT,
    trader_id INTEGER,
    FOREIGN KEY(machine_id) REFERENCES machines(id),
    FOREIGN KEY(labour_group_id) REFERENCES labour_groups(id),
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS farmer_advances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    lotId TEXT,
    trader_id INTEGER,
    FOREIGN KEY(lotId) REFERENCES lots(id),
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lot_rates (
    lotId TEXT PRIMARY KEY,
    rate INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    location TEXT NOT NULL,
    role TEXT NOT NULL,
    commission_rate REAL DEFAULT 0,
    trader_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS commission_rates (
    year INTEGER PRIMARY KEY,
    bag_rate REAL DEFAULT 0,
    machine_hour_rate REAL DEFAULT 0,
    labour_rate REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS mills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    registration_date TEXT NOT NULL,
    trader_id INTEGER,
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS mill_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mill_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    lotId TEXT,
    trader_id INTEGER,
    FOREIGN KEY(mill_id) REFERENCES mills(id),
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS labour_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    contact_number TEXT,
    registration_date TEXT NOT NULL,
    trader_id INTEGER,
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS labour_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT,
    role TEXT,
    FOREIGN KEY(group_id) REFERENCES labour_groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS operators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT,
    experience TEXT,
    status TEXT DEFAULT 'ACTIVE',
    registration_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS paddy_market (
    id TEXT PRIMARY KEY,
    paddy_type TEXT NOT NULL,
    price_per_quintal INTEGER NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    trader_id INTEGER,
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS silos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    variety TEXT,
    bags INTEGER DEFAULT 0,
    remaining_tons REAL DEFAULT 0,
    capacity_tons REAL DEFAULT 0,
    trader_id INTEGER,
    FOREIGN KEY(trader_id) REFERENCES users(id)
  );
`);

// Migration: Add hours column if it doesn't exist
try {
  db.prepare("ALTER TABLE machine_logs ADD COLUMN farmer_mobile TEXT").run();
  console.log("Migration: Added farmer_mobile column to machine_logs");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add farmer_mobile column):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN labour_group_id TEXT").run();
  console.log("Migration: Added labour_group_id column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add labour_group_id to lots):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE machines ADD COLUMN owner_name TEXT").run();
  console.log("Migration: Added owner_name column to machines");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add owner_name):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE machines ADD COLUMN owner_mobile TEXT").run();
  console.log("Migration: Added owner_mobile column to machines");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add owner_mobile):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE machines ADD COLUMN per_hour_rate INTEGER DEFAULT 1200").run();
  console.log("Migration: Added per_hour_rate column to machines");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add per_hour_rate):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE machines ADD COLUMN registration_date TEXT").run();
  console.log("Migration: Added registration_date column to machines");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add registration_date):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE machine_logs ADD COLUMN start_time TEXT").run();
  console.log("Migration: Added start_time column to machine_logs");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add start_time):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE machine_logs ADD COLUMN end_time TEXT").run();
  console.log("Migration: Added end_time column to machine_logs");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add end_time):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE machines ADD COLUMN is_settled INTEGER DEFAULT 0").run();
  console.log("Migration: Added is_settled column to machines");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add is_settled):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN machine_cost INTEGER DEFAULT 0").run();
  console.log("Migration: Added machine_cost column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add machine_cost):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN machine_id TEXT").run();
  console.log("Migration: Added machine_id column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add machine_id):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN machine_hours REAL DEFAULT 0").run();
  console.log("Migration: Added machine_hours column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add machine_hours):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN moisture_loss REAL DEFAULT 0").run();
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) console.error(err.message);
}
try {
  db.prepare("ALTER TABLE lots ADD COLUMN bag_penalty REAL DEFAULT 0").run();
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) console.error(err.message);
}
try {
  db.prepare("ALTER TABLE lots ADD COLUMN labor_cost REAL DEFAULT 0").run();
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) console.error(err.message);
}
try {
  db.prepare("ALTER TABLE lots ADD COLUMN manual_deductions_applied INTEGER DEFAULT 0").run();
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) console.error(err.message);
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN machine_rate REAL DEFAULT 0").run();
  console.log("Migration: Added machine_rate column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add machine_rate):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN settled_at TEXT").run();
  console.log("Migration: Added settled_at column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add settled_at):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN paid_at TEXT").run();
  console.log("Migration: Added paid_at column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add paid_at):", err.message);
  }
}

try {
  db.prepare("ALTER TABLE lots ADD COLUMN quality_checked_at TEXT").run();
  console.log("Migration: Added quality_checked_at column to lots");
} catch (err: any) {
  if (!err.message.includes("duplicate column name")) {
    console.error("Migration error (add quality_checked_at):", err.message);
  }
}

// Farmer settlement status table (tracks whether a farmer has been settled for a year)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmer_settlement_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_name TEXT NOT NULL,
      year TEXT NOT NULL,
      is_settled INTEGER DEFAULT 1,
      settled_at TEXT NOT NULL,
      UNIQUE(farmer_name, year)
    );

    CREATE TABLE IF NOT EXISTS machine_settlement_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id TEXT NOT NULL,
      year TEXT NOT NULL,
      is_settled INTEGER DEFAULT 1,
      settled_at TEXT NOT NULL,
      UNIQUE(machine_id, year),
      FOREIGN KEY(machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS mill_settlement_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mill_id TEXT NOT NULL,
      year TEXT NOT NULL,
      is_settled INTEGER DEFAULT 1,
      settled_at TEXT NOT NULL,
      UNIQUE(mill_id, year),
      FOREIGN KEY(mill_id) REFERENCES mills(id)
    );
  `);
  console.log("Migration: Created settlement status tables");
} catch (err: any) {
  console.error("Migration error (settlement_status):", err.message);
}


// Migration: Add trader_id to all relevant tables for multi-trader support
const tablesToMigrate = [
  'machines', 'machine_logs', 'machine_advances', 'lots', 'batches', 
  'farmer_advances', 'mills', 'mill_payments', 'labour_groups', 'paddy_market', 'silos', 'users'
];

tablesToMigrate.forEach(table => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN trader_id INTEGER`).run();
    console.log(`Migration: Added trader_id column to ${table}`);
  } catch (err: any) {
    if (!err.message.includes("duplicate column name")) {
      console.error(`Migration error (add trader_id to ${table}):`, err.message);
    }
  }
});

export default db;
