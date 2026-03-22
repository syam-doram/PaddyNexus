import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://syamkdoram_db_user:LLCqKjfpxZCfDCVS@paddy-cluster.mwdyyx3.mongodb.net/?appName=paddy-cluster';

mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// SCHEMAS

const MachineSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  model: { type: String, required: true },
  status: { type: String, default: 'IDLE' },
  operator: String,
  image: String,
  owner_name: String,
  owner_mobile: String,
  per_hour_rate: { type: Number, default: 1200 },
  trader_id: { type: String }
});

const MachineLogSchema = new mongoose.Schema({
  machine_id: { type: String, required: true },
  farmer_name: { type: String, required: true },
  date: { type: String, required: true },
  start_reading: Number,
  end_reading: Number,
  hours: Number,
  acres: Number,
  fuel_cost: Number,
  rate: Number,
  total_amount: Number,
  farmer_mobile: String,
  location: String,
  start_time: String,
  end_time: String,
  trader_id: { type: String }
});

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  bags: { type: Number, required: true },
  weight: { type: String, required: true },
  moisture: { type: String, required: true },
  moistureStatus: { type: String, required: true },
  lotId: { type: String, required: true },
  paddyType: String,
  amountType: String,
  moistureType: String,
  mobile: String,
  labour_gratuity: { type: Number, default: 0 },
  trader_id: { type: String }
});

const LotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  weight: { type: String, required: true },
  amount: { type: String, required: true },
  stage: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  date: { type: String, required: true },
  loaded_at: String,
  transit_at: String,
  delivered_at: String,
  quality_checked_at: String,
  paid_at: String,
  load_area: String,
  mill_name: String,
  empty_bags: Number,
  driver_mobile: String,
  photo_path: String,
  vehicle_type: String,
  reg_number: String,
  gratuity: { type: Number, default: 0 },
  machine_cost: { type: Number, default: 0 },
  machine_id: String,
  labour_group_id: String,
  weigh_scale_kgs: String,
  settled_at: String,
  trader_id: { type: String },
  pre_load_scale: { type: Number, default: 0 },
  post_load_scale: { type: Number, default: 0 }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  role: { type: String, required: true },
  commission_rate: { type: Number, default: 0 },
  trader_id: { type: String },
  image: String
});

const CommissionRateSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  bag_rate: { type: Number, default: 0 },
  machine_hour_rate: { type: Number, default: 0 },
  labour_rate: { type: Number, default: 0 }
});

const MillSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: String,
  contact_person: String,
  phone: String,
  email: String,
  registration_date: { type: String, required: true },
  trader_id: { type: String }
});

const LabourGroupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: String,
  contact_number: String,
  registration_date: { type: String, required: true },
  trader_id: { type: String }
});

const LabourMemberSchema = new mongoose.Schema({
  group_id: { type: String, required: true },
  name: { type: String, required: true },
  mobile: String,
  role: String
});

const OperatorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  address: String,
  experience: String,
  status: { type: String, default: 'ACTIVE' },
  registration_date: { type: String, required: true },
  trader_id: { type: String }
});

const PaddyMarketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  paddy_type: { type: String, required: true },
  price_per_quintal: { type: Number, required: true },
  description: String,
  date: { type: String, required: true },
  trader_id: { type: String }
});

const SiloSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  variety: String,
  bags: { type: Number, default: 0 },
  remaining_tons: { type: Number, default: 0 },
  capacity_tons: { type: Number, default: 0 },
  trader_id: { type: String }
});

const SettlementStatusSchema = new mongoose.Schema({
  entity_id: { type: String, required: true }, // farmerName, machine_id, or mill_id
  entity_type: { type: String, required: true }, // 'farmer', 'machine', 'mill'
  year: { type: String, required: true },
  is_settled: { type: Boolean, default: true },
  settled_at: { type: String, required: true }
});

SettlementStatusSchema.index({ entity_id: 1, year: 1, entity_type: 1 }, { unique: true });

// Farmer Advance Schema
const FarmerAdvanceSchema = new mongoose.Schema({
  farmer_name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  description: String,
  lotId: String,
  trader_id: { type: String }
});

// Lot Rates Schema
const LotRateSchema = new mongoose.Schema({
  lotId: { type: String, required: true, unique: true },
  rate: { type: Number, required: true }
});

// MODELS
export const Machine = mongoose.model('Machine', MachineSchema);
export const MachineLog = mongoose.model('MachineLog', MachineLogSchema);
export const Batch = mongoose.model('Batch', BatchSchema);
export const Lot = mongoose.model('Lot', LotSchema);
export const User = mongoose.model('User', UserSchema);
export const CommissionRate = mongoose.model('CommissionRate', CommissionRateSchema);
export const Mill = mongoose.model('Mill', MillSchema);
export const LabourGroup = mongoose.model('LabourGroup', LabourGroupSchema);
export const LabourMember = mongoose.model('LabourMember', LabourMemberSchema);
export const Operator = mongoose.model('Operator', OperatorSchema);
export const PaddyMarket = mongoose.model('PaddyMarket', PaddyMarketSchema);
export const Silo = mongoose.model('Silo', SiloSchema);
export const SettlementStatus = mongoose.model('SettlementStatus', SettlementStatusSchema);
export const FarmerAdvance = mongoose.model('FarmerAdvance', FarmerAdvanceSchema);
export const LotRate = mongoose.model('LotRate', LotRateSchema);

const db = {
  prepare: (query: string) => {
    // This is a dummy helper for transition.
    console.warn("SQL Query used in MongoDB environment:", query);
    return {
      run: () => { throw new Error("SQL run() not supported in MongoDB. Update this route."); },
      all: () => { throw new Error("SQL all() not supported in MongoDB. Update this route."); },
      get: () => { throw new Error("SQL get() not supported in MongoDB. Update this route."); }
    };
  },
  exec: (query: string) => {
    console.warn("SQL Exec used in MongoDB environment:", query);
  }
};

export default db;
