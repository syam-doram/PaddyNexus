import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Lot, Batch, Machine, MachineLog, CommissionRate, Mill, LabourGroup, LabourMember, Operator, PaddyMarket, Silo, SettlementStatus, FarmerAdvance, MachineAdvance, MillPayment, LotRate } from './db.js';

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

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbState: mongoose.connection.readyState,
    time: new Date().toISOString()
  });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
  }
});

// Commission Rates Endpoints (Year-wise)

app.get('/api/commissions', async (req, res) => {
  try {
    const rates = await CommissionRate.find().sort({ year: -1 });
    res.json(rates);
  } catch (error) {
    console.error("Database error (get commissions):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
  }
});

app.get('/api/commissions/:year', async (req, res) => {
  const { year } = req.params;
  try {
    const rate = await CommissionRate.findOne({ year: parseInt(year) });
    res.json(rate || { year: parseInt(year), bag_rate: 0, machine_hour_rate: 0, labour_rate: 0 });
  } catch (error) {
    console.error("Database error (get commission by year):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
  }
});

app.get('/api/lots/:id/batches', async (req, res) => {
  const { id } = req.params;
  try {
    const batches = await Batch.find({ lotId: id });
    res.json(batches);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
  }
});

// Lot Stages Endpoints

app.get('/api/lot-stages', async (req, res) => {
  const { traderId } = req.query;
  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;

    const lots = await Lot.aggregate([
      { $match: filter },
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
        $lookup: {
          from: 'lotrates',
          localField: 'id',
          foreignField: 'lotId',
          as: 'lotRate'
        }
      },
      {
        $addFields: {
          labour_group_name: { $arrayElemAt: ['$labourGroup.name', 0] },
          bags: { $sum: '$batches.bags' },
          avg_bag_weight: { $avg: { $map: { input: '$batches', as: 'b', in: { $convert: { input: { $arrayElemAt: [{ $split: [{ $ifNull: [{ $toString: "$$b.weight" }, "0"] }, " "] }, 0] }, to: "double", onError: 0, onNull: 0 } } } } },
          rate: { $ifNull: [{ $arrayElemAt: ['$lotRate.rate', 0] }, 1200] }
        }
      },
      { $project: { labourGroup: 0, batches: 0, lotRate: 0 } },
      { $sort: { date: -1 } }
    ]).allowDiskUse(true);
    res.json(lots);
  } catch (error) {
    console.error("Database error (get lot-stages):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
  }
});

// GET unique paddy types from existing lots
app.get('/api/lots/types', async (req, res) => {
  try {
    const types = await Lot.distinct('type', { type: { $ne: '' } });
    res.json(types);
  } catch (error) {
    console.error("Database error (get lot types):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
          avg_bag_weight: { $avg: { $map: { input: '$batches', as: 'b', in: { $convert: { input: { $arrayElemAt: [{ $split: [{ $ifNull: [{ $toString: "$$b.weight" }, "0"] }, " "] }, 0] }, to: "double", onError: 0, onNull: 0 } } } } }
        }
      },
      { $project: { labourGroup: 0, batches: 0 } }
    ]).allowDiskUse(true);

    if (results.length === 0) return res.status(404).json({ error: 'Lot not found' });
    res.json(results[0]);
  } catch (error) {
    console.error("Database error (get lot):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
  }
});

app.get('/api/lots', async (req, res) => {
  const { year, traderId } = req.query;
  const yearFilter = year ? new RegExp(`^${year}-`) : /.*/;
  try {
    const match: any = { date: { $regex: year ? `^${year}-` : '.*' }, stage: { $ne: 'SETTLED' } };
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
          avg_bag_weight: { $avg: { $map: { input: '$batches', as: 'b', in: { $convert: { input: { $arrayElemAt: [{ $split: [{ $ifNull: [{ $toString: "$$b.weight" }, "0"] }, " "] }, 0] }, to: "double", onError: 0, onNull: 0 } } } } },
          rate: { $ifNull: [{ $arrayElemAt: ['$lotRate.rate', 0] }, 1200] }
        }
      },
      { $project: { batches: 0, lotRate: 0 } },
      { $sort: { date: -1 } }
    ]).allowDiskUse(true);

    res.json(lots);
  } catch (error) {
    console.error("Database error (get lots):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message, stack: (error as any).stack });
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
      const lot = lots.find(l => l.id === b.lotId);
      if (!lot) return;

      // Only show details in settlements once the lot is delivered to mill or later
      const deliveredStages = ['DELIVERED TO MILL', 'QUALITY CHECK', 'PAID', 'SETTLED'];
      if (!deliveredStages.includes(lot.stage)) return;

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

app.get('/api/trader/earnings-summary', async (req, res) => {
  const { year, variety, status, traderId } = req.query;
  try {
    const lotQuery: any = {};
    if (traderId) lotQuery.trader_id = traderId;
    if (year && year !== 'All Seasons') {
      const startOfYear = new Date(parseInt(year as string), 0, 1).toISOString();
      const endOfYear = new Date(parseInt(year as string), 11, 31, 23, 59, 59).toISOString();
      lotQuery.date = { $gte: startOfYear, $lte: endOfYear };
    }
    if (variety && variety !== 'All Varieties') lotQuery.type = variety;
    if (status && status !== 'All Status') {
       if (status === 'Completed') lotQuery.stage = 'SETTLED';
       else if (status === 'Processing') lotQuery.stage = { $ne: 'SETTLED' };
    }

    const lots = await Lot.find(lotQuery);
    const lotIds = lots.map(l => l.id);
    
    // Get batches for bag counts
    const batches = await Batch.find({ lotId: { $in: lotIds } });
    
    // Get commission rates
    const years = [...new Set(lots.map(l => l.date ? new Date(l.date).getFullYear() : 0))].filter(y => y > 0);
    const rates = await CommissionRate.find({ year: { $in: years } });

    const yearlyEarned: Record<string, number> = {};
    const areaWiseEarned: Record<string, number> = {};
    const millWiseEarned: Record<string, { earnings: number, lots: number }> = {};
    const varietyEarned: Record<string, number> = {};
    
    let totalProfit = 0;
    let totalRevenue = 0;

    const detailedLots = lots.map(lot => {
      const lotYear = new Date(lot.date).getFullYear().toString();
      const rateObj = rates.find(r => r.year === lotYear);
      const commissionRate = rateObj?.bag_rate || 0;
      
      const lotBatches = batches.filter(b => b.lotId === lot.id);
      const bags = lotBatches.reduce((sum, b) => sum + (b.bags || 0), 0);
      
      const earning = bags * commissionRate;
      const volume = parseFloat(lot.amount?.toString().replace(/[^0-9.-]+/g,"") || "0");
      
      const isSettled = lot.stage === 'SETTLED';
      
      if (isSettled) {
        yearlyEarned[lotYear] = (yearlyEarned[lotYear] || 0) + earning;
        areaWiseEarned[lot.load_area || 'Unknown'] = (areaWiseEarned[lot.load_area || 'Unknown'] || 0) + earning;
        
        const millKey = lot.mill_name || 'Direct Sale';
        if (!millWiseEarned[millKey]) {
          millWiseEarned[millKey] = { earnings: 0, lots: 0 };
        }
        millWiseEarned[millKey].earnings += earning;
        millWiseEarned[millKey].lots += 1;

        varietyEarned[lot.type || 'Mixed'] = (varietyEarned[lot.type || 'Mixed'] || 0) + earning;
        
        totalProfit += earning;
        totalRevenue += volume;
      }

      return {
        id: lot.id,
        label: lot.name,
        date: lot.date,
        variety: lot.type || 'Mixed',
        tonnage: lot.weight || '0 T',
        destination: lot.mill_name || 'Direct Sale',
        value: earning,
        status: isSettled ? 'COMPLETED' : 'PROCESSING'
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
      activeLots: lots.length
    });
  } catch (error) {
    console.error("Database error (trader-earnings):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/trader/machine-summary', async (req, res) => {
  const { filter, traderId } = req.query;
  try {
    let dateFilter = {};
    const now = new Date();
    if (filter === 'Today') {
      const today = new Date(now.setHours(0,0,0,0)).toISOString();
      dateFilter = { date: { $gte: today } };
    } else if (filter === 'Week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
      dateFilter = { date: { $gte: weekAgo } };
    } else if (filter === 'Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      dateFilter = { date: { $gte: startOfMonth } };
    } else if (filter === 'Year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
      dateFilter = { date: { $gte: startOfYear } };
    }

    const machineQuery: any = {};
    if (traderId) machineQuery.trader_id = traderId;

    const machinesList = await Machine.find(machineQuery);
    const machineIds = machinesList.map(m => m.id);

    const logs = await MachineLog.find({
      machine_id: { $in: machineIds },
      ...dateFilter
    });

    const machineStatsMap = new Map();
    logs.forEach(log => {
      if (!machineStatsMap.has(log.machine_id)) {
        machineStatsMap.set(log.machine_id, { revenue: 0, hours: 0, acres: 0, fuel: 0 });
      }
      const s = machineStatsMap.get(log.machine_id);
      s.revenue += (log.total_amount || 0);
      s.hours += (log.hours || 0);
      s.acres += (log.acres || 0);
      s.fuel += (log.fuel_cost || 0);
    });

    const targetYear = new Date().getFullYear().toString();
    const settlementStatuses = await SettlementStatus.find({ year: targetYear, machine_id: { $in: machineIds } });
    const operatorList = await Operator.find({ id: { $in: machinesList.map(m => m.operator).filter(Boolean) } });

    const machineTypes = [...new Set(machinesList.map(m => m.model).filter(Boolean))];
    let totalRev = 0;
    let totalFuelCost = 0;

    const fleet = machinesList.map(m => {
      const stat = machineStatsMap.get(m.id) || { revenue: 0, hours: 0, acres: 0, fuel: 0 };
      const settle = settlementStatuses.find(s => s.machine_id === m.id);
      const op = operatorList.find(o => o.id === m.operator);
      
      totalRev += stat.revenue;
      totalFuelCost += stat.fuel;

      return {
        id: m.id,
        name: m.name,
        type: m.model || 'Other',
        operatorName: op?.name || 'No Operator',
        hours: `${stat.hours} hrs`,
        acres: `${stat.acres} ac`,
        revenue: `₹${stat.revenue.toLocaleString()}`,
        efficiency: stat.hours ? `${Math.round(((stat.acres || 0) / stat.hours) * 100)}%` : '0%',
        status: m.status || 'IDLE',
        is_settled: settle?.is_settled ? 1 : 0,
        settled_at: settle?.settled_at
      };
    });

    const highlights = [...fleet]
      .sort((a, b) => {
        const revA = parseFloat(a.revenue.replace(/[^0-9.-]+/g, ""));
        const revB = parseFloat(b.revenue.replace(/[^0-9.-]+/g, ""));
        return revB - revA;
      })
      .slice(0, 3);

    res.json({
      totalRevenue: `₹${totalRev.toLocaleString()}`,
      operatingExpenses: `₹${totalFuelCost.toLocaleString()}`,
      netProfit: `₹${(totalRev - totalFuelCost).toLocaleString()}`,
      machineTypes,
      highlights,
      fleet
    });
  } catch (error) {
    console.error("Database error (trader-machine-earnings):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/farmer-advances', async (req, res) => {
  const { farmer_name, amount, date, description, lotId, traderId } = req.body;
  if (!farmer_name || !amount || !date) {
    return res.status(400).json({ error: 'Farmer name, amount, and date are required' });
  }

  try {
    if (lotId && traderId) {
      const lot = await Lot.findOne({ id: lotId });
      if (lot && lot.trader_id && lot.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied: Unauthorized lot access' });
      }
    }

    const advance = new FarmerAdvance({
      farmer_name,
      amount,
      date,
      description: description || '',
      lotId: lotId || null,
      trader_id: traderId || null
    });
    
    const result = await advance.save();
    res.json({ success: true, id: result._id });
  } catch (error) {
    console.error("Database error (farmer-advances):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/lots/:id/machine-cost', async (req, res) => {
  const { id } = req.params;
  const { machine_cost, machine_id, machine_hours, machine_rate } = req.body;
  const { traderId } = req.query;

  try {
    const update: any = {};
    if (machine_cost !== undefined) update.machine_cost = machine_cost;
    if (machine_id !== undefined) update.machine_id = machine_id;
    if (machine_hours !== undefined) update.machine_hours = machine_hours;
    if (machine_rate !== undefined) update.machine_rate = machine_rate;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;

    const result = await Lot.findOneAndUpdate(filter, { $set: update }, { new: true });

    if (!result) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json({ success: true, machine_cost, machine_id, machine_hours, machine_rate });
  } catch (error) {
    console.error("Database error (machine-cost update):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// MACHINE Endpoints

app.get('/api/machines', async (req, res) => {
  const { traderId, includeSettled, date: requestedDate } = req.query;
  const targetDate = (requestedDate as string) || new Date().toISOString().split('T')[0];
  const targetYear = targetDate.split('-')[0];

  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;

    const machines = await Machine.find(filter);
    
    // Fetch settlements for the specific year of the requested date
    const settlements = await SettlementStatus.find({ 
      machine_id: { $in: machines.map(m => m.id) },
      year: targetYear
    });

    // Fetch logs for the specific year for total stats
    const yearlyLogs = await MachineLog.find({ date: { $regex: `^${targetYear}` } });
    
    // Fetch logs for the specific day for daily stats
    const dailyLogs = await MachineLog.find({ date: targetDate });

    // Fetch advances for daily stats
    const dailyAdvances = await MachineAdvance.find({ date: targetDate });

    console.log(`[GET /api/machines] Date: ${targetDate}, Year: ${targetYear}, Machines found: ${machines.length}`);
    const results = machines.map(m => {
      const machineIdClean = cleanMachineId(m.id);
      const machineYearlyLogs = yearlyLogs.filter(l => cleanMachineId(l.machine_id) === machineIdClean);
      const machineDailyLogs = dailyLogs.filter(l => cleanMachineId(l.machine_id) === machineIdClean);
      const machineDailyAdvances = dailyAdvances.filter(a => cleanMachineId(a.machine_id) === machineIdClean);
      const settle = settlements.find(s => cleanMachineId(s.machine_id) === machineIdClean);
      
      const dh = machineDailyLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

      return {
        ...m.toObject(),
        totalHours: machineYearlyLogs.reduce((sum, l) => sum + (l.hours || 0), 0),
        totalAcres: machineYearlyLogs.reduce((sum, l) => sum + (l.acres || 0), 0),
        dailyHours: dh,
        dailyAcres: machineDailyLogs.reduce((sum, l) => sum + (l.acres || 0), 0),
        dailyAdvanceAmount: machineDailyAdvances.reduce((sum, a) => sum + (a.amount || 0), 0),
        is_settled: settle?.is_settled ? 1 : 0,
        settled_at: settle?.settled_at
      };
    });

    const filtered = includeSettled === 'true' 
      ? results 
      : results.filter(m => m.is_settled === 0);
    
    res.json(filtered);
  } catch (error) {
    console.error("Database error (get machines):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machines/:id', async (req, res) => {
  const { id } = req.params;
  const today = new Date().toLocaleDateString('en-CA');
  try {
    const cleanId = cleanMachineId(id);
    const machine = await Machine.findOne({ id: cleanId });
    if (!machine) return res.status(404).json({ error: 'Machine not found' });

    const currentYear = new Date().getFullYear().toString();
    const settle = await SettlementStatus.findOne({ machine_id: cleanId, year: currentYear });
    const advanceCount = await MachineAdvance.countDocuments({ machine_id: cleanId, date: today });

    res.json({ 
      ...machine.toObject(), 
      todayAdvanceCount: advanceCount,
      is_settled: settle?.is_settled ? 1 : 0,
      settled_at: settle?.settled_at
    });
  } catch (error: any) {
    console.error("Database error (get machine):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/machines', async (req, res) => {
  const { id, name, model, status, operator, image, owner_name, owner_mobile, per_hour_rate, registration_date, traderId } = req.body;
  try {
    const machine = new Machine({
      id, name, model, status: status || 'IDLE', operator: operator || '', 
      image: image || '', owner_name: owner_name || '', owner_mobile: owner_mobile || '', 
      per_hour_rate: per_hour_rate || 1200, registration_date: registration_date || null, 
      trader_id: traderId || null
    });
    await machine.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (post machine):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/machines/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { traderId } = req.query;
  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;
    const result = await Machine.findOneAndUpdate(filter, { $set: { status } });
    if (!result) return res.status(404).json({ error: 'Machine not found or access denied' });
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (patch machine status):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.patch('/api/machines/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rate } = req.body;
  const { traderId } = req.query;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  try {
    const cleanId = cleanMachineId(id);
    const filter: any = { id: cleanId };
    if (traderId) filter.trader_id = traderId;

    const machine = await Machine.findOneAndUpdate(filter, { $set: { per_hour_rate: rate } });
    if (machine) {
      await MachineLog.updateMany(
        { machine_id: cleanId, date: today, ...(traderId && { trader_id: traderId }) },
        { $set: { rate } }
      );
      // Wait, we need to recalculate total_amount if hours exists
      const logs = await MachineLog.find({ machine_id: cleanId, date: today });
      for (const log of logs) {
        log.total_amount = (log.hours || 0) * rate;
        await log.save();
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (patch machine rate):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machine-logs', async (req, res) => {
  const { traderId } = req.query;
  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;
    const logs = await MachineLog.find(filter).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Database error (get all machine logs):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machine-logs/:machineId', async (req, res) => {
  const { machineId } = req.params;
  const { traderId } = req.query;
  try {
    const cleanId = cleanMachineId(machineId);
    if (traderId) {
      const machine = await Machine.findOne({ id: cleanId });
      if (machine && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const logs = await MachineLog.find({ machine_id: cleanId }).sort({ date: -1 });
    res.json(logs);
  } catch (error: any) {
    console.error("Database error (get machine logs):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/machine-logs', async (req, res) => {
  const { machine_id, farmer_name, date, start_reading, end_reading, hours, acres, fuel_cost, rate, total_amount, farmer_mobile, location, start_time, end_time, traderId } = req.body;
  try {
    const cleanId = cleanMachineId(machine_id);
    const machine = await Machine.findOne({ id: cleanId });
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    
    if (traderId && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const currentYear = new Date().getFullYear().toString();
    const settle = await SettlementStatus.findOne({ machine_id: cleanId, year: currentYear });
    if (settle?.is_settled) {
      return res.status(403).json({ error: 'This machine is already settled for the current session.' });
    }

    const log = new MachineLog({
      machine_id: cleanId, farmer_name, date, start_reading, end_reading, hours, 
      acres, fuel_cost, rate, total_amount, farmer_mobile, location, 
      start_time, end_time, trader_id: traderId || null
    });
    await log.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Database error (post machine log):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// MILL Endpoints

app.get('/api/silos', async (req, res) => {
  const { traderId } = req.query;
  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;
    const silos = await Silo.find(filter);
    res.json(silos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/mills', async (req, res) => {
  const { traderId } = req.query;
  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;
    const mills = await Mill.find(filter).sort({ name: 1 });
    res.json(mills);
  } catch (error) {
    console.error("Database error (get mills):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/mills', async (req, res) => {
  const { id, name, location, contact_person, phone, email, traderId } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'ID and Name are required' });
  try {
    const mill = new Mill({ 
      id, name, location: location || '', contact_person: contact_person || '', 
      phone: phone || '', email: email || '', registration_date: new Date().toISOString(), 
      trader_id: traderId || null 
    });
    await mill.save();
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 11000) return res.status(400).json({ error: 'Mill ID already exists' });
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.delete('/api/mills/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;
    const result = await Mill.findOneAndDelete(filter);
    if (!result) return res.status(404).json({ error: 'Mill not found or access denied' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/machine-logs/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const filter: any = { _id: id };
    if (traderId) filter.trader_id = traderId;
    const result = await MachineLog.findOneAndDelete(filter);
    if (!result) return res.status(404).json({ error: 'Log not found' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.delete('/api/machine-advances/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const filter: any = { _id: id };
    if (traderId) {
      const advance = await MachineAdvance.findById(id);
      const machine = await Machine.findOne({ id: advance?.machine_id });
      if (machine && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await MachineAdvance.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.get('/api/machine-settlements', async (req, res) => {
  const { year, traderId } = req.query;
  const targetYear = year || new Date().getFullYear().toString();
  try {
    const logs = await MachineLog.find({ 
      date: { $regex: `^${targetYear}` },
      ...(traderId && { trader_id: traderId })
    });
    const advances = await MachineAdvance.find({
      date: { $regex: `^${targetYear}` }
    });
    // Multi-join simulation
    const machinesIds = [...new Set([...logs.map(l => l.machine_id), ...advances.map(a => a.machine_id)])];
    
    // Fetch the machines mentioned in logs or advances.
    const machinesFilter: any = {};
    if (traderId) machinesFilter.trader_id = traderId;
    const allMachines = await Machine.find(machinesFilter);

    const machines = allMachines.filter(m => {
        const cleanMId = cleanMachineId(m.id);
        return machinesIds.some(id => cleanMachineId(id) === cleanMId);
    });

    const settlements = await SettlementStatus.find({ year: targetYear, machine_id: { $in: machines.map(m => m.id) } });
    const commRate = await CommissionRate.findOne({ year: targetYear });
    const commissionRate = commRate?.machine_hour_rate || 0;

    const results = machines.map(m => {
      const machineIdClean = cleanMachineId(m.id);
      const machineLogs = logs.filter(l => cleanMachineId(l.machine_id) === machineIdClean);
      const machineAdvances = advances.filter(a => cleanMachineId(a.machine_id) === machineIdClean);
      const settle = settlements.find(s => cleanMachineId(s.machine_id) === machineIdClean);
      
      const totalEarnings = machineLogs.reduce((sum, l) => sum + (l.total_amount || 0), 0);
      const totalHours = machineLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
      const totalAdvances = machineAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
      const totalDealerCommission = totalHours * commissionRate;

      return {
        ...m.toObject(),
        is_settled: settle?.is_settled ? 1 : 0,
        settled_at: settle?.settled_at,
        totalEarnings,
        totalHours,
        totalAdvances,
        totalDealerCommission,
        netBalance: totalEarnings - totalAdvances - totalDealerCommission,
        activeDates: machineLogs.map(l => l.date)
      };
    });

    res.json(results);
  } catch (error) {
    console.error("Database error (machine-settlements):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/machine-advances/:machineId', async (req, res) => {
  const { machineId } = req.params;
  try {
    const cleanId = cleanMachineId(machineId);
    const advances = await MachineAdvance.find({ machine_id: cleanId }).sort({ date: -1 });
    res.json(advances);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/machine-advances', async (req, res) => {
  const { machine_id, amount, date, description, traderId } = req.body;
  try {
    const cleanId = cleanMachineId(machine_id);
    const machine = await Machine.findOne({ id: cleanId });
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    
    if (traderId && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) {
       return res.status(403).json({ error: 'Access denied' });
    }

    const currentYear = new Date().getFullYear().toString();
    const settle = await SettlementStatus.findOne({ machine_id: cleanId, year: currentYear });
    if (settle?.is_settled) {
      return res.status(403).json({ error: 'This machine is already settled for the current session.' });
    }

    const advance = new MachineAdvance({ machine_id: cleanId, amount, date, description: description || '' });
    await advance.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// Machine Settlement Action (Year-Aware)
app.post('/api/machines/:id/settle', async (req, res) => {
  const { id } = req.params;
  const { traderId, year } = req.query;
  const targetYear = year || new Date().getFullYear().toString();
  try {
    const cleanId = cleanMachineId(id);
    if (traderId) {
      const m = await Machine.findOne({ id: cleanId });
      if (m && m.trader_id && m.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });
    }
    await SettlementStatus.findOneAndUpdate(
      { machine_id: cleanId, year: targetYear },
      { $set: { is_settled: 1, settled_at: new Date().toISOString() } },
      { upsert: true }
    );
    res.json({ success: true, message: `Machine settled for ${targetYear}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/machines/:id/reopen', async (req, res) => {
  const { id } = req.params;
  const { traderId, year } = req.query;
  const targetYearNum = parseInt(year as string) || new Date().getFullYear();
  const currentYear = new Date().getFullYear();

  if (targetYearNum < currentYear - 1) return res.status(403).json({ error: 'Legacy Session Locked' });

  try {
    const cleanId = cleanMachineId(id);
    if (traderId) {
      const m = await Machine.findOne({ id: cleanId });
      if (m && m.trader_id && m.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });
    }
    await SettlementStatus.findOneAndUpdate(
      { machine_id: cleanId, year: targetYearNum.toString() },
      { $set: { is_settled: 0, settled_at: new Date().toISOString() } },
      { upsert: true }
    );
    res.json({ success: true, message: `Machine reopened for ${targetYearNum}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Machine Settlement Report (Year-Aware)
app.get('/api/machine-report/:id', async (req, res) => {
  const { id } = req.params;
  const { year, traderId } = req.query;
  const targetYear = year || new Date().getFullYear().toString();
  try {
    const cleanId = cleanMachineId(id);
    const machine = await Machine.findOne({ id: cleanId });
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    if (traderId && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });

    const settle = await SettlementStatus.findOne({ machine_id: cleanId, year: targetYear });
    const logs = await MachineLog.find({ machine_id: cleanId, date: { $regex: `^${targetYear}` } }).sort({ date: -1 });
    const advances = await MachineAdvance.find({ machine_id: cleanId, date: { $regex: `^${targetYear}` } }).sort({ date: -1 });
    const commRate = await CommissionRate.findOne({ year: targetYear });
    const commissionRate = commRate?.machine_hour_rate || 0;

    const totalEarnings = logs.reduce((sum, l) => sum + (l.total_amount || 0), 0);
    const totalAdvances = advances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalHours = logs.reduce((sum, l) => sum + (l.hours || 0), 0);
    const totalDealerCommission = totalHours * commissionRate;

    res.json({
      machine: { ...machine.toObject(), is_settled: settle?.is_settled ? 1 : 0, settled_at: settle?.settled_at },
      logs, advances, totalEarnings, totalAdvances, commissionRate, totalDealerCommission,
      netBalance: totalEarnings - totalAdvances - totalDealerCommission
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DELETE Machine and associated data
app.delete('/api/machines/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const cleanId = cleanMachineId(id);
    const machine = await Machine.findOne({ id: cleanId });
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    if (traderId && machine.trader_id && machine.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });

    await MachineLog.deleteMany({ machine_id: cleanId });
    await MachineAdvance.deleteMany({ machine_id: cleanId });
    await SettlementStatus.deleteMany({ machine_id: cleanId });
    await Lot.updateMany({ machine_id: cleanId }, { $set: { machine_id: null } });
    await Machine.deleteOne({ id: cleanId });

    res.json({ success: true, message: 'Machine and associated data deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Delete Failed', message: error.message });
  }
});

app.delete('/api/lots/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const lot = await Lot.findOne({ id });
    if (!lot) return res.status(404).json({ error: 'Lot not found' });
    if (traderId && lot.trader_id && lot.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });

    await Batch.deleteMany({ lotId: id });
    await LotRate.deleteMany({ lotId: id });
    await Lot.deleteOne({ id });
    res.json({ success: true, message: 'Lot and associated data deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET settled farmer names for a year
app.get('/api/farmer-settlements/status', async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ error: 'year is required' });
  try {
    const statuses = await SettlementStatus.find({ year, is_settled: 1, type: 'FARMER' });
    res.json({
      settledFarmers: statuses.map(s => s.entity_name),
      settledDates: Object.fromEntries(statuses.map(s => [s.entity_name, s.settled_at]))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// POST: Mark farmer as settled
app.post('/api/farmer-settlements/settle', async (req, res) => {
  const { farmer_name, year, traderId } = req.body;
  try {
    await SettlementStatus.findOneAndUpdate(
      { entity_name: farmer_name, year, type: 'FARMER' },
      { $set: { is_settled: 1, settled_at: new Date().toISOString(), trader_id: traderId } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// POST: Reopen (unsettle) farmer
app.post('/api/farmer-settlements/reopen', async (req, res) => {
  const { farmer_name, year, traderId } = req.body;
  try {
    await SettlementStatus.findOneAndUpdate(
      { entity_name: farmer_name, year, type: 'FARMER' },
      { $set: { is_settled: 0, settled_at: new Date().toISOString(), trader_id: traderId } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// MILL SETTLEMENT Endpoints

app.get('/api/mill-settlements', async (req, res) => {
  const { year, traderId } = req.query;
  const targetYear = year || new Date().getFullYear().toString();
  try {
    const millFilter: any = {};
    if (traderId) millFilter.trader_id = traderId;
    const mills = await Mill.find(millFilter);

    const match: any = { date: { $regex: `^${targetYear}` } };
    if (traderId) match.trader_id = traderId;

    const lotStats = await Lot.aggregate([
      { $match: match },
      { $lookup: { from: 'batches', localField: 'id', foreignField: 'lotId', as: 'batches' } },
      { $lookup: { from: 'lotrates', localField: 'id', foreignField: 'lotId', as: 'lotRates' } },
      { $lookup: { from: 'commission_rates', let: { year: { $substr: ['$date', 0, 4] } }, pipeline: [{ $match: { $expr: { $eq: ['$year', { $toInt: '$$year' }] } } }], as: 'comm' } }, // Corrected $toInt for year comparison
      { $unwind: { path: '$batches', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { lotId: '$id', millName: '$mill_name', manualDeductionsApplied: '$manual_deductions_applied', moistureLoss: '$moisture_loss', bagPenalty: '$bag_penalty', laborCost: '$labor_cost' },
          bags: { $sum: '$batches.bags' },
          grossAmountBeforeDeductions: { $sum: { $add: [
            { $multiply: ['$batches.bags', { $ifNull: [{ $arrayElemAt: ['$lotRates.rate', 0] }, 1200] }] },
            { $multiply: ['$batches.bags', { $ifNull: [{ $arrayElemAt: ['$comm.bag_rate', 0] }, 0] }] },
            { $multiply: ['$batches.bags', { $ifNull: [{ $arrayElemAt: ['$comm.labour_rate', 0] }, 0] }] }
          ] } }
        }
      },
      {
        $addFields: {
          netAmountForLot: {
            $cond: {
              if: { $eq: ['$_id.manualDeductionsApplied', 1] },
              then: { $subtract: ['$_id.grossAmountBeforeDeductions', { $add: [{ $ifNull: ['$_id.moistureLoss', 0] }, { $ifNull: ['$_id.bagPenalty', 0] }, { $ifNull: ['$_id.laborCost', 0] }] }] },
              else: '$grossAmountBeforeDeductions'
            }
          }
        }
      },
      {
        $group: {
          _id: { "millName": { "$toLower": '$_id.millName' }, "lotId": '$_id.lotId', "stage": '$stage' }, // Include stage for settled/pending count
          totalBags: { $sum: '$bags' },
          netAmount: { $sum: '$netAmountForLot' },
          stage: { $first: '$stage' } // Keep stage for filtering
        }
      },
      {
        $group: {
          _id: '$_id.millName',
          totalBags: { $sum: '$totalBags' },
          netAmount: { $sum: '$netAmount' },
          settledLots: { $sum: { $cond: [{ $eq: ['$stage', 'SETTLED'] }, 1, 0] } },
          pendingLots: { $sum: { $cond: [{ $ne: ['$stage', 'SETTLED'] }, 1, 0] } }
        }
      }
    ]);

    const payments = await MillPayment.aggregate([
      { $match: { date: { $regex: `^${targetYear}` } } },
      { $group: { _id: '$mill_id', total: { $sum: '$amount' } } }
    ]);

    const statusList = await SettlementStatus.find({ year: targetYear, type: 'MILL' });

    const results = mills.map(m => {
      const stats = lotStats.find(s => s._id === m.name.toLowerCase()) || { totalBags: 0, netAmount: 0, settledLots: 0, pendingLots: 0 };
      const paid = payments.find(p => p._id === m.id) || { total: 0 };
      const settle = statusList.find(s => s.mill_id === m.id);
      return {
        id: m.id,
        name: m.name,
        location: m.location,
        contact_person: m.contact_person,
        phone: m.phone,
        totalBags: stats.totalBags,
        totalDeliveredAmount: stats.netAmount,
        settledLots: stats.settledLots,
        pendingLots: stats.pendingLots,
        totalPaidAmount: paid.total,
        netBalance: stats.netAmount - paid.total,
        is_settled: settle?.is_settled ? 1 : 0,
        settled_at: settle?.settled_at
      };
    });

    res.json(results);
  } catch (error: any) {
    console.error("Database error (mill-settlements):", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.get('/api/mill-settlements/:millId', async (req, res) => {
  const { millId } = req.params;
  const { year, traderId } = req.query;
  const targetYear = year || new Date().getFullYear().toString();
  try {
    const mill = await Mill.findOne({ id: millId });
    if (!mill) return res.status(404).json({ error: 'Mill not found' });
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });

    const lots = await Lot.aggregate([
      { $match: { mill_name: { $regex: new RegExp(`^${mill.name}$`, 'i') }, date: { $regex: `^${targetYear}` } } },
      { $lookup: { from: 'batches', localField: 'id', foreignField: 'lotId', as: 'batches' } },
      { $lookup: { from: 'lotrates', localField: 'id', foreignField: 'lotId', as: 'lotRate' } },
      { $lookup: { from: 'commission_rates', pipeline: [{ $match: { year: targetYear } }], as: 'comm' } },
      {
        $addFields: {
          totalBags: { $sum: '$batches.bags' },
          totalAmount: { $sum: { $map: { input: '$batches', as: 'b', in: { $add: [
            { $multiply: ['$$b.bags', { $ifNull: [{ $arrayElemAt: ['$lotRate.rate', 0] }, 1200] }] },
            { $multiply: ['$$b.bags', { $ifNull: [{ $arrayElemAt: ['$comm.bag_rate', 0] }, 0] }] },
            { $multiply: ['$$b.bags', { $ifNull: [{ $arrayElemAt: ['$comm.labour_rate', 0] }, 0] }] }
          ] } } } }
        }
      }
    ]);

    const payments = await MillPayment.find({ mill_id: millId, date: { $regex: `^${targetYear}` } }).sort({ date: -1 });
    const settle = await SettlementStatus.findOne({ mill_id: millId, year: targetYear, type: 'MILL' });

    const totalDelivered = lots.reduce((sum, l) => sum + (l.totalAmount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      mill, lots, payments,
      summary: { totalDelivered, totalPaid, netBalance: totalDelivered - totalPaid, is_settled: settle?.is_settled ? 1 : 0, settled_at: settle?.settled_at }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.patch('/api/lots/:lotId/deductions', async (req, res) => {
  const { lotId } = req.params;
  const { moisture_loss, bag_penalty, labor_cost } = req.body;
  const { traderId } = req.query;
  try {
    const filter: any = { id: lotId };
    if (traderId) filter.trader_id = traderId;
    const result = await Lot.findOneAndUpdate(filter, { $set: { moisture_loss, bag_penalty, labor_cost, manual_deductions_applied: 1 } });
    if (!result) return res.status(404).json({ error: 'Lot not found' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.patch('/api/lots/:id/settle', async (req, res) => {
  const { id } = req.params;
  const { settled_at } = req.body;
  const { traderId } = req.query;
  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;
    const result = await Lot.findOneAndUpdate(filter, { $set: { stage: 'SETTLED', settled_at: settled_at || new Date().toISOString() } });
    if (!result) return res.status(404).json({ error: 'Lot not found' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/api/mill-payments/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const payment = await MillPayment.findById(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (traderId) {
      const mill = await Mill.findOne({ id: payment.mill_id });
      if (mill && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });
    }
    await MillPayment.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/mill-payments', async (req, res) => {
  const { mill_id, amount, date, description, lot_id, traderId } = req.body;
  const targetYear = new Date(date).getFullYear().toString();
  try {
    const mill = await Mill.findOne({ id: mill_id });
    if (!mill) return res.status(404).json({ error: 'Mill not found' });
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });

    const settle = await SettlementStatus.findOne({ mill_id, year: targetYear, type: 'MILL', is_settled: 1 });
    if (settle) return res.status(403).json({ error: `Mill is already settled for ${targetYear}` });

    const payment = new MillPayment({ mill_id, amount, date, description: description || '', lotId: lot_id || null });
    await payment.save();
    res.json({ success: true, id: payment._id });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.get('/api/mill-settlements/status', async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ error: 'year is required' });
  try {
    const statuses = await SettlementStatus.find({ year, is_settled: 1, type: 'MILL' });
    res.json({
      settledMills: statuses.map(s => s.mill_id),
      settledDates: Object.fromEntries(statuses.map(s => [s.mill_id, s.settled_at]))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.patch('/api/lots/:id/unassign', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;
    const result = await Lot.findOneAndUpdate(filter, { $set: { mill_name: null, stage: 'DELIVERED' } });
    if (!result) return res.status(404).json({ error: 'Lot not found' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mill-settlements/settle', async (req, res) => {
  const { mill_id, year, traderId } = req.body;
  try {
    const mill = await Mill.findOne({ id: mill_id });
    if (!mill) return res.status(404).json({ error: 'Mill not found' });
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });

    await SettlementStatus.findOneAndUpdate(
      { mill_id, year, type: 'MILL' },
      { $set: { is_settled: 1, settled_at: new Date().toISOString(), trader_id: traderId } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/api/mill-settlements/reopen', async (req, res) => {
  const { mill_id, year, traderId } = req.body;
  try {
    const mill = await Mill.findOne({ id: mill_id });
    if (!mill) return res.status(404).json({ error: 'Mill not found' });
    if (traderId && mill.trader_id && mill.trader_id.toString() !== traderId.toString()) return res.status(403).json({ error: 'Access denied' });

    await SettlementStatus.findOneAndUpdate(
      { mill_id, year, type: 'MILL' },
      { $set: { is_settled: 0, settled_at: new Date().toISOString(), trader_id: traderId } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});


app.get('/api/labour-groups', async (req, res) => {
  const { traderId } = req.query;
  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;
    const groups = await LabourGroup.find(filter).sort({ registration_date: -1 });
    res.json(groups);
  } catch (error) {
    console.error("Database error (get labour-groups):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/labour-groups', async (req, res) => {
  const { id, name, location, contact_number, registration_date, members, traderId } = req.body;
  if (!id || !name || !registration_date) return res.status(400).json({ error: 'ID, name, and registration date are required' });
  try {
    const group = new LabourGroup({ id, name, location: location || '', contact_number: contact_number || '', registration_date, trader_id: traderId || null });
    await group.save();
    if (Array.isArray(members)) {
      for (const member of members) {
        const m = new LabourMember({ group_id: id, name: member.name, mobile: member.mobile || '', role: member.role || '' });
        await m.save();
      }
    }
    res.json({ success: true, id });
  } catch (error) {
    console.error("Database error (post labour-group):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/labour-groups/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;
    const result = await LabourGroup.findOneAndDelete(filter);
    if (!result) return res.status(404).json({ error: 'Group not found or access denied' });
    await LabourMember.deleteMany({ group_id: id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.get('/api/labour-groups/:id/members', async (req, res) => {
  const { id } = req.params;
  try {
    const members = await LabourMember.find({ group_id: id });
    res.json(members);
  } catch (error) {
    console.error("Database error (get labour-members):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// OPERATOR Management Endpoints

app.get('/api/operators', async (req, res) => {
  const { traderId } = req.query;
  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;
    const operators = await Operator.find(filter).sort({ registration_date: -1 });
    res.json(operators);
  } catch (error) {
    console.error("Database error (get operators):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/operators', async (req, res) => {
  const { id, name, mobile, address, experience, registration_date, traderId } = req.body;
  if (!id || !name || !mobile || !registration_date) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const op = new Operator({ id, name, mobile, address: address || '', experience: experience || '', registration_date, trader_id: traderId || null });
    await op.save();
    res.json({ success: true, id });
  } catch (error) {
    console.error("Database error (post operator):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/operators/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;
    const result = await Operator.findOneAndDelete(filter);
    if (!result) return res.status(404).json({ error: 'Operator not found or access denied' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

// PADDY MARKET Endpoints

app.get('/api/paddy-market', async (req, res) => {
  const { traderId } = req.query;
  try {
    const filter: any = {};
    if (traderId) filter.trader_id = traderId;
    const market = await PaddyMarket.find(filter).sort({ date: -1 });
    res.json(market);
  } catch (error) {
    console.error("Database error (get paddy-market):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.post('/api/paddy-market', async (req, res) => {
  const { id, paddy_type, price_per_quintal, description, date, traderId } = req.body;
  if (!id || !paddy_type || !price_per_quintal || !date) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const market = new PaddyMarket({ id, paddy_type, price_per_quintal, description: description || '', date, trader_id: traderId || null });
    await market.save();
    res.json({ success: true, id });
  } catch (error) {
    console.error("Database error (post paddy-market):", error);
    res.status(500).json({ error: 'Internal Server Error', message: (error as any).message });
  }
});

app.delete('/api/paddy-market/:id', async (req, res) => {
  const { id } = req.params;
  const { traderId } = req.query;
  try {
    const filter: any = { id };
    if (traderId) filter.trader_id = traderId;
    const result = await PaddyMarket.findOneAndDelete(filter);
    if (!result) return res.status(404).json({ error: 'Market entry not found or access denied' });
    res.json({ success: true });
  } catch (error) {
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
