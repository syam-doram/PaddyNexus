import Database from 'better-sqlite3';
const db = new Database('local.db');

try {
  console.log("Running Farmer Settlement Query...");
  
  // 1. Get farmer lot stats
  const lotStats = db.prepare(`
    SELECT 
      b.name as farmerName,
      SUM(b.bags) as totalBags,
      SUM(b.bags * COALESCE(lr.rate, 1200)) as grossAmount
    FROM batches b
    JOIN lots l ON b.lotId = l.id
    LEFT JOIN lot_rates lr ON l.id = lr.lotId
    GROUP BY b.name
  `).all();
  console.log("Lot Stats:", JSON.stringify(lotStats, null, 2));

  // 2. Get total machine cost per farmer
  // Need to sum machine_cost for unique lots per farmer
  const machineCosts = db.prepare(`
    SELECT 
      farmerName,
      SUM(machine_cost) as totalMachineCost
    FROM (
      SELECT DISTINCT b.name as farmerName, l.id as lotId, l.machine_cost
      FROM batches b
      JOIN lots l ON b.lotId = l.id
    )
    GROUP BY farmerName
  `).all();
  console.log("Machine Costs:", JSON.stringify(machineCosts, null, 2));

  // 3. Get total advances per farmer
  const advances = db.prepare(`
    SELECT farmer_name as farmerName, SUM(amount) as totalAdvances
    FROM farmer_advances
    GROUP BY farmer_name
  `).all();
  console.log("Advances:", JSON.stringify(advances, null, 2));

} catch (err) {
  console.error("QUERY ERROR:", err.message);
} finally {
  db.close();
}
