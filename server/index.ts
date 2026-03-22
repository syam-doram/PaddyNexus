import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Lot, Batch, Machine, MachineLog, CommissionRate, Mill, LabourGroup, LabourMember, Operator, PaddyMarket, Silo, SettlementStatus, FarmerAdvance, LotRate } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// CORS Middleware for local network testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helper to clean machine IDs (strips colon suffixes)
const cleanMachineId = (id: string | number): string => {
  if (typeof id === 'number') return id.toString();
  return id.trim().split(':')[0];
};

// AUTHENTICATION Endpoints

app.post('/api/auth/register', async (req, res) => {
  const { name, mobile, password, location, role } = req.body;
  if (!name || !mobile || !password || !location || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const { traderId } = req.body;
    const user = new User({ 
      name, 
      mobile, 
      password, 
      location, 
      role, 
      commission_rate: 0, 
      trader_id: traderId || null 
    });
    await user.save();
    res.json({ user: { id: user._id, ...user.toObject() } });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }
    console.error("Database error (register):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  const { traderId } = req.query;
  try {
    let users;
    if (traderId) {
       const cleanId = cleanMachineId(traderId as string);
       users = await User.find({ role: { $ne: 'trader' }, trader_id: cleanId }).select('id name mobile location role commission_rate');
    } else {
       users = await User.find().select('id name mobile location role commission_rate');
    }
    res.json(users);
  } catch (error: any) {
    console.error("Database error (get users):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.get('/api/auth/trader-count', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'trader' });
    res.json({ count });
  } catch (error) {
    console.error("Database error (trader count):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { mobile, password, role } = req.body;
  if (!mobile || !password || !role) {
    return res.status(400).json({ error: 'Mobile, password, and role are required' });
  }

  try {
    const userRow = await User.findOne({ mobile, password }).lean();
    
    if (userRow) {
      const user = { id: (userRow as any)._id, ...userRow };
      if (user.role === 'trader') {
        return res.json({ user: { ...user, role } });
      }
      
      if (user.role === role) {
        return res.json({ user });
      }
      
      return res.status(401).json({ error: 'Invalid role for this account' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error("Database error (login):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});
app.post('/api/auth/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.password !== oldPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error("Database error (change-password):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/auth/update-photo', async (req, res) => {
  const { userId, image } = req.body;
  if (!userId || !image) {
    return res.status(400).json({ error: 'userId and image are required' });
  }

  try {
    await User.findByIdAndUpdate(userId, { image });
    res.json({ success: true, message: 'Profile photo updated' });
  } catch (error) {
    console.error("Database error (update-photo):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// DEFAULT Endpoints

app.put('/api/users/:id/commission', async (req, res) => {
  const { id } = req.params;
  const { commission_rate } = req.body;

  if (commission_rate === undefined) {
    return res.status(400).json({ error: 'commission_rate is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { commission_rate });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Commission rate updated successfully' });
  } catch (error) {
    console.error("Database error (set commission):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// Commission Rates Endpoints (Year-wise)

app.get('/api/commissions', async (req, res) => {
  try {
    const rates = await CommissionRate.find().sort({ year: -1 });
    res.json(rates);
  } catch (error) {
    console.error("Database error (get commissions):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/paddy-types', async (req, res) => {
  try {
    const [batchTypes, marketTypes, lotTypes] = await Promise.all([
      Batch.distinct('paddyType', { paddyType: { $ne: '' } }),
      PaddyMarket.distinct('paddy_type', { paddy_type: { $ne: '' } }),
      Lot.distinct('type', { type: { $ne: '' } })
    ]);
    const types = Array.from(new Set([...batchTypes, ...marketTypes, ...lotTypes]));
    res.json(types);
  } catch (error) {
    console.error("Database error (paddy types):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/commissions/:year', async (req, res) => {
  const { year } = req.params;
  try {
    const rate = await CommissionRate.findOne({ year: parseInt(year) });
    res.json(rate || { year: parseInt(year), bag_rate: 0, machine_hour_rate: 0, labour_rate: 0 });
  } catch (error) {
    console.error("Database error (get commission by year):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.put('/api/commissions/:year', async (req, res) => {
  const { year } = req.params;
  const { bag_rate, machine_hour_rate, labour_rate } = req.body;

  try {
    const rate = await CommissionRate.findOneAndUpdate(
      { year: parseInt(year) },
      { $set: { bag_rate, machine_hour_rate, labour_rate } },
      { upsert: true, new: true }
    );
    res.json({ success: true, ...rate.toObject() });
  } catch (error) {
    console.error("Database error (upsert commission):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
    const { id } = req.params;
    const traderId = req.query.traderId;

    if (!traderId) {
        return res.status(400).json({ error: 'Trader isolation identifier required' });
    }

    try {
        const cleanId = cleanMachineId(traderId as string);
        const result = await User.deleteOne({ _id: id, trader_id: cleanId, role: { $ne: 'trader' } });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found or unauthorized' });
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions', async (req, res) => {
  const { lotId } = req.query as { lotId?: string };
  try {
    if (lotId) {
      const lot = await Lot.findOne({ id: lotId });
      if (!lot) return res.status(404).json({ error: 'Lot not found' });

      const events: any[] = [];
      if (lot.loaded_at) events.push({ id: `stage-loaded-${lotId}`, name: 'LOT LOADED', type: 'transition', date: lot.loaded_at, status: 'COMPLETED', amount: 'N/A' });
      if (lot.transit_at) events.push({ id: `stage-transit-${lotId}`, name: 'IN TRANSIT', type: 'transition', date: lot.transit_at, status: 'COMPLETED', amount: 'N/A' });
      if (lot.delivered_at) events.push({ id: `stage-delivered-${lotId}`, name: 'DELIVERED TO MILL', type: 'transition', date: lot.delivered_at, status: 'COMPLETED', amount: 'N/A' });
      if (lot.quality_checked_at) events.push({ id: `stage-quality-${lotId}`, name: 'QUALITY CHECKED', type: 'transition', date: lot.quality_checked_at, status: 'COMPLETED', amount: 'N/A' });
      if (lot.paid_at) events.push({ id: `stage-paid-${lotId}`, name: 'PAYMENT RELEASED', type: 'transition', date: lot.paid_at, status: 'COMPLETED', amount: 'N/A' });
      if (lot.settled_at) events.push({ id: `stage-settled-${lotId}`, name: 'ACCOUNT SETTLED', type: 'transition', date: lot.settled_at, status: 'COMPLETED', amount: 'N/A' });

      const advances = await FarmerAdvance.find({ lotId });
      advances.forEach(adv => {
        events.push({
          id: `adv-${adv._id}`,
          name: `FARMER ADVANCE: ${adv.description || 'N/A'}`,
          type: 'advance',
          date: adv.date,
          status: 'PAID',
          amount: `₹ ${adv.amount.toLocaleString()}`
        });
      });

      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return res.json(events);
    } else {
      const recentLots = await Lot.find().sort({ date: -1 }).limit(50);
      const transactions = recentLots.map(l => ({
        id: l.id,
        name: l.name,
        date: l.date,
        amount: l.amount,
        status: l.stage,
        type: 'lot',
        invoice: l.id
      }));
      res.json(transactions);
    }
  } catch (error) {
    console.error("Database error (transactions):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/lots/:id/batches', async (req, res) => {
  const { id } = req.params;
  try {
    const batches = await Batch.find({ lotId: id });
    res.json(batches);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.put('/api/lots/:lotId/batches/:batchId', async (req, res) => {
  const { lotId, batchId } = req.params;
  const { name, paddyType, bags, weight, moisture, amountType, moistureType, mobile, labour_gratuity } = req.body;

  try {
    const moistureValue = parseFloat(moisture.replace('%', ''));
    const moistureStatus = moistureValue > 17 ? 'red' : moistureValue > 14 ? 'yellow' : 'green';

    const result = await Batch.findOneAndUpdate(
      { _id: batchId, lotId },
      { $set: { name, paddyType, bags, weight, moisture, moistureStatus, amountType, moistureType, mobile, labour_gratuity: labour_gratuity || 0 } }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (update batch):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/lots/:lotId/batches', async (req, res) => {
  const { lotId } = req.params;
  const { name, paddyType, bags, weight, moisture, amountType, moistureType, mobile, labour_gratuity } = req.body;

  try {
    const moistureValue = parseInt(moisture);
    const mockMoistureStatus = moistureValue > 17 ? 'red' : moistureValue > 14 ? 'yellow' : 'green';

    const lot = await Lot.findOne({ id: lotId });
    const traderId = lot?.trader_id || null;

    const batch = new Batch({
      name: name || 'New Batch',
      date: new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      bags,
      weight,
      moisture,
      moistureStatus: mockMoistureStatus,
      lotId,
      amountType: amountType || 'Spot Cash',
      moistureType: moistureType || 'Dry Paddy',
      paddyType: paddyType || '',
      mobile: mobile || '',
      labour_gratuity: parseInt(labour_gratuity) || 0,
      trader_id: traderId
    });
    
    await batch.save();
    res.json({ success: true, id: batch._id });
  } catch (error) {
    console.error("Database error (insert batch):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});


// GET Lot Rate
app.get('/api/lots/:id/rate', async (req, res) => {
  const { id } = req.params;
  try {
    const rateRow = await LotRate.findOne({ lotId: id });
    res.json({ rate: rateRow ? rateRow.rate : 1200 }); 
  } catch (error) {
    console.error("Database error (get rate):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// PUT Lot Rate
app.put('/api/lots/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rate } = req.body;

  if (rate === undefined) {
    return res.status(400).json({ error: 'Rate is required' });
  }

  try {
    const updated = await LotRate.findOneAndUpdate(
      { lotId: id },
      { $set: { rate } },
      { upsert: true, new: true }
    );
    res.json({ success: true, rate: updated.rate });
  } catch (error) {
    console.error("Database error (put rate):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/dashboard-summary', async (req, res) => {
  const { traderId } = req.query;
  try {
    const match: any = {};
    if (traderId) match.trader_id = traderId;

    const summary = await Lot.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'batches',
          localField: 'id',
          foreignField: 'lotId',
          as: 'batches'
        }
      },
      { $unwind: { path: '$batches', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          lotId: '$id',
          driverName: '$name',
          lotDate: '$date',
          stage: 1,
          load_area: 1,
          millName: '$mill_name',
          farmerName: '$batches.name',
          bags: '$batches.bags',
          weight: '$batches.weight',
          moisture: '$batches.moisture'
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Database error (dashboard summary):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// Lot Stages Endpoints

app.get('/api/lot-stages', (req, res) => {
  try {
    const { traderId } = req.query;
    let query = `
      SELECT 
        l.*, 
        lg.name as labour_group_name, 
        SUM(b.bags) as bags, 
        AVG(b.weight) as avg_bag_weight, 
        COALESCE(lr.rate, 1200) as rate, 
        l.machine_cost,
        cr.bag_rate as dealer_commission,
        cr.labour_rate as labour_commission
      FROM lots l
      LEFT JOIN labour_groups lg ON l.labour_group_id = lg.id
      LEFT JOIN batches b ON l.id = b.lotId
      LEFT JOIN lot_rates lr ON l.id = lr.lotId
      LEFT JOIN commission_rates cr ON CAST(STRFTIME('%Y', l.date) AS INTEGER) = cr.year
      WHERE 1=1
    `;
    const params: any[] = [];
    if (traderId) {
      query += ` AND l.trader_id = ? `;
      params.push(traderId);
    }
    query += ` GROUP BY l.id `;
    const lots = db.prepare(query).all(...params);
    res.json(lots);
  } catch (error) {
    console.error("Database error (get lot-stages):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// GET unique paddy types from existing lots
app.get('/api/lots/types', async (req, res) => {
  try {
    const types = await Lot.distinct('type', { type: { $ne: '' } });
    res.json(types);
  } catch (error) {
    console.error("Database error (get lot types):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/lots/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const results = await Lot.aggregate([
      { $match: { id: id } },
      {
        $lookup: {
          from: 'labourgroups',
          localField: 'labour_group_id',
          foreignField: 'id',
          as: 'labourGroup'
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'id',
          foreignField: 'lotId',
          as: 'batches'
        }
      },
      {
        $addFields: {
          labour_group_name: { $arrayElemAt: ['$labourGroup.name', 0] },
          bags: { $sum: '$batches.bags' },
          avg_bag_weight: { $avg: { $map: { input: '$batches', as: 'b', in: { $toDouble: { $replaceAll: { input: "$$b.weight", find: " kgs", replacement: "" } } } } } }
        }
      },
      { $project: { labourGroup: 0, batches: 0 } }
    ]);

    if (results.length === 0) return res.status(404).json({ error: 'Lot not found' });
    res.json(results[0]);
  } catch (error) {
    console.error("Database error (get lot):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/lots/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { stage, paymentStatus, settled_at } = req.body;
  const { traderId } = req.query;

  try {
    const update: any = {};
    if (stage !== undefined) update.stage = stage;
    if (paymentStatus !== undefined) update.paymentStatus = paymentStatus;
    if (settled_at !== undefined) update.settled_at = settled_at;

    if (stage) {
      const now = new Date().toISOString();
      if (stage === 'LOADED') update.loaded_at = now;
      if (stage === 'DELIVERED TO MILL') update.delivered_at = now;
      if (stage === 'QUALITY CHECK') update.quality_checked_at = now;
      if (stage === 'PAID') update.paid_at = now;
    }

    const query: any = { id };
    if (traderId) query.trader_id = traderId;

    const result = await Lot.findOneAndUpdate(query, { $set: update }, { new: true });
    
    if (!result) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (update lot stage):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/lots', async (req, res) => {
  const { year, traderId } = req.query;
  const yearFilter = year ? new RegExp(`^${year}-`) : /.*/;
  try {
    const match: any = { date: yearFilter, stage: { $ne: 'SETTLED' } };
    if (traderId) match.trader_id = traderId;

    const lots = await Lot.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'batches',
          localField: 'id',
          foreignField: 'lotId',
          as: 'batches'
        }
      },
      {
        $lookup: {
          from: 'lotrates',
          localField: 'id',
          foreignField: 'lotId',
          as: 'lotRate'
        }
      },
      {
        $addFields: {
          bags: { $sum: '$batches.bags' },
          avg_bag_weight: { $avg: { $map: { input: '$batches', as: 'b', in: { $toDouble: { $replaceAll: { input: "$$b.weight", find: " kgs", replacement: "" } } } } } },
          rate: { $ifNull: [{ $arrayElemAt: ['$lotRate.rate', 0] }, 1200] }
        }
      },
      { $project: { batches: 0, lotRate: 0 } },
      { $sort: { date: -1 } }
    ]);

    res.json(lots);
  } catch (error) {
    console.error("Database error (get lots):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/lots/count/:year', async (req, res) => {
  const { year } = req.params;
  const { traderId } = req.query;
  try {
    const query: any = { date: new RegExp(`^${year}-`) };
    if (traderId) query.trader_id = traderId;
    const count = await Lot.countDocuments(query);
    res.json({ count });
  } catch (error) {
    console.error("Database error (get lot count):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/lots', async (req, res) => {
  const { id, name, type, weight, weighScaleKgs, date, load_area, mill_name, empty_bags, driver_mobile, photo_path, vehicle_type, reg_number, gratuity, labour_group_id, traderId, pre_load_scale } = req.body;

  if (!id || !name || !type || !weight || !date) {
    return res.status(400).json({ error: 'All primary fields (ID, Name, Type, Weight, Date) are required' });
  }

  try {
    const lot = new Lot({
      id,
      name,
      type,
      weight: weight.includes('Tons') ? weight : `${weight} Tons`,
      amount: '₹ 0',
      stage: 'LOADING',
      paymentStatus: 'UNPAID',
      date,
      load_area: load_area || '',
      mill_name: mill_name || '',
      empty_bags: parseInt(empty_bags) || 0,
      driver_mobile: driver_mobile || '',
      photo_path: photo_path || '',
      vehicle_type: vehicle_type || 'Tractor',
      reg_number: reg_number || '',
      gratuity: parseInt(gratuity) || 0,
      labour_group_id: labour_group_id || null,
      weigh_scale_kgs: weighScaleKgs || '',
      trader_id: traderId || null,
      pre_load_scale: parseFloat(pre_load_scale) || 0
    });
    
    await lot.save();
    res.json({ success: true, id });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Lot ID already exists' });
    }
    console.error("Database error (insert lot):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// NEW: Generic Lot Update Endpoint
app.patch('/api/lots/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const { traderId } = req.query;
  
  const validColumns = [
    'name', 'type', 'weight', 'amount', 'stage', 'paymentStatus', 'date', 
    'loaded_at', 'transit_at', 'delivered_at', 'quality_checked_at', 'paid_at',
    'load_area', 'mill_name', 'empty_bags', 'driver_mobile', 'photo_path',
    'vehicle_type', 'reg_number', 'gratuity', 'machine_cost', 'machine_id',
    'labour_group_id', 'weigh_scale_kgs', 'settled_at', 'pre_load_scale', 'post_load_scale'
  ];

  const updates: any = {};
  Object.keys(body).forEach(key => {
    if (validColumns.includes(key)) {
      updates[key] = body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;

    const result = await Lot.findOneAndUpdate(filter, { $set: updates }, { new: true });

    if (!result) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (patch lot):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// FARMER SETTLEMENT Endpoints

app.get('/api/farmer-settlements', async (req, res) => {
  const { year, traderId } = req.query;
  const yearFilter = year ? new RegExp(`^${year}-`) : /.*/;

  try {
    const [lots, batches, lotRates, machineLogs, machineList, advancesList] = await Promise.all([
      Lot.find({ date: yearFilter }),
      Batch.find({ date: yearFilter }),
      LotRate.find(),
      MachineLog.find({ date: yearFilter }),
      Machine.find(),
      FarmerAdvance.find({ date: yearFilter })
    ]);

    const lotRateMap = new Map(lotRates.map(r => [r.lotId, r.rate]));
    const machineMap = new Map(machineList.map(m => [m.id, m.name]));

    const farmerGroups = new Map();
    batches.forEach(b => {
      const farmerName = b.name;
      if (!farmerGroups.has(farmerName)) {
        farmerGroups.set(farmerName, {
          farmerName,
          totalBags: 0,
          grossAmount: 0,
          batchGratuity: 0,
          mobile: b.mobile,
          lots: [],
          advances: [],
          machineLogs: []
        });
      }
      const group = farmerGroups.get(farmerName);
      const lot = lots.find(l => l.id === b.lotId);
      if (lot) {
        group.totalBags += b.bags;
        const rate = lotRateMap.get(lot.id) || 1200;
        group.grossAmount += b.bags * rate;
        group.batchGratuity += (b.labour_gratuity || 0);
        
        if (!group.lots.find((l: any) => l.lotId === lot.id)) {
          group.lots.push({
            lotId: lot.id,
            date: lot.date,
            stage: lot.stage,
            paddyType: lot.type,
            load_area: lot.load_area,
            mill_name: lot.mill_name,
            loaded_at: lot.loaded_at,
            vehicle_type: lot.vehicle_type,
            bags: 0,
            rate: rate,
            machine_cost: lot.machine_cost || 0,
            gratuity: lot.gratuity || 0,
            batch_gratuity: 0,
            machine_id: lot.machine_id,
            mobile: b.mobile
          });
        }
        const lotDetail = group.lots.find((l: any) => l.lotId === lot.id);
        lotDetail.bags += b.bags;
        lotDetail.batch_gratuity += (b.labour_gratuity || 0);
      }
    });

    machineLogs.forEach(ml => {
      const group = farmerGroups.get(ml.farmer_name);
      if (group) {
        group.machineLogs.push({
          farmerName: ml.farmer_name,
          amount: ml.total_amount,
          hours: ml.hours,
          date: ml.date,
          machineName: machineMap.get(ml.machine_id) || 'Unknown Machine'
        });
      }
    });

    advancesList.forEach(adv => {
      const group = farmerGroups.get(adv.farmer_name);
      if (group) {
        group.advances.push(adv);
      }
    });

    const settlements = Array.from(farmerGroups.values()).map(group => {
      const totalMachineCostFromLogs = group.machineLogs.reduce((acc: number, log: any) => acc + (log.amount || 0), 0);
      const totalMachineCostFromLots = group.lots.reduce((acc: number, lot: any) => acc + (lot.machine_cost || 0), 0);
      const totalMachineCost = totalMachineCostFromLogs + totalMachineCostFromLots;

      const totalMachineHours = group.machineLogs.reduce((acc: number, log: any) => acc + (log.hours || 0), 0);
      const totalAdvances = group.advances.reduce((acc: number, a: any) => acc + (a.amount || 0), 0);
      const totalGratuity = group.lots.reduce((acc: number, lot: any) => acc + (lot.gratuity || 0) + (lot.batch_gratuity || 0), 0);

      const netBalance = group.grossAmount - totalMachineCost - totalAdvances - totalGratuity;

      return {
        farmerName: group.farmerName,
        mobile: group.mobile,
        totalBags: group.totalBags,
        grossAmount: group.grossAmount,
        totalMachineCost,
        totalMachineHours,
        totalAdvances,
        totalGratuity,
        netBalance,
        lots: group.lots,
        advances: group.advances,
        machineLogs: group.machineLogs
      };
    });

    res.json(settlements);
  } catch (error) {
    console.error("Database error (farmer-settlements):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/trader/earnings-summary', (req, res) => {
  const { year, variety, status, traderId } = req.query;
  try {
    let conditions = ["1=1"];
    let params: any[] = [];
    if (year && year !== 'All Seasons') conditions.push(`strftime('%Y', l.date) = '${year}'`);
    if (variety && variety !== 'All Varieties') conditions.push(`l.type = '${variety}'`);
    if (traderId) {
      conditions.push(`l.trader_id = ?`);
      params.push(traderId);
    }
    if (status && status !== 'All Status') {
       if (status === 'Completed') conditions.push("l.stage = 'SETTLED'");
       else if (status === 'Processing') conditions.push("l.stage != 'SETTLED'");
    }

    const whereClause = conditions.join(" AND ");

    // 1. Get all batches joined with lots and year-specific commission rates
    const rawData = db.prepare(`
      SELECT 
        l.id as lotId,
        l.name as lotName,
        l.date as lotDate,
        strftime('%Y', l.date) as year,
        l.load_area as area,
        l.mill_name as mill,
        l.type as paddyType,
        l.stage,
        l.weight as lotWeight,
        CAST(REPLACE(REPLACE(l.amount, '₹', ''), ',', '') AS REAL) as tradeVolume,
        SUM(b.bags) as bags,
        COALESCE(cr.bag_rate, 0) as commissionRate
      FROM lots l
      LEFT JOIN batches b ON l.id = b.lotId
      LEFT JOIN commission_rates cr ON strftime('%Y', l.date) = CAST(cr.year AS TEXT)
      WHERE ${whereClause}
      GROUP BY l.id
    `).all(...params) as any[];

    // 2. Aggregate data
    const yearlyEarned: Record<string, number> = {};
    const areaWiseEarned: Record<string, number> = {};
    const millWiseEarned: Record<string, { earnings: number, lots: number }> = {};
    const varietyEarned: Record<string, number> = {};
    
    let totalProfit = 0;
    let totalRevenue = 0;

    const detailedLots = rawData.map(row => {
      const earning = (row.bags || 0) * row.commissionRate;
      const volume = row.tradeVolume || 0;
      
      yearlyEarned[row.year] = (yearlyEarned[row.year] || 0) + earning;
      areaWiseEarned[row.area || 'Unknown'] = (areaWiseEarned[row.area || 'Unknown'] || 0) + earning;
      
      if (!millWiseEarned[row.mill || 'Direct Sale']) {
        millWiseEarned[row.mill || 'Direct Sale'] = { earnings: 0, lots: 0 };
      }
      millWiseEarned[row.mill || 'Direct Sale'].earnings += earning;
      millWiseEarned[row.mill || 'Direct Sale'].lots += 1;

      varietyEarned[row.paddyType || 'Mixed'] = (varietyEarned[row.paddyType || 'Mixed'] || 0) + earning;
      
      totalProfit += earning;
      totalRevenue += volume;

      return {
        id: row.lotId,
        label: row.lotName,
        date: row.lotDate,
        variety: row.paddyType || 'Mixed',
        tonnage: row.lotWeight || '0 T',
        destination: row.mill || 'Direct Sale',
        value: earning,
        status: row.stage === 'SETTLED' ? 'COMPLETED' : 'PROCESSING'
      };
    }).sort((a, b) => b.value - a.value);

    res.json({
      revenue: totalRevenue,
      profit: totalProfit,
      years: Object.entries(yearlyEarned).map(([label, value]) => ({ label, value })).sort((a,b) => a.label.localeCompare(b.label)),
      areas: Object.entries(areaWiseEarned).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value),
      varieties: Object.entries(varietyEarned).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value),
      mills: Object.entries(millWiseEarned).map(([label, stats]) => ({ label, value: stats.earnings, lots: stats.lots })).sort((a,b) => b.value - a.value),
      lots: detailedLots,
      totalYears: Object.keys(yearlyEarned).length,
      activeLots: rawData.length
    });
  } catch (error) {
    console.error("Database error (trader-earnings):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/trader/machine-summary', (req, res) => {
  const { filter } = req.query;
  try {
    let dateCondition = "1=1";
    if (filter === 'Today') {
      dateCondition = "date(date) = date('now')";
    } else if (filter === 'Week') {
      dateCondition = "date(date) >= date('now', '-7 days')";
    } else if (filter === 'Month') {
      dateCondition = "date(date) >= date('now', 'start of month')";
    } else if (filter === 'Year') {
      dateCondition = "date(date) >= date('now', 'start of year')";
    }

    // 1. Get machine revenue and hours from machine_logs with date filter and trader isolation
    let statsQuery = `
      SELECT 
        ml.machine_id,
        SUM(ml.total_amount) as revenue,
        SUM(ml.hours) as hours,
        SUM(ml.acres) as acres,
        SUM(ml.fuel_cost) as fuel
      FROM machine_logs ml
      JOIN machines m ON ml.machine_id = m.id
      WHERE ${dateCondition}
    `;
    const statsParams: any[] = [];
    const { traderId } = req.query;
    const cleanTraderId = traderId ? cleanMachineId(traderId as string) : null;

    if (cleanTraderId) {
      statsQuery += ` AND m.trader_id = ? `;
      statsParams.push(cleanTraderId);
    }

    statsQuery += ` GROUP BY ml.machine_id `;
    const machineStats = db.prepare(statsQuery).all(...statsParams) as any[];

    // 2. Get machine details with operator info and settlement status
    const targetYear = new Date().getFullYear();
    let machineQuery = `
      SELECT m.*, o.name as operator_name, mss.settled_at, mss.is_settled
      FROM machines m
      LEFT JOIN operators o ON m.operator = o.id
      LEFT JOIN machine_settlement_status mss ON m.id = mss.machine_id AND mss.year = ?
      `;
      const machineParams: any[] = [targetYear];

    if (cleanTraderId) {
      machineQuery += ` WHERE m.trader_id = ? `;
      machineParams.push(cleanTraderId);
    }

    const machines = db.prepare(machineQuery).all(...machineParams) as any[];

    const machineTypes = [...new Set(machines.map(m => m.model))];

    const totalRevenue = machineStats.reduce((acc, m) => acc + (m.revenue || 0), 0);
    const totalFuel = machineStats.reduce((acc, m) => acc + (m.fuel || 0), 0);
    const totalProfit = totalRevenue - totalFuel;

    const highlights = machineStats.map(stat => {
      const machine = machines.find(m => m.id === stat.machine_id);
      return {
        id: stat.machine_id,
        name: machine?.name || 'Unknown',
        operatorName: machine?.operator_name || 'No Operator',
        type: machine?.model || 'Other',
        hours: `${stat.hours || 0} hrs`,
        acres: `${stat.acres || 0} ac`,
        revenue: `₹${(stat.revenue || 0).toLocaleString()}`,
        status: machine?.status || 'IDLE',
        is_settled: machine?.is_settled || 0,
        settled_at: machine?.settled_at
      };
    }).sort((a,b) => parseFloat(b.revenue.replace(/[^0-9.-]+/g,"")) - parseFloat(a.revenue.replace(/[^0-9.-]+/g,""))).slice(0, 3);

    const fleet = machines.map(m => {
      const stat = machineStats.find(s => s.machine_id === m.id);
      return {
         id: m.id,
         name: m.name,
         type: m.model,
         operatorName: m.operator_name || 'No Operator',
         hours: `${stat?.hours || 0} hrs`,
         acres: `${stat?.acres || 0} ac`,
         revenue: `₹${(stat?.revenue || 0).toLocaleString()}`,
         efficiency: stat?.hours ? `${Math.round(((stat.acres || 0) / stat.hours) * 100)}%` : '0%',
         status: m.status,
         is_settled: m.is_settled || 0,
         settled_at: m.settled_at
      };
    });

    res.json({
      totalRevenue: `₹${totalRevenue.toLocaleString()}`,
      operatingExpenses: `₹${totalFuel.toLocaleString()}`,
      netProfit: `₹${totalProfit.toLocaleString()}`,
      machineTypes,
      highlights,
      fleet
    });
  } catch (error) {
    console.error("Database error (trader-machine-earnings):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/farmer-advances', (req, res) => {
  const { farmer_name, amount, date, description, lotId, traderId } = req.body;
  if (!farmer_name || !amount || !date) {
    return res.status(400).json({ error: 'Farmer name, amount, and date are required' });
  }

  try {
    // Verify lot ownership if lotId is provided
    if (lotId && traderId) {
      const lot = db.prepare('SELECT trader_id FROM lots WHERE id = ?').get(lotId) as any;
      if (lot && lot.trader_id && lot.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied: Unauthorized lot access' });
      }
    }

    const insert = db.prepare(`
      INSERT INTO farmer_advances (farmer_name, amount, date, description, lotId)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insert.run(farmer_name, amount, date, description || '', lotId || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Database error (farmer-advances):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/lots/:id/machine-cost', (req, res) => {
  const { id } = req.params;
  const { machine_cost, machine_id, machine_hours, machine_rate } = req.body;
  const traderId = req.query.traderId as string;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (machine_cost !== undefined) {
      updates.push('machine_cost = ?');
      params.push(machine_cost);
    }
    if (machine_id !== undefined) {
      updates.push('machine_id = ?');
      params.push(machine_id);
    }
    if (machine_hours !== undefined) {
      updates.push('machine_hours = ?');
      params.push(machine_hours);
    }
    if (machine_rate !== undefined) {
      updates.push('machine_rate = ?');
      params.push(machine_rate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    params.push(id);
    let sql = `UPDATE lots SET ${updates.join(', ')} WHERE id = ?`;
    if (req.query.traderId) {
       sql += ` AND trader_id = ?`;
       params.push(req.query.traderId);
    }
    const result = db.prepare(sql).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json({ success: true, machine_cost, machine_id, machine_hours, machine_rate });
  } catch (error) {
    console.error("Database error (machine-cost update):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// MACHINE Endpoints

app.get('/api/machines', (req, res) => {
  const { date, includeSettled, traderId } = req.query;
  try {
    const targetDate = typeof date === 'string' ? date : new Date().toLocaleDateString('en-CA');
    const targetYear = targetDate.split('-')[0];

    let query = `
      SELECT m.*, 
      (SELECT COUNT(*) FROM machine_advances WHERE machine_id = m.id AND date LIKE ?) as todayAdvanceCount,
      (SELECT COALESCE(SUM(amount), 0) FROM machine_advances WHERE machine_id = m.id AND date LIKE ?) as dailyAdvanceAmount,
      (SELECT COALESCE(SUM(amount), 0) FROM machine_advances WHERE machine_id = m.id) as totalAdvanceAmount,
      (SELECT COALESCE(SUM(hours), 0) FROM machine_logs WHERE machine_id = m.id AND date = ?) as dailyHours,
      (SELECT COALESCE(SUM(acres), 0) FROM machine_logs WHERE machine_id = m.id AND date = ?) as dailyAcres,
      (SELECT COALESCE(SUM(hours), 0) FROM machine_logs WHERE machine_id = m.id) as totalHours,
      (SELECT COALESCE(SUM(acres), 0) FROM machine_logs WHERE machine_id = m.id) as totalAcres,
      COALESCE((SELECT is_settled FROM machine_settlement_status WHERE machine_id = m.id AND year = ?), 0) as is_settled_year
      FROM machines m
      WHERE 1=1
    `;
    const params: any[] = [`${targetDate}%`, `${targetDate}%`, targetDate, targetDate, targetYear];

    if (traderId) {
      query += ` AND m.trader_id = ? `;
      params.push(traderId);
    }

    const machines = db.prepare(query).all(...params) as any[];

    // Filter out machines settled for this specific year, unless includeSettled is true
    const filteredMachines = includeSettled === 'true' 
      ? machines 
      : machines.filter(m => Number(m.is_settled_year) === 0);
    
    res.json(filteredMachines);
  } catch (error) {
    console.error("Database error (get machines):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machines/:id', (req, res) => {
  const { id } = req.params;
  const today = new Date().toLocaleDateString('en-CA');
  try {
    const cleanId = cleanMachineId(id);
    console.log(`[GET] Fetching machine: "${cleanId}" (original: "${id}")`);
    const machine = db.prepare(`
      SELECT m.*, 
      (SELECT COUNT(*) FROM machine_advances WHERE machine_id = m.id AND date LIKE ?) as todayAdvanceCount
      FROM machines m 
      WHERE m.id = ?
    `).get(`${today}%`, cleanId);
    
    if (!machine) {
      console.warn(`[GET] Machine not found: "${cleanId}"`);
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(machine);
  } catch (error: any) {
    console.error("Database error (get machine):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/machines', (req, res) => {
  const { id, name, model, status, operator, image, owner_name, owner_mobile, per_hour_rate, registration_date, traderId } = req.body;
  try {
    const insert = db.prepare('INSERT INTO machines (id, name, model, status, operator, image, owner_name, owner_mobile, per_hour_rate, registration_date, trader_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insert.run(id, name, model, status || 'IDLE', operator || '', image || '', owner_name || '', owner_mobile || '', per_hour_rate || 1200, registration_date || null, traderId || null);
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (post machine):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/machines/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const traderId = req.query.traderId as string;
  try {
    let query = 'UPDATE machines SET status = ? WHERE id = ?';
    const params = [status, id];
    if (traderId) {
      query += ' AND trader_id = ?';
      params.push(traderId);
    }
    const update = db.prepare(query);
    const result = update.run(...params);
    if (result.changes === 0) return res.status(404).json({ error: 'Machine not found or access denied' });
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (patch machine status):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/machines/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rate } = req.body;
  const traderId = req.query.traderId as string;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  try {
    const cleanId = cleanMachineId(id);
    const { traderId } = req.query;
    
    let machineQuery = 'UPDATE machines SET per_hour_rate = ? WHERE id = ?';
    const machineParams = [rate, cleanId];
    if (traderId) {
      machineQuery += ' AND trader_id = ?';
      machineParams.push(traderId);
    }
    const updateMachine = db.prepare(machineQuery);
    const mResult = updateMachine.run(...machineParams);

    if (mResult.changes > 0) {
      // Also update all logs for today for this machine to match the new rate and amount
      let logsQuery = `
        UPDATE machine_logs 
        SET 
          rate = ?, 
          total_amount = (COALESCE(hours, (end_reading - start_reading))) * ? 
        WHERE machine_id = ? AND date = ?
      `;
      const logsParams = [rate, rate, cleanId, today];
      if (traderId) {
        logsQuery += ' AND trader_id = ?';
        logsParams.push(traderId);
      }
      const updateLogs = db.prepare(logsQuery);
      updateLogs.run(...logsParams);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Database error (patch machine rate):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machine-logs', (req, res) => {
  const { traderId } = req.query;
  try {
    let query = 'SELECT * FROM machine_logs';
    let params: any[] = [];
    if (traderId) {
      const cleanId = cleanMachineId(traderId as string);
      query += ' WHERE trader_id = ?';
      params.push(cleanId);
    }
    query += ' ORDER BY date DESC';
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    console.error("Database error (get all machine logs):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machine-logs/:machineId', (req, res) => {
  const { machineId } = req.params;
  const { traderId } = req.query;
  try {
    const cleanId = cleanMachineId(machineId);
    
    // Check machine ownership if traderId provided
    if (traderId) {
      const machine = db.prepare('SELECT trader_id FROM machines WHERE id = ?').get(cleanId) as any;
      if (machine && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const logs = db.prepare('SELECT * FROM machine_logs WHERE machine_id = ? ORDER BY date DESC').all(cleanId);
    res.json(logs);
  } catch (error: any) {
    console.error("Database error (get machine logs):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/machine-logs', (req, res) => {
  const { machine_id, farmer_name, date, start_reading, end_reading, hours, acres, fuel_cost, rate, total_amount, farmer_mobile, location, start_time, end_time, traderId } = req.body;
  
  try {
    const cleanId = cleanMachineId(machine_id);
    
    // Check machine ownership if traderId provided
    const machine = db.prepare('SELECT is_settled, trader_id FROM machines WHERE id = ?').get(cleanId) as any;
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    
    if (traderId && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
      return res.status(403).json({ error: 'Access denied: Machine belongs to another trader' });
    }

    if (machine.is_settled) {
      return res.status(403).json({ error: 'This machine is already settled and locked. No new logs can be added.' });
    }

    const insert = db.prepare(`
      INSERT INTO machine_logs (machine_id, farmer_name, date, start_reading, end_reading, hours, acres, fuel_cost, rate, total_amount, farmer_mobile, location, start_time, end_time, trader_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(cleanId, farmer_name, date, start_reading || null, end_reading || null, hours || null, acres || 0, fuel_cost || 0, rate || 0, total_amount, farmer_mobile || null, location || null, start_time || null, end_time || null, traderId || null);
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (post machine log):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// MILL Endpoints

app.get('/api/silos', (req, res) => {
    const traderId = req.query.traderId;
    
    try {
        let query = 'SELECT * FROM silos';
        let params = [];
        
        if (traderId) {
            query += ' WHERE trader_id = ?';
            params.push(traderId);
        }
        
        const silos = db.prepare(query).all(...params);
        res.json(silos);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/mills', (req, res) => {
  const { traderId } = req.query;
  try {
    let query = 'SELECT * FROM mills WHERE 1=1';
    const params: any[] = [];
    if (traderId) {
      query += ' AND trader_id = ?';
      params.push(traderId);
    }
    query += ' ORDER BY name ASC';
    const mills = db.prepare(query).all(...params);
    res.json(mills);
  } catch (error) {
    console.error("Database error (get mills):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/mills', (req, res) => {
  const { id, name, location, contact_person, phone, email, traderId } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'ID and Name are required' });
  }

  try {
    const registration_date = new Date().toISOString().split('T')[0];
    const insert = db.prepare(`
      INSERT INTO mills (id, name, location, contact_person, phone, email, registration_date, trader_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, name, location || '', contact_person || '', phone || '', email || '', registration_date, traderId || null);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return res.status(400).json({ error: 'Mill ID already exists' });
    }
    console.error("Database error (post mill):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/mills/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    let query = 'DELETE FROM mills WHERE id = ?';
    const params = [id];
    if (traderId) {
      query += ' AND trader_id = ?';
      params.push(traderId);
    }
    const result = db.prepare(query).run(...params);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mill not found or access denied' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (delete mill):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/machine-logs/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    const cleanId = cleanMachineId(id);
    console.log(`[DELETE] Request to remove log ID: "${cleanId}"`);
    
    let query = 'DELETE FROM machine_logs WHERE id = ?';
    const params = [cleanId];
    if (traderId) {
      query += ' AND trader_id = ?';
      params.push(traderId);
    }
    
    const del = db.prepare(query);
    const result = del.run(...params);
    console.log(`[DELETE] Result for ID "${cleanId}":`, result);
    
    if (result.changes === 0) {
      const resultNum = del.run(Number(cleanId), traderId);
      if (resultNum.changes === 0) {
        return res.status(404).json({ error: 'Record not found in database' });
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Database error (delete machine log):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.delete('/api/machine-advances/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    const cleanId = cleanMachineId(id);
    
    if (traderId) {
      // Verify machine ownership via joining
      const machine = db.prepare(`
        SELECT m.trader_id FROM machine_advances a
        JOIN machines m ON a.machine_id = m.id
        WHERE a.id = ?
      `).get(cleanId) as any;
      if (machine && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied: Unauthorized access to this advance record' });
      }
    }

    console.log(`[DELETE] Request to remove advance ID: "${cleanId}"`);
    const del = db.prepare('DELETE FROM machine_advances WHERE id = ?');
    const result = del.run(cleanId);
    
    if (result.changes === 0) {
      const resultNum = del.run(Number(cleanId));
      if (resultNum.changes === 0) return res.status(404).json({ error: 'Advance not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Database error (delete machine advance):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.get('/api/machine-settlements', (req, res) => {
  const { year, traderId } = req.query;
  const targetYear = year || new Date().getFullYear().toString();
  const tId = traderId ? cleanMachineId(traderId as string) : null;

  try {
    // Earnings and Hours from machine_logs filtered by year and trader
    let logsQuery = `SELECT machine_id, SUM(total_amount) as totalEarnings, SUM(hours) as totalHours FROM machine_logs WHERE date LIKE ?`;
    let logsParams = [`${targetYear}-%`];
    if (tId) {
      logsQuery += ` AND trader_id = ?`;
      logsParams.push(tId);
    }
    const earnings = db.prepare(logsQuery + ' GROUP BY machine_id').all(...logsParams) as any[];

    // Advances from machine_advances filtered by year and trader
    let advQuery = `SELECT machine_id, SUM(amount) as totalAdvances FROM machine_advances WHERE date LIKE ?`;
    let advParams = [`${targetYear}-%`];
    if (tId) {
      advQuery += ` AND trader_id = ?`;
      advParams.push(tId);
    }
    const advances = db.prepare(advQuery + ' GROUP BY machine_id').all(...advParams) as any[];

    // Activity Timeline from machine_logs
    let activityQuery = `SELECT machine_id, date FROM machine_logs WHERE date LIKE ?`;
    if (tId) activityQuery += ` AND trader_id = ?`;
    const activities = db.prepare(activityQuery).all(...logsParams) as any[];

    // Fetch only machines that have activity in the target year or were settled
    const activeMachineIds = Array.from(new Set([
      ...earnings.map(e => e.machine_id),
      ...advances.map(a => a.machine_id)
    ]));

    if (activeMachineIds.length === 0) {
      return res.json([]);
    }

    const placeholders = activeMachineIds.map(() => '?').join(',');
    let machineQuery = `
      SELECT m.*, 
      COALESCE(mss.is_settled, 0) as is_settled_year,
      mss.settled_at
      FROM machines m
      LEFT JOIN machine_settlement_status mss ON m.id = mss.machine_id AND mss.year = ?
      WHERE m.id IN (${placeholders})
    `;
    const machineParams = [targetYear, ...activeMachineIds];

    if (tId) {
      machineQuery += ` AND m.trader_id = ? `;
      machineParams.push(tId);
    }

    const machines = db.prepare(machineQuery).all(...machineParams) as any[];

    // Fetch mission rate for the year
    const commissionRow = db.prepare('SELECT machine_hour_rate FROM commission_rates WHERE year = ?').get(targetYear) as { machine_hour_rate: number } | undefined;
    const commissionRate = commissionRow ? commissionRow.machine_hour_rate : 0;

    const settlements = machines.map(m => {
      const e = earnings.find(earning => earning.machine_id === m.id);
      const a = advances.find(adv => adv.machine_id === m.id);
      
      const totalEarnings = e ? e.totalEarnings : 0;
      const totalHours = e ? e.totalHours : 0;
      const totalAdvances = a ? a.totalAdvances : 0;
      const totalDealerCommission = totalHours * commissionRate;
      
      return {
        ...m,
        is_settled: m.is_settled_year, // Override global status with year-specific one
        totalEarnings,
        totalHours,
        totalAdvances,
        totalDealerCommission,
        netBalance: totalEarnings - totalAdvances - totalDealerCommission,
        activeDates: activities.filter(act => act.machine_id === m.id).map(act => act.date)
      };
    });

    res.json(settlements);
  } catch (error) {
    console.error("Database error (machine-settlements):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machine-advances/:machineId', (req, res) => {
  const { machineId } = req.params;
  try {
    const cleanId = cleanMachineId(machineId);
    console.log(`[GET] Machine advances for: "${cleanId}" (original: "${machineId}")`);
    const advances = db.prepare('SELECT * FROM machine_advances WHERE machine_id = ? ORDER BY date DESC').all(cleanId);
    console.log(`[GET] Found ${advances.length} advances for "${cleanId}"`);
    res.json(advances);
  } catch (error: any) {
    console.error("Database error (get machine advances):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/machine-advances', (req, res) => {
  const { machine_id, amount, date, description, traderId } = req.body;
  try {
    const cleanId = cleanMachineId(machine_id);
    // Verify machine ownership
    const machine = db.prepare('SELECT is_settled, trader_id FROM machines WHERE id = ?').get(cleanId) as { is_settled: number, trader_id: string | number } | undefined;
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    
    if (traderId && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
       return res.status(403).json({ error: 'Access denied: Unauthorized machine access' });
    }

    if (machine.is_settled) {
      return res.status(403).json({ error: 'This machine is already settled. No new advances can be added.' });
    }

    const insert = db.prepare('INSERT INTO machine_advances (machine_id, amount, date, description) VALUES (?, ?, ?, ?)');
    insert.run(cleanId, amount, date, description || '');
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (machine-advances):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// Machine Settlement Action (Year-Aware)
app.post('/api/machines/:id/settle', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  const { year } = req.query;
  const targetYear = year || new Date().getFullYear().toString();

  try {
    const cleanId = cleanMachineId(id);
    
    // Verify ownership
    if (traderId) {
      const machine = db.prepare('SELECT trader_id FROM machines WHERE id = ?').get(cleanId) as any;
      if (machine && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied: Unauthorized machine access' });
      }
    }

    console.log(`[POST] Settling machine: "${cleanId}" (original: "${id}") for year ${targetYear}`);
    db.prepare(`
      INSERT INTO machine_settlement_status (machine_id, year, is_settled, settled_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(machine_id, year) DO UPDATE SET is_settled = 1, settled_at = excluded.settled_at
    `).run(cleanId, targetYear, new Date().toISOString());
    
    res.json({ success: true, message: `Machine settled for ${targetYear}` });
  } catch (error: any) {
    console.error(`[CRITICAL] Settlement failure for machine "${id}":`, error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Machine Reopen Action (Year-Aware)
app.post('/api/machines/:id/reopen', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  const { year } = req.query;
  const currentYear = new Date().getFullYear();
  const targetYearNum = parseInt(year as string) || currentYear;
  const targetYear = targetYearNum.toString();

  // Restriction: Only allow reopening for current year or 1 year back
  if (targetYearNum < currentYear - 1) {
    return res.status(403).json({ 
      error: 'Legacy Session Locked', 
      message: 'Reopening ledgers is only permitted for the current and previous seasonal sessions (2-year window).' 
    });
  }

  try {
    const cleanId = cleanMachineId(id);
    
    // Verify ownership
    if (traderId) {
      const machine = db.prepare('SELECT trader_id FROM machines WHERE id = ?').get(cleanId) as any;
      if (machine && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied: Unauthorized machine access' });
      }
    }

    console.log(`[POST] Reopening machine: "${cleanId}" (original: "${id}") for year ${targetYear}`);
    db.prepare(`
      INSERT INTO machine_settlement_status (machine_id, year, is_settled, settled_at)
      VALUES (?, ?, 0, ?)
      ON CONFLICT(machine_id, year) DO UPDATE SET is_settled = 0, settled_at = excluded.settled_at
    `).run(cleanId, targetYear, new Date().toISOString());
    
    res.json({ success: true, message: `Machine ledger reopened for ${targetYear}` });
  } catch (error: any) {
    console.error(`[CRITICAL] Reopen failure for machine "${id}":`, error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Machine Settlement Report (Year-Aware)
app.get('/api/machine-report/:id', (req, res) => {
  const { id } = req.params;
  const { year } = req.query;
  const targetYear = year || new Date().getFullYear().toString();

  try {
    const cleanId = cleanMachineId(id);
    const { traderId } = req.query;
    console.log(`[GET] Machine report for: "${cleanId}" (original: "${id}")`);
    const machine = db.prepare(`
      SELECT m.*, COALESCE(mss.is_settled, 0) as year_settled, mss.settled_at as year_settled_at
      FROM machines m
      LEFT JOIN machine_settlement_status mss ON m.id = mss.machine_id AND mss.year = ?
      WHERE m.id = ?
    `).get(targetYear, cleanId) as any;
    
    if (!machine) {
      console.warn(`[GET] Machine report not found: "${cleanId}"`);
      return res.status(404).json({ error: 'Machine not found' });
    }

    if (traderId && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = db.prepare('SELECT * FROM machine_logs WHERE machine_id = ? AND date LIKE ? ORDER BY date DESC').all(cleanId, `${targetYear}-%`) as any[];
    const advances = db.prepare('SELECT * FROM machine_advances WHERE machine_id = ? AND date LIKE ? ORDER BY date DESC').all(cleanId, `${targetYear}-%`) as any[];
    
    // Fetch commission rate for the year
    const commissionRow = db.prepare('SELECT machine_hour_rate FROM commission_rates WHERE year = ?').get(targetYear) as { machine_hour_rate: number } | undefined;
    const commissionRate = commissionRow ? commissionRow.machine_hour_rate : 0;

    const totalEarnings = logs.reduce((sum, log) => sum + (log.total_amount || 0), 0);
    const totalAdvances = advances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
    const totalHours = logs.reduce((sum, log) => sum + (log.hours || 0), 0);
    const totalDealerCommission = totalHours * commissionRate;

    // Patch the machine object to use the year-specific status for the frontend
    const reportMachine = {
      ...machine,
      is_settled: machine.year_settled,
      settled_at: machine.year_settled_at
    };

    res.json({
      machine: reportMachine,
      logs,
      advances,
      totalEarnings,
      totalAdvances,
      commissionRate,
      totalDealerCommission,
      netBalance: totalEarnings - totalAdvances - totalDealerCommission
    });
  } catch (error: any) {
    console.error(`[CRITICAL] Report generation failure for machine "${id}":`, error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DELETE Machine and associated data
app.delete('/api/machines/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    const cleanId = cleanMachineId(id);
    console.log(`[DELETE] Request to remove machine entity: "${cleanId}" (original: "${id}")`);
    
    db.transaction(() => {
      // Verify ownership if traderId is provided
      if (traderId) {
        const m = db.prepare('SELECT trader_id FROM machines WHERE id = ?').get(cleanId) as any;
        if (m && m.trader_id && m.trader_id.toString() !== traderId.toString()) {
          throw new Error('Access denied: Unauthorized to delete this machine');
        }
      }

      // 1. Remove operational logs
      db.prepare('DELETE FROM machine_logs WHERE machine_id = ?').run(cleanId);
      
      // 2. Remove financial advances
      db.prepare('DELETE FROM machine_advances WHERE machine_id = ?').run(cleanId);
      
      // 3. Remove settlement status (Foreign Key dependency)
      db.prepare('DELETE FROM machine_settlement_status WHERE machine_id = ?').run(cleanId);
      
      // 4. Decouple from lots (Optional, but prevents constraint violations)
      db.prepare('UPDATE lots SET machine_id = NULL WHERE machine_id = ?').run(cleanId);
      
      // 5. Finalize machine removal
      const result = db.prepare('DELETE FROM machines WHERE id = ?').run(cleanId);
      
      if (result.changes === 0) {
        throw new Error(`Machine ${cleanId} not found in master registry`);
      }
    })();
    
    res.json({ success: true, message: 'Machine and all associated operational history deleted successfully' });
  } catch (error: any) {
    console.error(`[CRITICAL] Deletion failure for machine "${id}":`, error);
    res.status(500).json({ 
      error: 'Delete Failed', 
      message: error.message || 'Internal logic error during database transaction' 
    });
  }
});

// DELETE Lot and associated data
app.delete('/api/lots/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    db.transaction(() => {
      if (traderId) {
        const l = db.prepare('SELECT trader_id FROM lots WHERE id = ?').get(id) as any;
        if (l && l.trader_id && l.trader_id.toString() !== traderId.toString()) {
          throw new Error('Access denied: Unauthorized to delete this lot');
        }
      }
      db.prepare('DELETE FROM batches WHERE lotId = ?').run(id);
      db.prepare('DELETE FROM lot_rates WHERE lotId = ?').run(id);
      db.prepare('DELETE FROM lots WHERE id = ?').run(id);
    })();
    res.json({ success: true, message: 'Lot and associated data deleted successfully' });
  } catch (error) {
    console.error("Database error (delete lot):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// GET settled farmer names for a year
app.get('/api/farmer-settlements/status', (req, res) => {
  const { year } = req.query as { year?: string };
  if (!year) return res.status(400).json({ error: 'year is required' });
  try {
    const rows = db.prepare(
      "SELECT farmer_name, settled_at FROM farmer_settlement_status WHERE year = ? AND is_settled = 1"
    ).all(year) as { farmer_name: string; settled_at: string }[];
    res.json({
      settledFarmers: rows.map(r => r.farmer_name),
      settledDates: Object.fromEntries(rows.map(r => [r.farmer_name, r.settled_at]))
    });
  } catch (error) {
    console.error("Database error (get settlement status):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// POST: Mark farmer as settled
app.post('/api/farmer-settlements/settle', (req, res) => {
  const { farmer_name, year, traderId } = req.body;
  if (!farmer_name || !year) return res.status(400).json({ error: 'farmer_name and year are required' });
  try {
    // Verify ownership of at least one lot for this farmer
    if (traderId) {
      const lot = db.prepare(`
        SELECT l.id FROM lots l 
        JOIN batches b ON l.id = b.lotId 
        WHERE b.name = ? AND l.trader_id = ?
        LIMIT 1
      `).get(farmer_name, traderId);
      if (!lot) {
        return res.status(403).json({ error: 'Access denied: No data found for this farmer under your account' });
      }
    }

    db.prepare(`
      INSERT INTO farmer_settlement_status (farmer_name, year, is_settled, settled_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(farmer_name, year) DO UPDATE SET is_settled = 1, settled_at = excluded.settled_at
    `).run(farmer_name, year, new Date().toISOString());
    res.json({ success: true, farmer_name, year, is_settled: true });
  } catch (error) {
    console.error("Database error (settle farmer):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// POST: Reopen (unsettle) farmer
app.post('/api/farmer-settlements/reopen', (req, res) => {
  const { farmer_name, year, traderId } = req.body;
  if (!farmer_name || !year) return res.status(400).json({ error: 'farmer_name and year are required' });
  try {
    // Verify ownership of at least one lot for this farmer
    if (traderId) {
      const lot = db.prepare(`
        SELECT l.id FROM lots l 
        JOIN batches b ON l.id = b.lotId 
        WHERE b.name = ? AND l.trader_id = ?
        LIMIT 1
      `).get(farmer_name, traderId);
      if (!lot) {
        return res.status(403).json({ error: 'Access denied: No data found for this farmer under your account' });
      }
    }

    db.prepare(`
      INSERT INTO farmer_settlement_status (farmer_name, year, is_settled, settled_at)
      VALUES (?, ?, 0, ?)
      ON CONFLICT(farmer_name, year) DO UPDATE SET is_settled = 0, settled_at = excluded.settled_at
    `).run(farmer_name, year, new Date().toISOString());
    res.json({ success: true, farmer_name, year, is_settled: false });
  } catch (error) {
    console.error("Database error (reopen farmer):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// MILL SETTLEMENT Endpoints

app.get('/api/mill-settlements', (req, res) => {
  const { year, traderId } = req.query;
  const targetYear = year || new Date().getFullYear().toString();

  try {
    let query = `
      SELECT 
        m.id,
        m.name,
        m.location,
        m.contact_person,
        m.phone,
        COALESCE(delivery_stats.totalBags, 0) as totalBags,
        COALESCE(delivery_stats.netAmount, 0) as totalDeliveredAmount,
        COALESCE(delivery_stats.settledLots, 0) as settledLots,
        COALESCE(delivery_stats.pendingLots, 0) as pendingLots,
        COALESCE(payment_stats.totalPaid, 0) as totalPaidAmount,
        COALESCE(mss.is_settled, 0) as is_settled
      FROM mills m
      LEFT JOIN (
        SELECT 
          lot_summary.mill_name,
          SUM(lot_summary.bags) as totalBags,
          SUM(
            CASE 
              WHEN lot_summary.manual_deductions_applied = 1 THEN 
                lot_summary.gross - (COALESCE(lot_summary.moisture_loss, 0) + COALESCE(lot_summary.bag_penalty, 0) + COALESCE(lot_summary.labor_cost, 0))
              ELSE 
                lot_summary.gross
            END
          ) as netAmount,
          COUNT(DISTINCT CASE WHEN lot_summary.stage = 'SETTLED' THEN lot_summary.id END) as settledLots,
          COUNT(DISTINCT CASE WHEN lot_summary.stage != 'SETTLED' OR lot_summary.stage IS NULL THEN lot_summary.id END) as pendingLots
        FROM (
          SELECT 
            l.id,
            l.mill_name,
            l.stage,
            SUM(b.bags) as bags,
            SUM(b.bags * COALESCE(lr.rate, 1200) + b.bags * COALESCE(cr.bag_rate, 0) + b.bags * COALESCE(cr.labour_rate, 0)) as gross,
            AVG(CAST(REPLACE(b.moisture, '%', '') AS REAL)) as avg_moisture,
            COALESCE(l.manual_deductions_applied, 0) as manual_deductions_applied,
            l.moisture_loss,
            l.bag_penalty,
            l.labor_cost
          FROM lots l
          JOIN batches b ON l.id = b.lotId
          LEFT JOIN lot_rates lr ON l.id = lr.lotId
          LEFT JOIN commission_rates cr ON CAST(SUBSTR(l.date, 1, 4) AS INTEGER) = cr.year
          WHERE l.date LIKE ? `;
    
    const params: any[] = [`${targetYear}-%`];
    
    if (traderId) {
      query += ` AND l.trader_id = ? `;
      params.push(traderId);
    }
    
    query += `
          GROUP BY l.id
        ) as lot_summary
        GROUP BY lot_summary.mill_name
      ) as delivery_stats ON LOWER(m.name) = LOWER(delivery_stats.mill_name)
      LEFT JOIN (
        SELECT 
          mill_id,
          SUM(amount) as totalPaid
        FROM mill_payments
        WHERE date LIKE ?
        GROUP BY mill_id
      ) as payment_stats ON m.id = payment_stats.mill_id
      LEFT JOIN mill_settlement_status mss ON m.id = mss.mill_id AND mss.year = ?
      WHERE 1=1
    `;
    
    params.push(`${targetYear}-%`, targetYear);

    if (traderId) {
      query += ` AND m.trader_id = ? `;
      params.push(traderId);
    }

    query += ` ORDER BY m.name ASC `;

    const settlements = db.prepare(query).all(...params) as any[];

    const results = settlements.map(s => ({
      ...s,
      netBalance: s.totalDeliveredAmount - s.totalPaidAmount
    }));

    res.json(results);
  } catch (error) {
    console.error("Database error (mill-settlements):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/mill-settlements/:millId', (req, res) => {
  const { millId } = req.params;
  const { year, traderId } = req.query;
  const targetYear = year || new Date().getFullYear().toString();

  try {
    const mill = db.prepare('SELECT * FROM mills WHERE id = ?').get(millId) as any;
    if (!mill) return res.status(404).json({ error: 'Mill not found' });

    // Verify ownership
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) {
      return res.status(403).json({ error: 'Access denied: Unauthorized mill access' });
    }

    const lots = db.prepare(`
      SELECT 
        l.*, 
        SUM(b.bags) as totalBags, 
        CASE 
          WHEN l.post_load_scale > 0 AND l.pre_load_scale > 0 THEN (l.post_load_scale - l.pre_load_scale)
          ELSE (SUM(b.bags) * 73.0)
        END as totalWeightKgs,
        CASE 
          WHEN l.post_load_scale > 0 AND l.pre_load_scale > 0 THEN (l.post_load_scale - l.pre_load_scale) / 1000.0
          ELSE (SUM(b.bags) * 73.0 / 1000.0)
        END as totalWeightTons,
        (SELECT paddyType FROM batches WHERE lotId = l.id LIMIT 1) as paddyType,
        CASE 
          WHEN l.post_load_scale > 0 AND l.pre_load_scale > 0 THEN 
            ((l.post_load_scale - l.pre_load_scale) * (COALESCE(lr.rate, 1200) / 73.0)) + (SUM(b.bags) * COALESCE(cr.bag_rate, 0)) + (SUM(b.bags) * COALESCE(cr.labour_rate, 0))
          ELSE 
            (SUM(b.bags) * COALESCE(lr.rate, 1200)) + (SUM(b.bags) * COALESCE(cr.bag_rate, 0)) + (SUM(b.bags) * COALESCE(cr.labour_rate, 0))
        END as totalAmount,
        AVG(CAST(REPLACE(b.moisture, '%', '') AS REAL)) as avgMoisture,
        COALESCE(lr.rate, 1200) as paddyRate,
        cr.bag_rate as dealer_commission_rate,
        cr.labour_rate as labour_commission_rate
      FROM lots l
      JOIN batches b ON l.id = b.lotId
      LEFT JOIN lot_rates lr ON l.id = lr.lotId
      LEFT JOIN commission_rates cr ON CAST(SUBSTR(l.date, 1, 4) AS INTEGER) = cr.year
      WHERE LOWER(l.mill_name) = LOWER(?) AND l.date LIKE ?
      GROUP BY l.id
      ORDER BY l.date DESC
    `).all(mill.name, `${targetYear}-%`);

    const payments = db.prepare('SELECT * FROM mill_payments WHERE mill_id = ? AND date LIKE ? ORDER BY date DESC').all(millId, `${targetYear}-%`);

    const totalDelivered = lots.reduce((sum: number, lot: any) => sum + (lot.totalAmount || 0), 0);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Get settlement status for this year
    const statusRow = db.prepare('SELECT is_settled, settled_at FROM mill_settlement_status WHERE mill_id = ? AND year = ?').get(millId, targetYear) as any;

    res.json({
      mill,
      lots,
      payments,
      summary: {
        totalDelivered,
        totalPaid,
        netBalance: totalDelivered - totalPaid,
        is_settled: statusRow ? statusRow.is_settled : 0,
        settled_at: statusRow ? statusRow.settled_at : null
      }
    });
  } catch (error) {
    console.error("Database error (mill-settlement details):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// UPDATE lot deductions
app.patch('/api/lots/:lotId/deductions', (req, res) => {
    const { lotId } = req.params;
    const { moisture_loss, bag_penalty, labor_cost } = req.body;
    const traderId = req.query.traderId as string;
    try {
      let query = `
        UPDATE lots SET 
          moisture_loss = ?, 
          bag_penalty = ?, 
          labor_cost = ?,
          manual_deductions_applied = 1
        WHERE id = ?
      `;
      const params = [moisture_loss, bag_penalty, labor_cost, lotId];
      if (traderId) {
        query += ' AND trader_id = ?';
        params.push(traderId);
      }
      const update = db.prepare(query);
      const result = update.run(...params);
      if (result.changes === 0) return res.status(404).json({ error: 'Lot not found or access denied' });
      res.json({ success: true });
  } catch (error) {
    console.error("Database error (update lot deductions):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/lots/:id/settle', (req, res) => {
  try {
    const { id } = req.params;
    const { settled_at } = req.body;
    const traderId = req.query.traderId as string;
    
    let query = 'UPDATE lots SET stage = ?, settled_at = ? WHERE id = ?';
    const params = ['SETTLED', settled_at || new Date().toISOString(), id];
    if (traderId) {
       query += ' AND trader_id = ?';
       params.push(traderId);
    }
    const result = db.prepare(query).run(...params);
      
    if (result.changes === 0) return res.status(404).json({ error: 'Lot not found or access denied' });
    res.json({ success: true, message: 'Lot settled successfully' });
  } catch (err: any) {
    console.error("Database error (settle lot):", err);
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/mill-payments/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    if (traderId) {
       // Verify mill ownership via joining
       const mill = db.prepare(`
         SELECT m.trader_id FROM mill_payments p
         JOIN mills m ON p.mill_id = m.id
         WHERE p.id = ?
       `).get(id) as any;
       if (mill && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) {
          return res.status(403).json({ error: 'Access denied: Unauthorized access to this payment record' });
       }
    }

    const result = db.prepare('DELETE FROM mill_payments WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ success: true, message: 'Remittance entry deleted successfully' });
  } catch (error) {
    console.error("Database error (delete mill-payment):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/mill-payments', (req, res) => {
  const { mill_id, amount, date, description, lot_id, traderId } = req.body;
  const { year } = req.query; // Optional year query to check settlement
  const targetYear = year || new Date(date).getFullYear().toString();

  if (!mill_id || !amount || !date) {
    return res.status(400).json({ error: 'Mill ID, amount, and date are required' });
  }
  try {
    // Verify mill ownership
    const mill = db.prepare('SELECT trader_id FROM mills WHERE id = ?').get(mill_id) as any;
    if (!mill) return res.status(404).json({ error: 'Mill not found' });
    
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) {
       return res.status(403).json({ error: 'Access denied: Unauthorized mill access' });
    }

    // Check if mill is settled for this year
    const statusRow = db.prepare('SELECT is_settled FROM mill_settlement_status WHERE mill_id = ? AND year = ?').get(mill_id, targetYear) as any;
    if (statusRow && statusRow.is_settled) {
      return res.status(403).json({ error: `Mill is already settled for ${targetYear}. No new payments allowed.` });
    }

    const insert = db.prepare('INSERT INTO mill_payments (mill_id, amount, date, description, lotId) VALUES (?, ?, ?, ?, ?)');
    const result = insert.run(mill_id, amount, date, description || '', lot_id || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Database error (mill-payments):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// GET settled mill IDs for a year
app.get('/api/mill-settlements/status', (req, res) => {
  const { year } = req.query as { year?: string };
  if (!year) return res.status(400).json({ error: 'year is required' });
  try {
    const rows = db.prepare(
      "SELECT mill_id, settled_at FROM mill_settlement_status WHERE year = ? AND is_settled = 1"
    ).all(year) as { mill_id: string; settled_at: string }[];
    res.json({
      settledMills: rows.map(r => r.mill_id),
      settledDates: Object.fromEntries(rows.map(r => [r.mill_id, r.settled_at]))
    });
  } catch (error) {
    console.error("Database error (get mill settlement status):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/lots/:id/unassign', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    let query = "UPDATE lots SET mill_name = NULL, stage = 'DELIVERED' WHERE id = ?";
    const params = [id];
    if (traderId) {
      query += " AND trader_id = ?";
      params.push(traderId);
    }
    const result = db.prepare(query).run(...params);
    if (result.changes === 0) return res.status(404).json({ error: 'Lot not found or access denied' });
    res.json({ success: true, message: 'Lot unassigned from mill successfully' });
  } catch (err: any) {
    console.error("Database error (unassign lot):", err);
    res.status(500).json({ error: err.message });
  }
});

// POST: Mark mill as settled
app.post('/api/mill-settlements/settle', (req, res) => {
  const { mill_id, year, traderId } = req.body;
  if (!mill_id || !year) return res.status(400).json({ error: 'mill_id and year are required' });
  try {
    // Verify mill ownership
    const mill = db.prepare('SELECT trader_id FROM mills WHERE id = ?').get(mill_id) as any;
    if (!mill) return res.status(404).json({ error: 'Mill not found' });
    
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) {
       return res.status(403).json({ error: 'Access denied: Unauthorized mill access' });
    }

    db.prepare(`
      INSERT INTO mill_settlement_status (mill_id, year, is_settled, settled_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(mill_id, year) DO UPDATE SET is_settled = 1, settled_at = excluded.settled_at
    `).run(mill_id, year, new Date().toISOString());
    res.json({ success: true, mill_id, year, is_settled: true });
  } catch (error) {
    console.error("Database error (settle mill):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// POST: Reopen (unsettle) mill
app.post('/api/mill-settlements/reopen', (req, res) => {
  const { mill_id, year, traderId } = req.body;
  if (!mill_id || !year) return res.status(400).json({ error: 'mill_id and year are required' });
  try {
    // Verify mill ownership
    const mill = db.prepare('SELECT trader_id FROM mills WHERE id = ?').get(mill_id) as any;
    if (!mill) return res.status(404).json({ error: 'Mill not found' });
    
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) {
       return res.status(403).json({ error: 'Access denied: Unauthorized mill access' });
    }

    db.prepare(`
      INSERT INTO mill_settlement_status (mill_id, year, is_settled, settled_at)
      VALUES (?, ?, 0, ?)
      ON CONFLICT(mill_id, year) DO UPDATE SET is_settled = 0, settled_at = excluded.settled_at
    `).run(mill_id, year, new Date().toISOString());
    res.json({ success: true, mill_id, year, is_settled: false });
  } catch (error) {
    console.error("Database error (reopen mill):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});


// LABOUR Management Endpoints

app.get('/api/labour-groups', (req, res) => {
  const { traderId } = req.query;
  try {
    let query = 'SELECT * FROM labour_groups ';
    const params: any[] = [];
    if (traderId) {
      query += ' WHERE trader_id = ? ';
      params.push(traderId);
    }
    query += ' ORDER BY registration_date DESC ';
    const groups = db.prepare(query).all(...params);
    res.json(groups);
  } catch (error) {
    console.error("Database error (get labour-groups):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/labour-groups', (req, res) => {
  const { id, name, location, contact_number, registration_date, members, traderId } = req.body;
  if (!id || !name || !registration_date) {
    return res.status(400).json({ error: 'ID, name, and registration date are required' });
  }

  try {
    const insertGroup = db.prepare('INSERT INTO labour_groups (id, name, location, contact_number, registration_date, trader_id) VALUES (?, ?, ?, ?, ?, ?)');
    const insertMember = db.prepare('INSERT INTO labour_members (group_id, name, mobile, role) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      insertGroup.run(id, name, location || '', contact_number || '', registration_date, traderId || null);
      if (Array.isArray(members)) {
        for (const member of members) {
          insertMember.run(id, member.name, member.mobile || '', member.role || '');
        }
      }
    });

    transaction();
    res.json({ success: true, id });
  } catch (error) {
    console.error("Database error (post labour-group):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/labour-groups/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    let query = 'DELETE FROM labour_groups WHERE id = ?';
    const params = [id];
    if (traderId) {
      query += ' AND trader_id = ?';
      params.push(traderId);
    }
    const result = db.prepare(query).run(...params);
    if (result.changes === 0) return res.status(404).json({ error: 'Group not found or access denied' });
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (delete labour-group):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/labour-groups/:id/members', (req, res) => {
  const { id } = req.params;
  try {
    const members = db.prepare('SELECT * FROM labour_members WHERE group_id = ?').all(id);
    res.json(members);
  } catch (error) {
    console.error("Database error (get labour-members):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// OPERATOR Management Endpoints

app.get('/api/operators', (req, res) => {
  const { traderId } = req.query;
  try {
    let query = 'SELECT * FROM operators ';
    const params: any[] = [];
    if (traderId) {
      query += ' WHERE trader_id = ? ';
      params.push(traderId);
    }
    query += ' ORDER BY registration_date DESC ';
    const operators = db.prepare(query).all(...params);
    res.json(operators);
  } catch (error) {
    console.error("Database error (get operators):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/operators', (req, res) => {
  const { id, name, mobile, address, experience, registration_date, traderId } = req.body;
  if (!id || !name || !mobile || !registration_date) {
    return res.status(400).json({ error: 'ID, name, mobile, and registration date are required' });
  }
  try {
    const insert = db.prepare('INSERT INTO operators (id, name, mobile, address, experience, registration_date, trader_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insert.run(id, name, mobile, address || '', experience || '', registration_date, traderId || null);
    res.json({ success: true, id });
  } catch (error) {
    console.error("Database error (post operator):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/operators/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    let query = 'DELETE FROM operators WHERE id = ?';
    const params = [id];
    if (traderId) {
      query += ' AND trader_id = ?';
      params.push(traderId);
    }
    const result = db.prepare(query).run(...params);
    if (result.changes === 0) return res.status(404).json({ error: 'Operator not found or access denied' });
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (delete operator):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// PADDY MARKET Endpoints

app.get('/api/paddy-market', (req, res) => {
  const { traderId } = req.query;
  try {
    let query = 'SELECT * FROM paddy_market ';
    const params: any[] = [];
    if (traderId) {
      query += ' WHERE trader_id = ? ';
      params.push(traderId);
    }
    query += ' ORDER BY date DESC ';
    const market = db.prepare(query).all(...params);
    res.json(market);
  } catch (error) {
    console.error("Database error (get paddy-market):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/paddy-market', (req, res) => {
  const { id, paddy_type, price_per_quintal, description, date, traderId } = req.body;
  if (!id || !paddy_type || !price_per_quintal || !date) {
    return res.status(400).json({ error: 'ID, paddy_type, price_per_quintal, and date are required' });
  }
  try {
    const insert = db.prepare('INSERT INTO paddy_market (id, paddy_type, price_per_quintal, description, date, trader_id) VALUES (?, ?, ?, ?, ?, ?)');
    insert.run(id, paddy_type, price_per_quintal, description || '', date, traderId || null);
    res.json({ success: true, id });
  } catch (error) {
    console.error("Database error (post paddy-market):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/paddy-market/:id', (req, res) => {
  const { id } = req.params;
  const traderId = req.query.traderId as string;
  try {
    let query = 'DELETE FROM paddy_market WHERE id = ?';
    const params = [id];
    if (traderId) {
      query += ' AND trader_id = ?';
      params.push(traderId);
    }
    const result = db.prepare(query).run(...params);
    if (result.changes === 0) return res.status(404).json({ error: 'Market entry not found or access denied' });
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (delete paddy-market):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
